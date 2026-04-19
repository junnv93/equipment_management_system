'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Package } from 'lucide-react';
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
import testSoftwareApi from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { TEST_FIELD_VALUES, SOFTWARE_AVAILABILITY_VALUES } from '@equipment-management/schemas';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import {
  parseTestSoftwareFiltersFromSearchParams,
  convertFiltersToApiParams,
  ALL_SENTINEL,
  type UITestSoftwareFilters,
} from '@/lib/utils/software-filter-utils';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { ExportFormButton } from '@/components/shared/ExportFormButton';

function formatManagers(
  primary: string | null | undefined,
  secondary: string | null | undefined
): string {
  if (primary && secondary) return `${primary}, ${secondary}`;
  if (primary) return primary;
  if (secondary) return secondary;
  return '-';
}

export default function TestSoftwareListContent() {
  const t = useTranslations('software');
  const router = useRouter();
  const searchParams = useSearchParams();

  const { can } = useAuth();
  const canCreate = can(Permission.CREATE_TEST_SOFTWARE);

  const uiFilters = parseTestSoftwareFiltersFromSearchParams(searchParams);
  const apiFilters = convertFiltersToApiParams(uiFilters);

  const updateFilter = useCallback(
    (key: keyof UITestSoftwareFilters, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL_SENTINEL) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // 필터 변경 시 첫 페이지로 리셋
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

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.testSoftware.list(apiFilters as Record<string, unknown>),
    queryFn: () => testSoftwareApi.list(apiFilters),
    ...QUERY_CONFIG.TEST_SOFTWARE_LIST,
  });

  const items = data?.data ?? [];
  const paginationInfo = useMemo(
    () => ({
      totalItems: data?.meta?.pagination?.total ?? 0,
      totalPages: data?.meta?.pagination?.totalPages ?? 1,
      currentPage: data?.meta?.pagination?.currentPage ?? uiFilters.page,
    }),
    [data, uiFilters.page]
  );

  const exportParams: Record<string, string> = {};
  for (const key of ['testField', 'availability', 'search', 'manufacturer'] as const) {
    const value = searchParams.get(key);
    if (value) exportParams[key] = value;
  }

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
            formNumber="UL-QP-18-07"
            params={exportParams}
            label={t('list.exportLedger')}
            errorToastDescription={t('list.exportError')}
            size="default"
          />
          {canCreate && (
            <Link href={FRONTEND_ROUTES.SOFTWARE.CREATE}>
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('list.searchPlaceholder')}
            value={uiFilters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={uiFilters.testField || ALL_SENTINEL}
          onValueChange={(v) => updateFilter('testField', v === ALL_SENTINEL ? '' : v)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('list.filters.testField')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>{t('list.filters.allTestFields')}</SelectItem>
            {TEST_FIELD_VALUES.map((field) => (
              <SelectItem key={field} value={field}>
                {t(`testField.${field}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={uiFilters.availability || ALL_SENTINEL}
          onValueChange={(v) => updateFilter('availability', v === ALL_SENTINEL ? '' : v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('list.filters.availability')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SENTINEL}>{t('list.filters.allAvailability')}</SelectItem>
            {SOFTWARE_AVAILABILITY_VALUES.map((av) => (
              <SelectItem key={av} value={av}>
                {t(`availability.${av}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-[160px]">
          <Input
            placeholder={t('list.filters.manufacturer')}
            value={uiFilters.manufacturer}
            onChange={(e) => updateFilter('manufacturer', e.target.value)}
          />
        </div>
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
          <Package className="mb-3 h-10 w-10" />
          <p>{t('list.empty')}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('list.columns.managementNumber')}</TableHead>
                <TableHead>{t('list.columns.name')}</TableHead>
                <TableHead>{t('list.columns.version')}</TableHead>
                <TableHead>{t('list.columns.testField')}</TableHead>
                <TableHead>{t('list.columns.manager')}</TableHead>
                <TableHead>{t('list.columns.manufacturer')}</TableHead>
                <TableHead>{t('list.columns.location')}</TableHead>
                <TableHead>{t('list.columns.requiresValidation')}</TableHead>
                <TableHead>{t('list.columns.availability')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((sw) => (
                <TableRow
                  key={sw.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.DETAIL(sw.id))}
                >
                  <TableCell>
                    <span className="font-mono text-sm text-primary">{sw.managementNumber}</span>
                  </TableCell>
                  <TableCell className="font-medium">{sw.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs tabular-nums">
                      {sw.softwareVersion || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>{t(`testField.${sw.testField}`)}</TableCell>
                  <TableCell>
                    {formatManagers(sw.primaryManagerName, sw.secondaryManagerName)}
                  </TableCell>
                  <TableCell>{sw.manufacturer || '-'}</TableCell>
                  <TableCell>{sw.location || '-'}</TableCell>
                  <TableCell className="text-center font-medium">
                    {sw.requiresValidation
                      ? t('list.requiresValidationYes')
                      : t('list.requiresValidationNo')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sw.availability === 'available' ? 'default' : 'secondary'}>
                      {t(`availability.${sw.availability}`)}
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
          pageSize={uiFilters.pageSize}
          totalItems={paginationInfo.totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
