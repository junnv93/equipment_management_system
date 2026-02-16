'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getStatsCardClasses,
  getStatsIconClasses,
  DASHBOARD_MOTION,
  DASHBOARD_SIZES,
  type StatsVariant,
} from '@/lib/design-tokens';

interface StatsCardProps {
  title: string;
  value: number;
  description?: string;
  loading?: boolean;
  icon?: LucideIcon;
  variant?: StatsVariant;
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  description,
  loading = false,
  icon: Icon,
  variant = 'default',
}: StatsCardProps) {
  return (
    <Card
      className={`${getStatsCardClasses(variant)} border ${DASHBOARD_MOTION.statsCard} motion-reduce:transition-none hover:shadow-md dark:hover:shadow-lg dark:shadow-gray-900/10 hover:translate-y-[-2px]`}
      hoverable
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium leading-none tracking-tight">{title}</h3>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p
                className="text-2xl font-bold mt-1 tracking-tight tabular-nums"
                data-testid="stats-value"
              >
                {value.toLocaleString()}
              </p>
            )}
            {description && <CardDescription className="mt-2">{description}</CardDescription>}
          </div>
          {Icon && (
            <div className={`p-3 rounded-full ${getStatsIconClasses(variant)}`}>
              <Icon className={DASHBOARD_SIZES.statsIcon} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
