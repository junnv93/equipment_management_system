# Evaluation Report: frontend-error-enum-ssot-migration

## Verdict

PASS

## Independent Evaluation

Iteration 1 failed on public compatibility and the `CalibrationFileLimitExceeded` HTTP status choice. Iteration 2 fixed both:

- `apps/frontend/lib/errors/calibration-errors.ts` has no local `export enum CalibrationErrorCode`.
- `CalibrationErrorCode` remains available as a schema-backed value alias for existing `CalibrationErrorCode.FILE_REQUIRED` style imports.
- `CALIBRATION_ERROR_I18N_KEY` uses schemas `CALIBRATION_ERROR_CODES`, which are defined from `ErrorCode.*`.
- Added calibration backend codes are present in `ErrorCode` and `errorCodeToStatusCode`.
- `CalibrationFileLimitExceeded` maps to 400, within the contract SHOULD range.
- `equipment-errors.ts` keeps `EquipmentErrorCode` as a frontend UI taxonomy while using schemas `ErrorCode.*` computed keys for schema-owned backend routes.
- Previous raw mapper blockers `NC_NOT_FOUND` and `VERSION_REQUIRED` are routed through `ErrorCode.NonConformanceNotFound` and `ErrorCode.EquipmentImportVersionRequired`.

## Commands

- `pnpm --filter frontend test -- --runTestsByPath apps/frontend/lib/errors/__tests__/calibration-errors.test.ts apps/frontend/lib/errors/__tests__/equipment-errors.test.ts` — PASS, 2 suites / 35 tests
- `pnpm --filter frontend run type-check` — PASS
- `pnpm --filter frontend run lint` — PASS
- `pnpm --filter schemas run build` — PASS

## Residual Risk

Focused verification only. Full frontend build and repo-wide tests were not rerun in this iteration.
