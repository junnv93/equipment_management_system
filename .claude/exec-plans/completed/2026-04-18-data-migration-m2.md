# Exec Plan: data-migration M2
Date: 2026-04-18
Slug: data-migration-m2
Mode: 2

## 요약

M1(SSOT/Permission/State-machine)에 이은 M2. 사전 조사 결과 브리프 항목 중 **#2 중복키 / #4 filePath cleanup / #5 completionDate / #9 history validator**는 이미 구현됨. 실제 잔존 gap 4개만 수정:

1. **C2** — Execute 단계 `indexOf(row)` (O(n²) + 묵시적 필터 계약 의존)을 explicit numeric index 주입으로 전환 (equipment + test-software 양쪽)
2. **C1** — builder 메서드 4곳의 DB enum raw 리터럴(`'active'`, `'available'`, `'approved'`, `'open'/'closed'`)을 schemas SSOT 상수로 교체
3. **#3** — `DEPRECATED_EQUIPMENT_COLUMNS`에서 실 DB 컬럼 7개 + 가상 FK 이메일 2개를 `EQUIPMENT_COLUMN_MAPPING`으로 승격
4. **location 버그** — `buildEntityFromRow`가 `initialLocation`만 반영하여 Excel의 `location` 직접입력을 유실하는 이슈

추가 검증 대상(이미 구현 확인):
- 교정 중복키 agencyName, 수리 중복키 repairDescription 포함 여부 (contract M4/M5)
- filePath 저장 + finally deleteFile 호출 (contract M6)

---

## Phase 1: CRITICAL 수정 (C1 + C2)

### 파일 목록

- `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
  - **C2 목표**: Execute의 equipment 시트 chunk loop에서 `validRows.indexOf(row)` 제거. Preview와 Execute가 **같은 공식으로 validRows 인덱스를 산출**하도록 `validRows.map((row, idx) => ...)` 또는 `.entries()` 기반 explicit index 주입으로 전환. test-software 시트의 `candidateRows.map((row, idx) => ...)` 경로도 묵시적 계약임을 주석으로 명시하거나 동일 explicit 패턴으로 정렬.
  - **C1 목표**: 4개 builder 메서드의 raw enum 리터럴을 schemas SSOT 상수 참조로 교체.
    - `buildCableValues`: `status: 'active'` → `CableStatusEnum.enum.active` 또는 동등한 SSOT 상수
    - `buildTestSoftwareValues`: `availability: 'available'` → `SoftwareAvailabilityEnum.enum.available`
    - `buildCalibrationFactorValues`: `approvalStatus: 'approved'` → `CalibrationFactorApprovalStatusValues.APPROVED`
    - `buildNonConformanceValues`: `correctionDate ? 'closed' : 'open'` → `correctionDate ? NonConformanceStatusEnum.enum.closed : NonConformanceStatusEnum.enum.open`
  - import 라인 갱신: `CableStatusEnum`, `SoftwareAvailabilityEnum`, `CalibrationFactorApprovalStatusValues`, `NonConformanceStatusEnum`를 `@equipment-management/schemas`에서 추가 import
  - **범위 제한**: 해당 4개 builder 메서드와 equipment/test-software Execute 블록만. 다른 로직/주석/포맷 건드리지 않음.

---

## Phase 2: 이력 중복키 재검증 (#2 — 이미 구현 확인용)

### 파일 목록

- `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
  - **교정 중복키 검증**: `filterCalibrationDuplicates` queryFn select에 `agencyName` 포함 + 복합키 `${equipmentId}:${calibrationDate.getTime()}:${agencyName ?? ''}` 유지 확인. 수정 없음 — contract 검증만.
  - **수리 중복키 검증**: `filterRepairDuplicates` queryFn select에 `repairDescription` 포함 + 복합키 확인. 수정 없음 — contract 검증만.

---

## Phase 3: 장비 컬럼 매핑 확장 (#3)

### 파일 목록

- `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts`
  - **목표**: `DEPRECATED_EQUIPMENT_COLUMNS` 배열에서 실제 DB 컬럼 7개 + FK 가상 필드 2개를 `EQUIPMENT_COLUMN_MAPPING`으로 승격
    - 실 컬럼 승격 (packages/db/src/schema/equipment.ts 기준): `externalIdentifier`, `correctionFactor`, `isShared` (`toBoolean` transform 유지), `sharedSource`, `owner`, `usagePeriodStart` (`parseExcelDate`), `usagePeriodEnd` (`parseExcelDate`)
    - 가상 FK 필드 승격: `managerEmail`, `deputyManagerEmail` — FkResolutionService가 소비하는 필드이므로 active에 편입 (buildEntityFromRow의 CUSTOM_HANDLED에 이미 포함되어 실제 DB insert에 직접 반영되지 않음)
  - **삭제**: `DEPRECATED_EQUIPMENT_COLUMNS`에서 위 9개를 제거. 배열이 비면 `[]`로 유지하되 `DEPRECATED_EQUIPMENT_ALIAS_SET` export는 보존
  - **위치 선택**: 실 컬럼 7개는 "관리대장에 없는 추가 필드" 섹션에 추가. FK 이메일 2개는 "FK 해석용 가상 필드" 섹션에 추가
  - **중복 회피**: 이미 active에 있는 `equipmentType`/`calibrationResult`는 추가 금지

