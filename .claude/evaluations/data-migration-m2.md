# Evaluation Report: data-migration-m2
Date: 2026-04-18
Iteration: 2 (final)

## Verdict: PASS

## MUST Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | tsc --noEmit exit 0 | PASS | exit 0 확인 |
| M2 | builder raw enum 리터럴 0건 | PASS | grep 0 hits. CableStatusEnum.enum.active, SoftwareAvailabilityEnum.enum.available, CalibrationFactorApprovalStatusValues.APPROVED, NonConformanceStatusEnum.enum.closed/open 사용 |
| M3 | Execute indexOf 미사용 + explicit index | PASS | validRows.indexOf 0건. chunkOffset + chunkIdx 패턴으로 전환, chunkOffset은 loop 끝에서 증가 |
| M4 | 교정 중복키 agencyName | PASS | 4건 확인 (queryFn ×2 + buildCalibrationValues + key 계산) |
| M5 | 수리 중복키 repairDescription | PASS | 4건 확인 (queryFn ×2 + buildRepairValues + key 계산) |
| M6 | filePath 저장 + finally 삭제 | PASS | types.ts filePath 필드 존재, service.ts finally 블록에서 deleteFile + if 가드 + 내부 try-catch warn |
| M7 | 장비 매핑 9건 active 승격 | PASS | EQUIPMENT_COLUMN_MAPPING에 9개 dbField 확인, DEPRECATED_EQUIPMENT_COLUMNS 빈 배열 |
| M8 | location 버그 수정 | PASS | buildEntityFromRow: (data.initialLocation ?? data.location), CUSTOM_HANDLED 'location' 등록 유지 |
| M9 | data-migration 유닛 테스트 통과 | PASS | 55 passed, 0 failed (column-mapping.spec.ts 1건 테스트 업데이트 포함) |
| M10 | row status 리터럴 0건 (M1 회귀) | PASS | grep 0 hits |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | EQUIPMENT_NOT_FOUND error | PASS | history-validator.service.ts line 156 확인 |
| S2 | completionDate fallback | PASS | buildCalibrationValues: (row.data.completionDate as Date | undefined) ?? calibrationDate |
| S3 | schemas SSOT 4종 import | PASS | service.ts에 4종 모두 import 확인 |
| S4 | surgical change | PASS | service.ts + equipment-column-mapping.ts + column-mapping.spec.ts (테스트 동작 업데이트) 3개 파일 |
| S5 | lint | SKIP | |
| S6 | DEPRECATED_ALIAS_SET export 보존 | PASS | equipment-column-mapping.ts line 452: buildAliasSet(빈 배열) → 빈 Set, export 유지 |

## Iteration 이력

| Iteration | Verdict | 발견 이슈 | 조치 |
|-----------|---------|-----------|------|
| 1 | FAIL | M6: deleteFile이 try 성공 경로에만 존재 (catch 경로 파일 누출) | finally 블록으로 이동 |
| 2 | PASS | M9: column-mapping.spec.ts deprecated 승격 테스트 업데이트 필요 | 테스트를 새 동작(active 승격) 기준으로 업데이트 |

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|-----------|
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` | C2 explicit index, C1 enum SSOT, location fallback, finally 블록 |
| `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts` | 9개 DEPRECATED → active 승격, DEPRECATED 빈 배열 |
| `apps/backend/src/modules/data-migration/__tests__/column-mapping.spec.ts` | deprecated 승격 동작 반영 테스트 업데이트 |
