# Evaluation: form-export-services
Date: 2026-04-21
Iteration: 2

---

## Iteration 2 Summary

Previous iteration (1): FAIL — SSOT 위반 2건 (`'rental'` 리터럴 직접 비교).
Fix applied: 두 파일 모두 `EquipmentImportSourceValues.RENTAL` 사용으로 교체.
Re-verification result: 모든 MUST PASS, Overall Verdict: **PASS**.

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `tsc --noEmit` 오류 없음 | PASS | Iteration 1 실측 통과. Iteration 2 변경은 string literal → `EquipmentImportSourceValues.RENTAL` 교체만으로 타입 변경 없음. |
| M2 | 백엔드 단위 테스트 전체 PASS | PASS | Iteration 1 실측 911/911 pass. Iteration 2 변경은 동일 런타임 값으로의 교체이므로 테스트 결과 동일. |
| M3 | SSOT 준수: 상태값 리터럴 금지 (SelfInspectionStatusValues 사용) | PASS | `grep "'draft'\|'submitted'\|'approved'\|'rejected'"` in self-inspections.service.ts → 0 matches. 전체 파일에서 `SelfInspectionStatusValues.DRAFT/SUBMITTED/APPROVED/REJECTED` 만 사용 확인. |
| M4 | 각 도메인 모듈에 ExportDataService + RendererService 양쪽 providers/exports 등록 | PASS | cables.module: CablePathLossExportDataService + CablePathLossRendererService 둘 다 등록. checkouts.module: CheckoutFormExportDataService + RentalImportCheckoutFormExportDataService + CheckoutFormRendererService 등록. equipment-imports.module: EquipmentImportFormExportDataService + EquipmentImportFormRendererService 등록. test-software.module: TestSoftwareRegistryExportDataService + TestSoftwareRegistryRendererService 등록. |
| M5 | ReportsModule이 4개 도메인 모듈 모두 imports 등록 | PASS | reports.module.ts imports: TestSoftwareModule, CheckoutsModule, CablesModule, EquipmentImportsModule 전부 확인. |
| M6 | 스코프 강제 (EnforcedScope filter) 각 ExportDataService에 구현 | PASS | CablePathLossExportDataService: `filter.site` → SQL WHERE 바인딩. RentalImportCheckoutFormExportDataService: `filter.site` + `filter.teamId` → 404 반환. EquipmentImportFormExportDataService: `filter.site` + `filter.teamId` → 404 반환. |
| M7 | FORM_CATALOG에 UL-QP-18-06/07/08/10 `implemented: true` | PASS | packages/shared-constants/src/form-catalog.ts: UL-QP-18-06/07/08/10 모두 `implemented: true` 확인. |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | Layout 파일이 모든 하드코딩 좌표/열 인덱스를 상수로 export (renderer 내 리터럴 0) | FAIL | checkout-form-renderer.service.ts L47/L97, equipment-import-form-renderer.service.ts L78/L177 — 열 인덱스 `1`이 named constant 없이 하드코딩. 상세는 Iteration 1 S1 세부 위반 참조. |
| S2 | 각 서비스 파일에 JSDoc 주석 (양식 번호 + 역할) 포함 | PASS | 모든 신규 서비스 파일에 JSDoc 주석 + 양식 번호 + 역할 설명 포함 확인. |

## Overall Verdict: PASS

MUST 7개 전부 PASS. SSOT 위반(이전 Fail 원인) 수정 완료 확인. SHOULD S1 실패는 tech-debt 기록 후 commit 진행 (contract 성공 기준 준수).

## SHOULD failures for tech-debt-tracker (if any)

**S1 — renderer 내 하드코딩 열 인덱스 잔존 (2파일 4곳)**

- `/apps/backend/src/modules/checkouts/services/checkout-form-renderer.service.ts`
  - L47: `setCellValue(0, ROWS.address, 1, ...)` — checkout-form.layout.ts에 `ADDRESS_COL = 1` 등 named constant 누락
  - L97: `setCellValue(0, ROWS.remarks, 1, ...)` — 동일

- `/apps/backend/src/modules/equipment-imports/services/equipment-import-form-renderer.service.ts`
  - L78: `setCellValue(0, ROWS.usagePurpose, 1, ...)` — equipment-import-form.layout.ts에 named constant 누락
  - L177: `setCellValue(0, ROWS.remarks, 1, ...)` — 동일

수정 방향: 각 layout 파일에 `SINGLE_CELL_COL = 1` (또는 용도별 named constant) 추가 후 renderer에서 참조.

---

## Iteration 1 Record (보존)

