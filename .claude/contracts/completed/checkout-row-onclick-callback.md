# checkout-row-onclick-callback

## Scope

Remove the remaining row-level inline `onCheckoutClick(row.checkoutId)` handler allocation in `CheckoutGroupCard`.

## Acceptance Criteria

- Equipment row click uses a stable `useCallback` handler.
- Equipment row Enter-key activation uses a stable `useCallback` handler.
- Row identity is read from a row-owned attribute without changing public props.
- Existing row click behavior, keyboard activation, and group checkbox behavior remain covered by focused tests.

## Verification

- `rg -n "onClick=\\{\\(\\) => onCheckoutClick\\(row.checkoutId\\)" apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- `pnpm --filter frontend exec eslint components/checkouts/CheckoutGroupCard.tsx`
- `pnpm --filter frontend exec jest components/checkouts/__tests__/CheckoutGroupCard.test.tsx --runInBand`
