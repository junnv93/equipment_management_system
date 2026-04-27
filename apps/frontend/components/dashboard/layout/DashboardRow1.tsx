'use client';

import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { DashboardScope } from '@/lib/utils/dashboard-scope';

export interface DashboardRow1Props {
  show: boolean;
  overdueCalibrationCount: number;
  overdueCheckoutCount: number;
  nonConformingCount: number;
  upcomingCalibrationCount: number;
  upcomingCheckoutReturnCount: number;
  scope: DashboardScope;
  trailingAction?: React.ReactNode;
}

export function DashboardRow1({
  show,
  overdueCalibrationCount,
  overdueCheckoutCount,
  nonConformingCount,
  upcomingCalibrationCount,
  upcomingCheckoutReturnCount,
  scope,
  trailingAction,
}: DashboardRow1Props) {
  if (!show) return null;

  return (
    <div className={cn(E.rowSpacing.welcomeToAlert, E.stagger.alert, E.stagger.alertDelay)}>
      <AlertBanner
        overdueCalibrationCount={overdueCalibrationCount}
        overdueCheckoutCount={overdueCheckoutCount}
        nonConformingCount={nonConformingCount}
        upcomingCalibrationCount={upcomingCalibrationCount}
        upcomingCheckoutReturnCount={upcomingCheckoutReturnCount}
        scope={scope}
        trailingAction={trailingAction}
      />
    </div>
  );
}
