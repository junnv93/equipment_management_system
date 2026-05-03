# Contract: inspection-template-frontend-error-mapper

## Scope

Close tech-debt item `inspection-template-frontend-error-mapper`.

## MUST

- Add a form-template domain frontend error mapper that includes `ErrorCode.InspectionTemplateNotFound`.
- The mapper must use the `form-templates` i18n namespace, not the intermediate-inspection mapper namespace.
- Existing form-template upload error routing for duplicate form number and invalid form metadata remains covered.
- Focused frontend unit tests for the mapper pass.
- Frontend type-check passes.

## SHOULD

- Integrate the existing form-template upload dialog with the mapper and remove its local error-code map.
- Keep changes scoped to form-template error handling and harness bookkeeping.
