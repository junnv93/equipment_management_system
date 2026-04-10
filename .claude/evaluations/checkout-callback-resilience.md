---
slug: checkout-callback-resilience
evaluated: 2026-04-10
iteration: 2
verdict: PASS
---

# Evaluation: Checkout Callback Resilience

## Build Verification
- tsc: PASS (0 errors)
- test: PASS (559/559, 44 suites)

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | tsc passes for changed files | PASS | `pnpm --filter backend exec tsc --noEmit` exits 0, no output |
| M2 | All backend tests pass with 0 regression | PASS | 559 passed, 44 suites, 0 failures |
| M3 | `onReturnCanceled` retries once on ConflictException | PASS | equipment-imports.service.ts line 864: `MAX_RETRIES = 1`, for-loop re-reads fresh row each attempt, CAS re-attempt on ConflictException (line 916). Unit tests cover success-on-retry and fail-after-retry |
| M4 | Both callback catch blocks use `logger.error` | PASS | checkouts.service.ts line 1798: `this.logger.error(...)` for onReturnCompleted catch; line 2181: `this.logger.error(...)` for onReturnCanceled catch. Zero `logger.warn` calls in entire file |
| M5 | Callback failure does not roll back parent checkout status | PASS | Two unit tests in `checkouts.service.spec.ts` lines 541-627 ("callback error resilience" describe block): (1) `cancel` with `return_to_vendor` purpose + `onReturnCanceled` rejects with Error — asserts `result.status === 'canceled'`; (2) `approveReturn` with `return_to_vendor` purpose + `onReturnCompleted` rejects with Error — asserts `result.status === 'return_approved'`. Both tests pass (559/559) |
| M6 | Orphan detection scheduler exists with cron | PASS | `import-orphan-scheduler.ts` in `notifications/schedulers/`, uses `@Cron(CronExpression.EVERY_6_HOURS)` (line 53), queries `RETURN_REQUESTED` imports joined with completed/canceled checkouts (line 98), registered in `notifications.module.ts` |
| M7 | New notification type in packages/schemas SSOT | PASS | `packages/schemas/src/enums/notification.ts` line 57: `'equipment_import_orphan_detected'`; backend tsc and test both pass |
| M8 | All shared types imported from SSOT packages | PASS | checkouts.service.ts imports from `@equipment-management/schemas` and `@equipment-management/shared-constants`; import-orphan-scheduler.ts imports from `@equipment-management/db`, `@equipment-management/schemas`, `@equipment-management/shared-constants`. No local enum redefinitions found |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | Orphan scheduler attempts automatic remediation | PASS | `detectAndRecover()` performs direct CAS update to target status (RETURNED or RECEIVED) |
| S2 | Error logs include checkoutId, equipmentImportId, purpose | PASS | Both catch blocks include `checkoutId: ${uuid}, purpose: ${checkout.purpose}`. Orphan scheduler logs `importId` |
| S3 | Orphan detection emits notification event | PASS | `this.eventEmitter.emit(NOTIFICATION_EVENTS.IMPORT_ORPHAN_DETECTED, {...})` with importId, equipmentId, equipmentName, managementNumber |
| S4 | Phase-based independent commits | N/A | Evaluated post-commit |
| S5 | onReturnCanceled retry max 1 additional DB round-trip | PASS | `MAX_RETRIES = 1` with one re-read SELECT + one UPDATE transaction per retry = exactly 1 additional round-trip |

## Issues Found

None. All MUST and SHOULD criteria pass.

## Iteration History

| Iteration | Verdict | Blocking Issue |
|-----------|---------|----------------|
| 1 | FAIL | M5 — No unit tests verifying callback failure isolation |
| 2 | PASS | M5 fixed — Two tests added in "callback error resilience" describe block |

## Recommendation

**PASS** — All M1-M8 criteria satisfied. Ready for `/git-commit`.
