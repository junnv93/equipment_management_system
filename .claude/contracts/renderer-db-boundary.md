# Contract: renderer-db-boundary

**Slug**: renderer-db-boundary  
**Mode**: 1 (Lightweight)  
**Date**: 2026-04-18  
**Scope**: Data Service에서 inspection_result_sections 선조회 → Renderer DB 의존성 제거

## Context

현재 `SelfInspectionRendererService`와 `IntermediateInspectionRendererService`가
`@Inject('DRIZZLE_INSTANCE') db: AppDatabase`를 주입받아
`renderResultSections(doc, id, type, this.db, this.storage)`에 전달.

이는 Renderer가 DB를 직접 알아야 하는 계층 위반.
목표: Data Service가 `inspection_result_sections` 행 + 섹션 이미지 경로를 선조회하여
`ExportData`에 포함 → Renderer는 `db` 없이 순수 template injection.

## MUST Criteria

| # | 기준 |
|---|------|
| M1 | `pnpm --filter backend run tsc --noEmit` exit 0 |
| M2 | `pnpm --filter backend run build` PASS |
| M3 | `pnpm --filter backend run test` PASS (회귀 0건) |
| M4 | `renderResultSections` 함수 시그니처에 `db: AppDatabase` 파라미터 없음 |
| M5 | `SelfInspectionRendererService` 생성자에 `AppDatabase` inject 없음 |
| M6 | `IntermediateInspectionRendererService` 생성자에 `AppDatabase` inject 없음 |
| M7 | `SelfInspectionExportData`에 `resultSections` 필드 존재 |
| M8 | `IntermediateInspectionExportData`에 `resultSections` 필드 존재 |
| M9 | Data Service `getData()` 내부에서 `inspectionResultSections` 테이블 쿼리 존재 |
| M10 | `InspectionResultSectionPreFetched` 타입이 `docx-xml-helper.ts`에 export |

## SHOULD Criteria

| # | 기준 |
|---|------|
| S1 | `loadDocumentImagesBatch` 이름/시그니처 변경 시 기존 comment 참조 업데이트 |
| S2 | Data Service의 resultSections 선조회가 기존 병렬 Promise.all 블록에 통합되거나 별도 병렬 실행 |

## 변경 파일 목록

1. `apps/backend/src/modules/reports/docx-xml-helper.ts`
2. `apps/backend/src/modules/self-inspections/services/self-inspection-export-data.service.ts`
3. `apps/backend/src/modules/self-inspections/services/self-inspection-renderer.service.ts`
4. `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-export-data.service.ts`
5. `apps/backend/src/modules/intermediate-inspections/services/intermediate-inspection-renderer.service.ts`
