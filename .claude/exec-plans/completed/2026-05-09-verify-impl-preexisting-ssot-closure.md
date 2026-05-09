# 2026-05-09 verify-impl-preexisting-ssot-closure

> Slug: `verify-impl-preexisting-ssot-closure` · Mode: 2
> 7 pre-existing SSOT/design-token/routing 이슈 atomic closure.

---

## Goal

verify-implementation이 식별한 7건의 기존 SSOT 위반을 수술적으로 해결한다.
신규 API/백엔드 코드 0건, 수정 파일 6건, 테스트 회귀 0건.

---

## Phase A: Discovery 결과 (확인 완료)

### A.1 schemas SSOT 상수

| 상수 | 파일 | 라인 |
|---|---|---|
| `CALIBRATION_APPROVAL_STATUS_VALUES` | `packages/schemas/src/enums/calibration.ts` | L11 |
| `CALIBRATION_RESULT_VALUES` | `packages/schemas/src/enums/calibration.ts` | L39 |
| `CALIBRATION_REQUIRED_VALUES` | `packages/schemas/src/enums/calibration.ts` | L95 |
| `SPEC_MATCH_VALUES` | `packages/schemas/src/enums/calibration.ts` | L132 |
| `SITE_VALUES` | `packages/schemas/src/enums/equipment.ts` | L77 |

모두 `@equipment-management/schemas`에서 `export * from './calibration'` / `'./equipment'`로 re-export.

### A.2 FRONTEND_ROUTES 라우트

| 경로 | `packages/shared-constants/src/frontend-routes.ts` 위치 |
|---|---|
| `FRONTEND_ROUTES.EQUIPMENT.DETAIL(id)` | L69 → `` `/equipment/${id}` `` |
| `FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY(id)` | L87 → `` `/equipment/${id}/repair-history` `` |
| `FRONTEND_ROUTES.CALIBRATION.REGISTER` | L191 → `'/calibration/register'` |

### A.3 CALIBRATION_THRESHOLDS

위치: `apps/frontend/lib/design-tokens/components/calibration.ts:38-41`
키: `CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS` (= 30, shared-constants 위임)
CalibrationContent는 이미 사용 중. CalibrationHistoryClient는 로컬 `const UPCOMING_DAYS = 30` 사용 중.

### A.4 getPageContainerClasses

위치: `apps/frontend/lib/design-tokens/index.ts` 재수출
기본값: `variant = 'list'`. 명시 호출로 의도 문서화.

### A.5 getTimelineNodeClasses

위치: `apps/frontend/lib/design-tokens/components/equipment-timeline.ts:66`
재수출: `apps/frontend/lib/design-tokens/index.ts:303`
시그니처: `getTimelineNodeClasses(iconBgColor: string): string`
→ `shadow-lg`는 함수 결과 외부에서 별도 병합.

### A.6 parseCalibrationFiltersFromSearchParams

위치: `apps/frontend/lib/utils/calibration-filter-utils.ts:121`
시그니처: `parseCalibrationFiltersFromSearchParams(searchParams: ...): UICalibrationFilters`
→ `UICalibrationFilters` 타입도 동일 파일 L56에 정의.

### A.7 Issue 7 — 결론: 변경 없음

`CalibrationHistoryClient.tsx`의 `updateFilter(118-130)` 단일 caller + useCallback 완비.
프로젝트 컨벤션(ApprovalsClient, FormTemplatesContent) 일치 → 추출 불필요.

---

## Phase B: 수정 파일 목록

### B.1 `apps/frontend/components/equipment/CalibrationHistoryClient.tsx`

| 이슈 | 변경 내용 |
|---|---|
| Issue 1 | 승인상태 SelectItem value 3건 → `CALIBRATION_APPROVAL_STATUS_VALUES.map()` 동적 렌더 |
| Issue 1 | 결과 SelectItem value 3건 → `CALIBRATION_RESULT_VALUES.map()` 동적 렌더 |
| Issue 3 | `const UPCOMING_DAYS = 30` 제거 → `CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS` |
| Issue 4 | `backUrl` 인라인 → `FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentId)` |
| Issue 5b | `getPageContainerClasses()` → `getPageContainerClasses('list')` |
| Issue 6 | `initialFilters?: UICalibrationFilters` optional prop 추가 |

신규 import:
- `CALIBRATION_APPROVAL_STATUS_VALUES`, `CALIBRATION_RESULT_VALUES` from `@equipment-management/schemas`
- `CALIBRATION_THRESHOLDS` from `@/lib/design-tokens` (기존 import에 추가)
- `type UICalibrationFilters` from `@/lib/utils/calibration-filter-utils`

### B.2 `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx`

