---
slug: tech-debt-batch-0419
iteration: 2
verdict: PASS
---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|---------|
| M1 | backend tsc exit 0 | PASS | `npx tsc --noEmit -p apps/backend/tsconfig.json` → 0 errors (no output) |
| M2 | frontend tsc exit 0 | PASS | `npx tsc --noEmit -p apps/frontend/tsconfig.json` → 0 errors (no output) |
| M3 | backend build exit 0 | PASS | `pnpm --filter backend run build` → `nest build` exits 0 |
| M4 | C3: DocumentsController IStorageProvider 주입 제거 | PASS | `grep -n "STORAGE_PROVIDER\|IStorageProvider" documents.controller.ts` → 0 hits (exit code 1) |
| M5 | C3: DocumentService에 downloadWithPresign + getThumbnailBuffer 존재 | PASS | line 495: `async downloadWithPresign(id: string): Promise<DownloadInfo>`, line 520: `async getThumbnailBuffer(id: string, width: number): Promise<Buffer>` — 2 hits |
| M6 | H1: 케이블 캐시 무효화 복합 프리픽스 | PASS | line 851: `` this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.CALIBRATION}cables:`) `` — 1 hit. `CACHE_KEY_PREFIXES.CABLES` 상수 신규 추가 없이 복합 프리픽스 직접 사용. (line 845는 주석, line 851이 실제 호출) |
| M7 | H3: markPreviewHistoryDuplicates fallthrough 제거 | PASS | lines 1297-1312: INCIDENT는 `filterIncidentDuplicates`(line 1298) 독립 분기. else(line 1308)는 CABLE/TEST_SOFTWARE/CALIBRATION_FACTOR/NON_CONFORMANCE에 대해 `{ toInsert: rowPreviews, duplicates: [] }` 직접 반환 — `filterIncidentDuplicates`로 분기 없음 |
| M8 | backend unit tests 통과 | PASS | `cd apps/backend && npx jest --silent` → 61 suites, 808 tests passed, 0 failures. (iteration 1 지적 이슈: `createMockDocumentService()`에 `downloadWithPresign`/`getThumbnailBuffer` mock 누락 — 해결됨) |
| M9 | backend lint 통과 | PASS | `pnpm --filter backend run lint` → 에러 0건 |

## SHOULD Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|---------|
| S1 | previewMultiSheet catch 블록 추가 (에러 시에만 삭제) | PASS | line 119: `savedFile` 저장 후 line 121: `try {` 블록 시작, line 373-384: `catch (e) { await this.fileUploadService.deleteFile(savedFile.filePath); throw e; }` — 성공 시 파일 보존, 에러 시에만 정리 (iteration 1 지적 이슈 해결됨) |
| S2 | history-card 'equipment_photo' 리터럴 제거 | PASS | `grep "'equipment_photo'" history-card-data.service.ts` → 0 hits |
| S3 | en/equipment.json selfInspection.form 3키 추가 | PASS | lines 334-336: `calibrationValidityPeriodPlaceholder`, `selectClassification`, `snapshotSectionLabel` 3키 모두 존재 |
| S4 | SoftwareTab transition-colors 제거 | PASS | `grep "transition-colors" SoftwareTab.tsx` → 0 hits |
| S5 | NCDocumentsSection transition-opacity 제거 | PASS | `grep "transition-opacity" NCDocumentsSection.tsx` → 0 hits |
| S6 | phase2-scanner-ncr networkidle 제거 | PASS | `grep "networkidle" phase2-scanner-ncr.spec.ts` → 0 hits |
| S7 | seed-view-form waitForTimeout 제거 | PASS | `grep "waitForTimeout" seed-view-form.spec.ts` → 0 hits |

## Summary

Iteration 1에서 지적된 2개 이슈가 모두 해결되었습니다:

1. **M8 해결**: `createMockDocumentService()`에 `downloadWithPresign`/`getThumbnailBuffer` mock 추가됨 → 808 tests 전부 통과
2. **S1 해결**: `previewMultiSheet`에 `try/catch` 구조 구현됨 (line 121–384) — 에러 시에만 임시 파일 삭제, 성공 시 `session.filePath` 보존

모든 MUST 기준 9/9 통과, 모든 SHOULD 기준 7/7 통과.
