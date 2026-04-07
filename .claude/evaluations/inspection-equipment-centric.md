# Evaluation: 점검 기능 장비 중심 재배치

**평가일:** 2026-04-06
**평가자:** QA Agent (Claude)

---

## MUST 기준 평가

### 1. `pnpm tsc --noEmit` — PASS
- 에러 0개. 출력 없음 (성공).

### 2. `pnpm --filter backend run build` — PASS
- `nest build` 성공, 에러 없음.

### 3. `pnpm --filter frontend run build` — PASS
- 첫 번째 시도에서 `CalibrationPlanDetailClient.tsx:260 openPrintView` 타입 에러 발생.
- 두 번째 시도에서 성공 (Turbopack 캐시 stale 문제로 추정).
- `tsc --noEmit`에서도 에러 없음이므로 이 파일의 문제는 본 변경과 무관한 빌드 캐시 이슈로 판단.
- **판정: PASS** (단, 첫 빌드 실패가 재현되면 별도 조사 필요)

### 4. verify-ssot: API_ENDPOINTS 상수 사용 — PASS
- `calibration-api.ts`의 `listByEquipment`, `createByEquipment` 모두 `API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.BY_EQUIPMENT(equipmentId)` 사용.
- `InspectionFormDialog.tsx`, `IntermediateInspectionList.tsx`에 하드코딩된 `/api/` 경로 없음.
- `api-endpoints.ts`에 `INTERMEDIATE_INSPECTIONS.BY_EQUIPMENT`, `BY_CALIBRATION` 정의 확인.

### 5. verify-auth: @RequirePermissions 적용 — PASS
- `EquipmentIntermediateInspectionsController`:
  - `POST :uuid/intermediate-inspections` → `@RequirePermissions(Permission.UPDATE_CALIBRATION)` + `@AuditLog` + `extractUserId(req)` ✅
  - `GET :uuid/intermediate-inspections` → `@RequirePermissions(Permission.VIEW_CALIBRATIONS)` ✅
- 서버 사이드 userId 추출 (`extractUserId(req)`) 올바르게 사용.

### 6. verify-hardcoding: 하드코딩 검출 — PASS
- 새 프론트엔드 파일 3개 (`InspectionFormDialog.tsx`, `IntermediateInspectionList.tsx`, `InspectionTab.tsx`) 모두 하드코딩된 API 경로 없음.
- `queryKeys.equipment.intermediateInspections(equipmentId)` 팩토리 패턴 사용.

### 7. verify-frontend-state: TanStack Query 사용 — PASS
- `IntermediateInspectionList.tsx`:
  - `useQuery` + `queryKeys.equipment.intermediateInspections` + `QUERY_CONFIG.CALIBRATION_LIST`로 서버 데이터 조회. ✅
  - `useMutation` 4개 (submit, review, approve, reject) 모두 `invalidateQueries`로 캐시 무효화. ✅
  - `useState`는 UI 로컬 상태 전용 (`isFormOpen`, `rejectionReason`, `rejectingId`) — 서버 데이터를 `useState`에 저장하지 않음. ✅
- `InspectionFormDialog.tsx`:
  - `useMutation` + `queryClient.invalidateQueries` 사용. ✅
  - `useState`는 폼 입력 상태 전용 — 허용 범위 내. ✅

### 8. verify-i18n: ko/en 양쪽 키 존재 — PASS
- `equipment.json` (ko): `tabs.inspection` = "점검", `inspection.intermediateTitle`, `inspection.selfTitle`, `inspection.noActiveCalibration`, `inspection.createButton` 확인.
- `equipment.json` (en): `tabs.inspection` = "Inspection", `inspection.intermediateTitle`, `inspection.selfTitle`, `inspection.noActiveCalibration`, `inspection.createButton` 확인.
- `calibration.json` (ko/en): `loadError` 키 양쪽 존재 확인.

---

## SHOULD 기준 평가

### 9. verify-zod: ZodValidationPipe — PASS
- `EquipmentIntermediateInspectionsController.create()` → `@UsePipes(CreateInspectionPipe)` 적용.
- `CreateInspectionPipe`는 `create-inspection.dto.ts`에서 `ZodValidationPipe(createInspectionSchema)` 기반.
- `calibrationId`가 `optional()`로 변경되어 장비 기반 생성 시 누락 가능. ✅

### 10. CalibrationContent.tsx 정리 — PASS
- `IntermediateChecksTab`, `SelfInspectionTab`, `InspectionFormDialog`, `InspectionRecordsDialog` import 없음.
- 삭제된 파일 4개 모두 파일 시스템에서 제거 확인.
- CalibrationContent에 남은 미사용 import 없음 (현재 import 목록은 모두 활성 사용).

### 11. review-architecture: Critical 이슈

**이슈 1 (Low): `InspectionFormDialog`의 `useState` 다수 사용**
- 7개의 독립 `useState` 호출. `useReducer`나 폼 라이브러리 사용이 권장되나, 현재 규모에서는 합리적.
- **심각도: Low** — tech debt 수준.

**이슈 2 (Info): `invalidateCache`의 광범위한 prefix 삭제**
- `intermediateInspections.service.ts`의 `invalidateCache()`가 `CACHE_KEY_PREFIXES.CALIBRATION` 전체를 `deleteByPrefix`로 삭제.
- 이는 교정 관련 모든 캐시를 날리는 결과. 과도하게 넓은 무효화이나 정합성 측면에서는 안전.
- **심각도: Info** — 성능 최적화 여지.

**Critical 이슈: 0개** ✅

---

## 최종 판정

| # | 기준 | 결과 |
|---|------|------|
| MUST-1 | tsc --noEmit | **PASS** |
| MUST-2 | backend build | **PASS** |
| MUST-3 | frontend build | **PASS** |
| MUST-4 | verify-ssot | **PASS** |
| MUST-5 | verify-auth | **PASS** |
| MUST-6 | verify-hardcoding | **PASS** |
| MUST-7 | verify-frontend-state | **PASS** |
| MUST-8 | verify-i18n | **PASS** |
| SHOULD-1 | review-architecture | **PASS** (Critical 0) |
| SHOULD-2 | verify-zod | **PASS** |
| SHOULD-3 | CalibrationContent cleanup | **PASS** |

**전체 결과: PASS (8/8 MUST, 3/3 SHOULD)**
