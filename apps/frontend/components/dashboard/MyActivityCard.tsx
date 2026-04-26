'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardList, Truck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD_RECENT_ACTIVITIES_TOKENS as T } from '@/lib/design-tokens';
import type { RecentActivity } from '@/lib/api/dashboard-api';

interface MyActivityCardProps {
  userId: string;
  recentActivities: RecentActivity[];
}

function ActivityKindIcon({ type }: { type: string }) {
  if (type.includes('calibration') || type.includes('CALIBRATION'))
    return <ClipboardList className="h-4 w-4" aria-hidden="true" />;
  if (type.includes('checkout') || type.includes('CHECKOUT'))
    return <Truck className="h-4 w-4" aria-hidden="true" />;
  return <Activity className="h-4 w-4" aria-hidden="true" />;
}

export function MyActivityCard({ userId, recentActivities }: MyActivityCardProps) {
  const t = useTranslations('dashboard.myActivity');

  const myActivities = useMemo(
    () => recentActivities.filter((a) => a.userId === userId).slice(0, 5),
    [recentActivities, userId]
  );

  return (
    <section
      className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 shadow-sm"
      aria-label={t('ariaLabel', { name: '' })}
    >
      <header>
        <span className="text-sm font-semibold text-foreground">{t('title')}</span>
      </header>

      {myActivities.length === 0 ? (
        <div role="status" className="py-4 text-center text-xs text-muted-foreground">
          {t('empty')}
        </div>
      ) : (
        <ul className="flex flex-col gap-2" role="list">
          {myActivities.map((activity) => (
            <li key={activity.id} className={cn(T.item, 'text-sm')}>
              <div className={cn(T.iconContainer, T.iconContainerDefault)}>
                <ActivityKindIcon type={activity.type} />
              </div>
              <div className={T.content}>
                <p className="text-xs font-medium text-foreground truncate">
                  {activity.entityName || activity.equipmentName}
                </p>
                <span className={T.meta}>{activity.details}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
