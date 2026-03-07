'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import { DASHBOARD_KPI_TOKENS as T } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

interface KpiStatusGridProps {
  equipmentStatusStats: Record<string, number>;
  summary: DashboardSummary;
  loading?: boolean;
  kpiDisplay: 'my' | 'team' | 'all';
}

export function KpiStatusGrid({
  equipmentStatusStats,
  summary,
  loading = false,
  kpiDisplay,
}: KpiStatusGridProps) {
  const t = useTranslations('dashboard');

  const totalLabel = useMemo(() => {
    if (kpiDisplay === 'my') return t('stats.myEquipment');
    if (kpiDisplay === 'team') return t('stats.teamEquipment');
    return t('stats.allEquipment');
  }, [kpiDisplay, t]);

  const total = summary.totalEquipment;
  const available = summary.availableEquipment;
  const activeCheckouts = summary.activeCheckouts;
  const nonConforming = equipmentStatusStats.non_conforming ?? 0;

  const utilizationPct = total > 0 ? Math.round((available / total) * 100) : 0;
  const checkoutPct = total > 0 ? Math.round((activeCheckouts / total) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <section aria-label={t('srOnly.equipmentStats')}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. 전체 장비 */}
        <div className={T.primaryCard}>
          <span className={T.primaryLabel}>{totalLabel}</span>
          <span className={T.primaryCount}>{total}</span>
          <span className={T.primarySub}>{t('kpi.total')}</span>
        </div>

        {/* 2. 가동률 */}
        <div className={T.primaryCard}>
          <span className={T.primaryLabel}>{t('kpi.utilization')}</span>
          <span
            className={cn(
              T.primaryCount,
              utilizationPct >= 70
                ? 'text-ul-green dark:text-green-400'
                : utilizationPct >= 40
                  ? 'text-ul-orange dark:text-orange-400'
                  : 'text-ul-red dark:text-red-400'
            )}
          >
            {utilizationPct}%
          </span>
          <span className={T.primarySub}>{t('kpi.utilizationSub', { count: available })}</span>
        </div>

        {/* 3. 반출 중 */}
        <div className={T.primaryCard}>
          <span className={T.primaryLabel}>{t('kpi.activeCheckouts')}</span>
          <span
            className={cn(
              T.primaryCount,
              activeCheckouts > 0 ? 'text-ul-blue dark:text-ul-info' : 'text-foreground'
            )}
          >
            {activeCheckouts}
          </span>
          <span className={T.primarySub}>
            {t('kpi.activeCheckoutsSub', { percent: checkoutPct })}
          </span>
        </div>

        {/* 4. 부적합 */}
        <div
          className={cn(
            T.primaryCard,
            nonConforming > 0 ? 'border-ul-red/30 dark:border-red-500/30' : ''
          )}
        >
          <span className={T.primaryLabel}>{t('kpi.nonConforming')}</span>
          <span
            className={cn(
              T.primaryCount,
              nonConforming > 0 ? 'text-ul-red dark:text-red-400' : 'text-foreground'
            )}
          >
            {nonConforming}
          </span>
          <span className={T.primarySub}>
            {nonConforming > 0 ? t('kpi.nonConformingSub') : t('kpi.nonConformingSubNone')}
          </span>
        </div>
      </div>
    </section>
  );
}
