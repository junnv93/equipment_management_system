'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverdueCalibration, UpcomingCalibration } from '@/lib/api/dashboard-api';
import { DASHBOARD_DDAY_COMPACT_TOKENS as T } from '@/lib/design-tokens';
import { DISPLAY_LIMITS } from '@/lib/config/dashboard-config';
import { getTimeBasedUrgency, type UrgencyLevel } from '@/lib/design-tokens/visual-feedback';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface CalibrationDdayListProps {
  overdueCalibrations: OverdueCalibration[];
  upcomingCalibrations: UpcomingCalibration[];
  loading?: boolean;
  className?: string;
}

type DdayItem =
  | { kind: 'overdue'; id: string; name: string; managementNumber?: string; daysOverdue: number }
  | { kind: 'upcoming'; id: string; name: string; managementNumber?: string; daysUntilDue: number };

// visual-feedback.ts SSOT의 UrgencyLevel → 디자인 토큰 매핑
// getTimeBasedUrgency()와 동일한 임계값을 공유 (D<0/D≤3/D≤7)
const URGENCY_BAR: Record<UrgencyLevel, string> = {
  emergency: T.barOverdue,
  critical: T.barUrgent,
  warning: T.barWarning,
  info: T.barOk,
};

const URGENCY_DDAY: Record<UrgencyLevel, string> = {
  emergency: T.ddayOverdue,
  critical: T.ddayUrgent,
  warning: T.ddayWarning,
  info: T.ddayOk,
};

function getItemUrgency(item: DdayItem): UrgencyLevel {
  if (item.kind === 'overdue') return 'emergency';
  return getTimeBasedUrgency(item.daysUntilDue);
}

function getDdayLabel(item: DdayItem): string {
  if (item.kind === 'overdue') return `D+${item.daysOverdue}`;
  return `D-${item.daysUntilDue}`;
}

export function CalibrationDdayList({
  overdueCalibrations,
  upcomingCalibrations,
  loading = false,
  className,
}: CalibrationDdayListProps) {
  const minH = 280;
  const t = useTranslations('dashboard.compactDday');

  // 초과(내림차순) + 예정(오름차순) 통합
  const items: DdayItem[] = [
    ...overdueCalibrations
      .slice()
      .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0))
      .map(
        (c): DdayItem => ({
          kind: 'overdue',
          id: c.id,
          name: c.equipmentName ?? c.name,
          managementNumber: c.managementNumber,
          daysOverdue: c.daysOverdue ?? 0,
        })
      ),
    ...upcomingCalibrations
      .slice()
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
      .map(
        (c): DdayItem => ({
          kind: 'upcoming',
          id: c.id,
          name: c.equipmentName,
          managementNumber: c.managementNumber,
          daysUntilDue: c.daysUntilDue,
        })
      ),
  ].slice(0, DISPLAY_LIMITS.calibrationDday);

  const overdueCount = overdueCalibrations.length;
  const upcomingCount = upcomingCalibrations.length;

  if (loading) {
    return (
      <div className={cn(T.container, className)} style={{ minHeight: minH }}>
        <div className={T.header}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className={T.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={T.item}>
              <Skeleton className="w-1 h-8 rounded-full" />
              <Skeleton className="h-4 w-14" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(T.container, className)}
      style={minH ? { minHeight: minH } : undefined}
      role="region"
      aria-label={t('ariaLabel')}
    >
      {/* 헤더 */}
      <div className={T.header}>
        <h2 className={T.title}>{t('title')}</h2>
        <div className="flex items-center gap-2 text-xs">
          {overdueCount > 0 && (
            <span className="text-ul-red font-medium">
              {t('overdueCount', { count: overdueCount })}
            </span>
          )}
          {upcomingCount > 0 && (
            <span className="text-muted-foreground">
              {t('upcomingCount', { count: upcomingCount })}
            </span>
          )}
        </div>
      </div>

      {/* 리스트 */}
      {items.length > 0 ? (
        <>
          <div className="relative flex-1 overflow-hidden">
            <div className={cn(T.list, 'max-h-[320px]')}>
              {items.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={FRONTEND_ROUTES.EQUIPMENT.DETAIL(item.id)}
                  className={cn(T.item, 'hover:bg-muted/70 group')}
                  aria-label={`${item.name} ${getDdayLabel(item)}`}
                >
                  <span
                    className={cn(T.bar, URGENCY_BAR[getItemUrgency(item)])}
                    aria-hidden="true"
                  />
                  <span className={cn(T.dday, URGENCY_DDAY[getItemUrgency(item)])}>
                    {getDdayLabel(item)}
                  </span>
                  <div className={T.info}>
                    {item.managementNumber && (
                      <div className={T.managementNumber}>{item.managementNumber}</div>
                    )}
                    <div className={T.equipmentName}>{item.name}</div>
                  </div>
                </Link>
              ))}
            </div>
            {/* 스크롤 어포던스 — 더 보기 있음을 시각적으로 표시 */}
            {items.length >= 6 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
            )}
          </div>
          {/* 더보기 링크 */}
          {(overdueCount > 8 || upcomingCount > 8) && (
            <div className={T.footer}>
              <Link href={FRONTEND_ROUTES.CALIBRATION.LIST} className={T.viewAllLink}>
                {t('viewAll')} →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className={T.emptyContainer}>
          <CheckCircle2 className={T.emptyIcon} aria-hidden="true" />
          <p className={T.emptyTitle}>{t('empty')}</p>
          <p className={T.emptyDesc}>{t('emptyDesc')}</p>
        </div>
      )}
    </div>
  );
}
