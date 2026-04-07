# Contract: software-export

## MUST Criteria (loop-blocking)

| ID | Criterion | Verification |
|----|-----------|-------------|
| M1 | `tsc --noEmit` passes with 0 NEW errors (pre-existing errors excluded) | `npx tsc --noEmit` |
| M2 | QP-18-07 exporter registered in `exporters` map and method exists | Grep for `UL-QP-18-07` in form-template-export.service.ts |
| M3 | QP-18-09 exporter registered in `exporters` map and method exists | Grep for `UL-QP-18-09` in form-template-export.service.ts |
| M4 | QP-18-07 exports 11 columns matching procedure fields exactly | Code review: managementNumber, name, softwareVersion, testField, primaryManager, secondaryManager, installedAt, manufacturer, location, availability, requiresValidation |
| M5 | QP-18-09 handles both `vendor` and `self` validation types | Code review: branch on `validationType` |
| M6 | QP-18-09 parses JSONB function arrays defensively | Code review: `Array.isArray()` guard on acquisitionFunctions/processingFunctions/controlFunctions |
| M7 | form-catalog.ts marks both forms as `implemented: true` | Grep form-catalog.ts |
| M8 | No hardcoded Korean labels — use SSOT label maps | verify-hardcoding check |
| M9 | `availability` uses `SOFTWARE_AVAILABILITY_LABELS` from schemas package | Import check |
| M10 | `requiresValidation` maps to `X`(대상)/`O`(미대상) per procedure convention | Code review |

## SHOULD Criteria (non-blocking, tracked in tech-debt)

| ID | Criterion |
|----|-----------|
| S1 | Site-scoped filtering on QP-18-07 export follows DATA_SCOPE pattern |
| S2 | QP-18-09 signature insertion uses existing `insertDocxSignature()` helper |
| S3 | Seed data: all 75 test_software records match procedure table P0001~P0073 exactly |
