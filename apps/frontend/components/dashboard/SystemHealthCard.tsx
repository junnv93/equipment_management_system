'use client';

import { useTranslations } from 'next-intl';
import { Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DASHBOARD_SYSTEM_HEALTH_TOKENS } from '@/lib/design-tokens';
import type { DashboardSummary, RecentActivity } from '@/lib/api/dashboard-api';

interface SystemHealthCardProps {
  summary?: DashboardSummary;
  equipmentStatusStats?: Record<string, number>;
  recentActivities?: RecentActivity[];
  loading?: boolean;
}

export function SystemHealthCard({
  summary,
  equipmentStatusStats,
  recentActivities,
  loading = false,
}: SystemHealthCardProps) {
  const t = useTranslations('dashboard.systemHealth');

  if (loading) {
    return (
      <div className={DASHBOARD_SYSTEM_HEALTH_TOKENS.container}>
        <div className={DASHBOARD_SYSTEM_HEALTH_TOKENS.header}>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className={DASHBOARD_SYSTEM_HEALTH_TOKENS.statusGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={DASHBOARD_SYSTEM_HEALTH_TOKENS.statusItem}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const calibrationOverdue = equipmentStatusStats?.calibration_overdue ?? 0;
  const nonConforming = equipmentStatusStats?.non_conforming ?? 0;
  const recentActivityCount = recentActivities?.length ?? 0;

  const items = [
    {
      label: t('totalEquipment'),
      value: summary?.totalEquipment ?? 0,
      colorClass: DASHBOARD_SYSTEM_HEALTH_TOKENS.statusNeutral,
    },
    {
      label: t('activeCheckouts'),
      value: summary?.activeCheckouts ?? 0,
      colorClass:
        (summary?.activeCheckouts ?? 0) > 0
          ? DASHBOARD_SYSTEM_HEALTH_TOKENS.statusWarning
          : DASHBOARD_SYSTEM_HEALTH_TOKENS.statusOk,
    },
    {
      label: t('calibrationOverdue'),
      value: calibrationOverdue,
      colorClass:
        calibrationOverdue > 0
          ? DASHBOARD_SYSTEM_HEALTH_TOKENS.statusCritical
          : DASHBOARD_SYSTEM_HEALTH_TOKENS.statusOk,
    },
    {
      label: t('nonConforming'),
      value: nonConforming,
      colorClass:
        nonConforming > 0
          ? DASHBOARD_SYSTEM_HEALTH_TOKENS.statusCritical
          : DASHBOARD_SYSTEM_HEALTH_TOKENS.statusOk,
    },
    {
      label: t('recentActivity'),
      value: recentActivityCount,
      colorClass: DASHBOARD_SYSTEM_HEALTH_TOKENS.statusNeutral,
    },
  ] as const;

  const hasIssues = calibrationOverdue > 0 || nonConforming > 0;

  return (
    <div
      className={DASHBOARD_SYSTEM_HEALTH_TOKENS.container}
      role="region"
      aria-label={t('ariaLabel')}
    >
      <div className={DASHBOARD_SYSTEM_HEALTH_TOKENS.header}>
        <span className={DASHBOARD_SYSTEM_HEALTH_TOKENS.title}>{t('title')}</span>
        <Activity
          className={cn(
            'h-4 w-4',
            hasIssues
              ? DASHBOARD_SYSTEM_HEALTH_TOKENS.statusCritical
              : DASHBOARD_SYSTEM_HEALTH_TOKENS.statusOk
          )}
          aria-hidden="true"
        />
      </div>
      <div className={DASHBOARD_SYSTEM_HEALTH_TOKENS.statusGrid}>
        {items.map((item) => (
          <div key={item.label} className={DASHBOARD_SYSTEM_HEALTH_TOKENS.statusItem}>
            <span className={DASHBOARD_SYSTEM_HEALTH_TOKENS.statusLabel}>{item.label}</span>
            <span className={cn(DASHBOARD_SYSTEM_HEALTH_TOKENS.statusValue, item.colorClass)}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
