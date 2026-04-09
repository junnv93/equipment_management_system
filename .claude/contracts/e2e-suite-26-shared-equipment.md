# Contract — E2E Suite-26 공용장비 전용 워크플로우

## MUST (blocking)

- [ ] `pnpm tsc --noEmit` clean across the entire workspace.
- [ ] `pnpm --filter backend run test` passes with 551+ tests (baseline preserved; no backend source changes).
- [ ] New suite `apps/frontend/tests/e2e/features/checkouts/suite-26-shared-equipment/` runs on chromium and all non-fixme cases PASS (5 cases: S26-01 ~ S26-05).
- [ ] Every `test.describe` / `beforeEach` in the new suite includes chromium project gating (pattern: `test.skip(testInfo.project.name !== 'chromium', ...)`).
- [ ] Any VERSION_CONFLICT reference is via `ErrorCode.VersionConflict` from `@equipment-management/schemas` — no local string literals (SSOT per `bc7565cb`).
- [ ] `git diff apps/backend/src/database/seed-data` is EMPTY. No seed modifications.
- [ ] No hardcoded equipment UUIDs in spec files — all equipment references go through `TEST_EQUIPMENT_IDS` from `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts`.
- [ ] Helper additions live in existing `checkout-helpers.ts` only — no new helper files; no duplication (verify via grep before adding).
- [ ] `checkout-helpers.ts` additions reuse existing `getCheckoutPool()` / `getBackendToken()` patterns.
- [ ] Every `test.fixme` case cites a specific backend `file:line` in a comment directly above the fixme call.
- [ ] Suite-23/24/25 regression: all still pass on chromium after the new additions.

## SHOULD (non-blocking)

- [ ] `docs/manual/checkout-import-scenarios.md` gains a `## Suite-26 공용장비 전용 워크플로우` section parallel to suite-23/24/25 (pre-conditions, steps, expected DB state, known gaps).
- [ ] Overdue auto-transition gap documented with `checkout-overdue-scheduler.ts:60` anchor (not faked).
- [ ] Spec file uses `test.describe.configure({ mode: 'serial' })` for isolation.
- [ ] `afterEach` resets `NETWORK_ANALYZER_SUW_E` via `cancelAllActiveCheckoutsForEquipment` + `resetEquipmentToAvailable` (suite-24 pattern).
- [ ] Test case names consistent with suite-24 style.

## Verification Commands

```bash
pnpm tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-26-shared-equipment
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-23-cross-site-rbac tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery tests/e2e/features/checkouts/suite-25-cas-concurrent-approval
git diff --exit-code apps/backend/src/database/seed-data
```

## Out of Scope

- Backend changes to `checkouts.service.ts`, `equipment.service.ts`, schedulers.
- Exposing a HTTP trigger for `CheckoutOverdueScheduler` (separate backend PR).
- Adding `isShared` branching logic in any service.
- Renaming / deleting `TEST_EQUIPMENT_IDS` keys.
