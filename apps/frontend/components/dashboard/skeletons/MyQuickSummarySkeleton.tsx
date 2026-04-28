/**
 * MyQuickSummarySkeleton — MyQuickSummaryCard 동적 로딩 fallback (명세서 §A.17.1, §A.4).
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MyQuickSummarySkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-center justify-between mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>
      <div className="flex flex-col gap-3.5 px-1 py-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-10" />
            {i > 0 ? <Skeleton className="h-1.5 w-full rounded-full" /> : null}
          </div>
        ))}
      </div>
      <span className="sr-only">{t('myQuickSummary')}</span>
    </Card>
  );
}
