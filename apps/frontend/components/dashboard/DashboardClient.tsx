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

import { useEffect, useCallback, useMemo, memo, useState } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CalibrationList } from '@/components/dashboard/CalibrationList';
import { OverdueRentalsList } from '@/components/dashboard/OverdueRentalsList';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { QuickActionButtons } from '@/components/dashboard/QuickActionButtons';
import { PendingApprovalCard } from '@/components/dashboard/PendingApprovalCard';
import { TeamEquipmentStats } from '@/components/dashboard/TeamEquipmentStats';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { dashboardApi } from '@/lib/api/dashboard-api';
import type {
  DashboardSummary,
  EquipmentByTeam,
  OverdueCalibration,
  UpcomingCalibration,
  OverdueRental,
  RecentActivity,
} from '@/lib/api/dashboard-api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FiBox,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiAlertTriangle,
  FiTool,
} from 'react-icons/fi';

// 큰 컴포넌트는 dynamic import로 지연 로딩
const EquipmentStatusChart = dynamic(
  () =>
    import('@/components/dashboard/EquipmentStatusChart').then(
      (mod) => mod.EquipmentStatusChart
    ),
  {
    loading: () => <Skeleton className="h-48 w-full" />,
    ssr: false,
  }
);

// 웹소켓 URL
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// 캐시 설정
const GC_TIME = 1000 * 60 * 5; // 5분
const STALE_TIME = 1000 * 30; // 30초

// 역할별 탭 정의
const ROLE_TABS: Record<string, Array<{ value: string; label: string }>> = {
  test_engineer: [
    { value: 'overview', label: '개요' },
    { value: 'equipment', label: '내 장비' },
    { value: 'calibration', label: '교정' },
  ],
  technical_manager: [
    { value: 'overview', label: '개요' },
    { value: 'equipment', label: '팀 장비' },
    { value: 'calibration', label: '교정' },
    { value: 'approvals', label: '승인 관리' },
  ],
  lab_manager: [
    { value: 'overview', label: '개요' },
    { value: 'equipment', label: '장비 현황' },
    { value: 'calibration', label: '교정' },
    { value: 'rental', label: '대여/반출' },
  ],
  system_admin: [
    { value: 'overview', label: '개요' },
    { value: 'equipment', label: '장비 현황' },
    { value: 'calibration', label: '교정' },
    { value: 'rental', label: '대여/반출' },
  ],
};

// 웹소켓 이벤트 타입
interface DashboardUpdateEvent {
  summary: DashboardSummary;
  equipmentByTeam: EquipmentByTeam[];
  overdueCalibrations: OverdueCalibration[];
  upcomingCalibrations: UpcomingCalibration[];
  overdueRentals: OverdueRental[];
  recentActivities: RecentActivity[];
  equipmentStatusStats: Record<string, number>;
}

// Props 타입
export interface DashboardClientProps {
  initialSummary?: DashboardSummary;
  initialEquipmentByTeam?: EquipmentByTeam[];
  initialOverdueCalibrations?: OverdueCalibration[];
  initialUpcomingCalibrations?: UpcomingCalibration[];
  initialOverdueRentals?: OverdueRental[];
  initialRecentActivities?: RecentActivity[];
  initialEquipmentStatusStats?: Record<string, number>;
}

/**
 * 대시보드 클라이언트 컴포넌트
 */
