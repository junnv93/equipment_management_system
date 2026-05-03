# Evaluation: checkouts-pending-hero-priority

## Verdict

PASS — all MUST criteria satisfied.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Pending threshold selects hero | PASS | `HERO_PRIORITY` includes `pending` when `summary.overdue === 0 && summary.pending > PENDING_HERO_THRESHOLD`; test covers 11 -> `pending`. |
| Overdue priority preserved | PASS | `overdue` rule remains first; test covers overdue=1/pending=11 -> `overdue`. |
| Boundary covered | PASS | Test covers pending=10 -> null with `PENDING_HERO_THRESHOLD = 10`. |
| Focused selector tests pass | PASS | `pnpm --filter frontend test -- checkout-hero-selector.test.ts` -> 1 suite / 7 tests PASS. |
| Frontend type-check passes | PASS | `pnpm --filter frontend run type-check` -> PASS. |

## Notes

No backend summary schema changes were needed; the existing `pending` and `overdue` summary fields drive the selector.
