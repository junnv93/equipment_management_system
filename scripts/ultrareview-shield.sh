#!/usr/bin/env bash
# scripts/ultrareview-shield.sh — ultrareview 업로드 전 dev env 자동 격리/복원 wrapper
#
# 목적:
#   ultrareview-preflight.mjs 검사 1/3가 working tree의 실사용 dev env(.env*)를 차단할 때,
#   해당 파일을 /tmp/ur-shield-XXX/ 로 안전 격리 후 사용자 명령을 실행하고,
#   종료(정상/SIGINT/SIGTERM/SIGHUP) 시 trap EXIT으로 자동 복원한다.
#
# 사용법:
#   bash scripts/ultrareview-shield.sh <command> [args...]
#   pnpm ur:shield -- <command> [args...]
#
# 단축 alias:
#   pnpm ur:preflight    # ur:shield + preflight 3 gate 검증 (가장 자주 사용)
#   pnpm ur:selftest     # shield 회귀 자체 검증 (실 working tree 영향 0)
#
# 예시:
#   bash scripts/ultrareview-shield.sh node scripts/ultrareview-preflight.mjs
#   pnpm ur:shield -- node scripts/ultrareview-preflight.mjs
#   pnpm ur:selftest                                  # /tmp fake fixture 만으로 자체 회귀 검증
#
# `--self-test` 동작 (실 working tree 손대지 않음):
#   1. mktemp /tmp/ur-shield-selftest-XXX/ 격리 fixture 생성
#   2. preflight `--list-patterns` SSOT 단방향으로 fake .env*/*.age 등 파일 생성
#   3. fixture cwd 로 inner shield 호출 (SHIELD_LOCK + SHIELD_PREFLIGHT env 격리)
#   4. inner shield 의 격리 → /bin/true 실행 → 자동 복원 trap 검증
#   5. 모든 fake 파일이 동일 SHA256 hash 로 복원됐는지 + /tmp/ur-shield-* 잔존 0 확인
#   6. fixture/lock cleanup 후 PASS/FAIL 보고
#
# SSOT:
#   차단 패턴은 scripts/ultrareview-preflight.mjs의 DANGEROUS_PATTERNS가 단일 SSOT.
#   shield는 `--list-patterns` JSON 출력을 단방향 소비한다 (인라인 재정의 금지).
#
# Env override (spec/self-test 용 — 일반 사용자는 설정 불필요):
#   SHIELD_PREFLIGHT  격리 패턴 SSOT 경로 (default: ${ROOT}/scripts/ultrareview-preflight.mjs)
#   SHIELD_LOCK       동시 실행 방지 lockfile 경로 (default: /tmp/ur-shield.lock)
#
# 한계:
#   - kill -9 (SIGKILL) 시 trap 우회 — 다음 실행 전 /tmp/ur-shield-* 잔존물 정리 권장
#
# 관련: docs/references/ultrareview-usage.md (Pre-upload Secret Gate 섹션)

set -euo pipefail

ROOT="$(pwd)"
SCRIPT_PATH="$(readlink -f "$0")"
PREFLIGHT="${SHIELD_PREFLIGHT:-${ROOT}/scripts/ultrareview-preflight.mjs}"

