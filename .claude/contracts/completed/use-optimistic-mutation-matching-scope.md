# use-optimistic-mutation-matching-scope

## Scope

Close the `useOptimisticMutation` multi-view optimistic update gap.

## MUST

- Preserve default exact-key optimistic update behavior for existing callers.
- Add an explicit option for prefix-matched optimistic writes using TanStack Query `setQueriesData`.
- Apply the matching option to existing prefix-key callers:
  - `queryKeys.equipment.lists()`
  - `queryKeys.checkouts.view.all()`
- Add regression coverage for exact vs matching behavior.

## SHOULD

- Keep API changes backward compatible.
- Avoid direct caller-level `setQueryData` reintroduction.

## Verification

- `pnpm --filter frontend test -- use-optimistic-mutation.test.ts`
- `pnpm --filter frontend test -- use-checkout-card-mutations.test.ts`
- `pnpm --filter frontend run type-check`
