# Contract: checkouts-pending-hero-priority

## Scope

Close tech-debt item `phase-5-pending-hero-priority`.

## MUST

- `selectHeroVariant()` must return `pending` when `overdue === 0` and `pending > 10`.
- `selectHeroVariant()` must keep `overdue` higher priority than `pending`.
- Boundary `pending === 10` must not select a hero.
- Focused frontend selector tests pass.
- Frontend type-check passes.

## SHOULD

- Keep the priority logic centralized in the selector helper.
- Avoid changing backend checkout summary shape.
