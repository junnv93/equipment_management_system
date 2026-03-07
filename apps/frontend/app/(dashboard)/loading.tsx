import { Skeleton } from '@/components/ui/skeleton';

/**
 * 대시보드 로딩 상태 컴포넌트 — 3-Row 그리드 레이아웃
 *
 * Row 1: KPI 4카드 + 교정 현황 리스트
 * Row 2: 승인 대기 + 반출 초과 + 미니 달력
 * Row 3: 최근 활동 + 팀별 분포
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6" aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">대시보드를 불러오는 중입니다...</span>

      {/* Header: WelcomeHeader 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" aria-hidden="true" />
          <Skeleton className="h-4 w-32" aria-hidden="true" />
        </div>
      </div>

      {/* Row 1: KPI 4카드 + 교정 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4" aria-hidden="true">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[280px] rounded-lg" />
      </div>

      {/* Row 2: 승인 대기 + 반출 초과 + 미니 달력 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4" aria-hidden="true">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 승인 대기 카드 스켈레톤 */}
          <div className="rounded-lg border bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-12" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
          {/* 반출 초과 카드 스켈레톤 */}
          <div className="rounded-lg border bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        </div>
        {/* 미니 달력 스켈레톤 */}
        <Skeleton className="h-[280px] rounded-lg" />
      </div>

      {/* Row 3: 최근 활동 + 팀별 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4" aria-hidden="true">
        <div className="rounded-lg border bg-muted p-5 space-y-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16 flex-shrink-0" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-muted p-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
