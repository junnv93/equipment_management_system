# e2e-your-turn-badge-coverage

## Status

Completed on 2026-05-03.

## Scope

- Expand `apps/frontend/tests/e2e/features/checkouts/suite-list-ia/s-your-turn.spec.ts` to cover the three tracked `YourTurnBadge` cases:
  - `technical_manager` lender turn on a rental return detail.
  - `test_engineer` start turn on an approved calibration checkout detail.
  - terminal canceled checkout with `data-my-turn="false"` and no `your-turn-badge`.
- Replace stale selectors that expected `section[data-checkout-id]` with the current `NextStepPanel` detail contract, `data-variant="hero"` and `data-my-turn`.

## Acceptance Criteria

- The Playwright file declares all three cases.
- The feature-flag probe uses an actually rendered detail panel selector.
- The terminal case asserts both the explicit false state and badge absence.
- The spec can be loaded by Playwright without syntax/config errors.

## Verification

- `pnpm --filter frontend exec prettier --write tests/e2e/features/checkouts/suite-list-ia/s-your-turn.spec.ts`
- `pnpm --filter frontend exec eslint tests/e2e/features/checkouts/suite-list-ia/s-your-turn.spec.ts`
  - Result: no errors; file is ignored by the configured ESLint ignore pattern.
- `pnpm --filter frontend exec playwright test tests/e2e/features/checkouts/suite-list-ia/s-your-turn.spec.ts --list`
  - Result: the three scenarios are listed under each configured browser project.

## Notes

- Browser execution still depends on the usual dev server and storageState setup. This closure covers the missing E2E scenario declarations and selector drift.
