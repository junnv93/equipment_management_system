# Contract: Data Migration 아키텍처 개선 — 공용장비 분리 + 반출입 이력

slug: migration-shared-checkout
작성일: 2026-04-22

---

## MUST (필수 준수)

### SSOT
- **MUST** `MIGRATION_SHEET_TYPE` 신규 값은 `packages/schemas/src/data-migration.ts`에만 정의
- **MUST** 시트명은 `EXCEL_SHEET_NAMES` (`excel-labels.ts`)에서만 참조. 인라인 한국어 문자열 금지
- **MUST** 반출 목적/유형/상태는 SSOT enum (`CHECKOUT_PURPOSE_VALUES`, `CHECKOUT_TYPE_VALUES`, `CHECKOUT_STATUS_VALUES`) import
- **MUST** 공용장비 출처는 `SharedSourceEnum` (없으면 신규 생성)으로 관리, `SHARED_SOURCE_LABELS` 라벨 맵 동반
- **MUST** 에러 코드는 `MigrationErrorCode` 통해서만 참조. 문자열 리터럴 직접 사용 금지

### 데드코드 제거
- **MUST** `equipment` 테이블에서 `equipment_type`, `calibration_result` 컬럼 제거
- **MUST** Drizzle 스키마에서 두 필드 제거 후 `db:generate`로 마이그레이션 SQL 생성
- **MUST** 제거 후 전체 `pnpm tsc --noEmit` 통과
- **MUST** 컬럼매핑 엔트리는 `DEPRECATED_EQUIPMENT_COLUMNS`로 이관 (기존 Excel 호환)

### 공용장비 시트
- **MUST** 파서/validator가 자동 주입: `isShared: true`, `status: 'temporary'`, `approvalStatus: 'approved'`
- **MUST** 관리번호 미기입 시 `generateTemporaryManagementNumber()` 호출 — 수동 문자열 concat 금지
- **MUST** `createSharedEquipmentSchema` Zod 스키마 신규 정의: 필수 site, name, initialLocation, owner, usagePeriodStart, classification
- **MUST** `DEPRECATED_ALIAS_BY_SHEET['shared_equipment'] = new Set()` 등록

### 반출입 이력 시트
- **MUST** 1행 = checkouts 1건 + checkout_items 1건 (sequenceNumber=1, quantity=1)
- **MUST** `checkouts.status` 자동 결정:
  - `actualReturnDate` 존재 → `'returned'`
  - `actualReturnDate` 없음 + `checkoutDate` 과거 → `'checked_out'`
  - `checkoutDate` 미래 → `'pending'`
- **MUST** requesterId는 FK 해석(email 우선, name fallback). 실패 시 row를 ERROR 처리 (`CHECKOUT_REQUESTER_NOT_FOUND`)
- **MUST** `version = 1`, `createdAt = checkoutDate`, `updatedAt = checkoutDate`
- **MUST** `eventEmitter.emit()`, `emitAsync()` 호출 금지 (과거 데이터 — 이벤트 재생 금지)
- **MUST** `DEPRECATED_ALIAS_BY_SHEET['checkout'] = new Set()` 등록

### 트랜잭션 경계
- **MUST** `executeMultiSheet`의 단일 트랜잭션 내에서 모든 시트 INSERT
- **MUST** 장비(공용장비 포함) INSERT → mgmtNumToId 구축 → 이력/체크아웃 INSERT 순서 보장
- **MUST** 트랜잭션 실패 시 session.status → `'failed'`

### 캐시 무효화
- **MUST** 체크아웃 INSERT 성공 시 `CACHE_KEY_PREFIXES.CHECKOUTS` prefix 무효화
- **MUST** 체크아웃 INSERT 시 `CACHE_KEY_PREFIXES.EQUIPMENT` detail 캐시 무효화

### 타입 안전성
- **MUST** `any` 사용 금지 (Rule 3)
- **MUST** `getAliasIndexForType` switch에 신규 시트 타입 case 추가 (exhaustive `never` 체크 유지)
- **MUST** Drizzle의 `$inferInsert` 타입을 통해 buildCheckoutValues/buildSharedEquipmentValues 반환 타입 강제

### 보안
- **MUST** `Permission.PERFORM_DATA_MIGRATION` 가드 유지
- **MUST** 비-SYSTEM_ADMIN은 자신의 site만 마이그레이션 가능
- **MUST** checkout requester는 FK 해석 결과만 사용 — 클라이언트 userId 신뢰 금지

### DB 마이그레이션
- **MUST** `db:push` 사용 금지. 반드시 `db:generate` → `db:migrate` 또는 `db:reset`

---

## SHOULD (권장)

- **SHOULD** 참고값 시트에 SharedSource, CheckoutPurpose, CheckoutType, Classification 항목 추가
- **SHOULD** TEMP- 자동생성 규칙 설명 행 추가
- **SHOULD** `generateErrorReport`에 시트별 컬럼 헤더 분기 처리
- **SHOULD** FkResolutionService `fieldMap` 파라미터 일반화 (checkout 3 FK 재사용)
- **SHOULD** 공용장비/체크아웃 시트의 enum 필드에 DataValidation 드롭다운 제공

---

## 도메인별 성공 기준

### Domain 1: 공용장비 시트
- "공용장비" 시트 → detectSheetType이 `'shared_equipment'` 반환
- 관리번호 미기입 행 → TEMP- 자동 생성
- Execute 후 DB: `isShared=true`, `status='temporary'`

### Domain 2: 반출입 이력
- 1행 → checkouts 1건 + checkout_items 1건
- actualReturnDate 있음 → status=returned, 없음(과거) → status=checked_out
- FK 실패 → ERROR 상태, 알림 생성 없음

### Domain 3: 데드코드 제거
- `\d equipment` psql 출력에 `equipment_type`, `calibration_result` 컬럼 부재
- 전체 `tsc --noEmit` 통과
- 폐기 컬럼 포함 엑셀도 경고 없이 업로드 성공

### Domain 4: 참고값 시트
- 템플릿 다운로드 → 참고값 시트에 SHARED_SOURCE, CHECKOUT_PURPOSE, CHECKOUT_TYPE 존재
- 하드코딩 없음 (formatEnumWithLabels + SSOT values)

---

## 금지 사항

- `any` 타입 사용
- SSOT 우회 (로컬 enum 재정의)
- 체크아웃 마이그레이션 시 `eventEmitter.emit` / `emitAsync` 호출
- `TEMP-` 접두사 수동 문자열 concat
- 클라이언트 제공 userId 기반 requester 설정
- `db:push` 사용
- 시트명 인라인 하드코딩

---

## 검증 게이트

1. `pnpm tsc --noEmit` 전체 통과
2. `pnpm --filter backend run test -- data-migration` 통과
3. 로컬 DB에 엑셀 업로드 → Preview → Execute 성공, DB 레코드 검증
4. Self-audit 7개 체크 통과
