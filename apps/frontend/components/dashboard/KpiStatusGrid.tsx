'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import { DASHBOARD_KPI_TOKENS as T, DASHBOARD_KPI_TREND_TOKENS as TR } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { EquipmentStatusValues } from '@equipment-management/schemas';
import { buildScopedEquipmentUrl, type DashboardScope } from '@/lib/utils/dashboard-scope';
import { DASHBOARD_GRID } from '@/lib/config/dashboard-config';

export interface KpiTrend {
  /** 전주 대비 절대 변화량 */
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
  /** 선택적 트렌드 데이터 — API 지원 시 전달 */
  trends?: KpiTrends;
}

/** 트렌드 배지 서브컴포넌트 */
function TrendBadge({
  trend,
  /** true이면 up이 나쁨(red), down이 좋음(green) — 부적합 등 */
  invertColors = false,
}: {
  trend?: KpiTrend;
  invertColors?: boolean;
}) {
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

  // 가동률 임계값 — UL-QP-18 시험소 운영 기준 (70%+ 양호 / 40-70% 보통 / <40% 저조)
  const UTILIZATION_HIGH = 70;
  const UTILIZATION_MEDIUM = 40;

  if (loading) {
    return (
      <div className={DASHBOARD_GRID.kpi} aria-hidden="true">
        <Skeleton className="h-36 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
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
          className={cn(T.heroCard, 'min-h-[8.5rem]')}
        >
          <div>
            <div className="flex items-start justify-between gap-1">
              <span className={T.heroLabel}>{totalLabel}</span>
              <TrendBadge trend={trends?.total} />
            </div>
            <div className={T.heroCount}>
              {total}
              <span className={T.heroUnit}>{t('kpi.totalUnit')}</span>
            </div>
            <span className={T.heroSub}>{t('kpi.heroSub')}</span>
          </div>
          {/* 가동률 프로그레스 바 */}
          <div>
            <div className={T.heroBarTrack}>
              <div className={T.heroBarFill} style={{ width: `${utilizationPct}%` }} />
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
          className={cn(T.primaryCard, 'min-h-[7rem]')}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={T.primaryLabel}>{t('kpi.utilization')}</span>
            <TrendBadge trend={trends?.utilization} />
          </div>
          <span
            className={cn(
              T.primaryCount,
              utilizationPct >= UTILIZATION_HIGH
                ? T.statusColor.good
                : utilizationPct >= UTILIZATION_MEDIUM
                  ? T.statusColor.warning
                  : T.statusColor.danger
            )}
          >
            {utilizationPct}%
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
          className={cn(T.primaryCard, 'min-h-[7rem]')}
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
            {activeCheckouts}
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
            'min-h-[7rem]',
            nonConforming > 0 ? T.statusColor.alertBorder : ''
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={T.primaryLabel}>{t('kpi.nonConforming')}</span>
            {/* 부적합은 증가가 나쁨 → invertColors */}
            <TrendBadge trend={trends?.nonConforming} invertColors />
          </div>
          <span
            className={cn(
              T.primaryCount,
              nonConforming > 0 ? T.statusColor.danger : 'text-foreground'
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
