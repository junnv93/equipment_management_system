'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useEffectiveRole } from '@/hooks/use-effective-role';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getDashboardStaggerDelay,
  DASHBOARD_RECENT_ACTIVITIES_TOKENS as RA,
  DASHBOARD_EMPTY_STATE_TOKENS as ES,
} from '@/lib/design-tokens';
import {
  ACTIVITY_TYPES,
  ACTIVITY_ROUTES,
  ROLE_CATEGORIES,
  CATEGORY_TABS,
} from '@/lib/config/recent-activities-config';
import { ActivityItem } from '@/components/dashboard/atoms/ActivityItem';
import type { RecentActivity } from '@/lib/api/dashboard-api';
import { UserRoleValues as URVal } from '@equipment-management/schemas';

interface RecentActivitiesProps {
  data: RecentActivity[];
  loading?: boolean;
}

export const RecentActivities = memo(function RecentActivities({
  data,
  loading = false,
}: RecentActivitiesProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.activities');
  const [activeTab, setActiveTab] = useState<string>('all');

  // verify-ssot Step 37 — useEffectiveRole SSOT (시뮬레이션 모드 반영)
  const { effectiveRole } = useEffectiveRole();
  const userRole = (effectiveRole?.toLowerCase() ?? URVal.TEST_ENGINEER) as string;

  // 역할에 따른 표시 가능한 카테고리
  const allowedCategories = ROLE_CATEGORIES[userRole] || ROLE_CATEGORIES[URVal.TEST_ENGINEER];

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
                    const hasRoute = Boolean(ACTIVITY_ROUTES[activity.type]);
                    return (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        onNavigate={handleNavigateToDetail}
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
