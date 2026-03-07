'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { OverdueCalibration, UpcomingCalibration } from '@/lib/api/dashboard-api';
import { DASHBOARD_DDAY_COMPACT_TOKENS as T } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface CalibrationDdayListProps {
  overdueCalibrations: OverdueCalibration[];
  upcomingCalibrations: UpcomingCalibration[];
  loading?: boolean;
}

type DdayItem =
  | { kind: 'overdue'; id: string; name: string; managementNumber?: string; daysOverdue: number }
  | { kind: 'upcoming'; id: string; name: string; managementNumber?: string; daysUntilDue: number };

function getBarClass(item: DdayItem): string {
  if (item.kind === 'overdue') return T.barOverdue;
  const d = item.daysUntilDue;
  if (d <= 1) return T.barOverdue;
  if (d <= 7) return T.barUrgent;
  if (d <= 14) return T.barWarning;
  return T.barOk;
}

function getDdayClass(item: DdayItem): string {
  if (item.kind === 'overdue') return T.ddayOverdue;
  const d = item.daysUntilDue;
  if (d <= 1) return T.ddayOverdue;
  if (d <= 7) return T.ddayUrgent;
  if (d <= 14) return T.ddayWarning;
  return T.ddayOk;
}

function getDdayLabel(item: DdayItem): string {
  if (item.kind === 'overdue') return `D+${item.daysOverdue}`;
  return `D-${item.daysUntilDue}`;
}

export function CalibrationDdayList({
  overdueCalibrations,
  upcomingCalibrations,
  loading = false,
}: CalibrationDdayListProps) {
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
  ].slice(0, 8);

  const overdueCount = overdueCalibrations.length;
  const upcomingCount = upcomingCalibrations.length;

  if (loading) {
    return (
      <div className={T.container} style={{ minHeight: 280 }}>
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
      className={T.container}
      style={{ minHeight: 280 }}
      role="region"
      aria-label={t('ariaLabel')}
    >
      {/* 헤더 */}
      <div className={T.header}>
        <h2 className={T.title}>{t('title')}</h2>
        <div className="flex items-center gap-2 text-xs">
          {overdueCount > 0 && (
            <span className="text-ul-red dark:text-red-400 font-medium">
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
          <div className={cn(T.list, 'max-h-[320px]')}>
            {items.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                href={FRONTEND_ROUTES.CALIBRATION.DETAIL(item.id)}
                className={cn(T.item, 'hover:bg-muted/70 group')}
                aria-label={`${item.name} ${getDdayLabel(item)}`}
              >
                <span className={cn(T.bar, getBarClass(item))} aria-hidden="true" />
                <span className={cn(T.dday, getDdayClass(item))}>{getDdayLabel(item)}</span>
                <div className={T.info}>
                  {item.managementNumber && (
                    <div className={T.managementNumber}>{item.managementNumber}</div>
                  )}
                  <div className={T.equipmentName}>{item.name}</div>
                </div>
              </Link>
            ))}
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
          <CheckCircle2 className="h-10 w-10 mb-2 text-ul-green" aria-hidden="true" />
          <p className="text-sm font-medium">{t('empty')}</p>
          <p className="text-xs mt-1 text-center">{t('emptyDesc')}</p>
        </div>
      )}
    </div>
  );
}