function DashboardClientComponent({
  initialSummary,
  initialEquipmentByTeam,
  initialOverdueCalibrations,
  initialUpcomingCalibrations,
  initialOverdueRentals,
  initialRecentActivities,
  initialEquipmentStatusStats,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updateCount, setUpdateCount] = useState(0);

  const userRole = session?.user?.role?.toLowerCase() || 'test_engineer';

  // React Query - 초기 데이터가 있으면 사용, 없으면 클라이언트에서 fetch
  const {
    data: summary = initialSummary || {
      totalEquipment: 0,
      availableEquipment: 0,
      activeRentals: 0,
      activeCheckouts: 0,
      upcomingCalibrations: 0,
    },
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ['dashboard-summary', userRole],
    queryFn: () => dashboardApi.getSummary(),
    initialData: initialSummary,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: equipmentByTeam = initialEquipmentByTeam || [], isLoading: teamLoading } =
    useQuery({
      queryKey: ['equipment-by-team', userRole],
      queryFn: () => dashboardApi.getEquipmentByTeam(),
      initialData: initialEquipmentByTeam,
      gcTime: GC_TIME,
      staleTime: STALE_TIME,
    });

  const {
    data: overdueCalibrations = initialOverdueCalibrations || [],
    isLoading: calibrationLoading,
  } = useQuery({
    queryKey: ['overdue-calibrations', userRole],
    queryFn: () => dashboardApi.getOverdueCalibrations(),
    initialData: initialOverdueCalibrations,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const {
    data: upcomingCalibrations = initialUpcomingCalibrations || [],
    isLoading: upcomingLoading,
  } = useQuery({
    queryKey: ['upcoming-calibrations', userRole],
    queryFn: () => dashboardApi.getUpcomingCalibrations(30),
    initialData: initialUpcomingCalibrations,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: overdueRentals = initialOverdueRentals || [], isLoading: rentalLoading } =
    useQuery({
      queryKey: ['overdue-rentals', userRole],
      queryFn: () => dashboardApi.getOverdueRentals(),
      initialData: initialOverdueRentals,
      gcTime: GC_TIME,
      staleTime: STALE_TIME,
    });

  const {
    data: recentActivities = initialRecentActivities || [],
    isLoading: activitiesLoading,
  } = useQuery({
    queryKey: ['recent-activities', userRole],
    queryFn: () => dashboardApi.getRecentActivitiesByRole(userRole),
    initialData: initialRecentActivities,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const {
    data: equipmentStatusStats = initialEquipmentStatusStats || {},
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['equipment-status-stats', userRole],
    queryFn: () => dashboardApi.getEquipmentStatusStats(),
    initialData: initialEquipmentStatusStats,
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  // 웹소켓 업데이트 핸들러
  const handleDashboardUpdate = useCallback(
    (data: DashboardUpdateEvent) => {
      queryClient.setQueryData(['dashboard-summary', userRole], data.summary);
      queryClient.setQueryData(['equipment-by-team', userRole], data.equipmentByTeam);
      queryClient.setQueryData(
        ['overdue-calibrations', userRole],
        data.overdueCalibrations
      );
      queryClient.setQueryData(
        ['upcoming-calibrations', userRole],
        data.upcomingCalibrations
      );
      queryClient.setQueryData(['overdue-rentals', userRole], data.overdueRentals);
      queryClient.setQueryData(['recent-activities', userRole], data.recentActivities);
      queryClient.setQueryData(
        ['equipment-status-stats', userRole],
        data.equipmentStatusStats
      );

      setUpdateCount((prev) => prev + 1);

      toast({
        title: '대시보드 업데이트',
        description: '대시보드 데이터가 업데이트되었습니다.',
        duration: 3000,
      });
    },
    [queryClient, toast, userRole]
  );

  // 웹소켓 연결 (선택적)
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET ||
      process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'true'
    ) {
      return;
    }

    import('socket.io-client')
      .then(({ io }) => {
        const socket = io(SOCKET_URL, {
          transports: ['websocket'],
          autoConnect: true,
        });

        socket.on('connect', () => {
          console.log('WebSocket connected');
        });

        socket.on('dashboard-update', handleDashboardUpdate);

        return () => {
          socket.disconnect();
        };
      })
      .catch((error) => {
        console.warn('WebSocket 연결 실패 (선택적 기능):', error);
      });
  }, [handleDashboardUpdate]);

  // 역할별 탭
  const tabs = ROLE_TABS[userRole] || ROLE_TABS['test_engineer'];

  // 역할별 통계 카드
  const statsCards = useMemo(() => {
    const baseCards = [
      {
        key: 'total',
        title: userRole === 'test_engineer' ? '내 장비' : '전체 장비',
        value: summary?.totalEquipment || 0,
        icon: FiBox,
        variant: undefined,
      },
      {
        key: 'available',
        title: '사용 가능',
        value: summary?.availableEquipment || 0,
        icon: FiCheckCircle,
        variant: 'success' as const,
      },
    ];

    if (['technical_manager', 'lab_manager', 'system_admin'].includes(userRole)) {
      return [
        ...baseCards,
        {
          key: 'calibration',
          title: '교정 예정',
          value: summary?.upcomingCalibrations || 0,
          icon: FiAlertCircle,
          variant: 'warning' as const,
        },
        {
          key: 'rentals',
          title: '대여 중',
          value: summary?.activeRentals || 0,
          icon: FiClock,
          variant: 'primary' as const,
        },
      ];
    }

    return [
      ...baseCards,
      {
        key: 'calibration',
        title: '교정 예정',
        value: summary?.upcomingCalibrations || 0,
        icon: FiAlertTriangle,
        variant: 'warning' as const,
      },
      {
        key: 'checkout',
        title: '반출 중',
        value: summary?.activeCheckouts || 0,
        icon: FiTool,
        variant: 'primary' as const,
      },
    ];
  }, [summary, userRole]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 실시간 업데이트 알림 (스크린 리더용) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {updateCount > 0 && `대시보드가 ${updateCount}회 업데이트되었습니다.`}
      </div>

      {/* 상단: 환영 메시지 및 빠른 액션 */}
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <WelcomeHeader />
        <QuickActionButtons />
      </header>

      {/* 승인 대기 카드 */}
      <section aria-labelledby="pending-approvals-heading">
        <h2 id="pending-approvals-heading" className="sr-only">
          승인 대기 현황
        </h2>
        <PendingApprovalCard />
      </section>

      {/* 통계 카드 */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          장비 현황 통계
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <StatsCard
              key={card.key}
              title={card.title}
              value={card.value}
              loading={summaryLoading}
              icon={card.icon}
              variant={card.variant}
            />
          ))}
        </div>
      </section>

      {/* 탭 영역 */}
      <section aria-labelledby="dashboard-content-heading">
        <h2 id="dashboard-content-heading" className="sr-only">
          대시보드 상세 정보
        </h2>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList
            className="w-full justify-start overflow-x-auto"
            aria-label="대시보드 탭"
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <EquipmentStatusChart
                data={equipmentStatusStats || {}}
                loading={statsLoading}
              />
              <CalibrationList
                title="교정 예정 장비"
                description="다음 30일 이내 교정 예정인 장비"
                data={upcomingCalibrations}
                loading={upcomingLoading}
                type="upcoming"
              />
              <OverdueRentalsList data={overdueRentals} loading={rentalLoading} />
            </div>

            <RecentActivities data={recentActivities} loading={activitiesLoading} />
          </TabsContent>

          {/* 장비 탭 */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {userRole === 'test_engineer' ? '내 장비 현황' : '장비 현황'}
                </CardTitle>
                <CardDescription>
                  {userRole === 'test_engineer'
                    ? '본인이 관리하는 장비의 상태별 통계'
                    : '장비 상태별 통계 및 팀별 현황'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <EquipmentStatusChart
                      data={equipmentStatusStats || {}}
                      loading={statsLoading}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">
                      {userRole === 'test_engineer' ? '팀 장비 현황' : '팀별 장비 현황'}
                    </h3>
                    <div className="space-y-2">
                      {teamLoading
                        ? Array(4)
                            .fill(0)
                            .map((_, i) => (
                              <div
                                key={`loading-${i}`}
                                className="h-10 bg-muted rounded animate-pulse"
                                aria-hidden="true"
                              />
                            ))
                        : equipmentByTeam?.map((team) => (
                            <TeamEquipmentStats key={team.id} team={team} />
                          ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 교정 탭 */}
          <TabsContent value="calibration" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CalibrationList
                title="교정 예정 장비"
                description="다음 30일 이내 교정 예정"
                data={upcomingCalibrations}
                loading={upcomingLoading}
                type="upcoming"
              />
              <CalibrationList
                title="교정 지연 장비"
                description="교정 기한이 지난 장비"
                data={overdueCalibrations}
                loading={calibrationLoading}
                type="overdue"
              />
            </div>
          </TabsContent>

          {/* 대여/반출 탭 (관리자용) */}
          <TabsContent value="rental" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OverdueRentalsList data={overdueRentals} loading={rentalLoading} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">반출 현황</CardTitle>
                  <CardDescription>현재 반출 중인 장비</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-3xl font-bold text-primary">
                      {summary?.activeCheckouts || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">건 반출 중</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 승인 관리 탭 (기술책임자용) */}
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">승인 대기 항목</CardTitle>
                <CardDescription>
                  팀 내 승인이 필요한 항목들입니다. 클릭하여 상세 페이지로 이동합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PendingApprovalCard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

// React.memo로 불필요한 리렌더 방지
export const DashboardClient = memo(DashboardClientComponent);
export default DashboardClient;
