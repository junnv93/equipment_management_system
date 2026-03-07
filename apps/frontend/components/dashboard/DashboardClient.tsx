'use client';

/**
 * 대시보드 클라이언트 컴포넌트 — 밀도 높은 그리드 레이아웃
 *
 * Row 1: KPI 4카드 + 교정 현황 컴팩트 리스트
 * Row 2: 승인 대기 + 반출 초과 + 미니 달력
 * Row 3: 최근 활동 피드 + 팀별 장비 분포
 */

import { useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { PendingApprovalCard } from '@/components/dashboard/PendingApprovalCard';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { KpiStatusGrid } from '@/components/dashboard/KpiStatusGrid';
import { CalibrationDdayList } from '@/components/dashboard/CalibrationDdayList';
import { OverdueCheckoutsCard } from '@/components/dashboard/OverdueCheckoutsCard';
import { TeamEquipmentDistribution } from '@/components/dashboard/TeamEquipmentDistribution';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import type {
  DashboardSummary,
  EquipmentByTeam,
  OverdueCalibration,
  UpcomingCalibration,
  OverdueCheckout,
  RecentActivity,
  UpcomingCheckoutReturn,
  DashboardAggregate,
} from '@/lib/api/dashboard-api';
import { DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE } from '@/lib/config/dashboard-config';

// Props 타입
export interface DashboardClientProps {
  initialSummary?: DashboardSummary;
  initialEquipmentByTeam?: EquipmentByTeam[];
  initialOverdueCalibrations?: OverdueCalibration[];
  initialUpcomingCalibrations?: UpcomingCalibration[];
  initialOverdueCheckouts?: OverdueCheckout[];
  initialRecentActivities?: RecentActivity[];
  initialEquipmentStatusStats?: Record<string, number>;
  initialUpcomingCheckoutReturns?: UpcomingCheckoutReturn[];
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

  const selectedTeamId = useMemo(() => {
    return searchParams.get('teamId') || undefined;
  }, [searchParams]);

  // 단일 aggregate 쿼리 — SSR placeholderData로 hydration
  const { data: aggregate, isLoading } = useQuery<DashboardAggregate>({
    queryKey: queryKeys.dashboard.aggregate(userRole, selectedTeamId),
    queryFn: () => dashboardApi.getAggregate(selectedTeamId),
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
  const overdueCalibrations = aggregate?.overdueCalibrations ?? [];
  const upcomingCalibrations = aggregate?.upcomingCalibrations ?? [];
  const overdueCheckouts = aggregate?.overdueCheckouts ?? [];
  const recentActivities = aggregate?.recentActivities ?? [];
  const equipmentStatusStats = aggregate?.equipmentStatusStats ?? {};
  const upcomingCheckoutReturns = aggregate?.upcomingCheckoutReturns ?? [];

  const config = DASHBOARD_ROLE_CONFIG[userRole] || DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
  const { controlCenter } = config;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <header>
        <WelcomeHeader />
      </header>

      {/* Row 1: KPI 4카드 + 교정 현황 컴팩트 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <KpiStatusGrid
          summary={summary}
          equipmentStatusStats={equipmentStatusStats}
          loading={isLoading}
          kpiDisplay={controlCenter.kpiDisplay}
        />
        {controlCenter.showCalibrationDday && (
          <CalibrationDdayList
            overdueCalibrations={overdueCalibrations}
            upcomingCalibrations={upcomingCalibrations}
            loading={isLoading}
          />
        )}
      </div>

      {/* Row 2: 승인 대기 + 반출 초과 + 미니 달력 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {controlCenter.showPendingApprovals && <PendingApprovalCard compact />}
          {controlCenter.showCheckoutOverdue && (
            <OverdueCheckoutsCard overdueCheckouts={overdueCheckouts} loading={isLoading} />
          )}
        </div>
        {controlCenter.showMiniCalendar && (
          <MiniCalendar
            upcomingCalibrations={upcomingCalibrations}
            upcomingCheckoutReturns={upcomingCheckoutReturns}
            overdueCalibrations={overdueCalibrations}
          />
        )}
      </div>

      {/* Row 3: 최근 활동 피드 + 팀별 장비 분포 */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <section aria-label={t('srOnly.recentActivity')}>
          <RecentActivities data={recentActivities} loading={isLoading} />
        </section>
        {controlCenter.showTeamDistribution && (
          <TeamEquipmentDistribution equipmentByTeam={equipmentByTeam} loading={isLoading} />
        )}
      </div>
    </div>
  );
}

export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
