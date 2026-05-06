# 스프린트 계약: commit-pipeline-safety SHOULD 후속 4건 closure

## 생성 시점

2026-05-06T15:25:00+09:00

## 슬러그 / 모드

- 슬러그: `commit-pipeline-safety-should-followups`
- 모드: Mode 2 (Planner → Generator → Evaluator 루프)
- 평가 보고: `.claude/evaluations/commit-pipeline-safety-should-followups.md`

## Files in scope (변경 허용 파일 — 외부 수정 시 M-15 FAIL)

1. `scripts/verify-lint-ruleset-parity.mjs` (수정)
2. `scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` (수정)
3. `scripts/hook-timing.mjs` (신규)
4. `scripts/__tests__/commitlint-config.spec.mjs` (신규)
5. `commitlint.config.js` (수정)
6. `.husky/pre-commit` (수정)
7. `.husky/pre-push` (수정)
8. `.gitignore` (수정)
9. `.claude/exec-plans/tech-debt-tracker.md` (수정)
10. (옵션) `.claude/exec-plans/active/2026-05-06-commit-pipeline-safety-should-followups.md` (Generator가 의사결정 로그 append 가능)

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **M-1: PARITY_SPEC.packages 정의 존재**
  - `grep -c "packages: {" scripts/verify-lint-ruleset-parity.mjs` ≥ 1
  - `grep -c "lintstagedGlobPrefix: 'packages/'" scripts/verify-lint-ruleset-parity.mjs` ≥ 1
  - `grep -c "@typescript-eslint/no-explicit-any" scripts/verify-lint-ruleset-parity.mjs` ≥ 1

- [ ] **M-2: verify-lint-ruleset-parity main()이 packages 도메인을 기본 포함**
  - `grep -E "domains.*=.*\['backend'.*'frontend'.*'packages'\]" scripts/verify-lint-ruleset-parity.mjs` 매치 ≥ 1
    OR (멀티라인 우회 회피) `grep -c "'packages'" scripts/verify-lint-ruleset-parity.mjs` ≥ 2
    AND `grep -c "domains.includes('packages')" scripts/verify-lint-ruleset-parity.mjs` ≥ 1

- [ ] **M-3: packages 도메인 spec 케이스 ≥ 3**
  - `grep -cE "test\(.*packages" scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` ≥ 3
  - `node --test scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` exit 0

- [ ] **M-4: commitlint.config.js SCOPE_LIST 정의 + 길이 ≥ 30**
  - `grep -c "const SCOPE_LIST" commitlint.config.js` ≥ 1
  - `grep -c "module.exports.SCOPE_LIST" commitlint.config.js` ≥ 1
  - `node -e "const c=require('./commitlint.config.js'); if (c.SCOPE_LIST.length < 30) process.exit(1)"` exit 0
  - SCOPE_LIST 에 다음 키 모두 포함 (각각 grep 분리 카운트, A.*B 단일라인 금지):
    - `grep -c "'checkouts'" commitlint.config.js` ≥ 1
    - `grep -c "'calibration'" commitlint.config.js` ≥ 1
    - `grep -c "'equipment'" commitlint.config.js` ≥ 1
    - `grep -c "'auth'" commitlint.config.js` ≥ 1
    - `grep -c "'commit-pipeline'" commitlint.config.js` ≥ 1
    - `grep -c "'hooks'" commitlint.config.js` ≥ 1

- [ ] **M-5: scope-enum 룰이 SCOPE_LIST 참조 (인라인 배열 중복 금지)**
  - `grep -c "'scope-enum'" commitlint.config.js` ≥ 1
  - `grep -E "'scope-enum'.*SCOPE_LIST" commitlint.config.js` 매치 OR
    인접 라인 검증: scope-enum 룰 본문에 `SCOPE_LIST` identifier 등장 (멀티라인 허용 — `awk` 추출 후 grep)
  - `awk '/scope-enum/,/\]/' commitlint.config.js | grep -c "SCOPE_LIST"` ≥ 1

