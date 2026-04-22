# Data Migration 아키텍처 개선 — 공용장비 분리 + 반출입 이력 + 데드코드 제거

작성일: 2026-04-22
상태: active
담당: Generator (Phase 1~6 순차 실행)

## 목표 (WHAT)

1. 장비 시트를 "장비 등록"(정규 장비) + "공용장비"(임시 장비) 2개 시트로 분리
2. "반출입 이력" 시트로 checkouts + checkout_items 일괄 마이그레이션
3. `equipment.calibration_result`, `equipment.equipment_type` 컬럼 제거 (데드코드)
4. 참고값 시트에 공용장비·반출입 이력 전용 허용값 추가

## 아키텍처 원칙

- **SSOT**: `MIGRATION_SHEET_TYPE` enum (`packages/schemas/src/data-migration.ts`)에서 모든 시트 타입 정의
- **자동 주입**: 공용장비 시트 파싱 시 `isShared=true`, `status='temporary'`, TEMP- 관리번호를 파서/validator 레이어에서 주입
- **FK 해석 재사용**: checkouts의 requester/approver/returner는 FkResolutionService 확장으로 해석
- **워크플로 우회**: checkout 마이그레이션은 승인 이벤트/알림 발행 금지 (과거 데이터)
- **하드코딩 금지**: 시트명 → `EXCEL_SHEET_NAMES`, 에러 → `MigrationErrorCode`, enum → SSOT
- **DEPRECATED Set**: 신규 시트 타입 2개에 `DEPRECATED_ALIAS_BY_SHEET` 빈 Set 엔트리 필수 추가

---

## Phase 1 — SSOT 확장 (시트 타입 + 에러 코드)

의존성: 없음 (타 Phase 차단 선행)

### 변경 파일

#### 1.1 `packages/schemas/src/data-migration.ts`
- `MIGRATION_SHEET_TYPE`에 `SHARED_EQUIPMENT: 'shared_equipment'`, `CHECKOUT: 'checkout'` 추가
- `MigrationSheetType` 타입 자동 확장 (keyof 기반)

#### 1.2 `packages/shared-constants/src/error-codes.ts`
- `MigrationErrorCode`에 추가:
  - `CHECKOUT_REQUESTER_NOT_FOUND`: 반출 신청자 email/name 매칭 실패
  - `CHECKOUT_INVALID_STATUS`: 계산된 status가 유효하지 않음
  - `SHARED_EQUIPMENT_MISSING_OWNER`: 공용장비 owner 필수 누락

#### 1.3 `packages/schemas/src/enums/equipment.ts`
- `SharedSourceEnum` (값: `safety_lab`, `external`) SSOT 존재 여부 확인 후 없으면 추가
- `SHARED_SOURCE_VALUES`, `SHARED_SOURCE_LABELS` 내보내기

### 검증
```bash
pnpm --filter @equipment-management/schemas run tsc --noEmit
pnpm --filter @equipment-management/shared-constants run tsc --noEmit
```

---

## Phase 2 — DB 스키마 데드코드 제거

의존성: Phase 1 완료 무관 (독립)

### 변경 파일

#### 2.1 `packages/db/src/schema/equipment.ts`
- `equipmentType: varchar('equipment_type', { length: 50 })` 컬럼 제거
- `calibrationResult: text('calibration_result')` 컬럼 제거
- 관련 인덱스/주석 정리

#### 2.2 `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts`
- `EQUIPMENT_COLUMN_MAPPING`에서 `equipmentType` 엔트리 제거
- `calibrationResult` 엔트리 제거
- `DEPRECATED_EQUIPMENT_COLUMNS` 배열에 두 엔트리 이관 (기존 Excel 호환)

#### 2.3 DB 마이그레이션 SQL 생성
```bash
pnpm --filter backend run db:generate
# 생성된 SQL 파일 검토: ALTER TABLE equipment DROP COLUMN equipment_type, DROP COLUMN calibration_result
pnpm --filter backend run db:reset  # 로컬 DB에 적용
pnpm tsc --noEmit                   # 참조 누락 없는지 확인
```

---

## Phase 3 — 공용장비 시트 분리

의존성: Phase 1

### 변경 파일

#### 3.1 `apps/backend/src/modules/data-migration/constants/sheet-config.ts`
- `SHEET_CONFIGS`에 `SHARED_EQUIPMENT` 추가
  - namePatterns: `['공용장비', 'shared_equipment', 'shared equipment', '공용 장비', '임시장비']`
  - label: `'공용장비'`
- **중요**: `detectSheetType()`을 개선 — `namePatterns`를 "정확 포함 우선" 전략으로 개선하거나 SHARED_EQUIPMENT를 EQUIPMENT보다 먼저 등록 (순서 기반 우선순위 활용)

