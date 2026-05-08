# Evaluation Report: Phase A Architecture Followup — 3 Gap Closure

## 메타

- **Slug**: `phase-a-arch-followup`
- **모드**: Mode 1 (다른 세션 contract `calibration-cert-phase-a-architecture-closure` 의 명시적 후속)
- **Commit**: `6a773892` (push origin/main 반영)
- **트리거**: tech-debt-tracker line 44 "트리거: filter-chip-shared-component-b-apply 적용 후 commit" + query-r3-closure commit `19fa8145` origin 반영 + 사용자 명시 "이번 세션 모두 해결"
- **선행 sprint**: `calibration-cert-phase-a-architecture-closure` (옵션 C closure, commits `ad42b6ea` + `ba3f258f` + `96710f8b`) — 6 갭 중 partial closure (Gap 2b, 4, 6b 의도적 후속 분리)

## 처리한 갭 (3건 통합 closure)

| 갭 | 우선순위 | Status |
|---|---|---|
| `filter-chip-shared-component-b-apply` (Gap 2b) | 🔴 HIGH | ✅ closure |
| `equipment-detail-separate-fetch-for-chip` (Gap 4) | 🟡 MEDIUM | ✅ closure |
| `calibration-content-rtl-specs` (Gap 6b) | 🟢 LOW | ✅ closure |

## 변경 사항

### 1. CalibrationContent.tsx (Gap 2b + Gap 4)

```diff
+ import { FilterChip } from '@/components/shared/FilterChip';
+ import { useEquipment } from '@/hooks/use-equipment';

  // ── Queries ─────
+ // equipmentId deep-link 활성 시 chip 표시용 별도 fetch — list가 비어있어도
+ // deterministic하게 장비 정보 표시 (Gap 4 closure: list `[0]` 의존 제거).
+ const equipmentDetail = useEquipment(filters.equipmentId || '');

  ...

  {/* equipmentId deep-link 활성 시 chip */}
  {filters.equipmentId && (
-   <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 border border-border text-sm">
-     <span className="font-medium">{t('content.filterChip.equipmentLabel')}</span>
-     <span className="text-muted-foreground">
-       {calibrationHistoryData?.data?.[0]?.equipmentName ?? '—'}
-       ...
-     </span>
-     <button ...>{t('content.filterChip.clear')}</button>
-   </div>
+   <FilterChip
+     label={t('content.filterChip.equipmentLabel')}
+     value={
+       equipmentDetail.data
+         ? `${equipmentDetail.data.name}${
+             equipmentDetail.data.managementNumber
+               ? ` (${equipmentDetail.data.managementNumber})`
+               : ''
+           }`
+         : '—'
+     }
+     onClear={...}
+     clearAriaLabel={t('content.filterChip.clearAriaLabel')}
+     clearLabel={t('content.filterChip.clear')}
+   />
  )}
```

**아키텍처 개선**:
- inline tailwind className 하드코딩 → `FILTER_CHIP_TOKENS` design token 경유 (verify-design-tokens 정합)
- `calibrationHistoryData?.data?.[0]` list 의존 → `useEquipment` 별도 fetch (deterministic, list 비어도 동작)
- 도메인 중립 `<FilterChip>` 컴포넌트 — checkouts/equipment/non-conformance 등에서 동일 패턴 재사용 가능

### 2. CalibrationContent.test.tsx (Gap 6b — 신규 RTL spec)

4 test cases (mock 기반 chip 영역 한정):

| # | Test | 검증 |
|---|---|---|
| 1 | equipmentId 활성 시 chip render | label + value + clear 버튼 모두 존재 (FilterChip 통합) |
| 2 | equipmentId 활성 + equipment 데이터 미fetch | chip render되되 fallback "—" 표시 |
| 3 | equipmentId 미활성 | chip render 안 됨 |
| 4 | chip clear 클릭 | router.replace 호출 + equipmentId만 제거 + 다른 filter 보존 |

**mock 전략**:
- `useEquipment` mock으로 `mockUseEquipmentReturn.data` 동적 변경
- `useCalibrationFilters` mock으로 `filtersMock.equipmentId` 동적 변경
- 자식 컴포넌트 5개 + apiClient + calibration-api 모두 stub (chip 통합 검증이 본질)

### 3. tech-debt-tracker.md

3 갭 모두 `[ ]` → `[x]` + closure 코멘트 (sprint `phase-a-arch-followup` 2026-05-08 PASS).

## 검증

| 검증 | 결과 |
|---|---|
| RTL spec PASS | 4/4 (1.932s) |
| frontend tsc --noEmit | 0 errors |
| pre-commit guard | staged 3 파일 (정확) |
| pre-commit lint-staged | eslint + prettier PASS, self-audit 0 위반 |
| pre-commit i18n call-sites | 누락 0건 |
| pre-push lint + tsc + test | ALL PASS (5.07s duration) |
| ultrareview-advisor | No-Go (고위험 패턴 없음) |
| origin push | 96710f8b..6a773892 ✅ |

## Senior 자기검토

### 누락 0건 확인

| 항목 | 충족 |
|---|---|
| Gap 2b FilterChip 마이그레이션 | ✅ |
| Gap 4 useEquipment 별도 fetch | ✅ |
| Gap 6b RTL spec | ✅ (4/4 PASS) |
| 다른 세션 working tree 보존 | ✅ (navigation 3 파일 변경 0) |
| Old API 회귀 가드 | ✅ (Auth.js v5 영향 없음, Next.js 16 패턴 유지) |
| design token 경유 (하드코딩 X) | ✅ (FILTER_CHIP_TOKENS) |
| SSOT 준수 (도메인 중립 컴포넌트) | ✅ (FilterChip은 calibration/checkouts/equipment 재사용 가능) |
| 시스템 전반 (단편 회피) | ✅ (3 갭 통합 closure, 단일 commit) |

### "함부로 다른 세션 작업 revert 하지마" 정합

- 다른 세션 working tree 3 파일 (`lib/navigation/route-metadata.ts` + `messages/{ko,en}/navigation.json`) 절대 stage 안 함
- `git diff --cached --stat`로 staged 파일 수 정확 검증 (3 파일 only)
- 본 commit은 다른 세션 navigation 작업과 disjoint scope

### Phase 3 manage-skills 패턴 mirror

- FilterChip 컴포넌트 추출 + design token + RTL spec 3 layer 정합
- 향후 다른 도메인 (checkouts, equipment, non-conformance) 동일 패턴 재사용 가능
- 본 sprint는 후속 sprint의 reference 패턴

## 후속 sprint 분리 (본 sprint scope 외)

- 다른 도메인 (checkouts/equipment/non-conformance)에 `<FilterChip>` 적용 — 별도 sprint
- `useEquipment` 별도 fetch 패턴을 다른 도메인에 적용 — 도메인별 분리

## 종합 판정

**PASS** — 3 갭 (Gap 2b, 4, 6b) 통합 closure 완료. 다른 세션 sprint `calibration-cert-phase-a-architecture-closure` 의 6 갭 모두 closure ✅. push origin/main 반영. 다른 세션 working tree 100% 보존.

본 sprint는 별도 contract/exec-plan 없이 다른 세션 contract의 명시적 후속으로 진행 — over-engineering 회피. evaluation report만으로 정직 기록 충분.
