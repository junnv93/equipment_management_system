'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OverdueCalibration, UpcomingCalibration } from '@/lib/api/dashboard-api';
import { formatDateTime } from '@/lib/utils/date';
import { CalendarClock, AlertTriangle, AlertCircle, Calendar, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_SIZES, DASHBOARD_FOCUS, getDashboardStaggerDelay } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

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
  const t = useTranslations('dashboard.calibrationList');

  const getStatusInfo = (item: OverdueCalibration | UpcomingCalibration) => {
    if (type === 'overdue') {
      const overdueItem = item as OverdueCalibration;
      return {
        label: t('daysOverdue', { days: overdueItem.daysOverdue ?? 0 }),
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-3 w-3 mr-1" />,
      };
    } else {
      const upcomingItem = item as UpcomingCalibration;
      if (upcomingItem.daysUntilDue <= 7) {
        return {
          label: t('daysRemaining', { days: upcomingItem.daysUntilDue }),
          variant: 'destructive' as const,
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
        };
      } else if (upcomingItem.daysUntilDue <= 15) {
        return {
          label: t('daysRemaining', { days: upcomingItem.daysUntilDue }),
          variant: 'warning' as const,
          icon: <Calendar className="h-3 w-3 mr-1" />,
        };
      } else {
        return {
          label: t('daysRemaining', { days: upcomingItem.daysUntilDue }),
          variant: 'secondary' as const,
          icon: <Calendar className="h-3 w-3 mr-1" />,
        };
      }
    }
  };

  const handleViewCalibration = (id: string) => {
    router.push(FRONTEND_ROUTES.CALIBRATION.DETAIL(id));
  };

  const handleViewAll = () => {
    router.push(`${FRONTEND_ROUTES.CALIBRATION.LIST}?tab=${type}`);
  };

  const EmptyIcon = type === 'upcoming' ? CalendarClock : AlertTriangle;
  const emptyTitle = type === 'upcoming' ? t('noUpcoming') : t('noOverdue');
  const emptyDescription = type === 'upcoming' ? t('noUpcomingDesc') : t('noOverdueDesc');

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
                <div
                  key={i}
                  className="flex flex-col gap-2"
                  style={{ animationDelay: getDashboardStaggerDelay(i, 'list') }}
                >
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="inline-block motion-safe:animate-gentle-bounce">
              <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                <EmptyIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
            </div>
            <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">
              {emptyTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{emptyDescription}</p>
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
                      aria-label={t('viewDetail', { name: item.equipmentName ?? '' })}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {data.length > 3 && (
              <Button variant="link" size="sm" className="w-full mt-2" onClick={handleViewAll}>
                {type === 'overdue'
                  ? t('viewAllOverdue', { count: data.length })
                  : t('viewAllUpcoming', { count: data.length })}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
