/**
 * ReviewPendingHeroSkeleton — ReviewPendingHero 동적 로딩 fallback (명세서 §A.17.1, §4.3).
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ReviewPendingHeroSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-start justify-between mb-2">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-4 w-12" />
      </header>
      <div className="flex items-center gap-4 px-1.5 py-2.5">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <div className="border-t border-border mt-2 pt-2.5 grid grid-cols-2 gap-2.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('reviewPendingHero')}</span>
    </Card>
  );
}
