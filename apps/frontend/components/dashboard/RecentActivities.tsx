"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentActivity } from "@/lib/api/dashboard-api";
import { formatDateTime } from "@/lib/utils/date";
import { 
  Clock, 
  Package,
  Pen,
  RotateCcw,
  Send,
  Truck,
  Settings,
  PlusCircle,
  Wrench,
  FileCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivitiesProps {
  data: RecentActivity[];
  loading?: boolean;
}

export function RecentActivities({ data, loading = false }: RecentActivitiesProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");

  // 활동 유형에 따른 아이콘 및 라벨 반환
  const getActivityInfo = (activity: RecentActivity) => {
    const activityTypes: Record<
      string,
      { icon: React.ReactNode; label: string; variant: "default" | "secondary" | "outline" | "destructive" }
    > = {
      equipment_added: {
        icon: <PlusCircle className="h-4 w-4" />,
        label: "장비 등록",
        variant: "default"
      },
      equipment_updated: {
        icon: <Pen className="h-4 w-4" />,
        label: "장비 수정",
        variant: "secondary"
      },
      calibration_created: {
        icon: <Wrench className="h-4 w-4" />,
        label: "교정 등록",
        variant: "default"
      },
      rental_created: {
        icon: <Send className="h-4 w-4" />,
        label: "대여 신청",
        variant: "outline"
      },
      rental_returned: {
        icon: <RotateCcw className="h-4 w-4" />,
        label: "대여 반납",
        variant: "outline"
      },
      checkout_created: {
        icon: <Truck className="h-4 w-4" />,
        label: "반출 신청",
        variant: "outline"
      },
      checkout_returned: {
        icon: <Package className="h-4 w-4" />,
        label: "반출 반납",
        variant: "outline"
      }
    }

    return (
      activityTypes[activity.type] || {
        icon: <FileCheck className="h-4 w-4" />,
        label: "기타 활동",
        variant: "default"
      }
    )
  }

  // 활동 상세 페이지로 이동
  const handleNavigateToDetail = (activity: RecentActivity) => {
    const routes: Record<string, string> = {
      equipment_added: `/equipment/${activity.entityId}`,
      equipment_updated: `/equipment/${activity.entityId}`,
      calibration_created: `/calibration/${activity.entityId}`,
      rental_created: `/rentals/${activity.entityId}`,
      rental_returned: `/rentals/${activity.entityId}`,
      checkout_created: `/checkouts/${activity.entityId}`,
      checkout_returned: `/checkouts/${activity.entityId}`
    }

    const route = routes[activity.type]
    if (route) {
      router.push(route)
    }
  }

  // 필터된 활동 데이터
  const filteredActivities = filter === "all" 
    ? data 
    : data.filter(activity => activity.type === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">최근 활동</CardTitle>
        <CardDescription>시스템에서 최근 발생한 활동 기록입니다</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>활동 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const { icon, label, variant } = getActivityInfo(activity)
              
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="mt-1 bg-muted rounded-full p-2">
                    {icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center">
                      <Badge variant={variant} className="mr-2 py-1">
                        {label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        <Clock className="inline-block h-3 w-3 mr-1" />
                        {formatDateTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>님이{" "}
                      <span className="font-medium">{activity.entityName}</span>
                      {activity.details ? ` ${activity.details}` : ""}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-6 px-0"
                      onClick={() => handleNavigateToDetail(activity)}
                    >
                      자세히 보기
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 