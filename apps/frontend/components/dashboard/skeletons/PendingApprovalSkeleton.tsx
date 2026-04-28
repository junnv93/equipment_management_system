/**
 * PendingApprovalSkeleton — PendingApprovalCard 동적 로딩 fallback (명세서 §A.17.1).
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PendingApprovalSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </header>
      <ul className="flex flex-col gap-1" role="list">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-2 px-2.5 py-2 rounded-md border border-border"
          >
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-3 w-10" />
          </li>
        ))}
      </ul>
      <span className="sr-only">{t('pendingApproval')}</span>
    </Card>
  );
}
