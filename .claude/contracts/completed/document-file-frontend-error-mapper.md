# Contract: document-file-frontend-error-mapper

## Scope

Close tech-debt item `document-file-frontend-error-mapper`.

## MUST

- `ErrorCode.DocumentNotFound` and `ErrorCode.FileNotFound` route to document/file-specific frontend error handling, not generic `NOT_FOUND`.
- `getDownloadErrorToast()` uses the document/file mapper for download flows while preserving existing fallback behavior for unknown errors.
- Existing `FORM_TEMPLATE_NOT_FOUND`, `EQUIPMENT_NOT_FOUND`, unknown, and non-ApiError download toast behavior remains covered by tests.
- Focused frontend unit tests for download/document error mapping pass.
- Frontend type-check passes.

## SHOULD

- Keep the change scoped to frontend error mapping and tracker/contract bookkeeping.
- Avoid touching existing unrelated dirty files.
