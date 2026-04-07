# Evaluation: validation-attachments (UI Phase)

## Date: 2026-04-05
## Branch: feat/ulqp18-compliance-gaps
## Evaluator: QA Agent (Claude Opus 4.6)

---

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm tsc --noEmit` | PASS (0 errors) |
| `pnpm --filter frontend run build` | PASS |

---

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | Attachments Card below approval info Card | **PASS** | `ValidationDetailContent.tsx:454-575` — Card with `Paperclip` icon and `validation.documents.title` follows the approval info Card (lines 403-452). Order: basic info -> vendor/self -> approval -> attachments. Correct. |
| M2 | Uses `documentApi.getValidationDocuments(validationId)` + `queryKeys.documents.byValidation(validationId)` | **PASS** | Lines 131-135 — `useQuery` with `queryKey: queryKeys.documents.byValidation(validationId)` and `queryFn: () => documentApi.getValidationDocuments(validationId)`. |
| M3 | Upload uses `documentApi.uploadDocument(file, docType, { softwareValidationId })` with correct type mapping | **PASS** | Lines 142-159 — `uploadMutation` maps `vendor` -> `DocumentTypeValues.VALIDATION_VENDOR_ATTACHMENT`, else -> `DocumentTypeValues.VALIDATION_TEST_DATA`. Calls `documentApi.uploadDocument(file, docType, { softwareValidationId: validationId })`. |
| M4 | Download uses `documentApi.downloadDocument()` | **PASS** | Lines 169-171 — `handleDownload` calls `documentApi.downloadDocument(doc.id, doc.originalFileName)`. |
| M5 | Delete uses `documentApi.deleteDocument()` | **PASS** | Lines 173-181 — `handleDeleteDoc` calls `documentApi.deleteDocument(docId)`. |
| M6 | Cache invalidation on upload/delete | **PASS** | Lines 137-140 — `invalidateDocs()` helper calls `queryClient.invalidateQueries({ queryKey: queryKeys.documents.byValidation(validationId) })`. Called in `uploadMutation.onSuccess` (line 153) and `handleDeleteDoc` success path (line 179). |
| M7 | i18n keys in both ko/en | **PASS** | Both `messages/ko/software.json` and `messages/en/software.json` contain `validation.documents.*` keys: title, empty, upload, uploading, uploadSuccess, uploadError, deleteConfirm, deleteSuccess, deleteError, download, tableHeaders (fileName, type, size, uploadedAt, actions). All 13 keys present in both locales. |
| M8 | `pnpm tsc --noEmit` passes | **PASS** | Clean exit, no output. |
| M9 | `pnpm --filter frontend run build` passes | **PASS** | Build completed, all routes rendered. |
| M10 | SSOT imports from schemas package | **PASS** | Line 50: `import { DocumentTypeValues, DOCUMENT_TYPE_LABELS } from '@equipment-management/schemas'`; Line 51: `import type { ValidationStatus, DocumentType } from '@equipment-management/schemas'`. No local redefinitions. |

---

## SHOULD Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| S1 | UI consistent with AttachmentsTab.tsx patterns | **PASS** | Same `MIME_ICONS` map, same `DOCUMENT_TABLE`/`DOCUMENT_EMPTY_STATE` tokens, same Table/Badge/Button patterns, same `formatFileSize`/`useDateFormatter` usage, same download/delete button patterns. |
| S2 | draft-only upload/delete | **PASS** | Upload button wrapped in `validation.status === 'draft'` guard (line 468). Delete button per-row also guarded by `validation.status === 'draft'` (line 554). Other statuses are read-only (download only). |
| S3 | Empty state | **PASS** | Lines 494-497 — `DOCUMENT_EMPTY_STATE.container` with `Paperclip` icon and `t('validation.documents.empty')` message. |
| S4 | design-tokens usage | **PASS** | Uses `DOCUMENT_TABLE.wrapper`, `DOCUMENT_TABLE.stickyHeader`, `DOCUMENT_TABLE.rowHover`, `DOCUMENT_TABLE.stripe`, `DOCUMENT_TABLE.fileNameCell`, `DOCUMENT_TABLE.numericCell`, `DOCUMENT_TABLE.actionsCell`, `DOCUMENT_EMPTY_STATE.container/icon/text`. |

---

## Issues Found

### FAIL: Hardcoded Korean string in aria-label

**File:** `ValidationDetailContent.tsx:561`
**Code:** `` aria-label={`${doc.originalFileName} 삭제`} ``
**Severity:** Medium (i18n violation, accessibility regression for EN locale)
**Expected:** Should use i18n key, e.g. `` aria-label={`${t('validation.documents.delete')} ${doc.originalFileName}`} `` or a dedicated `validation.documents.deleteAriaLabel` key with interpolation.
**Note:** The `validation.documents.download` key IS properly used for the download button aria-label on line 550, making this inconsistency clearly unintentional.

### Observation: `confirm()` used for delete confirmation

**File:** `ValidationDetailContent.tsx:174`
**Code:** `if (!confirm(t('validation.documents.deleteConfirm'))) return;`
**Severity:** Low (functional but inconsistent with production patterns)
**Note:** The native `confirm()` dialog does not match the app's design system (AlertDialog). The existing AttachmentsTab.tsx also uses a simple pattern so this is consistent within the codebase, but worth noting.

### Observation: No file size validation before upload

**File:** `ValidationDetailContent.tsx:161-167`
**Note:** `FILE_UPLOAD_LIMITS` is imported (line 54) but never used. The file size/type validation is only done server-side. While not a contract failure, the unused import is dead code. `ALLOWED_EXTENSIONS` IS used (line 475) for the `accept` attribute.

---

## Verdict

| Category | Result |
|----------|--------|
| MUST (M1-M10) | **10/10 PASS** |
| SHOULD (S1-S4) | **4/4 PASS** |
| Issues | 1 medium (hardcoded Korean in aria-label), 1 unused import (`FILE_UPLOAD_LIMITS`) |

**Overall: PASS with 1 defect requiring fix**

The hardcoded Korean string `삭제` on line 561 is a genuine i18n violation that will render Korean text in English locale for screen reader users. This should be fixed before merge.
