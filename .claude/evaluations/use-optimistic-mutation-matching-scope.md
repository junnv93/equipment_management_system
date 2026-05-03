# use-optimistic-mutation-matching-scope Evaluation

## Result

PASS

## Evidence

- `useOptimisticMutation` now accepts `optimisticUpdateScope?: 'exact' | 'matching'`.
- Default remains `exact`, preserving the previous single-cache write behavior.
- `matching` uses `queryClient.setQueriesData({ queryKey }, ...)` so filtered list/view caches under the same prefix receive the optimistic update.
- Existing prefix-key call sites were updated:
  - `apps/frontend/hooks/use-equipment.ts`
  - `apps/frontend/hooks/use-checkout-card-mutations.ts`
- Regression tests cover both exact and matching semantics.

## Verification

- `pnpm --filter frontend test -- use-optimistic-mutation.test.ts` — PASS
- `pnpm --filter frontend test -- use-checkout-card-mutations.test.ts` — PASS
- `pnpm --filter frontend run type-check` — PASS
