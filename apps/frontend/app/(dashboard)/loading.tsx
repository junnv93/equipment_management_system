import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_GRID } from '@/lib/config/dashboard-config';

/**
 * 대시보드 로딩 상태 컴포넌트 — Command Center Layout
 *
 * DASHBOARD_GRID 상수를 DashboardClient와 동일하게 import하여
 * 스켈레톤↔실제 레이아웃 그리드 불일치(CLS 0.721 원인)를 원천 차단
 *
 * Row 0: Welcome + QuickAction (flex row)
 * Row 1: AlertBanner (h-11 full-width)
 * Row 2: KPI 5카드 (DASHBOARD_GRID.kpi)
 * Row 3: 3컬럼 액션 카드 (DASHBOARD_GRID.actionRow)
 * Row 4: 하단 2컬럼 (DASHBOARD_GRID.bottomRow)
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">대시보드를 불러오는 중입니다...</span>

      {/* Row 0: Welcome + QuickAction */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-9 w-64" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" aria-hidden="true" />
            <Skeleton className="h-4 w-32" aria-hidden="true" />
          </div>
        </div>
        <Skeleton className="h-11 w-60 rounded-lg" aria-hidden="true" />
      </div>

      {/* Row 1: AlertBanner 스켈레톤 (min-h-[2.75rem] = 44px WCAG) */}
      <Skeleton className="h-11 w-full rounded-lg" aria-hidden="true" />

      {/* Row 2: KPI 5카드 — DASHBOARD_GRID.kpi와 동일 클래스 */}
      <div className={DASHBOARD_GRID.kpi} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* Row 3: 3컬럼 액션 카드 — DASHBOARD_GRID.actionRow와 동일 클래스 */}
      <div className={DASHBOARD_GRID.actionRow} aria-hidden="true">
        {/* 승인 대기 */}
        <div className="rounded-lg border bg-muted p-4 space-y-3 min-h-[12rem]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
        {/* 반출 현황 */}
        <div className="rounded-lg border bg-muted p-4 space-y-3 min-h-[12rem]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="flex gap-4 border-b pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded" />
          ))}
        </div>
        {/* 교정 현황 */}
        <div className="rounded-lg border bg-muted p-4 space-y-3 min-h-[12rem]">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-1 h-8 rounded-full" />
              <Skeleton className="h-4 w-12" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: 하단 2컬럼 — DASHBOARD_GRID.bottomRow와 동일 클래스 */}
      <div className={DASHBOARD_GRID.bottomRow} aria-hidden="true">
        <div className="rounded-lg border bg-muted p-5 space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-muted p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
