'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { IconType } from 'react-icons';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  loading?: boolean;
  icon?: IconType;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  description,
  loading = false,
  icon: Icon,
  variant = 'default',
}: StatsCardProps) {
  // variant에 따른 색상 스타일 지정 - UL Solutions 색상 시스템
  const variantClasses = useMemo(() => {
    switch (variant) {
      case 'success':
        // UL Bright Green (#00A451)
        return 'bg-ul-green/10 text-ul-green border-ul-green/20 dark:bg-ul-green/20 dark:text-ul-green dark:border-ul-green/30';
      case 'warning':
        // UL Orange (#FF9D55)
        return 'bg-ul-orange/10 text-ul-orange border-ul-orange/20 dark:bg-ul-orange/20 dark:text-ul-orange dark:border-ul-orange/30';
      case 'danger':
        // UL Bright Red (#CA0123)
        return 'bg-ul-red/10 text-ul-red border-ul-red/20 dark:bg-ul-red/20 dark:text-ul-red dark:border-ul-red/30';
      case 'primary':
        // UL Midnight Blue (#122C49)
        return 'bg-ul-midnight/10 text-ul-midnight border-ul-midnight/20 dark:bg-ul-info/20 dark:text-ul-info dark:border-ul-info/30';
      default:
        return 'bg-card text-card-foreground border-border';
    }
  }, [variant]);

  // 아이콘 색상 스타일 지정 - UL Solutions 색상 시스템
  const iconClasses = useMemo(() => {
    switch (variant) {
      case 'success':
        return 'bg-ul-green/20 text-ul-green dark:bg-ul-green/30 dark:text-ul-green';
      case 'warning':
        return 'bg-ul-orange/20 text-ul-orange dark:bg-ul-orange/30 dark:text-ul-orange';
      case 'danger':
        return 'bg-ul-red/20 text-ul-red dark:bg-ul-red/30 dark:text-ul-red';
      case 'primary':
        return 'bg-ul-midnight/20 text-ul-midnight dark:bg-ul-info/30 dark:text-ul-info';
      default:
        return 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground';
    }
  }, [variant]);

  return (
    <Card
      className={`${variantClasses} border transition-all duration-300 hover:shadow-md dark:hover:shadow-lg dark:shadow-gray-900/10 hover:translate-y-[-2px]`}
      hoverable
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium leading-none">{title}</h3>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1 transition-colors" data-testid="stats-value">
                {value.toLocaleString()}
              </p>
            )}
            {description && <CardDescription className="mt-2">{description}</CardDescription>}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${iconClasses} transition-all duration-300`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
