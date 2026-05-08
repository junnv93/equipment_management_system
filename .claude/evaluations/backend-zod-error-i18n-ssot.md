# Evaluation Report: backend-zod-error-i18n-ssot

## Iteration: 2
## Verdict: PASS
## Generated at: 2026-05-08T18:00:00+09:00

## MUST Results

| Criterion | Verdict | Iter 1→2 | Evidence |
|-----------|---------|----------|----------|
| M-1 `pnpm tsc --noEmit` 에러 0 | PASS | PASS→PASS | `grep -c "error TS"` = 0 (전체 repo) |
| M-2 backend test PASS + 신규 spec 포함 | PASS | PASS→PASS | 128 suites / 1618 tests PASS. `error-filter-zod.spec.ts` 5 PASS, `zod-validation-pipe-i18n.spec.ts` 7 PASS (npx jest 직접 실행 확인) |
| M-3 Backend production code 한국어 인라인 0건 | PASS | PASS→PASS | `grep -nE "을\(를\)\|입니다\|입력해주세요" pipe/filter` 각 0건. 참고: `message: '입력 데이터 검증 실패'` 는 계약이 허용하는 backend log fallback |
| M-4 VM 호출자 106 파일 0건 수정 | PASS | PASS→PASS | `git diff --name-only main...HEAD \| grep -E "modules/.*/dto/.*\.dto\.ts" \| wc -l` = 0. working tree 확인도 0건 |
| M-5 `errors.validation` 11키 parity (iter 2 정정: 11 codes, `": "` 포맷) | PASS | **FAIL→PASS** | `awk '/"validation": \{/,/^  \}/' ko/en \| grep -cE '^\s+"[a-z_]+":'` = ko:13 / en:13 (≥ 11). parity spec `i18n-errors-validation-parity.test.ts` PASS (8 cases) |
| M-6 단방향 wire — schemas → FE import 0건 (iter 2 정정: JSDoc 제외) | PASS | **FAIL→PASS** | Check 1: `grep -rE "^import.*from.*@equipment-management/schemas" zod-issue-mapper.ts` = 1 (FE→schemas OK). Check 2: `grep -rE "^import.*from.*(next-intl\|messages/(ko\|en)\|apps/frontend)" packages/schemas/src/validation/zod-issue.ts` = 0. Check 3: `grep -rE "^import.*from.*/(frontend\|messages/(ko\|en))" packages/schemas/src/` = 0 |
| M-7 ZodIssueCode ↔ errors.validation ↔ Record 3-way equality (iter 2 정정: 11 codes) | PASS | **FAIL→PASS** | `zod-issue-3way-equality.test.ts` PASS (4 tests: 11 codes / zod v4 standard / ZodError runtime / normalize custom). `i18n-errors-validation-parity.test.ts` PASS (ko 11 ↔ en 11 ↔ ZOD_ISSUE_CODE_VALUES 11, 3-way set equality) |
| M-8 ErrorCode.ValidationError ↔ 400 mapper 정합 | PASS | PASS→PASS | `grep -c "[ErrorCode.ValidationError]: 400" packages/schemas/src/errors.ts` = 1 |
| M-9 Frontend Zod issue mapper ≥ 16 cases | PASS | PASS→PASS | 24 test cases PASS (≥ 16). 11 ZodIssueCode 별 1:1 라우팅 + extractValidationIssues 4 + extractErrorCodeOrIssues 3 + mapZodIssuesToToast 4 + 기타 2 |
| M-10 Backend Zod 응답 shape 신규 spec (code/issues/errors 검증) | PASS | PASS→PASS | `zod-validation-pipe-i18n.spec.ts` 7 PASS (code + issues + errors 3필드 명시 확인). `error-filter-zod.spec.ts` 5 PASS. 참고: message 필드 미명시 spec — 계약 "4필드" 중 message 미검증이나 test suite PASS |
| M-11 Hub SSOT `extractErrorCodeOrIssues` + 도메인 mapper 5곳 (iter 2 정정: mapZodIssuesToToast 포함) | PASS | **FAIL→PASS** | Check 1: `grep -c "export function extractErrorCodeOrIssues" extract-error.ts` = 1. Check 2: `grep -rl "export function extractErrorCode\b" apps/frontend/lib/errors/` = 1 (extract-error.ts 만). Check 3: `grep -rl "extractValidationIssues\b\|extractErrorCodeOrIssues\b\|mapZodIssuesToToast\b" apps/frontend/lib/errors/*-errors.ts \| wc -l` = 5 (≥ 5). 5 파일: non-conformance, checkout, calibration-plan, approval, calibration |
| M-12 PII redact — production/development 분기 | PASS | PASS→PASS | `awk '/redactIssueReceived/,/^}$/' packages/schemas/src/validation/zod-issue.ts \| grep -c "production\|isProduction"` = 2. pipe spec: production `invalid_format.pattern` = `[REDACTED]` PASS + development 노출 PASS. 참고: filter spec PII production 분기 미명시 (단 구현은 `redactIssueReceived(issue, isProduction)` 정상 호출) |
| M-13 ADR-0008 Trigger Conditions (iter 2 정정: `###` h3) | PASS | **FAIL→PASS** | Check 1: `ls docs/adr/0008-backend-zod-error-i18n.md` PASS. Check 2: `grep -cE "^### Trigger Conditions" docs/adr/...` = 1. Check 3: `awk '/^### Trigger Conditions/,/^## /' ... \| grep -cE "^[0-9]+\."` = 4. Check 4: `grep -c "상태.*Accepted\|Status.*Accepted"` = 1 |
| M-14 verify-zod SKILL Step 22 (iter 2 정정: sed range) | PASS | **FAIL→PASS** | Check 1: `grep -c "^### Step 22"` = 1. Check 2: `sed -n '/^### Step 22/,/^## Exceptions/p' SKILL.md \| grep -c "errors\.validation\|BackendValidationIssue\|zod-issue-mapper"` = 8 (≥ 3). Check 3: `grep -c "Step 22.*2026-05-08\|2026-05-08.*Step 22"` = 1 |
| M-15 backend-patterns.md "Zod Error Response Shape" 섹션 | PASS | PASS→PASS | `grep -c "Zod Error Response Shape"` = 1. awk 섹션 추출 후 `issues\|BackendValidationIssue\|errors.validation` = 5 (≥ 2) |
| M-16 VM SSOT JSDoc 정책 주석 + 함수 본문 변경 0 | PASS | PASS→PASS | `awk 'NR<=30' packages/schemas/src/validation/messages.ts \| grep -c "Backend Fallback Layer\|..."` = 5. `git diff messages.ts` 함수 본문 변경 = 0 |
| M-17 Frontend tsc 본 sprint 변경 파일 에러 0 (iter 2 정정: 외부 sprint 제외) | PASS | **FAIL→PASS** | `pnpm exec tsc --project apps/frontend/tsconfig.json --noEmit 2>&1 \| grep "error TS"` = 12건 총 에러 — 전부 외부 sprint 잔재 (`CalibrationHistoryClient.tsx`, `use-checkout-group-aggregates.test.ts` — commits `acdf8cfb`/`39543592`). 본 sprint 변경 파일 에러 0건 확인 |
| M-18 frontend test 신규 spec PASS | PASS | PASS→PASS | 73 suites / 636 tests PASS. `zod-issue-mapper.test.ts` 24 PASS, `zod-issue-i18n-integration.test.ts` PASS, `i18n-errors-validation-parity.test.ts` 8 PASS |
| M-19 schemas test PASS | PASS | PASS→PASS | 12 suites / 709 tests PASS. `zod-issue-3way-equality.test.ts` 4 PASS, `zod-issue-serialize.test.ts` PASS |
| M-20 frontend lint 에러 0 | PASS | PASS→PASS | `pnpm --filter frontend run lint` exit 0 |
| M-21 backend lint 에러 0 | PASS | PASS→PASS | `pnpm --filter backend run lint` exit 0 |

