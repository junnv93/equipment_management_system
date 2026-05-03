# Architecture Review: ErrorCode Defense-in-Depth Chain

## Findings

### Warning: Disposal review-stage rejection has no service-layer fail-close

- **Files**:
  - `apps/backend/src/modules/equipment/dto/disposal.dto.ts:45`
  - `apps/backend/src/modules/equipment/services/disposal.service.ts:171`
  - `apps/backend/src/modules/equipment/services/disposal.service.ts:243`
- **Issue**: `reviewDisposalSchema` requires `opinion` to be trimmed and at least `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`, so the controller path rejects weak review opinions. However, `DisposalService.reviewDisposal()` does not re-check this invariant before the reject branch writes `rejectionReason: reviewDto.opinion`.
- **Impact**: A direct service caller, worker, admin script, or future internal API that bypasses `DisposalController.reviewDisposal()` can record a disposal review rejection with an empty or too-short reason. This weakens the requested service fail-close layer for disposal rejection. Final approval rejection is protected separately by `approveDisposal()` at `apps/backend/src/modules/equipment/services/disposal.service.ts:331`.
- **Recommendation**: Add the same reject-branch fail-close guard to `reviewDisposal()` before the transaction, using the same minimum length constant and a domain ErrorCode. If a new ErrorCode is introduced, route it through `packages/schemas/src/errors.ts`, `SECURITY_AUDITABLE_CODES`, and the frontend disposal mapper.

### Info: Calibration-plan service validates trimmed reason but persists the original payload on non-controller entry

- **Files**:
  - `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:692`
  - `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:703`
  - `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:713`
- **Issue**: The service computes `trimmedReason` and fail-closes on its length, but then persists `rejectionReason` from the original DTO. The controller path is normalized by Zod `.trim()` at `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts:77`, so this only matters for direct service callers.
- **Impact**: Not a bypass of minimum length, but service-layer canonicalization is asymmetric: direct callers can store leading/trailing whitespace that controller callers cannot.
- **Recommendation**: Persist and emit `trimmedReason` in `reject()` for service-layer symmetry.

## Layer Review

| Layer | Disposal rejection / fail-close | Calibration-plan rejection / fail-close |
|---|---|---|
| Zod DTO validation | **Partial**. Review rejection is protected by `reviewDisposalSchema.opinion.trim().min(...)` at `apps/backend/src/modules/equipment/dto/disposal.dto.ts:45`. Final approval rejection intentionally cannot be fully expressed in Zod because `comment` is optional for approval and required only for reject; schema only trims/maxes at `apps/backend/src/modules/equipment/dto/disposal.dto.ts:70`. | **PASS**. `rejectCalibrationPlanSchema.rejectionReason` applies `.trim().min(...).max(...)` at `apps/backend/src/modules/calibration-plans/dto/approve-calibration-plan.dto.ts:75`. |
| Service fail-close | **Partial / Warning**. Final approval rejection fail-closes with `ErrorCode.DisposalRejectCommentRequired` at `apps/backend/src/modules/equipment/services/disposal.service.ts:331`. Review-stage rejection lacks the same direct service guard at `apps/backend/src/modules/equipment/services/disposal.service.ts:243`. | **PASS with minor canonicalization gap**. Invalid status uses `ErrorCode.CalibrationPlanInvalidStatusForReject` at `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:682`; short reason uses `ErrorCode.CalibrationPlanRejectionReasonRequired` at `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts:692`. |
| Controller/API response path | **PASS** for covered controller paths. `reviewDisposal()` and `approveDisposal()` both use `ZodValidationPipe` and return service promises directly, preserving thrown exceptions for the global filter at `apps/backend/src/modules/equipment/disposal.controller.ts:113` and `apps/backend/src/modules/equipment/disposal.controller.ts:152`. | **PASS**. `reject()` uses `RejectCalibrationPlanValidationPipe`, injects `rejectedBy` from JWT, and returns the service promise directly at `apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts:301`. |
| GlobalExceptionFilter | **PASS**. Custom `HttpException` response `code` is preserved at `apps/backend/src/common/filters/error.filter.ts:63`; `DisposalRejectCommentRequired` is security-auditable at `apps/backend/src/common/constants/security-auditable-codes.ts:43`. | **PASS**. Custom codes are preserved by the same filter; `CalibrationPlanRejectionReasonRequired` and `CalibrationPlanInvalidStatusForReject` are auditable at `apps/backend/src/common/constants/security-auditable-codes.ts:48`. |
| Frontend mapper / i18n routing | **PASS**. `mapDisposalErrorToToast()` maps disposal ErrorCodes at `apps/frontend/lib/errors/disposal-errors.ts:50`; `DisposalApprovalDialog` uses it in mutation `onError` at `apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx:92`; ko/en i18n keys exist at `apps/frontend/messages/ko/disposal.json:171` and `apps/frontend/messages/en/disposal.json:171`. | **PASS**. `mapCalibrationPlanErrorToToast()` maps plan ErrorCodes at `apps/frontend/lib/errors/calibration-plan-errors.ts:19`; `CalibrationPlanDetailClient` uses it for reject mutation errors at `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx:227`; ko/en `planErrors` keys exist at `apps/frontend/messages/ko/calibration.json:954` and `apps/frontend/messages/en/calibration.json:989`. |

## ErrorCode Routing

- Disposal ErrorCodes are defined at `packages/schemas/src/errors.ts:132` and status-mapped at `packages/schemas/src/errors.ts:757`.
- Calibration-plan ErrorCodes are defined at `packages/schemas/src/errors.ts:152` and status-mapped at `packages/schemas/src/errors.ts:767`.
- `GlobalExceptionFilter` preserves custom `code` values for Nest `HttpException` payloads at `apps/backend/src/common/filters/error.filter.ts:63`, so service-thrown `BadRequestException({ code: ErrorCode.X, ... })` reaches frontend mappers without collapsing to generic `BadRequest`.

## Residual Risks / Test Gaps

- No calibration-plan unit test currently asserts the service-layer fail-close for `CalibrationPlanRejectionReasonRequired`; repository search found no calibration-plan service spec covering this code path.
- Disposal has unit coverage for final approval rejection fail-close in `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts`, but review-stage rejection lacks direct service-layer fail-close and therefore lacks meaningful service-level coverage.
- Frontend mapper behavior appears wired, but this review did not run frontend mapper unit tests.

## Contract MUST Criteria

| MUST criterion | Status | Evidence |
|---|---|---|
| Produce an architecture review report for the ErrorCode defense-in-depth chain introduced by `error-codes-ssot-system-wide`. | PASS | This report traces ErrorCode definition, status mapping, backend throw path, exception filter preservation, and frontend mapper/i18n routing. |
| Review must cover Zod DTO validation, Service fail-close, Controller/API response path, GlobalExceptionFilter, Frontend mapper/i18n routing. | PASS | See "Layer Review" matrix. |
| Review must explicitly cover disposal and calibration-plan rejection/fail-close paths. | PASS | See "Findings" and both columns of the layer matrix. |
| Findings must be severity-labeled; if no issues are found, the report must state residual risk/test gaps. | PASS | Findings are labeled `Warning` and `Info`; residual risks/test gaps are listed. |
