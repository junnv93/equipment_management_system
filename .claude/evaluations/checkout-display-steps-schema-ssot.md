# checkout-display-steps-schema-ssot Evaluation

## Result

PASS

## Evidence

- Added `packages/schemas/src/checkout-display.ts` with `CHECKOUT_DISPLAY_STEPS`.
- Exported the module from `packages/schemas/src/index.ts`.
- Updated `apps/frontend/lib/design-tokens/components/checkout-timeline.ts` to re-export the schemas constant while retaining visual timeline tokens locally.
- Added `CHECKOUT_DISPLAY_STEPS` alignment tests in `packages/schemas/src/__tests__/checkout-fsm.test.ts`.

## Verification

- `pnpm --filter @equipment-management/schemas build` — PASS
- `pnpm --filter @equipment-management/schemas exec jest src/__tests__/checkout-fsm.test.ts --testNamePattern=CHECKOUT_DISPLAY_STEPS` — PASS
- `pnpm --filter frontend run type-check` — PASS
- `pnpm --filter @equipment-management/schemas test -- checkout-fsm.test.ts` — FAIL in 2 pre-existing/unrelated permission expectation cases:
  - `test_engineer can submit_return from checked_out`
  - `pending + calibration + test_engineer → nextAction=cancel`
  The new `CHECKOUT_DISPLAY_STEPS` tests pass in the same run.
