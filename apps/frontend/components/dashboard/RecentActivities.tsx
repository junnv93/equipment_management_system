"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RecentActivity } from "@/lib/api/dashboard-api";
import { formatDateTime } from "@/lib/utils/date";
import {
  Clock,
  Package,
  Pen,
  RotateCcw,
  Send,
  Truck,
  PlusCircle,
  Wrench,
  FileCheck,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RecentActivitiesProps {
  data: RecentActivity[];
  loading?: boolean;
}

// 활동 타입에 따른 정보 정의
const ACTIVITY_TYPES: Record<
  string,
  { icon: React.ReactNode; label: string; variant: "default" | "secondary" | "outline" | "destructive"; category: string }
> = {
  equipment_added: {
    icon: <PlusCircle className="h-4 w-4" />,
    label: "장비 등록",
    variant: "default",
    category: "equipment"
  },
  equipment_updated: {
    icon: <Pen className="h-4 w-4" />,
    label: "장비 수정",
    variant: "secondary",
    category: "equipment"
  },
  equipment_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "장비 승인",
    variant: "default",
    category: "equipment"
  },
  equipment_rejected: {
    icon: <XCircle className="h-4 w-4" />,
    label: "장비 반려",
    variant: "destructive",
    category: "equipment"
  },
  calibration_created: {
    icon: <Wrench className="h-4 w-4" />,
    label: "교정 등록",
    variant: "default",
    category: "calibration"
  },
  calibration_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "교정 승인",
    variant: "default",
    category: "calibration"
  },
  rental_created: {
    icon: <Send className="h-4 w-4" />,
    label: "대여 신청",
    variant: "outline",
    category: "rental"
  },
  rental_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "대여 승인",
    variant: "default",
    category: "rental"
  },
  rental_returned: {
    icon: <RotateCcw className="h-4 w-4" />,
    label: "대여 반납",
    variant: "outline",
    category: "rental"
  },
  checkout_created: {
    icon: <Truck className="h-4 w-4" />,
    label: "반출 신청",
    variant: "outline",
    category: "checkout"
  },
  checkout_approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    label: "반출 승인",
    variant: "default",
    category: "checkout"
  },
  checkout_returned: {
    icon: <Package className="h-4 w-4" />,
    label: "반출 반납",
    variant: "outline",
    category: "checkout"
  }
};

// 라우트 정보 타입 정의
const ROUTES: Record<string, string> = {
  equipment_added: `/equipment/`,
  equipment_updated: `/equipment/`,
  equipment_approved: `/equipment/`,
  equipment_rejected: `/equipment/`,
  calibration_created: `/calibration/`,
  calibration_approved: `/calibration/`,
  rental_created: `/rentals/`,
  rental_approved: `/rentals/`,
  rental_returned: `/rentals/`,
  checkout_created: `/checkouts/`,
  checkout_approved: `/checkouts/`,
  checkout_returned: `/checkouts/`
};

// 역할별 표시 카테고리 정의
const ROLE_CATEGORIES: Record<string, string[]> = {
  test_engineer: ['equipment', 'calibration', 'rental', 'checkout'],
  technical_manager: ['equipment', 'calibration', 'rental'],
  lab_manager: ['equipment', 'calibration', 'rental', 'checkout'],
  system_admin: ['equipment', 'calibration', 'rental', 'checkout'],
};

// 카테고리 탭 정의
const CATEGORY_TABS = [
  { key: 'all', label: '전체' },
  { key: 'equipment', label: '장비' },
  { key: 'calibration', label: '교정' },
  { key: 'rental', label: '대여' },
  { key: 'checkout', label: '반출' },
];

