# commit-pipeline-safety SHOULD 후속 4건 closure 계획

## 메타

- 생성: 2026-05-06T15:00:00+09:00
- 모드: Mode 2 (harness 3-agent 루프)
- 슬러그: `commit-pipeline-safety-should-followups`
- 예상 변경: 8개 파일 (수정 5 / 신규 3)
- 선행 sprint: 2026-05-06 commit-pipeline-safety (Mode 2 16/16 MUST PASS)
- 출처: `.claude/exec-plans/tech-debt-tracker.md` lines 113-118

## 설계 철학

commit pipeline (pre-commit + commit-msg + pre-push)을 단일 시스템으로 취급하여
SHOULD 4건 중 트리거 충족 3건(S-2/S-3/S-5)은 SSOT 기반으로 closure하고,
**트리거 미충족 1건(S-4)은 명시적 SKIP 으로 정직하게 종결**한다. 단편적 점수
달성이 아닌, 회귀 차단 invariant 격상이 목표다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| S-2 packages 도메인 검증 전략 | `PARITY_SPEC.packages` 추가 + glob coverage + critical-rule existence (script glob 비교 X) | packages는 lint script 부재 — 도메인별 비대칭 인정. SSOT 한 곳에서 변종 표현. |
| S-2 변종 인터페이스 | `lintCiScriptName: null` 허용 + 검증 로직 분기 | packages는 script gate가 없으므로 backend/frontend 동등 비교 강제 시 false-FAIL. |
| S-3 scope-enum SSOT 출처 | `commitlint.config.js` 내부 `SCOPE_LIST` const + module.exports.SCOPE_LIST | 단일 파일 SSOT. 별도 패키지 분리는 over-engineering — commitlint config는 build-time 비참여. |
| S-3 scope 화이트리스트 범위 | 24 backend modules + 16 meta scopes (총 ~40) | CLAUDE.md 기재 24 모듈을 SSOT로 채택, 메타는 git history grep + 최근 50 커밋 확인. |
| S-5 timing helper 위치 | `scripts/hook-timing.mjs` (Node) | shell 호환성(macOS/Linux) > bash-specific. opt-in env로 default overhead 0. |
| S-5 출력 채널 | stderr(JSON-line) + 옵션 `.husky/.timing-log.jsonl` (gitignored) | stdout는 lint-staged 출력과 충돌. log 파일은 별도 opt-in env. |
| S-4 처리 | **SKIP** + tracker entry 트리거 스냅샷 갱신 | 4 트리거 0/4 충족 — ADR-0008 신설은 over-engineering. |

## S-4 SKIP 정당화 (진행 불가 결정)

**S-4 git-worktree-per-session-adr 는 본 sprint에서 진행하지 않는다.**

ADR-0007 §Trigger Conditions (lines 125-134) 4개 조건 현재 상태:

| 트리거 | 임계값 | 2026-05-06 현재 | 충족 |
|--------|--------|----------------|------|
| multi-session race incident | ≥ 3 건/월 | 본 월 2 건 (lint-staged stash drift × 2) | ❌ |
| commit 흡수 사고 main 진입 | ≥ 1 건 (push 후 발견) | 0 건 (push 전 검증으로 차단) | ❌ |
| Claude Code 동시 세션 정기 | ≥ 3 개 | 통상 1-2 개 | ❌ |
| `verify-lint-ruleset-parity` fail | ≥ 1 회 | 0 회 (도입 후 회귀 0) | ❌ |

**결론:** 0/4 트리거 충족. ADR-0008 신설 시 운영 복잡도 증가(brand-new
worktree 동기화 모델, hook 격리 재설계) 대비 실익 0. 현 ADR-0007 hook 가드 +
memory feedback 정책으로 충분히 방어 중.

**처리:** tracker `S-4` 엔트리를 `[SKIP-trigger-not-met]` 상태로 갱신 +
4 트리거 현황 스냅샷 + ADR-0007 §Trigger Conditions 앵커 cross-reference.
ADR-0007 본문 수정 없음, ADR-0008 생성 없음.

## 구현 Phase

### Phase 1: S-2 packages-lintstaged-lint-parity

**목표:** `verify-lint-ruleset-parity.mjs`가 packages 도메인을 자동 검증하도록 SSOT 확장.

**변경 파일:**