# ─── --self-test 모드 (실 working tree 영향 0) ────────────────────────────
# 사용자 명령 실행 분기로 진입하지 않고, /tmp/ur-shield-selftest-XXX/ 에 fake
# fixture 를 만들어 inner shield 호출 + 격리/복원 hash invariant + /tmp 잔존물 0
# 을 자체 검증한다. SSOT 단방향(preflight --list-patterns)으로 fake 파일 derive.
# lockfile 분기 전이라 메인 lock 과 경쟁하지 않으며, 자체 SHIELD_LOCK 으로
# inner 호출만 single-flight 보호된다.
if [ "${1:-}" = "--self-test" ]; then
  if [ ! -f "$PREFLIGHT" ]; then
    printf '❌ self-test: %s not found (repository root에서 실행해야 합니다)\n' "$PREFLIGHT" >&2
    exit 1
  fi

  SELFTEST_FIXTURE="$(mktemp -d -t ur-shield-selftest-XXXXXX)"
  SELFTEST_LOCK="$(mktemp -u -t ur-shield-selftest-lock-XXXXXX.lock)"
  printf '🧪 self-test: fixture=%s\n' "$SELFTEST_FIXTURE" >&2

  selftest_cleanup() {
    local exit_code=$?
    trap - EXIT
    rm -rf "$SELFTEST_FIXTURE" 2>/dev/null
    rm -f "$SELFTEST_LOCK" 2>/dev/null
    exit "$exit_code"
  }
  trap selftest_cleanup EXIT

  # 1. SSOT 단방향: --list-patterns 출력에서 fake 파일 enumerate
  # glob 패턴은 'selftest-glob<suffix>' 단일 fake 1개로 (find suffix match 검증 충분)
  FAKE_FILES_TSV="$(
    node "$PREFLIGHT" --list-patterns \
      | node -e '
        let buf = "";
        process.stdin.on("data", (d) => { buf += d; });
        process.stdin.on("end", () => {
          const arr = JSON.parse(buf);
          for (const e of arr) {
            if (e.glob) {
              const suffix = e.pattern.startsWith(".") ? e.pattern : "." + e.pattern;
              process.stdout.write("glob\tselftest-glob" + suffix + "\n");
            } else {
              process.stdout.write("file\t" + e.pattern + "\n");
            }
          }
        });
      '
  )"

  # 2. fake 파일 fixture에 생성 + 초기 SHA256 hash 기록 (parallel indexed arrays — bash 3+ 호환)
  declare -a FAKE_RELS=()
  declare -a FAKE_HASHES=()
  while IFS=$'\t' read -r kind rel; do
    [ -z "$rel" ] && continue
    target="${SELFTEST_FIXTURE}/${rel}"
    mkdir -p "$(dirname "$target")"
    # 의도적 fake content — 실 secret 아님 명시
    printf 'SELFTEST_FIXTURE_FAKE_CONTENT=%s\n' "$rel" > "$target"
    FAKE_RELS+=("$rel")
    FAKE_HASHES+=("$(sha256sum "$target" | awk '{print $1}')")
  done <<< "$FAKE_FILES_TSV"

  printf '🧪 self-test: %d개 fake 파일 생성\n' "${#FAKE_RELS[@]}" >&2

  # 3. /tmp/ur-shield-* 사전 스냅샷 (잔존물 검증용)
  PRE_TMP_DIRS="$(find /tmp -maxdepth 1 -type d -name 'ur-shield-*' 2>/dev/null | sort)"

  # 4. inner shield 호출 — fixture에서 /bin/true 실행하여 격리+복원 검증
  set +e
  (
    cd "$SELFTEST_FIXTURE"
    SHIELD_LOCK="$SELFTEST_LOCK" \
    SHIELD_PREFLIGHT="$PREFLIGHT" \
      bash "$SCRIPT_PATH" /bin/true
  )
  inner_exit=$?
  set -e

  if [ "$inner_exit" -ne 0 ]; then
    printf '❌ ultrareview-shield self-test FAIL: inner shield exit=%d (/bin/true 인데 실패)\n' "$inner_exit" >&2
    exit 1
  fi

  # 5. 복원 검증 — 모든 fake 파일이 동일 hash로 복원됐는가?
  fail_count=0
  for i in "${!FAKE_RELS[@]}"; do
    rel="${FAKE_RELS[$i]}"
    expected="${FAKE_HASHES[$i]}"
    target="${SELFTEST_FIXTURE}/${rel}"
    if [ ! -e "$target" ]; then
      printf '❌ self-test FAIL: %s 복원 안 됨 (파일 부재)\n' "$rel" >&2
      fail_count=$((fail_count + 1))
    else
      actual="$(sha256sum "$target" | awk '{print $1}')"
      if [ "$actual" != "$expected" ]; then
        printf '❌ self-test FAIL: %s hash 불일치 (격리 중 변조)\n' "$rel" >&2
        fail_count=$((fail_count + 1))
      fi
    fi
  done

  # 6. /tmp/ur-shield-* 잔존물 검증 (inner 호출 전후 diff)
  POST_TMP_DIRS="$(find /tmp -maxdepth 1 -type d -name 'ur-shield-*' 2>/dev/null | sort)"
  NEW_DIRS="$(comm -13 <(printf '%s\n' "$PRE_TMP_DIRS") <(printf '%s\n' "$POST_TMP_DIRS"))"
  if [ -n "$NEW_DIRS" ]; then
    printf '❌ self-test FAIL: /tmp/ur-shield-* 잔존물 발견 (inner 가 cleanup 미수행):\n' >&2
    printf '%s\n' "$NEW_DIRS" >&2
    fail_count=$((fail_count + 1))
  fi

  if [ "$fail_count" -gt 0 ]; then
    printf '❌ ultrareview-shield self-test FAIL: %d issue\n' "$fail_count" >&2
    exit 1
  fi

  printf '✅ ultrareview-shield self-test PASS (%d files isolate→restore, /tmp 잔존 0)\n' "${#FAKE_RELS[@]}" >&2
  exit 0