// 개별 활동 항목 컴포넌트
const ActivityItem = memo(function ActivityItem({
  activity,
  onNavigate
}: {
  activity: RecentActivity;
  onNavigate: (activity: RecentActivity) => void;
}) {
  const activityInfo = ACTIVITY_TYPES[activity.type] || {
    icon: <FileCheck className="h-4 w-4" />,
    label: "기타 활동",
    variant: "default" as const,
    category: "other"
  };

  const isApproval = activity.type.includes('approved');
  const isRejection = activity.type.includes('rejected');

  return (
    <div
      className={cn(
        "flex items-start space-x-4 p-3 rounded-lg transition-colors",
        "hover:bg-muted/50",
        isApproval && "bg-green-50/50 dark:bg-green-900/10",
        isRejection && "bg-red-50/50 dark:bg-red-900/10"
      )}
    >
      <div className={cn(
        "mt-1 rounded-full p-2",
        isApproval && "bg-green-100 dark:bg-green-900/30",
        isRejection && "bg-red-100 dark:bg-red-900/30",
        !isApproval && !isRejection && "bg-muted"
      )}>
        {activityInfo.icon}
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <Badge variant={activityInfo.variant} className="py-0.5 text-xs">
            {activityInfo.label}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center">
            <Clock className="inline-block h-3 w-3 mr-1" aria-hidden="true" />
            {formatDateTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-sm truncate">
          <span className="font-medium">{activity.userName}</span>님이{" "}
          <span className="font-medium text-primary">{activity.entityName}</span>
          {activity.details ? ` ${activity.details}` : ""}
        </p>
        <Button
          variant="link"
          size="sm"
          className="h-6 px-0 text-xs"
          onClick={() => onNavigate(activity)}
        >
          자세히 보기 →
        </Button>
      </div>
    </div>
  );
});

export const RecentActivities = memo(function RecentActivities({
  data,
  loading = false
}: RecentActivitiesProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>("all");

  const userRole = session?.user?.role?.toLowerCase() || 'test_engineer';

  // 역할에 따른 표시 가능한 카테고리
  const allowedCategories = ROLE_CATEGORIES[userRole] || ROLE_CATEGORIES['test_engineer'];

  // 활동 상세 페이지 이동 함수
  const handleNavigateToDetail = useCallback((activity: RecentActivity) => {
    const route = ROUTES[activity.type];
    if (route) {
      router.push(`${route}${activity.entityId}`);
    }
  }, [router]);

  // 필터링된 활동 데이터
  const filteredActivities = useMemo(() => {
    // 먼저 역할에 따라 허용된 카테고리만 필터링
    const roleFiltered = data.filter(activity => {
      const activityInfo = ACTIVITY_TYPES[activity.type];
      if (!activityInfo) return false;
      return allowedCategories.includes(activityInfo.category);
    });

    // 그 다음 탭 필터 적용
    if (activeTab === "all") return roleFiltered;
    return roleFiltered.filter(activity => {
      const activityInfo = ACTIVITY_TYPES[activity.type];
      return activityInfo?.category === activeTab;
    });
  }, [data, activeTab, allowedCategories]);

  // 역할에 따른 제목
  const getTitle = () => {
    switch (userRole) {
      case 'test_engineer':
        return '내 최근 활동';
      case 'technical_manager':
        return '팀 최근 활동';
      case 'lab_manager':
        return '시험소 최근 활동';
      case 'system_admin':
        return '전체 최근 활동';
      default:
        return '최근 활동';
    }
  };

  // 역할에 따른 설명
  const getDescription = () => {
    switch (userRole) {
      case 'test_engineer':
        return '본인의 최근 7일간 활동 기록입니다';
      case 'technical_manager':
        return '팀 내 최근 7일간 활동 기록입니다';
      case 'lab_manager':
        return '시험소 내 최근 7일간 활동 기록입니다';
      case 'system_admin':
        return '전체 시스템의 최근 7일간 활동 기록입니다';
      default:
        return '최근 7일간 발생한 활동 기록입니다';
    }
  };

  // 역할에 따른 표시 탭 필터링
  const visibleTabs = CATEGORY_TABS.filter(
    tab => tab.key === 'all' || allowedCategories.includes(tab.key)
  );

  return (
    <Card role="region" aria-labelledby="recent-activities-title">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle id="recent-activities-title" className="text-lg font-medium">
              {getTitle()}
            </CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </div>
          {filteredActivities.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs"
              aria-live="polite"
              aria-atomic="true"
            >
              {filteredActivities.length}건
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3">
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
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">활동 내역이 없습니다</p>
            <p className="text-sm mt-1">최근 7일간 기록된 활동이 없습니다</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              {visibleTabs.map(tab => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="text-xs sm:text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredActivities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>해당 카테고리에 활동 내역이 없습니다</p>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    onNavigate={handleNavigateToDetail}
                  />
                ))
              )}
            </div>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
});
