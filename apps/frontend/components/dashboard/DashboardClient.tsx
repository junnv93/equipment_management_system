'use client';

/**
 * 대시보드 클라이언트 컴포넌트 — Command Center (Alert-First Layout)
 *
 * Row 0: WelcomeHeader + QuickActionBar (flex row)
 * Row 1: AlertBanner (긴급 조치 요약, 1 줄)
 * Row 2: KPI 5카드 (독립 행)
 * Row 3: 3컬럼 — 승인대기 | 반출현황(탭) | 교정현황
 * Row 4: 하단 2컬럼 — 최근활동(2fr) | 팀분포+달력(1fr)
 */

import { useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { PendingApprovalCard } from '@/components/dashboard/PendingApprovalCard';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { KpiStatusGrid } from '@/components/dashboard/KpiStatusGrid';
import { OverdueCheckoutsCard } from '@/components/dashboard/OverdueCheckoutsCard';
import { TeamEquipmentDistribution } from '@/components/dashboard/TeamEquipmentDistribution';
import { QuickActionBar } from '@/components/dashboard/QuickActionBar';
import { CalibrationDdayList } from '@/components/dashboard/CalibrationDdayList';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
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
} from '@/lib/api/dashboard-api';
import { DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE, DASHBOARD_GRID } from '@/lib/config/dashboard-config';
import { resolveDashboardScope } from '@/lib/utils/dashboard-scope';
import { getPageContainerClasses } from '@/lib/design-tokens';

// Props 타입
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

  const userRole = session?.user?.role?.toLowerCase() || DEFAULT_ROLE;

  const config = DASHBOARD_ROLE_CONFIG[userRole] || DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
  const { controlCenter } = config;

  // 대시보드 스코프 — API 호출 / queryKey / KPI 링크 세 곳이 동일한 범위를 참조
  const scope = useMemo(
    () =>
      resolveDashboardScope(
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

  // 단일 aggregate 쿼리 — SSR placeholderData로 hydration
  const { data: aggregate, isLoading } = useQuery<DashboardAggregate>({
    queryKey: queryKeys.dashboard.aggregate(userRole, scope.teamId),
    queryFn: () => dashboardApi.getAggregate(scope.teamId),
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
    ...QUERY_CONFIG.DASHBOARD,
  });

  const summary = aggregate?.summary ?? {
    totalEquipment: 0,
    availableEquipment: 0,
    activeCheckouts: 0,
    upcomingCalibrations: 0,
  };
  const equipmentByTeam = aggregate?.equipmentByTeam ?? [];
  const overdueCalibrations = aggregate?.overdueCalibrations?.items ?? [];
  const upcomingCalibrations = aggregate?.upcomingCalibrations?.items ?? [];
  const overdueCheckouts = aggregate?.overdueCheckouts?.items ?? [];
  const recentActivities = aggregate?.recentActivities ?? [];
  const equipmentStatusStats = aggregate?.equipmentStatusStats ?? {};
  const upcomingCheckoutReturns = aggregate?.upcomingCheckoutReturns?.items ?? [];

  return (
    <div className={getPageContainerClasses('list', 'space-y-4')}>
      {/* Row 0: Welcome + QuickActionBar (flex row) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <header className="flex-1 min-w-0">
          <WelcomeHeader />
        </header>
        {controlCenter.showQuickActionBar && controlCenter.quickActions.length > 0 && (
          <div className="sm:flex-shrink-0">
            <QuickActionBar actions={controlCenter.quickActions} />
          </div>
        )}
      </div>

      {/* Row 1: AlertBanner */}
      {controlCenter.showAlertBanner && (
        <AlertBanner
          overdueCalibrationCount={overdueCalibrations.length}
          overdueCheckoutCount={overdueCheckouts.length}
          nonConformingCount={equipmentStatusStats.non_conforming ?? 0}
        />
      )}

      {/* Row 2: KPI 5카드 (독립 행) */}
      <KpiStatusGrid
        summary={summary}
        equipmentStatusStats={equipmentStatusStats}
        loading={isLoading}
        scope={scope}
      />

      {/*
       * Row 3: 액션 행 — 2컬럼 외부 [1fr_280px]
       *
       * CalibrationDday를 항상 우측 280px 고정 컬럼에 배치하기 위해
       * 외부를 [1fr_280px]로 분리하고, 내부에서 승인대기/반출현황을 서브그리드로 처리.
       * 이렇게 하면 역할에 따라 승인대기/반출현황이 일부 없더라도
       * 교정현황은 항상 우측에 고정되어 레이아웃이 일관성을 유지함.
       */}
      {(controlCenter.showPendingApprovals ||
        controlCenter.showCheckoutOverdue ||
        controlCenter.showCalibrationDday) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 items-start">
          {/* 좌측: 승인대기 + 반출현황 서브그리드 */}
          {(controlCenter.showPendingApprovals || controlCenter.showCheckoutOverdue) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {controlCenter.showPendingApprovals && <PendingApprovalCard compact />}
              {controlCenter.showCheckoutOverdue && (
                <OverdueCheckoutsCard
                  overdueCheckouts={overdueCheckouts}
                  upcomingCheckoutReturns={upcomingCheckoutReturns}
                  loading={isLoading}
                />
              )}
            </div>
          )}

          {/* 우측: 교정현황 — 항상 280px 고정 컬럼 */}
          {controlCenter.showCalibrationDday && (
            <CalibrationDdayList
              overdueCalibrations={overdueCalibrations}
              upcomingCalibrations={upcomingCalibrations}
              loading={isLoading}
            />
          )}
        </div>
      )}

      {/*
       * Row 4: 하단 — 팀 분포 유무에 따라 레이아웃 분기
       *
       * showTeamDistribution=true  → 2컬럼 [2fr_1fr]: 최근활동 | 팀분포+달력
       * showTeamDistribution=false → 최근활동 전폭 + 달력 아래 배치 (1컬럼)
       *   → test_engineer, quality_manager 역할에서 우측 컬럼이 허전해지는 문제 해결
       */}
      {controlCenter.showTeamDistribution ? (
        <div className={DASHBOARD_GRID.bottomRow}>
          <section aria-label={t('srOnly.recentActivity')}>
            <RecentActivities data={recentActivities} loading={isLoading} />
          </section>
          <div className="flex flex-col gap-4">
            <TeamEquipmentDistribution equipmentByTeam={equipmentByTeam} loading={isLoading} />
            {controlCenter.showMiniCalendar && (
              <MiniCalendar
                upcomingCalibrations={upcomingCalibrations}
                upcomingCheckoutReturns={upcomingCheckoutReturns}
                overdueCalibrations={overdueCalibrations}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <section aria-label={t('srOnly.recentActivity')}>
            <RecentActivities data={recentActivities} loading={isLoading} />
          </section>
          {controlCenter.showMiniCalendar && (
            <MiniCalendar
              upcomingCalibrations={upcomingCalibrations}
              upcomingCheckoutReturns={upcomingCheckoutReturns}
              overdueCalibrations={overdueCalibrations}
            />
          )}
        </div>
      )}
    </div>
  );
}

export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
