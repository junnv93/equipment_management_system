"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Clock, 
  Wrench, 
  AlertTriangle,
  Truck,
  ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardApi, EquipmentSummary as EquipmentSummaryType } from "@/lib/api";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
}

function StatsCard({ title, value, icon, description, change }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {change && (
          <div className="flex items-center pt-1">
            <span
              className={`text-xs ${
                change.type === "increase"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {change.type === "increase" ? "+" : "-"}
              {change.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EquipmentSummary() {
  const [stats, setStats] = useState<EquipmentSummaryType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getEquipmentSummary();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("장비 요약 데이터를 불러오는 중 오류 발생:", err);
        setError("데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  // 기본 데이터 (API 응답이 없을 경우)
  const defaultStats: EquipmentSummaryType = {
    total: 0,
    available: 0,
    loaned: 0,
    checkout: 0,
    calibrationDue: 0,
    calibrationOverdue: 0
  };

  // 사용할 데이터 (API 응답 또는 기본값)
  const displayStats = stats || defaultStats;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatsCard
        title="전체 장비"
        value={displayStats.total}
        icon={<Wrench className="h-4 w-4" />}
        description="등록된 총 장비 수"
      />
      <StatsCard
        title="사용 가능"
        value={displayStats.available}
        icon={<CheckCircle2 className="h-4 w-4" />}
        description="현재 사용 가능한 장비"
      />
      <StatsCard
        title="대여 중"
        value={displayStats.loaned}
        icon={<Clock className="h-4 w-4" />}
        description="현재 대여 중인 장비"
      />
      <StatsCard
        title="반출 중"
        value={displayStats.checkout}
        icon={<Truck className="h-4 w-4" />}
        description="현재 외부 반출 중인 장비"
      />
      <StatsCard
        title="교정 예정"
        value={displayStats.calibrationDue}
        icon={<Clock className="h-4 w-4" />}
        description="30일 이내 교정 예정 장비"
      />
      <StatsCard
        title="교정 기한 초과"
        value={displayStats.calibrationOverdue}
        icon={<AlertTriangle className="h-4 w-4" />}
        description="교정 기한이 지난 장비"
      />
    </div>
  );
} 