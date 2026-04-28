'use client';

import dynamic from 'next/dynamic';
import { SystemHealthSkeleton } from '@/components/dashboard/skeletons/SystemHealthSkeleton';
import { MyQuickSummarySkeleton } from '@/components/dashboard/skeletons/MyQuickSummarySkeleton';
import { RecentActivitiesSkeleton } from '@/components/dashboard/skeletons/RecentActivitiesSkeleton';
import { TeamDistributionSkeleton } from '@/components/dashboard/skeletons/TeamDistributionSkeleton';
import { MiniCalendarSkeleton } from '@/components/dashboard/skeletons/MiniCalendarSkeleton';
import { DashboardCardErrorBoundary } from '@/components/dashboard/DashboardCardErrorBoundary';
import { DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
import { DASHBOARD_GRID } from '@/lib/config/dashboard-config';
import { cn } from '@/lib/utils';
import type { ControlCenterConfig, SidebarWidget } from '@/lib/config/dashboard-config';
import type {
  EquipmentByTeam,
  UpcomingCalibration,
  UpcomingCheckoutReturn,
  OverdueCalibration,
  DashboardSummary,
  RecentActivity,
  SystemHealthMetrics,
} from '@/lib/api/dashboard-api';

// AP-16 + 명세서 §A.17.1: Row 4 위젯 동적 import + 카드별 Skeleton fallback (CLS 방지)
const RecentActivities = dynamic(
  () => import('@/components/dashboard/RecentActivities').then((m) => m.RecentActivities),
  { ssr: false, loading: () => <RecentActivitiesSkeleton /> }
);
const TeamEquipmentDistribution = dynamic(
  () =>
    import('@/components/dashboard/TeamEquipmentDistribution').then(
      (m) => m.TeamEquipmentDistribution
    ),
  { ssr: false, loading: () => <TeamDistributionSkeleton /> }
);
const MiniCalendar = dynamic(
  () => import('@/components/dashboard/MiniCalendar').then((m) => m.MiniCalendar),
  { ssr: false, loading: () => <MiniCalendarSkeleton /> }
);
const SystemHealthCard = dynamic(
  () => import('@/components/dashboard/SystemHealthCard').then((m) => m.SystemHealthCard),
  { ssr: false, loading: () => <SystemHealthSkeleton /> }
);
// 대시보드 개선안 §A.4 — 시험실무자 Row4: 내 빠른 요약
const MyQuickSummaryCard = dynamic(
  () => import('@/components/dashboard/cards/MyQuickSummaryCard').then((m) => m.MyQuickSummaryCard),
  { ssr: false, loading: () => <MyQuickSummarySkeleton /> }
);

interface SidebarWidgetRendererProps {
  equipmentByTeam: EquipmentByTeam[];
  upcomingCalibrations: UpcomingCalibration[];
  upcomingCheckoutReturns: UpcomingCheckoutReturn[];
  overdueCalibrations: OverdueCalibration[];
  summary?: DashboardSummary;
  equipmentStatusStats: Record<string, number>;
  recentActivities: RecentActivity[];
  loading: boolean;
  /** §A.4 시험실무자 빠른 요약 */
  myQuickSummary?: {
    pendingCheckoutRequests: number;
    upcomingCalibrations?: { count: number; nearestDays: number };
    nonconformanceItems: number;
  };
  /** §3.9 시스템관리자 시스템 상태 메트릭 (백엔드 /api/system/health). */
  systemHealth?: SystemHealthMetrics;
  /** §A.6 팀별 장비 분포 표시 범위 (lab=시험소, all=전사). */
  teamDistributionScope?: 'lab' | 'all';
}

const SIDEBAR_WIDGET_RENDERERS: Record<
  SidebarWidget,
  (props: SidebarWidgetRendererProps) => React.ReactNode
> = {
  teamDistribution: (p) => (
    <DashboardCardErrorBoundary cardName="TeamEquipmentDistribution">
      <TeamEquipmentDistribution
        equipmentByTeam={p.equipmentByTeam}
        loading={p.loading}
        scope={p.teamDistributionScope ?? 'lab'}
      />
    </DashboardCardErrorBoundary>
  ),
  miniCalendar: (p) => (
    <DashboardCardErrorBoundary cardName="MiniCalendar">
      <MiniCalendar
        upcomingCalibrations={p.upcomingCalibrations}
        upcomingCheckoutReturns={p.upcomingCheckoutReturns}
        overdueCalibrations={p.overdueCalibrations}
      />
    </DashboardCardErrorBoundary>
  ),
  systemHealth: (p) => (
    <DashboardCardErrorBoundary cardName="SystemHealthCard">
      <SystemHealthCard metrics={p.systemHealth} loading={p.loading} />
    </DashboardCardErrorBoundary>
  ),
  myQuickSummary: (p) => (
    <DashboardCardErrorBoundary cardName="MyQuickSummaryCard">
      <MyQuickSummaryCard
        pendingCheckoutRequests={p.myQuickSummary?.pendingCheckoutRequests ?? 0}
        upcomingCalibrations={p.myQuickSummary?.upcomingCalibrations}
        nonconformanceItems={p.myQuickSummary?.nonconformanceItems ?? 0}
        loading={p.loading}
      />
    </DashboardCardErrorBoundary>
  ),
};

export interface DashboardRow4Props {
  controlCenter: ControlCenterConfig;
  bottomRowTemplate?: 'default' | 'admin' | 'testEngineer';
  equipmentByTeam: EquipmentByTeam[];
  upcomingCalibrations: UpcomingCalibration[];
  upcomingCheckoutReturns: UpcomingCheckoutReturn[];
  overdueCalibrations: OverdueCalibration[];
  summary?: DashboardSummary;
  equipmentStatusStats: Record<string, number>;
  recentActivities: RecentActivity[];
  loading: boolean;
  recentActivityAriaLabel?: string;
  /** 대시보드 개선안 §A.4 — 시험실무자 빠른 요약 카드 입력 */
  myQuickSummary?: {
    pendingCheckoutRequests: number;
    upcomingCalibrations?: { count: number; nearestDays: number };
    nonconformanceItems: number;
  };
  /** 대시보드 개선안 §3.9 — 시스템관리자 시스템 상태 메트릭 (백엔드 /api/system/health). */
  systemHealth?: SystemHealthMetrics;
}

export function DashboardRow4({
  controlCenter,
  bottomRowTemplate,
  equipmentByTeam,
  upcomingCalibrations,
  upcomingCheckoutReturns,
  overdueCalibrations,
  summary,
  equipmentStatusStats,
  recentActivities,
  loading,
  recentActivityAriaLabel = '',
  myQuickSummary,
  systemHealth,
}: DashboardRow4Props) {
  const { sidebarWidgets, showRecentActivities } = controlCenter;
  const sidebarCount = sidebarWidgets.length;
  const sidebarGridRows = sidebarCount <= 1 ? '1fr' : `repeat(${sidebarCount - 1}, auto) 1fr`;

  const sidebarProps: SidebarWidgetRendererProps = {
    equipmentByTeam,
    upcomingCalibrations,
    upcomingCheckoutReturns,
    overdueCalibrations,
    summary,
    equipmentStatusStats,
    recentActivities,
    loading,
    myQuickSummary,
    systemHealth,
    teamDistributionScope: controlCenter.teamDistributionScope,
  };

  // 대시보드 개선안 §4.1 — 시험실무자 Row4: [MiniCalendar | MyQuickSummary]
  // RecentActivities 영역이 없는 가로형 2-col 레이아웃. sidebarWidgets 정확히 2개 필요.
  if (bottomRowTemplate === 'testEngineer') {
    return (
      <div
        className={cn(
          DASHBOARD_GRID.bottomRowTestEngineer,
          E.stagger.row4Anim,
          E.stagger.row4Delay
        )}
      >
        {sidebarWidgets.map((widget) => (
          <div key={widget} data-widget={widget}>
            {SIDEBAR_WIDGET_RENDERERS[widget](sidebarProps)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        bottomRowTemplate === 'admin' ? DASHBOARD_GRID.bottomRowAdmin : DASHBOARD_GRID.bottomRow,
        E.stagger.row4Anim,
        E.stagger.row4Delay
      )}
    >
      {showRecentActivities !== false && (
        <section aria-label={recentActivityAriaLabel}>
          <DashboardCardErrorBoundary cardName="RecentActivities">
            <RecentActivities data={recentActivities} loading={loading} />
          </DashboardCardErrorBoundary>
        </section>
      )}
      {sidebarCount > 0 && (
        <div className="grid gap-4 h-full" style={{ gridTemplateRows: sidebarGridRows }}>
          {sidebarWidgets.map((widget) => (
            <div key={widget} data-widget={widget}>
              {SIDEBAR_WIDGET_RENDERERS[widget](sidebarProps)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
