'use client';

/**
 * AlertBanner — 긴급 조치 요약 배너
 *
 * variant 전략:
 * - 'auto': totalCount >= ALERT_BANNER_STACKED_THRESHOLD → stacked, 그 외 → inline
 * - 'inline': 항상 단일 행 (severity bar + count + chips)
 * - 'stacked': severity별 행 분리 (totalCount 10+ 권장)
 *
 * severity 4단계: critical > warning > info > none
 * - info: overdue=0 + upcoming > 0
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_ALERT_BANNER_TOKENS as T } from '@/lib/design-tokens';
import { ALERT_BANNER_STACKED_THRESHOLD } from '@/lib/config/dashboard-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { EquipmentStatusValues } from '@equipment-management/schemas';
import {
  buildScopedEquipmentUrl,
  buildScopedUrl,
  type DashboardScope,
} from '@/lib/utils/dashboard-scope';

type Severity = 'critical' | 'warning' | 'info' | 'none';

interface AlertBannerProps {
  overdueCalibrationCount: number;
  overdueCheckoutCount: number;
  nonConformingCount: number;
  upcomingCalibrationCount?: number;
  upcomingCheckoutReturnCount?: number;
  scope: DashboardScope;
  variant?: 'auto' | 'inline' | 'stacked';
  trailingAction?: React.ReactNode;
}

function resolveSeverity(
  nonConforming: number,
  overdueCalibration: number,
  overdueCheckout: number,
  upcomingCalibration: number,
  upcomingCheckout: number
): Severity {
  if (nonConforming > 0) return 'critical';
  if (overdueCalibration > 0 || overdueCheckout > 0) return 'warning';
  if (upcomingCalibration > 0 || upcomingCheckout > 0) return 'info';
  return 'none';
}

function InlineVariant({
  severity,
  totalCount,
  overdueCalibrationCount,
  overdueCheckoutCount,
  nonConformingCount,
  upcomingCalibrationCount,
  upcomingCheckoutReturnCount,
  scope,
  trailingAction,
  t,
}: {
  severity: Severity;
  totalCount: number;
  overdueCalibrationCount: number;
  overdueCheckoutCount: number;
  nonConformingCount: number;
  upcomingCalibrationCount: number;
  upcomingCheckoutReturnCount: number;
  scope: DashboardScope;
  trailingAction?: React.ReactNode;
  t: ReturnType<typeof useTranslations<'dashboard.alertBanner'>>;
}) {
  const borderClass =
    severity === 'critical'
      ? T.severityBorder.critical
      : severity === 'warning'
        ? T.severityBorder.warning
        : severity === 'info'
          ? T.severityBorder.info
          : T.severityBorder.none;

  // info/none은 긴급 인터럽트 불필요 → role="status" (polite), critical/warning은 role="alert" (assertive)
  const ariaRole = severity === 'info' || severity === 'none' ? 'status' : 'alert';

  return (
    <div className={cn(T.container, borderClass)} role={ariaRole} aria-label={t('ariaLabel')}>
      <span className={T.countCircle} aria-hidden="true">
        {totalCount > 99 ? '99+' : totalCount}
      </span>
      <span className={T.summaryText}>{t('actionRequired')}</span>

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
            href={buildScopedUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST, {
              calibrationDueFilter: 'overdue',
            })}
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
        {upcomingCalibrationCount > 0 && (
          <Link
            href={buildScopedUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST, {
              calibrationDueFilter: 'upcoming',
            })}
            className={T.chipInfo}
          >
            {t('info.upcomingCalibrations', { count: upcomingCalibrationCount })}
          </Link>
        )}
        {upcomingCheckoutReturnCount > 0 && (
          <Link href={buildScopedUrl(scope, FRONTEND_ROUTES.CHECKOUTS.LIST)} className={T.chipInfo}>
            {t('info.upcomingCheckoutReturns', { count: upcomingCheckoutReturnCount })}
          </Link>
        )}
        {trailingAction && <div className="ml-1">{trailingAction}</div>}
      </div>
    </div>
  );
}

function StackedVariant({
  nonConformingCount,
  overdueCalibrationCount,
  overdueCheckoutCount,
  upcomingCalibrationCount,
  upcomingCheckoutReturnCount,
  totalCount,
  scope,
  trailingAction,
  t,
}: {
  nonConformingCount: number;
  overdueCalibrationCount: number;
  overdueCheckoutCount: number;
  upcomingCalibrationCount: number;
  upcomingCheckoutReturnCount: number;
  totalCount: number;
  scope: DashboardScope;
  trailingAction?: React.ReactNode;
  t: ReturnType<typeof useTranslations<'dashboard.alertBanner'>>;
}) {
  const hasCritical = nonConformingCount > 0;
  const hasWarning = overdueCalibrationCount > 0 || overdueCheckoutCount > 0;
  const hasInfo = upcomingCalibrationCount > 0 || upcomingCheckoutReturnCount > 0;

  return (
    <div
      className={T.stackedContainer}
      role="region"
      aria-label={t('ariaLabelStacked', { count: totalCount })}
    >
      {hasCritical && (
        <div className={cn(T.stackedRow, T.stackedRowCritical)}>
          <span className={cn(T.countPill, T.countPillCritical)} aria-hidden="true">
            {nonConformingCount > 99 ? '99+' : nonConformingCount}
          </span>
          <span className={T.summaryText}>{t('stacked.criticalHeader')}</span>
          <div className={T.chips}>
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
          </div>
        </div>
      )}
      {hasWarning && (
        <div className={cn(T.stackedRow, T.stackedRowWarning)}>
          <span className={cn(T.countPill, T.countPillWarning)} aria-hidden="true">
            {overdueCalibrationCount + overdueCheckoutCount > 99
              ? '99+'
              : overdueCalibrationCount + overdueCheckoutCount}
          </span>
          <span className={T.summaryText}>{t('stacked.warningHeader')}</span>
          <div className={T.chips}>
            {overdueCalibrationCount > 0 && (
              <Link
                href={buildScopedUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST, {
                  calibrationDueFilter: 'overdue',
                })}
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
      )}
      {hasInfo && (
        <div className={cn(T.stackedRow, T.stackedRowInfo)}>
          <span className={cn(T.countPill, T.countPillInfo)} aria-hidden="true">
            {upcomingCalibrationCount + upcomingCheckoutReturnCount > 99
              ? '99+'
              : upcomingCalibrationCount + upcomingCheckoutReturnCount}
          </span>
          <span className={T.summaryText}>{t('stacked.infoHeader')}</span>
          <div className={T.chips}>
            {upcomingCalibrationCount > 0 && (
              <Link
                href={buildScopedUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST, {
                  calibrationDueFilter: 'upcoming',
                })}
                className={T.chipInfo}
              >
                {t('info.upcomingCalibrations', { count: upcomingCalibrationCount })}
              </Link>
            )}
            {upcomingCheckoutReturnCount > 0 && (
              <Link
                href={buildScopedUrl(scope, FRONTEND_ROUTES.CHECKOUTS.LIST)}
                className={T.chipInfo}
              >
                {t('info.upcomingCheckoutReturns', { count: upcomingCheckoutReturnCount })}
              </Link>
            )}
          </div>
        </div>
      )}
      {trailingAction && (
        <div className={cn(T.stackedRow, T.stackedRowNone, 'justify-end')}>{trailingAction}</div>
      )}
    </div>
  );
}

export function AlertBanner({
  overdueCalibrationCount,
  overdueCheckoutCount,
  nonConformingCount,
  upcomingCalibrationCount = 0,
  upcomingCheckoutReturnCount = 0,
  scope,
  variant = 'auto',
  trailingAction,
}: AlertBannerProps) {
  const t = useTranslations('dashboard.alertBanner');

  const totalCount =
    overdueCalibrationCount +
    overdueCheckoutCount +
    nonConformingCount +
    upcomingCalibrationCount +
    upcomingCheckoutReturnCount;

  const severity = resolveSeverity(
    nonConformingCount,
    overdueCalibrationCount,
    overdueCheckoutCount,
    upcomingCalibrationCount,
    upcomingCheckoutReturnCount
  );

  if (totalCount === 0) {
    return (
      <div
        className={cn(T.container, T.severityBorder.none, T.allClearCompact)}
        role="status"
        aria-label={t('ariaLabel')}
      >
        <CheckCircle2 className={T.clearIcon} aria-hidden="true" />
        <span className={T.clearState}>{t('allClear')}</span>
      </div>
    );
  }

  const useStacked =
    variant === 'stacked' || (variant === 'auto' && totalCount >= ALERT_BANNER_STACKED_THRESHOLD);

  if (useStacked) {
    return (
      <StackedVariant
        nonConformingCount={nonConformingCount}
        overdueCalibrationCount={overdueCalibrationCount}
        overdueCheckoutCount={overdueCheckoutCount}
        upcomingCalibrationCount={upcomingCalibrationCount}
        upcomingCheckoutReturnCount={upcomingCheckoutReturnCount}
        totalCount={totalCount}
        scope={scope}
        trailingAction={trailingAction}
        t={t}
      />
    );
  }

  return (
    <InlineVariant
      severity={severity}
      totalCount={totalCount}
      overdueCalibrationCount={overdueCalibrationCount}
      overdueCheckoutCount={overdueCheckoutCount}
      nonConformingCount={nonConformingCount}
      upcomingCalibrationCount={upcomingCalibrationCount}
      upcomingCheckoutReturnCount={upcomingCheckoutReturnCount}
      scope={scope}
      trailingAction={trailingAction}
      t={t}
    />
  );
}
