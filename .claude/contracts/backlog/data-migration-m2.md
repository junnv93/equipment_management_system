---
slug: data-migration-m2
phase: Phase 3
date: 2026-04-18
---

# Contract: data-migration-m2

## 배경

M1 완료 후 남은 data-migration 모듈 gap을 정리. 사전 조사 결과 브리프 항목의 절반이 이미 구현되어 있어 M2는 실제 잔존 gap 4개(C2 indexing / C1 enum SSOT / #3 매핑 승격 / location 버그)에 집중.

---

## MUST Criteria (모두 PASS해야 루프 종료)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `tsc --noEmit` exit 0 | `pnpm --filter backend exec tsc --noEmit` |
| M2 | builder raw enum 리터럴 0건 | `grep -nE "status: 'active'\|availability: 'available'\|approvalStatus: 'approved'\|correctionDate \? 'closed'" apps/backend/src/modules/data-migration/services/data-migration.service.ts` → 0 hits |
| M3 | Execute fkResolutions index 정합 (`validRows.indexOf` 미사용) | `grep -n "validRows.indexOf" apps/backend/src/modules/data-migration/services/data-migration.service.ts` → 0 hits. Preview/Execute 양쪽이 explicit numeric index 사용 |
| M4 | 교정 중복키에 `agencyName` 포함 | filterCalibrationDuplicates queryFn select 및 existingKeys 복합키에 agencyName 포함 확인 — `grep -n "agencyName:" ...service.ts` → 3건 이상 (queryFn ×2 + key 계산 ×1) |
| M5 | 수리 중복키에 `repairDescription` 포함 | filterRepairDuplicates queryFn select 및 existingKeys 복합키에 repairDescription 포함 확인 — `grep -n "repairDescription:" ...service.ts` → 3건 이상 |
| M6 | `filePath` 저장 + finally 삭제 | (a) `types/data-migration.types.ts`에 `filePath?: string` 필드 존재. (b) service.ts에서 `session.filePath` 저장 + `finally` 블록에서 `deleteFile(session.filePath)` 호출 |
| M7 | 장비 매핑 9건 active 승격 | `EQUIPMENT_COLUMN_MAPPING`에 `externalIdentifier`, `correctionFactor`, `isShared`, `sharedSource`, `owner`, `usagePeriodStart`, `usagePeriodEnd`, `managerEmail`, `deputyManagerEmail` 9개 dbField 엔트리 존재. 동시에 `DEPRECATED_EQUIPMENT_COLUMNS`에서 동일 9개 제거 (중복 정의 금지) |
| M8 | location 버그 수정 | `buildEntityFromRow`가 `data.initialLocation ?? data.location`을 `entity.location`에 반영. `grep -n "initialLocation ?? \|initialLocation ||" ...service.ts` → buildEntityFromRow 내부 1건 이상 |
| M9 | data-migration 유닛 테스트 통과 | `pnpm --filter backend run test -- data-migration` exit 0 |
| M10 | M1 회귀 체크 — row status 리터럴 0건 | `grep -nE "status:\s*'(valid\|warning\|error\|duplicate)'" ...service.ts` → 0 hits |

---

## SHOULD Criteria (실패 시 tech-debt에 기록, 루프 차단 안 함)

| # | Criterion | Verification |
|---|-----------|-------------|
| S1 | history-validator `EQUIPMENT_NOT_FOUND` error 반환 | `grep -n "EQUIPMENT_NOT_FOUND" apps/backend/src/modules/data-migration/services/history-validator.service.ts` → 1건 이상 |
| S2 | `buildCalibrationValues`에서 `completionDate ?? calibrationDate` fallback 사용 | `grep -n "completionDate" ...service.ts` → buildCalibrationValues 내부 1건 이상 |
| S3 | schemas SSOT 상수 4종 import | `grep -n "CableStatusEnum\|SoftwareAvailabilityEnum\|CalibrationFactorApprovalStatusValues\|NonConformanceStatusEnum" ...service.ts` → 4종 이상 |
| S4 | surgical change — 수정 파일 2개 외 diff 없음 | git diff 검토 |
| S5 | lint 에러 수 증가 없음 | `pnpm --filter backend run lint` exit 0 또는 기존 수준 유지 |
| S6 | `DEPRECATED_EQUIPMENT_ALIAS_SET` export 보존 (빈 배열이어도) | `grep -n "DEPRECATED_EQUIPMENT_ALIAS_SET" ...equipment-column-mapping.ts` → 1건 이상 |

---

## Out of Scope

- data-migration 모듈 외 파일 수정 (schemas, shared-constants, db, 타 모듈)
- 새 API 엔드포인트 / DTO 필드 / controller 메서드
- 기존 테스트 수정 (C1 enum 치환은 값 동등성 유지하므로 기존 테스트 그대로 통과 기대)
- FK resolution 로직 변경 (C2는 key indexing 정합성만)
- `DEPRECATED_EQUIPMENT_COLUMNS` 배열/Set export 완전 제거 (빈 배열로 보존)
- Excel 템플릿 레이아웃 / ExcelParserService 변경
- Frontend wizard / hooks / 컴포넌트 변경
- Drizzle 스키마 / 마이그레이션 / E2E 추가
- `MigrationSessionStatus` / `MIGRATION_ROW_STATUS` / `MIGRATION_SHEET_TYPE` 변경 (M1 완결)
