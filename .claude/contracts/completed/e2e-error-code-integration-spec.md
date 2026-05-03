# e2e-error-code-integration-spec

## Scope

Close the error-code SSOT integration-test debt without adding DB-seeded E2E coverage.

## MUST

- Add a focused backend spec that exercises a Nest controller calling a service method that throws a fail-close `BadRequestException` with a schema `ErrorCode`.
- Verify `GlobalExceptionFilter` serializes the exception into an HTTP-style 400 response body while preserving the original `code`.
- Keep frontend mapper behavior on existing mapper tests; do not duplicate mapper implementation in the backend test.

## SHOULD

- Avoid opening a network listener in sandboxed tests.
- Keep the test independent from database fixtures and auth state.

## Verification

- `pnpm --filter backend test -- error-code-http-path.spec.ts`
- `pnpm --filter backend run type-check`
