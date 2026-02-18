'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecentActivity } from '@/lib/api/dashboard-api';
import { formatDateTime } from '@/lib/utils/date';
import {
  Clock,
  Pen,
  Send,
  Truck,
  PlusCircle,
  Wrench,
  FileCheck,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DASHBOARD_MOTION, getDashboardStaggerDelay } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface RecentActivitiesProps {
  data: RecentActivity[];
  loading?: boolean;
}

// 활동 타입에 따른 정보 정의 (label은 i18n key)
const ACTIVITY_TYPES: Record<
  string,
  {
    icon: React.ReactNode;
    labelKey: string; // i18n key under 'dashboard.activities.types'
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
    category: string;
  }
> = {
  equipment_added: {
    icon: <PlusCircle className="h-4 w-4" />,
    labelKey: 'equipment_added',
    variant: 'default',
    category: 'equipment',
  },
  equipment_updated: {
    icon: <Pen className="h-4 w-4" />,
    labelKey: 'equipment_updated',
    variant: 'secondary',
    category: 'equipment',
  },
  equipment_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    labelKey: 'equipment_approved',
    variant: 'default',
    category: 'equipment',
  },
  equipment_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    labelKey: 'equipment_rejected',
    variant: 'destructive',
    category: 'equipment',
  },
  calibration_created: {
    icon: <Wrench className="h-4 w-4" />,
    labelKey: 'calibration_created',
    variant: 'default',
    category: 'calibration',
  },
  calibration_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    labelKey: 'calibration_approved',
    variant: 'default',
    category: 'calibration',
  },
  calibration_updated: {
    icon: <Wrench className="h-4 w-4" />,
    labelKey: 'calibration_updated',
    variant: 'secondary',
    category: 'calibration',
  },
  non_conformance_created: {
    icon: <XCircle className="h-4 w-4" />,
    labelKey: 'non_conformance_created',
    variant: 'destructive',
    category: 'equipment',
  },
  non_conformance_updated: {
    icon: <Pen className="h-4 w-4" />,
    labelKey: 'non_conformance_updated',
    variant: 'secondary',
    category: 'equipment',
  },
  non_conformance_resolved: {
    icon: <CheckCircle className="h-4 w-4" />,
    labelKey: 'non_conformance_resolved',
    variant: 'default',
    category: 'equipment',
  },
  calibration_plan_created: {
    icon: <FileCheck className="h-4 w-4" />,
    labelKey: 'calibration_plan_created',
    variant: 'default',
    category: 'calibration',
  },
  calibration_plan_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    labelKey: 'calibration_plan_approved',
    variant: 'default',
    category: 'calibration',
  },
  calibration_plan_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    labelKey: 'calibration_plan_rejected',
    variant: 'destructive',
    category: 'calibration',
  },
  rental_created: {
    icon: <Send className="h-4 w-4" />,
    labelKey: 'rental_created',
    variant: 'outline',
    category: 'rental',
  },
  rental_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    labelKey: 'rental_approved',
    variant: 'default',
    category: 'rental',
  },
  checkout_created: {
    icon: <Truck className="h-4 w-4" />,
    labelKey: 'checkout_created',
    variant: 'outline',
    category: 'checkout',
  },
  checkout_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    labelKey: 'checkout_approved',
    variant: 'default',
    category: 'checkout',
  },
};

// 라우트 정보 (SSOT: FRONTEND_ROUTES)
const ROUTES: Record<string, (entityId: string) => string> = {
  equipment_added: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  equipment_updated: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  equipment_approved: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  equipment_rejected: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  calibration_created: (id) => FRONTEND_ROUTES.CALIBRATION.DETAIL(id),
  calibration_updated: (id) => FRONTEND_ROUTES.CALIBRATION.DETAIL(id),
  calibration_approved: (id) => FRONTEND_ROUTES.CALIBRATION.DETAIL(id),
  calibration_plan_created: (id) => FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL(id),
  calibration_plan_approved: (id) => FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL(id),
  calibration_plan_rejected: (id) => FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL(id),
  // non_conformance_*: NC UUID로는 /equipment/[equipmentId]/non-conformance 접근 불가 — 라우트 미등록
  rental_created: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  rental_approved: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  rental_returned: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  checkout_created: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  checkout_approved: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  checkout_returned: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
};

// 역할별 표시 카테고리 정의
const ROLE_CATEGORIES: Record<string, string[]> = {
  test_engineer: ['equipment', 'calibration', 'rental', 'checkout'],
  technical_manager: ['equipment', 'calibration', 'rental'],
  quality_manager: ['calibration', 'equipment'],
  lab_manager: ['equipment', 'calibration', 'rental', 'checkout'],
  system_admin: ['equipment', 'calibration', 'rental', 'checkout'],
};

// 카테고리 탭 정의 (label은 i18n key)
const CATEGORY_TABS = [
  { key: 'all', labelKey: 'all' },
  { key: 'equipment', labelKey: 'equipment' },
  { key: 'calibration', labelKey: 'calibration' },
  { key: 'rental', labelKey: 'rental' },
  { key: 'checkout', labelKey: 'checkout' },
];

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
  const activityInfo = ACTIVITY_TYPES[activity.type] || {
    icon: <FileCheck className="h-4 w-4" />,
    labelKey: 'other',
    variant: 'default' as const,
    category: 'other',
  };

  const isApproval = activity.type.includes('approved');
  const isRejection = activity.type.includes('rejected');
  const label = activityInfo.labelKey === 'other' ? otherLabel : activityLabel;

  return (
    <div
      className={cn(
        `flex items-start space-x-4 p-3 rounded-lg ${DASHBOARD_MOTION.instantBg} motion-reduce:transition-none`,
        'hover:bg-muted/50',
        isApproval && 'bg-ul-green/5 dark:bg-ul-green/10',
        isRejection && 'bg-ul-red/5 dark:bg-ul-red/10'
      )}
    >
      <div
        className={cn(
          'mt-1 rounded-full p-2',
          isApproval && 'bg-ul-green/10 dark:bg-ul-green/20',
          isRejection && 'bg-ul-red/10 dark:bg-ul-red/20',
          !isApproval && !isRejection && 'bg-muted'
        )}
      >
        {activityInfo.icon}
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant={activityInfo.variant} className="py-0.5 text-xs">
            {label}
          </Badge>
          <time
            dateTime={activity.timestamp}
            className="text-xs text-muted-foreground flex items-center"
          >
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
          className="h-6 px-0 text-xs"
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
      const route = ROUTES[activity.type];
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
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Filter
              className="h-12 w-12 mx-auto mb-4 opacity-30 motion-safe:animate-gentle-bounce"
              aria-hidden="true"
            />
            <p className="text-lg font-medium">{t('empty')}</p>
            <p className="text-sm mt-1">{t('emptyDescription')}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="text-xs sm:text-sm">
                  {t(`categories.${tab.labelKey}` as Parameters<typeof t>[0])}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredActivities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>{t('noCategory')}</p>
                </div>
              ) : (
                filteredActivities.map((activity) => {
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
                })
              )}
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
});
