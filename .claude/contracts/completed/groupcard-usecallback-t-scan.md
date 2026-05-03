# Contract: groupcard-usecallback-t-scan

## Scope

Close tracker item `groupcard-usecallback-t-scan`.

## MUST

- `CheckoutGroupCard.tsx` MUST remove `t` from `buildRowOverflowActions` callback dependencies.
- The reject overflow action label MUST remain translated through the existing `checkouts` namespace.
- Row overflow behavior MUST remain unchanged: eligible pending rows expose the reject action and navigate to checkout detail via `onCheckoutClick(row.checkoutId)`.
- Keep the change scoped to `CheckoutGroupCard.tsx` and harness bookkeeping.

## Verification

- Run focused frontend lint for `CheckoutGroupCard.tsx`.
- Run `pnpm --filter frontend run type-check`.
- Harness evaluator must return PASS before moving this contract to `completed/`.
