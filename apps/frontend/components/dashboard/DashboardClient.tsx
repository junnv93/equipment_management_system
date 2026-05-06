'use client';

/**
 * 대시보드 클라이언트 컴포넌트 — Command Center (Alert-First Layout)
 *
 * Row 0: WelcomeHeader + QuickActionBar
 * Row 1: AlertBanner
 * Row 2: KPI 4카드
 * Row 3: 액션 행 (승인대기 / 교정현황 / 반출현황 / 내 활동)
 * Row 4: 최근활동 + 사이드바 위젯
 */

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard-api';
import { approvalsApi, type PendingCountsByCategory } from '@/lib/api/approvals-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { UserRoleValues } from '@equipment-management/schemas';
import type {
  DashboardSummary,
  DashboardPaginatedList,
  EquipmentByTeam,
  OverdueCalibration,
  UpcomingCalibration,
  OverdueCheckout,
  RecentActivity,
  UpcomingCheckoutReturn,
  DashboardAggregate,
  SystemHealthMetrics,
  DashboardCheckoutsScope,
  QualityReviewPending,
  MyQuickSummary,
} from '@/lib/api/dashboard-api';
import { resolveDashboardRoleConfig } from '@/lib/utils/dashboard-role';
import { resolveDashboardScopeContext } from '@/lib/utils/dashboard-scope';
import { getPageContainerClasses, DASHBOARD_MOTION } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { DashboardRow0 } from './layout/DashboardRow0';
import { DashboardRow1 } from './layout/DashboardRow1';
import { DashboardRow2 } from './layout/DashboardRow2';
import { DashboardRow3 } from './layout/DashboardRow3';
import { DashboardRow4 } from './layout/DashboardRow4';
import { OfflineBanner } from './OfflineBanner';
import { SimulationBanner } from './SimulationBanner';
import { useEffectiveRole } from '@/hooks/use-effective-role';

export interface DashboardClientProps {
  initialSummary?: DashboardSummary;
  initialEquipmentByTeam?: EquipmentByTeam[];
  initialOverdueCalibrations?: DashboardPaginatedList<OverdueCalibration>;
  initialUpcomingCalibrations?: DashboardPaginatedList<UpcomingCalibration>;
  initialOverdueCheckouts?: DashboardPaginatedList<OverdueCheckout>;
  initialRecentActivities?: RecentActivity[];
  initialEquipmentStatusStats?: Record<string, number>;
  initialUpcomingCheckoutReturns?: DashboardPaginatedList<UpcomingCheckoutReturn>;
}

