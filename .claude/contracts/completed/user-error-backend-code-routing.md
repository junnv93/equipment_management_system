# user-error-backend-code-routing

## Goal

`apps/frontend/lib/errors/user-errors.ts`의 `mapBackendErrorCode()`가 `USER_ERROR_I18N_KEYS` SSOT를 우회하지 않도록 정리한다.

## Scope

- `apps/frontend/lib/errors/user-errors.ts`
- `apps/frontend/messages/{ko,en}/users.json`
- focused frontend unit test
- tracker/registry/evaluation artifacts

## MUST

1. `mapBackendErrorCode()`는 `code ?? 'UNKNOWN_ERROR'`를 그대로 반환하지 않는다.
2. `mapBackendErrorCode()`는 schemas `ErrorCode` 기반 `USER_ERROR_I18N_KEYS`와 동일한 routing table을 사용한다.
3. unknown/undefined backend code는 존재하는 fallback i18n key로 닫힌다.
4. `mapUserErrorToToast()`와 `mapBackendErrorCode()`의 routing 결과가 분기하지 않는다.
5. focused frontend unit tests가 PASS한다.
6. `pnpm --filter frontend run type-check`가 PASS한다.
7. 독립 evaluator가 contract 기준으로 PASS/FAIL을 기록한다.

## SHOULD

- `USER_ERROR_I18N_KEYS`는 외부에서 실수로 mutate하지 않도록 readonly surface로 유지한다.
- ko/en users namespace에 fallback key parity를 둔다.
