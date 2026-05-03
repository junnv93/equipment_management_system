# e2e-error-code-integration-spec Evaluation

## Result

PASS

## Evidence

- Added `apps/backend/src/common/filters/__tests__/error-code-http-path.spec.ts`.
- The spec builds a Nest testing module with a probe controller and service. The service throws `BadRequestException({ code: ErrorCode.InspectionTemplateNotFound, ... })`.
- The test passes the thrown exception through `GlobalExceptionFilter` and asserts status `400`, preserved `INSPECTION_TEMPLATE_NOT_FOUND`, message, and timestamp shape.
- Existing frontend mapper coverage remains the frontend side of the path:
  - `apps/frontend/lib/errors/__tests__/form-template-errors.test.ts`
  - `apps/frontend/lib/errors/__tests__/download-error-utils.test.ts`

## Verification

- `pnpm --filter backend test -- error-code-http-path.spec.ts` — PASS
- `pnpm --filter backend run type-check` — PASS
