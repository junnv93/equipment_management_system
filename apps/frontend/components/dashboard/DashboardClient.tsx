'use client';

/**
 * 대시보드 클라이언트 컴포넌트 — Command Center (Alert-First Layout)
 *
 * Row 0: WelcomeHeader + QuickActionBar (flex row)        — animate-fade-in-up
 * Row 1: AlertBanner (긴급 조치 요약, 1 줄)               — animate-slide-left
 * Row 2: KPI 4카드 (독립 행)                              — animate-scale-in-subtle
 * Row 3: 액션 행 — [승인대기+반출현황 | 교정현황]          — animate-fade-in-up
 * Row 4: 하단 — 최근활동(2fr) | [팀분포+]달력(1fr)        — animate-fade-in
 *
 * v3 개선사항 (와이어프레임 dashboard-redesign-v3-test-engineer):
 * - AP-01: Row 3 좌측 서브그리드 — 아이템 1개일 때 grid-cols-1로 풀너비
 * - AP-01: Row 4 — showTeamDistribution=false여도 [2fr_1fr] 가로 배치
 * - AP-06: Row별 다른 진입 애니메이션 (fade-up, slide-left, scale-in-subtle, fade-in)
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
import { SystemHealthCard } from '@/components/dashboard/SystemHealthCard';
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
import {
  DASHBOARD_ROLE_CONFIG,
  DEFAULT_ROLE,
  DASHBOARD_GRID,
  type SidebarWidget,
} from '@/lib/config/dashboard-config';
import { resolveDashboardScope } from '@/lib/utils/dashboard-scope';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

// 사이드바 위젯 렌더러 props 타입
interface SidebarWidgetRendererProps {
  equipmentByTeam: import('@/lib/api/dashboard-api').EquipmentByTeam[];
  upcomingCalibrations: import('@/lib/api/dashboard-api').UpcomingCalibration[];
  upcomingCheckoutReturns: import('@/lib/api/dashboard-api').UpcomingCheckoutReturn[];
  overdueCalibrations: import('@/lib/api/dashboard-api').OverdueCalibration[];
  summary?: import('@/lib/api/dashboard-api').DashboardSummary;
  equipmentStatusStats?: Record<string, number>;
  recentActivities?: import('@/lib/api/dashboard-api').RecentActivity[];
  loading: boolean;
}

/**
 * 사이드바 위젯 렌더러 매핑 (모듈 레벨 — 렌더마다 재생성 방지)
 *
 * config의 sidebarWidgets 배열 순서로 렌더됨
 */
const SIDEBAR_WIDGET_RENDERERS: Record<
  SidebarWidget,
  (props: SidebarWidgetRendererProps) => React.ReactNode
