import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  TIMELINE_SKELETON_TOKENS,
  EQUIPMENT_DETAIL_HEADER_TOKENS,
  EQUIPMENT_KPI_STRIP_TOKENS,
  EQUIPMENT_TAB_UNDERLINE_TOKENS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * 장비 상세 페이지 로딩 스켈레톤
 *
 * 새 레이아웃 반영:
 * - 컴팩트 sticky 헤더 스켈레톤 (breadcrumb + name row)
 * - KPI 스트립 스켈레톤 (5개 카드)
 * - 탭 바 스켈레톤 (underline 스타일)
 * - 3열 카드 스켈레톤
 */
export function EquipmentDetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-ul-gray-light dark:bg-gray-950"
      aria-busy="true"
      aria-live="polite"
    >
      {/* 컴팩트 헤더 스켈레톤 — EQUIPMENT_DETAIL_HEADER_TOKENS와 구조 동기화 */}
      <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.container}>
        <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.breadcrumbRow}>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.mainRow}>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-80" />
          </div>
          <div className={cn(EQUIPMENT_DETAIL_HEADER_TOKENS.actions)}>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* KPI 스트립 스켈레톤 — EQUIPMENT_KPI_STRIP_TOKENS와 구조 동기화 */}
        <div className={EQUIPMENT_KPI_STRIP_TOKENS.container}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                EQUIPMENT_KPI_STRIP_TOKENS.card.base,
                EQUIPMENT_KPI_STRIP_TOKENS.borderColors.neutral
              )}
            >
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>

        {/* 탭 바 스켈레톤 — EQUIPMENT_TAB_UNDERLINE_TOKENS와 구조 동기화 */}
        <div className={EQUIPMENT_TAB_UNDERLINE_TOKENS.container}>
          <div className={EQUIPMENT_TAB_UNDERLINE_TOKENS.mobileScroll}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-11 w-24 shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* 3열 카드 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 타임라인 스켈레톤 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className={cn(TIMELINE_SKELETON_TOKENS.node, 'flex-shrink-0')} />
                <div className="flex-1 space-y-2">
                  <Skeleton className={cn(TIMELINE_SKELETON_TOKENS.line, 'w-3/4')} />
                  <Skeleton className={cn(TIMELINE_SKELETON_TOKENS.line, 'w-full')} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
