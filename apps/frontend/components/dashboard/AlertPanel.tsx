'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils/date';
import type { OverdueCalibration, OverdueCheckout } from '@/lib/api/dashboard-api';
import {
  AlertTriangle,
  AlertCircle,
  CalendarClock,
  Truck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { DASHBOARD_SIZES, DASHBOARD_FOCUS, getDashboardStaggerDelay } from '@/lib/design-tokens';

interface AlertPanelProps {
  overdueCalibrations: OverdueCalibration[];
  overdueCheckouts: OverdueCheckout[];
  calibrationLoading?: boolean;
  checkoutsLoading?: boolean;
  /** AlertPanel에서 표시할 항목 (역할별 제어) */
  alertSections: Array<'overdueCalibrations' | 'overdueCheckouts'>;
}

/**
 * 통합 주의 항목 패널 — Action-First
 *
 * 교정 지연 + 반출 기한 초과를 하나의 Card 안에 수직 배치.
 * 탭 밖에서 항상 노출되어 즉시 조치 가능.
 * alertSections로 역할별 조건부 표시 (quality_manager는 overdueCheckouts 미표시).
 */
export function AlertPanel({
  overdueCalibrations,
  overdueCheckouts,
  calibrationLoading = false,
  checkoutsLoading = false,
  alertSections,
}: AlertPanelProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.alert');
  const tCal = useTranslations('dashboard.calibrationList');
  const tCheckout = useTranslations('dashboard.checkouts');

  const showCalibrations = alertSections.includes('overdueCalibrations');
  const showCheckouts = alertSections.includes('overdueCheckouts');

  const calibrationCount = showCalibrations ? overdueCalibrations.length : 0;
  const checkoutCount = showCheckouts ? overdueCheckouts.length : 0;
  const totalCount = calibrationCount + checkoutCount;
  const isLoading = calibrationLoading || checkoutsLoading;

  const allEmpty = !isLoading && calibrationCount === 0 && checkoutCount === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
            {t('title')}
          </CardTitle>
          {!isLoading && totalCount > 0 && (
            <Badge variant="destructive" className="tabular-nums">
              {t('count', { count: totalCount })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 empty state */}
        {allEmpty ? (
          <div className="py-6 text-center text-muted-foreground">
            <div className="inline-block motion-safe:animate-gentle-bounce">
              <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{t('allClear')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('allClearDesc')}</p>
          </div>
        ) : (
          <>
            {/* 교정 지연 섹션 */}
            {showCalibrations && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                    {t('calibrationOverdue')}
                    {!calibrationLoading && calibrationCount > 0 && (
                      <Badge variant="destructive" className="text-xs tabular-nums ml-1">
                        {t('count', { count: calibrationCount })}
                      </Badge>
                    )}
                  </p>
                </div>
                {calibrationLoading ? (
                  <div className="space-y-2">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="flex gap-2"
                          style={{ animationDelay: getDashboardStaggerDelay(i, 'list') }}
                        >
                          <Skeleton className="h-4 w-4/5" aria-hidden="true" />
                        </div>
                      ))}
                  </div>
                ) : calibrationCount === 0 ? (
                  <p className="text-xs text-muted-foreground pl-5">{t('noCalibrationOverdue')}</p>
                ) : (
                  <div className="space-y-1.5 pl-1">
                    {overdueCalibrations.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">{item.equipmentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(item.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center ml-2 flex-shrink-0">
                          <Badge
                            variant="destructive"
                            className="text-xs flex items-center gap-0.5"
                          >
                            <AlertCircle className="h-2.5 w-2.5" />
                            {tCal('daysOverdue', { days: item.daysOverdue ?? 0 })}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`${DASHBOARD_SIZES.minTouchTarget} ml-0.5 ${DASHBOARD_FOCUS.default}`}
                            onClick={() => router.push(FRONTEND_ROUTES.CALIBRATION.DETAIL(item.id))}
                            aria-label={t('calibrationViewDetail', {
                              name: item.equipmentName ?? '',
                            })}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {overdueCalibrations.length > 3 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() =>
                          router.push(`${FRONTEND_ROUTES.CALIBRATION.LIST}?tab=overdue`)
                        }
                      >
                        {t('viewAllCalibrationOverdue', { count: overdueCalibrations.length })}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 구분선 (두 섹션 모두 표시될 때) */}
            {showCalibrations && showCheckouts && <div className="border-t" aria-hidden="true" />}

            {/* 반출 기한 초과 섹션 */}
            {showCheckouts && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                    {t('checkoutOverdue')}
                    {!checkoutsLoading && checkoutCount > 0 && (
                      <Badge variant="destructive" className="text-xs tabular-nums ml-1">
                        {t('count', { count: checkoutCount })}
                      </Badge>
                    )}
                  </p>
                </div>
                {checkoutsLoading ? (
                  <div className="space-y-2">
                    {Array(3)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="flex gap-2"
                          style={{ animationDelay: getDashboardStaggerDelay(i, 'list') }}
                        >
                          <Skeleton className="h-4 w-4/5" aria-hidden="true" />
                        </div>
                      ))}
                  </div>
                ) : checkoutCount === 0 ? (
                  <p className="text-xs text-muted-foreground pl-5">{t('noCheckoutOverdue')}</p>
                ) : (
                  <div className="space-y-1.5 pl-1">
                    {overdueCheckouts.slice(0, 3).map((checkout) => (
                      <div key={checkout.id} className="flex justify-between items-center">
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-medium line-clamp-1">
                            {checkout.equipment?.name || tCheckout('unknown')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {checkout.user?.name || tCheckout('unknown')} ·{' '}
                            {formatDateTime(checkout.expectedReturnDate)}
                          </p>
                        </div>
                        <div className="flex items-center ml-2 flex-shrink-0">
                          <Badge
                            variant="destructive"
                            className="text-xs flex items-center gap-0.5"
                          >
                            <AlertCircle className="h-2.5 w-2.5" />
                            {tCheckout('daysOverdue', { days: checkout.daysOverdue })}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`${DASHBOARD_SIZES.minTouchTarget} ml-0.5 ${DASHBOARD_FOCUS.default}`}
                            onClick={() =>
                              router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(checkout.id))
                            }
                            aria-label={tCheckout('viewDetail')}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {overdueCheckouts.length > 3 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() =>
                          router.push(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?status=overdue`)
                        }
                      >
                        {t('viewAllCheckoutOverdue', { count: overdueCheckouts.length })}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
