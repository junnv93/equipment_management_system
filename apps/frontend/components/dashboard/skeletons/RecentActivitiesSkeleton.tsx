/**
 * RecentActivitiesSkeleton — RecentActivities 동적 로딩 fallback (명세서 §A.17.1).
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentActivitiesSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
      </header>
      {/* tabs */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-14 rounded-full" />
        ))}
      </div>
      <ul className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">{t('recentActivities')}</span>
    </Card>
  );
}
