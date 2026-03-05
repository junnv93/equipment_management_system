'use client';

/**
 * 대시보드 클라이언트 컴포넌트
 *
 * Next.js 16 Best Practice:
 * - Server Component(page.tsx)에서 초기 데이터를 받아 렌더링
 * - 클라이언트 상호작용, 실시간 업데이트 처리
 * - React Query로 클라이언트 측 데이터 갱신
 *
 * 성능 최적화 (vercel-react-best-practices):
 * - 큰 컴포넌트는 dynamic import로 지연 로딩
 * - React.memo로 불필요한 리렌더 방지
 * - useMemo, useCallback으로 메모이제이션
 *
 * 접근성 (WCAG 2.1 AA):
 * - aria-live로 동적 업데이트 알림
 * - 키보드 탐색 지원
 * - 적절한 heading 구조
 */

import { useCallback, useMemo, memo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CalibrationList } from '@/components/dashboard/CalibrationList';
import { OverdueCheckoutsList } from '@/components/dashboard/OverdueCheckoutsList';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionButtons } from '@/components/dashboard/QuickActionButtons';
import { PendingApprovalCard } from '@/components/dashboard/PendingApprovalCard';
import { EquipmentStatusBar } from '@/components/dashboard/EquipmentStatusBar';
import { EquipmentStatusBreakdown } from '@/components/dashboard/EquipmentStatusBreakdown';
import { AlertPanel } from '@/components/dashboard/AlertPanel';
import { ClientOnly } from '@/components/shared/ClientOnly';
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
  DashboardAggregate,
} from '@/lib/api/dashboard-api';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_MOTION, DASHBOARD_FOCUS, getDashboardStaggerDelay } from '@/lib/design-tokens';
import {
  DASHBOARD_ROLE_CONFIG,
  DEFAULT_ROLE,
  DEFAULT_TAB,
  LEGACY_TAB_MAP,
} from '@/lib/config/dashboard-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

// [WebSocket dead code] SSE 기반 알림으로 대체됨 — 백엔드 WebSocket 구현 시 활성화
// const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// [WebSocket dead code] SSE 기반 알림으로 대체됨
// interface DashboardUpdateEvent { ... }

// Props 타입
export interface DashboardClientProps {
  initialSummary?: DashboardSummary;
  initialEquipmentByTeam?: EquipmentByTeam[];
  initialOverdueCalibrations?: OverdueCalibration[];
  initialUpcomingCalibrations?: UpcomingCalibration[];
  initialOverdueCheckouts?: OverdueCheckout[];
  initialRecentActivities?: RecentActivity[];
  initialEquipmentStatusStats?: Record<string, number>;
}

/**
 * 대시보드 클라이언트 컴포넌트
 *
 * ✅ Vercel Best Practice: async-parallel
 * - React Query는 독립적인 useQuery 훅을 자동으로 병렬 실행합니다
 * - 아래 7개 쿼리는 동시에 시작되어 waterfall 없이 데이터를 가져옵니다
 * - initialData로 Server Component에서 받은 데이터를 hydration하여 FCP 최적화
 * - useQueries는 동적 쿼리 수에 유용하지만, 정적 쿼리에서는 현재 패턴이 최적입니다
 */
