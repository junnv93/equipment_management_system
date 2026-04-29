---
slug: tech-debt-batch-0419
iteration: 1
---

## Must Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | backend tsc exit 0 | `cd apps/backend && npx tsc --noEmit` → 오류 0건 |
| M2 | frontend tsc exit 0 | `cd apps/frontend && npx tsc --noEmit` → 오류 0건 |
| M3 | backend build exit 0 | `pnpm --filter backend run build` |
| M4 | C3: DocumentsController IStorageProvider 주입 제거 | `grep -n "STORAGE_PROVIDER\|IStorageProvider" apps/backend/src/modules/documents/documents.controller.ts` → 0 hits |
| M5 | C3: DocumentService에 downloadWithPresign + getThumbnailBuffer 존재 | `grep -n "downloadWithPresign\|getThumbnailBuffer" apps/backend/src/common/file-upload/document.service.ts` → 2 hits 이상 |
| M6 | H1: 케이블 캐시 무효화 호출 (복합 프리픽스) | `grep -n "cables:" apps/backend/src/modules/data-migration/services/data-migration.service.ts` → 1 hit (새 CABLES 상수 추가 없이 복합 프리픽스 직접 사용) |
| M7 | H3: markPreviewHistoryDuplicates fallthrough 제거 | `markPreviewHistoryDuplicates` 함수에서 CABLE/TEST_SOFTWARE/CALIBRATION_FACTOR/NON_CONFORMANCE가 filterIncidentDuplicates로 분기되지 않음 |
| M8 | backend unit tests 통과 | `cd apps/backend && npx jest --silent` → 0 failures |
| M9 | backend lint 통과 | `pnpm --filter backend run lint` → 에러 증가 없음 |

## Should Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | previewMultiSheet catch 블록 추가 (에러 시에만 삭제) | `grep -n "catch" apps/backend/src/modules/data-migration/services/data-migration.service.ts` → previewMultiSheet 범위 내 임시 파일 삭제 로직 존재 |
| S2 | history-card 'equipment_photo' 리터럴 제거 | `grep -n "'equipment_photo'" apps/backend/src/modules/equipment/services/history-card-data.service.ts` → 0 hits |
| S3 | en/equipment.json selfInspection.form 3키 추가 | `grep -n "calibrationValidityPeriodPlaceholder\|selectClassification\|snapshotSectionLabel" apps/frontend/messages/en/equipment.json` → 3 hits |
| S4 | SoftwareTab transition-colors 제거 | `grep -n "transition-colors" apps/frontend/components/equipment/SoftwareTab.tsx` → 0 hits |
| S5 | NCDocumentsSection transition-opacity 제거 | `grep -n "transition-opacity" apps/frontend/components/non-conformances/NCDocumentsSection.tsx` → 0 hits |
| S6 | phase2-scanner-ncr networkidle 제거 | `grep -n "networkidle" apps/frontend/tests/e2e/features/equipment/qr/phase2-scanner-ncr.spec.ts` → 0 hits |
| S7 | seed-view-form waitForTimeout 제거 | `grep -n "waitForTimeout" apps/frontend/tests/e2e/features/calibration/inspection-form/seed-view-form.spec.ts` → 0 hits |

## Out of Scope

- C1/C2 (data-migration enum 리터럴 / indexOf): 이전 세션 완료
- exportSoftwareValidation N+1 / exportSoftwareRegistry ForbiddenException: 이미 구현됨
- EquipmentRegistryDataService SELECT *: 이미 projection 적용
- wf-25/wf-35/wf-export/validation-logic/full-flow E2E: grep 확인 결과 패턴 없음
- unwrapResponseData (form-templates-api.ts 등): grep 0 hits, 이미 해결
- Drizzle 스키마 / DB 마이그레이션 변경
- 새 API 엔드포인트 추가
