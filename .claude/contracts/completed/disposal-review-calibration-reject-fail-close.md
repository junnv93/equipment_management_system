# Contract: disposal-review-calibration-reject-fail-close

## Scope

Close two review-architecture follow-ups without changing product policy:

- `disposal-review-stage-service-fail-close`
- `calibration-plan-reject-trim-canonicalization`

## MUST

- `DisposalService.reviewDisposal()` MUST fail-close before DB mutation when `decision === 'reject'` and `opinion.trim().length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`.
- The disposal fail-close error MUST be `BadRequestException` with `ErrorCode.DisposalRejectCommentRequired`.
- `DisposalService.reviewDisposal()` MUST persist and emit the trimmed review opinion/rejection reason.
- `CalibrationPlansService.reject()` MUST persist `trimmedReason` instead of the raw direct-caller payload.
- `CalibrationPlansService.reject()` MUST emit notification/audit payloads using `trimmedReason`.
- Focused backend tests MUST cover the new disposal service-layer guard and calibration trim canonicalization.

## SHOULD

- Keep changes scoped to the relevant backend services/tests and tracker/harness bookkeeping.
- Preserve existing DTO/controller validation behavior.

## Verification

- Run focused backend tests covering:
  - `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts`
  - `apps/backend/src/modules/calibration-plans/__tests__/calibration-plans.service.spec.ts`
- Harness evaluator must return PASS before moving this contract to `completed/`.