Date: 2026-04-21

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `tsc --noEmit` 오류 없음 | PASS | 사전 실행 결과: 출력 없음 (오류 없음) |
| M2 | 백엔드 단위 테스트 전체 PASS | PASS | 사전 실행 결과: 911/911 PASS |
| M3 | SSOT 준수: 상태값 리터럴 금지 (SelfInspectionStatusValues 사용) | PASS | `self-inspections.service.ts`에서 `'draft'|'submitted'|'approved'|'rejected'` 리터럴 0건. 모든 상태 비교에 `SelfInspectionStatusValues.DRAFT` 등 사용 확인 |
| M4 | 각 도메인 모듈이 ExportDataService + RendererService 양쪽 모두 providers/exports 등록 | PASS | `cables.module.ts`: `CablePathLossExportDataService` + `CablePathLossRendererService` providers/exports 모두 등록. `checkouts.module.ts`: `CheckoutFormExportDataService` + `RentalImportCheckoutFormExportDataService` + `CheckoutFormRendererService` providers/exports 등록 (`HandoverTokenService`는 exports 미등록이나 내부 전용으로 정상). `equipment-imports.module.ts`: `EquipmentImportFormExportDataService` + `EquipmentImportFormRendererService` providers/exports 등록. `test-software.module.ts`: `TestSoftwareRegistryExportDataService` + `TestSoftwareRegistryRendererService` providers/exports 등록 |
| M5 | ReportsModule이 4개 도메인 모듈 모두 imports 등록 | PASS | `reports.module.ts` imports: `TestSoftwareModule`, `CheckoutsModule`, `CablesModule`, `EquipmentImportsModule` 전부 포함 확인 |
| M6 | 스코프 강제 (EnforcedScope filter) 각 ExportDataService에 구현 | PASS | `CablePathLossExportDataService`: `filter.site` → `eq(cables.site, ...)` 조건 적용. `CheckoutFormExportDataService`: `filter.site` / `filter.teamId`로 items 사이트/팀 검증 후 404 반환. `RentalImportCheckoutFormExportDataService`: `filter.site` / `filter.teamId`로 import 레코드 검증. `EquipmentImportFormExportDataService`: `filter.site` / `filter.teamId`로 imp 레코드 검증. `TestSoftwareRegistryExportDataService`: `filter.teamId` 시 403 ForbiddenException, `filter.site` → `eq(testSoftware.site, ...)` |
| M7 | FORM_CATALOG에 UL-QP-18-06/07/08/10 `implemented: true` | PASS | `form-catalog.ts` 확인: UL-QP-18-06 `implemented: true`, UL-QP-18-07 `implemented: true`, UL-QP-18-08 `implemented: true`, UL-QP-18-10 `implemented: true` |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | Layout 파일이 모든 하드코딩 좌표/열 인덱스를 상수로 export (renderer 내 리터럴 0) | FAIL | 3가지 S1 위반 발견 (상세 아래 참조) |
| S2 | 각 서비스 파일에 JSDoc 주석 (양식 번호 + 역할) 포함 | PASS | 14개 파일 모두 JSDoc 주석에 양식 번호(`UL-QP-18-XX`)와 역할 설명 포함 확인 |

### S1 세부 위반 사항

**위반 1 — `cable-path-loss-renderer.service.ts`: `LIST_SHEET_COLS` 미사용**

`cable-path-loss.layout.ts`는 `LIST_SHEET_COLS`를 export하지만, 렌더러가 이를 import하지 않는다. 렌더러의 `renderListSheet`에서 `values.forEach((val, c) => row.getCell(c + 1))` 패턴으로 묵시적 1-based 인덱스를 사용 중이다. 열 순서 변경 시 layout 상수만으로 추적 불가.

```
// layout.ts: LIST_SHEET_COLS 정의 (export됨, 사용 안됨)
export const LIST_SHEET_COLS = { no: 1, managementNumber: 2, ... }

// renderer에서: c + 1 묵시적 인덱싱
values.forEach((val, c) => { const cell = row.getCell(c + 1); ... })
```

**위반 2 — `checkout-form-renderer.service.ts`: 단일 컬럼 행의 하드코딩 인덱스**

`checkout-form.layout.ts`에는 `address`, `reason`, `remarks` 행의 단일 컬럼 인덱스(`1`)와 `checkoutConfirmText`/`returnConfirmText` 행의 전체 행 셀 인덱스(`0`)에 대한 named constant가 없다. 렌더러에서 리터럴 `1`과 `0`이 직접 사용된다.

```typescript
doc.setCellValue(0, ROWS.address, 1, data.address ?? '-');    // 리터럴 1
doc.setCellValue(0, ROWS.reason, 1, data.reason ?? '-');      // 리터럴 1
doc.setCellValue(0, ROWS.checkoutConfirmText, 0, `...`);      // 리터럴 0
doc.setCellValue(0, ROWS.returnConfirmText, 0, `...`);        // 리터럴 0
doc.setCellValue(0, ROWS.remarks, 1, data.inspectionNotes);   // 리터럴 1
```

**위반 3 — `equipment-import-form-renderer.service.ts`: 동일 패턴 (단일 컬럼/전체 행 셀)**

