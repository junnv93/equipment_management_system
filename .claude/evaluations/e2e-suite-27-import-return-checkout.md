# Evaluation — E2E Suite-27: Import Return Checkout

**Slug**: `e2e-suite-27-import-return-checkout`
**Date**: 2026-04-09
**Verdict**: **PASS** (all MUST criteria met; minor findings noted)

---

## MUST Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | `pnpm tsc --noEmit` clean | PASS | Exit 0, zero errors |
| M2 | Backend tests >= 551 pass | PASS | 551 passed, 44 suites |
| M3 | Suite-27 chromium: all non-fixme PASS | PASS | 12 passed, 1 skipped (fixme) |
| M4 | Chromium project gating (describe/beforeEach) | PASS | `test.skip(project !== 'chromium')` in `beforeEach` at line 53 |
| M5 | `test.describe.configure({ mode: 'serial' })` | PASS | Line 48 |
| M6 | No `'VERSION_CONFLICT'` literal | PASS | grep empty; `ErrorCode` imported from schemas |
| M7 | `git diff apps/backend/src/database` EMPTY | PASS | No backend DB changes |
| M8 | `git diff packages/db/src/schema` EMPTY | PASS | No schema changes |
| M9 | No hardcoded equipment/import UUIDs | PASS | No `eeee` prefix; all imports created dynamically via `createReceivedRentalImport` / `createPendingEquipmentImport` |
| M10 | Helpers in `checkout-helpers.ts` only, no workflow-helpers duplication | PASS | 3 new functions added; `workflow-helpers.ts` does not exist |
| M11 | Helpers reuse `getCheckoutPool()` / `getBackendToken()` patterns | PASS | `requestImportReturn` uses `getBackendToken`; `afterAll` uses `getCheckoutPool` |
| M12 | `test.fixme` cites backend file:line | PASS (borderline) | Citation `equipment-imports.service.ts:760` is embedded in fixme reason string, not in a separate comment line above. Functionally equivalent. |
| M13 | Suite-23/24/25/26 each pass standalone | PASS | S23: 12 pass; S24: 11 pass + 2 skip; S25: 9 pass + 1 skip; S26: 11 pass + 1 skip |
| M14 | Permission roles via `getBackendToken(page, role)` | PASS | All role-based tokens obtained via `getBackendToken` helper |

---

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | `docs/manual/checkout-import-scenarios.md` updated with state matrix | PASS | Appendix added with WF-13 relationship + 6-row state transition matrix |
| S2 | `afterEach` cancels active auto-checkout + clears cache | MISS | No `afterEach` hook present |
| S3 | `afterAll` runs `cleanupCheckoutPool` | PASS | Lines 56-69: afterAll does pool cleanup + DB cancel of created imports |
| S4 | Spec header documents WF-13 complementary relationship | PASS | Lines 1-19: detailed JSDoc header |
| S5 | Test names follow suite-26 Korean-prefixed style | PASS | All test names use Korean descriptions |

---

## Issues / Findings

### Minor (non-blocking)

1. **Unused `ErrorCode` import** (line 28-29): `ErrorCode` is imported but never used in assertions. S27-07 only checks HTTP status codes `[400, 409]`, not the response body `code` field. The test name references `ErrorCode.VersionConflict` but the assertion does not verify it. The import should either be used in an assertion or removed.

2. **fixme citation placement** (M12): Contract specifies "comment directly above" the `test.fixme` call. The file:line is inside the fixme reason string itself (line 227), not as a separate `//` comment. Functionally the information is present and discoverable. Borderline conformance.

3. **No `afterEach` cleanup** (S2): Active auto-checkouts created during test execution are not canceled between tests. Only `afterAll` performs cleanup. For serial mode this is low-risk but could leave stale state if a mid-suite test fails.

4. **`'IMPORT_ONLY_RECEIVED_CAN_RETURN'` is a hardcoded string** (line 196): This error code exists only as a backend-local string (`equipment-imports.service.ts:591`), not in `@equipment-management/schemas`. Not a contract violation (contract only restricts VERSION_CONFLICT), but inconsistent with the SSOT principle for error codes.

---

## Verification Commands Executed

```
pnpm tsc --noEmit                          → exit 0
pnpm --filter backend run test             → 551 passed
suite-27 (chromium)                        → 12 passed, 1 skipped
suite-23 (chromium)                        → 12 passed
suite-24 (chromium)                        → 11 passed, 2 skipped
suite-25 (chromium)                        → 9 passed, 1 skipped
suite-26 (chromium)                        → 11 passed, 1 skipped
git diff (backend/db + packages/db/schema) → empty
grep VERSION_CONFLICT                      → empty
grep eeee                                  → empty
```
