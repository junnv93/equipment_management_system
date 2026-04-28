import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';

interface RouteLoadingProps {
  /** 표시할 스켈레톤 카드 개수 */
  cards?: number;
  /** 헤더 스켈레톤 표시 여부 */
  showHeader?: boolean;
  /** 테이블 형태 스켈레톤 */
  variant?: 'cards' | 'table' | 'detail';
}

const VARIANT_TO_KEY: Record<NonNullable<RouteLoadingProps['variant']>, string> = {
  cards: FEEDBACK_KEYS.loadingList,
  table: FEEDBACK_KEYS.loadingList,
  detail: FEEDBACK_KEYS.loadingDetail,
};

/**
 * 라우트별 로딩 컴포넌트 (loading.tsx에서 사용)
 *
 * Next.js 16 Best Practice:
 * - async server component
 * - role="status" + aria-busy="true" + sr-only i18n key (Invariant I3)
 * - Suspense fallback으로 자동 사용됨
 *
 * @deprecated 신규 사용처는 `@/components/loading` (RouteLoading SSOT) 권장.
 *   본 컴포넌트는 BC 보존용. Phase 3에서 호출자 점진 마이그레이션.
 */
export async function RouteLoading({
  cards = 3,
  showHeader = true,
  variant = 'cards',
}: RouteLoadingProps) {
  const t = await getTranslations();
  const srLabel = t(VARIANT_TO_KEY[variant]);

  if (variant === 'detail') {
    return (
      <section role="status" aria-busy="true" aria-live="polite" className="space-y-6">
        <span className="sr-only">{srLabel}</span>
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
        )}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (variant === 'table') {
    return (
      <section role="status" aria-busy="true" aria-live="polite" className="space-y-4">
        <span className="sr-only">{srLabel}</span>
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <div className="border-b p-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-4 w-24" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b last:border-0 p-4">
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-5 w-24" />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    );
  }

  // Default: cards
  return (
    <section role="status" aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">{srLabel}</span>
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