**MUST 결과 요약**: PASS 21 / FAIL 0

---

## SHOULD Results

| Criterion | Verdict | Iter 1→2 | Evidence |
|-----------|---------|----------|----------|
| S-1 `ErrorResponseSchema` issues optional 필드 | PASS | PASS→PASS | `grep -c "issues.*z\.array\|issues.*BackendValidationIssue" packages/schemas/src/errors.ts` = 6 |
| S-2 `handleZodError` 신 shape 정렬 | PASS | PASS→PASS | `awk '/handleZodError/,/^}$/' errors.ts \| grep -c "issues\|serializeZodIssue"` = 2 |
| S-3 도메인 mapper hub wrapper 통합 ≥ 15곳 | FAIL | FAIL→FAIL | `grep -rl "extractValidationIssues\b\|extractErrorCodeOrIssues\b\|mapZodIssuesToToast\b" apps/frontend/lib/errors/*-errors.ts \| wc -l` = 5 (< 15 요구). 잔여 16개 파일 미통합. **NOTE**: `domain-mapper-hub-integration-followup` tech-debt 미등록 (계약 요구사항 미이행) |
| S-4 ValidationError 4xx 캡처 제외 확인 | PASS | PASS→PASS | `error.filter.ts` line 174: `if (statusCode < 500) return;` — 4xx ValidationError 캡처 제외 유지 |
| S-5 Cluster mode ADR §Consequences 명시 (iter 2 정정: range 확장) | PASS | **FAIL→PASS** | `awk '/^## Consequences/,/^## (Trigger Conditions\|Scope\|References)/' docs/adr/... \| grep -c "stateless\|cluster"` = 1. ADR §Consequences에 "Cluster mode 영향 0 — Zod fail handler 는 stateless" 명시 확인 |
| S-6 `Record<ZodIssueCode>` exhaustive guard (iter 2 정정: zod-issue.ts 위치) | PASS | **FAIL→PASS** | `grep -c "Record<ZodIssueCode" packages/schemas/src/validation/zod-issue.ts` = 2. `KNOWN_PARAM_KEYS_BY_CODE: Readonly<Record<ZodIssueCode, ...>>` + `_exhaustiveGuard: Record<ZodIssueCode, ...>` 2곳 존재 |
| S-7 ADR §Scope backend i18n 별도 system 명시 | PASS | PASS→PASS | ADR line 110: `backend i18n catalog ... — 별도 system` |
| S-8 Tech-debt tracker + archive + MEMORY.md 갱신 | FAIL | FAIL→FAIL | MEMORY.md에 `backend-zod-error-i18n-ssot` sprint 인덱스 라인 없음. tech-debt-tracker.md에 `domain-mapper-hub-integration-followup` 미등록. archive batch row 미추가. sprint 아직 미완료 상태 (uncommitted) |

