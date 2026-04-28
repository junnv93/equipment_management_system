/**
 * SystemHealthSkeleton — SystemHealthCard 동적 로딩 fallback (명세서 §A.17.1, §3.9).
 */

'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_SYSTEM_HEALTH_TOKENS as T } from '@/lib/design-tokens';

export function SystemHealthSkeleton() {
  const t = useTranslations('dashboard.skeleton');
  return (
    <section className={T.container} role="status" aria-busy="true" aria-live="polite">
      <header className={T.header}>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </header>
      <div className={T.statusGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={T.statusItem}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-14 mt-1" />
            <Skeleton className="h-1.5 w-full mt-1.5 rounded-full" />
          </div>
        ))}
      </div>
      <div className={T.footer}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-8" />
      </div>
      <span className="sr-only">{t('systemHealth')}</span>
    </section>
  );
}