- [ ] **M-6: body/header 위생 룰 4개 모두 추가**
  - `grep -c "'body-max-line-length'" commitlint.config.js` ≥ 1
  - `grep -c "'header-case'" commitlint.config.js` ≥ 1
  - `grep -c "'body-leading-blank'" commitlint.config.js` ≥ 1
  - `grep -c "'footer-leading-blank'" commitlint.config.js` ≥ 1

- [ ] **M-7: hook-timing helper 존재 + opt-in env 분기**
  - `test -f scripts/hook-timing.mjs` exit 0
  - `grep -c "EMS_HOOK_TIMING" scripts/hook-timing.mjs` ≥ 2 (env 검사 + 출력 분기 각 1)
  - `grep -c "EMS_HOOK_TIMING_LOG" scripts/hook-timing.mjs` ≥ 1
  - `grep -c "spawnSync\|spawn" scripts/hook-timing.mjs` ≥ 1
  - 자식 exit code 전파 검증: `grep -E "process\.exit\(.*status\)|process\.exit\(.*code\)" scripts/hook-timing.mjs` 매치 ≥ 1

- [ ] **M-8: pre-commit + pre-push가 hook-timing wrapper 사용 (default no-op 보장)**
  - `grep -c "scripts/hook-timing.mjs" .husky/pre-commit` ≥ 1
  - `grep -c "scripts/hook-timing.mjs" .husky/pre-push` ≥ 1
  - 기본 동작 보존: `EMS_HOOK_TIMING` 미설정 상태에서 `bash .husky/pre-commit` 실행 시 stderr에 `{"step":` JSON 출력 0회
    (검증: `EMS_HOOK_TIMING= bash -c 'node scripts/hook-timing.mjs --label test -- echo ok' 2>&1 | grep -c "{\"step\":"` = 0)

- [ ] **M-9: tech-debt-tracker S-2/S-3/S-5 closure 표시**
  - `grep -c "\[x\].*commit-pipeline S-2" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
  - `grep -c "\[x\].*commit-pipeline S-3" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
  - `grep -c "\[x\].*commit-pipeline S-5" .claude/exec-plans/tech-debt-tracker.md` ≥ 1

