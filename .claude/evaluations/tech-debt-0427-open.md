# Evaluation Report: tech-debt-0427-open
Date: 2026-04-27
Iteration: 1

## Build Results

| Command | Result | Notes |
|---------|--------|-------|
| `pnpm --filter @equipment-management/shared-constants build` | PASS | exit 0 |
| `pnpm --filter @equipment-management/schemas build` | PASS | exit 0 |
| `pnpm --filter backend exec tsc --noEmit` | PASS | 0 errors |
| `pnpm --filter frontend exec tsc --noEmit` | PASS | 0 errors |
| `pnpm --filter backend run test` | PASS | 73 suites, 947 tests passed |
| `pnpm --filter @equipment-management/schemas test` | PASS | 7 suites, 695 tests passed |

## MUST Criteria Results

| Criterion | Result | Evidence |
|-----------|--------|---------|
| shared-constants build exit 0 | PASS | Confirmed above |
| schemas build exit 0 | PASS | Confirmed above |
| backend tsc 0 error | PASS | Confirmed above |
| frontend tsc 0 error | PASS | Confirmed above |
| backend test PASS | PASS | 947 tests, 0 failures |
| **P1-1** `UseCheckoutNextStepInput.terminatedFromStatus?: CheckoutStatus \| null` | PASS | `hooks/use-checkout-next-step.ts` line 21 |
| **P1-1** `getNextStep(...)` 호출에 `terminatedFromStatus` 전달 | PASS | Line 50: `getNextStep({ status, purpose, dueAt, terminatedFromStatus }, permissions)` |
| **P1-1** `useMemo` deps 배열에 `terminatedFromStatus` 포함 | PASS | Line 51: `[status, purpose, dueAt, terminatedFromStatus, nextStep, permissions]` |
| **P1-2** `selfInspDetail as { version?: number }` 패턴 grep 0 hit | PASS | No match in `approvals-api.ts` |
| **P1-2** `selfInspRejectDetail as { version?: number }` 패턴 grep 0 hit | PASS | No match in `approvals-api.ts` |
| **P1-2** `case 'self_inspection'`이 명시적 interface 타입 사용 | PASS | Line 851: `apiClient.get<SelfInspectionDetail>()`, line 961: same pattern. `SelfInspectionDetail` interface defined at line 125 |
| **P1-3** `approveValidationSchema`에 `approvalComment` optional 존재 | PASS | `approve-validation.dto.ts` line 10: `approvalComment: z.string().trim().max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH).optional()` |
| **P1-3** `softwareValidationApi.approve(id, version, approvalComment?)` 3-arity | PASS | `software-api.ts` lines 239–245: `approve: async (id, version, approvalComment?: string)` |
| **P1-3** `TAB_META.software_validation.commentRequired === true` | PASS | `approvals-api.ts` line 323: `commentRequired: true` |
| **P1-3** `case 'software_validation'` approve에서 `comment` 전달 | PASS | Line 906: `softwareValidationApi.approve(id, validation.version, comment \|\| undefined)` |
| **P1-4** `APPROVAL_REVOCATION_WINDOW_MS = 300_000` in `business-rules.ts` | PASS | Line 185: `export const APPROVAL_REVOCATION_WINDOW_MS = 300_000;` |
| **P1-4** `packages/shared-constants/src/index.ts` re-export | PASS | Lines 174–175: exported from `'./business-rules'` |
| **P1-4** `checkouts.service.ts` 로컬 `const REVOCATION_WINDOW_MS = 300_000` 제거 | PASS | No `const REVOCATION_WINDOW_MS` present; only `APPROVAL_REVOCATION_WINDOW_MS` import used |
| **P1-4** `checkouts.service.ts`에 `APPROVAL_REVOCATION_WINDOW_MS` import + 사용 | PASS | Line 54: imported; line 3206: used in comparison |
| **P1-5** `apps/frontend/app/not-found.tsx` `href="/"` 0건 | PASS | Uses `FRONTEND_ROUTES.DASHBOARD` (line 25) |
| **P1-5** `equipment/[id]/not-found.tsx` `href="/"` 0건 | PASS | Uses `FRONTEND_ROUTES.DASHBOARD` (line 42) |
| **P1-5** `non-conformances/[id]/not-found.tsx` `href="/"` 0건 | PASS | Uses `FRONTEND_ROUTES.DASHBOARD` (line 29) |
| **P1-5** `calibration-plans/[uuid]/not-found.tsx` `href="/"` 0건 | PASS | Uses `FRONTEND_ROUTES.DASHBOARD` (line 29) |
| **P1-6** `CreateEquipmentImportForm.tsx` handleSubmit가 `React.SyntheticEvent<HTMLFormElement>` | PASS | Line 113: `const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>)` |
| **P1-6** `React.FormEvent` grep 0 hit | PASS | No match in `CreateEquipmentImportForm.tsx` |
| **P1-7** `RejectReasonSchema`가 `.min(REJECTION_MIN_LENGTH)` 사용 | PASS | Line 223: `.min(REJECTION_MIN_LENGTH, ...)` |
| **P1-7** `RejectReasonSchema`에 `.min(1)` 단독 사용 없음 | PASS | Line 169 is a comment only; no standalone `.min(1)` in schema code |
| **P1-7** ko `approvals.json` `rejectModal.validation` 메시지 정확 | PASS | `"rejectModal.validation": "반려 사유는 {min}자 이상 입력해주세요."` — uses `{min}` placeholder |
| **P1-7** ko `approvals.json` `bulk.rejectValidation` 메시지 정확 | PASS | `"bulk.rejectValidation": "반려 사유는 {min}자 이상 입력해주세요."` — uses `{min}` placeholder |
| **P1-9** approve 메서드 `@AuditLog({ action: 'approve', ... })` | PASS | `self-inspections.controller.ts` line 222 |
| **P1-9** reject 메서드 `@AuditLog({ action: 'reject', ... })` | PASS | Line 239 |
| **P1-10** `packages/schemas/scripts/gen-descriptor-table.ts` 존재 | PASS | File confirmed |
| **P1-10** `package.json` scripts에 `gen:descriptor-table` 등록 | PASS | Line 12: `"gen:descriptor-table": "tsx scripts/gen-descriptor-table.ts"` |
| **P1-10** schemas tests PASS | PASS | 695 tests, 0 failures |
| **P1-11** `LabelSizePreset` type에 `'micro'` 포함 | PASS | `qr-config.ts` line 241 |
| **P1-11** `LABEL_SIZE_PRESETS.micro` 정의 존재 | PASS | Line 274: `micro: { widthMm: 30, heightMm: 12, qrSizeMm: 8 }` |
| **P1-11** `LABEL_SAMPLER_LAYOUT.micro` 정의 존재 | PASS | Line 337: `micro: { rows: 1, cols: 1 }` |
| **P1-11** `getSamplerPresetOrder()` return에 `'micro'` 포함 | PASS | Line 372: `return ['xl', 'large', 'medium', 'small', 'xs', 'xxs', 'micro']` |

## SHOULD Criteria Results

| Criterion | Result | Notes |
|-----------|--------|-------|
| Tracker 완료 항목 [x] 마킹 정확 | PASS | `tech-debt-tracker-archive.md` lines 21–30: 10개 항목 [x] 마킹 확인 |
| Archive 이동 항목 원문 보존 | PASS | 2026-04-27 섹션 존재, 원문 보존 확인 |
| 변경 파일에 `any` 신규 추가 0건 | PASS | 핵심 수정 파일 전수 grep — 0 hit |
| 변경 파일에 `eslint-disable` 신규 추가 0건 | PASS | 핵심 수정 파일 전수 grep — 0 hit |
| TAB_META.software_validation 주석 AR-14 반영 | PASS | `approvals-api.ts` line 322: `// AR-14: backend approveValidationSchema에 approvalComment 추가 완료 (2026-04-27).` |

## Verdict

PASS

## Issues Found

없음. 모든 MUST 기준 통과. SHOULD 기준 전항목 통과.
