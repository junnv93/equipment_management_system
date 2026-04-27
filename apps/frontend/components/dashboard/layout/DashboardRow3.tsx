'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_SKELETON_MIN_H as SK, DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
import { DASHBOARD_GRID } from '@/lib/config/dashboard-config';
import { cn } from '@/lib/utils';
import type { ControlCenterConfig } from '@/lib/config/dashboard-config';
import type {
  OverdueCalibration,
  UpcomingCalibration,
  OverdueCheckout,
  UpcomingCheckoutReturn,
  RecentActivity,
} from '@/lib/api/dashboard-api';
import type { DashboardScope } from '@/lib/utils/dashboard-scope';

// AP-16: Row 3 위젯 동적 임포트
const PendingApprovalCard = dynamic(
  () => import('@/components/dashboard/PendingApprovalCard').then((m) => m.PendingApprovalCard),
  { ssr: true, loading: () => <Skeleton className={`${SK.md} rounded-lg`} /> }
);
const CalibrationDdayList = dynamic(
  () => import('@/components/dashboard/CalibrationDdayList').then((m) => m.CalibrationDdayList),
  { ssr: true, loading: () => <Skeleton className={`${SK.md} rounded-lg`} /> }
);
const OverdueCheckoutsCard = dynamic(
  () => import('@/components/dashboard/OverdueCheckoutsCard').then((m) => m.OverdueCheckoutsCard),
  { ssr: true, loading: () => <Skeleton className={`${SK.md} rounded-lg`} /> }
);
const MyActivityCard = dynamic(
  () => import('@/components/dashboard/MyActivityCard').then((m) => m.MyActivityCard),
  { ssr: true, loading: () => <Skeleton className={`${SK.sm} rounded-lg`} /> }
);

export interface DashboardRow3Props {
  controlCenter: ControlCenterConfig;
  overdueCalibrations: OverdueCalibration[];
  upcomingCalibrations: UpcomingCalibration[];
  overdueCheckouts: OverdueCheckout[];
  upcomingCheckoutReturns: UpcomingCheckoutReturn[];
  recentActivities: RecentActivity[];
  scope: DashboardScope;
  loading: boolean;
  userId?: string;
  userName?: string;
}

export function DashboardRow3({
  controlCenter,
  overdueCalibrations,
  upcomingCalibrations,
  overdueCheckouts,
  upcomingCheckoutReturns,
  recentActivities,
  scope,
  loading,
  userId,
  userName,
}: DashboardRow3Props) {
  const {
    showPendingApprovals,
    showCheckoutOverdue,
    showCalibrationDday,
    showMyActivity,
    row3Layout,
    pendingApprovalLayoutHint,
    approvalCategoryPriorities,
    pendingApprovalElevated,
  } = controlCenter;

  const hasRow3 =
    showPendingApprovals || showCheckoutOverdue || showCalibrationDday || showMyActivity;

  if (!hasRow3) return null;

  const motionClasses = cn('mb-8', E.stagger.row3, E.stagger.row3Delay);

  if (row3Layout === 'three-col-action-first') {
    return (
      <div className={cn(DASHBOARD_GRID.row3ThreeCol, motionClasses)}>
        {showPendingApprovals && (
          <PendingApprovalCard
            compact
            layoutHint={pendingApprovalLayoutHint}
            priorities={approvalCategoryPriorities}
            elevate={pendingApprovalElevated}
          />
        )}
        {showCalibrationDday && (
          <CalibrationDdayList
            overdueCalibrations={overdueCalibrations}
            upcomingCalibrations={upcomingCalibrations}
            scope={scope}
            loading={loading}
          />
        )}
        {showCheckoutOverdue && (
          <OverdueCheckoutsCard
            overdueCheckouts={overdueCheckouts}
            upcomingCheckoutReturns={upcomingCheckoutReturns}
            loading={loading}
          />
        )}
      </div>
    );
  }

  if (row3Layout === 'single-col-stretch') {
    return (
      <div className={cn(DASHBOARD_GRID.row3SingleCol, motionClasses)}>
        {showMyActivity && userId && (
          <MyActivityCard userId={userId} userName={userName} recentActivities={recentActivities} />
        )}
      </div>
    );
  }

  // 기본값: two-col-left-dominant / two-col-balanced
  return (
    <div
      className={cn(
        row3Layout === 'two-col-balanced' ? DASHBOARD_GRID.row3TwoColBalanced : DASHBOARD_GRID.row3,
        motionClasses
      )}
    >
      {showCalibrationDday && (
        <CalibrationDdayList
          overdueCalibrations={overdueCalibrations}
          upcomingCalibrations={upcomingCalibrations}
          scope={scope}
          loading={loading}
        />
      )}
      {(showPendingApprovals || showCheckoutOverdue) && (
        <div
          className={cn(
            showPendingApprovals && showCheckoutOverdue
              ? DASHBOARD_GRID.row3SubGrid
              : DASHBOARD_GRID.row3SubGridSingle
          )}
        >
          {showPendingApprovals && (
            <PendingApprovalCard
              compact
              layoutHint={pendingApprovalLayoutHint}
              priorities={approvalCategoryPriorities}
              elevate={pendingApprovalElevated}
            />
          )}
          {showCheckoutOverdue && (
            <OverdueCheckoutsCard
              overdueCheckouts={overdueCheckouts}
              upcomingCheckoutReturns={upcomingCheckoutReturns}
              loading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
}