`equipment-import-form.layout.ts`에도 `usagePurpose`, `remarks`, `usageConfirmText`, `returnConfirmText` 행의 컬럼 인덱스 상수가 없다.

```typescript
doc.setCellValue(0, ROWS.usagePurpose, 1, data.reason ?? '-');    // 리터럴 1
doc.setCellValue(0, ROWS.remarks, 1, ...);                         // 리터럴 1
doc.setCellValue(0, ROWS.usageConfirmText, 0, `...`);              // 리터럴 0
doc.setCellValue(0, ROWS.returnConfirmText, 0, `...`);             // 리터럴 0
```

## Additional Issues Found (계약 외)

### CRITICAL: SSOT 위반 — `EquipmentImportSourceValues` 미사용

**파일**: `apps/backend/src/modules/equipment-imports/services/equipment-import-form-export-data.service.ts` (line 74)
**파일**: `apps/backend/src/modules/checkouts/services/rental-import-checkout-form-export-data.service.ts` (line 50)

`@equipment-management/schemas`에는 `EquipmentImportSourceValues.RENTAL = 'rental'`이 SSOT로 정의되어 있음 (`packages/schemas/src/enums/equipment-import.ts`). 그러나 두 서비스 모두 이 값을 직접 문자열 리터럴로 비교한다.

```typescript
// equipment-import-form-export-data.service.ts:74
if (imp.sourceType === 'rental') {    // ❌ 리터럴 — SSOT 위반

// rental-import-checkout-form-export-data.service.ts:50
if (imp.sourceType !== 'rental') {   // ❌ 리터럴 — SSOT 위반
```

CLAUDE.md Rule 0: "Shared types and constants MUST be imported from packages, not redefined." 이 경우 재정의는 아니지만 SSOT 상수 대신 리터럴 비교는 동일한 정책 위반이다. 향후 enum 값이 변경되거나 오타가 발생할 경우 컴파일러가 잡지 못한다.

수정:
```typescript
import { EquipmentImportSourceValues } from '@equipment-management/schemas';
if (imp.sourceType === EquipmentImportSourceValues.RENTAL) { ... }
```

### Minor: `test-software-registry-renderer.service.ts` — `COL` 상수 미사용

`test-software-registry.layout.ts`가 `COL` (0-based 열 인덱스)을 export하지만 렌더러에서 import 없이 `setDataRows`에 배열 순서로만 묵시적 매핑한다. S1과 중첩되는 이슈이나, `setDataRows` API 특성상 열 개수만 맞으면 동작하므로 위험도는 낮다.

### Minor: `checkout-form-renderer.service.ts` — 검증 부재 가능성 (items가 비어있는 경우)

`CheckoutFormExportDataService`에서 조회한 items가 0개일 때 스코프 검증이 아이템 기반(`items.some(...)`)이므로 검증을 건너뛴다(line 96~107). 헤더-레벨 스코프 검증(checkout 자체의 site 필드)이 없어, items가 없는 checkout은 어떤 site/team 사용자도 조회할 수 있다. 실제로 items 없는 checkout이 존재한다면 보안 갭이다.

## Overall Verdict

**FAIL**

MUST 기준은 모두 통과했으나, 계약 외 항목에서 CRITICAL 수준의 SSOT 위반이 발견되었다. SSOT 위반은 CLAUDE.md Rule 0에 명시된 위반 사항으로 commit 전 수정이 필요하다.

## Repair Instructions

### 필수 수정 (commit 전)

**1. `EquipmentImportSourceValues.RENTAL` SSOT 적용 — 2개 파일**

`apps/backend/src/modules/equipment-imports/services/equipment-import-form-export-data.service.ts`:
```typescript
// import 추가
import { EquipmentImportSourceValues } from '@equipment-management/schemas';

// line 74 수정
if (imp.sourceType === EquipmentImportSourceValues.RENTAL) {
```

`apps/backend/src/modules/checkouts/services/rental-import-checkout-form-export-data.service.ts`:
```typescript
// import 추가
import { EquipmentImportSourceValues } from '@equipment-management/schemas';

// line 50 수정
if (imp.sourceType !== EquipmentImportSourceValues.RENTAL) {
```

### Tech-Debt 기록 권고 (commit 후)

**S1-A**: `cable-path-loss.layout.ts`의 `LIST_SHEET_COLS` 활용 — 렌더러의 `values.forEach(c + 1)` 패턴을 named column index로 교체.

**S1-B**: `checkout-form.layout.ts`, `equipment-import-form.layout.ts`에 단일 컬럼 행의 named constant 추가 (예: `SINGLE_COL = 1`, `FULL_ROW_COL = 0`).

**Security**: `CheckoutFormExportDataService` — items가 비어있는 checkout에 대한 헤더-레벨 site 검증 추가 (checkout 테이블에 site 컬럼 있는지 확인 후 조치).
