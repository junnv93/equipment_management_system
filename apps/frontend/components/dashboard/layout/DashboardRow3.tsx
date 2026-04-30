'use client';

import dynamic from 'next/dynamic';
import { CheckoutCardSkeleton } from '@/components/dashboard/skeletons/CheckoutCardSkeleton';
import { PendingApprovalSkeleton } from '@/components/dashboard/skeletons/PendingApprovalSkeleton';
import { ReviewPendingHeroSkeleton } from '@/components/dashboard/skeletons/ReviewPendingHeroSkeleton';
import { SystemHealthSkeleton } from '@/components/dashboard/skeletons/SystemHealthSkeleton';
import { DDayListSkeleton } from '@/components/dashboard/skeletons/DDayListSkeleton';
import { MyActivityCardSkeleton } from '@/components/dashboard/skeletons/MyActivityCardSkeleton';
import { DashboardCardErrorBoundary } from '@/components/dashboard/DashboardCardErrorBoundary';
import { DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
import { DASHBOARD_GRID } from '@/lib/config/dashboard-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { cn } from '@/lib/utils';
import type { ControlCenterConfig } from '@/lib/config/dashboard-config';
import type {
  OverdueCalibration,
  UpcomingCalibration,
  OverdueCheckout,
  UpcomingCheckoutReturn,
  RecentActivity,
  SystemHealthMetrics,
} from '@/lib/api/dashboard-api';
import type { DashboardScopeContext } from '@/lib/utils/dashboard-scope';

// AP-16 + 명세서 §A.17.1: Row 3 위젯 동적 import + 카드별 Skeleton fallback (CLS 방지)
const PendingApprovalCard = dynamic(
  () => import('@/components/dashboard/PendingApprovalCard').then((m) => m.PendingApprovalCard),
  { ssr: false, loading: () => <PendingApprovalSkeleton /> }
);
const CalibrationDdayList = dynamic(
  () => import('@/components/dashboard/CalibrationDdayList').then((m) => m.CalibrationDdayList),
  { ssr: false, loading: () => <DDayListSkeleton /> }
);
const OverdueCheckoutsCard = dynamic(
  () => import('@/components/dashboard/OverdueCheckoutsCard').then((m) => m.OverdueCheckoutsCard),
  { ssr: false, loading: () => <CheckoutCardSkeleton /> }
);
const MyActivityCard = dynamic(
  () => import('@/components/dashboard/MyActivityCard').then((m) => m.MyActivityCard),
  { ssr: false, loading: () => <MyActivityCardSkeleton /> }
);
// 대시보드 개선안 §3.8/§3.9 — 시스템관리자 Row3 가운데 패널
const SystemHealthCard = dynamic(
  () => import('@/components/dashboard/SystemHealthCard').then((m) => m.SystemHealthCard),
  { ssr: false, loading: () => <SystemHealthSkeleton /> }
);
// 대시보드 개선안 §4.1 — 시험실무자 Row3 가운데: scope='me' 통합 반출 카드
const CheckoutCard = dynamic(
  () => import('@/components/dashboard/cards/CheckoutCard').then((m) => m.CheckoutCard),
  { ssr: false, loading: () => <CheckoutCardSkeleton /> }
);
// 대시보드 개선안 §4.3 — 품질책임자 Row3 좌측: 검토 대기 가로 hero
const ReviewPendingHero = dynamic(
  () => import('@/components/dashboard/cards/ReviewPendingHero').then((m) => m.ReviewPendingHero),
  { ssr: false, loading: () => <ReviewPendingHeroSkeleton /> }
);

export interface DashboardRow3Props {
  controlCenter: ControlCenterConfig;
  overdueCalibrations: OverdueCalibration[];
  upcomingCalibrations: UpcomingCalibration[];
  overdueCheckouts: OverdueCheckout[];
  upcomingCheckoutReturns: UpcomingCheckoutReturn[];
  recentActivities: RecentActivity[];
  scope: DashboardScopeContext;
  loading: boolean;
  userId?: string;
  /** 시험실무자: 대기 중인 반출 신청 건수 (CheckoutCard 푸터). 미제공 시 미표시. */
  pendingCheckoutRequests?: number;
  /** 품질책임자: 검토 대기 hero에 표시할 요약. */
  reviewPending?: {
    pendingCount: number;
    avgWaitDays?: number;
    maxWaitDays?: number;
    thisWeekProcessed?: number;
    processingRate?: number;
  };
  /** 시스템관리자: 시스템 상태 카드 데이터 (백엔드 /api/system/health). 미제공 시 0값 fallback. */
  systemHealth?: SystemHealthMetrics;
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
  pendingCheckoutRequests,
  reviewPending,
  systemHealth,
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

  // 대시보드 개선안 §4.1 — 시험실무자 Row3: [내 교정 예정 | 내 반출 현황 | 내 최근 활동]
  if (row3Layout === 'three-col-test-engineer') {
    return (
      <div className={cn(DASHBOARD_GRID.row3ThreeColTestEngineer, motionClasses)}>
        {showCalibrationDday && (
          <DashboardCardErrorBoundary cardName="CalibrationDdayList">
            <CalibrationDdayList
              overdueCalibrations={overdueCalibrations}
              upcomingCalibrations={upcomingCalibrations}
              scope={scope}
              loading={loading}
            />
          </DashboardCardErrorBoundary>
        )}
        <DashboardCardErrorBoundary cardName="CheckoutCard">
          <CheckoutCard
            scope="me"
            overdueCheckouts={overdueCheckouts}
            upcomingCheckoutReturns={upcomingCheckoutReturns}
            pendingRequests={pendingCheckoutRequests}
            loading={loading}
          />
        </DashboardCardErrorBoundary>
        {showMyActivity && userId && (
          <DashboardCardErrorBoundary cardName="MyActivityCard">
            <MyActivityCard userId={userId} recentActivities={recentActivities} />
          </DashboardCardErrorBoundary>
        )}
      </div>
    );
  }

  // 대시보드 개선안 §4.3 — 품질책임자 Row3: [검토 대기 hero | 교정 현황]
  if (row3Layout === 'two-col-review-hero') {
    return (
      <div className={cn(DASHBOARD_GRID.row3TwoColReviewHero, motionClasses)}>
        <DashboardCardErrorBoundary cardName="ReviewPendingHero">
          <ReviewPendingHero
            pendingCount={reviewPending?.pendingCount ?? 0}
            avgWaitDays={reviewPending?.avgWaitDays}
            maxWaitDays={reviewPending?.maxWaitDays}
            thisWeekProcessed={reviewPending?.thisWeekProcessed}
            processingRate={reviewPending?.processingRate}
            href={FRONTEND_ROUTES.ADMIN.APPROVALS}
            loading={loading}
          />
        </DashboardCardErrorBoundary>
        {showCalibrationDday && (
          <DashboardCardErrorBoundary cardName="CalibrationDdayList">
            <CalibrationDdayList
              overdueCalibrations={overdueCalibrations}
              upcomingCalibrations={upcomingCalibrations}
              scope={scope}
              loading={loading}
            />
          </DashboardCardErrorBoundary>
        )}
      </div>
    );
  }

  // 대시보드 개선안 §3.8 — 시스템관리자 Row3: [교정 | 시스템 상태 | 전사 반출 현황]
  if (row3Layout === 'three-col-system-health') {
    return (
      <div className={cn(DASHBOARD_GRID.row3ThreeColSysHealth, motionClasses)}>
        {showCalibrationDday && (
          <DashboardCardErrorBoundary cardName="CalibrationDdayList">
            <CalibrationDdayList
              overdueCalibrations={overdueCalibrations}
              upcomingCalibrations={upcomingCalibrations}
              scope={scope}
              loading={loading}
            />
          </DashboardCardErrorBoundary>
        )}
        <DashboardCardErrorBoundary cardName="SystemHealthCard">
          <SystemHealthCard metrics={systemHealth} loading={loading} />
        </DashboardCardErrorBoundary>
        {showCheckoutOverdue && (
          <DashboardCardErrorBoundary cardName="OverdueCheckoutsCard">
            <OverdueCheckoutsCard
              overdueCheckouts={overdueCheckouts}
              upcomingCheckoutReturns={upcomingCheckoutReturns}
              loading={loading}
            />
          </DashboardCardErrorBoundary>
        )}
      </div>
    );
  }

  if (row3Layout === 'three-col-action-first') {
    return (
      <div className={cn(DASHBOARD_GRID.row3ThreeCol, motionClasses)}>
        {showPendingApprovals && (
          <DashboardCardErrorBoundary cardName="PendingApprovalCard">
            <PendingApprovalCard
              compact
              layoutHint={pendingApprovalLayoutHint}
              priorities={approvalCategoryPriorities}
              elevate={pendingApprovalElevated}
            />
          </DashboardCardErrorBoundary>
        )}
        {showCalibrationDday && (
          <DashboardCardErrorBoundary cardName="CalibrationDdayList">
            <CalibrationDdayList
              overdueCalibrations={overdueCalibrations}
              upcomingCalibrations={upcomingCalibrations}
              scope={scope}
              loading={loading}
            />
          </DashboardCardErrorBoundary>
        )}
        {showCheckoutOverdue && (
          <DashboardCardErrorBoundary cardName="OverdueCheckoutsCard">
            <OverdueCheckoutsCard
              overdueCheckouts={overdueCheckouts}
              upcomingCheckoutReturns={upcomingCheckoutReturns}
              loading={loading}
            />
          </DashboardCardErrorBoundary>
        )}
      </div>
    );
  }

  if (row3Layout === 'single-col-stretch') {
    return (
      <div className={cn(DASHBOARD_GRID.row3SingleCol, motionClasses)}>
        {showMyActivity && userId && (
          <DashboardCardErrorBoundary cardName="MyActivityCard">
            <MyActivityCard userId={userId} recentActivities={recentActivities} />
          </DashboardCardErrorBoundary>
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
        <DashboardCardErrorBoundary cardName="CalibrationDdayList">
          <CalibrationDdayList
            overdueCalibrations={overdueCalibrations}
            upcomingCalibrations={upcomingCalibrations}
            scope={scope}
            loading={loading}
          />
        </DashboardCardErrorBoundary>
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
            <DashboardCardErrorBoundary cardName="PendingApprovalCard">
              <PendingApprovalCard
                compact
                layoutHint={pendingApprovalLayoutHint}
                priorities={approvalCategoryPriorities}
                elevate={pendingApprovalElevated}
              />
            </DashboardCardErrorBoundary>
          )}
          {showCheckoutOverdue && (
            <DashboardCardErrorBoundary cardName="OverdueCheckoutsCard">
              <OverdueCheckoutsCard
                overdueCheckouts={overdueCheckouts}
                upcomingCheckoutReturns={upcomingCheckoutReturns}
                loading={loading}
              />
            </DashboardCardErrorBoundary>
          )}
        </div>
      )}
    </div>
  );
}
