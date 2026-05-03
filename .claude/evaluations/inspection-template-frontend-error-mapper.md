# Evaluation: inspection-template-frontend-error-mapper

## Verdict

PASS - all MUST criteria satisfied.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Add a form-template domain frontend error mapper that includes `ErrorCode.InspectionTemplateNotFound`. | PASS | `apps/frontend/lib/errors/form-template-errors.ts:7` imports schema `ErrorCode`; `apps/frontend/lib/errors/form-template-errors.ts:14` defines the form-template mapper table; `apps/frontend/lib/errors/form-template-errors.ts:19` maps `ErrorCode.InspectionTemplateNotFound` to `errors.inspectionTemplateNotFound`. |
| The mapper must use the `form-templates` i18n namespace, not the intermediate-inspection mapper namespace. | PASS | `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx:51` uses `useTranslations('form-templates')`; `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx:92`-`95` passes that translator into `mapFormTemplateErrorToToast`. The mapper returns `errors.inspectionTemplateNotFound` in `apps/frontend/lib/errors/form-template-errors.ts:19`, and the message exists under `apps/frontend/messages/en/form-templates.json` / `apps/frontend/messages/ko/form-templates.json` in the new `errors` object. It does not route through `apps/frontend/lib/errors/intermediate-inspection-errors.ts:17`, which still maps the same backend code to the intermediate-inspection key for that separate domain. |
| Existing form-template upload error routing for duplicate form number and invalid form metadata remains covered. | PASS | `apps/frontend/lib/errors/form-template-errors.ts:15` preserves `FormNumberAlreadyExists` -> `uploadDialog.errorNumberExists`; `apps/frontend/lib/errors/form-template-errors.ts:16`-`17` preserve `InvalidFormName` and `InvalidFormNumberFormat` -> `uploadDialog.error`. `apps/frontend/lib/errors/__tests__/form-template-errors.test.ts:12`-`18` covers these routes. |
| Focused frontend unit tests for the mapper pass. | PASS | Ran `pnpm --filter frontend test -- form-template-errors.test.ts download-error-utils.test.ts`: PASS, 2 suites / 14 tests. Mapper-specific coverage is in `apps/frontend/lib/errors/__tests__/form-template-errors.test.ts:6`-`44`. |
| Frontend type-check passes. | PASS | Ran `pnpm --filter frontend run type-check`: PASS (`tsc --noEmit`). |

## SHOULD Follow-ups

None. The upload dialog is integrated with `mapFormTemplateErrorToToast` and the previous local `UPLOAD_ERROR_CODE_MAP` was removed in `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx:26` and `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx:92`-`95`. Changes relevant to this contract are scoped to form-template error handling, i18n keys, and focused tests.
