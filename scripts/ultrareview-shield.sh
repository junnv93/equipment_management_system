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
# 예시:
#   bash scripts/ultrareview-shield.sh node scripts/ultrareview-preflight.mjs
#   pnpm ur:shield -- node scripts/ultrareview-preflight.mjs
#
# SSOT:
#   차단 패턴은 scripts/ultrareview-preflight.mjs의 DANGEROUS_PATTERNS가 단일 SSOT.
#   shield는 `--list-patterns` JSON 출력을 단방향 소비한다 (인라인 재정의 금지).
#
# 한계:
#   - kill -9 (SIGKILL) 시 trap 우회 — 다음 실행 전 /tmp/ur-shield-* 잔존물 정리 권장
#   - 동시 두 세션 실행 시 lockfile 보호 없음 (tech-debt)
#
# 관련: docs/references/ultrareview-usage.md (Pre-upload Secret Gate 섹션)

set -euo pipefail

ROOT="$(pwd)"
PREFLIGHT="${ROOT}/scripts/ultrareview-preflight.mjs"

# ─── 동시 실행 방지 lockfile ──────────────────────────────────────────────
# 두 세션이 동시에 격리하면 두 번째 호출이 첫 번째의 격리본을 못 봐서
# "격리 대상 없음"으로 진행하고, 첫 번째 trap이 미발화 시 .env가 /tmp에 좌초.
# flock(1)으로 race-free 단일 실행 보장.
LOCK_FILE="/tmp/ur-shield.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  printf '❌ 다른 ultrareview-shield 인스턴스가 실행 중입니다 (%s)\n' "$LOCK_FILE" >&2
  printf '   동시 실행은 .env 격리/복원 충돌을 일으킬 수 있어 차단됩니다.\n' >&2
  printf '   이전 실행이 SIGKILL 등으로 비정상 종료됐다면: rm %s 후 재시도\n' "$LOCK_FILE" >&2
  exit 1
fi

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
