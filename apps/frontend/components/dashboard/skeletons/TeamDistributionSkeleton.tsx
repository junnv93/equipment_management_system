/**
 * TeamDistributionSkeleton — TeamEquipmentDistribution 동적 로딩 fallback (명세서 §A.17.1).
 */

'use client';

import { useTranslations } from 'next-intl';
import { DASHBOARD_TEAM_DISTRIBUTION_TOKENS as T } from '@/lib/design-tokens';
import { Skeleton } from '@/components/ui/skeleton';

export function TeamDistributionSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <div className={T.container} role="status" aria-busy="true" aria-live="polite">
      <div className={T.header}>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
      <div className={T.list}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={T.row}>
            <div className={T.rowHeader}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">{t('teamDistribution')}</span>
    </div>
  );
}
