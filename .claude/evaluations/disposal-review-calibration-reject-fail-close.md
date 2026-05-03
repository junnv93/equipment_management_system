# Evaluation: disposal-review-calibration-reject-fail-close

Result: PASS

## Contract Clauses Checked

- `DisposalService.reviewDisposal()` fail-closes before DB mutation for reject decisions with missing, blank, whitespace-only, or below-min trimmed opinions: `apps/backend/src/modules/equipment/services/disposal.service.ts:176`.
- Disposal fail-close throws `BadRequestException` with `ErrorCode.DisposalRejectCommentRequired`: `apps/backend/src/modules/equipment/services/disposal.service.ts:181`.
- Disposal review persists trimmed `reviewOpinion` / `rejectionReason` and emits trimmed rejection `reason`: `apps/backend/src/modules/equipment/services/disposal.service.ts:248`, `apps/backend/src/modules/equipment/services/disposal.service.ts:264`, `apps/backend/src/modules/equipment/services/disposal.service.ts:314`.
- `CalibrationPlansService.reject()` persists `trimmedReason` instead of the raw direct-caller payload: `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:692`, `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:713`.
- Calibration plan rejection notification payload emits `trimmedReason`: `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:729`.
- Focused tests cover disposal service-layer guard and trim canonicalization: `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts:185`, `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans.service.spec.ts:296`.

## Commands Run

- `pnpm --filter backend test -- disposal.service.spec.ts calibration-plans.service.spec.ts`
  - PASS: 2 suites passed, 57 tests passed.
- `pnpm --filter backend run type-check`
  - PASS: `tsc --noEmit` completed successfully.

## Residual Risk

- Review was intentionally scoped to the two contract services/specs and focused backend verification. Broader unrelated dirty files in the workspace were not evaluated.
