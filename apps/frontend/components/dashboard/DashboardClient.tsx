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
import { resolveDashboardRoleConfig } from '@/lib/utils/dashboard-role';
import { resolveDashboardScope } from '@/lib/utils/dashboard-scope';
import { getPageContainerClasses, DASHBOARD_MOTION } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { DashboardRow0 } from './layout/DashboardRow0';
import { DashboardRow1 } from './layout/DashboardRow1';
import { DashboardRow2 } from './layout/DashboardRow2';
import { DashboardRow3 } from './layout/DashboardRow3';
import { DashboardRow4 } from './layout/DashboardRow4';

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

  const { role: userRole, config } = resolveDashboardRoleConfig(session?.user?.role);
  const { controlCenter } = config;

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
    <div className={getPageContainerClasses('list')}>
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
        userName={session?.user?.name ?? undefined}
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
      />
    </div>
  );
}

export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
