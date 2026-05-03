# Evaluation: document-file-frontend-error-mapper

## Verdict

PASS — all MUST criteria satisfied.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| DocumentNotFound/FileNotFound route to document/file-specific frontend handling | PASS | `document-errors.ts` maps schema `ErrorCode.DocumentNotFound` / `ErrorCode.FileNotFound` to UI-level `EquipmentErrorCode.DOCUMENT_NOT_FOUND` / `FILE_NOT_FOUND`. |
| `getDownloadErrorToast()` uses document/file mapper and preserves unknown fallback | PASS | `download-error-utils.ts` calls `mapDocumentFileErrorToToast()` first, then falls back to existing `ApiError` catalog or caller fallback. |
| Existing form-template/equipment/unknown/non-ApiError behavior remains covered | PASS | `download-error-utils.test.ts` covers `FORM_TEMPLATE_NOT_FOUND`, `EQUIPMENT_NOT_FOUND`, empty server message, `UNKNOWN_ERROR`, plain `Error`, null/undefined/string. |
| Focused frontend unit tests pass | PASS | `pnpm --filter frontend test -- download-error-utils.test.ts` → 1 suite / 9 tests PASS. |
| Frontend type-check passes | PASS | `pnpm --filter frontend run type-check` → `tsc --noEmit` PASS. |

## Notes

No SHOULD failures. Changes stayed scoped to frontend error mapping plus harness bookkeeping.
