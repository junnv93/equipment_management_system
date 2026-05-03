# stagger-low-spec-guard

## Scope

Add a low-hardware guard to checkout row stagger animation so constrained devices do not pay row animation costs.

## Acceptance Criteria

- Stagger animation remains disabled after `STAGGER_ROW_LIMIT`.
- Stagger animation remains disabled for `prefers-reduced-motion: reduce`.
- Stagger animation is disabled when `navigator.hardwareConcurrency < 4`.
- `CheckoutGroupCard` applies both animation class and delay only when the shared guard allows it.
- Focused lint and unit tests pass.

## Verification

- `pnpm --filter frontend exec eslint lib/design-tokens/motion.ts lib/design-tokens/index.ts lib/design-tokens/__tests__/motion.test.ts components/checkouts/CheckoutGroupCard.tsx`
- `pnpm --filter frontend exec jest lib/design-tokens/__tests__/motion.test.ts components/checkouts/__tests__/CheckoutGroupCard.test.tsx --runInBand`
