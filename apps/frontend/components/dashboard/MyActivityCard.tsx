'use client';

import { useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DASHBOARD_RECENT_ACTIVITIES_TOKENS as RA,
  DASHBOARD_EMPTY_STATE_TOKENS as ES,
} from '@/lib/design-tokens';
import {
  ACTIVITY_TYPES,
  ACTIVITY_ROUTES,
  DEFAULT_ACTIVITY_META,
} from '@/lib/config/recent-activities-config';
import { ActivityItem } from '@/components/dashboard/atoms/ActivityItem';
import { DISPLAY_LIMITS } from '@/lib/config/dashboard-config';
import type { RecentActivity } from '@/lib/api/dashboard-api';

interface MyActivityCardProps {
  userId: string;
  recentActivities: RecentActivity[];
}

export function MyActivityCard({ userId, recentActivities }: MyActivityCardProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.activities');
  const tCard = useTranslations('dashboard.myActivity');

  const myActivities = useMemo(
    () => recentActivities.filter((a) => a.userId === userId).slice(0, DISPLAY_LIMITS.myActivity),
    [recentActivities, userId]
  );

  const handleNavigate = useCallback(
    (activity: RecentActivity) => {
      const route = ACTIVITY_ROUTES[activity.type];
      if (route) router.push(route(activity.entityId));
    },
    [router]
  );

  return (
    <Card role="region" aria-labelledby="my-activity-title">
      <CardHeader className="pb-3">
        <CardTitle id="my-activity-title" className="text-lg font-medium">
          {tCard('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {myActivities.length === 0 ? (
          <div className={ES.neutral.container}>
            <p className={ES.neutral.title}>{tCard('empty')}</p>
          </div>
        ) : (
          <div className="relative">
            <div className={RA.scrollContainer}>
              {myActivities.map((activity) => {
                const activityInfo = ACTIVITY_TYPES[activity.type] ?? DEFAULT_ACTIVITY_META;
                const labelKey = activityInfo.labelKey;
                const hasRoute = Boolean(ACTIVITY_ROUTES[activity.type]);
                return (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    onNavigate={handleNavigate}
                    activityLabel={
                      labelKey === 'other'
                        ? t('other')
                        : t(`types.${labelKey}` as Parameters<typeof t>[0])
                    }
                    userActionText={t('userAction', { userName: activity.userName })}
                    viewDetailText={hasRoute ? t('viewDetail') : undefined}
                  />
                );
              })}
            </div>
            {myActivities.length > 4 && <div className={RA.scrollFade} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
