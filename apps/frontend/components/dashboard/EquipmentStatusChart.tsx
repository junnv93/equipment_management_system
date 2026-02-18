'use client';

import { useCallback, useMemo, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { DASHBOARD_STATUS_COLORS } from '@/lib/design-tokens';

interface EquipmentStatusChartProps {
  data: Record<string, number>;
  loading?: boolean;
}

export const EquipmentStatusChart = memo(function EquipmentStatusChart({
  data,
  loading = false,
}: EquipmentStatusChartProps) {
  const t = useTranslations('dashboard.statusChart');
  const tStatus = useTranslations('dashboard.equipmentStatusLabels');
  // 데이터 가공 - useMemo로 최적화
  const { chartData, totalEquipment } = useMemo(() => {
    const formattedData = Object.entries(data).map(([status, count]) => ({
      name: tStatus(status as Parameters<typeof tStatus>[0]),
      value: count,
      color: DASHBOARD_STATUS_COLORS[status] || '#D8D9DA', // UL Gray 1 fallback
      key: status,
    }));

    const total = formattedData.reduce((sum, item) => sum + item.value, 0);

    return {
      chartData: formattedData,
      totalEquipment: total,
    };
  }, [data, tStatus]);

  // 파이 차트 라벨 렌더링 함수 - 퍼센트만 표시 (오버플로우 방지)
  const renderCustomizedLabel = useCallback(
    ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
    }: {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
    }) => {
      // 5% 이하의 작은 섹션은 라벨 생략
      if (percent < 0.05) return null;

      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

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
      );
    },
    []
  );

  // Tooltip formatter 함수도 useCallback으로 최적화
  const tooltipFormatter = useCallback(
    (value: number) => {
      const percent = ((value / totalEquipment) * 100).toFixed(1);
      return [t('tooltipUnit', { value, percent }), ''];
    },
    [totalEquipment, t]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
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
            <p>{t('empty')}</p>
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
            <div className="grid grid-cols-2 gap-3 px-4" role="list">
              {chartData.map((entry) => (
                <div key={entry.key} className="flex items-center gap-2 text-sm" role="listitem">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-foreground font-medium">{entry.name}</span>
                  <span className="text-muted-foreground ml-auto shrink-0">{entry.value}</span>
                </div>
              ))}
            </div>

            {/* 총 장비 수 */}
            <div className="text-center text-sm border-t pt-4">
              <p className="text-muted-foreground">{t('total', { count: totalEquipment })}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
