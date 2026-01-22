"use client";

import { CalendarIcon, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { dashboardApi, UpcomingCalibration } from "@/lib/api";
import { Card } from "@/components/ui/card";

interface CalibrationItem {
  id: string;
  equipmentName: string;
  managementNumber: string;
  calibrationDueDate: string;
  daysRemaining: number;
  status: "upcoming" | "urgent" | "overdue";
}

interface CalibrationScheduleProps {
  days?: number;
}

export default function CalibrationSchedule({ days = 30 }: CalibrationScheduleProps) {
  const [calibrationData, setCalibrationData] = useState<UpcomingCalibration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await dashboardApi.getCalibrationSchedule();
        setCalibrationData(data);
        setError(null);
      } catch (err) {
        console.error("교정 일정 데이터를 불러오는 중 오류 발생:", err);
        setError("데이터를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center p-3 rounded-md border border-gray-200"
          >
            <div className="w-2 h-full min-h-[2.5rem] rounded-full mr-4 bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
            <div className="flex flex-col items-end">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
          </div>
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

  // API 응답 데이터를 컴포넌트 형식에 맞게 변환
  const calibrationItems: CalibrationItem[] = calibrationData.map(item => ({
    id: item.equipmentId,
    equipmentName: item.equipmentName,
    managementNumber: item.equipmentId || "-",
    calibrationDueDate: new Date(item.dueDate).toLocaleDateString(),
    daysRemaining: item.daysUntilDue,
    status: item.daysUntilDue > 7 ? "upcoming" :
            item.daysUntilDue > 0 ? "urgent" : "overdue"
  }));

  // 데이터가 없는 경우
  if (calibrationItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <CalendarIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
        <p>30일 이내 예정된 교정 일정이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {calibrationItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div
            className={`w-2 h-full min-h-[2.5rem] rounded-full mr-4 ${
              item.status === "upcoming"
                ? "bg-blue-400"
                : item.status === "urgent"
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
          />

          <div className="flex-1">
            <h4 className="font-medium">{item.equipmentName}</h4>
            <p className="text-sm text-gray-500">{item.managementNumber}</p>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>{item.calibrationDueDate}</span>
            </div>
            <span
              className={`text-xs font-medium mt-1 ${
                item.status === "upcoming"
                  ? "text-blue-600"
                  : item.status === "urgent"
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              {item.daysRemaining > 0
                ? `${item.daysRemaining}일 남음`
                : `${Math.abs(item.daysRemaining)}일 지남`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
} 