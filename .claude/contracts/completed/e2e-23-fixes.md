# Contract: E2E Test Fixes (2026-04-17)

## Scope

Fix 22 failing E2E tests across 7 backend test suites. All fixes are in test code unless a genuine service-level bug is discovered during investigation.

---

## MUST Criteria (All required for acceptance)

### M1: TypeScript Compilation
- `pnpm tsc --noEmit` MUST pass with zero errors

### M2: Backend Unit Tests
- `pnpm --filter backend run test` MUST pass (no regressions in unit tests)

### M3: All 22 Previously-Failing E2E Tests Pass
- `pnpm --filter backend run test:e2e --runInBand` MUST pass with zero failures
- Specifically, these 7 suites MUST all pass:
  - `calibration-plans.e2e-spec.ts` (8 tests)
  - `manager-role-constraint.e2e-spec.ts` (4 tests)
  - `equipment-approval.e2e-spec.ts` (3 file upload tests)
  - `non-conformances.e2e-spec.ts` (3 tests: rental blocking, 1:1 repair, status restoration)
  - `team-filter.e2e-spec.ts` (2 tests)
  - `equipment.e2e-spec.ts` (1 CRUD workflow test)
  - `auth.e2e-spec.ts` (1 login test)

### M4: No Regressions
- All 265 currently-passing E2E tests MUST continue to pass
- Total test count: 287 tests, 0 failures, 0 skipped (except pre-existing skip)

### M5: Seed Data Prerequisite Documented
- If fixes depend on seed data being loaded, the exec-plan or README MUST document that `pnpm --filter backend run test:e2e:setup` is required before running E2E tests

### M6: Surgical Changes Only
- No service-level code changes UNLESS a genuine production bug is confirmed
- No refactoring of adjacent code
- No changes to passing tests

---

## SHOULD Criteria (Strongly recommended)

### S1: CAS Version Handling
- Delete requests SHOULD explicitly pass `?version=N` from the latest response rather than relying on server-side version inference from cache

### S2: Test Isolation
- Tests that modify shared DB state (e.g., user names) SHOULD restore original state in afterAll cleanup

### S3: Meaningful Error Assertions
- File upload tests SHOULD assert on the specific error code/message, not just status codes

### S4: Repair Description Length
- Test data SHOULD meet minimum length requirements (10 chars for repairDescription) to avoid Zod validation failures

---

## MUST NOT Criteria (Violations are blocking)

### MN1: No Service Code Changes Without Bug Confirmation
- MUST NOT modify backend service code (*.service.ts, *.controller.ts) unless investigation confirms a real production bug (not just a test issue)

### MN2: No --no-verify or Hook Bypass
- MUST NOT use `--no-verify` on any git commands

### MN3: No Parallel Test Execution
- E2E tests MUST run with `--runInBand` — parallel execution causes DB state corruption

### MN4: No Seed Data in Test Code
- MUST NOT hardcode INSERT statements in individual test files to "fix" missing seed data. Instead, ensure the existing seed infrastructure (`db:seed`) is run.

### MN5: No SSOT Violations
- MUST NOT redefine types, enums, or constants locally. Import from `@equipment-management/schemas` or `@equipment-management/shared-constants`.

---

## Verification Commands

```bash
# Step 1: Ensure seed data
pnpm --filter backend run test:e2e:setup

# Step 2: TypeScript check
pnpm tsc --noEmit

# Step 3: Unit tests
pnpm --filter backend run test

# Step 4: E2E tests (final gate)
pnpm --filter backend run test:e2e --runInBand
# Expected: Test Suites: 22 passed, 22 total
# Expected: Tests: 0 failed, 287 total (approximately)
```

---

## Risk Factors

| Risk | Mitigation |
|------|-----------|
| Calibration plans 400 root cause unclear | Phase 0 investigation before fixing |
| NC status restoration may be a real service bug | Trace data state; fix in service ONLY if confirmed |
| Seed data dependency makes tests fragile | Document prerequisite; consider jest globalSetup auto-seed |
| Auth test name assertion is inherently fragile | Recommend cleanup pattern over relaxed assertion |