function DashboardClientComponent({
  initialSummary,
  initialEquipmentByTeam,
  initialOverdueCalibrations,
  initialUpcomingCalibrations,
  initialOverdueCheckouts,
  initialRecentActivities,
  initialEquipmentStatusStats,
  initialUpcomingCheckoutReturns,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const t = useTranslations('dashboard');
  const searchParams = useSearchParams();

  // §A.19.3 — 시스템관리자 시뮬레이션 모드 SSOT (verify-ssot Step 37).
  // 권한 가드는 백엔드에서 actualRole 기준으로 별도 처리되므로 UI 전용.
  // raw NextAuth role 직접 참조 금지 — useEffectiveRole 단방향 SSOT.
  const { effectiveRole } = useEffectiveRole();
  const { role: userRole, config } = resolveDashboardRoleConfig(effectiveRole);
  const { controlCenter } = config;

  const scope = useMemo(
    () =>
      resolveDashboardScopeContext(
        controlCenter.kpiDisplay,
        controlCenter.requiresTeamScope,
        session?.user?.site,
        session?.user?.teamId,
        searchParams.get('teamId')
      ),
    [
      controlCenter.kpiDisplay,
      controlCenter.requiresTeamScope,
      session?.user?.site,
      session?.user?.teamId,
      searchParams,
    ]
  );

  const {
    data: aggregate,
    isLoading,
    isError,
  } = useQuery<DashboardAggregate>({
    queryKey: queryKeys.dashboard.aggregate(userRole, scope.teamId),
    queryFn: () => dashboardApi.getAggregate(scope.teamId),
    ...QUERY_CONFIG.DASHBOARD,
    placeholderData: {
      summary: initialSummary ?? null,
      equipmentByTeam: initialEquipmentByTeam ?? null,
      overdueCalibrations: initialOverdueCalibrations ?? null,
      upcomingCalibrations: initialUpcomingCalibrations ?? null,
      overdueCheckouts: initialOverdueCheckouts ?? null,
      recentActivities: initialRecentActivities ?? null,
      equipmentStatusStats: initialEquipmentStatusStats ?? null,
      upcomingCheckoutReturns: initialUpcomingCheckoutReturns ?? null,
    },
  });

  const summary = aggregate?.summary ?? {
    totalEquipment: 0,
    availableEquipment: 0,
    activeCheckouts: 0,
    upcomingCalibrations: 0,
  };
  const equipmentByTeam = aggregate?.equipmentByTeam ?? [];
  const overdueCalibrations = aggregate?.overdueCalibrations?.items ?? [];
  // upcomingCalibrations/equipmentStatusStats는 useMemo dependency로 사용되므로
  // identity 안정성을 위해 useMemo로 감싼다 (aggregate 미응답 시 매 렌더 새 [], {} 생성 방지).
  const upcomingCalibrations = useMemo(
    () => aggregate?.upcomingCalibrations?.items ?? [],
    [aggregate?.upcomingCalibrations?.items]
  );
  const overdueCheckouts = aggregate?.overdueCheckouts?.items ?? [];
  const recentActivities = aggregate?.recentActivities ?? [];
  const equipmentStatusStats = useMemo(
    () => aggregate?.equipmentStatusStats ?? {},
    [aggregate?.equipmentStatusStats]
  );
  const upcomingCheckoutReturns = aggregate?.upcomingCheckoutReturns?.items ?? [];

  // 대시보드 개선안 §A.4 + §4.3 — 신규 카드용 보조 데이터
  // 검토 대기/승인 대기 카운트는 ApprovalsService에서 가져옴 (PendingApprovalCard와 동일한 query key 공유)
  const { data: pendingCounts } = useQuery<PendingCountsByCategory>({
    queryKey: queryKeys.approvals.counts(userRole),
    queryFn: () => approvalsApi.getPendingCounts(),
    enabled:
      !!userRole &&
      (userRole === UserRoleValues.QUALITY_MANAGER || userRole === UserRoleValues.TEST_ENGINEER),
    ...QUERY_CONFIG.PENDING_APPROVALS,
  });

  // §4.3 — 품질책임자 검토 대기 hero (fallback: pendingCounts.plan_review).
  // 백엔드 review-pending 엔드포인트 응답 우선 사용 (아래 useQuery), 미응답 시 이 fallback 사용.
  const reviewPendingFallback = useMemo(() => {
    if (userRole !== UserRoleValues.QUALITY_MANAGER) return undefined;
    const planReview = pendingCounts?.plan_review ?? 0;
    return { pendingCount: planReview };
  }, [userRole, pendingCounts]);

  // §3.9 — 시스템관리자 전용 시스템 상태. 백엔드 /api/dashboard/system-health 호출.
  // MONITORING 전략: staleTime=SHORT(30s) + refetchInterval=PERIODIC(5min) — 시스템 상태는
  // 실시간성이 중요하므로 NORMAL(focus only)에서 격상. enabled gating으로 SYSTEM_ADMIN만 폴링.
  const { data: systemHealth } = useQuery<SystemHealthMetrics>({
    queryKey: queryKeys.dashboard.systemHealth(),
    queryFn: () => dashboardApi.getSystemHealth(),
    enabled: userRole === UserRoleValues.SYSTEM_ADMIN,
    ...QUERY_CONFIG.MONITORING,
  });

  // §A.7 — 시험실무자 본인 반출 현황 (CheckoutCard scope='me' 대기 신청 푸터용).
  const { data: myCheckouts } = useQuery<DashboardCheckoutsScope>({
    queryKey: queryKeys.dashboard.checkouts('me'),
    queryFn: () => dashboardApi.getCheckoutsByScope('me'),
    enabled: userRole === UserRoleValues.TEST_ENGINEER,
    ...QUERY_CONFIG.DASHBOARD,
  });
  const pendingCheckoutRequests = myCheckouts?.pendingRequests;

  // §4.3 — 품질책임자 검토 대기 hero. 백엔드 응답 우선, 미응답 시 fallback 사용.
  const { data: reviewPendingData } = useQuery<QualityReviewPending>({
    queryKey: queryKeys.dashboard.qualityReviewPending(),
    queryFn: () => dashboardApi.getQualityReviewPending(),
    enabled: userRole === UserRoleValues.QUALITY_MANAGER,
    ...QUERY_CONFIG.DASHBOARD,
  });
  const reviewPending = reviewPendingData ?? reviewPendingFallback;

  // §A.4 — 시험실무자 빠른 요약 (백엔드 응답 우선, fallback aggregate 데이터).
  const { data: myQuickSummaryData } = useQuery<MyQuickSummary>({
    queryKey: queryKeys.dashboard.myQuickSummary(),
    queryFn: () => dashboardApi.getMyQuickSummary(),
    enabled: userRole === UserRoleValues.TEST_ENGINEER,
    ...QUERY_CONFIG.DASHBOARD,
  });
  const myQuickSummary = useMemo(() => {
    if (userRole !== UserRoleValues.TEST_ENGINEER) return undefined;
    if (myQuickSummaryData) return myQuickSummaryData;
    // 백엔드 미응답 fallback — aggregate 데이터로 재구성.
    const upcomingItems = upcomingCalibrations;
    const upcomingCount = upcomingItems.length;
    const nearestDays = upcomingItems[0]?.daysUntilDue ?? Infinity;
    return {
      pendingCheckoutRequests: pendingCheckoutRequests ?? 0,
      upcomingCalibrations:
        upcomingCount > 0
          ? { count: upcomingCount, nearestDays: Number.isFinite(nearestDays) ? nearestDays : 0 }
          : undefined,
      nonconformanceItems: equipmentStatusStats.non_conforming ?? 0,
    };
  }, [
    userRole,
    myQuickSummaryData,
    upcomingCalibrations,
    equipmentStatusStats,
    pendingCheckoutRequests,
  ]);

  const alertTrailingAction =
    controlCenter.alertBannerTrailingAction === 'approval' ? (
      <Link
        href={FRONTEND_ROUTES.ADMIN.APPROVALS}
        className={cn(
          'text-xs font-medium text-muted-foreground hover:text-foreground whitespace-nowrap',
          DASHBOARD_MOTION.textColor
        )}
      >
        {t('alertBanner.view')}
      </Link>
    ) : null;

  return (
    <div id="dashboard-row1" tabIndex={-1} className={getPageContainerClasses('list')}>
      <SimulationBanner />
      <OfflineBanner />
      {isError && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('aggregate.error')}</AlertDescription>
          </Alert>
        </div>
      )}
      <DashboardRow0
        showQuickActionBar={controlCenter.showQuickActionBar}
        quickActions={controlCenter.quickActions}
      />
      <DashboardRow1
        show={controlCenter.showAlertBanner}
        overdueCalibrationCount={equipmentStatusStats.calibration_overdue ?? 0}
        overdueCheckoutCount={overdueCheckouts.length}
        nonConformingCount={equipmentStatusStats.non_conforming ?? 0}
        upcomingCalibrationCount={upcomingCalibrations.length}
        upcomingCheckoutReturnCount={upcomingCheckoutReturns.length}
        scope={scope}
        trailingAction={alertTrailingAction}
      />
      <DashboardRow2
        summary={summary}
        equipmentStatusStats={equipmentStatusStats}
        loading={isLoading}
        scope={scope}
      />
      <DashboardRow3
        controlCenter={controlCenter}
        overdueCalibrations={overdueCalibrations}
        upcomingCalibrations={upcomingCalibrations}
        overdueCheckouts={overdueCheckouts}
        upcomingCheckoutReturns={upcomingCheckoutReturns}
        recentActivities={recentActivities}
        scope={scope}
        loading={isLoading}
        userId={session?.user?.id}
        reviewPending={reviewPending}
        systemHealth={systemHealth}
        pendingCheckoutRequests={pendingCheckoutRequests}
      />
      <DashboardRow4
        controlCenter={controlCenter}
        bottomRowTemplate={config.bottomRowTemplate}
        equipmentByTeam={equipmentByTeam}
        upcomingCalibrations={upcomingCalibrations}
        upcomingCheckoutReturns={upcomingCheckoutReturns}
        overdueCalibrations={overdueCalibrations}
        summary={aggregate?.summary ?? undefined}
        equipmentStatusStats={equipmentStatusStats}
        recentActivities={recentActivities}
        loading={isLoading}
        recentActivityAriaLabel={t('srOnly.recentActivity')}
        myQuickSummary={myQuickSummary}
        systemHealth={systemHealth}
      />
    </div>
  );
}

export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
