# Contract: frontend-types-ssot-cleanup

## Scope

Close tech-debt item `frontend-types-ssot-cleanup`.

## MUST

- `apps/frontend/lib/api/calibration-api.ts` must not locally redefine `RichCell`.
- `ResultSection` must be schema-sourced from `@equipment-management/schemas`.
- `CreateResultSectionDto` must be schema-sourced from `@equipment-management/schemas`.
- Existing exported type names must remain available for frontend callers.
- Focused frontend tests for inspection structure utilities pass.
- Frontend type-check passes.

## SHOULD

- Avoid changing runtime API calls or endpoint behavior.
- Keep caller imports stable.
