'use client';

/**
 * 대시보드 클라이언트 컴포넌트 — Command Center (Alert-First Layout)
 *
 * Row 0: WelcomeHeader + QuickActionBar (flex row)        — animate-fade-in-up
 * Row 1: AlertBanner (긴급 조치 요약, 1 줄)               — animate-slide-left
 * Row 2: KPI 4카드 (독립 행)                              — animate-scale-in-subtle
 * Row 3: 액션 행 — [승인대기+반출현황 | 교정현황]          — animate-fade-in-up
 * Row 4: 하단 — 최근활동(2fr) | [팀분포+]달력(1fr)        — animate-fade-in
 */

import { useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { KpiStatusGrid } from '@/components/dashboard/KpiStatusGrid';
import { QuickActionBar } from '@/components/dashboard/QuickActionBar';
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
import { DASHBOARD_GRID, type SidebarWidget } from '@/lib/config/dashboard-config';
import { resolveDashboardScope } from '@/lib/utils/dashboard-scope';
import { resolveDashboardRoleConfig } from '@/lib/utils/dashboard-role';
import {
  getPageContainerClasses,
  DASHBOARD_ENTRANCE as E,
  DASHBOARD_MOTION,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// AP-16: below-the-fold 컴포넌트 동적 임포트 (First Load JS -15~30KB)
const PendingApprovalCard = dynamic(
  () => import('@/components/dashboard/PendingApprovalCard').then((m) => m.PendingApprovalCard),
  { ssr: true, loading: () => <Skeleton className="min-h-[12rem] rounded-lg" /> }
);
const RecentActivities = dynamic(
  () => import('@/components/dashboard/RecentActivities').then((m) => m.RecentActivities),
  { ssr: true, loading: () => <Skeleton className="min-h-[16rem] rounded-lg" /> }
);
const OverdueCheckoutsCard = dynamic(
  () => import('@/components/dashboard/OverdueCheckoutsCard').then((m) => m.OverdueCheckoutsCard),
  { ssr: true, loading: () => <Skeleton className="min-h-[12rem] rounded-lg" /> }
);
const TeamEquipmentDistribution = dynamic(
  () =>
    import('@/components/dashboard/TeamEquipmentDistribution').then(
      (m) => m.TeamEquipmentDistribution
    ),
  { ssr: true, loading: () => <Skeleton className="min-h-[10rem] rounded-lg" /> }
);
const CalibrationDdayList = dynamic(
  () => import('@/components/dashboard/CalibrationDdayList').then((m) => m.CalibrationDdayList),
  { ssr: true, loading: () => <Skeleton className="min-h-[12rem] rounded-lg" /> }
);
const MiniCalendar = dynamic(
  () => import('@/components/dashboard/MiniCalendar').then((m) => m.MiniCalendar),
  { ssr: true, loading: () => <Skeleton className="min-h-[10rem] rounded-lg" /> }
);
const SystemHealthCard = dynamic(
  () => import('@/components/dashboard/SystemHealthCard').then((m) => m.SystemHealthCard),
  { ssr: true, loading: () => <Skeleton className="min-h-[10rem] rounded-lg" /> }
);
const MyActivityCard = dynamic(
  () => import('@/components/dashboard/MyActivityCard').then((m) => m.MyActivityCard),
  { ssr: true, loading: () => <Skeleton className="min-h-[10rem] rounded-lg" /> }
);

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

  // AP-09: resolveDashboardRoleConfig 헬퍼 — server/client 중복 제거
  const { role: userRole, config } = resolveDashboardRoleConfig(session?.user?.role);
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
  const upcomingCalibrations = aggregate?.upcomingCalibrations?.items ?? [];
  const overdueCheckouts = aggregate?.overdueCheckouts?.items ?? [];
  const recentActivities = aggregate?.recentActivities ?? [];
  const equipmentStatusStats = aggregate?.equipmentStatusStats ?? {};
  const upcomingCheckoutReturns = aggregate?.upcomingCheckoutReturns?.items ?? [];

  // AP-14: AlertBanner trailingAction 슬롯
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

  // AP-06: 사이드바 grid-rows 동적 계산 — last widget stretches to fill
  const sidebarCount = controlCenter.sidebarWidgets.length;
  const sidebarGridRows = sidebarCount <= 1 ? '1fr' : `repeat(${sidebarCount - 1}, auto) 1fr`;

  return (
    <div className={getPageContainerClasses('list')}>
      {isError && (
        <div className="mb-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('aggregate.error')}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Row 0: Welcome + QuickActionBar — AP-01: xl: 브레이크포인트, AP-08: 토큰 */}
      <div
        className={cn(
          'flex flex-col xl:flex-row xl:items-end xl:justify-between gap-3',
          E.stagger.welcome,
          E.stagger.welcomeDelay
        )}
      >
        <header className="flex-1 min-w-0">
          <WelcomeHeader />
        </header>
        {controlCenter.showQuickActionBar && controlCenter.quickActions.length > 0 && (
          <div className="xl:flex-shrink-0">
            <QuickActionBar actions={controlCenter.quickActions} />
          </div>
        )}
      </div>

      {/* Row 1: AlertBanner — AP-02: AP-11: info severity, AP-14: trailingAction */}
      {controlCenter.showAlertBanner && (
        <div className={cn(E.rowSpacing.welcomeToAlert, E.stagger.alert, E.stagger.alertDelay)}>
          <AlertBanner
            overdueCalibrationCount={equipmentStatusStats.calibration_overdue ?? 0}
            overdueCheckoutCount={overdueCheckouts.length}
            nonConformingCount={equipmentStatusStats.non_conforming ?? 0}
            upcomingCalibrationCount={upcomingCalibrations.length}
            upcomingCheckoutReturnCount={upcomingCheckoutReturns.length}
            scope={scope}
            trailingAction={alertTrailingAction}
          />
        </div>
      )}

      {/* Row 2: KPI 4카드 — AP-04: SSOT + hysteresis, AP-12: useCountUp */}
      <div className={cn('mt-7 mb-8', E.stagger.kpi, E.stagger.kpiDelay)}>
        <KpiStatusGrid
          summary={summary}
          equipmentStatusStats={equipmentStatusStats}
          loading={isLoading}
          scope={scope}
        />
      </div>

      {/*
       * Row 3: 액션 행 — AP-07: row3Layout 분기
       *
       * 'three-col-action-first' (quality_manager):
       *   [승인대기 1.4fr | 교정현황 1.4fr | 반출현황 1.2fr]
       *
       * 'single-col-stretch' (test_engineer):
       *   [MyActivityCard 풀폭] — 교정현황 없음
       *
       * 'two-col-balanced' (two-col 비율 조정):
       *   [교정현황 2fr | 서브그리드 1.5fr]
       *
       * 'two-col-left-dominant' / 기본값:
       *   [교정현황 2fr | 서브그리드(승인+반출) 1.5fr]
       */}
      {(controlCenter.showPendingApprovals ||
        controlCenter.showCheckoutOverdue ||
        controlCenter.showCalibrationDday ||
        controlCenter.showMyActivity) && (
        <>
          {controlCenter.row3Layout === 'three-col-action-first' ? (
            /* three-col-action-first: 승인대기 우선, 3컬럼 flat grid */
            <div
              className={cn(
                DASHBOARD_GRID.row3ThreeCol,
                'mb-8',
                E.stagger.row3,
                E.stagger.row3Delay
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
          ) : controlCenter.row3Layout === 'single-col-stretch' ? (
            /* single-col-stretch: test_engineer — MyActivityCard 풀폭 */
            <div
              className={cn(
                DASHBOARD_GRID.row3SingleCol,
                'mb-8',
                E.stagger.row3,
                E.stagger.row3Delay
              )}
            >
              {controlCenter.showMyActivity && session?.user?.id && (
                <MyActivityCard userId={session.user.id} recentActivities={recentActivities} />
              )}
            </div>
          ) : (
            /* two-col-left-dominant (기본값) / two-col-balanced */
            <div
              className={cn(
                controlCenter.row3Layout === 'two-col-balanced'
                  ? DASHBOARD_GRID.row3TwoColBalanced
                  : DASHBOARD_GRID.row3,
                'mb-8',
                E.stagger.row3,
                E.stagger.row3Delay
              )}
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
                    controlCenter.showPendingApprovals && controlCenter.showCheckoutOverdue
                      ? DASHBOARD_GRID.row3SubGrid
                      : DASHBOARD_GRID.row3SubGridSingle
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
          )}
        </>
      )}

      {/*
       * Row 4: 하단 — AP-06: animate-fade-in
       * Gap-02: system_admin → bottomRowAdmin [1.5fr_1fr]
       * AP-06: sidebar grid-rows 동적 계산 — last widget stretches
       */}
      <div
        className={cn(
          config.bottomRowTemplate === 'admin'
            ? DASHBOARD_GRID.bottomRowAdmin
            : DASHBOARD_GRID.bottomRow,
          E.stagger.row4Anim,
          E.stagger.row4Delay
        )}
      >
        {controlCenter.showRecentActivities !== false && (
          <section aria-label={t('srOnly.recentActivity')}>
            <RecentActivities data={recentActivities} loading={isLoading} />
          </section>
        )}
        {sidebarCount > 0 && (
          <div className="grid gap-4 h-full" style={{ gridTemplateRows: sidebarGridRows }}>
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