1. `scripts/verify-lint-ruleset-parity.mjs` — 수정
   - `PARITY_SPEC.packages` 추가 (eslintConfig=`.eslintrc.js`,
     lintstagedGlobPrefix=`packages/`, lintCiScriptName=null,
     lintCiPackage=null, requiredLintstagedGlobSegments=[],
     criticalRulesMustExist=[`@typescript-eslint/no-explicit-any`,
     `@typescript-eslint/no-unused-vars`, `@typescript-eslint/ban-ts-comment`],
     criticalRestrictedNames=[], criticalRestrictedPaths=[])
   - `verifyDomainParity()` 분기: `lintCiScriptName === null` 일 때 step 3 (script glob 일치) skip
   - `main()`에서 default domains 배열에 `'packages'` 추가
   - `EMS_PARITY_DOMAINS` env 파싱 그대로 (3 도메인 모두 fixture 격리 가능)

2. `scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` — 수정
   - `describe('packages 도메인')` 블록 추가 (≥3 케이스)
   - 케이스 A: lintstaged `packages/**/*.ts` glob + root `.eslintrc.js` packages override 룰 정의 → PASS
   - 케이스 B: lintstaged 항목 누락 → FAIL with "lintstaged 에 packages/ glob 항목이 없음"
   - 케이스 C: root `.eslintrc.js`에서 `@typescript-eslint/no-explicit-any` 제거 → FAIL
   - fixture helper `makePackagesFixture()` 신규 (root `.eslintrc.js` mock + lintstaged + scripts/ 복사)

**검증:**
```bash
node --test scripts/__tests__/verify-lint-ruleset-parity.spec.mjs
EMS_PARITY_DOMAINS=packages pnpm verify:lint-ruleset-parity
pnpm verify:lint-ruleset-parity   # 기본 = backend+frontend+packages 3 도메인
```

### Phase 2: S-3 commitlint scope-enum + body 룰 강화

**목표:** scope 화이트리스트 SSOT 도입 + body/header 위생 룰 추가.

**변경 파일:**

3. `commitlint.config.js` — 수정
   - 파일 상단에 `const SCOPE_LIST = Object.freeze([...])` const 정의
     - 24 backend modules: `auth`, `audit`, `approvals`, `cables`,
       `calibration`, `calibration-factors`, `calibration-plans`,
       `checkouts`, `dashboard`, `data-migration`, `documents`, `equipment`,
       `equipment-imports`, `intermediate-inspections`, `monitoring`,
       `non-conformances`, `notifications`, `reports`, `self-inspections`,
       `settings`, `software-validations`, `teams`, `test-software`, `users`
     - 16 meta scopes: `deps`, `ci`, `hooks`, `e2e`, `i18n`, `design`,
       `docs`, `harness`, `skill`, `infra`, `secrets`, `db`, `ui`, `lint`,
       `commit-pipeline`, `layout`
   - `module.exports.SCOPE_LIST = SCOPE_LIST` (테스트 import 가능)
   - `rules`에 추가:
     - `scope-enum: [2, 'always', SCOPE_LIST]`
     - `body-max-line-length: [2, 'always', 100]`
     - `body-leading-blank: [1, 'always']` (warn — legacy commit 호환)
     - `footer-leading-blank: [1, 'always']` (warn)
     - `header-case: [2, 'always', 'lower-case']`
   - 각 새 룰에 한국어 인라인 주석 (왜 필요한지)

4. `scripts/__tests__/commitlint-config.spec.mjs` — 신규
   - `import { SCOPE_LIST } from '../../commitlint.config.js'`
   - 케이스: `assert(SCOPE_LIST.length >= 30)`
   - 케이스: `assert(SCOPE_LIST.includes('checkouts'))` 등 중요 모듈 존재 확인
   - 케이스: `npx commitlint --config commitlint.config.js` 으로 valid/invalid msg 검증
     - valid: `feat(checkouts): test message`
     - invalid: `feat(unknown_scope): test` → exit 1
     - invalid: `Feat(checkouts): test` (header case) → exit 1

**검증:**
```bash
node --test scripts/__tests__/commitlint-config.spec.mjs
echo "feat(checkouts): valid sample" | npx commitlint --config commitlint.config.js
echo "feat(unknown_scope): invalid" | npx commitlint --config commitlint.config.js && echo FAIL || echo OK
```

### Phase 3: S-5 hook-execution-time-metrics (opt-in)

**목표:** opt-in env 활성 시에만 hook step 별 elapsed 추적, 기본 overhead 0.

**변경 파일:**

