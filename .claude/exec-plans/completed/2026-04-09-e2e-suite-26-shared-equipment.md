# Exec Plan — Suite-26 공용장비 전용 워크플로우

- Date: 2026-04-09
- Owner: harness (Planner → Generator → Evaluator)
- Scope: new Playwright E2E suite covering shared equipment (`isShared=true`) checkout workflow
- Precedent: suite-23/24/25 (commit `de481327`), SSOT update `bc7565cb`

## Phase 0 — Investigation Summary (findings; no code)

- **Seed (sufficient, no modification)**: `NETWORK_ANALYZER_SUW_E` (SUW FCC_EMC_RF), `OSCILLOSCOPE_SUW_R` (SUW General EMC), `TRANSMITTER_UIW_W` (Uiwang) are `isShared=true` and available. `MEASUREMENT_STAND_SUW_S` exists in seed but is NOT in `TEST_EQUIPMENT_IDS` constants — do not add.
- **Backend filter**: `equipment.service.ts:230` + `equipment-query.dto.ts:126` honor `?isShared=true`.
- **Checkouts pipeline**: `checkouts.service.ts` has **zero** `isShared` branching. Shared equipment traverses the standard PENDING → APPROVED → CHECKED_OUT → RETURNED lifecycle. Suite-26 is a **characterization + regression lock**, not a gap-fill.
- **Overdue**: `modules/notifications/schedulers/checkout-overdue-scheduler.ts` — `@Cron(EVERY_HOUR)` + `onModuleInit` immediate run. Transitions `checked_out → overdue` when `expectedReturnDate < now`. **No HTTP trigger** — E2E cannot force re-run within a single test. → document as `test.fixme` with backend file:line citation.
- **Rejection recovery**: `checkouts.service.ts:1415 reject()` does not mutate `equipment.status`. PENDING checkouts never transition equipment to `checked_out` in the first place → shared equipment is trivially "recovered" after reject. Characterization test locks this invariant.
- **Existing coverage**: `group-a-filter-shared.spec.ts` (equipment list filter), `shared-equipment-banner.spec.ts` (detail banner UI), `wf-07-rental-checkout-full-cycle`, `wf-17-checkout-overdue-return`. **No E2E covers the shared-equipment checkout workflow end-to-end**. No duplication.

## Phase 1 — Helper extensions

**File (MODIFY)**: `apps/frontend/tests/e2e/features/checkouts/helpers/checkout-helpers.ts`

Before adding, grep existing exports to avoid duplication. Additions (only those not already present):

1. `createPendingSharedCheckout(page, token, opts: { equipmentId, purpose })` — guards via GET `/equipment/:id` assertion `isShared === true`, then delegates to existing `createPendingCalibrationCheckout` / `createPendingRentalCheckout`. Fail-fast if equipment not shared.
2. `listSharedEquipment(page, token, siteFilter?)` — GET `/equipment?isShared=true[&site=...]`, returns typed array.
3. `startCheckoutAsUser(page, token, checkoutId, version)` — POST `/checkouts/:id/start` (skip if wrapper already exists).
4. `returnCheckoutAsUser(page, token, checkoutId, version)` — POST `/checkouts/:id/return` (skip if wrapper already exists).

Helper additions MUST reuse `getCheckoutPool()` and `getBackendToken()` patterns already in the file. No new helper files.

**Verification**: `pnpm tsc --noEmit` clean.

## Phase 2 — Spec file

**File (CREATE)**: `apps/frontend/tests/e2e/features/checkouts/suite-26-shared-equipment/s26-shared-equipment.spec.ts`

Header pattern mirrors suite-24 (chromium gating via `test.skip(testInfo.project.name !== 'chromium', ...)` + `test.describe.configure({ mode: 'serial' })` + `afterEach` recovery using `cancelAllActiveCheckoutsForEquipment` + `resetEquipmentToAvailable`).

Primary equipment: `TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E`. Cross-site case uses `TRANSMITTER_UIW_W`.

### Test cases

| # | Name | Goal |
|---|------|------|
| S26-01 | `GET /equipment?isShared=true returns only shared equipment` | List filter correctness: ≥3 rows, every row `isShared===true`, known non-shared (`SPECTRUM_ANALYZER_SUW_E`) absent |
| S26-02 | `full lifecycle — PENDING→APPROVED→CHECKED_OUT→RETURNED on shared equipment` | Create, approve, start, return; assert 4 checkout status transitions + equipment.status transitions (`available` → `checked_out` → `available`) |
| S26-03 | `reject PENDING shared checkout leaves equipment available (no-hold invariant)` | Create, reject, assert `equipment.status === 'available'` unchanged, `checkout.status === 'rejected'`. Regression lock on shared-pool semantics |
| S26-04 | `re-checkout after rejection succeeds (no CHECKOUT_EQUIPMENT_ALREADY_ACTIVE)` | Immediately after S26-03 path, create a second checkout for the same equipment — must succeed |
| S26-05 | `cross-site shared equipment filter — Uiwang shared equipment excluded from Suwon scope` | `?isShared=true&site=suwon` must exclude `TRANSMITTER_UIW_W` (Uiwang) |
| S26-06 | `test.fixme: shared equipment overdue auto-transition via scheduler` | Cite `checkout-overdue-scheduler.ts:60` — cron-only trigger, no HTTP endpoint to force re-run in E2E |

If VERSION_CONFLICT is referenced anywhere: `import { ErrorCode } from '@equipment-management/schemas'` + `ErrorCode.VersionConflict` (SSOT per `bc7565cb`).

**Verification**: `pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-26-shared-equipment` — 5 PASS + 1 fixme.

## Phase 3 — Narrative doc

**File (MODIFY — append)**: `docs/manual/checkout-import-scenarios.md`

New section: `## Suite-26 공용장비 전용 워크플로우`. Structure parallels suite-23/24/25 sections:
- Pre-conditions (seed equipment, user roles)
- Scenario walkthrough for S26-01 ~ S26-05
- DB state transitions for S26-02
- Known gap: overdue HTTP trigger absent (`checkout-overdue-scheduler.ts:60`)
- Design note: shared pool "no-hold" semantic (`checkouts.service.ts:1415`)

## Phase 4 — Verification

Commands (run by Evaluator):

1. `pnpm tsc --noEmit`
2. `pnpm --filter backend run test` (551+ baseline preserved)
3. `pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-26-shared-equipment` (5 PASS + 1 fixme)
4. Regression: `pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-23-cross-site-rbac tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery tests/e2e/features/checkouts/suite-25-cas-concurrent-approval`
5. `git diff --exit-code apps/backend/src/database/seed-data` (empty)
