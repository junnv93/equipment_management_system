# checkout-display-steps-schema-ssot

## Scope

Move checkout display step ordering out of frontend design tokens and into the schemas package with the checkout FSM helpers.

## MUST

- Define `CHECKOUT_DISPLAY_STEPS` in `packages/schemas`.
- Export it from `@equipment-management/schemas`.
- Keep the existing frontend import surface working through design-token re-export.
- Add schema-level tests that align display step order with `computeStepIndex`.

## SHOULD

- Keep visual timeline style tokens in the frontend design-token file.

## Verification

- `pnpm --filter @equipment-management/schemas build`
- `pnpm --filter @equipment-management/schemas exec jest src/__tests__/checkout-fsm.test.ts --testNamePattern=CHECKOUT_DISPLAY_STEPS`
- `pnpm --filter frontend run type-check`
