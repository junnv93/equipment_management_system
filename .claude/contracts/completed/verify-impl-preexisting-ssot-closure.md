# Contract: verify-impl-preexisting-ssot-closure

> Slug: `verify-impl-preexisting-ssot-closure` · Mode: 2 · Generated: 2026-05-09
> Plan: `.claude/exec-plans/active/2026-05-09-verify-impl-preexisting-ssot-closure.md`

---

## MUST (loop-blocking)

### M-1 ~ M-3: Build / Type / Test Green

- **M-1** `pnpm --filter frontend run tsc --noEmit` 통과 (error 0)
- **M-2** `pnpm --filter frontend run build` 통과
- **M-3** `pnpm --filter frontend run test` 통과 — 회귀 0건

### M-4: Issue 1 — SelectItem value 리터럴 → SSOT 배열 교체

- **M-4a** `CalibrationHistoryClient.tsx` 승인상태 SelectItem 리터럴 0건
  ```bash
  grep -c 'value="pending_approval"\|value="approved"\|value="rejected"' \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: 0
  ```
- **M-4b** `CalibrationHistoryClient.tsx` 결과 SelectItem 리터럴 0건
  ```bash
  grep -c 'value="pass"\|value="fail"\|value="conditional"' \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: 0
  ```
- **M-4c** `CalibrationContent.tsx` 승인상태 SelectItem 리터럴 0건
  ```bash
  grep -c 'value="pending_approval"\|value="approved"\|value="rejected"' \
    'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'
  # expected: 0
  ```
- **M-4d** `CalibrationContent.tsx` 결과 SelectItem 리터럴 0건
  ```bash
  grep -c 'value="pass"\|value="fail"\|value="conditional"' \
    'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'
  # expected: 0
  ```
- **M-4e** `CALIBRATION_APPROVAL_STATUS_VALUES` import + 사용 존재
  ```bash
  grep -c "CALIBRATION_APPROVAL_STATUS_VALUES" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: >= 2
  ```

### M-5: Issue 2 — BasicInfoTab 도메인 리터럴 비교 → SSOT 상수

- **M-5a** 스트링 리터럴 직접 비교 0건
  ```bash
  grep -c "=== 'required'\|=== 'not_required'\|=== 'suwon'\|=== 'uiwang'\|=== 'pyeongtaek'\|=== 'match'\|=== 'mismatch'" \
    apps/frontend/components/equipment/BasicInfoTab.tsx
  # expected: 0
  ```
- **M-5b** SSOT 상수 import 존재
  ```bash
  grep -c "CALIBRATION_REQUIRED_VALUES\|SPEC_MATCH_VALUES\|SITE_VALUES" \
    apps/frontend/components/equipment/BasicInfoTab.tsx
  # expected: >= 3
  ```

### M-6: Issue 3 — UPCOMING_DAYS 로컬 상수 제거

- **M-6** `const UPCOMING_DAYS` 0건, `CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS` 사용
  ```bash
  grep -c "const UPCOMING_DAYS" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: 0
  grep -c "CALIBRATION_THRESHOLDS" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: >= 1
  ```

### M-7: Issue 4 — 하드코딩 라우트 → FRONTEND_ROUTES

- **M-7a** `CalibrationHistoryClient.tsx` backUrl 인라인 제거
  ```bash
  grep -c '`/equipment/${equipmentId}`' \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: 0
  grep -c "FRONTEND_ROUTES" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: >= 1
  ```
- **M-7b** `IncidentHistoryTab.tsx` repair-history href 제거
  ```bash
  grep -c '`/equipment/${equipmentId}/repair-history`' \
    apps/frontend/components/equipment/IncidentHistoryTab.tsx
  # expected: 0
  grep -c "REPAIR_HISTORY" \
    apps/frontend/components/equipment/IncidentHistoryTab.tsx
  # expected: >= 1
  ```
- **M-7c** `CalibrationContent.tsx` '/calibration/register' 제거
  ```bash
  grep -c "'/calibration/register'" \
    'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'
  # expected: 0
  grep -c "FRONTEND_ROUTES.CALIBRATION.REGISTER" \
    'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'
  # expected: >= 1
  ```

### M-8: Issue 5a — MaintenanceHistoryTab node 인라인 → getTimelineNodeClasses

- **M-8** `getTimelineNodeClasses` 호출 존재, 인라인 조합 제거
  ```bash
  grep -c "getTimelineNodeClasses" \
    apps/frontend/components/equipment/MaintenanceHistoryTab.tsx
  # expected: >= 1
  grep -c "node\.container.*bg-brand-ok" \
    apps/frontend/components/equipment/MaintenanceHistoryTab.tsx
  # expected: 0
  ```

### M-9: Issue 5b — getPageContainerClasses 명시적 'list' variant

- **M-9a** `CalibrationHistoryClient.tsx` `getPageContainerClasses('list')` 존재
  ```bash
  grep -c "getPageContainerClasses('list')" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: >= 1
  ```
- **M-9b** `CalibrationContent.tsx` `getPageContainerClasses('list')` 존재
  ```bash
  grep -c "getPageContainerClasses('list')" \
    'apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx'
  # expected: >= 1
  ```

### M-10: Issue 6 — server-side 초기 필터 파싱

- **M-10a** `page.tsx` searchParams 보유
  ```bash
  grep -c "searchParams" \
    'apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx'
  # expected: >= 1
  ```
- **M-10b** `page.tsx` parseCalibrationFiltersFromSearchParams 호출
  ```bash
  grep -c "parseCalibrationFiltersFromSearchParams" \
    'apps/frontend/app/(dashboard)/equipment/[id]/calibration-history/page.tsx'
  # expected: >= 1
  ```
- **M-10c** `CalibrationHistoryClient.tsx` initialFilters prop 보유
  ```bash
  grep -c "initialFilters" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: >= 1
  ```

### M-11: Issue 7 — updateFilter 변경 없음 (no regression)

- **M-11** updateFilter 함수 구조 유지
  ```bash
  grep -c "updateFilter" \
    apps/frontend/components/equipment/CalibrationHistoryClient.tsx
  # expected: >= 5
  ```

---

## SHOULD (권고 — loop-blocking 아님)

- **S-1** CalibrationHistoryClient `ApprovalFilter` 타입을 `'' | CalibrationApprovalStatus`로 좁히는 것 권고
- **S-2** CalibrationHistoryClient `ResultFilter` 타입을 `'' | CalibrationResult`로 좁히는 것 권고
- **S-3** IncidentHistoryTab FRONTEND_ROUTES import를 기존 import 라인과 합산 권고
