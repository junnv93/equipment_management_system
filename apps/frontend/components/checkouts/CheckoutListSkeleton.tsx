'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getStaggerDelay } from '@/lib/design-tokens';
import { HeroKPISkeleton } from './HeroKPISkeleton';

/**
 * 반출 목록 로딩 스켈레톤 (CheckoutsContent + OutboundCheckoutsTab + InboundCheckoutsTab 공유)
 *
 * DRY: 탭 파일들에서 동일한 카드 스켈레톤 마크업이 복사되는 것을 방지
 * aria-busy="true" + srOnly로 스크린 리더 진행 상태 전달
 */
export function CheckoutListSkeleton({
  count = 3,
  label,
  srOnly,
}: {
  count?: number;
  label?: string;
  srOnly?: string;
}) {
  return (
    <div aria-busy="true" aria-label={label}>
      <HeroKPISkeleton />
      <div className="space-y-3">
        {srOnly && <span className="sr-only">{srOnly}</span>}
        {Array.from({ length: count }, (_, i) => (
          <Card
            key={i}
            className="overflow-hidden"
            style={{ animationDelay: getStaggerDelay(i, 'list') }}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
