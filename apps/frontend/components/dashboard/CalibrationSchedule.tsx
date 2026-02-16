'use client';

import { CalendarIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dashboardApi from '@/lib/api/dashboard-api';
import type { UpcomingCalibration } from '@/lib/api/dashboard-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  DASHBOARD_MOTION,
  getCalibrationStatusClasses,
  getDashboardStaggerDelay,
} from '@/lib/design-tokens';

interface CalibrationItem {
  id: string;
  equipmentName: string;
  managementNumber: string;
  calibrationDueDate: string;
  calibrationDueDateIso: string;
  daysRemaining: number;
  status: 'upcoming' | 'urgent' | 'overdue';
}

interface CalibrationScheduleProps {
  days?: number;
}

export default function CalibrationSchedule({ days = 30 }: CalibrationScheduleProps) {
  // TanStack Query로 서버 상태 관리
  const {
    data: calibrationData = [],
    isLoading: loading,
    isError,
    refetch,
  } = useQuery<UpcomingCalibration[]>({
    queryKey: queryKeys.dashboard.upcomingCalibrations(),
    queryFn: () => dashboardApi.getCalibrationSchedule(),
    ...QUERY_CONFIG.DASHBOARD,
  });

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center p-3 rounded-md border border-border"
            style={{ animationDelay: getDashboardStaggerDelay(index, 'list') }}
          >
            <Skeleton className="w-2 min-h-[2.5rem] rounded-full mr-4" />
            <div className="flex-1">
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 에러 상태 표시
  if (isError) {
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

  // API 응답 데이터를 컴포넌트 형식에 맞게 변환
  const calibrationItems: CalibrationItem[] = calibrationData.map((item) => ({
    id: item.equipmentId,
    equipmentName: item.equipmentName,
    managementNumber: item.equipmentId || '-',
    calibrationDueDate: new Date(item.dueDate).toLocaleDateString('ko-KR'),
    calibrationDueDateIso: item.dueDate,
    daysRemaining: item.daysUntilDue,
    status: item.daysUntilDue > 7 ? 'upcoming' : item.daysUntilDue > 0 ? 'urgent' : 'overdue',
  }));

  // 데이터가 없는 경우
  if (calibrationItems.length === 0) {
    return (
      <div className="p-4 text-center py-12">
        <div className="inline-block motion-safe:animate-gentle-bounce">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">
          교정 일정 없음
        </h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          30일 이내 예정된 교정 일정이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calibrationItems.map((item, index) => (
        <div
          key={item.id}
          className={`flex items-center p-3 rounded-md border border-border hover:bg-muted/50 ${DASHBOARD_MOTION.listItem} motion-reduce:transition-none`}
          style={{ animationDelay: getDashboardStaggerDelay(index, 'list') }}
        >
          <div
            className={`w-2 h-full min-h-[2.5rem] rounded-full mr-4 ${getCalibrationStatusClasses(item.status).indicator}`}
            aria-hidden="true"
          />

          <div className="flex-1">
            <h4 className="font-medium text-foreground tracking-tight">{item.equipmentName}</h4>
            <p className="text-sm text-muted-foreground">{item.managementNumber}</p>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center text-sm text-foreground">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
              <time dateTime={item.calibrationDueDateIso}>{item.calibrationDueDate}</time>
            </div>
            <span
              className={`text-xs font-medium mt-1 tabular-nums ${getCalibrationStatusClasses(item.status).text}`}
            >
              {item.daysRemaining > 0
                ? `${item.daysRemaining}일 남음`
                : `${Math.abs(item.daysRemaining)}일 지남`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
