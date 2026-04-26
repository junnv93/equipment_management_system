'use client';

import { useMemo, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import { DASHBOARD_KPI_TOKENS as T, DASHBOARD_KPI_TREND_TOKENS as TR } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { EquipmentStatusValues } from '@equipment-management/schemas';
import { buildScopedEquipmentUrl, type DashboardScope } from '@/lib/utils/dashboard-scope';
import { DASHBOARD_GRID, UTILIZATION_THRESHOLDS } from '@/lib/config/dashboard-config';
import { computeUtilizationState, type UtilizationState } from '@/lib/utils/utilization-state';
import { useCountUp } from '@/lib/utils/use-count-up';

export interface KpiTrend {
  change: number;
  direction: 'up' | 'down' | 'same';
}

export interface KpiTrends {
  total?: KpiTrend;
  utilization?: KpiTrend;
  checkouts?: KpiTrend;
  nonConforming?: KpiTrend;
}

interface KpiStatusGridProps {
  equipmentStatusStats: Record<string, number>;
  summary: DashboardSummary;
  loading?: boolean;
  scope: DashboardScope;
  trends?: KpiTrends;
}

function TrendBadge({ trend, invertColors = false }: { trend?: KpiTrend; invertColors?: boolean }) {
  if (!trend || trend.direction === 'same' || trend.change === 0) return null;
  const isUp = trend.direction === 'up';
  const isGood = invertColors ? !isUp : isUp;
  return (
    <span className={cn(TR.badge, isGood ? TR.up : TR.down)}>
      {isUp ? '↑' : '↓'} {Math.abs(trend.change)}
    </span>
  );
}

export function KpiStatusGrid({
  equipmentStatusStats,
  summary,
  loading = false,
  scope,
  trends,
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

  // Hysteresis 기반 utilization 상태 — 경계값 진동 방지
  const prevStateRef = useRef<UtilizationState | undefined>(undefined);
  const utilizationState = computeUtilizationState(utilizationPct, prevStateRef.current);
  prevStateRef.current = utilizationState;

  // 카운트업 애니메이션
  const animatedTotal = useCountUp({ target: total });
  const animatedPct = useCountUp({ target: utilizationPct });
  const animatedActive = useCountUp({ target: activeCheckouts });
  const animatedNonConforming = useCountUp({ target: nonConforming });

  if (loading) {
    return (
      <div className={DASHBOARD_GRID.kpi} aria-hidden="true">
        <Skeleton className={`${T.heroMinH} rounded-lg`} />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className={`${T.primaryMinH} rounded-lg`} />
        ))}
      </div>
    );
  }

  return (
    <section aria-label={t('srOnly.equipmentStats')}>
      <div className={DASHBOARD_GRID.kpi}>
        {/* 1. Hero KPI: 전체 장비 (midnight gradient + 가동률 바) */}
        <Link
          href={buildScopedEquipmentUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST)}
          className={cn(T.heroCard, T.heroMinH)}
        >
          <div>
            <div className="flex items-start justify-between gap-1">
              <span className={T.heroLabel}>{totalLabel}</span>
              <TrendBadge trend={trends?.total} />
            </div>
            <div className={T.heroCount}>
              {animatedTotal}
              <span className={T.heroUnit}>{t('kpi.totalUnit')}</span>
            </div>
            <span className={T.heroSub}>{t('kpi.heroSub')}</span>
          </div>
          {/* 가동률 프로그레스 바 (h-2, relative로 임계 눈금 배치) */}
          <div>
            <div
              className={T.heroBarTrack}
              role="meter"
              aria-label={t('kpi.utilization')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={utilizationPct}
            >
              <div className={T.heroBarFill} style={{ width: `${utilizationPct}%` }} />
              {/* 임계 눈금 — UTILIZATION_THRESHOLDS SSOT */}
              <span
                className={cn(T.heroBarThreshold, T.heroBarThresholdMedium)}
                style={{ left: `${UTILIZATION_THRESHOLDS.MEDIUM}%` }}
                data-threshold={UTILIZATION_THRESHOLDS.MEDIUM}
                aria-hidden="true"
              />
              <span
                className={cn(T.heroBarThreshold, T.heroBarThresholdHigh)}
                style={{ left: `${UTILIZATION_THRESHOLDS.HIGH}%` }}
                data-threshold={UTILIZATION_THRESHOLDS.HIGH}
                aria-hidden="true"
              />
            </div>
            <div className={T.heroBarLabels}>
              <span>0</span>
              <span>{t('kpi.heroBarLabel', { percent: utilizationPct })}</span>
            </div>
          </div>
        </Link>

        {/* 2. 가동률 */}
        <Link
          href={buildScopedEquipmentUrl(
            scope,
            FRONTEND_ROUTES.EQUIPMENT.LIST,
            EquipmentStatusValues.AVAILABLE
          )}
          className={cn(T.primaryCard, T.primaryMinH)}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={T.primaryLabel}>{t('kpi.utilization')}</span>
            <TrendBadge trend={trends?.utilization} />
          </div>
          <span
            className={cn(
              T.primaryCount,
              utilizationState === 'good'
                ? T.statusColor.good
                : utilizationState === 'warning'
                  ? T.statusColor.warning
                  : T.statusColor.danger
            )}
          >
            {animatedPct}%
          </span>
          <span className={T.primarySub}>{t('kpi.utilizationSub', { count: available })}</span>
        </Link>

        {/* 3. 반출 중 */}
        <Link
          href={buildScopedEquipmentUrl(
            scope,
            FRONTEND_ROUTES.EQUIPMENT.LIST,
            EquipmentStatusValues.CHECKED_OUT
          )}
          className={cn(T.primaryCard, T.primaryMinH)}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={T.primaryLabel}>{t('kpi.activeCheckouts')}</span>
            <TrendBadge trend={trends?.checkouts} />
          </div>
          <span
            className={cn(
              T.primaryCount,
              activeCheckouts > 0 ? T.statusColor.active : 'text-foreground'
            )}
          >
            {animatedActive}
          </span>
          <span className={T.primarySub}>
            {t('kpi.activeCheckoutsSub', { percent: checkoutPct })}
          </span>
        </Link>

        {/* 4. 부적합 */}
        <Link
          href={buildScopedEquipmentUrl(
            scope,
            FRONTEND_ROUTES.EQUIPMENT.LIST,
            EquipmentStatusValues.NON_CONFORMING
          )}
          className={cn(
            T.primaryCard,
            T.primaryMinH,
            nonConforming > 0 ? T.statusColor.alertBorder : '',
            nonConforming > 0 ? 'animate-in fade-in-50 duration-300' : ''
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={T.primaryLabel}>{t('kpi.nonConforming')}</span>
            <TrendBadge trend={trends?.nonConforming} invertColors />
          </div>
          <span
            className={cn(
              T.primaryCount,
              nonConforming > 0 ? T.statusColor.danger : 'text-foreground'
            )}
          >
            {animatedNonConforming}
          </span>
          <span className={T.primarySub}>
            {nonConforming > 0 ? t('kpi.nonConformingSub') : t('kpi.nonConformingSubNone')}
          </span>
        </Link>
      </div>
    </section>
  );
}
