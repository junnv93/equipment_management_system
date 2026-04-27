'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_SKELETON_MIN_H as SK, DASHBOARD_ENTRANCE as E } from '@/lib/design-tokens';
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
} from '@/lib/api/dashboard-api';

// AP-16: Row 4 위젯 동적 임포트
const RecentActivities = dynamic(
  () => import('@/components/dashboard/RecentActivities').then((m) => m.RecentActivities),
  { ssr: true, loading: () => <Skeleton className={`${SK.lg} rounded-lg`} /> }
);
const TeamEquipmentDistribution = dynamic(
  () =>
    import('@/components/dashboard/TeamEquipmentDistribution').then(
      (m) => m.TeamEquipmentDistribution
    ),
  { ssr: true, loading: () => <Skeleton className={`${SK.sm} rounded-lg`} /> }
);
const MiniCalendar = dynamic(
  () => import('@/components/dashboard/MiniCalendar').then((m) => m.MiniCalendar),
  { ssr: true, loading: () => <Skeleton className={`${SK.sm} rounded-lg`} /> }
);
const SystemHealthCard = dynamic(
  () => import('@/components/dashboard/SystemHealthCard').then((m) => m.SystemHealthCard),
  { ssr: true, loading: () => <Skeleton className={`${SK.sm} rounded-lg`} /> }
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
}

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

export interface DashboardRow4Props {
  controlCenter: ControlCenterConfig;
  bottomRowTemplate?: 'default' | 'admin';
  equipmentByTeam: EquipmentByTeam[];
  upcomingCalibrations: UpcomingCalibration[];
  upcomingCheckoutReturns: UpcomingCheckoutReturn[];
  overdueCalibrations: OverdueCalibration[];
  summary?: DashboardSummary;
  equipmentStatusStats: Record<string, number>;
  recentActivities: RecentActivity[];
  loading: boolean;
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
}: DashboardRow4Props) {
  const t = useTranslations('dashboard');
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
  };

  return (
    <div
      className={cn(
        bottomRowTemplate === 'admin' ? DASHBOARD_GRID.bottomRowAdmin : DASHBOARD_GRID.bottomRow,
        E.stagger.row4Anim,
        E.stagger.row4Delay
      )}
    >
      {showRecentActivities !== false && (
        <section aria-label={t('srOnly.recentActivity')}>
          <RecentActivities data={recentActivities} loading={loading} />
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
