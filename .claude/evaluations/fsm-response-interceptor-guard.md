# fsm-response-interceptor-guard Evaluation

## Result

PASS

## Evidence

- `apps/backend/src/common/interceptors/fsm-meta-guard.interceptor.ts` implements `FsmMetaGuardInterceptor`.
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` imports it and applies it at class level with `@UseInterceptors(FsmMetaGuardInterceptor)`.
- The interceptor uses `tap` and catches its own check failures, so it logs drift without blocking the response.
- Existing focused tests verify:
  - missing `meta` logs `meta_field_missing` and passes payload through.
  - invalid `nextStep` logs `invalid_nextStep`.
  - non-FSM `meta` payloads do not produce false-positive warnings.

## Verification

- `pnpm --filter backend test -- fsm-meta-guard.interceptor.spec.ts` — PASS
- `pnpm --filter backend run type-check` — PASS
