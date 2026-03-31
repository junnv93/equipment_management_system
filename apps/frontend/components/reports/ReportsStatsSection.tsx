'use client';

import { useCalibrationStatus, useUtilizationRate } from '@/hooks/use-reports';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CalendarClock, TrendingUp, Package } from 'lucide-react';

export function ReportsStatsSection() {
  const t = useTranslations('common');
  const { data: calibration, isLoading: calLoading } = useCalibrationStatus();
  const { data: utilization, isLoading: utilLoading } = useUtilizationRate();

  const stats = [
    {
      label: t('reports.stats.totalEquipment'),
      value: calibration?.summary.totalEquipment ?? '-',
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
      isLoading: calLoading,
      highlight: false,
    },
    {
      label: t('reports.stats.calibrationOverdue'),
      value: calibration?.summary.overdue ?? '-',
      icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
      isLoading: calLoading,
      highlight: (calibration?.summary.overdue ?? 0) > 0,
    },
    {
      label: t('reports.stats.dueThisMonth'),
      value: calibration?.summary.dueThisMonth ?? '-',
      icon: <CalendarClock className="h-4 w-4 text-amber-500" />,
      isLoading: calLoading,
      highlight: false,
    },
    {
      label: t('reports.stats.avgUtilization'),
      value: utilization ? `${utilization.summary.averageUtilization.toFixed(1)}%` : '-',
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      isLoading: utilLoading,
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat, idx) => (
        <Card key={idx}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {stat.icon}
            </div>
            {stat.isLoading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className={`mt-2 text-2xl font-bold ${stat.highlight ? 'text-destructive' : ''}`}>
                {stat.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
