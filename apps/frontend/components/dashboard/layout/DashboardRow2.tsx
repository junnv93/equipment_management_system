'use client';

import { KpiStatusGrid } from '@/components/dashboard/KpiStatusGrid';
import { DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import type { DashboardScope } from '@/lib/utils/dashboard-scope';

export interface DashboardRow2Props {
  summary: DashboardSummary;
  equipmentStatusStats: Record<string, number>;
  loading: boolean;
  scope: DashboardScope;
}

export function DashboardRow2({
  summary,
  equipmentStatusStats,
  loading,
  scope,
}: DashboardRow2Props) {
  return (
    <div className={cn('mt-7 mb-8', E.stagger.kpi, E.stagger.kpiDelay)}>
      <KpiStatusGrid
        summary={summary}
        equipmentStatusStats={equipmentStatusStats}
        loading={loading}
        scope={scope}
      />
    </div>
  );
}