- `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
  - **location 버그 수정** (`buildEntityFromRow` 내부):
    - 현재: `initialLocation`만 `entity['location']`에 할당
    - 수정 목표: `initialLocation ?? location` 순으로 fallback — Excel에 `location` 헤더만 사용한 경우에도 `equipment.location` 컬럼에 값 반영
    - CUSTOM_HANDLED는 그대로 유지 (자동 매핑 루프와의 충돌 방지)

---

## Phase 4: 파일 cleanup + completionDate 재검증 (#4, #5 — 이미 구현 확인용)

- `data-migration.types.ts`: `filePath?: string` 필드 존재 확인. 수정 없음.
- `data-migration.service.ts`: `session.filePath` 저장 + `finally deleteFile` 호출 확인. 수정 없음.
- `calibration-column-mapping.ts`: `completionDate` 매핑 존재 확인. 수정 없음.

---

## Phase 5: 이력 시트 관리번호 DB 검증 (#9 — 이미 구현 확인용)

- `history-validator.service.ts`: `EQUIPMENT_NOT_FOUND` error 반환 확인. 수정 없음.
- `data-migration.service.ts`: Preview/Execute 양쪽 DB batch lookup 확인. 수정 없음.

---

## 변경 파일 범위 경계

**수정 대상 2개 파일만**:
1. `apps/backend/src/modules/data-migration/services/data-migration.service.ts` (Phase 1 C1/C2 + Phase 3 location)
2. `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts` (Phase 3 매핑 승격)

**touch 금지**: history-validator.service.ts, migration-validator.service.ts, fk-resolution.service.ts, excel-parser.service.ts, calibration-column-mapping.ts, 기타 column-mapping 파일, DTO, controller, module, types, schemas 패키지, shared-constants 패키지, 테스트 파일

---

## 검증 명령어

```bash
# 1. 타입 체크
pnpm --filter backend exec tsc --noEmit

# 2. 유닛 테스트
pnpm --filter backend run test -- data-migration

# 3. C1 raw 리터럴 잔존 여부
grep -n "status: 'active'\|availability: 'available'\|approvalStatus: 'approved'\|correctionDate ? 'closed'" \
  apps/backend/src/modules/data-migration/services/data-migration.service.ts

# 4. M7 row status 리터럴 (M1 회귀 체크)
grep -nE "status:\s*'(valid|warning|error|duplicate)'" \
  apps/backend/src/modules/data-migration/services/data-migration.service.ts

# 5. C2 indexOf 잔존 여부
grep -n "validRows.indexOf" apps/backend/src/modules/data-migration/services/data-migration.service.ts

# 6. #3 active 매핑 승격 확인 (9개 필드)
grep -nE "dbField: '(externalIdentifier|correctionFactor|isShared|sharedSource|owner|usagePeriodStart|usagePeriodEnd|managerEmail|deputyManagerEmail)'" \
  apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts

# 7. 중복키 정합성 (Phase 2 회귀 체크)
grep -n "agencyName:" apps/backend/src/modules/data-migration/services/data-migration.service.ts
grep -n "repairDescription:" apps/backend/src/modules/data-migration/services/data-migration.service.ts
```

---

## 주의사항

1. **브리프 과반이 이미 구현됨** — M1(2026-04-18) + 누적 커밋으로 filePath cleanup, 중복키 확장, completionDate, history-validator DB 검증이 모두 완비. M2는 실제 gap만 좁게 수정.

2. **C1 grep 패턴 불일치** — 브리프의 `status: 'valid'|'warning'|'error'|'duplicate'`는 M1에서 이미 완료. 진짜 C1 타겟은 builder의 DB enum 리터럴(`'active'`, `'available'`, `'approved'`, `'open'/'closed'`).

3. **C2 indexOf** — in-memory 세션에서는 동작하지만 O(n²) + 묵시적 필터 계약 의존. Explicit numeric index로 전환하여 명시적 계약 확립.

4. **#3 managerEmail/deputyManagerEmail** — FK 가상 필드지만 FkResolutionService가 참조. DEPRECATED 유지 시 Excel 템플릿에서 이메일 컬럼이 사라져 FK 해석이 이름 폴백만 가능해지는 기능 열화 발생.

5. **location 버그는 silent data loss** — `equipment.location` 컬럼 비어있지만 `location_history`는 기록되는 불일치 발생. fallback 1줄로 해결.

6. **DEPRECATED_EQUIPMENT_ALIAS_SET export 보존 필수** — ExcelParserService의 unmapped 경고 억제에 사용.