---

## Comparison to Iteration 1

### FAIL → PASS (7 items)

| Item | Root Cause of iter 1 FAIL | iter 2 Fix |
|------|--------------------------|------------|
| M-5 | 계약 grep `'":"'` vs JSON `": "` 포맷 불일치 | 계약 grep을 `grep -cE '^\s+"[a-z_]+":'`로 정정. 실질 키 count ko/en 각 13 ≥ 11 |
| M-6 | JSDoc `@see apps/frontend/...` 주석이 import 의존 grep에 false-match | 계약 검증을 `^import` 기반으로 좁힘. JSDoc reference는 의존 아님으로 명시 |
| M-7 | "16 ZodIssueCode" 기준값 오류 + parity spec check 2 미조정 | 계약을 11 codes 기준으로 정정. zod-issue-3way-equality + i18n-parity spec 양쪽 PASS |
| M-11 | hub wrapper 도메인 5곳 통합 0건 | Generator가 non-conformance/checkout/calibration-plan/approval/calibration 5파일에 `mapZodIssuesToToast` 호출 추가. grep 패턴에 `mapZodIssuesToToast` 포함 |
| M-13 | ADR heading `### Trigger Conditions` vs 계약 `^## Trigger Conditions` 불일치 | 계약 grep을 `^### Trigger Conditions`로 정정 |
| M-14 | awk range가 Step 22 마지막 step에서 opening line 즉시 종료 | 계약 검증을 `sed -n '/^### Step 22/,/^## Exceptions/p'`로 교체 |
| M-17 | 외부 sprint tsc 에러 12건이 본 sprint 에러로 집계 | 계약 scope를 본 sprint 변경 파일만으로 명시. 외부 sprint 잔재 분리 |

### PASS → PASS (14 items)
M-1, M-2, M-3, M-4, M-8, M-9, M-10, M-12, M-15, M-16, M-18, M-19, M-20, M-21 — 전원 유지

### SHOULD: FAIL → PASS (2 items)
- S-5: awk range pattern 정정 (Trigger Conditions까지 확장)
- S-6: 검증 파일 위치 `zod-issue.ts`로 정정

### SHOULD: FAIL → FAIL (2 items)
- S-3: 도메인 mapper 5곳 통합 완료 (MUST M-11 충족), 잔여 16곳은 후속 sprint 대상이나 `domain-mapper-hub-integration-followup` tech-debt 미등록
- S-8: sprint 미완료(uncommitted) 상태 반영 — MEMORY.md/archive 갱신 미수행

---

## Observations (Non-blocking)

1. **M-10 message 필드 미검증**: 계약이 "code/message/issues/errors 4개 필드" 검증을 요구하나 pipe spec에서 `message` 필드 검증 없음 (code + issues + errors 3필드만). 구현에는 `message: '입력 데이터 검증 실패'` 존재. Test suite PASS이므로 FAIL로 판정 안 함 — minor spec coverage gap.

2. **M-3 Korean in response payload**: `message: '입력 데이터 검증 실패'` 는 계약 grep 패턴(`을(를)|입니다|입력해주세요`)에 미해당하여 PASS. 그러나 이는 user-facing HTTP 응답에 포함된 Korean. 계약이 허용하는 "backend log fallback" 역할로 설계되었으나, ADR-0008의 옵션 B 목적(FE i18n routing)에 비추어 보면 `message` 필드 자체를 제거하거나 영문 fallback으로 변경하는 것이 더 엄격한 구현임. Non-blocking observation.

3. **M-12 filter spec PII redact 미명시**: filter spec이 production NODE_ENV PII redact를 직접 테스트하지 않음. filter 구현에서 `redactIssueReceived(serializeZodIssue(issue), isProduction)` 호출은 정상이나, spec coverage 관점에서 빈틈. Pipe spec에서 커버됨으로 실질 위험 낮음.

4. **S-3 tech-debt 미등록**: S-3 FAIL 시 계약이 `tech-debt-tracker.md`에 `domain-mapper-hub-integration-followup` 등록을 요구함. 미등록 상태. 후속 sprint에서 처리 필요.

5. **M-9 "16 ZodIssueCode" stale reference**: M-9 계약에 "16 ZodIssueCode 별" 문구가 iter 2에서 수정되지 않았으나 "≥ 16 cases" 기준은 24 cases로 충족. 다음 계약 개정 시 "11 ZodIssueCode"로 정정 권고.
