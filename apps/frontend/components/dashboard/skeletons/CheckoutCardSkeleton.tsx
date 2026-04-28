/**
 * CheckoutCardSkeleton — CheckoutCard 동적 로딩 fallback (명세서 §A.17.1).
 *
 * 실제 카드와 동일 높이 + Tabs/리스트 골격으로 layout shift 방지.
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CheckoutCardSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-4 w-16" />
      </header>
      <Skeleton className="h-7 w-44 mb-3 rounded-md" />
      <ul className="flex flex-col divide-y divide-border" role="list">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="py-2 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-5 w-12 rounded-sm" />
          </li>
        ))}
      </ul>
      <span className="sr-only">{t('checkoutCard')}</span>
    </Card>
  );
}