5. `scripts/hook-timing.mjs` — 신규
   - CLI: `node scripts/hook-timing.mjs --label "lint-staged" -- <command...>`
   - 동작:
     - `EMS_HOOK_TIMING` 미설정 시 → 그대로 child_process.spawnSync 후 exit
     - `EMS_HOOK_TIMING=1` 시 → start = Date.now(), spawn, end = Date.now()
       → stderr 1줄 JSON: `{"step":"lint-staged","ms":N,"exit":code,"ts":"<iso>"}`
     - `EMS_HOOK_TIMING_LOG=1` 추가 시 → `.husky/.timing-log.jsonl` append
     - 자식 프로세스 stdio inherit (출력 보존)
   - exit code = 자식 exit code (투명 wrapper)

6. `.husky/pre-commit` — 수정
   - 6개 step을 `node scripts/hook-timing.mjs --label "<step>" -- <원래 명령>` 으로 래핑
   - `EMS_HOOK_TIMING` 미설정 시 wrapper는 단순 spawnSync 만 수행 → overhead < 5ms/step
   - 기존 `set -e` 동작 보존 (자식 exit code 그대로 전파 → husky가 차단)

7. `.husky/pre-push` — 수정
   - 동일 패턴 적용 (8개 step + ADR-0006 conditional)

8. `.gitignore` — 수정
   - `.husky/.timing-log.jsonl` 추가 (opt-in 로그 파일)

**검증:**
```bash
# overhead 0 검증 (env 미설정)
time pnpm precommit-staged-guard   # baseline
EMS_HOOK_TIMING=0 time pnpm precommit-staged-guard   # 동등
# opt-in 동작
EMS_HOOK_TIMING=1 git commit --allow-empty -m "test(hooks): timing dry"
# stderr에 JSON-line 출력 확인
EMS_HOOK_TIMING=1 EMS_HOOK_TIMING_LOG=1 git commit --allow-empty -m "test(hooks): timing log"
cat .husky/.timing-log.jsonl  # ≥ 1 줄
```

### Phase 4: S-4 SKIP 문서화

**목표:** tracker entry 갱신으로 SKIP 사유와 트리거 스냅샷을 명시적으로 기록.

**변경 파일:**

9. `.claude/exec-plans/tech-debt-tracker.md` — 수정 (line 117 영역)
   - S-4 entry를 `- [SKIP-trigger-not-met]` 으로 변경
   - 4 트리거 현황 스냅샷 인라인 (위 §S-4 SKIP 정당화 표 그대로)
   - ADR-0007 앵커 링크: `docs/adr/0007-multi-session-working-tree-safety.md#trigger-conditions-for-reconsideration`
   - "재검토 트리거: 위 4 조건 중 1개 이상 충족 시" 명시

**ADR-0007 본문은 수정하지 않는다** — Trigger Conditions §는 이미 SSOT 역할 수행 중.

### Phase 5: tech-debt-tracker closure

**목표:** 4 entry 상태 일괄 갱신.

**변경 파일:** (Phase 4와 동일 파일에서 일괄 처리)

- S-2 → `[x]` + 완료 일자 (2026-05-06) + commit reference TODO
- S-3 → `[x]` + 완료 일자
- S-4 → `[SKIP-trigger-not-met]` + 트리거 스냅샷 (Phase 4 처리)
- S-5 → `[x]` + 완료 일자 + opt-in 사용법 1줄

## 전체 변경 파일 요약

### 신규 생성

| 파일 | 목적 |
|------|------|
| `scripts/hook-timing.mjs` | opt-in hook 실행 시간 wrapper (Node, OS 호환) |
| `scripts/__tests__/commitlint-config.spec.mjs` | SCOPE_LIST + commitlint rule 회귀 spec |

### 수정

| 파일 | 변경 의도 |
|------|----------|
| `scripts/verify-lint-ruleset-parity.mjs` | PARITY_SPEC.packages 추가 + null lintCiScriptName 분기 |
| `scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` | packages 도메인 ≥3 케이스 추가 |
| `commitlint.config.js` | SCOPE_LIST const + scope-enum + body/header 룰 강화 |
| `.husky/pre-commit` | hook-timing wrapper로 6 step 래핑 (default no-op) |
| `.husky/pre-push` | hook-timing wrapper로 8 step + conditional 1 래핑 |
| `.gitignore` | `.husky/.timing-log.jsonl` opt-in 로그 제외 |
| `.claude/exec-plans/tech-debt-tracker.md` | S-2/S-3/S-5 [x] closure + S-4 SKIP 트리거 스냅샷 |

## Out of Scope (명시적 제외)

