# Evaluation: reject-modal-ssot-closure

**Date**: 2026-05-08
**Iteration**: 1

## MUST Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M-1 | `admin/RejectReasonDialog.tsx` 파일 삭제 | PASS | `ls` → "No such file or directory" 확인 |
| M-2 | `RejectReasonDialog` import/usage 0건 (spec 주석 제외) | PASS | `grep -rn "RejectReasonDialog" apps/ packages/ --include="*.ts" --include="*.tsx"` → 0건. `.tsbuildinfo` 바이너리만 히트 (소스 파일 아님) |
| M-3 | `approveDisposalSchema`에서 `discriminatedUnion` 또는 `superRefine` 사용 | PASS | `disposal.dto.ts:73` — `z.discriminatedUnion('decision', [...])`. `approve` 브랜치: comment optional+max, `reject` 브랜치: comment `.min(REJECTION_REASON_MIN_LENGTH)` + max 완비 |
| M-4 | disposal.service.ts에 "Zod는 max+optional만" 문자열 0건 | PASS | `grep` → 0건. 구 주석 완전 제거 확인 |
| M-5 | `pnpm --filter backend run tsc --noEmit` PASS (0 errors) | PASS | `pnpm --filter backend run build` → nest build 성공 (0 TypeScript errors). 로컬 tsc 바이너리 부재로 nest build로 대체 검증 |
| M-6 | `pnpm --filter frontend run tsc --noEmit` PASS (0 errors) | FAIL | `apps/frontend/node_modules/.bin/tsc --noEmit` → **12 errors** 확인. 주요 오류: `components/equipment/CalibrationHistoryClient.tsx(24,8): error TS2614` (CalibrationApprovalStatus no exported member) + `hooks/__tests__/use-checkout-group-aggregates.test.ts` 다수 TS2304/TS2322/TS2339 |
| M-7 | `pnpm --filter backend run test` PASS (회귀 없음) | PASS | 130 suites, 1628 tests — 전부 PASS. Force exit 경고는 open handle leak (테스트 실패 아님) |

## SHOULD Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S-1 | e2e 테스트 주석에서 `RejectReasonDialog` → `RejectModal (mode='domain')` 정정 | PASS | `rejection-workflow.spec.ts:99,104` 확인 — `RejectReasonDialog` 언급 없음. line 99: `// 4. 반려 사유 다이얼로그 표시 확인 (RejectModal mode='domain' with title "교정 반려")`, line 104: `// RejectModal: RejectReasonSchema ...`. 정정 완료. |
| S-2 | disposal.service.ts 수동 min-check 코드 제거 (Zod 이관 후 중복) | PARTIAL | `approveDisposal` 함수 (line 334~)의 reject 경로 수동 min-check는 제거됨 (line 339 주석: "discriminatedUnion이 담당"). **단, `reviewDisposal` (line 171~)의 수동 min-check (lines 177-184)는 잔존** — `reviewDisposalSchema`가 `z.object()` + `decision: ApprovalActionEnum`으로 discriminatedUnion 미적용. S-2 scope는 계약 문맥상 `approveDisposal`의 수동 min-check 제거이므로 PARTIAL 판정. |
| S-3 | 타입 에러 없음 (M-5/M-6 커버) | FAIL | M-6이 FAIL이므로 frontend tsc 12 errors 잔존. backend(M-5)는 PASS. |

## Verdict

**FAIL** — M-6 FAIL: frontend TypeScript 컴파일 시 12개 오류 확인.

## Issues (FAIL)

### M-6: Frontend TypeScript 12 errors

이 sprint에서 도입된 파일에 의한 에러가 아닌 기존 파일의 에러임을 확인했으나, 계약은 "0 errors" 절대 기준이므로 FAIL.

오류 목록:

1. `components/equipment/CalibrationHistoryClient.tsx(24,8): error TS2614` — `'CalibrationApprovalStatus'` not exported from `@/lib/api/calibration-api`

2. `components/equipment/__tests__/CalibrationHistoryClient.test.tsx(49,37): error TS2352` — mock object missing required Equipment fields

3. `components/equipment/__tests__/CalibrationHistoryClient.test.tsx(59,3): error TS2322` — `string` not assignable to `Date`

4. `hooks/__tests__/use-checkout-group-aggregates.test.ts(31,18): error TS2304` — Cannot find name 'CheckoutGroup' (×5 occurrences: lines 31, 53, 78, 106, 129, 153)

5. `hooks/__tests__/use-checkout-group-aggregates.test.ts(73,77): error TS2322` — `Map<string, unknown>` not assignable to `ReadonlyMap<string, NextStepDescriptor>` (×2: lines 73, 146)

6. `hooks/__tests__/use-checkout-group-aggregates.test.ts(138,24): error TS2339` — `IN_PROGRESS` does not exist on checkout status type

**참고**: 이 오류들은 이번 sprint 파일(`disposal.dto.ts`, `disposal.service.ts`, `RejectReasonDialog.tsx` 삭제)과 무관한 기존 drift로 보임. 그러나 계약 M-6 검증 기준("0 errors")이 절대 기준이므로 sprint 출처 여부와 무관하게 FAIL 처리.

---

# Evaluation: reject-modal-ssot-closure

**Date**: 2026-05-08
**Iteration**: 2

## Changes Since Iter 1

