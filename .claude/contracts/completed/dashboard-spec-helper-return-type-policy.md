# dashboard-spec-helper-return-type-policy

## Status

Completed on 2026-05-03.

## Scope

- Resolve the dashboard spec helper return-type policy debt without changing production lint boundaries.
- Allow inferred return types for test-only helper functions inside backend spec files.
- Keep explicit return types enforced for production backend code.

## Acceptance Criteria

- Backend ESLint spec override disables `@typescript-eslint/explicit-function-return-type` for test/fixture/helper files only.
- `setupHealthMocks` no longer needs a mechanical `: void` annotation to satisfy lint.
- Dashboard service spec still passes.
- Targeted backend ESLint still passes.

## Implementation Notes

- Updated `apps/backend/.eslintrc.js` spec/fixture override to turn off `@typescript-eslint/explicit-function-return-type`.
- Removed the explicit `: void` return type from `setupHealthMocks` in `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts`.