| 이슈 | 변경 내용 |
|---|---|
| Issue 1 | 승인상태 SelectItem value 3건 → `CALIBRATION_APPROVAL_STATUS_VALUES.map()` |
| Issue 1 | 결과 SelectItem value 3건 → `CALIBRATION_RESULT_VALUES.map()` |
| Issue 4 | `router.push('/calibration/register')` → `router.push(FRONTEND_ROUTES.CALIBRATION.REGISTER)` |
| Issue 5b | `getPageContainerClasses()` → `getPageContainerClasses('list')` |

신규 import:
- `CALIBRATION_APPROVAL_STATUS_VALUES`, `CALIBRATION_RESULT_VALUES` from `@equipment-management/schemas`
- `FRONTEND_ROUTES` 이미 import 중 여부 확인 후 추가

### B.3 `apps/frontend/components/equipment/BasicInfoTab.tsx`

| 이슈 | 변경 내용 |
|---|---|
| Issue 2 | `=== 'required'/'not_required'` → `CALIBRATION_REQUIRED_VALUES[0]/[1]` |
| Issue 2 | `=== 'suwon'/'uiwang'/'pyeongtaek'` → `SITE_VALUES[0]/[1]/[2]` |
| Issue 2 | `=== 'match'/'mismatch'` → `SPEC_MATCH_VALUES[0]/[1]` |

신규 import: `CALIBRATION_REQUIRED_VALUES, SPEC_MATCH_VALUES, SITE_VALUES` from `@equipment-management/schemas`

### B.4 `apps/frontend/components/equipment/IncidentHistoryTab.tsx`

| 이슈 | 변경 내용 |
|---|---|
| Issue 4 | `href` 인라인 → `FRONTEND_ROUTES.EQUIPMENT.REPAIR_HISTORY(equipmentId)` (L667) |

신규 import: `FRONTEND_ROUTES` from `@equipment-management/shared-constants` (기존 import 확인 후 추가)

### B.5 `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx`

| 이슈 | 변경 내용 |
|---|---|
| Issue 5a | L326 인라인 className → `getTimelineNodeClasses('bg-brand-ok')` + ` shadow-lg` |

신규 import: `getTimelineNodeClasses` from `@/lib/design-tokens`

### B.6 `apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx`

| 이슈 | 변경 내용 |
|---|---|
| Issue 6 | `PageProps`에 `searchParams: Promise<...>` 추가 |
| Issue 6 | `parseCalibrationFiltersFromSearchParams` 호출 |
| Issue 6 | `CalibrationHistoryClient`에 `initialFilters={initialFilters}` 전달 |

신규 import: `parseCalibrationFiltersFromSearchParams`, `type UICalibrationFilters` from `@/lib/utils/calibration-filter-utils`

---

## Phase C: 검증 명령

```bash
# 타입 검증
pnpm --filter frontend run tsc --noEmit

# 테스트 회귀
pnpm --filter frontend run test

# Issue 1: SelectItem 리터럴 0건
grep -c 'value="pending_approval"\|value="approved"\|value="rejected"\|value="pass"\|value="fail"\|value="conditional"' \
  apps/frontend/components/equipment/CalibrationHistoryClient.tsx

grep -c 'value="pending_approval"\|value="approved"\|value="rejected"\|value="pass"\|value="fail"\|value="conditional"' \
  'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'

# Issue 2: 도메인 리터럴 비교 0건
grep -c "=== 'required'\|=== 'not_required'\|=== 'suwon'\|=== 'uiwang'\|=== 'pyeongtaek'\|=== 'match'\|=== 'mismatch'" \
  apps/frontend/components/equipment/BasicInfoTab.tsx

# Issue 3: 로컬 상수 0건
grep -c "const UPCOMING_DAYS" \
  apps/frontend/components/equipment/CalibrationHistoryClient.tsx

# Issue 4: 하드코딩 라우트 0건
grep -c '`/equipment/${equipmentId}`' \
  apps/frontend/components/equipment/CalibrationHistoryClient.tsx

grep -c '`/equipment/${equipmentId}/repair-history`' \
  apps/frontend/components/equipment/IncidentHistoryTab.tsx

grep -c "'/calibration/register'" \
  'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'

# Issue 5a: node.container 인라인 조합 0건
grep -c "TIMELINE_TOKENS\.node\.container.*bg-brand-ok\|bg-brand-ok.*shadow-lg.*text-white" \
  apps/frontend/components/equipment/MaintenanceHistoryTab.tsx

# Issue 6: 서버 파싱 추가 확인
grep -c "parseCalibrationFiltersFromSearchParams" \
  'apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx'
```

---

## 변경 순서 (파일별 독립)

1. `BasicInfoTab.tsx` — Issue 2
2. `IncidentHistoryTab.tsx` — Issue 4
3. `MaintenanceHistoryTab.tsx` — Issue 5a
4. `CalibrationHistoryClient.tsx` — Issue 1+3+4+5b+6
5. `CalibrationContent.tsx` — Issue 1+4+5b
6. `calibration-history/page.tsx` — Issue 6
