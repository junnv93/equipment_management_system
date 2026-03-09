'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import dashboardApi from '@/lib/api/dashboard-api';
import {
  EQUIPMENT_STATUS_TOKENS,
  EQUIPMENT_STATUS_DISPLAY_ORDER,
  EQUIPMENT_CRITICAL_STATUSES,
  EQUIPMENT_STATS_STRIP_TOKENS,
} from '@/lib/design-tokens';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import type { EquipmentStatus } from '@equipment-management/schemas';
import { cn } from '@/lib/utils';

interface StatusSummaryStripProps {
  /** URL ?teamId= 존재 여부 — 레이블 표시 결정 */
  isTeamScoped: boolean;
  /** 현재 장비 총 개수 (페이지네이션 기반) */
  totalItems: number;
  /** 현재 활성 상태 필터 */
  activeStatus?: EquipmentStatus | '';
  /** 상태 클릭 시 필터 변경 콜백 (없으면 표시 전용) */
  onStatusChange?: (status: EquipmentStatus | '') => void;
  /** teamId — 통계 API scope 결정 */
  teamId?: string;
}

/**
 * 장비 상태 분포 요약 스트립
 *
 * - Dashboard API 재활용 (GET /api/dashboard/equipment-status-stats)
 * - 클릭 → 상태 필터 즉시 적용 (onStatusChange 연결 시)
 * - 위기 상태(calibration_overdue, non_conforming) 카운트 빨간 강조
 * - 수평 스크롤 gradient 인디케이터 (스크롤 가능성 힌트)
 *
 * scope 설계:
 * - teamId 있음 → 팀 범위 통계
 * - teamId 없음 → site 전체 통계 (백엔드 @SiteScoped 자동 격리)
 */
export function StatusSummaryStrip({
  isTeamScoped,
  totalItems,
  activeStatus,
  onStatusChange,
  teamId,
}: StatusSummaryStripProps) {
  const t = useTranslations('equipment');

  const { data: stats } = useQuery({
    queryKey: queryKeys.dashboard.equipmentStatusStats(undefined, teamId),
    queryFn: () => dashboardApi.getEquipmentStatusStats(teamId),
    staleTime: CACHE_TIMES.SHORT,
  });

  const visibleStats = useMemo(() => {
    if (!stats) return [];
    return EQUIPMENT_STATUS_DISPLAY_ORDER.filter((key) => (stats[key] || 0) > 0).map((key) => ({
      key,
      count: stats[key] || 0,
      statusBarColor: EQUIPMENT_STATUS_TOKENS[key]?.card.statusBarColor || 'bg-brand-neutral',
      label: t(`status.${key}` as Parameters<typeof t>[0]),
      isCritical: EQUIPMENT_CRITICAL_STATUSES.has(key),
    }));
  }, [stats, t]);

  const totalLabel = isTeamScoped ? t('filters.teamEquipment') : t('filters.allEquipment');
  const isInteractive = !!onStatusChange;
  const isTotalActive = activeStatus === '' || activeStatus === undefined;

  return (
    <div className={EQUIPMENT_STATS_STRIP_TOKENS.wrapper}>
      {/* 왼쪽 gradient 스크롤 인디케이터 */}
      <div className={EQUIPMENT_STATS_STRIP_TOKENS.gradientLeft} aria-hidden="true" />
      {/* 오른쪽 gradient 스크롤 인디케이터 */}
      <div className={EQUIPMENT_STATS_STRIP_TOKENS.gradientRight} aria-hidden="true" />

      <div className={EQUIPMENT_STATS_STRIP_TOKENS.container}>
        {/* 전체 수 — 클릭 시 필터 초기화 */}
        {isInteractive ? (
          <button
            type="button"
            onClick={() => onStatusChange('')}
            className={cn(
              EQUIPMENT_STATS_STRIP_TOKENS.itemButton,
              isTotalActive && EQUIPMENT_STATS_STRIP_TOKENS.itemActive
            )}
            aria-pressed={isTotalActive}
            aria-label={t('filters.showAllEquipment')}
          >
            <span className={EQUIPMENT_STATS_STRIP_TOKENS.totalCount}>{totalItems}</span>
            <span className={EQUIPMENT_STATS_STRIP_TOKENS.label}>{totalLabel}</span>
          </button>
        ) : (
          <span className={EQUIPMENT_STATS_STRIP_TOKENS.item}>
            <span className={EQUIPMENT_STATS_STRIP_TOKENS.totalCount}>{totalItems}</span>
            <span className={EQUIPMENT_STATS_STRIP_TOKENS.label}>{totalLabel}</span>
          </span>
        )}

        {visibleStats.length > 0 && (
          <span className={EQUIPMENT_STATS_STRIP_TOKENS.divider} aria-hidden="true" />
        )}

        {visibleStats.map((stat, i) => {
          const isActive = activeStatus === stat.key;

          return (
            <span key={stat.key} className={EQUIPMENT_STATS_STRIP_TOKENS.item}>
              {i > 0 && (
                <span className={EQUIPMENT_STATS_STRIP_TOKENS.divider} aria-hidden="true" />
              )}
              {isInteractive ? (
                <button
                  type="button"
                  onClick={() => onStatusChange(stat.key as EquipmentStatus)}
                  className={cn(
                    EQUIPMENT_STATS_STRIP_TOKENS.itemButton,
                    isActive && EQUIPMENT_STATS_STRIP_TOKENS.itemActive
                  )}
                  aria-pressed={isActive}
                  aria-label={t('filters.filterByStatus', { status: stat.label })}
                >
                  <span
                    className={`${EQUIPMENT_STATS_STRIP_TOKENS.dot} ${stat.statusBarColor}`}
                    aria-hidden="true"
                  />
                  <span
                    className={
                      stat.isCritical
                        ? EQUIPMENT_STATS_STRIP_TOKENS.criticalCount
                        : EQUIPMENT_STATS_STRIP_TOKENS.count
                    }
                  >
                    {stat.count}
                  </span>
                  <span className={EQUIPMENT_STATS_STRIP_TOKENS.label}>{stat.label}</span>
                </button>
              ) : (
                <>
                  <span
                    className={`${EQUIPMENT_STATS_STRIP_TOKENS.dot} ${stat.statusBarColor}`}
                    aria-hidden="true"
                  />
                  <span
                    className={
                      stat.isCritical
                        ? EQUIPMENT_STATS_STRIP_TOKENS.criticalCount
                        : EQUIPMENT_STATS_STRIP_TOKENS.count
                    }
                  >
                    {stat.count}
                  </span>
                  <span className={EQUIPMENT_STATS_STRIP_TOKENS.label}>{stat.label}</span>
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
