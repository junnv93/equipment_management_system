'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Cable } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EquipmentPagination } from '@/components/equipment/EquipmentPagination';
import cablesApi from '@/lib/api/cables-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { ExportFormButton } from '@/components/shared/ExportFormButton';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import { CABLE_CONNECTOR_TYPE_VALUES, CABLE_STATUS_VALUES } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';

const ALL_VALUE = '__ALL__';

interface CableListFilters {
  search: string;
  connectorType: string;
  status: string;
  page: number;
  pageSize: number;
}

function parseFiltersFromSearchParams(searchParams: URLSearchParams): CableListFilters {
  return {
    search: searchParams.get('search') ?? '',
    connectorType: searchParams.get('connectorType') ?? '',
    status: searchParams.get('status') ?? '',
    page: Number(searchParams.get('page')) || 1,
    pageSize: Number(searchParams.get('pageSize')) || 20,
  };
}

export default function CableListContent() {
  const t = useTranslations('cables');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can, user } = useAuth();
  const canCreate = can(Permission.UPDATE_CALIBRATION);

  const filters = parseFiltersFromSearchParams(searchParams);

  const exportParams: Record<string, string> = {};
  if (filters.connectorType) exportParams.connectorType = filters.connectorType;
  if (filters.status) exportParams.status = filters.status;
  // 크로스 사이트: 사용자 사이트를 기본 필터로 전달 (다중 사이트 환경 보호)
  if (user?.site) exportParams.site = user.site;

  const updateFilter = useCallback(
    (key: keyof CableListFilters, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL_VALUE) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') params.delete('page');
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) params.set('page', String(page));
      else params.delete('page');
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pageSize', String(pageSize));
      params.delete('page');
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const apiQuery = useMemo(
    () => ({
      search: filters.search || undefined,
      connectorType: filters.connectorType || undefined,
      status: filters.status || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    }),
    [filters]
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.cables.list(apiQuery as Record<string, unknown>),
    queryFn: () => cablesApi.list(apiQuery),
    ...QUERY_CONFIG.CABLES_LIST,
  });

  const items = data?.data ?? [];
  const paginationInfo = useMemo(
    () => ({
      totalItems: data?.meta?.pagination?.total ?? 0,
      totalPages: data?.meta?.pagination?.totalPages ?? 1,
      currentPage: data?.meta?.pagination?.currentPage ?? filters.page,
    }),
    [data, filters.page]
  );

  const formatFreqRange = (min: number | null, max: number | null) => {
    if (min == null && max == null) return '-';
    if (min != null && max != null) return `${min} - ${max}`;
    if (min != null) return `${min}+`;
    return `- ${max}`;
  };

  return (
    <div className={getPageContainerClasses()}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('list.title')}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>{t('list.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <ExportFormButton
            formNumber="UL-QP-18-08"
            params={exportParams}
            label={t('list.exportButton')}
            errorToastDescription={t('list.exportError')}
            size="default"
          />
          {canCreate && (
            <Link href={FRONTEND_ROUTES.CABLES.CREATE}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('list.createButton')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('list.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.connectorType || ALL_VALUE}
          onValueChange={(v) => updateFilter('connectorType', v === ALL_VALUE ? '' : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('list.filters.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('list.filters.allTypes')}</SelectItem>
            {CABLE_CONNECTOR_TYPE_VALUES.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {t(`connectorType.${ct}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.status || ALL_VALUE}
          onValueChange={(v) => updateFilter('status', v === ALL_VALUE ? '' : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('list.filters.allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>{t('list.filters.allStatus')}</SelectItem>
            {CABLE_STATUS_VALUES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Cable className="mb-3 h-10 w-10" />
          <p>{t('list.empty')}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('list.columns.managementNumber')}</TableHead>
                <TableHead>{t('list.columns.length')}</TableHead>
                <TableHead>{t('list.columns.connectorType')}</TableHead>
                <TableHead>{t('list.columns.frequencyRange')}</TableHead>
                <TableHead>{t('list.columns.serialNumber')}</TableHead>
                <TableHead>{t('list.columns.location')}</TableHead>
                <TableHead>{t('list.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((cable) => (
                <TableRow key={cable.id}>
                  <TableCell>
                    <Link
                      href={FRONTEND_ROUTES.CABLES.DETAIL(cable.id)}
                      className="font-mono text-sm text-primary hover:underline"
                    >
                      {cable.managementNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{cable.length || '-'}</TableCell>
                  <TableCell>
                    {cable.connectorType
                      ? t(`connectorType.${cable.connectorType}` as Parameters<typeof t>[0])
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    {formatFreqRange(cable.frequencyRangeMin, cable.frequencyRangeMax)}
                  </TableCell>
                  <TableCell>{cable.serialNumber || '-'}</TableCell>
                  <TableCell>{cable.location || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={cable.status === 'active' ? 'default' : 'secondary'}>
                      {t(`status.${cable.status}` as Parameters<typeof t>[0])}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {paginationInfo.totalPages > 1 && (
        <EquipmentPagination
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          pageSize={filters.pageSize}
          totalItems={paginationInfo.totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
