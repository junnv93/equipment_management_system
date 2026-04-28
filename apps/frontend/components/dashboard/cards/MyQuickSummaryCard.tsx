/**
 * MyQuickSummaryCard — 시험실무자 Row4 우측 (대시보드 개선안 §A.4)
 *
 * "이번 주" 빠른 요약: 반출 신청 대기 / 교정 등록 임박 / 부적합 처리 대기.
 */

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { utilizationGaugeTone } from '@/lib/design-tokens';
import { DDAY_THRESHOLDS, FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface MyQuickSummaryCardProps {
  pendingCheckoutRequests: number;
  upcomingCalibrations?: { count: number; nearestDays: number };
  nonconformanceItems: number;
  loading?: boolean;
  className?: string;
}

function CountValue({ value, tone }: { value: number; tone: 'neutral' | 'warn' | 'danger' }) {
  return (
    <span
      className={cn(
        'text-lg font-bold tabular-nums',
        value === 0
          ? 'text-muted-foreground'
          : tone === 'danger'
            ? 'text-brand-critical'
            : tone === 'warn'
              ? 'text-brand-warning'
              : 'text-foreground'
      )}
    >
      {value}
    </span>
  );
}

export function MyQuickSummaryCard({
  pendingCheckoutRequests,
  upcomingCalibrations,
  nonconformanceItems,
  loading = false,
  className,
}: MyQuickSummaryCardProps) {
  const t = useTranslations('dashboard.myQuickSummary');

  if (loading) {
    return (
      <Card className={cn('p-4', className)}>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-sm" />
          ))}
        </div>
      </Card>
    );
  }

  // 가장 가까운 교정 일수 → 게이지 톤. 임계값은 SSOT (DDAY_THRESHOLDS.soon).
  const window = DDAY_THRESHOLDS.soon;
  const calibPct = upcomingCalibrations
    ? Math.max(0, Math.min(100, ((window - upcomingCalibrations.nearestDays) / window) * 100))
    : 0;
  const calibTone = upcomingCalibrations
    ? utilizationGaugeTone(100 - calibPct) // 일수가 가까울수록 위험 → 100-pct
    : 'ok';

  return (
    <Card className={cn('p-4 h-full', className)} role="region" aria-label={t('title')}>
      <header className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight">{t('title')}</h3>
        <p className="text-[11px] text-muted-foreground">{t('subtitle')}</p>
      </header>

      <ul className="flex flex-col gap-3">
        <li>
          <Link
            href={`${FRONTEND_ROUTES.CHECKOUTS.LIST}?status=pending`}
            className="flex items-center justify-between hover:bg-muted/40 -mx-1 px-1 rounded-sm motion-safe:transition-colors"
          >
            <span className="text-xs text-muted-foreground">{t('pendingCheckoutRequests')}</span>
            <CountValue value={pendingCheckoutRequests} tone="neutral" />
          </Link>
        </li>
        <li>
          <Link
            href={FRONTEND_ROUTES.CALIBRATION.LIST}
            className="flex flex-col gap-1 hover:bg-muted/40 -mx-1 px-1 rounded-sm motion-safe:transition-colors py-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('upcomingCalibrations')}</span>
              <CountValue
                value={upcomingCalibrations?.count ?? 0}
                tone={(upcomingCalibrations?.count ?? 0) > 0 ? 'warn' : 'neutral'}
              />
            </div>
            {upcomingCalibrations && upcomingCalibrations.count > 0 && (
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    calibTone === 'danger'
                      ? 'bg-brand-critical'
                      : calibTone === 'warn'
                        ? 'bg-brand-warning'
                        : 'bg-brand-success'
                  )}
                  style={{ width: `${Math.max(15, calibPct)}%` }}
                />
              </div>
            )}
          </Link>
        </li>
        <li>
          <Link
            href={FRONTEND_ROUTES.NON_CONFORMANCES.LIST}
            className="flex items-center justify-between hover:bg-muted/40 -mx-1 px-1 rounded-sm motion-safe:transition-colors"
          >
            <span className="text-xs text-muted-foreground">{t('nonconformanceItems')}</span>
            <CountValue value={nonconformanceItems} tone="danger" />
          </Link>
        </li>
      </ul>
    </Card>
  );
}
