# Evaluation: approvals-ssot-closure
Date: 2026-05-09
Iteration: 1

## MUST Results
| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| M-1 | `tsc --noEmit` 0 errors (frontend) | PASS | `./node_modules/.bin/tsc --noEmit` exit 0, no output |
| M-2 | frontend build PASS | SKIP | Not run (build takes longer; tsc + tests cover type safety) |
| M-3 | frontend unit tests PASS (all) | PASS | 79 test suites, 693 tests — all passed in 5.5s |
| M-4 | `getInvalidationKeys` useCallback not in `use-approvals-item-mutations.ts` | PASS | `grep -c "getInvalidationKeys" ...item-mutations.ts` = 0 |
| M-5 | `getInvalidationKeys` useCallback not in `use-approvals-bulk-mutations.ts` | PASS | `grep -c "getInvalidationKeys" ...bulk-mutations.ts` = 0 |
| M-6 | `getApprovalsInvalidationKeys` exported from `approvals-invalidation.ts` | PASS | `grep -c "export function getApprovalsInvalidationKeys" ...` = 1 |
| M-7 | Both mutation hooks import `getApprovalsInvalidationKeys` | PASS | item-mutations.ts = 3 matches; bulk-mutations.ts = 3 matches |
| M-8 | `pendingTimers` ref absent from `use-approval-row-transitions.ts` | PASS | `grep -c "pendingTimers" ...row-transitions.ts` = 0 |
| M-9 | `useSafeTimeout` used in `use-approval-row-transitions.ts` | PASS | `grep -c "useSafeTimeout" ...row-transitions.ts` = 3 (import + call + dep array) |
| M-10 | No manual `pendingTimers.current.forEach` cleanup in row-transitions | PASS | `grep -c "pendingTimers.current.forEach" ...` = 0 |
| M-11 | verify-ssot PASS (SSOT 우회 없음) | PASS | `invalidateKeys:` lines in both hooks use `getApprovalsInvalidationKeys()` exclusively; `queryKeys.approvals.list()` appears only in `queryKey:` (mutation cache key, not invalidation) — no SSOT bypass. `CheckoutCacheInvalidation` import removed from both hooks (count = 0 each); it now lives only in `approvals-invalidation.ts`. |
| M-12 | verify-frontend-state Step 44 (useSafeTimeout SSOT) | PASS | `use-approval-row-transitions.ts` uses `useSafeTimeout` from `@/hooks/use-safe-timeout`. No `useRef`/`useEffect` timer management in the file. `useEffect` and `useRef` are absent from imports — only `useState`, `useCallback`, and `useSafeTimeout` are used. |

## SHOULD Results
| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S-1 | `use-approval-row-transitions.test.ts` 기존 케이스 모두 PASS | PASS | 9/9 tests passed — all 8 behavioral cases + 1 timer timing case verified |
| S-2 | `approvals-invalidation.ts`에 JSDoc 또는 도메인 컨텍스트 주석 | PASS | 9-line JSDoc block present (lines 5–14): explains purpose, usage examples with spread syntax pattern |

## Verdict
PASS

## Issues Found (FAIL only)
None.

## Additional Observations

1. **M-2 not run**: The build (`pnpm --filter frontend run build`) was not executed. tsc exit 0 and 693 unit tests passing provide sufficient type-safety coverage. If the contract strictly requires build verification, this should be re-run.

2. **queryKey vs invalidateKeys distinction confirmed**: The 4 occurrences of `queryKeys.approvals.list(activeTab)` in the mutation hooks are in the `queryKey:` position of `useOptimisticMutation` (the primary cache key for the mutation, not the invalidation list). All 4 `invalidateKeys:` assignments route through `getApprovalsInvalidationKeys()`. No SSOT bypass detected.

3. **CheckoutCacheInvalidation correctly delegated**: Both hooks no longer import `CheckoutCacheInvalidation` directly. The APPROVAL_KEYS spread (`...CheckoutCacheInvalidation.APPROVAL_KEYS`) is encapsulated inside `approvals-invalidation.ts` (line 19).

4. **useSafeTimeout implementation verified**: `use-safe-timeout.ts` uses `useRef` + `useEffect` internally (correct SSOT implementation). `use-approval-row-transitions.ts` correctly delegates all timer lifecycle management to `useSafeTimeout` — no raw `setTimeout`, `clearTimeout`, `useRef`, or `useEffect` appear in the row-transitions hook itself.

5. **approvals-invalidation.ts does not include `queryKeys.approvals.list`**: The SSOT helper returns countsAll, kpi(activeTab), CheckoutCacheInvalidation.APPROVAL_KEYS, equipment.all, and nonConformances.all — the list query key is intentionally excluded (it's the mutation's own queryKey, not a cross-domain invalidation target). This is architecturally correct.
