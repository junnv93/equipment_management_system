'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/utils/date';
import { Clock, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DASHBOARD_MOTION,
  getDashboardStaggerDelay,
  DASHBOARD_RECENT_ACTIVITIES_TOKENS as RA,
  DASHBOARD_EMPTY_STATE_TOKENS as ES,
} from '@/lib/design-tokens';
import {
  ACTIVITY_TYPES,
  ACTIVITY_ROUTES,
  ROLE_CATEGORIES,
  CATEGORY_TABS,
  DEFAULT_ACTIVITY_META,
} from '@/lib/config/recent-activities-config';
import type { RecentActivity } from '@/lib/api/dashboard-api';

interface RecentActivitiesProps {
  data: RecentActivity[];
  loading?: boolean;
}

// 개별 활동 항목 컴포넌트
const ActivityItem = memo(function ActivityItem({
  activity,
  onNavigate,
  activityLabel,
  otherLabel,
  userActionText,
  viewDetailText,
}: {
  activity: RecentActivity;
  onNavigate: (activity: RecentActivity) => void;
  activityLabel: string;
  otherLabel: string;
  userActionText: string;
  viewDetailText: string;
}) {
  const activityInfo = ACTIVITY_TYPES[activity.type] || DEFAULT_ACTIVITY_META;
  const Icon = activityInfo.icon;

  const isApproval = activity.type.includes('approved');
  const isRejection = activity.type.includes('rejected');
  const label = activityInfo.labelKey === 'other' ? otherLabel : activityLabel;

  return (
    <div
      className={cn(
        `${RA.item} ${DASHBOARD_MOTION.instantBg} motion-reduce:transition-none`,
        'hover:bg-muted/50',
        isApproval && RA.rowApproval,
        isRejection && RA.rowRejection
      )}
    >
      <div
        className={cn(
          RA.iconContainer,
          isApproval && RA.iconContainerApproval,
          isRejection && RA.iconContainerRejection,
          !isApproval && !isRejection && RA.iconContainerDefault
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className={RA.content}>
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant={activityInfo.variant} className="py-0.5 text-xs">
            {label}
          </Badge>
          <time dateTime={activity.timestamp} className={RA.meta}>
            <Clock className="inline-block h-3 w-3 mr-1" aria-hidden="true" />
            {formatDateTime(activity.timestamp)}
          </time>
        </div>
        <p className="text-sm truncate">
          <span className="font-medium">{userActionText}</span>{' '}
          <span className="font-medium text-primary">{activity.entityName}</span>
          {activity.details ? ` ${activity.details}` : ''}
        </p>
        <Button
          variant="link"
          size="sm"
          className={RA.viewDetailBtn}
          onClick={() => onNavigate(activity)}
        >
          {viewDetailText}
        </Button>
      </div>
    </div>
  );
});

export const RecentActivities = memo(function RecentActivities({
  data,
  loading = false,
}: RecentActivitiesProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('dashboard.activities');
  const [activeTab, setActiveTab] = useState<string>('all');

  const userRole = session?.user?.role?.toLowerCase() || 'test_engineer';

  // 역할에 따른 표시 가능한 카테고리
  const allowedCategories = ROLE_CATEGORIES[userRole] || ROLE_CATEGORIES['test_engineer'];

  // 활동 상세 페이지 이동 함수
  const handleNavigateToDetail = useCallback(
    (activity: RecentActivity) => {
      const route = ACTIVITY_ROUTES[activity.type];
      if (route) {
        router.push(route(activity.entityId));
      }
    },
    [router]
  );

  // 필터링된 활동 데이터
  const filteredActivities = useMemo(() => {
    // 먼저 역할에 따라 허용된 카테고리만 필터링
    const roleFiltered = data.filter((activity) => {
      const activityInfo = ACTIVITY_TYPES[activity.type];
      if (!activityInfo) return false;
      return allowedCategories.includes(activityInfo.category);
    });

    // 그 다음 탭 필터 적용
    if (activeTab === 'all') return roleFiltered;
    return roleFiltered.filter((activity) => {
      const activityInfo = ACTIVITY_TYPES[activity.type];
      return activityInfo?.category === activeTab;
    });
  }, [data, activeTab, allowedCategories]);

  // 역할에 따른 제목/설명 (i18n)
  const titleKey = `roleTitle.${userRole}` as Parameters<typeof t>[0];
  const descKey = `roleDescription.${userRole}` as Parameters<typeof t>[0];
  const title = t.has(titleKey) ? t(titleKey) : t('roleTitle.default');
  const description = t.has(descKey) ? t(descKey) : t('roleDescription.default');

  // 역할에 따른 표시 탭 필터링
  const visibleTabs = CATEGORY_TABS.filter(
    (tab) => tab.key === 'all' || allowedCategories.includes(tab.key)
  );

  return (
    <Card role="region" aria-labelledby="recent-activities-title">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle id="recent-activities-title" className="text-lg font-medium">
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {filteredActivities.length > 0 && (
            <Badge variant="outline" className="text-xs" aria-live="polite" aria-atomic="true">
              {t('count', { count: filteredActivities.length })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-3 motion-safe:animate-pulse"
                  style={{ animationDelay: getDashboardStaggerDelay(i, 'list') }}
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          /* 탭은 데이터 유무와 관계없이 항상 표시 */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="text-xs sm:text-sm">
                  {t(`categories.${tab.labelKey}` as Parameters<typeof t>[0])}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="relative">
              {data.length === 0 ? (
                /* 전체 데이터 없음 — neutral (py-8, 패딩 축소) */
                <div className={ES.neutral.container}>
                  <Filter className={cn(ES.neutral.icon, ES.neutral.iconSize)} aria-hidden="true" />
                  <p className={ES.neutral.title}>{t('empty')}</p>
                  <p className={ES.neutral.description}>{t('emptyDescription')}</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                /* 탭 필터링 후 결과 없음 — filter (텍스트만) */
                <div className={ES.filter.container}>
                  <p className={ES.filter.text}>{t('noCategory')}</p>
                </div>
              ) : (
                <div className={RA.scrollContainer}>
                  {filteredActivities.map((activity) => {
                    const activityInfo = ACTIVITY_TYPES[activity.type];
                    const labelKey = activityInfo?.labelKey || 'other';
                    return (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        onNavigate={handleNavigateToDetail}
                        activityLabel={t(`types.${labelKey}` as Parameters<typeof t>[0])}
                        otherLabel={t('other')}
                        userActionText={t('userAction', { userName: activity.userName })}
                        viewDetailText={t('viewDetail')}
                      />
                    );
                  })}
                </div>
              )}
              {/* 스크롤 어포던스 */}
              {filteredActivities.length > 4 && <div className={RA.scrollFade} />}
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
});
