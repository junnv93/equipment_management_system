'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  EQUIPMENT_STATUS_TOKENS,
  EQUIPMENT_STATUS_DISPLAY_ORDER,
  EQUIPMENT_CRITICAL_STATUSES,
  EQUIPMENT_STATS_STRIP_TOKENS,
} from '@/lib/design-tokens';
import type { EquipmentStatus } from '@equipment-management/schemas';
import { cn } from '@/lib/utils';

interface StatusSummaryStripProps {
  /** URL ?teamId= 존재 여부 — 레이블 표시 결정 */
  isTeamScoped: boolean;
  /** 현재 장비 총 개수 (페이지네이션 기반) */
  totalItems: number;
  /** 현재 활성 상태 필터 */
  activeStatus?: EquipmentStatus | '';
  /**
   * 교정기한초과 derived 필터 활성 여부.
   * `calibrationDueFilter='overdue'`일 때 true → "교정기한초과" 칩 active 표시.
   */
  isCalibrationOverdueActive?: boolean;
  /**
   * 교정임박 derived 필터 활성 여부.
   * `calibrationDueFilter='due_soon'`일 때 true → "교정임박" 칩 active 표시.
   */
  isCalibrationDueSoonActive?: boolean;
  /** 상태 클릭 시 필터 변경 콜백 (없으면 표시 전용) */
  onStatusChange?: (status: EquipmentStatus | '') => void;
  /** 장비 목록 API에서 동일 필터로 집계한 상태별 카운트 */
  statusCounts?: Record<string, number>;
}

/**
 * 장비 상태 분포 요약 스트립
 *
 * - 장비 목록 API 응답의 summary(statusCounts)를 사용하여 필터 스코프 일치 보장
 * - 클릭 → 상태 필터 즉시 적용 (onStatusChange 연결 시)
 * - 위기 상태(non_conforming) 및 교정기한초과(derived) 카운트 빨간 강조
 * - 수평 스크롤 gradient 인디케이터 (스크롤 가능성 힌트)
 */
export function StatusSummaryStrip({
  isTeamScoped,
  totalItems,
  activeStatus,
  isCalibrationOverdueActive = false,
  isCalibrationDueSoonActive = false,
  onStatusChange,
  statusCounts,
}: StatusSummaryStripProps) {
  const t = useTranslations('equipment');

  const visibleStats = useMemo(() => {
    if (!statusCounts) return [];
    return EQUIPMENT_STATUS_DISPLAY_ORDER.filter((key) => (statusCounts[key] || 0) > 0).map(
      (key) => ({
        key,
        count: statusCounts[key] || 0,
        statusBarColor: EQUIPMENT_STATUS_TOKENS[key]?.card.statusBarColor || 'bg-brand-neutral',
        label: t(`status.${key}` as Parameters<typeof t>[0]),
        isCritical: EQUIPMENT_CRITICAL_STATUSES.has(key),
      })
    );
  }, [statusCounts, t]);

  const totalLabel = isTeamScoped ? t('filters.teamEquipment') : t('filters.allEquipment');
  const isInteractive = !!onStatusChange;
  // 전체 칩 active 판정: status 필터가 비어있고 derived 필터도 모두 꺼져 있어야 함
  const isTotalActive =
    (activeStatus === '' || activeStatus === undefined) &&
    !isCalibrationOverdueActive &&
    !isCalibrationDueSoonActive;

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
          // derived 칩은 각 derived 필터 활성 여부로 판정 (status enum 무관)
          const isActive =
            stat.key === 'calibration_overdue'
              ? isCalibrationOverdueActive
              : stat.key === 'calibration_due_soon'
                ? isCalibrationDueSoonActive
                : activeStatus === stat.key &&
                  !isCalibrationOverdueActive &&
                  !isCalibrationDueSoonActive;

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
