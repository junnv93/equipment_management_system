'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusChartColor } from '@/lib/design-tokens';

interface EquipmentStatusBarProps {
  data: Record<string, number>;
  loading?: boolean;
}

/**
 * 장비 상태 분포 — Stacked Horizontal Bar (1줄)
 *
 * 순수 div 기반: Recharts 불필요. 각 segment width = percent%.
 * count > 0인 상태만 표시. 최소 너비 2px.
 */
export function EquipmentStatusBar({ data, loading = false }: EquipmentStatusBarProps) {
  const t = useTranslations('dashboard.statusBar');
  const tStatus = useTranslations('dashboard.equipmentStatusLabels');

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded-full" aria-hidden="true" />
        <div className="flex gap-3 flex-wrap">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" aria-hidden="true" />
            ))}
        </div>
      </div>
    );
  }

  const total = Object.values(data).reduce((sum, v) => sum + v, 0);

  if (total === 0) {
    return <p className="text-sm text-muted-foreground text-center py-2">{t('empty')}</p>;
  }

  // count > 0인 상태만, count 내림차순 정렬
  const segments = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  const ariaLabel =
    t('ariaPrefix') +
    ': ' +
    segments
      .map(([status, count]) => {
        const label = tStatus(status as Parameters<typeof tStatus>[0]);
        return t('statusEntry', { label, count, percent: Math.round((count / total) * 100) });
      })
      .join(', ');

  // 범례: 상위 5개 (count 내림차순 이미 정렬됨)
  const legendItems = segments.slice(0, 5);

  return (
    <div className="space-y-2">
      {/* Stacked Bar */}
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={ariaLabel}
      >
        {segments.map(([status, count]) => {
          const percent = (count / total) * 100;
          const color = getStatusChartColor(status);
          const label = tStatus(status as Parameters<typeof tStatus>[0]);
          return (
            <div
              key={status}
              style={{
                width: `${percent}%`,
                minWidth: count > 0 ? '2px' : undefined,
                backgroundColor: color,
              }}
              title={t('tooltipEntry', { label, count, percent: percent.toFixed(1) })}
            />
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-x-4 gap-y-1 flex-wrap">
        {legendItems.map(([status, count]) => {
          const color = getStatusChartColor(status);
          const label = tStatus(status as Parameters<typeof tStatus>[0]);
          const percent = Math.round((count / total) * 100);
          return (
            <span key={status} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden="true"
              />
              <span>{label}</span>
              <span className="tabular-nums font-medium text-foreground">{count}</span>
              <span className="tabular-nums">({percent}%)</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
