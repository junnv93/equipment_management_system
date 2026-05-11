# 스프린트 계약: ultrareview-shield-wrapper

## 생성 시점
2026-05-11T00:00:00+09:00

## 배경
`scripts/ultrareview-preflight.mjs` 검사 1/3가 working tree에 존재하는 실사용 `.env` 파일들(`apps/frontend/.env.local`, `apps/backend/.env`, `.env.test`)을 차단한다. 가이드 문서(`docs/references/ultrareview-usage.md` Sim-D)는 `rm` 후 재실행을 권장하지만 dev/test 환경이 즉시 파괴되고 매 호출마다 휴먼에러 위험(JWT_SECRET 분실 → 재발급)이 발생한다. shield 래퍼로 자동 격리 + trap 복원 패턴을 신설해 워크플로 무결성을 보존한다.

## 작업 범위
- Mode 1 (5 files, 단일 도메인 = tooling/security 인프라)
- 신규 1 + 수정 4
- 코드 영향 0 (production code 미변경), tooling 한정

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### M-1: SSOT 단방향 wire (DANGEROUS_PATTERNS 노출)
- [ ] `scripts/ultrareview-preflight.mjs`에 `--list-patterns` 플래그 추가 — JSON 배열로 `DANGEROUS_PATTERNS` 출력 후 즉시 `process.exit(0)`
- [ ] 출력 형식: `[{"pattern":"...","reason":"...","glob":bool}, ...]` (현재 인메모리 객체 구조 그대로)
- [ ] 검증 grep:
  - `grep -c "'--list-patterns'" scripts/ultrareview-preflight.mjs` ≥ 1
  - `grep -c "JSON.stringify(DANGEROUS_PATTERNS" scripts/ultrareview-preflight.mjs` ≥ 1
- [ ] 실행 검증: `node scripts/ultrareview-preflight.mjs --list-patterns | head -c 1` == `[`
- [ ] 실행 검증: `node scripts/ultrareview-preflight.mjs --list-patterns | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))'` 성공 (exit 0)

#### M-2: shield 스크립트 신규 생성
- [ ] `scripts/ultrareview-shield.sh` 신규 — bash 5+ 호환, 최상단 `#!/usr/bin/env bash` + `set -euo pipefail`
- [ ] 검증 grep:
  - `head -1 scripts/ultrareview-shield.sh | grep -c "#!/usr/bin/env bash"` == 1
  - `grep -c "set -euo pipefail" scripts/ultrareview-shield.sh` ≥ 1
- [ ] 실행 권한 0755: `test -x scripts/ultrareview-shield.sh`
- [ ] `bash -n scripts/ultrareview-shield.sh` 문법 에러 0
- [ ] `shellcheck scripts/ultrareview-shield.sh` 에러 0 (warning은 SHOULD)

#### M-3: shield 패턴 SSOT 단방향 수신 (인라인 재정의 금지)
- [ ] shield 스크립트는 자체 `.env` 패턴 인라인 정의 금지 — preflight `--list-patterns`를 호출해서 받아야 함
- [ ] 검증 grep (인라인 금지):
  - `grep -cE "\.env\.local|apps/backend/\.env|\.env\.test|\.sops\.decrypted" scripts/ultrareview-shield.sh` == 0
- [ ] 검증 grep (preflight 호출 존재 — **분리 카운트 AND**: 변수화/리터럴 둘 다 인정):
  - **AND-1** (preflight 파일명 언급) `grep -cE "ultrareview-preflight\.mjs" scripts/ultrareview-shield.sh` ≥ 2 (`$PREFLIGHT` 변수 정의 1회 + 주석/JSDoc 1회 이상)
  - **AND-2** (--list-patterns 플래그 사용) `grep -c -- "--list-patterns" scripts/ultrareview-shield.sh` ≥ 1
  - **OR-fallback** (변수 미사용 시 직접 호출 인정): `grep -c "ultrareview-preflight.mjs --list-patterns" scripts/ultrareview-shield.sh` ≥ 1
- [ ] **근거**: shield는 `PREFLIGHT="${ROOT}/scripts/ultrareview-preflight.mjs"` 변수화(repo root 외부에서 호출해도 동작 + shellcheck SC2086 회피)를 사용한다. 단일라인 `A.*B` 리터럴 grep은 변수 확장된 토큰을 매칭 못 함 — 분리 카운트가 SSOT 단방향 wire를 정확히 입증한다. memory: "Prettier 멀티라인과 grep 안티패턴" + "contract grep 작성 시 scope 5원칙".

