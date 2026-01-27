"use client"

import { useCallback, useMemo, memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

// 상태별 색상 정의 (UL-QP-18 equipment status enum 기준)
const STATUS_COLORS: Record<string, string> = {
  available: "#16a34a", // 사용 가능 - 녹색
  in_use: "#2563eb",    // 사용 중 - 파란색
  checked_out: "#f59e0b", // 반출 중 - 주황색
  calibration_scheduled: "#8b5cf6", // 교정 예정 - 보라색
  calibration_overdue: "#dc2626", // 교정 기한 초과 - 빨강
  non_conforming: "#ef4444", // 부적합 - 진한 빨강
  spare: "#94a3b8", // 여분 - 회색
  retired: "#64748b", // 폐기 - 진한 회색
}

// 상태 한글 라벨 (UL-QP-18 기준)
const STATUS_LABELS: Record<string, string> = {
  available: "사용가능",
  in_use: "사용중",
  checked_out: "반출중",
  calibration_scheduled: "교정예정",
  calibration_overdue: "교정지연",
  non_conforming: "부적합",
  spare: "여분",
  retired: "폐기",
}

interface EquipmentStatusChartProps {
  data: Record<string, number>
  loading?: boolean
}

export const EquipmentStatusChart = memo(function EquipmentStatusChart({ 
  data, 
  loading = false 
}: EquipmentStatusChartProps) {
  // 데이터 가공 - useMemo로 최적화
  const { chartData, totalEquipment } = useMemo(() => {
    const formattedData = Object.entries(data).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "#e5e7eb", // 기본 색상
      key: status
    }));
    
    const total = formattedData.reduce((sum, item) => sum + item.value, 0);
    
    return {
      chartData: formattedData,
      totalEquipment: total
    };
  }, [data]);

  // 파이 차트 라벨 렌더링 함수 - 퍼센트만 표시 (오버플로우 방지)
  const renderCustomizedLabel = useCallback(({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent
  }: any) => {
    // 5% 이하의 작은 섹션은 라벨 생략
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }, []);

  // Tooltip formatter 함수도 useCallback으로 최적화
  const tooltipFormatter = useCallback((value: number) => {
    return [`${value}대 (${((value / totalEquipment) * 100).toFixed(1)}%)`, ""]
  }, [totalEquipment]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>장비 상태</CardTitle>
        <CardDescription>현재 장비 상태별 분포</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <p>데이터가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 파이 차트 */}
            <div className="flex justify-center">
              <div className="h-[240px] w-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={90}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 커스텀 범례 - 그리드 레이아웃으로 깔끔하게 정렬 */}
            <div className="grid grid-cols-2 gap-3 px-4">
              {chartData.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center gap-2 text-sm"
                  role="listitem"
                >
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-foreground font-medium">
                    {entry.name}
                  </span>
                  <span className="text-muted-foreground ml-auto shrink-0">
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 총 장비 수 */}
            <div className="text-center text-sm border-t pt-4">
              <p className="text-muted-foreground">
                총 <span className="font-semibold text-foreground text-lg">{totalEquipment}</span>대의 장비
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}) 