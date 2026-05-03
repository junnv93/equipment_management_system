# Contract: lab-manager-explicit-permission-spec-closure

**Mode**: 0 (Stale tracker closure)
**Domain**: backend E2E permission regression coverage
**Date**: 2026-05-03

## Purpose

Close the stale tech-debt tracker item:

`[2026-04-30 stale-cleanup] MEDIUM lab-manager-explicit-permission-spec-신규`

The requested lab_manager explicit permission regression spec already exists from `senior-permission-ssot-20260501`. This contract records current-state verification and tracker lifecycle closure without modifying production or test code.

## MUST Criteria

### M1. Spec exists
- `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` exists.

### M2. Coverage matches tracker intent
- Spec contains at least 6 test cases.
- Spec explicitly references UL-QP-18 duty separation.
- Spec verifies lab_manager cannot create equipment.
- Spec verifies `AUTH_INSUFFICIENT_PERMISSIONS` for denied permissions.

### M3. Permission helper dogfooding
- Spec uses `getTokenForPermission()`.
- Spec includes a positive boundary for `APPROVE_CALIBRATION_PLAN`.

### M4. Current verification passes
- Static grep checks pass.
- Focused backend E2E `pnpm --filter backend run test:e2e lab-manager-permission-scope` passes.

### M5. Tracker lifecycle
- `lab-manager-explicit-permission-spec-신규` is removed from Open items or marked completed.
- Batch history records `lab-manager-explicit-permission-spec-closure`.

## SHOULD Criteria

### S1. No code churn
- No production or test code changes are introduced for this closure.
