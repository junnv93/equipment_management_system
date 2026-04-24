'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getStaggerDelay } from '@/lib/design-tokens';

/**
 * 반출 목록 로딩 스켈레톤 (CheckoutsContent + OutboundCheckoutsTab + InboundCheckoutsTab 공유)
 *
 * 목록(CheckoutGroupCard 리스트) 영역만 담당.
 * HeroKPI stats 영역은 summary prop이 항상 존재하므로 별도 스켈레톤 불필요.
 * OutboundCheckoutsTab의 HeroKPI 스켈레톤은 해당 탭에서 직접 처리.
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
    <div className="space-y-3" aria-busy="true" aria-label={label}>
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
  );
}
