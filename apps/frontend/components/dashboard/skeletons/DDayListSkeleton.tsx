/**
 * DDayListSkeleton — CalibrationDdayList 동적 로딩 fallback (명세서 §A.17.1, §3.5).
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DDayListSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-3 w-16" />
      </header>
      <ul className="flex flex-col" role="list">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[60px_1fr_auto] items-center gap-3 py-2 border-b border-border last:border-b-0"
          >
            <Skeleton className="h-5 w-12 rounded-sm" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-3 w-10" />
          </li>
        ))}
      </ul>
      <span className="sr-only">{t('ddayList')}</span>
    </Card>
  );
}
