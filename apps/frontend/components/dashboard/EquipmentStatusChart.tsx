"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

// 상태별 색상 정의
const STATUS_COLORS: Record<string, string> = {
  available: "#16a34a", // 사용 가능 - 녹색
  in_use: "#2563eb",    // 사용 중 - 파란색
  maintenance: "#f59e0b", // 유지보수 중 - 주황색
  calibration: "#8b5cf6", // 교정 중 - 보라색
  reserved: "#0ea5e9",  // 예약됨 - 하늘색
  retired: "#6b7280",   // 폐기 - 회색
}

// 상태 한글 라벨
const STATUS_LABELS: Record<string, string> = {
  available: "사용 가능",
  in_use: "사용 중",
  maintenance: "유지보수 중",
  calibration: "교정 중",
  reserved: "예약됨",
  retired: "폐기",
}

interface EquipmentStatusChartProps {
  data: Record<string, number>
  loading?: boolean
}

export function EquipmentStatusChart({ data, loading = false }: EquipmentStatusChartProps) {
  // 데이터 가공
  const chartData = Object.entries(data).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || "#e5e7eb", // 기본 색상
    key: status
  }))

  const totalEquipment = chartData.reduce((sum, item) => sum + item.value, 0)

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null
  }

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
          <div className="flex flex-col items-center">
            <div className="h-[200px] w-full" style={{ minHeight: "200px", minWidth: "200px" }}>
              <ResponsiveContainer width="100%" height={300} minHeight={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}대 (${((value / totalEquipment) * 100).toFixed(1)}%)`, ""]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-center">
              <p>총 <span className="font-medium">{totalEquipment}대</span>의 장비</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 