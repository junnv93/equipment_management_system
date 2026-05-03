# Evaluation Report: user-error-backend-code-routing

## Verdict

PASS

## Evidence

- `mapBackendErrorCode()` no longer returns `code ?? 'UNKNOWN_ERROR'` or raw backend code values.
- `mapBackendErrorCode()` routes through `USER_ERROR_I18N_KEYS`.
- `mapUserErrorToToast()` calls `mapBackendErrorCode()`, so toast descriptions and legacy helper routing share the same SSOT.
- `errors.unknown` fallback exists in both `apps/frontend/messages/ko/users.json` and `apps/frontend/messages/en/users.json`.
- `USER_ERROR_I18N_KEYS` is exposed as `Readonly<Partial<Record<ErrorCode, string>>>`.

## Commands

- `pnpm --filter frontend test -- --runTestsByPath apps/frontend/lib/errors/__tests__/user-errors.test.ts` — PASS, 1 suite / 5 tests
- `pnpm --filter frontend run type-check` — PASS
- `pnpm --filter frontend run lint` — PASS
- independent evaluator reran focused Jest/type-check/lint and reported PASS

## Residual Risk

Fallback toast behavior intentionally preserves explicit `Error.message` for unmapped `Error` objects. The focused test locks that compatibility behavior.
