# Evaluation: groupcard-usecallback-t-scan

Result: PASS

Evidence:
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx:220` precomputes `rejectActionLabel` from `t('actions.reject')` in the existing `checkouts` namespace.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx:222-235` uses `rejectActionLabel` inside `buildRowOverflowActions`; the callback dependency list is `[rejectActionLabel, onCheckoutClick]`, so it no longer directly depends on `t`.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx:225-230` preserves the pending approvable row gate (`row.canApproveItem && row.status === CSVal.PENDING`), destructive reject action variant, and `onCheckoutClick(row.checkoutId)` navigation.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx:539` still wires row overflow actions through `overflowActions={buildRowOverflowActions(row)}` on the row `NextStepPanel`.

Verification:
- `pnpm --filter frontend exec eslint components/checkouts/CheckoutGroupCard.tsx` passed.
- `pnpm --filter frontend run type-check` passed.
