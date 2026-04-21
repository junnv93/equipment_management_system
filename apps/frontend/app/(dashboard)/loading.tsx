import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_GRID } from '@/lib/config/dashboard-config';

/**
 * 대시보드 로딩 상태 컴포넌트 — Command Center Layout
 *
 * DASHBOARD_GRID 상수를 DashboardClient와 동일하게 import하여
 * 스켈레톤↔실제 레이아웃 그리드 불일치(CLS 원인)를 원천 차단
 *
 * v2: 간격 차등화(mt-6/mt-7/mb-8) + 비대칭 KPI 그리드(4카드) 동기화
 *
 * Row 0: Welcome + QuickAction (flex row)
 * Row 1: AlertBanner (mt-6)
 * Row 2: KPI 4카드 (mt-7, mb-8, DASHBOARD_GRID.kpi)
 * Row 3: 3컬럼 액션 카드 (mb-8)
 * Row 4: 하단 2컬럼 (DASHBOARD_GRID.bottomRow)
 */
export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6" aria-busy="true" aria-live="polite" role="status">
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

      {/* Row 1: AlertBanner 스켈레톤 (mt-6 — 간격 차등화) */}
      <div className="mt-6">
        <Skeleton className="h-11 w-full rounded-lg" aria-hidden="true" />
      </div>

      {/* Row 2: KPI 4카드 — mt-7 mb-8 + DASHBOARD_GRID.kpi 비대칭 그리드 */}
      <div className="mt-7 mb-8" aria-hidden="true">
        <div className={DASHBOARD_GRID.kpi}>
          <Skeleton className="h-36 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Row 3: 액션 카드 (mb-8) — DASHBOARD_GRID.row3 CLS 방지 */}
      {/* 순서: 교정현황(좌/2fr) → 승인대기+반출현황 서브그리드(우/1.5fr) */}
      <div className={`${DASHBOARD_GRID.row3} mb-8`} aria-hidden="true">
        {/* 교정 현황 — 좌측 2fr */}
        <div className="rounded-lg border bg-muted p-4 space-y-3 min-h-[12rem] shadow-sm">
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
        {/* 승인 대기 + 반출 현황 서브그리드 — 우측 1.5fr */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-muted p-4 space-y-3 min-h-[12rem] shadow-sm">
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
          <div className="rounded-lg border bg-muted p-4 space-y-3 min-h-[12rem] shadow-sm">
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
        </div>
      </div>

      {/* Row 4: 하단 2컬럼 — DASHBOARD_GRID.bottomRow와 동일 클래스 */}
      <div className={DASHBOARD_GRID.bottomRow} aria-hidden="true">
        <div className="rounded-lg border bg-muted p-5 space-y-3 shadow-sm">
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
        <div className="flex flex-col gap-4 h-full">
          <div className="rounded-lg border bg-muted p-4 space-y-3 shadow-sm">
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
          <Skeleton className="flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
