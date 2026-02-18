import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EQUIPMENT_HEADER_TOKENS, TIMELINE_SKELETON_TOKENS } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

/**
 * 장비 상세 페이지 로딩 스켈레톤
 *
 * UL Solutions 브랜딩:
 * - 헤더: EQUIPMENT_HEADER_TOKENS 배경
 * - 탭 및 컨텐츠: 스켈레톤 애니메이션
 */
export function EquipmentDetailSkeleton() {
  return (
    <div
      className="min-h-screen bg-ul-gray-light dark:bg-gray-950"
      aria-busy="true"
      aria-live="polite"
    >
      {/* 헤더 스켈레톤 */}
      <div className={cn(EQUIPMENT_HEADER_TOKENS.background, EQUIPMENT_HEADER_TOKENS.text, 'p-8')}>
        <div className={cn(EQUIPMENT_HEADER_TOKENS.container, 'space-y-4')}>
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-10 w-96 bg-white/20" />
              <Skeleton className="h-5 w-72 bg-white/10" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32 bg-white/20" />
              <Skeleton className="h-10 w-24 bg-white/20" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24 bg-white/10" />
            <Skeleton className="h-7 w-20 bg-white/10" />
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* 탭 스켈레톤 */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>

        {/* 카드 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
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
