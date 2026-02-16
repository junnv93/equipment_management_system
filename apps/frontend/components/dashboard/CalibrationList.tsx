'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OverdueCalibration, UpcomingCalibration } from '@/lib/api/dashboard-api';
import { formatDateTime } from '@/lib/utils/date';
import { CalendarClock, AlertTriangle, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_SIZES, DASHBOARD_FOCUS } from '@/lib/design-tokens';

interface CalibrationListProps {
  data: (OverdueCalibration | UpcomingCalibration)[];
  loading?: boolean;
  title: string;
  description: string;
  type: 'upcoming' | 'overdue';
}

export function CalibrationList({
  data,
  loading = false,
  title,
  description,
  type,
}: CalibrationListProps) {
  const router = useRouter();

  const getStatusInfo = (item: OverdueCalibration | UpcomingCalibration) => {
    if (type === 'overdue') {
      const overdueItem = item as OverdueCalibration;
      return {
        label: `${overdueItem.daysOverdue}일 초과`,
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      };
    } else {
      const upcomingItem = item as UpcomingCalibration;
      if (upcomingItem.daysUntilDue <= 7) {
        return {
          label: `${upcomingItem.daysUntilDue}일 남음`,
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
        };
      } else if (upcomingItem.daysUntilDue <= 15) {
        return {
          label: `${upcomingItem.daysUntilDue}일 남음`,
          variant: 'warning' as const,
          icon: <Calendar className="h-3 w-3 mr-1" />,
        };
      } else {
        return {
          label: `${upcomingItem.daysUntilDue}일 남음`,
          variant: 'secondary' as const,
          icon: <Calendar className="h-3 w-3 mr-1" />,
        };
      }
    }
  };

  const handleViewCalibration = (id: string) => {
    router.push(`/calibration/${id}`);
  };

  const handleViewAll = () => {
    router.push(`/calibration?tab=${type}`);
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {type === 'upcoming' ? (
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            )}
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant={type === 'upcoming' ? 'outline' : 'destructive'} className="rounded-full">
            {data.length}
          </Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {type === 'upcoming' ? '예정된 교정이 없습니다' : '기한이 초과된 교정이 없습니다'}
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 3).map((item) => {
              const statusInfo = getStatusInfo(item);

              return (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-1">{item.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.dueDate)}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge
                      variant={statusInfo.variant === 'warning' ? 'outline' : statusInfo.variant}
                      className="text-xs flex items-center"
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${DASHBOARD_SIZES.minTouchTarget} ml-1 ${DASHBOARD_FOCUS.default}`}
                      onClick={() => handleViewCalibration(item.id)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {data.length > 3 && (
              <Button variant="link" size="sm" className="w-full mt-2" onClick={handleViewAll}>
                모든 {type === 'overdue' ? '기한 초과' : '예정'} 교정 보기 ({data.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
