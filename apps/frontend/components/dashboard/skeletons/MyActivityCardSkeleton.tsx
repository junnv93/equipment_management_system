/**
 * MyActivityCardSkeleton — MyActivityCard 동적 로딩 fallback (명세서 §A.17.1).
 *
 * 일관성: 다른 카드와 동일한 Card 컨테이너 + sr-only i18n 메시지.
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MyActivityCardSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <Card className="p-4 flex flex-col h-full" role="status" aria-busy="true" aria-live="polite">
      <header className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>
      <ul className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="flex items-start gap-2">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">{t('myActivity')}</span>
    </Card>
  );
}