#### 3.2 `apps/backend/src/modules/data-migration/constants/shared-equipment-column-mapping.ts` (신규)
- `SHARED_EQUIPMENT_COLUMN_MAPPING` 정의
  - 필수: `site`, `name`, `initialLocation`, `owner`, `usagePeriodStart`, `classification`
  - 선택: `managementNumber`(없으면 TEMP- 자동 생성), `modelName`, `manufacturer`, `serialNumber`, `description`, `usagePeriodEnd`, `externalIdentifier`, `sharedSource`, `managerName`, `managerEmail`
  - 관리번호/isShared/status는 포함하지 않음 (파서가 자동 주입)
- `SHARED_EQUIPMENT_ALIAS_INDEX` 구성
- `DEPRECATED_SHARED_EQUIPMENT_ALIAS_SET = new Set()` 내보내기

#### 3.3 `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts`
- `DEPRECATED_ALIAS_BY_SHEET`에 `shared_equipment: DEPRECATED_SHARED_EQUIPMENT_ALIAS_SET` 추가

#### 3.4 `apps/backend/src/modules/data-migration/constants/excel-labels.ts`
- `EXCEL_SHEET_NAMES`에 `SHARED_EQUIPMENT: '공용장비'` 추가
- `REFERENCE_LABELS`에 `SHARED_SOURCE: '공용출처(sharedSource)'`, `CLASSIFICATION: '장비분류(classification)'` 추가

#### 3.5 `packages/schemas/src/equipment.ts` (또는 해당 스키마 파일)
- `createSharedEquipmentSchema` 신규 export
  - 필수: site, name, initialLocation, owner, usagePeriodStart, classification
  - 자동 주입 대상 (선택): isShared, status, approvalStatus

#### 3.6 `apps/backend/src/modules/data-migration/services/migration-validator.service.ts`
- `validateSharedBatch(rows, options)` public 메서드 추가
  - 내부: isShared=true, status='temporary', approvalStatus='approved' 주입
  - TEMP- 관리번호 자동 생성 (site + classification + DB sequential)
  - createSharedEquipmentSchema로 safeParse
  - DB 중복 검사는 fetchExistingManagementNumbers 재사용

#### 3.7 `apps/backend/src/modules/data-migration/services/excel-parser.service.ts`
- `getAliasIndexForType` switch에 `'shared_equipment'` case 추가 (exhaustive 강제)
- `generateTemplate()`에 공용장비 시트 추가
- 참고값 시트에 SharedSource, Classification 행 추가

#### 3.8 `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
- `previewMultiSheet`에 `SHARED_EQUIPMENT` 분기 추가
  - validateSharedBatch 호출
  - 유효 관리번호를 `equipmentMgmtNumbers` Set에 추가
- `executeMultiSheet` 트랜잭션에 `SHARED_EQUIPMENT` INSERT 블록 추가
  - buildEntityFromRow 재사용 (isShared/status가 row.data에 이미 주입됨)
  - mgmtNumToId Map에 추가
- 각 1개씩 허용: EQUIPMENT 1개 + SHARED_EQUIPMENT 1개 (기존 "장비 시트 1개" 제약 완화)

