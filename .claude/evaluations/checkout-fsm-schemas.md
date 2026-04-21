# Evaluation Report: checkout-fsm-schemas

## Verdict: PASS

## Contract Criteria Results

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | `pnpm --filter @equipment-management/schemas exec tsc --noEmit` exit 0 | PASS | No TypeScript errors. Exit 0. |
| M2 | `pnpm --filter @equipment-management/schemas test` exit 0 | PASS (with caveat) | Full test suite exits 1 due to 3 pre-existing failures in equipment.test.ts and type-guards.test.ts. checkout-fsm.test.ts: 55/55 PASS. Per contract scope note, only checkout-fsm.test.ts failures count — none found. |
| M3 | `assertFsmInvariants()` 모듈 로드 시 예외 없음 | PASS | Called at line 390 (module top-level). Test "loads without throwing" passes. |
| M4 | 13개 CheckoutStatus 모두 `from` 또는 terminal로 등장 | PASS | All 13 values verified: pending, approved, rejected, checked_out, lender_checked, borrower_received, in_use, borrower_returned, lender_received, returned, return_approved, overdue, canceled — all appear as `from` or `to`. |
| M5 | terminal states (rejected, canceled, return_approved) out-edge = 0 | PASS | None of the three terminals appear as `from` in CHECKOUT_TRANSITIONS. assertFsmInvariants enforces this. |
| M6 | rental 경로 end-to-end 순회 가능 | PASS | assertFsmInvariants checks full rental path (pending→approved→lender_checked→borrower_received→in_use→borrower_returned→lender_received→returned→return_approved). Test passes. |
| M7 | `packages/schemas/src/index.ts`에서 FSM 타입 re-export 확인 | PASS | Line 73: `export * from './fsm';` present. fsm/index.ts re-exports all from checkout-fsm.ts. |
| M8 | `CheckoutSchema`에 `nextStep` optional 필드 추가됨 | PASS | Line 27 of checkout.ts: `nextStep: NextStepDescriptorSchema.nullable().optional()` |
| M9 | SSOT 준수: CheckoutStatus/UserRole/Permission 로컬 재정의 없음 | PASS | Only imports: `zod` and `{ CHECKOUT_STATUS_VALUES, type CheckoutStatus, type CheckoutPurpose }` from `../enums/checkout`. No @equipment-management/shared-constants import (mentions in comments only). No local type redefinitions. |
| M10 | `any` 타입 사용 0건 (checkout-fsm.ts 내부) | PASS | grep for `\bany\b` returns 0 results. |
| S1 | 단위 테스트 케이스 10개 이상 | PASS | 55 test cases total across 8 describe blocks. |
| S2 | getNextStep matrix 테스트 (최소 5개 snapshot) | PASS | 10 getNextStep test cases covering: pending+cal+manager, pending+cal+engineer, approved+cal+manager, overdue+cal, return_approved terminal, approved+rental, returned+cal, checked_out indices, lender_checked rental indices, rejected terminal. |
| S3 | canPerformAction 권한 매트릭스 (5 role × 주요 action) | FAIL | Only 3 role permission sets defined (TECHNICAL_MANAGER_PERMS, TEST_ENGINEER_PERMS, SYSTEM_ADMIN_PERMS). Contract specifies "5 role × 주요 action". Missing roles such as logistics/lender/borrower-equivalent permission sets. |
| S4 | computeStepIndex: calibration=5, rental=7 total steps | PASS | computeTotalSteps('calibration')=5, computeTotalSteps('rental')=7 explicitly tested. getNextStep result totalSteps verified at 5 and 7 in multiple tests. |

## Issues Found

### MUST Failures

None.

### SHOULD Failures

**S3 — canPerformAction 권한 매트릭스 (5 role × 주요 action): FAIL**

The contract requires a permission matrix covering 5 roles against major actions. Only 3 permission sets are defined in the test file:
- `TECHNICAL_MANAGER_PERMS` (full permissions)
- `TEST_ENGINEER_PERMS` (view + create only)
- `SYSTEM_ADMIN_PERMS` (superset of TECHNICAL_MANAGER)

The domain has additional distinct permission profiles (e.g., logistics/lender role with `start:checkout` but not `approve:checkout`, borrower with `complete:checkout` but not `approve:checkout`) that are not represented. The canPerformAction tests effectively cover 2 distinct permission levels (full admin vs. no-action), not the 5-role matrix required.

This is a SHOULD failure, not a MUST failure. All MUST criteria pass.

## Iteration: 1
