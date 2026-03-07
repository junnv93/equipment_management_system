'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { EquipmentByTeam } from '@/lib/api/dashboard-api';
import { DASHBOARD_TEAM_DISTRIBUTION_TOKENS as T } from '@/lib/design-tokens';

interface TeamEquipmentDistributionProps {
  equipmentByTeam: EquipmentByTeam[];
  loading?: boolean;
}

export function TeamEquipmentDistribution({
  equipmentByTeam,
  loading = false,
}: TeamEquipmentDistributionProps) {
  const t = useTranslations('dashboard.teamDistribution');

  const sorted = useMemo(
    () => [...equipmentByTeam].sort((a, b) => b.count - a.count),
    [equipmentByTeam]
  );

  const maxCount = sorted[0]?.count ?? 1;
  const total = sorted.reduce((sum, t) => sum + t.count, 0);

  if (loading) {
    return (
      <div className={T.container}>
        <div className={T.header}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className={T.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={T.row}>
              <div className={T.rowHeader}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={T.container} role="region" aria-label={t('ariaLabel')}>
      <div className={T.header}>
        <h2 className={T.title}>{t('title')}</h2>
        {total > 0 && <span className={T.total}>{t('total', { total })}</span>}
      </div>

      {sorted.length > 0 ? (
        <div className={T.list}>
          {sorted.map((team) => {
            const widthPct = maxCount > 0 ? Math.round((team.count / maxCount) * 100) : 0;
            return (
              <div key={team.id} className={T.row}>
                <div className={T.rowHeader}>
                  <span className={T.teamName}>{team.name}</span>
                  <span className={T.teamCount}>{t('count', { count: team.count })}</span>
                </div>
                <div
                  className={T.barTrack}
                  role="progressbar"
                  aria-valuenow={team.count}
                  aria-valuemax={maxCount}
                >
                  <div className={T.barFill} style={{ width: `${widthPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={T.emptyText}>{t('empty')}</p>
      )}
    </div>
  );
}
