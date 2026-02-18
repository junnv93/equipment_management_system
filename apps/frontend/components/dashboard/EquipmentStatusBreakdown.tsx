'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getStatusChartColor } from '@/lib/design-tokens';

interface EquipmentStatusBreakdownProps {
  data: Record<string, number>;
  loading?: boolean;
}

/**
 * 장비 상태 분포 목록
 *
 * 각 행: ● 색상dot | 이름 | 가로비율바(div) | 숫자 | %
 * count 내림차순 정렬. count === 0인 상태 숨김.
 */
export function EquipmentStatusBreakdown({ data, loading = false }: EquipmentStatusBreakdownProps) {
  const t = useTranslations('dashboard.statusBreakdown');
  const tStatus = useTranslations('dashboard.equipmentStatusLabels');
  const total = Object.values(data).reduce((sum, v) => sum + v, 0);

  const rows = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{t('title')}</CardTitle>
          {!loading && (
            <Badge variant="outline" className="tabular-nums">
              {t('total', { count: total })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full flex-shrink-0" aria-hidden="true" />
                  <Skeleton className="h-3 w-20" aria-hidden="true" />
                  <Skeleton className="h-2 flex-1" aria-hidden="true" />
                  <Skeleton className="h-3 w-8" aria-hidden="true" />
                </div>
              ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('empty')}</p>
        ) : (
          <div className="space-y-2.5">
            {rows.map(([status, count]) => {
              const color = getStatusChartColor(status);
              const label = tStatus(status as Parameters<typeof tStatus>[0]);
              const percent = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={status} className="flex items-center gap-2">
                  {/* 색상 dot */}
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  {/* 상태명 */}
                  <span className="text-sm text-muted-foreground w-20 flex-shrink-0 truncate">
                    {label}
                  </span>
                  {/* 비율 바 */}
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: color,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  {/* 숫자 + % */}
                  <span className="tabular-nums text-sm font-medium w-8 text-right flex-shrink-0">
                    {count}
                  </span>
                  <span className="tabular-nums text-xs text-muted-foreground w-9 text-right flex-shrink-0">
                    {percent.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
