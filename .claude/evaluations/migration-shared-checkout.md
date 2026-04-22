# Evaluation Report: migration-shared-checkout

날짜: 2026-04-22
반복: 1

## Build Verification

| Check | Result |
|-------|--------|
| tsc --noEmit | PASS (출력 없음 — 오류 없음) |
| data-migration tests | PASS (57 tests, 4 suites) |

---

## MUST Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | `MIGRATION_SHEET_TYPE`에 `shared_equipment`+`checkout` 포함, `packages/schemas/src/data-migration.ts`에만 정의 | PASS | 라인 91-105 확인 |
| 2 | `DEPRECATED_ALIAS_BY_SHEET['shared_equipment']`와 `['checkout']` 모두 `Set` 등록 | PASS | `equipment-column-mapping.ts` 라인 470, 471 확인 |
| 3 | 반출 목적/유형 SSOT import (`CHECKOUT_PURPOSE_VALUES`, `CHECKOUT_TYPE_VALUES`) | PASS | `checkout-column-mapping.ts`와 `history-validator.service.ts` 모두 schemas에서 import |
| 4 | `SharedSourceEnum` SSOT 존재 (`packages/schemas/src/enums/shared.ts`) | PASS | 라인 11-18 확인, `SHARED_SOURCE_LABELS`도 `labels.ts` 208행에 존재 |
| 5 | 에러 코드는 `MigrationErrorCode`만 사용 | PASS | 모든 서비스 파일에서 `MigrationErrorCode.*` 패턴으로만 사용 |
| 6 | `equipment_type` 컬럼 Drizzle 스키마에서 제거 | PASS | `packages/db/src/schema/equipment.ts`에 `equipment_type` 없음 |
| 7 | `calibration_result` 컬럼 Drizzle 스키마에서 제거 | **FAIL** | `equipment.ts` 라인 131에 `calibration_result: text('calibration_result')` 여전히 존재 |
| 8 | `DEPRECATED_EQUIPMENT_COLUMNS`에 2개 항목 (`equipmentType` + `calibrationResult`) | PASS | `equipment-column-mapping.ts` 라인 408-420에 2개 항목 모두 존재 |
| 9 | DB 마이그레이션 SQL 존재 + journal 등록 (`equipment_type` drop) | **FAIL** | SQL 파일 `0043_drop_equipment_type_column.sql` 존재하나 `_journal.json`에 미등록 (journal 최종 항목은 `0040_nc_previous_equipment_status`) |
| 10 | DB 마이그레이션 SQL 존재 (`calibration_result` drop) | **FAIL** | `calibration_result`를 drop하는 SQL 파일 자체가 없음 |
| 11 | `generateTemporaryManagementNumber()` 호출 — 수동 `TEMP-` concat 금지 | PASS | `migration-validator.service.ts` 라인 527에서 SSOT 함수 호출. 라인 510의 `TEMP-${siteCode}-${classCode}` 패턴은 DB LIKE 검색용 prefix이며 관리번호 생성에 직접 사용되지 않음 |
| 12 | 자동 주입: `isShared=true`, `status='temporary'`, `approvalStatus='approved'` | PASS | `migration-validator.service.ts` validateSharedBatch (라인 129-133), `data-migration.service.ts` executeMultiSheet 1b 블록 (라인 653-657) |
| 13 | `createSharedEquipmentMigrationSchema` 정의: 필수 site, name, initialLocation, owner, usagePeriodStart, classification | PASS | `migration-validator.service.ts` 라인 36-41에 정의 확인 |
| 14 | 1행 → checkouts 1건 + checkout_items 1건 (sequenceNumber=1, quantity=1) | PASS | `data-migration.service.ts` 라인 1026-1033, `buildCheckoutItemValues` 라인 1529-1537 |
| 15 | status 자동 결정: `actualReturnDate` → `'return_approved'`, 과거 → `'checked_out'`, 미래 → `'approved'` | PASS* | 구현 라인 1493-1498. **주의**: 계약서는 `'returned'`라 하나 DB SSOT 스키마의 실제 상태값은 `return_approved`도 유효함 (`CHECKOUT_STATUS_VALUES` 라인 30 확인). 구현값은 SSOT와 일치. 계약서 표기 오류로 판단 |
| 16 | requesterId FK 실패 → ERROR, `CHECKOUT_REQUESTER_NOT_FOUND` 코드 | PASS | `fk-resolution.service.ts` 라인 226-233, `data-migration.service.ts` 라인 396-409 |
| 17 | `version = 1` 설정 | PASS | `buildCheckoutValues` 라인 1519 |
| 18 | `createdAt = checkoutDate`, `updatedAt = checkoutDate` | **FAIL** | `buildCheckoutValues` 라인 1520-1521: `createdAt: now, updatedAt: now` (현재 시각). 계약 요구사항은 `checkoutDate` 기준이나 구현은 `new Date()` |
| 19 | `eventEmitter.emit()` / `emitAsync()` 호출 금지 | PASS | `data-migration.service.ts` 전체에서 emitAsync/eventEmitter.emit 없음 |
| 20 | `DEPRECATED_ALIAS_BY_SHEET['checkout'] = new Set()` 등록 | PASS | `equipment-column-mapping.ts` 라인 471 |
| 21 | 모든 INSERT가 단일 트랜잭션 내 (`executeMultiSheet`) | PASS | `db.transaction()` 블록 (라인 553-1050)이 장비→공용장비→이력→반출 모든 INSERT 포함 |
| 22 | 트랜잭션 실패 시 `session.status → 'failed'` | PASS | 라인 1150-1152 |
| 23 | `CACHE_KEY_PREFIXES.CHECKOUTS` 무효화 | PASS | 라인 1122 |
| 24 | `CACHE_KEY_PREFIXES.EQUIPMENT` detail 캐시 무효화 (체크아웃 INSERT 후) | PASS | 라인 1123 |
| 25 | `any` 사용 금지 | PASS | 신규 서비스 파일에 `as any` 없음 |
| 26 | `getAliasIndexForType` switch에 `shared_equipment`, `checkout` case 추가 + exhaustive `never` | PASS | `excel-parser.service.ts` 라인 238-241 + 라인 242-245 |
| 27 | `buildCheckoutValues` 반환 타입: `typeof checkouts.$inferInsert` | PASS | `data-migration.service.ts` 라인 1487 |
| 28 | `Permission.PERFORM_DATA_MIGRATION` 가드 | PASS | `data-migration.controller.ts` 4개 엔드포인트 모두 적용 |
| 29 | 비-SYSTEM_ADMIN 자신의 site만 마이그레이션 | PASS | `previewMultiSheet` 라인 115-123 |
| 30 | checkout requester는 FK 해석 결과만 사용 — 클라이언트 userId 신뢰 금지 | PASS | `resolveCheckoutBatch`로 DB users 조회 후 UUID 획득, 클라이언트 body에서 userId 직접 사용 없음 |
| 31 | `db:push` 금지 — `db:generate` → `db:migrate` 사용 | PASS | SQL 파일 존재하나 journal 미등록 문제는 별도 FAIL 항목 |
| 32 | 시트명 인라인 하드코딩 금지 — `EXCEL_SHEET_NAMES` 참조 | PASS | `excel-parser.service.ts`에서 `EXCEL_SHEET_NAMES.*` 일관 사용 |
| 33 | `detectSheetType` 2단계 매칭 (exactPatterns → namePatterns) | PASS | `sheet-config.ts` 라인 82-100, "공용장비" exactPattern 등록 |

