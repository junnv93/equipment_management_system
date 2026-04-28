// @route-loading: custom-justified — 탭·일괄처리바·카드 형태가 실제 페이지 레이아웃과 동기화되어야 CLS 최소화
import { getTranslations } from 'next-intl/server';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { FEEDBACK_KEYS } from '@/lib/i18n/feedback-keys';

export default async function ApprovalsLoading() {
  const t = await getTranslations();
  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={getPageContainerClasses()}
    >
      <span className="sr-only">{t(FEEDBACK_KEYS.loadingList)}</span>

      {/* 헤더 스켈레톤 */}
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* 탭 스켈레톤 */}
      <div className="flex gap-2 border-b pb-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>

      {/* 일괄 처리 바 스켈레톤 */}
      <div className="flex items-center justify-between" aria-hidden="true">
        <Skeleton className="h-6 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* 목록 스켈레톤 */}
      <Card aria-hidden="true">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-brand-border-subtle">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
