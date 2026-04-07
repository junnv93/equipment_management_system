# Contract: 유효성확인 첨부파일 UI

## Slug: validation-attachments
## Mode: 1
## Date: 2026-04-05 (UI phase)

## MUST Criteria

| # | Criterion |
|---|-----------|
| M1 | ValidationDetailContent.tsx에 첨부파일 Card 추가 — 승인 정보 Card 아래 |
| M2 | 문서 목록 조회: `documentApi.getValidationDocuments(validationId)` + `queryKeys.documents.byValidation(validationId)` |
| M3 | 파일 업로드: `documentApi.uploadDocument(file, docType, { softwareValidationId })` — vendor→`validation_vendor_attachment`, self→`validation_test_data` |
| M4 | 다운로드: `documentApi.downloadDocument()` 사용 |
| M5 | 삭제: `documentApi.deleteDocument()` 사용 |
| M6 | 캐시 무효화: 업로드/삭제 후 `queryKeys.documents.byValidation(validationId)` invalidate |
| M7 | i18n: ko/en software.json에 `validation.documents.*` 키 추가 |
| M8 | `pnpm --filter frontend run tsc --noEmit` 통과 |
| M9 | `pnpm --filter frontend run build` 통과 |
| M10 | SSOT: DocumentTypeValues, DOCUMENT_TYPE_LABELS 등 schemas 패키지에서 import |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | AttachmentsTab.tsx 패턴과 일관된 UI (테이블, 아이콘, Badge) |
| S2 | draft 상태에서만 업로드/삭제 가능 (다른 상태에서는 읽기 전용) |
| S3 | Empty state 처리 |
| S4 | design-tokens 사용 (DOCUMENT_TABLE, DOCUMENT_EMPTY_STATE 등) |
