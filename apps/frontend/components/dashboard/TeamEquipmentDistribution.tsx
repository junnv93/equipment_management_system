'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import type { EquipmentByTeam } from '@/lib/api/dashboard-api';
import {
  DASHBOARD_TEAM_DISTRIBUTION_TOKENS as T,
  DIST_BAR_TONE_CLASSES,
  resolveDistBarTone,
  type DistBarTone,
} from '@/lib/design-tokens';
import { TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS } from '@equipment-management/shared-constants';
import { cn } from '@/lib/utils';

const DEFAULT_VISIBLE_ROWS = TEAM_DISTRIBUTION_DEFAULT_VISIBLE_ROWS;

export type TeamDistributionScope = 'lab' | 'all';

interface TeamEquipmentDistributionProps {
  equipmentByTeam: EquipmentByTeam[];
  loading?: boolean;
  /**
   * 표시 범위 (명세서 §A.6).
   *  - `'lab'` : 시험소 내 팀 (시험소장)
   *  - `'all'` : 전사 (시스템관리자) — 부제 + 가동률 미달 범례 노출
   */
  scope?: TeamDistributionScope;
}

export function TeamEquipmentDistribution({
  equipmentByTeam,
  loading = false,
  scope = 'lab',
}: TeamEquipmentDistributionProps) {
  const t = useTranslations('dashboard.teamDistribution');
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => [...equipmentByTeam].sort((a, b) => b.count - a.count),
    [equipmentByTeam]
  );

  const maxCount = sorted[0]?.count ?? 1;
  const total = sorted.reduce((sum, team) => sum + team.count, 0);

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

  // 명세서 §A.6 — 6행 제한 + "+N팀 더보기" 펼침 토글.
  const overflow = sorted.length - DEFAULT_VISIBLE_ROWS;
  const visibleTeams = expanded ? sorted : sorted.slice(0, DEFAULT_VISIBLE_ROWS);

  // 명세서 §3.6/§A.6 — scope='all'일 때만 가동률 미달 범례 노출 (단일 legend).
  const hasUnderUtilizedTeam = sorted.some(
    (team) =>
      typeof team.utilizationPct === 'number' &&
      resolveDistBarTone(team.utilizationPct) === 'danger'
  );
  const showLegend = scope === 'all' && hasUnderUtilizedTeam;

  return (
    <div className={T.container} role="region" aria-label={t('ariaLabel')}>
      <div className={T.header}>
        <div className="flex flex-col gap-0.5">
          <h2 className={T.title}>{t('title')}</h2>
          {scope === 'all' && (
            <span className="text-[11px] text-muted-foreground">{t('subtitleAll')}</span>
          )}
        </div>
        {total > 0 && <span className={T.total}>{t('total', { total })}</span>}
      </div>

      {sorted.length > 0 ? (
        <>
          <div className={T.list}>
            {visibleTeams.map((team) => {
              const widthPct = maxCount > 0 ? Math.round((team.count / maxCount) * 100) : 0;
              const tone: DistBarTone =
                typeof team.utilizationPct === 'number'
                  ? resolveDistBarTone(team.utilizationPct)
                  : 'default';
              const ariaUtilLabel =
                typeof team.utilizationPct === 'number'
                  ? t('ariaUtilization', { pct: team.utilizationPct })
                  : '';
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
                    aria-label={`${team.name}${ariaUtilLabel}`}
                  >
                    <div
                      className={cn(T.barFill, DIST_BAR_TONE_CLASSES[tone])}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {overflow > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 self-start text-[11px] font-medium text-brand-info hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              aria-expanded={expanded}
            >
              {expanded ? t('showLess') : t('showMore', { count: overflow })}
            </button>
          )}

          {showLegend && (
            <div className="mt-3 pt-2 border-t border-dashed border-border flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="inline-block w-2 h-2 rounded-full bg-brand-critical"
                aria-hidden="true"
              />
              <span>{t('legendUnderUtilized')}</span>
            </div>
          )}
        </>
      ) : (
        <p className={T.emptyText}>{t('empty')}</p>
      )}
    </div>
  );
}
