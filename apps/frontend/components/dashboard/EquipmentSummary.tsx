'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, Wrench, AlertTriangle, Truck, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import dashboardApi from '@/lib/api/dashboard-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

// DashboardSummary를 확장한 로컬 타입
// 대여(loaned)는 반출(checkout)로 통합됨
type EquipmentSummaryType = {
  total: number;
  available: number;
  checkout: number;
  calibrationDue: number;
  calibrationOverdue: number;
};

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

function StatsCard({ title, value, icon, description, change }: StatsCardProps) {
  return (
    <Card hoverable>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <div className="h-4 w-4 text-muted-foreground" aria-hidden="true">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight tabular-nums">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
        {change && (
          <div className="flex items-center pt-1">
            <span
              className={`text-xs tabular-nums ${
                change.type === 'increase'
                  ? 'text-ul-green dark:text-ul-green'
                  : 'text-ul-red dark:text-red-400'
              }`}
            >
              {change.type === 'increase' ? '+' : '-'}
              {change.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">전월 대비</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 장비 요약 통계 컴포넌트
 *
 * React Query로 단일 상태 관리 (기존 3개 useState → 1개 useQuery)
 * 자동 캐싱, 재시도, 백그라운드 리페치 지원
 */
export default function EquipmentSummary() {
  // React Query로 상태 통합
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.equipmentSummary(),
    queryFn: () => dashboardApi.getEquipmentSummary(),
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.LONG,
    retry: 2,
  });

  // DashboardSummary를 EquipmentSummaryType으로 변환 (memoized)
  const displayStats = useMemo<EquipmentSummaryType>(() => {
    if (!data) {
      return {
        total: 0,
        available: 0,
        checkout: 0,
        calibrationDue: 0,
        calibrationOverdue: 0,
      };
    }
    return {
      total: data.totalEquipment,
      available: data.availableEquipment,
      checkout: data.activeCheckouts,
      calibrationDue: data.upcomingCalibrations,
      calibrationOverdue: 0, // 별도 API 필요
    };
  }, [data]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20 dark:bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <span>데이터를 불러올 수 없습니다.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            재시도
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatsCard
        title="전체 장비"
        value={displayStats.total}
        icon={<Wrench className="h-4 w-4" />}
        description="등록된 총 장비 수"
      />
      <StatsCard
        title="사용 가능"
        value={displayStats.available}
        icon={<CheckCircle2 className="h-4 w-4" />}
        description="현재 사용 가능한 장비"
      />
      <StatsCard
        title="반출 중"
        value={displayStats.checkout}
        icon={<Truck className="h-4 w-4" />}
        description="현재 반출 중인 장비 (교정/수리/대여 포함)"
      />
      <StatsCard
        title="교정 예정"
        value={displayStats.calibrationDue}
        icon={<Clock className="h-4 w-4" />}
        description="30일 이내 교정 예정 장비"
      />
      <StatsCard
        title="교정 기한 초과"
        value={displayStats.calibrationOverdue}
        icon={<AlertTriangle className="h-4 w-4" />}
        description="교정 기한이 지난 장비"
      />
    </div>
  );
}
