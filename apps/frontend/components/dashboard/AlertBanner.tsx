'use client';

/**
 * AlertBanner — 긴급 조치 요약 배너 (Alert-First Layout)
 *
 * 기존 DashboardAggregate 데이터에서 파생 — 새 API 불필요
 * - totalCount=0: "이상 없음" 인라인 한 줄
 * - totalCount>0: severity-colored 좌측 바 + 원형 카운트 배지 + 카테고리별 pill 칩
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_ALERT_BANNER_TOKENS as T } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { EquipmentStatusValues } from '@equipment-management/schemas';
import {
  buildScopedEquipmentUrl,
  buildScopedUrl,
  type DashboardScope,
} from '@/lib/utils/dashboard-scope';

interface AlertBannerProps {
  overdueCalibrationCount: number;
  overdueCheckoutCount: number;
  nonConformingCount: number;
  scope: DashboardScope;
}

export function AlertBanner({
  overdueCalibrationCount,
  overdueCheckoutCount,
  nonConformingCount,
  scope,
}: AlertBannerProps) {
  const t = useTranslations('dashboard.alertBanner');

  const totalCount = overdueCalibrationCount + overdueCheckoutCount + nonConformingCount;

  const severity =
    nonConformingCount > 0
      ? 'critical'
      : overdueCalibrationCount > 0 || overdueCheckoutCount > 0
        ? 'warning'
        : 'none';

  if (totalCount === 0) {
    return (
      <div
        className={cn(T.container, T.severityBorder.none)}
        role="status"
        aria-label={t('ariaLabel')}
      >
        <CheckCircle2 className={T.clearIcon} aria-hidden="true" />
        <span className={T.clearState}>{t('allClear')}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(T.container, T.severityBorder[severity])}
      role="alert"
      aria-label={t('ariaLabel')}
    >
      {/* 원형 카운트 배지 */}
      <span className={T.countCircle} aria-hidden="true">
        {totalCount > 99 ? '99+' : totalCount}
      </span>

      {/* 요약 텍스트 */}
      <span className={T.summaryText}>{t('actionRequired')}</span>

      {/* 카테고리별 pill 칩 */}
      <div className={T.chips}>
        {nonConformingCount > 0 && (
          <Link
            href={buildScopedEquipmentUrl(
              scope,
              FRONTEND_ROUTES.EQUIPMENT.LIST,
              EquipmentStatusValues.NON_CONFORMING
            )}
            className={T.chipUrgent}
          >
            {t('nonConforming', { count: nonConformingCount })}
          </Link>
        )}
        {overdueCalibrationCount > 0 && (
          <Link
            href={buildScopedUrl(scope, FRONTEND_ROUTES.CALIBRATION.LIST)}
            className={T.chipWarning}
          >
            {t('overdueCalibrations', { count: overdueCalibrationCount })}
          </Link>
        )}
        {overdueCheckoutCount > 0 && (
          <Link
            href={buildScopedUrl(scope, FRONTEND_ROUTES.CHECKOUTS.LIST)}
            className={T.chipWarning}
          >
            {t('overdueCheckouts', { count: overdueCheckoutCount })}
          </Link>
        )}
      </div>
    </div>
  );
}
