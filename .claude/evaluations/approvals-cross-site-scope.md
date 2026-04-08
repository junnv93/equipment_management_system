---
slug: approvals-cross-site-scope
mode: 1
verdict: PASS
date: 2026-04-08
iteration: 2
---

## Evaluation: approvals-cross-site-scope
Iteration: 2

### MUST
- [x] backend tsc — exit 0 (clean)
- [x] frontend tsc — exit 0 (clean)
- [x] backend tests checkouts+approvals — 2 suites, 23/23 passed (5.8s)
- [x] list/action symmetry — non-rental: list `checkouts.id IN (checkoutItems JOIN equipment WHERE equipment.site/teamId=scope)` matches `enforceScopeFromData` (checkouts.service.ts:983-989) which scopes by equipment.site/teamId. Rental: list uses `lenderSite/lenderTeamId=scope` (matches guard) OR `requesterId IN users(scope)` (inbound superset). Guard strictly requires lender=scope for rental — inbound rentals in list may still 403 if approved, but contract explicitly allows requester-side for inbound visibility.
- [x] no N+1 — all predicates use IN subqueries (single query); `users` JOIN dropped on scope=all.
- [x] SSOT — `CHECKOUT_DATA_SCOPE` via `resolveDataScope`. getCheckoutCount inlines switch (all/site/team/none + team→site fallback) rather than `buildScopeCondition` because the helper's single-SQL-fn-per-level signature cannot express purpose-aware rental split. Faithful reproduction, no magic values.

### SHOULD
- WF-33 loop simplification: correct; assumes list/action symmetry. Depends on first outgoing item being actionable.
- TC-08 01-access-control regression: iterates all outgoing items, approves first, opens+Escapes rest, asserts zero 403s. `test.skip()` when total=0 — clean.
- Cache keys: unchanged query shape, no bump needed.
- getCheckoutCount drops `users` JOIN when scopeCondition undefined (scope=all) — matches list behavior.
- buildScopeCondition helper preserved, used elsewhere — surgical.

### Concerns (non-blocking)
- Inbound rental asymmetry: list's `requesterId IN scope` OR-branch for rentals surfaces checkouts whose lender is outside scope; `enforceScopeFromData` still scopes rental strictly by lender → approve would 403. Contract explicitly accepts this (borrower visibility). TC-08 approves first item regardless of purpose; if seed places an inbound rental at position 0 of `?tab=outgoing`, TC-08 would flag it. Outgoing tab likely filters via `direction=outbound` upstream (which excludes the rental-requester case in the new buildQueryConditions team branch) — low risk, but the site filter has no direction parameter, so `?tab=outgoing&site=...` (no direction) would still include inbound rentals. Worth a follow-up note.
- `checkouts.service.spec.ts` has no unit test asserting the new equipment-scoped SQL shape; covered only via e2e (TC-08, WF-33).

### Issues to fix
None blocking.

### Verdict: PASS