fi

# ─── 동시 실행 방지 lockfile ──────────────────────────────────────────────
# 두 세션이 동시에 격리하면 두 번째 호출이 첫 번째의 격리본을 못 봐서
# "격리 대상 없음"으로 진행하고, 첫 번째 trap이 미발화 시 .env가 /tmp에 좌초.
# flock(1)으로 race-free 단일 실행 보장.
LOCK_FILE="${SHIELD_LOCK:-/tmp/ur-shield.lock}"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf '❌ 다른 ultrareview-shield 인스턴스가 실행 중입니다 (%s)\n' "$LOCK_FILE" >&2
  printf '   동시 실행은 .env 격리/복원 충돌을 일으킬 수 있어 차단됩니다.\n' >&2
  printf '   이전 실행이 SIGKILL 등으로 비정상 종료됐다면: rm %s 후 재시도\n' "$LOCK_FILE" >&2
  exit 1
fi

# ─── SIGKILL 잔존물 best-effort GC ──────────────────────────────────────────
# flock 획득 완료 = 다른 shield 비실행 보장. 1시간 이상 경과한 ur-shield-* 디렉토리는
# SIGKILL(-9) 비정상 종료로 trap EXIT이 우회된 잔존물일 가능성이 높다.
# selftest(--self-test), spec(test runner) fixture 는 prefix 제외.
# 주의: 격리된 파일이 내부에 있더라도 1시간 경과 후엔 개발자가 이미 복구했다고 가정 — rm -rf.
stale_gc() {
  local d
  while IFS= read -r d; do
    [ -z "$d" ] && continue
    printf '⚠  [shield GC] SIGKILL 잔존물 (1h+ 경과) → 삭제: %s\n' "$d" >&2
    rm -rf "$d" 2>/dev/null || true
  done < <(
    find /tmp -maxdepth 1 -mindepth 1 -type d \
      -name 'ur-shield-*' \
      -not -name 'ur-shield-selftest-*' \
      -not -name 'ur-shield-spec-*' \
      -mmin +60 2>/dev/null
  )
}
stale_gc

# ─── POSIX 인자 구분자 처리 ───────────────────────────────────────────────
# `pnpm ur:shield -- node ...` 같은 호출에서 pnpm이 `--` 를 strip 하지 않으므로
# shield 자체가 첫 `--` 를 무시한다 (POSIX 컨벤션: grep/cat/getopt 등과 동일).
if [ "${1:-}" = "--" ]; then
  shift
fi

# ─── Usage ────────────────────────────────────────────────────────────────
if [ "$#" -eq 0 ]; then
  cat <<'EOF' >&2
Usage: bash scripts/ultrareview-shield.sh <command> [args...]
       pnpm ur:shield -- <command> [args...]

ultrareview-preflight.mjs 가 차단하는 dev env 파일들을 /tmp/ 로 격리한 후
명령을 실행하고, 종료 시 trap EXIT으로 자동 복원합니다.

예시:
  bash scripts/ultrareview-shield.sh node scripts/ultrareview-preflight.mjs
  pnpm ur:shield -- node scripts/ultrareview-preflight.mjs
EOF
  exit 1
fi

if [ ! -f "$PREFLIGHT" ]; then
  printf '❌ %s not found — repository root에서 실행해야 합니다.\n' "$PREFLIGHT" >&2
  exit 1
fi

# ─── 격리 디렉토리 ─────────────────────────────────────────────────────────
# /tmp/ 아래 mktemp -d 로 충돌 방지. working tree(.git 포함) 외부 위치.
SHIELD_DIR="$(mktemp -d -t ur-shield-XXXXXX)"

# ─── SHIELDED 배열 (복원 대상 — 격리 성공한 파일만 기록) ───────────────────
declare -a SHIELDED=()

# ─── 패턴 SSOT 단방향 수신 ──────────────────────────────────────────────────
# preflight --list-patterns 출력(JSON)을 파싱하여 '<kind>\t<pattern>' 라인 출력
# kind: file | glob (preflight DANGEROUS_PATTERNS 객체의 glob 속성)
get_patterns() {
  node "$PREFLIGHT" --list-patterns \
    | node -e '
      let buf = "";
      process.stdin.on("data", (d) => { buf += d; });
      process.stdin.on("end", () => {
        const arr = JSON.parse(buf);
        for (const e of arr) {
          const kind = e.glob ? "glob" : "file";
          process.stdout.write(kind + "\t" + e.pattern + "\n");
        }
      });
    '
}

