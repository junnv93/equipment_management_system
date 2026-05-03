# fsm-response-interceptor-guard

## Scope

Close the checkout FSM meta response guard debt.

## MUST

- Verify a Nest interceptor exists for checkout FSM meta response drift.
- Verify it is applied to checkout responses.
- Verify it never blocks responses when guard checks fail.
- Verify it warns when `meta` is missing or `nextStep` is invalid.

## SHOULD

- Keep the guard scoped to checkout responses rather than global app responses.

## Verification

- `pnpm --filter backend test -- fsm-meta-guard.interceptor.spec.ts`
- `pnpm --filter backend run type-check`
