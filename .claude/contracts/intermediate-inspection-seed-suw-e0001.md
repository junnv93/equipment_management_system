# Contract: intermediate-inspection-seed-suw-e0001

**Mode**: 1 (Lightweight)
**Slug**: intermediate-inspection-seed-suw-e0001
**Date**: 2026-04-19

## Scope

SUW-E0001(스펙트럼 분석기) 대상 중간점검 시드 데이터 추가 및 기존 버그 수정.
목표: UL-QP-18-03 양식 모든 섹션(헤더/점검항목/측정장비/결재란/동적섹션) 다운로드 검증 가능.

## Changed Files

1. `apps/backend/src/database/utils/uuid-constants.ts`
2. `apps/backend/src/database/seed-data/operations/intermediate-inspections.seed.ts`
3. `apps/backend/src/database/seed-test-new.ts`
4. `apps/backend/src/database/utils/verification.ts`

## MUST Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| M1 | `INTERMEDIATE_INSPECTION_001.equipmentId` = `EQUIP_SPECTRUM_ANALYZER_SUW_E_ID` (버그 수정) | Grep equipmentId in seed file |
| M2 | `INTERMEDIATE_INSPECTION_002` 추가 — equipmentId=SUW-E0001, approvalStatus='approved' | Grep INTERMEDIATE_INSPECTION_002 in seed |
| M3 | 점검 항목 5개 추가 — pass/fail 혼합 포함, detailedResult 있는 항목 ≥1 | Grep judgment.*fail in items seed |
| M4 | `INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA` 추가 — 측정장비 연결 ≥1건 | Grep INTERMEDIATE_INSPECTION_EQUIPMENT_SEED_DATA |
| M5 | `INSPECTION_RESULT_SECTIONS_SEED_DATA` 추가 — text + table 타입 각 1건 이상 | Grep sectionType in seed |
| M6 | seed runner TRUNCATE 목록에 `intermediate_inspection_equipment`, `inspection_result_sections` 추가 | Grep in seed-test-new.ts |
| M7 | seed runner에 INTERMEDIATE_INSPECTION_EQUIPMENT + INSPECTION_RESULT_SECTIONS insert 추가 | Grep schema.intermediateInspectionEquipment in seed-test-new.ts |
| M8 | 모든 신규 UUID가 uuid-constants.ts에 정의됨 | Grep INTERMEDIATE_INSPECTION_002_ID |
| M9 | `pnpm --filter backend run tsc --noEmit` PASS | Run tsc |

## SHOULD Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| S1 | verification.ts에 intermediate_inspections 카운트 검증 추가 | Grep intermediate_inspections in verification.ts |
| S2 | 시드 주석 정확성 (주석이 실제 equipmentId와 일치) | Code review |
