# 평가 보고서: renderer-db-boundary

**날짜**: 2026-04-18
**계약**: `.claude/contracts/renderer-db-boundary.md`
**반복**: 1

## MUST 기준 판정

| # | 기준 | 판정 | 비고 |
|---|------|------|------|
| M1 | `pnpm --filter backend exec tsc --noEmit` exit 0 | PASS | 출력 없음 (오류 0건) |
| M2 | `pnpm --filter backend run build` PASS | PASS | `nest build` 오류 없이 완료 |
| M3 | `pnpm --filter backend run test` PASS (회귀 0건) | PASS | 60 suites, 795 tests — 전원 통과 |
| M4 | `renderResultSections` 시그니처에 `db: AppDatabase` 파라미터 없음 | PASS | `docx-xml-helper.ts:525` — `(doc, prefetched: InspectionResultSectionPreFetched, storage)` |
| M5 | `SelfInspectionRendererService` 생성자에 `AppDatabase` inject 없음 | PASS | `self-inspection-renderer.service.ts` 전체 grep — `DRIZZLE_INSTANCE` 미존재 |
| M6 | `IntermediateInspectionRendererService` 생성자에 `AppDatabase` inject 없음 | PASS | `intermediate-inspection-renderer.service.ts` 전체 grep — `DRIZZLE_INSTANCE` 미존재 |
| M7 | `SelfInspectionExportData`에 `resultSections` 필드 존재 | PASS | `self-inspection-export-data.service.ts:89` — `resultSections: InspectionResultSectionPreFetched` |
| M8 | `IntermediateInspectionExportData`에 `resultSections` 필드 존재 | PASS | `intermediate-inspection-export-data.service.ts:91` — `resultSections: InspectionResultSectionPreFetched` |
| M9 | Data Service `getData()` 내부에서 `inspectionResultSections` 테이블 쿼리 존재 | PASS | 자체점검: L298-305, 중간점검: L222-229 — 각각 `inspectionType='self'`/`'intermediate'` 필터 포함 |
| M10 | `InspectionResultSectionPreFetched` 타입이 `docx-xml-helper.ts`에 export | PASS | `docx-xml-helper.ts:462` — `export interface InspectionResultSectionPreFetched` |

## SHOULD 기준 판정

| # | 기준 | 판정 | 비고 |
|---|------|------|------|
| S1 | `loadDocumentImagesBatch` 이름/시그니처 변경 시 기존 comment 참조 업데이트 | PASS | 코드베이스 전체 grep — `loadDocumentImagesBatch` 잔존 참조 0건. 내부 함수명이 `downloadSectionImages`로 변경되고 외부 노출 없음 |
| S2 | resultSections 선조회가 기존 병렬 Promise.all 블록에 통합되거나 별도 병렬 실행 | FAIL | 두 Data Service 모두 기존 `Promise.all` 완료 후 `sectionRows` → `sectionDocRows` 순차 직렬 실행. 병렬 통합 없음 |

## 최종 판정: PASS

MUST 기준 10/10 전원 충족. SHOULD S2 미충족(병렬화 누락)이나 MUST 기준에 해당하지 않으므로 최종 판정에 영향 없음.

### 부가 관찰 (수정 불필요)

- `sectionRows` 조회 후 `sectionDocumentIdSet` 수집, 그 다음 `sectionDocRows` 조회 — 두 번의 직렬 await가 추가됨. 섹션이 없는 경우(빈 점검) `sectionDocIds.length === 0` 가드로 documents 조회는 skip되나, `inspectionResultSections` 조회 자체는 항상 실행.
- S2 위반이 성능 회귀로 이어질 수 있으나 계약상 MUST가 아닌 SHOULD — 현 판정에서 FAIL 처리하되 코드 수정 대상임을 기록.