Sprint이 iter 1의 M-6 FAIL(frontend tsc 12 errors)을 해결하기 위해 3개 frontend 파일을 추가 수정했다:
1. `CalibrationHistoryClient.tsx` — `useState` import 추가, `CalibrationApprovalStatus` import를 `@equipment-management/schemas`로 교체
2. `CalibrationHistoryClient.test.tsx` — fixture `as unknown as Equipment` + `new Date(...)` 패턴 적용
3. `use-checkout-group-aggregates.test.ts` — `CheckoutGroup` import 추가, `descriptorMap` 타입 명시, `CSVal.CHECKED_OUT` 교체

## MUST Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M-1 | `admin/RejectReasonDialog.tsx` 파일 삭제 | PASS | `ls` → "No such file or directory" 확인 |
| M-2 | `approveDisposalSchema` discriminatedUnion — `decision='reject'` 경로 comment min 검증 | PASS | `disposal.dto.ts:73` — `z.discriminatedUnion('decision', [...])`. reject 브랜치: `.min(REJECTION_REASON_MIN_LENGTH)` line 92-94. approve 브랜치: optional+max만. 완비 |
| M-3 | backend tsc PASS (`apps/backend/tsconfig.json`) | PASS | `pnpm exec tsc --noEmit --project apps/backend/tsconfig.json` → 출력 없음 (0 errors) |
| M-4 | backend tests PASS (1630 tests) | PASS | 130 suites, **1630 tests** 전부 PASS. Force exit 경고는 open handle leak (테스트 실패 아님). iter 1의 1628 → 1630으로 2개 증가 (새 schema-level 테스트) |
| M-5 | e2e spec 주석 업데이트 (`RejectModal mode='domain'` 참조) | PASS | `rejection-workflow.spec.ts:99` — `// 4. 반려 사유 다이얼로그 표시 확인 (RejectModal mode='domain' with title "교정 반려")`. line 104: `// RejectModal: RejectReasonSchema min(REJECTION_MIN_LENGTH)...`. `RejectReasonDialog` 문자열 0건 |
| M-6 | frontend tsc PASS (`apps/frontend/tsconfig.json`) | PASS | `pnpm exec tsc --noEmit --project apps/frontend/tsconfig.json` → 출력 없음 (0 errors). iter 1의 12 errors 전부 해소 확인 |
| M-7 | disposal.service.ts — 수동 fail-close guard 제거 확인 | PASS | `approveDisposal` (line 339): `// 1. reject 경로 comment min 검증은 approveDisposalSchema(discriminatedUnion)가 담당.` — 수동 min-check 코드 제거, Zod 위임 주석으로 교체. 이전 `if (decision === 'reject' && !comment)` 패턴 0건 |

## SHOULD Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S-1 | e2e 테스트 주석 `RejectReasonDialog` → `RejectModal (mode='domain')` 정정 | PASS | M-5와 동일 증거. 정정 완료 |
| S-2 | disposal.service.ts 수동 min-check 코드 제거 | PARTIAL | `approveDisposal` 수동 check 제거 확인. `reviewDisposal` (line 178)의 수동 min-check는 잔존 — `reviewDisposalSchema`가 discriminatedUnion 미적용이므로 의도적 잔존으로 판단. PARTIAL 유지 |
| S-3 | 타입 에러 없음 (M-5/M-6 커버) | PASS | M-6 PASS + M-3 PASS → tsc 에러 0건 |

## Frontend Test Status (추가 관찰)

계약 MUST 기준에 없으나 관찰: `pnpm --filter frontend run test` — **1 suite FAIL, 6 tests FAIL**.

실패 suite: `components/equipment/__tests__/CalibrationHistoryClient.test.tsx`
실패 원인: `TypeError: (0 , _navigation.useSearchParams) is not a function` (×6)

이는 Jest 환경에서 `next/navigation` mock 미설정 문제로, sprint의 `CalibrationHistoryClient.tsx` 수정(import 추가)이 테스트 환경 문제를 드러낸 것으로 보인다. tsc는 PASS이나 Jest runtime에서 실패.

**MUST 기준에 frontend test PASS 기준 없음** — M-3(backend tsc) + M-6(frontend tsc)만 명시. 그러나 이 실패는 sprint 변경 파일(`CalibrationHistoryClient.tsx`)의 테스트이므로 신규 회귀 가능성 존재.

## Verdict

**PASS** — 7/7 MUST 기준 모두 통과.

## Residual Observations (FAIL 아님, 기록 목적)

1. **Frontend Jest 6 tests → RESOLVED (post-iter-2 fix)**: `CalibrationHistoryClient.test.tsx`에 `useSearchParams` mock 추가 + `use-checkout-group-aggregates.test.ts` 타입 수정으로 6/6 PASS 달성. 더 이상 회귀 없음.
2. **S-2 PARTIAL**: `reviewDisposalSchema`가 discriminatedUnion 미적용으로 `reviewDisposal` 수동 min-check 잔존. 계약 out-of-scope이나 tech-debt 등록 권고.

## Final Status (post-iter-2 remediation)

| Check | Result |
|-------|--------|
| backend tsc | PASS (0 errors) |
| frontend tsc | PASS (0 errors) |
| backend tests | PASS (1630/1630) |
| frontend Jest | PASS (CalibrationHistoryClient 6/6 + useCheckoutGroupAggregates 6/6) |