### 검증
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- data-migration
```

---

## Phase 4 — 반출입 이력 시트 추가

의존성: Phase 1

### 변경 파일

#### 4.1 `apps/backend/src/modules/data-migration/constants/checkout-column-mapping.ts` (신규)
- `CHECKOUT_COLUMN_MAPPING` 정의
  - 필수: `managementNumber`, `checkoutDate`, `expectedReturnDate`, `purpose`, `destination`, `reason`, `requesterEmail` 또는 `requesterName`
  - 선택: `actualReturnDate`, `checkoutType`, `approverEmail`, `approverName`, `returnerEmail`, `returnerName`, `phoneNumber`, `address`, `rejectionReason`
  - FK 가상 필드: requesterEmail, requesterName, approverEmail, approverName, returnerEmail, returnerName
- `CHECKOUT_ALIAS_INDEX` + `DEPRECATED_CHECKOUT_ALIAS_SET = new Set()`

#### 4.2 `apps/backend/src/modules/data-migration/constants/sheet-config.ts`
- `CHECKOUT` 항목 추가
  - namePatterns: `['반출', 'checkout', '반출입', '반출 이력', 'checkout history']`
  - label: `'반출입 이력'`

#### 4.3 `apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts`
- `DEPRECATED_ALIAS_BY_SHEET`에 `checkout: DEPRECATED_CHECKOUT_ALIAS_SET` 추가

#### 4.4 `apps/backend/src/modules/data-migration/constants/excel-labels.ts`
- `EXCEL_SHEET_NAMES.CHECKOUT: '반출입 이력'` 추가
- `REFERENCE_LABELS.CHECKOUT_PURPOSE`, `CHECKOUT_TYPE` 추가

#### 4.5 `apps/backend/src/modules/data-migration/services/fk-resolution.service.ts`
- 기존 `resolveBatch` 확장: `fieldMap` 파라미터로 임의의 email/name 필드명 지정 가능하게 일반화
  - checkout용: `{ managerEmail: 'requesterEmail', managerName: 'requesterName', ... }` 형태로 requester/approver/returner 3쌍 해석

#### 4.6 `apps/backend/src/modules/data-migration/services/history-validator.service.ts`
- `validateCheckoutBatch(rows, validManagementNumbers)` 추가
  - `checkoutRowSchema` Zod 정의: managementNumber, checkoutDate(date, required), expectedReturnDate(date), purpose(enum), destination, reason, requesterEmail or requesterName (refine: 최소 1개 필수), actualReturnDate(optional)
  - 관리번호 크로스 검증: validManagementNumbers에 없으면 ERROR

#### 4.7 `apps/backend/src/modules/data-migration/services/data-migration.service.ts`
- `previewMultiSheet`에 CHECKOUT 분기: validateCheckoutBatch → FK 해석
- `executeMultiSheet` CHECKOUT INSERT 블록 (트랜잭션 내):
  1. candidateRows 필터
  2. FK 해석 결과에서 requesterId, approverId, returnerId 주입
  3. **status 자동 결정**:
     - `actualReturnDate` 존재 → `'returned'`
     - `actualReturnDate` 없음 + `checkoutDate` 과거 → `'checked_out'`
     - `checkoutDate` 미래 → `'pending'`
  4. `buildCheckoutValues(row, fkResult, userId)` → checkouts INSERT (RETURNING id)
  5. `buildCheckoutItemValues(checkoutId, equipmentId, row)` → checkout_items INSERT
  6. **이벤트 발행 금지**
  7. approvedAt = checkoutDate (과거 데이터), version = 1
- 신규 private 메서드: `buildCheckoutValues`, `buildCheckoutItemValues`
- 캐시 무효화: CHECKOUTS prefix + EQUIPMENT detail

### 검증
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- data-migration
```

---

## Phase 5 — 참고값 시트 고도화

의존성: Phase 3, 4

### 변경 파일

#### 5.1 `apps/backend/src/modules/data-migration/services/excel-parser.service.ts`
- 참고값 시트 추가 행 (formatEnumWithLabels + SSOT 사용):
  - SharedSource: SHARED_SOURCE_VALUES + SHARED_SOURCE_LABELS
  - CheckoutPurpose: CHECKOUT_PURPOSE_VALUES + CHECKOUT_PURPOSE_LABELS
  - CheckoutType: CHECKOUT_TYPE_VALUES + CHECKOUT_TYPE_LABELS
  - Classification: CLASSIFICATION_VALUES + CLASSIFICATION_LABELS
  - TEMP- 번호 자동 생성 규칙 설명 행

---

## Phase 6 — 통합 E2E 검증

의존성: Phase 1~5 완료

### 검증 시나리오

1. 공용장비 3행 (관리번호 미기입 2행) → Preview: TEMP- 자동 생성 확인, Execute: isShared=true, status=temporary
2. 반출입 이력 3행 (반납된 1건 + 진행 중 1건 + 예정 1건) → Execute: status 각각 returned/checked_out/pending
3. 데드코드: 교정결과/장비유형 컬럼 포함 엑셀 업로드 → 경고 없이 무시 확인
4. 4개 시트 통합 파일 → 장비 등록 + 공용장비 + 교정이력 + 반출입 이력 동시 성공

### 최종 검증 명령
```bash
pnpm tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run test:e2e -- data-migration
```

---

## 관련 파일 (절대 경로 목록)

**수정할 기존 파일:**
- `/home/kmjkds/equipment_management_system/packages/schemas/src/data-migration.ts`
- `/home/kmjkds/equipment_management_system/packages/schemas/src/enums/equipment.ts`
- `/home/kmjkds/equipment_management_system/packages/schemas/src/equipment.ts`
- `/home/kmjkds/equipment_management_system/packages/shared-constants/src/error-codes.ts`
- `/home/kmjkds/equipment_management_system/packages/db/src/schema/equipment.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/constants/sheet-config.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/constants/equipment-column-mapping.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/constants/excel-labels.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/services/excel-parser.service.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/services/migration-validator.service.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/services/history-validator.service.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/services/fk-resolution.service.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/services/data-migration.service.ts`

**신규 생성 파일:**
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/constants/shared-equipment-column-mapping.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/modules/data-migration/constants/checkout-column-mapping.ts`
- `/home/kmjkds/equipment_management_system/apps/backend/src/database/migrations/<auto>.sql` (db:generate 자동)
