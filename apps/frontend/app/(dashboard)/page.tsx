'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaWarehouse, FaExchangeAlt, FaTools } from 'react-icons/fa';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EquipmentStatusChart } from '@/components/dashboard/EquipmentStatusChart';
import { CalibrationList } from '@/components/dashboard/CalibrationList';
import { OverdueRentalsList } from '@/components/dashboard/OverdueRentalsList';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// 웹소켓은 선택적 기능으로 처리 (환경 변수로 활성화)
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
import { FiBox, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';

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

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('all');

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
    queryKey: ['dashboard-summary'],
    queryFn: () =>
      Promise.resolve({
        totalEquipment: 100,
        availableEquipment: 80,
        activeRentals: 15,
        activeCheckouts: 5,
        upcomingCalibrations: 5,
      }),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: equipmentByTeam = [], isLoading: teamLoading } = useQuery({
    queryKey: ['equipment-by-team'],
    queryFn: () => dashboardApi.getEquipmentByTeam(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: overdueCalibrations = [], isLoading: calibrationLoading } = useQuery({
    queryKey: ['overdue-calibrations'],
    queryFn: () => dashboardApi.getOverdueCalibrations(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: upcomingCalibrations = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ['upcoming-calibrations'],
    queryFn: () => dashboardApi.getUpcomingCalibrations(30),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: overdueRentals = [], isLoading: rentalLoading } = useQuery({
    queryKey: ['overdue-rentals'],
    queryFn: () => dashboardApi.getOverdueRentals(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: recentActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: () => dashboardApi.getRecentActivities(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  const { data: equipmentStatusStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['equipment-status-stats'],
    queryFn: () => dashboardApi.getEquipmentStatusStats(),
    gcTime: GC_TIME,
    staleTime: STALE_TIME,
  });

  // 웹소켓 업데이트 핸들러
  const handleDashboardUpdate = useCallback(
    (data: DashboardUpdateEvent) => {
      // 캐시된 데이터 업데이트
      queryClient.setQueryData(['dashboard-summary'], data.summary);
      queryClient.setQueryData(['equipment-by-team'], data.equipmentByTeam);
      queryClient.setQueryData(['overdue-calibrations'], data.overdueCalibrations);
      queryClient.setQueryData(['upcoming-calibrations'], data.upcomingCalibrations);
      queryClient.setQueryData(['overdue-rentals'], data.overdueRentals);
      queryClient.setQueryData(['recent-activities'], data.recentActivities);
      queryClient.setQueryData(['equipment-status-stats'], data.equipmentStatusStats);

      // 토스트 알림 표시
      toast({
        title: '대시보드 업데이트',
        description: '대시보드 데이터가 업데이트되었습니다.',
        duration: 3000,
      });
    },
    [queryClient, toast]
  );

  // 웹소켓 연결 설정 (선택적 기능)
  // 웹소켓이 활성화된 경우에만 연결
  useEffect(() => {
    // 웹소켓이 비활성화된 경우 조기 반환
    if (
      !process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET ||
      process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET !== 'true'
    ) {
      return;
    }

    // 동적 import로 웹소켓 로드 (필요한 경우에만)
    import('socket.io-client')
      .then(({ io }) => {
        const socket = io(SOCKET_URL, {
          transports: ['websocket'],
          autoConnect: true,
        });

        socket.on('connect', () => {
          console.log('WebSocket connected');
          toast({
            title: '실시간 연결 완료',
            description: '대시보드 데이터가 실시간으로 업데이트됩니다.',
            duration: 3000,
          });
        });

        socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          toast({
            title: '연결 끊김',
            description: '실시간 업데이트가 중단되었습니다. 재연결을 시도합니다.',
            variant: 'destructive',
            duration: 3000,
          });
        });

        // 실시간 데이터 업데이트 이벤트 핸들러
        socket.on('dashboard-update', handleDashboardUpdate);

        return () => {
          socket.disconnect();
        };
      })
      .catch((error) => {
        console.warn('WebSocket 연결 실패 (선택적 기능):', error);
        // 웹소켓 연결 실패는 치명적이지 않으므로 조용히 처리
      });
  }, [toast, handleDashboardUpdate]);

  // 탭 변경 핸들러 최적화
  const handleTabChange = useCallback((value: string) => {
    setActiveView(value);
  }, []);

  // 로딩 상태 계산 - useMemo로 최적화
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
        <p className="text-muted-foreground">장비 관리 시스템의 주요 정보를 확인할 수 있습니다.</p>
      </div>

      <Tabs defaultValue="all" value={activeView} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="equipment">장비</TabsTrigger>
          <TabsTrigger value="calibration">교정</TabsTrigger>
          <TabsTrigger value="rental">대여</TabsTrigger>
          <TabsTrigger value="checkout">반출</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="전체 장비"
              value={summary?.totalEquipment || 0}
              loading={summaryLoading}
              icon={FiBox}
            />
            <StatsCard
              title="사용 가능 장비"
              value={summary?.availableEquipment || 0}
              loading={summaryLoading}
              icon={FiCheckCircle}
              variant="success"
            />
            <StatsCard
              title="교정 예정"
              value={summary?.upcomingCalibrations || 0}
              loading={summaryLoading}
              icon={FiAlertCircle}
              variant="warning"
            />
            <StatsCard
              title="대여 중"
              value={summary?.activeRentals || 0}
              loading={summaryLoading}
              icon={FiClock}
              variant="primary"
            />
          </div>

          {/* 차트 및 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EquipmentStatusChart data={equipmentStatusStats || {}} loading={statsLoading} />
            <CalibrationList
              title="교정 예정 장비"
              description="다음 30일 이내 교정 예정인 장비 목록입니다"
              data={upcomingCalibrations}
              loading={upcomingLoading}
              type="upcoming"
            />
            <OverdueRentalsList data={overdueRentals} loading={rentalLoading} />
          </div>

          {/* 최근 활동 */}
          <RecentActivities data={recentActivities} loading={activitiesLoading} />
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <h3
                className="text-lg font-semibold leading-none tracking-tight"
                role="heading"
                aria-label="장비 현황"
              >
                장비 현황
              </h3>
              <CardDescription>장비 상태별 통계 및 현황을 확인합니다</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <div className="min-h-[300px]">
                    <EquipmentStatusChart
                      data={equipmentStatusStats || {}}
                      loading={statsLoading}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2" data-testid="equipment-tab-title">
                    팀별 장비 현황
                  </h3>
                  <div className="space-y-2">
                    {teamLoading
                      ? Array(4)
                          .fill(0)
                          .map((_, i) => (
                            <div
                              key={`loading-${i}`}
                              className="h-8 bg-muted rounded animate-pulse"
                            />
                          ))
                      : equipmentByTeam?.map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between p-2 bg-card rounded border"
                          >
                            <span>{team.name}</span>
                            <span className="text-sm text-muted-foreground">{team.count}</span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calibration" className="space-y-6">
          <div>
            <h3 className="font-medium mb-2" data-testid="calibration-tab-title">
              교정 예정 장비
            </h3>
            <div className="space-y-2">
              {calibrationLoading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`loading-${i}`} className="h-8 bg-muted rounded animate-pulse" />
                    ))
                : overdueCalibrations?.map((calibration) => (
                    <div
                      key={calibration.id}
                      className="flex items-center justify-between p-2 bg-card rounded border"
                    >
                      <span>{calibration.name}</span>
                      <span className="text-sm text-muted-foreground">{calibration.dueDate}</span>
                    </div>
                  ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rental" className="space-y-6">
          <div>
            <h3 className="font-medium mb-2" data-testid="rental-tab-title">
              대여 중인 장비
            </h3>
            <div className="space-y-2">
              {rentalLoading
                ? Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <div key={`loading-${i}`} className="h-8 bg-muted rounded animate-pulse" />
                    ))
                : overdueRentals?.map((rental) => (
                    <div
                      key={rental.id}
                      className="flex items-center justify-between p-2 bg-card rounded border"
                    >
                      <span>{rental.equipment?.name || '알 수 없음'}</span>
                      <span className="text-sm text-muted-foreground">
                        {rental.expectedReturnDate
                          ? new Date(rental.expectedReturnDate).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  ))}
            </div>
          </div>
        </TabsContent>

        {/* 다른 탭 내용 (교정, 대여, 반출)은 추후 필요에 따라 구현 */}
      </Tabs>
    </div>
  );
}