- [ ] **M-10: tech-debt-tracker S-4 SKIP + 트리거 스냅샷 존재**
  - `grep -c "SKIP-trigger-not-met.*commit-pipeline S-4" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
    OR (하이픈 escape 우회) `grep -E "SKIP.*S-4" .claude/exec-plans/tech-debt-tracker.md` 매치 ≥ 1
  - 4 트리거 스냅샷 키워드 각 grep:
    - `grep -c "race incident" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
    - `grep -c "흡수 사고" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
    - `grep -c "동시 세션" .claude/exec-plans/tech-debt-tracker.md` ≥ 1
    - `grep -c "parity 회귀\|parity fail" .claude/exec-plans/tech-debt-tracker.md` ≥ 1

- [ ] **M-11: ADR-0007 본문 무수정 (cross-link만 허용) + ADR-0008 미생성**
  - `git diff docs/adr/0007-multi-session-working-tree-safety.md` 결과 0 라인
  - `test ! -f docs/adr/0008-*.md` (ADR-0008 신설 금지)

- [ ] **M-12: pnpm verify:lint-ruleset-parity 3 도메인 PASS**
  - `pnpm verify:lint-ruleset-parity` exit 0
  - 출력에 다음 3 라인 모두 등장:
    - `grep -c "\[backend\]"` (출력 캡처 후) ≥ 1
    - `grep -c "\[frontend\]"` ≥ 1
    - `grep -c "\[packages\]"` ≥ 1

- [ ] **M-13: commitlint 동작 검증 (valid PASS / invalid FAIL × 2)**
  - `echo "feat(checkouts): valid sample message" | npx commitlint --config commitlint.config.js` exit 0
  - `echo "feat(unknown_scope_xyz): bad" | npx commitlint --config commitlint.config.js` exit ≠ 0
  - `echo "Feat(checkouts): bad case" | npx commitlint --config commitlint.config.js` exit ≠ 0
    (header-case 위반)

- [ ] **M-14: hook 실행 시간 회귀 ≤ 10%**
  - baseline: 기존 commit (wrapper 도입 전) `time bash .husky/pre-commit` (사용자가 별도 측정 → tracker에 기록)
  - 본 sprint 후 `EMS_HOOK_TIMING=` (미설정) `time bash .husky/pre-commit` 실측 elapsed
  - Generator는 `node scripts/hook-timing.mjs --label baseline -- true` 1회 측정 (≤ 100ms) 결과를 evaluation 보고에 첨부
  - 자동 검증 불가 시 SHOULD 강등 가능 (Evaluator 판단)

- [ ] **M-15: Files in scope 외 수정 0건**
  - `git diff --name-only` 결과가 위 §Files in scope 10개 화이트리스트의 부분집합
  - `apps/backend/`, `apps/frontend/`, `packages/`, `docs/adr/`, `.husky/_/` 영역 modify 0

### 권장 (SHOULD) — 실패 시 tech-debt 기록, 루프 차단 없음

- [ ] **S-1: SCOPE_LIST가 JSON 직렬화 가능 (자동화 활용)**
  - `node -e "console.log(JSON.stringify(require('./commitlint.config.js').SCOPE_LIST))"` exit 0 + 길이 ≥ 30 entries

- [ ] **S-2: hook-timing helper가 per-step JSON-line stdout 형식 지원**
  - `EMS_HOOK_TIMING=1 node scripts/hook-timing.mjs --label test -- echo ok 2>&1 | grep -cE '\{"step":"test","ms":[0-9]+'` ≥ 1

- [ ] **S-3: verify-lint-ruleset-parity가 도메인별 elapsed 표시 (CI 모니터링)**
  - 출력 끝줄에 도메인 수 + 총 elapsed ms 표시 (이미 기존 구현에 존재)
  - packages 도메인 추가 후에도 elapsed < 200ms

- [ ] **S-4: tech-debt-tracker S-4 SKIP 엔트리에 ADR-0007 앵커 cross-reference**
  - `grep -c "0007-multi-session-working-tree-safety.md#trigger-conditions" .claude/exec-plans/tech-debt-tracker.md` ≥ 1

- [ ] **S-5: commitlint config 신규 룰 각각에 한국어 인라인 주석**
  - `awk '/body-max-line-length/{getline; print}' commitlint.config.js` 또는 인접 한국어 주석 라인 grep
  - `grep -B1 "'scope-enum'" commitlint.config.js | grep -c "//"` ≥ 1

### 적용 verify 스킬

- `verify-lint-ruleset-parity` (SSOT 검증 — Phase 1)
- 자동 verify 스킬 미해당 영역 (commitlint / hook timing) — 본 contract grep이 직접 수행

### 부수 회귀 가드

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm --filter backend run test --silent --passWithNoTests` exit 0
- [ ] `pnpm --filter frontend run test --silent --passWithNoTests` exit 0
- [ ] `node --test scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` exit 0
- [ ] `node --test scripts/__tests__/commitlint-config.spec.mjs` exit 0

---

## Out of Scope (Generator가 절대 수정 금지)

- ❌ `packages/db/package.json`, `packages/schemas/package.json`,
  `packages/shared-constants/package.json` 에 lint script 추가
- ❌ `docs/adr/0008-*.md` 생성 (ADR-0008 신설 금지)
- ❌ `.husky/_/husky.sh` (husky 내부 파일)
- ❌ `apps/backend/.eslintrc.js`, `apps/frontend/eslint.config.mjs` 본문 수정
- ❌ `.lintstagedrc.json`의 `apps/backend/`, `apps/frontend/` 글로벌 entry 수정
- ❌ `docs/adr/0007-*.md` 본문 수정 (cross-link 텍스트만 tracker 측에)
- ❌ `docs/adr/0006-*.md` routing 게이트 수정
- ❌ `scripts/precommit-staged-guard.mjs` 본문 수정 (wrapper로 감싸기만)

---

## 검증 명령 (Evaluator 일괄 실행)

