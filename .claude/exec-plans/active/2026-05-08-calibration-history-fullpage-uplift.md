# Calibration History — Fullpage Uplift (Tab vs Sub-route 중복 closure)

## 메타
- 생성: 2026-05-08
- 모드: Mode 2 (Planner direct — main context)
- Slug: `calibration-history-fullpage-uplift`
- 후속: `calibration-cert-phase-a-architecture-closure` 자기검토 #3 (commit `2d88c860`)
- 결정: **Option C Full** — Tab=요약 / Sub=상세 분리 (repair-history 패턴 mirror)
- 단일 atomic commit

---

## 자기검토 #3 발견 (commit 2d88c860)

> EquipmentTabs(?tab=X)가 `CalibrationHistoryTab`을 lazy-load 노출.
> 본 sprint sub-route(`/equipment/[id]/calibration-history`)는 같은 `CalibrationHistoryTab`을 직접 wrapping → **content 중복**.
>
> repair-history는 `RepairHistoryClient` ≠ `MaintenanceHistoryTab` (별도 컴포넌트, 역할 분리)로 이미 Option C 패턴.
> calibration-history도 같은 패턴으로 격상해야 시스템 일관성 회복.

---

## 설계 철학 — DRY는 "코드 중복" 제거가 아니라 "지식 중복" 제거

| 진입점 | 사용자 의도 | UI 형태 |
|---|---|---|
| `?tab=calibration` | equipment 다른 정보(checkout/location/software)도 같이 보다가 교정 한 번 훑기 | 컨텍스트 요약 (full table — Tab 컨테이너 안) + "전체 보기" 링크 |
| `/calibration-history` | 이 장비의 교정 이력 *전용* 워크플로 (필터/통계/검토) | Full page (PageHeader + 통계 + 필터 + full table) |

데이터 SSOT는 공유(`getEquipmentCalibrations(equipmentId)`), 표시 책임은 분리.

---

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|---|---|---|
| 패턴 | Option C Full (Tab=요약 / Sub=상세) | repair-history 패턴 mirror — 시스템 일관성 |
| `CalibrationHistoryClient` 책임 | 자체 데이터 fetch + 통계 + 필터 + full table | Tab `CalibrationHistoryTab` 직접 import 0건 — 중복 wrapping 거부 |
| Tab 변경 | `CalibrationHistoryTab` 그대로 + footer "전체 보기" 링크 추가 | 최소 변경 — Tab UX 보존 + 진입점 분리 명시 |
| 데이터 fetching | `useQuery(queryKeys.calibrations.byEquipment(id))` + `useQuery(documents.byEquipment)` | Tab과 같은 query — TanStack cache 공유 (unique queryKey) |
| Stats 표시 | 자체 inline 4-metric (total/overdue/upcoming/passed/fail) read-only | `CalibrationStatsCards` 의 KPI link는 *전체 목록* 향함 — 단일 장비 컨텍스트 부적합. read-only 표시가 senior |
| Filter UI | date range / approval status / result | useState (URL 동기화는 후속 sprint) |
| Full table | `CalibrationListTable` 재사용 | 데이터 props 그대로 — 필터링은 frontend |
| Backend export (UL-QP-18-02) | **out-of-scope** — 후속 sprint trigger 등록 | renderer 신설 매우 큰 작업 — separate sprint |
| URL state | useState (filter는 query param 미연동) | 후속 sprint trigger (deep-link share 시) |

---

## 구현 Phase

### Phase 1: CalibrationHistoryClient.tsx 격상 (full page)

**목표**: 단순 Tab wrapper → standalone full page.

**변경**: `apps/frontend/components/equipment/CalibrationHistoryClient.tsx` (~51 → ~200 LOC)

기존:
```tsx
return <CalibrationHistoryTab equipment={resolvedEquipment} />;
```

신규 구조:
```tsx
'use client';
// imports: equipment + calibrations + documents fetch + design tokens
// + CalibrationListTable + i18n + useState filters

export function CalibrationHistoryClient({ equipmentId, initialEquipment }) {
  // 1) equipment fetch (기존)
  // 2) calibrations fetch — useQuery(queryKeys.calibrations.byEquipment(id))
  // 3) documents fetch — N+1 방지 (Tab과 동일)
  // 4) filter state — useState({ dateFrom, dateTo, approvalStatus, result })
  // 5) filtered + derived stats (overdue/upcoming/passed/fail/total)
  // 6) overdue 시 AlertBanner

  return (
    <div className={getPageContainerClasses()}>
      <PageHeader title=... subtitle={`${name} (${managementNumber})`} backUrl=...
      {isOverdue && <AlertBanner ... />}
      <StatsRow stats={derivedStats} />
      <FilterBar filters={filters} onChange={setFilters} />
      <CalibrationListTable data={filteredCalibrations} canRegister={canCreate} />
    </div>
  );
}
```

