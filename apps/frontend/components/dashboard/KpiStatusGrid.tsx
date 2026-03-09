'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import {
  DASHBOARD_KPI_TOKENS as T,
  DASHBOARD_KPI_TREND_TOKENS as TR,
  DASHBOARD_STATUS_MINI_TOKENS as SM,
  DASHBOARD_STATUS_COLORS,
} from '@/lib/design-tokens';
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

/** 상태 분포 미니 카드 — 5번째 KPI 카드 */
function StatusMiniCard({
  equipmentStatusStats,
}: {
  equipmentStatusStats: Record<string, number>;
}) {
  const t = useTranslations('dashboard');

  // 표시할 상위 4개 상태 (건수 내림차순, 0 제외)
  const topStatuses = useMemo(() => {
    const statusOrder = [
      'available',
      'in_use',
      'checked_out',
      'calibration_scheduled',
      'calibration_overdue',
      'non_conforming',
      'spare',
    ];
    return statusOrder
      .filter((s) => (equipmentStatusStats[s] ?? 0) > 0)
      .slice(0, 4)
      .map((s) => ({ key: s, count: equipmentStatusStats[s] ?? 0 }));
  }, [equipmentStatusStats]);

  const total = useMemo(
    () => Object.values(equipmentStatusStats).reduce((sum, v) => sum + v, 0),
    [equipmentStatusStats]
  );

  return (
    <div className={SM.container}>
      <div className={SM.header}>
        <span className={T.primaryLabel}>{t('kpi.statusBreakdown')}</span>
      </div>
      <div className={SM.list}>
        {topStatuses.map(({ key, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const color = DASHBOARD_STATUS_COLORS[key] ?? '#D8D9DA';
          return (
            <div key={key} className={SM.statusRow}>
              <span
                className={SM.statusDot}
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span className={SM.statusLabel}>
                {t(`equipmentStatusLabels.${key}` as Parameters<typeof t>[0])}
              </span>
              <div className={SM.barTrack} aria-hidden="true">
                <div className={SM.barFill} style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className={SM.statusCount} aria-label={`${count}대`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
      <span className={T.primarySub}>{t('kpi.statusBreakdownSub')}</span>
    </div>
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
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <section aria-label={t('srOnly.equipmentStats')}>
      <div className={DASHBOARD_GRID.kpi}>
        {/* 1. 전체 장비 */}
        <Link
          href={buildScopedEquipmentUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST)}
          className={cn(T.primaryCard, 'min-h-[7rem]')}
        >
          <div className="flex items-start justify-between gap-1">
            <span className={T.primaryLabel}>{totalLabel}</span>
            <TrendBadge trend={trends?.total} />
          </div>
          <span className={T.primaryCount}>{total}</span>
          <span className={T.primarySub}>{t('kpi.total')}</span>
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

        {/* 5. 장비 상태 분포 */}
        <StatusMiniCard equipmentStatusStats={equipmentStatusStats} />
      </div>
    </section>
  );
}
