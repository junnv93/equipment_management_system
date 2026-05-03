# Evaluation: lab-manager-explicit-permission-spec-closure

**Contract**: `.claude/contracts/completed/lab-manager-explicit-permission-spec-closure.md`
**Date**: 2026-05-03
**Mode**: 0
**Verdict**: PASS

## Verification Commands

```bash
test $(grep -c "^[[:space:]]*it(" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts) -ge 6
test $(grep -c "UL-QP-18" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts) -ge 2
test $(grep -c "getTokenForPermission" apps/backend/test/lab-manager-permission-scope.e2e-spec.ts) -ge 1
pnpm --filter backend run test:e2e lab-manager-permission-scope
```

## Results

- Static checks: PASS.
- Focused E2E: PASS — 1 suite, 6 tests.
- First sandboxed E2E run failed in `jest-global-setup` because DB/localhost access was unavailable; rerun with approved backend E2E command prefix passed.

## MUST Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| M1 Spec exists | PASS | `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts` exists. |
| M2 Coverage matches tracker intent | PASS | 6 `it(...)` cases; UL-QP-18 references; TC-2 verifies CREATE_EQUIPMENT denial; TC-2~TC-4 assert `AUTH_INSUFFICIENT_PERMISSIONS`. |
| M3 Permission helper dogfooding | PASS | `getTokenForPermission()` used to resolve lab_manager via `APPROVE_CALIBRATION_PLAN`; TC-5 covers final approval boundary. |
| M4 Current verification passes | PASS | Static grep checks and focused backend E2E passed. |
| M5 Tracker lifecycle | PASS | Tracker Open item removed and batch history records `lab-manager-explicit-permission-spec-closure`. |

## SHOULD Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| S1 No code churn | PASS | Closure only adds harness docs and updates tracker/registry. Existing spec code is unchanged. |