**검증**:
- `grep -c "CalibrationHistoryTab" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` = 0 (Tab 직접 재사용 거부)
- `grep -cE "useQuery.*calibrations.byEquipment|useQuery.*documents.byEquipment" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` ≥ 2 (자체 fetch)
- `grep -c "CalibrationListTable" apps/frontend/components/equipment/CalibrationHistoryClient.tsx` ≥ 1 (재사용)
- `wc -l apps/frontend/components/equipment/CalibrationHistoryClient.tsx` < 250 (단일 책임 한계)

---

### Phase 2: Tab footer "전체 보기" 링크

**목표**: Tab 진입점에서 sub-route로 전환 가능 — 두 진입점 의미 명확화.

**변경**: `apps/frontend/components/equipment/CalibrationHistoryTab.tsx` (단 1곳 추가)

```tsx
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
// ...
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>
    <Link href={FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_HISTORY(equipmentId)}>
      {t('viewAllLink')} →
    </Link>
  </CardFooter>
</Card>
```

**검증**:
- `grep -c "FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_HISTORY" apps/frontend/components/equipment/CalibrationHistoryTab.tsx` ≥ 1 (route SSOT 호출자 확보)
- `grep -c "viewAllLink\|viewAll" apps/frontend/components/equipment/CalibrationHistoryTab.tsx` ≥ 1

---

### Phase 3: i18n + design token

**ko/en equipment.json** (`calibrationHistoryClient` namespace 확장 + `calibrationHistoryTab.viewAllLink` 추가):

```json
"calibrationHistoryClient": {
  "title": "교정 이력",
  "backAriaLabel": "장비 상세로 돌아가기",
  "stats": {
    "total": "전체",
    "overdue": "기한 초과",
    "upcoming": "30일 이내",
    "passed": "합격",
    "failed": "불합격"
  },
  "filters": {
    "dateFrom": "시작일",
    "dateTo": "종료일",
    "approvalStatusAll": "전체",
    "resultAll": "전체"
  },
  "overdueAlert": {
    "title": "교정 기한 초과",
    "description": "이 장비의 교정 기한이 지났습니다."
  }
},
"calibrationHistoryTab": {
  // 기존 key 보존
  "viewAllLink": "이 장비의 전체 교정 이력 보기"
}
```

**design token**: 기존 활용 — `CALIBRATION_FILTER_BAR`, `CALIBRATION_TABLE`, `getSemanticContainerClasses('warning')` (overdue alert), `CALIBRATION_KPI` (stats card 디자인)

---

### Phase 4: RTL spec

**신규**: `apps/frontend/components/equipment/__tests__/CalibrationHistoryClient.test.tsx` (4+ tests)
1. "renders stats cards with derived counts (overdue/upcoming/passed)"
2. "filters by approvalStatus reduces displayed rows"
3. "shows overdue alert banner when nextCalibrationDate is past"
4. "PageHeader backUrl points to /equipment/{id}"

**갱신**: 기존 Tab 테스트가 있으면 viewAllLink 검증 추가. 없으면 신규 spec.

CalibrationContent.test.tsx (다른 sprint untracked) — 본 sprint 무관, 그대로 untracked 보존.

---

## 통합 검증

```bash
pnpm --filter @equipment-management/schemas build
pnpm --filter @equipment-management/shared-constants build
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend exec jest --testPathPattern="CalibrationHistoryClient.test"
pnpm --filter backend test calibration  # 회귀 0
```

---

## 다른 세션 보존

현재 unstaged 파일 (다른 세션 작업):
- `.claude/exec-plans/tech-debt-tracker.md`
- `.claude/exec-plans/tech-debt-tracker-archive.md`

본 sprint commit 시 명시 add로 분리. 단 본 sprint도 tech-debt-tracker에 closure mark 추가 → 충돌 가능. 사용자 명시 add 시 본 sprint 라인만 stage.

---

## 후속 (Out-of-scope)

- **UL-QP-18-02 시험설비이력카드 export** (backend renderer + frontend button + e2e) — 가장 큰 trigger
- **Filter URL 동기화** — useSearchParams + router.replace (deep-link share)
- **Hook 추출** (`useEquipmentCalibrations`) — Tab과 Sub 데이터 fetching SSOT 통합 (refactor)
- **다른 도메인 Option C 적용**:
  - non-conformance: 이미 Option C (별도 Client)
  - calibration-factors: Option C 부분 적용
  - 나머지 5 Tab(basic/checkout/location/software/inspection/attachments) — sub-route 미존재. Trigger 없으면 그대로