function DashboardClientComponent({
  initialSummary,
  initialEquipmentByTeam,
  initialOverdueCalibrations,
  initialUpcomingCalibrations,
  initialOverdueCheckouts,
  initialRecentActivities,
  initialEquipmentStatusStats,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const t = useTranslations('dashboard');
  const searchParams = useSearchParams();
  const router = useRouter();

  const userRole = session?.user?.role?.toLowerCase() || DEFAULT_ROLE;

  // URL-driven 팀 필터 (SSOT: URL 파라미터가 유일한 진실의 소스)
  const selectedTeamId = useMemo(() => {
    return searchParams.get('teamId') || undefined;
  }, [searchParams]);

  // React Query - 단일 aggregate 쿼리 (SSR과 동일 엔드포인트 SSOT)
  // 7개 개별 요청 → 1개 요청으로 통합 (throttle 문제 원천 차단, HTTP 왕복 최소화)
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

  // Config-Driven: 역할별 탭과 StatsCards를 SSOT config에서 읽기
  const config = DASHBOARD_ROLE_CONFIG[userRole] || DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
  const tabs = config.tabs;

  // URL-driven 탭 상태 (Web Interface Guidelines: deep-linking 지원)
  // 레거시 URL 호환: ?tab=attention→calibration, ?tab=overview→calibration, ?tab=rental→checkout
  const activeTab = useMemo(() => {
    const tabParam = searchParams.get('tab');
    const mapped = tabParam ? LEGACY_TAB_MAP[tabParam] || tabParam : DEFAULT_TAB;
    return tabs.some((t) => t.value === mapped) ? mapped : DEFAULT_TAB;
  }, [searchParams, tabs]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === DEFAULT_TAB) {
        params.delete('tab');
      } else {
        params.set('tab', value);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Config-Driven: 역할별 StatsCards — i18n 키를 번역
  const tStats = useTranslations('dashboard.stats');
  const statsCards = useMemo(
    () =>
      config.statsCards.map((card) => {
        const rawDesc = card.getDescription?.(summary, equipmentStatusStats);
        let description: string | undefined;
        if (rawDesc?.startsWith('percentOfTotal:')) {
          const [, percent, total] = rawDesc.split(':');
          description = tStats('percentOfTotal', { percent, total });
        } else if (rawDesc) {
          description = tStats(rawDesc as Parameters<typeof tStats>[0]);
        }
        return {
          key: card.key,
          title: tStats(card.label as Parameters<typeof tStats>[0]),
          value: card.getValue(summary, equipmentStatusStats),
          description,
          icon: card.icon,
          variant: card.variant,
        };
      }),
    [config, summary, equipmentStatusStats, tStats]
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Zone A: 환영 메시지 및 빠른 액션 */}
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <WelcomeHeader />
        <QuickActionButtons />
      </header>

      {/* Zone B: 승인 대기 카드 */}
      <section aria-labelledby="pending-approvals-heading">
        <h2 id="pending-approvals-heading" className="sr-only">
          {t('srOnly.pendingApprovals')}
        </h2>
        <PendingApprovalCard />
      </section>

      {/* Zone C: 통계 카드 */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          {t('srOnly.equipmentStats')}
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <StatsCard
              key={card.key}
              title={card.title}
              value={card.value}
              description={card.description}
              loading={isLoading}
              icon={card.icon}
              variant={card.variant}
            />
          ))}
        </div>
      </section>

      {/* Zone D: 장비 상태 분포 바 (1줄) */}
      <section aria-labelledby="status-bar-heading">
        <h2 id="status-bar-heading" className="sr-only">
          {t('srOnly.statusDistribution')}
        </h2>
        <EquipmentStatusBar data={equipmentStatusStats} loading={isLoading} />
      </section>

      {/* Zone E: AlertPanel + EquipmentStatusBreakdown (항상 노출) */}
      <section aria-labelledby="alert-status-heading">
        <h2 id="alert-status-heading" className="sr-only">
          {t('srOnly.alertsAndStatus')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AlertPanel
            overdueCalibrations={overdueCalibrations}
            overdueCheckouts={overdueCheckouts}
            calibrationLoading={isLoading}
            checkoutsLoading={isLoading}
            alertSections={config.alertSections}
          />
          <EquipmentStatusBreakdown data={equipmentStatusStats} loading={isLoading} />
        </div>
      </section>

      {/* Zone F: 탭 영역 */}
      <section aria-labelledby="dashboard-content-heading">
        <h2 id="dashboard-content-heading" className="sr-only">
          {t('srOnly.dashboardDetail')}
        </h2>
        <ClientOnly
          fallback={
            <div className="space-y-4">
              <Skeleton
                className="h-10 w-full max-w-md"
                style={{ animationDelay: getDashboardStaggerDelay(0, 'list') }}
              />
              <Skeleton
                className="h-64 w-full"
                style={{ animationDelay: getDashboardStaggerDelay(1, 'list') }}
              />
            </div>
          }
        >
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList
              className="w-full justify-start overflow-x-auto"
              aria-label={t('srOnly.dashboardTabs')}
            >
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className={DASHBOARD_FOCUS.default}>
                  {t(`tabs.${tab.value}` as Parameters<typeof t>[0])}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 교정 일정 탭 — 교정 예정만 표시 (지연은 AlertPanel에서) */}
            <TabsContent value="calibration" className="space-y-6">
              <CalibrationList
                title={t('calibrationList.upcomingTitle')}
                description={t('calibrationList.upcomingDesc')}
                data={upcomingCalibrations}
                loading={isLoading}
                type="upcoming"
              />
            </TabsContent>

            {/* 장비 탭 */}
            <TabsContent value="equipment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg tracking-tight">
                    {userRole === 'test_engineer'
                      ? t('equipmentTab.myEquipmentStatus')
                      : t('equipmentTab.equipmentStatus')}
                  </CardTitle>
                  <CardDescription>{t('equipmentTab.teamStatus')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {isLoading ? (
                      Array(4)
                        .fill(0)
                        .map((_, i) => (
                          <div
                            key={`loading-${i}`}
                            className="h-10 bg-muted rounded motion-safe:animate-pulse"
                            style={{ animationDelay: getDashboardStaggerDelay(i, 'grid') }}
                            aria-hidden="true"
                          />
                        ))
                    ) : (
                      <>
                        <Link
                          href={FRONTEND_ROUTES.EQUIPMENT.LIST}
                          className={`w-full flex items-center justify-between p-2.5 bg-card rounded-lg border hover:bg-muted/50 ${DASHBOARD_MOTION.listItem}`}
                        >
                          <span className="font-medium text-sm">
                            {t('equipmentTab.allEquipmentList')}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </Link>
                        {equipmentByTeam?.map((team) => (
                          <Link
                            key={team.id}
                            href={`${FRONTEND_ROUTES.EQUIPMENT.LIST}?teamId=${team.id}`}
                            className={`flex items-center justify-between p-2.5 bg-card rounded-lg border hover:bg-muted/50 ${DASHBOARD_MOTION.listItem}`}
                          >
                            <span className="font-medium text-sm">{team.name}</span>
                            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="bg-muted px-2 py-0.5 rounded tabular-nums">
                                {t('equipmentTab.countUnit', { count: team.count })}
                              </span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </span>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 반출 현황 탭 (시험소장, 시스템 관리자용) */}
            <TabsContent value="checkout" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OverdueCheckoutsList data={overdueCheckouts} loading={isLoading} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg tracking-tight">
                      {t('checkouts.checkoutStatus')}
                    </CardTitle>
                    <CardDescription>{t('checkouts.currentCheckouts')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-6">
                      <p className="text-3xl font-bold text-primary tracking-tight tabular-nums">
                        {summary?.activeCheckouts || 0}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('checkouts.activeCount')}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={FRONTEND_ROUTES.CHECKOUTS.LIST}>
                          {t('checkouts.viewAllCheckouts')}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 최근 활동 탭 */}
            <TabsContent value="activity" className="space-y-6">
              <RecentActivities data={recentActivities} loading={isLoading} />
            </TabsContent>
          </Tabs>
        </ClientOnly>
      </section>
    </div>
  );
}

// React.memo로 불필요한 리렌더 방지
export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
