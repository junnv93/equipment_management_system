'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Calendar, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SELECTOR_PAGE_SIZE } from '@equipment-management/shared-constants';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import equipmentApi from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { cn } from '@/lib/utils';
import {
  TRANSITION_PRESETS,
  TEAM_SEARCH_TOKENS,
  TEAM_ROW_TOKENS,
  MOTION_PRIMITIVES,
  CODE_INLINE_TOKENS,
} from '@/lib/design-tokens';

interface TeamEquipmentListProps {
  teamId: string;
}

/**
 * 장비 상태별 배지 variant
 */
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  in_use: 'secondary',
  checked_out: 'outline',
  calibration_scheduled: 'secondary',
  calibration_overdue: 'destructive',
  non_conforming: 'destructive',
  spare: 'outline',
  retired: 'outline',
};

/**
 * 팀 장비 목록 컴포넌트
 *
 * 기능:
 * - 팀에 소속된 장비 목록 표시
 * - 장비 검색
 * - 장비 상세 페이지 링크
 */
export function TeamEquipmentList({ teamId }: TeamEquipmentListProps) {
  const t = useTranslations('equipment');
  const formatter = useFormatter();
  const [search, setSearch] = useState('');

  // 팀 장비 목록 조회
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.equipment.list({ teamId }),
    queryFn: () => equipmentApi.getEquipmentList({ teamId, pageSize: SELECTOR_PAGE_SIZE }),
    ...QUERY_CONFIG.EQUIPMENT_LIST,
  });

  const equipment = data?.data || [];

  // 검색 필터링
  const filteredEquipment = equipment.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.managementNumber?.toLowerCase().includes(searchLower) ||
      item.modelName?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return formatter.dateTime(new Date(date), { dateStyle: 'short' });
  };

  if (error) {
    return (
      <ErrorAlert
        error={error as Error}
        title={t('teamEquipmentList.errorLoad')}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 전체 장비 보기 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-md flex-1">
          <Search className={TEAM_SEARCH_TOKENS.iconPositioned} aria-hidden="true" />
          <Input
            type="search"
            placeholder={t('teamEquipmentList.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn('pl-9', TEAM_SEARCH_TOKENS.input)}
            aria-label={t('search.ariaLabel')}
          />
        </div>

        <Button variant="outline" asChild>
          <Link href={`/equipment?teamId=${teamId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('teamEquipmentList.viewAll')}
          </Link>
        </Button>
      </div>

      {/* 장비 목록 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {search ? t('list.noSearchResults') : t('list.empty')}
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/equipment/create">{t('teamEquipmentList.createLink')}</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      {t('table.name')}
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      {t('table.managementNumber')}
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                      {t('table.status')}
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">
                      {t('fields.lastCalibrationDate')}
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">
                      <span className="sr-only">{t('table.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item, index) => {
                    const statusKey = item.status ?? 'available';
                    const statusVariant = STATUS_VARIANTS[statusKey] ?? 'outline';

                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          `border-b last:border-0 hover:bg-muted/30 ${TRANSITION_PRESETS.fastColor}`,
                          TEAM_ROW_TOKENS.staggerFade
                        )}
                        style={{
                          animationDelay: `${index * 30}ms`,
                          animationDuration: `${MOTION_PRIMITIVES.duration.fast}ms`,
                        }}
                      >
                        <td className="p-4">
                          <div>
                            <Link
                              href={`/equipment/${item.id}`}
                              className="font-medium hover:underline"
                            >
                              {item.name}
                            </Link>
                            {item.modelName && (
                              <p className="text-xs text-muted-foreground">{item.modelName}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <code className={CODE_INLINE_TOKENS.base}>
                            {item.managementNumber || '-'}
                          </code>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <Badge variant={statusVariant}>
                            {t(`status.${statusKey}` as Parameters<typeof t>[0])}
                          </Badge>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(item.lastCalibrationDate)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/equipment/${item.id}`}>{t('viewDetailShort')}</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 결과 정보 */}
      {filteredEquipment.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {search
            ? t('teamEquipmentList.searchResultCount', { count: filteredEquipment.length })
            : t('teamEquipmentList.resultCount', { count: filteredEquipment.length })}
        </p>
      )}
    </div>
  );
}