#### M-4: trap 안전 복원
- [ ] `trap 'restore_files' EXIT` 설정 (EXIT 단일 트랩이 정상/SIGINT/SIGTERM/SIGHUP 모두 발화)
- [ ] 복원 함수가 idempotent — 격리 디렉토리가 비어있으면 no-op
- [ ] 검증 grep:
  - `grep -cE "^trap[[:space:]]" scripts/ultrareview-shield.sh` ≥ 1
  - `grep -c "EXIT" scripts/ultrareview-shield.sh` ≥ 1
- [ ] 복원 함수 정의 존재:
  - `grep -cE "^(function )?restore" scripts/ultrareview-shield.sh` ≥ 1

#### M-5: 격리 위치는 /tmp (working tree 외부)
- [ ] `mktemp -d` 사용으로 자동 충돌 방지
- [ ] working tree(.git 포함) 안 디렉토리 사용 금지 — ultrareview 번들 위험
- [ ] 검증 grep:
  - `grep -c "mktemp -d" scripts/ultrareview-shield.sh` ≥ 1
  - `grep -cE 'ur-shield.*\.git|\.git/ur-shield' scripts/ultrareview-shield.sh` == 0

#### M-6: exec 패스스루 (자식 프로세스 종료 코드 보존)
- [ ] shield는 인자로 받은 명령을 자식으로 실행 후 종료 코드 그대로 반환
- [ ] 인자 0개일 때는 usage 표시 + exit 1
- [ ] 검증 grep:
  - `grep -cE '\$@|"\$@"' scripts/ultrareview-shield.sh` ≥ 1
  - `grep -c "Usage:" scripts/ultrareview-shield.sh` ≥ 1

#### M-7: package.json script "ur:shield" 등록
- [ ] root `package.json` `scripts`에 `"ur:shield"` 키 추가
- [ ] 값은 `bash scripts/ultrareview-shield.sh` 로 시작 (직접 호출, npx 우회)
- [ ] 검증 grep:
  - `grep -c '"ur:shield"' package.json` ≥ 1
  - `grep -c 'scripts/ultrareview-shield.sh' package.json` ≥ 1

#### M-8: 시뮬레이션 — shield 적용 후 preflight 검사 1/3 (위험 파일) 통과
**책임 분리**: shield wrapper의 책임은 "dev env 워크플로 보존을 위한 격리/복원". 즉 preflight **검사 1/3**(위험 파일 working tree 존재)만 통과시킨다. **검사 2/3(gitleaks)와 검사 3/3(commit history)는 shield 범위 외** — `.env` 외 다른 secret 출처는 별도 sprint(`.gitleaks.toml` allowlist 보강)에서 처리한다.
- [ ] `bash scripts/ultrareview-shield.sh node scripts/ultrareview-preflight.mjs` 실행 시 stderr에 "🛡  격리 완료" 출력 + 검사 1/3에 "✅ 통과" 출력
- [ ] 실행 후 working tree에 격리된 .env 파일들 모두 원래 위치 복원됨 (trap EXIT 발화)
- [ ] 검증 명령:
  - `out=$(bash scripts/ultrareview-shield.sh node scripts/ultrareview-preflight.mjs 2>&1); echo "$out" | grep -q "검사 1/3 통과"`
  - `test -f apps/frontend/.env.local && test -f apps/backend/.env && test -f .env.test`
  - `find /tmp -maxdepth 1 -name 'ur-shield-*' -type d | wc -l` ≤ 1 (lockfile 외 잔존 0)
- [ ] **검사 2/3 처리**: gitleaks FAIL이 shield 책임 외임을 evaluation report에 명시하고 tech-debt로 분리 등록

#### M-9: 문서 갱신 — usage.md
- [ ] `docs/references/ultrareview-usage.md` "Pre-upload Secret Gate" 섹션에 shield 사용 안내 추가
- [ ] 가이드 `rm` 권장 텍스트는 유지하되 "단, dev 워크플로 보존이 필요하면 shield wrapper 사용" 한 줄 추가
- [ ] "전체 실행 흐름" 코드블록의 "2. Pre-upload secret gate" 단계에 shield wrapper 1줄 옵션 추가
- [ ] 검증 grep:
  - `grep -c "ultrareview-shield\|ur:shield" docs/references/ultrareview-usage.md` ≥ 2