- ❌ `packages/*/package.json` 에 lint script 추가 — packages는 lint script
  없는 도메인 그대로 유지. 추가 시 빌드 의존성 + tsc 회귀 위험 + S-2의 본질
  목적(parity SSOT 확장)과 무관.
- ❌ ADR-0008 신설 — S-4 트리거 0/4. 본문 §S-4 SKIP 정당화 참조.
- ❌ `.husky/_/husky.sh` 수정 — husky 내부 파일. 시스템 영향 큼.
- ❌ `apps/backend/.eslintrc.js`, `apps/frontend/eslint.config.mjs` 수정 —
  본 sprint는 packages 도메인 confiar invariant 확장만. 기존 config 본문
  변경은 별도 sprint.
- ❌ ADR-0006 routing 게이트 변경 — 무관 영역.
- ❌ ADR-0007 본문 수정 — 이미 §Trigger Conditions SSOT 역할 수행.
- ❌ `scripts/precommit-staged-guard.mjs` 수정 — Phase 3에서 wrapper로 감싸기만 함, 본문 보존.

## 검증 명령 (전체 sprint)

```bash
# Phase 1
node --test scripts/__tests__/verify-lint-ruleset-parity.spec.mjs
pnpm verify:lint-ruleset-parity   # 3 도메인 PASS

# Phase 2
node --test scripts/__tests__/commitlint-config.spec.mjs
echo "feat(checkouts): valid" | npx commitlint --config commitlint.config.js   # exit 0
echo "feat(unknown_scope): bad" | npx commitlint --config commitlint.config.js # exit 1

# Phase 3
EMS_HOOK_TIMING=1 git commit --allow-empty -m "test(hooks): dry"   # stderr JSON line
EMS_HOOK_TIMING=1 EMS_HOOK_TIMING_LOG=1 git commit --allow-empty -m "test(hooks): log"
test -f .husky/.timing-log.jsonl

# Phase 4-5
grep -E "^\- \[(x|SKIP-trigger-not-met)\]" .claude/exec-plans/tech-debt-tracker.md | grep -c "commit-pipeline S-"   # ≥ 4

# 회귀 가드
pnpm tsc --noEmit
pnpm --filter backend run test --silent --passWithNoTests
pnpm --filter frontend run test --silent --passWithNoTests
```

## Risk Register

| # | Risk | 확률 | 영향 | 완화 |
|---|------|------|------|------|
| R1 | hook-timing wrapper가 자식 exit code 잘못 전파 → 차단 우회 | 중 | 높음 | spec 케이스: 의도 fail child → wrapper도 exit 1 검증 |
| R2 | scope-enum 화이트리스트가 너무 좁아 legacy commit hook fail | 중 | 중 | 본 sprint는 신규 commit만 영향 (commit-msg hook). 기존 main 영향 0. SCOPE_LIST 사후 추가 비용 = 1줄. |
| R3 | PARITY_SPEC.packages null 분기로 인한 false-PASS | 낮 | 높음 | spec FAIL 케이스 2건 (lintstaged 누락 / critical rule 누락) 으로 회귀 차단 |
| R4 | hook-timing wrapper Node startup overhead 누적 (~7 step × 30ms) | 중 | 중 | env 미설정 시 단순 spawnSync — 측정 후 200ms 미만 검증, ≥10% 회귀 시 child_process.execFileSync 로 최적화 |
| R5 | S-4 SKIP 결정이 시간 지나며 trigger 충족 사실 누락 | 낮 | 중 | tracker entry에 트리거 스냅샷 + 재검토 조건 명시. memory 항목 추가 권장(후속). |

## 의사결정 로그

- **2026-05-06 15:00 KST** — Mode 2 채택. 4 SHOULD 항목이 commit pipeline 단일
  시스템에 묶여 있어 점진 개별 sprint보다 통합 closure가 적절.
- **2026-05-06 15:05 KST** — S-4 SKIP 결정 (트리거 0/4). 사용자가 명시적으로
  "honesty on triggerless items" 요구한 점 반영.
- **2026-05-06 15:10 KST** — packages 도메인 검증 전략: lint script 부재 인정 +
  null 분기. 대안(packages에 lint script 신설) 거부 — over-engineering.
- **2026-05-06 15:15 KST** — hook-timing wrapper Node 채택 (bash 대신).
  macOS/Linux 호환 + JSON 출력 안전성.
- **2026-05-06 15:20 KST** — SCOPE_LIST 출처는 commitlint.config.js 단일
  파일. shared-constants 분리 검토 → 거부 (build chain 복잡도 +
  commitlint은 build 비참여).