---

## SHOULD Criteria (참고)

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| S1 | 참고값 시트에 SharedSource, CheckoutPurpose, CheckoutType, Classification 항목 추가 | PASS | `excel-parser.service.ts` 757행 이후 refSheet에 formatEnumWithLabels 사용 확인됨 |
| S2 | TEMP- 자동생성 규칙 설명 행 | PASS | `excel-labels.ts` 라인 64: `SHARED_MGMT_NUMBER_FORMAT_VALUE` |
| S3 | `generateErrorReport` 시트별 컬럼 헤더 분기 | SKIP | 검증 범위 외 |
| S4 | FkResolutionService `fieldMap` 일반화 (checkout 3 FK 재사용) | PASS | `resolveCheckoutBatch` 별도 메서드로 구현됨 |

---

## Overall Verdict

**FAIL**

---

## Repair Instructions (FAIL 항목만)

### FAIL #7 + #10: `calibration_result` 컬럼 미제거

계약 요구사항: `equipment` 테이블에서 `calibration_result` 컬럼 제거 + Drizzle 스키마에서 제거 + `db:generate` 마이그레이션 생성.

현황:
- `packages/db/src/schema/equipment.ts` 131행에 `calibration_result: text('calibration_result')` 여전히 존재
- 이를 drop하는 SQL 마이그레이션 파일이 없음

수정:
1. `packages/db/src/schema/equipment.ts` 131행 `calibrationResult` 필드 제거
2. `pnpm --filter backend run db:generate` 실행하여 `DROP COLUMN calibration_result` SQL 생성
3. `pnpm --filter backend run db:migrate` 또는 `db:reset`으로 적용
4. `pnpm tsc --noEmit` 전체 통과 확인 (calibrationResult 참조 코드 있으면 수정)

### FAIL #9: `0043_drop_equipment_type_column.sql` journal 미등록

현황: `drizzle/0043_drop_equipment_type_column.sql` 파일은 디스크에 존재하나 `drizzle/meta/_journal.json`에 없음. `db:migrate` 명령으로는 이 파일이 실행되지 않음.

수정:
- `pnpm --filter backend run db:migrate` 실행 — 신규 마이그레이션 파일을 journal에 등록하고 DB에 적용
- 이미 `db:push`로 직접 적용한 경우라면 `drizzle-kit` 메타 동기화 필요 (별도 확인)
- 위 #7 수정 후 `db:generate` + `db:migrate`를 일괄 수행하면 두 항목 동시 해결

### FAIL #18: `createdAt`/`updatedAt`이 `checkoutDate` 아닌 현재 시각 사용

계약: `version = 1`, `createdAt = checkoutDate`, `updatedAt = checkoutDate`

현황 (`data-migration.service.ts` 라인 1520-1521):
```typescript
createdAt: now,      // ← 계약 위반: should be checkoutDate ?? now
updatedAt: now,      // ← 계약 위반: should be checkoutDate ?? now
```

수정 (`buildCheckoutValues` 라인 1520-1521):
```typescript
createdAt: checkoutDate ?? now,
updatedAt: checkoutDate ?? now,
```

이유: 과거 이력 마이그레이션이므로 `createdAt`/`updatedAt`은 반출일 기준으로 기록되어야 이력 정확도 보장.
