# Evaluation Report: backend-errorcode-full-closure
Date: 2026-05-03
Iteration: 1

## MUST Criteria

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1 NC bug | PASS | string literal `'NON_CONFORMANCE_NOT_FOUND'` = 0; `ErrorCode.NonConformanceNotFound` = 6 usages |
| M2 enum | PASS | Auth enum entries = 18 (≥17); domain keys (CheckoutNotFound/DocumentNotFound/TeamNameAlreadyExists/UserEmailAlreadyExists/InspectionTemplateNotFound/NotificationNotFound/CableLossMeasurementNotFound/TestSoftwareEquipmentAlreadyLinked) = 8 unique entries confirmed; schemas build exit 0 |
| M3 inline 0 | PASS | `grep -rn "code: '[A-Z_]\+'" apps/backend/src --include="*.ts" \| grep -v spec/test` → 0 lines |
| M4 dirs 0 | PASS | common/auth/approvals = 0; users/teams/documents/calibration = 0; nc/intermediate/self/checkouts/inspection-templates/notifications/reports/equipment-imports/software-validations/test-software/cables = 0 |
| M5 NotFound | PASS | All 8 patterns matched ≥1 in `equipment-errors.ts`: CABLE_NOT_FOUND, NC_NOT_FOUND, SOFTWARE_VALIDATION_NOT_FOUND, TEST_SOFTWARE_NOT_FOUND, INTERMEDIATE_INSPECTION_NOT_FOUND, SELF_INSPECTION_NOT_FOUND, TEST_PLAN_NOT_FOUND, ENTITY_NOT_FOUND — each returned 1 |
| M6 mappers | PASS | All 5 files exist; all 5 contain the required mapping function pattern (grep -l returned 5 files) |
| M7 i18n | PASS | non-conformances ko=1 en=1; checkouts ko=1 en=1; notifications ko=1 en=1; teams ko=1 en=1; users ko=1 en=1 |
| M8 build | PASS | `pnpm --filter schemas run build` exit 0 |
| M9 test | PASS | 83 suites / 1133 tests passed (independent run confirmed) |
| M10 test | PASS | 36 suites / 412 tests passed (independent run confirmed) |
| M11 NC codes | PASS | 6 NC codes confirmed in `non-conformance-errors.ts` (≥5): NonConformanceNotFound, NcTypeRequired, NcEquipmentAlreadyNonConforming, NcRepairRecordRequired, NcRecalibrationRequired, NcRepairAlreadyLinked |

## Overall Verdict
PASS

## Issues Found
None. All 11 MUST criteria passed.

## SHOULD Criteria Observations

1. **`cable-errors.ts` is a thin re-export wrapper** — The file at `apps/frontend/lib/errors/cable-errors.ts` does not implement its own domain mapper; it re-exports `mapCableErrorToToast` from `cables-errors.ts` and also aliases it as `mapBackendErrorCode`. This technically satisfies M6 (the function name pattern exists), but introduces a naming inconsistency: the actual implementation lives in `cables-errors.ts` (plural) while the canonical file is `cable-errors.ts` (singular). A future reader may not immediately know which is the SSOT.

2. **`user-errors.ts` has a stub `mapBackendErrorCode`** — The function `mapBackendErrorCode` in `user-errors.ts` (line 40-42) simply returns `code ?? 'UNKNOWN_ERROR'` without consulting the `USER_ERROR_I18N_KEYS` map. This means callers using `mapBackendErrorCode` directly (rather than `mapUserErrorToToast`) will get no domain-specific routing. The more useful `mapUserErrorToToast` exists and is the intended function, but the stub may silently mislead future developers who reach for `mapBackendErrorCode` by analogy with other mappers.

3. **`non-conformance-errors.ts` does not export `mapBackendErrorCode`** — Only `mapNonConformanceErrorToToast` is exported. This is not a contract violation (M6 only checks the 5 new files), but creates an inconsistency with the other mappers that do export `mapBackendErrorCode`.

4. **Auth enum count = 18, not 17** — The spec threshold is ≥17, so this is fine. Confirmed: `AuthUserNotFound` was counted in addition to the 17 named patterns, giving 18 total. No concern.