> = {
  teamDistribution: (p) => (
    <TeamEquipmentDistribution equipmentByTeam={p.equipmentByTeam} loading={p.loading} />
  ),
  miniCalendar: (p) => (
    <MiniCalendar
      upcomingCalibrations={p.upcomingCalibrations}
      upcomingCheckoutReturns={p.upcomingCheckoutReturns}
      overdueCalibrations={p.overdueCalibrations}
    />
  ),
  systemHealth: (p) => (
    <SystemHealthCard
      summary={p.summary}
      equipmentStatusStats={p.equipmentStatusStats}
      recentActivities={p.recentActivities}
      loading={p.loading}
    />
  ),
};

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
    <div className={getPageContainerClasses('list')}>
      {/* Row 0: Welcome + QuickActionBar — 입장 애니메이션 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 motion-safe:animate-fade-in-up">
        <header className="flex-1 min-w-0">
          <WelcomeHeader />
        </header>
        {controlCenter.showQuickActionBar && controlCenter.quickActions.length > 0 && (
          <div className="lg:flex-shrink-0">
            <QuickActionBar actions={controlCenter.quickActions} />
          </div>
        )}
      </div>

      {/* Row 1: AlertBanner — AP-02: Welcome→Alert 넓은 간격 (mt-6), AP-06: slide-left */}
      {controlCenter.showAlertBanner && (
        <div className="mt-6 motion-safe:animate-slide-left" style={{ animationDelay: '80ms' }}>
          <AlertBanner
            overdueCalibrationCount={equipmentStatusStats.calibration_overdue ?? 0}
            overdueCheckoutCount={overdueCheckouts.length}
            nonConformingCount={equipmentStatusStats.non_conforming ?? 0}
            scope={scope}
          />
        </div>
      )}

      {/* Row 2: KPI 4카드 — AP-02: Alert→KPI 넓은 간격, KPI→액션 최대 간격, AP-06: scale-in-subtle */}
      <div
        className="mt-7 mb-8 motion-safe:animate-scale-in-subtle"
        style={{ animationDelay: '160ms' }}
      >
        <KpiStatusGrid
          summary={summary}
          equipmentStatusStats={equipmentStatusStats}
          loading={isLoading}
          scope={scope}
        />
      </div>

      {/*
       * Row 3: 액션 행
       *
       * row3Layout에 따라 두 가지 레이아웃으로 분기:
       *
       * 'three-col-action-first' (기술책임자):
       *   [승인대기 1.5fr | 교정현황 1.5fr | 반출현황 1fr]
       *   좌→우 스캔 시 액션(action) → 감시(watch) → 감시(watch) 의미 계층과 일치
       *
       * 'two-col-left-dominant' (기본값):
       *   [교정현황 2fr | 서브그리드(승인+반출) 1.5fr]
       *   loading.tsx 스켈레톤과 동기화
       */}
      {(controlCenter.showPendingApprovals ||
        controlCenter.showCheckoutOverdue ||
        controlCenter.showCalibrationDday) &&
        (controlCenter.row3Layout === 'three-col-action-first' ? (
          /* three-col-action-first: 승인대기 우선, 3컬럼 flat grid */
          <div
            className={cn(DASHBOARD_GRID.row3ThreeCol, 'mb-8 motion-safe:animate-fade-in-up')}
            style={{ animationDelay: '240ms' }}
          >
            {controlCenter.showPendingApprovals && (
              <PendingApprovalCard
                compact
                layoutHint={controlCenter.pendingApprovalLayoutHint}
                priorities={controlCenter.approvalCategoryPriorities}
                elevate={controlCenter.pendingApprovalElevated}
              />
            )}
            {controlCenter.showCalibrationDday && (
              <CalibrationDdayList
                overdueCalibrations={overdueCalibrations}
                upcomingCalibrations={upcomingCalibrations}
                scope={scope}
                loading={isLoading}
              />
            )}
            {controlCenter.showCheckoutOverdue && (
              <OverdueCheckoutsCard
                overdueCheckouts={overdueCheckouts}
                upcomingCheckoutReturns={upcomingCheckoutReturns}
                loading={isLoading}
              />
            )}
          </div>
        ) : (
          /* two-col-left-dominant: 교정현황 좌/2fr, 서브그리드 우/1.5fr (기본값) */
          <div
            className={cn(DASHBOARD_GRID.row3, 'mb-8 motion-safe:animate-fade-in-up')}
            style={{ animationDelay: '240ms' }}
          >
            {controlCenter.showCalibrationDday && (
              <CalibrationDdayList
                overdueCalibrations={overdueCalibrations}
                upcomingCalibrations={upcomingCalibrations}
                scope={scope}
                loading={isLoading}
              />
            )}
            {(controlCenter.showPendingApprovals || controlCenter.showCheckoutOverdue) && (
              <div
                className={cn(
                  'grid gap-4',
                  controlCenter.showPendingApprovals && controlCenter.showCheckoutOverdue
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1'
                )}
              >
                {controlCenter.showPendingApprovals && (
                  <PendingApprovalCard
                    compact
                    layoutHint={controlCenter.pendingApprovalLayoutHint}
                    priorities={controlCenter.approvalCategoryPriorities}
                    elevate={controlCenter.pendingApprovalElevated}
                  />
                )}
                {controlCenter.showCheckoutOverdue && (
                  <OverdueCheckoutsCard
                    overdueCheckouts={overdueCheckouts}
                    upcomingCheckoutReturns={upcomingCheckoutReturns}
                    loading={isLoading}
                  />
                )}
              </div>
            )}
          </div>
        ))}

      {/*
       * Row 4: 하단 — AP-06: animate-fade-in
       *
       * v3 개선 (AP-01): showTeamDistribution 유무와 무관하게
       * 항상 [2fr_1fr] 가로 배치 유지 — 세로 스택 단조로움 해소
       */}
      <div
        className={cn(DASHBOARD_GRID.bottomRow, 'motion-safe:animate-fade-in')}
        style={{ animationDelay: '320ms' }}
      >
        <section aria-label={t('srOnly.recentActivity')}>
          <RecentActivities data={recentActivities} loading={isLoading} />
        </section>
        {controlCenter.sidebarWidgets.length > 0 && (
          <div className="flex flex-col gap-4 h-full">
            {controlCenter.sidebarWidgets.map((widget) => {
              const sidebarProps: SidebarWidgetRendererProps = {
                equipmentByTeam,
                upcomingCalibrations,
                upcomingCheckoutReturns,
                overdueCalibrations,
                summary: aggregate?.summary ?? undefined,
                equipmentStatusStats,
                recentActivities,
                loading: isLoading,
              };
              return <div key={widget}>{SIDEBAR_WIDGET_RENDERERS[widget](sidebarProps)}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