# ─── 격리 대상 enumerate ──────────────────────────────────────────────────
# stdin: get_patterns 출력
# stdout: 격리할 working-tree-relative 파일 경로 (1줄에 1개)
collect_targets() {
  local kind pattern suffix
  while IFS=$'\t' read -r kind pattern; do
    if [ "$kind" = "file" ]; then
      # 정확 경로 일치
      if [ -e "${ROOT}/${pattern}" ]; then
        printf '%s\n' "$pattern"
      fi
    elif [ "$kind" = "glob" ]; then
      # preflight findGlobFiles와 동일 로직: entry.endsWith(suffix)
      # pattern이 '.'으로 시작하면 그대로, 아니면 '.pattern'
      if [ "${pattern:0:1}" = "." ]; then
        suffix="$pattern"
      else
        suffix=".${pattern}"
      fi
      # node_modules / .git / dist 제외 (preflight findGlobFiles와 동일)
      find "$ROOT" \
        \( -name node_modules -o -name .git -o -name dist \) -prune -o \
        -type f -name "*${suffix}" -print 2>/dev/null \
        | sed "s|^${ROOT}/||"
    fi
  done
}

# ─── 격리 ─────────────────────────────────────────────────────────────────
# 단일 파일 격리. 호출자가 SHIELDED 배열을 부모 셸에서 직접 갱신.
# (파이프라인 마지막 단계는 서브셸이라 SHIELDED가 부모로 전파되지 않음 — process substitution 필수)
shield_one() {
  local rel="$1"
  local src="${ROOT}/${rel}"
  local dst="${SHIELD_DIR}/${rel}"
  mkdir -p "$(dirname "$dst")"
  mv "$src" "$dst"
  printf '🛡  격리: %s → %s/%s\n' "$rel" "$SHIELD_DIR" "$rel" >&2
}

# ─── 복원 (trap EXIT) ─────────────────────────────────────────────────────
# bash trap EXIT은 정상 종료 + SIGINT/SIGTERM/SIGHUP 모두 발화한다.
# (SIGKILL은 OS 강제 — trap 우회. 잔존물은 다음 실행 시 사용자 책임.)
restore_files() {
  local exit_code=$?
  # 재진입 방지: trap 안에서 발생하는 후속 EXIT 신호 차단
  trap - EXIT
  # 복원 중 부분 실패에도 가능한 모든 파일 복원 진행
  set +e

  local rel src dst
  if [ "${#SHIELDED[@]}" -gt 0 ]; then
    for rel in "${SHIELDED[@]}"; do
      src="${SHIELD_DIR}/${rel}"
      dst="${ROOT}/${rel}"
      if [ -e "$src" ]; then
        mkdir -p "$(dirname "$dst")"
        mv "$src" "$dst"
        printf '✅ 복원: %s\n' "$rel" >&2
      fi
    done
  fi

  # 격리 디렉토리 정리 (빈 서브디렉토리 → 루트)
  find "$SHIELD_DIR" -type d -empty -delete 2>/dev/null
  rmdir "$SHIELD_DIR" 2>/dev/null

  exit "$exit_code"
}

trap restore_files EXIT

# ─── 메인 흐름 ────────────────────────────────────────────────────────────
printf '🛡  ultrareview-shield: 격리 디렉토리 = %s\n' "$SHIELD_DIR" >&2

# Process substitution으로 부모 셸에서 read → SHIELDED 배열에 직접 push
# (`pipe | while` 패턴은 서브셸이라 배열 전파 불가 — bash 한정 함정)
while IFS= read -r rel; do
  [ -z "$rel" ] && continue
  shield_one "$rel"
  SHIELDED+=("$rel")
done < <(get_patterns | collect_targets)

if [ "${#SHIELDED[@]}" -eq 0 ]; then
  printf '🛡  격리 대상 없음 — 그대로 명령 실행\n' >&2
else
  printf '🛡  %d개 파일 격리 완료\n' "${#SHIELDED[@]}" >&2
fi

printf '▶  실행: %s\n' "$*" >&2
# exec 금지: exec는 현재 셸을 교체하여 trap EXIT 우회. 자식 프로세스로 실행 + 종료 코드 보존.
"$@"
# 자식 종료 코드를 그대로 전파 (trap EXIT이 자동으로 받음)
