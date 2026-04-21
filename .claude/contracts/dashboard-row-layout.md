---
slug: dashboard-row-layout
type: contract
created: 2026-04-21
---

# Contract — Dashboard Row 3/4 Layout Proportions

## Context

두 가지 레이아웃 결함을 수정:
1. Row 3: 교정현황(CalibrationDday)이 `280px` 고정이고 반출현황이 `1fr` 전체를 차지하는 시각적 역전
2. Row 4: MiniCalendar가 RecentActivities 높이에 맞게 늘어나지 않음 (`items-start` + no `flex-1`)

## Changed Files

- `apps/frontend/lib/config/dashboard-config.ts` — `DASHBOARD_GRID` 상수 업데이트
- `apps/frontend/lib/design-tokens/components/dashboard.ts` — `DASHBOARD_CALENDAR_TOKENS.container` `flex-1` 추가
- `apps/frontend/components/dashboard/DashboardClient.tsx` — Row 3 인라인 하드코딩 제거, SSOT 사용
- `apps/frontend/app/(dashboard)/loading.tsx` — Row 3 스켈레톤 SSOT 동기화

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M-01 | `DASHBOARD_GRID.row3` 상수 존재 — `lg:grid-cols-[1fr_minmax(280px,1fr)]` 포함 | `grep 'minmax(280px,1fr)' dashboard-config.ts` |
| M-02 | `DASHBOARD_GRID.bottomRow`에 `items-start` 미존재 — `items-stretch` 사용 | `grep 'items-start' dashboard-config.ts`에서 bottomRow 제외 확인 |
| M-03 | `DashboardClient.tsx` Row 3 div에 인라인 `grid-cols-[1fr_280px]` 미존재 | `grep '1fr_280px' DashboardClient.tsx` → 0건 |
| M-04 | `DashboardClient.tsx`가 `DASHBOARD_GRID.row3` 사용 | `grep 'DASHBOARD_GRID.row3' DashboardClient.tsx` |
| M-05 | `DASHBOARD_CALENDAR_TOKENS.container`에 `flex-1` 포함 | `grep 'flex-1' dashboard.ts` (calendar tokens 섹션) |
| M-06 | `DashboardClient.tsx` 사이드바 wrapper에 `h-full` 포함 | `grep 'h-full' DashboardClient.tsx` |
| M-07 | `loading.tsx` Row 3 스켈레톤이 `DASHBOARD_GRID.row3` 사용 (인라인 하드코딩 제거) | `grep '1fr_280px' loading.tsx` → 0건 |
| M-08 | `tsc --noEmit` 오류 없음 | `pnpm --filter frontend run tsc --noEmit` |
| M-09 | `pnpm --filter frontend run build` 성공 | build exit 0 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S-01 | `loading.tsx` Row 4 sidebar wrapper가 `h-full` 포함 (스켈레톤 높이 일치) |
| S-02 | `DASHBOARD_GRID.actionRow` 구버전 키 제거 또는 deprecation 주석 추가 |