```bash
set -e
cd /home/kmjkds/equipment_management_system

# M-1 ~ M-3 (parity)
grep -c "packages: {" scripts/verify-lint-ruleset-parity.mjs
grep -c "lintstagedGlobPrefix: 'packages/'" scripts/verify-lint-ruleset-parity.mjs
grep -c "'packages'" scripts/verify-lint-ruleset-parity.mjs
grep -cE "test\(.*packages" scripts/__tests__/verify-lint-ruleset-parity.spec.mjs
node --test scripts/__tests__/verify-lint-ruleset-parity.spec.mjs

# M-4 ~ M-6 (commitlint)
node -e "const c=require('./commitlint.config.js'); console.log(c.SCOPE_LIST.length)"
grep -c "'scope-enum'" commitlint.config.js
grep -c "'body-max-line-length'" commitlint.config.js
grep -c "'header-case'" commitlint.config.js
grep -c "'body-leading-blank'" commitlint.config.js
grep -c "'footer-leading-blank'" commitlint.config.js
node --test scripts/__tests__/commitlint-config.spec.mjs

# M-7 ~ M-8 (timing)
test -f scripts/hook-timing.mjs
grep -c "EMS_HOOK_TIMING" scripts/hook-timing.mjs
grep -c "scripts/hook-timing.mjs" .husky/pre-commit
grep -c "scripts/hook-timing.mjs" .husky/pre-push

# 기본 no-op 검증
node scripts/hook-timing.mjs --label test -- echo ok 2>&1 | grep -c '"step":' && echo "FAIL: default should not emit JSON" || echo "PASS: default no-op"
EMS_HOOK_TIMING=1 node scripts/hook-timing.mjs --label test -- echo ok 2>&1 | grep -cE '\{"step":"test","ms":[0-9]+'

# M-9 ~ M-10 (tracker)
grep -c "\[x\].*commit-pipeline S-2" .claude/exec-plans/tech-debt-tracker.md
grep -c "\[x\].*commit-pipeline S-3" .claude/exec-plans/tech-debt-tracker.md
grep -c "\[x\].*commit-pipeline S-5" .claude/exec-plans/tech-debt-tracker.md
grep -E "SKIP.*S-4" .claude/exec-plans/tech-debt-tracker.md

# M-11 (ADR 무수정)
git diff docs/adr/0007-multi-session-working-tree-safety.md | wc -l   # 0 expected
ls docs/adr/0008-*.md 2>/dev/null && echo "FAIL: ADR-0008 created" || echo "PASS: no ADR-0008"

# M-12 (parity 3 도메인 PASS)
pnpm verify:lint-ruleset-parity 2>&1 | tee /tmp/parity-out.txt
grep -c "\[backend\]" /tmp/parity-out.txt
grep -c "\[frontend\]" /tmp/parity-out.txt
grep -c "\[packages\]" /tmp/parity-out.txt

# M-13 (commitlint 동작)
echo "feat(checkouts): valid sample" | npx commitlint --config commitlint.config.js && echo VALID-OK
echo "feat(unknown_scope_xyz): bad" | npx commitlint --config commitlint.config.js && echo "FAIL: should reject" || echo INVALID-OK
echo "Feat(checkouts): bad case" | npx commitlint --config commitlint.config.js && echo "FAIL: should reject" || echo CASE-OK

# M-15 (scope 외 수정 검사)
git diff --name-only | sort -u

# 회귀 가드
pnpm tsc --noEmit
pnpm --filter backend run test --silent --passWithNoTests
pnpm --filter frontend run test --silent --passWithNoTests
```

---

## 종료 조건

- 필수 (MUST) 15개 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제로 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패 → tech-debt-tracker.md 등록 (별도 sprint), 루프 차단 없음

## 시니어 자기검토 라운드 (Evaluator PASS 후)

본 sprint 출처 sprint(commit-pipeline-safety)가 시니어 자기검토 #2 라운드에서
S-1 격상 사례 보유. Evaluator PASS 후 main agent가 다음 라운드 추가 수행 권고:

- **라운드 1 (표면)**: contract grep 정확도 / Prettier 멀티라인 회피 검증
- **라운드 2 (architecture)**: SSOT 분산 (SCOPE_LIST가 정말 단일 출처? backend
  module enum과 동기화 자동 검증?), opt-in env 충돌 가능성 (다른 wrapper와)
- **라운드 3 (운영)**: 다른 PC / CI 에서 commitlint 동작, hook-timing log 파일
  누적 / rotation 정책, scope-enum 강제로 인한 신규 모듈 추가 비용
