'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EquipmentStatusChart } from '@/components/dashboard/EquipmentStatusChart';
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
import {
  FiBox,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiAlertTriangle,
  FiTool,
} from 'react-icons/fi';

// 웹소켓 연결 설정
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// 웹소켓 이벤트 데이터 타입 정의
interface DashboardUpdateEvent {
  summary: DashboardSummary;
  equipmentByTeam: EquipmentByTeam[];
  overdueCalibrations: OverdueCalibration[];
  upcomingCalibrations: UpcomingCalibration[];
  overdueRentals: OverdueRental[];
  recentActivities: RecentActivity[];
  equipmentStatusStats: Record<string, number>;
}

// 캐시 설정
const GC_TIME = 1000 * 60 * 5; // 5분
const STALE_TIME = 1000 * 30; // 30초

// 역할별 표시 탭 정의
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const userRole = session?.user?.role?.toLowerCase() || 'test_engineer';

  // React Query를 사용한 데이터 페칭
  const {
    data: summary = {
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
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: equipmentByTeam = [], isLoading: teamLoading } = useQuery({
    queryKey: ['equipment-by-team', userRole],
    queryFn: () => dashboardApi.getEquipmentByTeam(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: overdueCalibrations = [], isLoading: calibrationLoading } = useQuery({
    queryKey: ['overdue-calibrations', userRole],
    queryFn: () => dashboardApi.getOverdueCalibrations(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: upcomingCalibrations = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-calibrations', userRole],
    queryFn: () => dashboardApi.getUpcomingCalibrations(30),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: overdueRentals = [], isLoading: rentalLoading } = useQuery({
    queryKey: ['overdue-rentals', userRole],
    queryFn: () => dashboardApi.getOverdueRentals(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities', userRole],
    queryFn: () => dashboardApi.getRecentActivitiesByRole(userRole),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: equipmentStatusStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['equipment-status-stats', userRole],
    queryFn: () => dashboardApi.getEquipmentStatusStats(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  // 웹소켓 업데이트 핸들러
  const handleDashboardUpdate = useCallback(
    (data: DashboardUpdateEvent) => {
      queryClient.setQueryData(['dashboard-summary', userRole], data.summary);
      queryClient.setQueryData(['equipment-by-team', userRole], data.equipmentByTeam);
      queryClient.setQueryData(['overdue-calibrations', userRole], data.overdueCalibrations);
      queryClient.setQueryData(['upcoming-calibrations', userRole], data.upcomingCalibrations);
      queryClient.setQueryData(['overdue-rentals', userRole], data.overdueRentals);
      queryClient.setQueryData(['recent-activities', userRole], data.recentActivities);
      queryClient.setQueryData(['equipment-status-stats', userRole], data.equipmentStatusStats);

      toast({
        title: '대시보드 업데이트',
        description: '대시보드 데이터가 업데이트되었습니다.',
        duration: 3000,
      });
    },
    [queryClient, toast, userRole]
  );

  // 웹소켓 연결 설정 (선택적 기능)
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

  // 로딩 상태 계산
  const isLoading = useMemo(
    () =>
      summaryLoading ||
      teamLoading ||
      calibrationLoading ||
      upcomingLoading ||
      rentalLoading ||
      activitiesLoading ||
      statsLoading,
    [
      summaryLoading,
      teamLoading,
      calibrationLoading,
      upcomingLoading,
      rentalLoading,
      activitiesLoading,
      statsLoading,
    ]
  );

  // 역할별 탭 가져오기
  const tabs = ROLE_TABS[userRole] || ROLE_TABS['test_engineer'];

  // 역할별 통계 카드 구성
  const getStatsCards = () => {
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

    // 역할별 추가 카드
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

    // 시험실무자
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
  };

  const statsCards = getStatsCards();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 상단: 환영 메시지 및 빠른 액션 */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <WelcomeHeader />
        <QuickActionButtons />
      </div>

      {/* 승인 대기 카드 */}
      <PendingApprovalCard />

      {/* 통계 카드 */}
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

      {/* 탭 영역 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <EquipmentStatusChart data={equipmentStatusStats || {}} loading={statsLoading} />
            <CalibrationList
              title="교정 예정 장비"
              description="다음 30일 이내 교정 예정인 장비"
              data={upcomingCalibrations}
              loading={upcomingLoading}
              type="upcoming"
            />
            <OverdueRentalsList data={overdueRentals} loading={rentalLoading} />
          </div>

          {/* 최근 활동 */}
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
                  <EquipmentStatusChart data={equipmentStatusStats || {}} loading={statsLoading} />
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
                            />
                          ))
                      : equipmentByTeam?.map((team) => (
                          <TeamEquipmentStats
                            key={team.id}
                            team={team}
                          />
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
    </div>
  );
}