#### M-10: 문서 갱신 — UR-1 example-prompt
- [ ] `.claude/skills/harness/references/example-prompts.md` UR-1 단계 3에 shield 안내 추가
- [ ] 단계 3 분기 "exit 1" 케이스에 "dev env 차단 시 `pnpm ur:shield node scripts/ultrareview-preflight.mjs`로 재검증" 한 줄 추가
- [ ] 검증 grep:
  - `grep -c "ur:shield\|ultrareview-shield" .claude/skills/harness/references/example-prompts.md` ≥ 1

#### M-11: 기존 회귀 0건
- [ ] `pnpm tsc --noEmit` (backend) 에러 0 — tooling 변경이라 영향 없어야 함
- [ ] `pnpm tsc --noEmit` (frontend) 에러 0
- [ ] `pnpm self-audit` 통과 (pre-commit hook과 동일)
- [ ] `node scripts/ultrareview-preflight.mjs --list-patterns` 정상 (M-1 후속 회귀 차단)
- [ ] 기존 preflight 동작 보존: `node scripts/ultrareview-preflight.mjs` (no flag) → 이전과 동일하게 검사 1/2/3 실행

#### M-12: 옛날 API 회피 (현행 컨벤션 준수)
- [ ] bash 스크립트 — `[[ ]]` 대신 `[ ]` 강제 없음, modern bash 5+ 가능 (engines/bash 명시 없음)
- [ ] `mkdir -p` `mv -f` 등 표준 옵션 사용 (GNU 전용 옵션 회피)
- [ ] preflight.mjs는 ESM (`import`)로 작성됨 — `--list-patterns` 추가 시 `process.argv.includes` 패턴 유지

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록

#### S-1: shellcheck warning 0
- [ ] `shellcheck scripts/ultrareview-shield.sh` warning 0 (info는 무시 가능)

#### S-2: SIGKILL 한계 명시 주석
- [ ] shield 스크립트 상단 주석에 "kill -9는 trap 우회 — 다음 실행 시 /tmp/ur-shield-* 정리 권장" 안내

#### S-3: dry-run 모드
- [ ] `--dry-run` 또는 `-n` 플래그로 실제 mv 없이 격리 대상만 출력 (tech-debt 가능, MUST 아님)

#### S-4: lockfile 충돌 방지
- [ ] 동시 두 세션 실행 방지를 위해 `flock` 또는 `mkdir` 기반 lock — tech-debt 가능

#### S-5: review-architecture
- [ ] tooling 변경이라 architecture 영향 미미. critical 0개 확인 정도

---

### 적용 verify 스킬
- **verify-hardcoding**: shield 안에 `.env` 패턴 인라인 0 (M-3과 중복 검증)
- **verify-ssot**: preflight `--list-patterns`가 SSOT 단방향 wire인지

(이번 작업은 production code 변경이 없으므로 도메인별 verify-* 대부분 비적용)

---

## 종료 조건
- 모든 MUST PASS → Step 7 (문서 갱신 + 아카이브 이동)
- 동일 이슈 2회 연속 FAIL → 설계 결함, 수동 개입
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 tech-debt-tracker.md 기록만, 루프 차단 없음

---

## contract grep 패턴 규칙 준수
- 단일라인 `A.*B` 패턴 사용 금지
- 각 토큰별 `grep -c` 카운트 + AND 결합
- JSON/객체 키 검증은 키별 독립 카운트

---

## 의사결정 로그
- **격리 위치 `/tmp` vs `.git/`**: `.git/objects/`가 ultrareview 번들에 포함될 수 있어 `.git/` 하위 사용 금지. `/tmp/`는 `--source .` 명시적 외부.
- **trap 단일 EXIT**: EXIT는 정상 종료 + 모든 시그널(INT/TERM/HUP)에서 발화. 멀티 트랩 대신 EXIT 단일이 표준.
- **SSOT 노출 방식**: `--list-patterns` JSON 플래그 = preflight가 SSOT 유지하면서 단방향 노출. JSON 파일 분리는 over-engineering.
- **bash vs node**: shield는 mv + trap이 핵심이라 bash가 자연스러움. 기존 프로젝트 스크립트도 `.sh`(bash) + `.mjs`(node) 둘 다 사용.
