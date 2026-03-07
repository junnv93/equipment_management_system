'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import { DASHBOARD_KPI_TOKENS as T } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { EquipmentStatusValues } from '@equipment-management/schemas';
import { buildScopedEquipmentUrl, type DashboardScope } from '@/lib/utils/dashboard-scope';

interface KpiStatusGridProps {
  equipmentStatusStats: Record<string, number>;
  summary: DashboardSummary;
  loading?: boolean;
  scope: DashboardScope;
}

export function KpiStatusGrid({
  equipmentStatusStats,
  summary,
  loading = false,
  scope,
}: KpiStatusGridProps) {
  const t = useTranslations('dashboard');

  const totalLabel = useMemo(() => {
    if (scope.displayMode === 'my') return t('stats.myEquipment');
    if (scope.displayMode === 'team') return t('stats.teamEquipment');
    return t('stats.allEquipment');
  }, [scope.displayMode, t]);

  const total = summary.totalEquipment;
  const available = summary.availableEquipment;
  const activeCheckouts = summary.activeCheckouts;
  const nonConforming = equipmentStatusStats.non_conforming ?? 0;

  const utilizationPct = total > 0 ? Math.round((available / total) * 100) : 0;
  const checkoutPct = total > 0 ? Math.round((activeCheckouts / total) * 100) : 0;

  // 가동률 임계값 — UL-QP-18 시험소 운영 기준 (70%+ 양호 / 40-70% 보통 / <40% 저조)
  const UTILIZATION_HIGH = 70;
  const UTILIZATION_MEDIUM = 40;

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
        <Link
          href={buildScopedEquipmentUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST)}
          className={T.primaryCard}
        >
          <span className={T.primaryLabel}>{totalLabel}</span>
          <span className={T.primaryCount}>{total}</span>
          <span className={T.primarySub}>{t('kpi.total')}</span>
        </Link>

        {/* 2. 가동률 — 동일 스코프의 가용 장비 목록으로 이동 */}
        <Link
          href={buildScopedEquipmentUrl(
            scope,
            FRONTEND_ROUTES.EQUIPMENT.LIST,
            EquipmentStatusValues.AVAILABLE
          )}
          className={T.primaryCard}
        >
          <span className={T.primaryLabel}>{t('kpi.utilization')}</span>
          <span
            className={cn(
              T.primaryCount,
              utilizationPct >= UTILIZATION_HIGH
                ? 'text-ul-green dark:text-green-400'
                : utilizationPct >= UTILIZATION_MEDIUM
                  ? 'text-ul-orange dark:text-orange-400'
                  : 'text-ul-red dark:text-red-400'
            )}
          >
            {utilizationPct}%
          </span>
          <span className={T.primarySub}>{t('kpi.utilizationSub', { count: available })}</span>
        </Link>

        {/* 3. 반출 중 — 동일 스코프의 반출 장비 목록으로 이동 */}
        <Link
          href={buildScopedEquipmentUrl(
            scope,
            FRONTEND_ROUTES.EQUIPMENT.LIST,
            EquipmentStatusValues.CHECKED_OUT
          )}
          className={T.primaryCard}
        >
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
        </Link>

        {/* 4. 부적합 — 동일 스코프의 부적합 장비 목록으로 이동 */}
        <Link
          href={buildScopedEquipmentUrl(
            scope,
            FRONTEND_ROUTES.EQUIPMENT.LIST,
            EquipmentStatusValues.NON_CONFORMING
          )}
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
        </Link>
      </div>
    </section>
  );
}
