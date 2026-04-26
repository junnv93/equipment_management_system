'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardList, FilterX } from 'lucide-react';
import { SparklineMini } from '@/components/checkouts/SparklineMini';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { InboundSectionHeader } from '@/components/checkouts/InboundSectionHeader';
import { CheckoutListSkeleton } from '@/components/checkouts/CheckoutListSkeleton';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useInboundSectionPagination } from '@/hooks/use-inbound-section-pagination';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import equipmentImportApi from '@/lib/api/equipment-import-api';
import {
  type EquipmentImportStatus,
  EquipmentImportStatusValues,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { EquipmentImportStatusBadge } from '@/components/equipment-imports';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import {
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_INBOUND_SECTION_TOKENS,
  PREMIUM_TABLE_TOKENS,
  getSemanticBadgeClasses,
} from '@/lib/design-tokens';
import { countActiveFilters, type UICheckoutFilters } from '@/lib/utils/checkout-filter-utils';
import { isInboundBffEnabled } from '@/lib/features/checkout-flags';

interface InboundCheckoutsTabProps {
  teamId?: string;
  filters: UICheckoutFilters;
  onResetFilters: () => void;
}

/**
 * 반입 탭 컴포넌트
 *
 * v2 변경 (78-4):
 * - 3섹션 강화 헤더 (InboundSectionHeader — 아이콘/설명/카운트)
 * - 외부 렌탈·내부 공용 섹션 독립 페이지네이션 (rentalPage, internalPage URL 파라미터)
 * - 섹션별 빈 상태 (EmptyState no-data variant)
 */
export default function InboundCheckoutsTab({
  teamId,
  filters,
  onResetFilters,
}: InboundCheckoutsTabProps) {
  const t = useTranslations('checkouts');
  const tEquip = useTranslations('equipment');
  const router = useRouter();
  const { fmtDate } = useDateFormatter();
  const { inboundPage, rentalPage, internalPage, setInboundPage, setRentalPage, setInternalPage } =
    useInboundSectionPagination();

  const { status: statusFilter, search: searchTerm } = filters;
  const filterActive = countActiveFilters(filters) > 0;
  const bffEnabled = isInboundBffEnabled();

  // ──────────────────────────────────────────────
  // BFF 경로 (flag ON): 3섹션 단일 요청 집계
  // ──────────────────────────────────────────────
  const {
    data: overviewData,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: queryKeys.checkouts.view.inboundOverview({ statusFilter, searchTerm }),
    queryFn: () =>
      checkoutApi.getInboundOverview({
        statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
        searchTerm: searchTerm || undefined,
        limitPerSection: DEFAULT_PAGE_SIZE,
      }),
    enabled: bffEnabled,
    ...QUERY_CONFIG.CHECKOUT_LIST,
  });

  // ──────────────────────────────────────────────
  // 기존 경로 (flag OFF): 3개 독립 useQuery (rollback 안전)
  // ──────────────────────────────────────────────
  const {
    data: inboundCheckoutsData,
    isLoading: inboundCheckoutsLoading,
    isError: inboundCheckoutsError,
    refetch: refetchInbound,
  } = useQuery({
    queryKey: queryKeys.checkouts.view.inboundSection('standard', {
      statusFilter,
      searchTerm,
      teamId,
      page: inboundPage,
    }),
    queryFn: async () => {
      const query: CheckoutQuery = {
        page: inboundPage,
        pageSize: DEFAULT_PAGE_SIZE,
        search: searchTerm || undefined,
        teamId,
        direction: 'inbound',
      };
      if (statusFilter !== 'all') query.statuses = statusFilter;
      return checkoutApi.getCheckouts(query);
    },
    enabled: !bffEnabled,
    ...QUERY_CONFIG.CHECKOUT_LIST,
  });

  const {
    data: rentalImportsData,
    isLoading: rentalImportsLoading,
    isError: rentalImportsError,
    refetch: refetchRental,
  } = useQuery({
    queryKey: queryKeys.equipmentImports.bySourceType('rental', {
      statusFilter,
      searchTerm,
      page: rentalPage,
    }),
    queryFn: () =>
      equipmentImportApi.getList({
        sourceType: 'rental',
        page: rentalPage,
        limit: DEFAULT_PAGE_SIZE,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as EquipmentImportStatus) : undefined,
      }),
    enabled: !bffEnabled,
    ...QUERY_CONFIG.EQUIPMENT_IMPORT_LIST,
  });

  const {
    data: internalSharedImportsData,
    isLoading: internalSharedImportsLoading,
    isError: internalSharedImportsError,
    refetch: refetchInternal,
  } = useQuery({
    queryKey: queryKeys.equipmentImports.bySourceType('internal_shared', {
      statusFilter,
      searchTerm,
      page: internalPage,
    }),
    queryFn: () =>
      equipmentImportApi.getList({
        sourceType: 'internal_shared',
        page: internalPage,
        limit: DEFAULT_PAGE_SIZE,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as EquipmentImportStatus) : undefined,
      }),
    enabled: !bffEnabled,
    ...QUERY_CONFIG.EQUIPMENT_IMPORT_LIST,
  });

  // ──────────────────────────────────────────────
  // BFF sparkline (BFF 경로에서만 사용)
  // ──────────────────────────────────────────────
  const resolvedSparkline = overviewData?.sparkline;

  // ──────────────────────────────────────────────
  // 그룹화 (표준 반입 — 기존 또는 BFF)
  // ──────────────────────────────────────────────
  const inboundGroups = useMemo(() => {
    const items = bffEnabled ? overviewData?.standard?.items : inboundCheckoutsData?.data;
    if (!items) return [];
    return groupCheckoutsByDateAndDestination(items);
  }, [bffEnabled, overviewData?.standard, inboundCheckoutsData?.data]);

  // ──────────────────────────────────────────────
  // 로딩/빈 상태 판단
  // ──────────────────────────────────────────────
  const hasInboundCheckouts = inboundGroups.length > 0;
  const hasRentalImports =
    ((bffEnabled ? overviewData?.rental?.items : rentalImportsData?.data)?.length ?? 0) > 0;
  const hasInternalSharedImports =
    ((bffEnabled ? overviewData?.internalShared?.items : internalSharedImportsData?.data)?.length ??
      0) > 0;
  const isAnyLoading = bffEnabled
    ? overviewLoading
    : inboundCheckoutsLoading || rentalImportsLoading || internalSharedImportsLoading;
  const isAnyError = bffEnabled
    ? overviewError
    : inboundCheckoutsError || rentalImportsError || internalSharedImportsError;

  const rentalTotal = bffEnabled
    ? (overviewData?.rental?.meta?.totalItems ?? 0)
    : (rentalImportsData?.meta?.pagination?.total ?? rentalImportsData?.data?.length ?? 0);
  const internalTotal = bffEnabled
    ? (overviewData?.internalShared?.meta?.totalItems ?? 0)
    : (internalSharedImportsData?.meta?.pagination?.total ??
      internalSharedImportsData?.data?.length ??
      0);
  const inboundTotal = bffEnabled
    ? (overviewData?.standard?.meta?.totalItems ?? inboundGroups.length)
    : (inboundCheckoutsData?.meta?.pagination?.total ?? inboundGroups.length);

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────
  const renderSectionPagination = (
    currentPage: number,
    totalPages: number,
    isLoadingSection: boolean,
    onPageChange: (p: number) => void
  ) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || isLoadingSection}
        >
          {t('actions.previous')}
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || isLoadingSection}
        >
          {t('actions.next')}
        </Button>
      </div>
    );
  };

  // 전체 빈 상태: 모든 섹션 로딩 완료 + 에러 없음 + 3섹션 모두 비었을 때만
  // isAnyError 시 섹션별 ErrorState로 처리하므로 여기서 제외
  if (
    !isAnyLoading &&
    !isAnyError &&
    !hasInboundCheckouts &&
    !hasRentalImports &&
    !hasInternalSharedImports
  ) {
    return (
      <EmptyState
        variant={filterActive ? 'filtered' : 'no-data'}
        icon={filterActive ? FilterX : ClipboardList}
        title={filterActive ? t('empty.filtered.title') : t('empty.noData.title')}
        description={filterActive ? t('empty.filtered.description') : t('empty.noData.description')}
        secondaryAction={
          filterActive ? { label: t('actions.resetFilters'), onClick: onResetFilters } : undefined
        }
        testId={filterActive ? 'inbound-empty-state-filtered' : 'inbound-empty-state-no-data'}
      />
    );
  }

  const rentalTotalPages = bffEnabled
    ? (overviewData?.rental?.meta?.totalPages ?? 1)
    : (rentalImportsData?.meta?.pagination?.totalPages ?? 1);
  const internalTotalPages = bffEnabled
    ? (overviewData?.internalShared?.meta?.totalPages ?? 1)
    : (internalSharedImportsData?.meta?.pagination?.totalPages ?? 1);
  const inboundTotalPages = bffEnabled
    ? (overviewData?.standard?.meta?.totalPages ?? 1)
    : (inboundCheckoutsData?.meta?.pagination?.totalPages ?? 1);

  return (
    <div className="space-y-6">
      {/* 타팀 장비 대여 건 */}
      <div
        className={[
          CHECKOUT_INBOUND_SECTION_TOKENS.container,
          CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent.teamLoan,
        ].join(' ')}
      >
        <InboundSectionHeader
          variant="teamLoan"
          count={inboundTotal}
          isLoading={bffEnabled ? overviewLoading : inboundCheckoutsLoading}
        />

        {resolvedSparkline && resolvedSparkline.standard.length > 1 && (
          <SparklineMini values={resolvedSparkline.standard} trend="flat" variant="info" />
        )}

        {(bffEnabled ? overviewLoading : inboundCheckoutsLoading) ? (
          <CheckoutListSkeleton label={t('loading.teamLoan')} srOnly={t('loading.teamLoanSr')} />
        ) : (bffEnabled ? overviewError : inboundCheckoutsError) ? (
          <div className="p-6">
            <ErrorState
              title={t('inbound.sectionFetchError')}
              onRetry={() => void (bffEnabled ? refetchOverview() : refetchInbound())}
            />
          </div>
        ) : !hasInboundCheckouts ? (
          <EmptyState
            variant="no-data"
            icon={ClipboardList}
            title={t('inbound.noData')}
            description={t('inbound.noDataDesc')}
          />
        ) : (
          <>
            {inboundGroups.map((group) => (
              <CheckoutGroupCard
                key={group.key}
                group={group}
                onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
              />
            ))}
            {renderSectionPagination(
              inboundPage,
              inboundTotalPages,
              bffEnabled ? overviewLoading : inboundCheckoutsLoading,
              setInboundPage
            )}
          </>
        )}
      </div>

      {/* 외부 업체 렌탈 */}
      <div
        className={[
          CHECKOUT_INBOUND_SECTION_TOKENS.container,
          CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent.externalRental,
        ].join(' ')}
      >
        <InboundSectionHeader
          variant="externalRental"
          count={rentalTotal}
          isLoading={bffEnabled ? overviewLoading : rentalImportsLoading}
        />

        {resolvedSparkline && resolvedSparkline.rental.length > 1 && (
          <SparklineMini values={resolvedSparkline.rental} trend="flat" variant="info" />
        )}

        {(bffEnabled ? overviewLoading : rentalImportsLoading) ? (
          <CheckoutListSkeleton
            label={t('loading.externalRental')}
            srOnly={t('loading.externalRentalSr')}
          />
        ) : (bffEnabled ? overviewError : rentalImportsError) ? (
          <div className="p-6">
            <ErrorState
              title={t('inbound.sectionFetchError')}
              onRetry={() => void (bffEnabled ? refetchOverview() : refetchRental())}
            />
          </div>
        ) : !hasRentalImports ? (
          <EmptyState
            variant="no-data"
            icon={ClipboardList}
            title={t('inbound.noData')}
            description={t('inbound.noDataDesc')}
          />
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.equipmentName')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.classification')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.vendor')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.usagePeriod')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.status')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.requestDate')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {((bffEnabled ? overviewData?.rental?.items : rentalImportsData?.data) ?? []).map(
                    (item) => (
                      <TableRow
                        key={item.id}
                        className={[
                          CHECKOUT_INTERACTION_TOKENS.clickableRow,
                          PREMIUM_TABLE_TOKENS.stripe,
                        ].join(' ')}
                        onClick={() =>
                          router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))
                        }
                      >
                        <TableCell
                          className={[PREMIUM_TABLE_TOKENS.importantCol, 'line-clamp-1'].join(' ')}
                        >
                          {item.equipmentName}
                        </TableCell>
                        <TableCell>
                          {tEquip(
                            `classification.${item.classification}` as Parameters<typeof tEquip>[0]
                          )}
                        </TableCell>
                        <TableCell className="line-clamp-1">
                          {'vendorName' in item ? item.vendorName : '-'}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {fmtDate(item.usagePeriodStart)}
                          {' ~ '}
                          {fmtDate(item.usagePeriodEnd)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EquipmentImportStatusBadge
                              status={item.status as EquipmentImportStatus}
                            />
                            {item.status === EquipmentImportStatusValues.APPROVED && (
                              <Badge
                                variant="outline"
                                className={getSemanticBadgeClasses('warning')}
                              >
                                {t('inbound.receiveRequired')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">{fmtDate(item.createdAt)}</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </Card>
            {renderSectionPagination(
              rentalPage,
              rentalTotalPages,
              bffEnabled ? overviewLoading : rentalImportsLoading,
              setRentalPage
            )}
          </>
        )}
      </div>

      {/* 내부 공용장비 */}
      <div
        className={[
          CHECKOUT_INBOUND_SECTION_TOKENS.container,
          CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent.internalShared,
        ].join(' ')}
      >
        <InboundSectionHeader
          variant="internalShared"
          count={internalTotal}
          isLoading={bffEnabled ? overviewLoading : internalSharedImportsLoading}
        />

        {resolvedSparkline && resolvedSparkline.internalShared.length > 1 && (
          <SparklineMini values={resolvedSparkline.internalShared} trend="flat" variant="info" />
        )}

        {(bffEnabled ? overviewLoading : internalSharedImportsLoading) ? (
          <CheckoutListSkeleton
            label={t('loading.internalShared')}
            srOnly={t('loading.internalSharedSr')}
          />
        ) : (bffEnabled ? overviewError : internalSharedImportsError) ? (
          <div className="p-6">
            <ErrorState
              title={t('inbound.sectionFetchError')}
              onRetry={() => void (bffEnabled ? refetchOverview() : refetchInternal())}
            />
          </div>
        ) : !hasInternalSharedImports ? (
          <EmptyState
            variant="no-data"
            icon={ClipboardList}
            title={t('inbound.noData')}
            description={t('inbound.noDataDesc')}
          />
        ) : (
          <>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.equipmentName')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.classification')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.ownerDepartment')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.usagePeriod')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.status')}
                    </TableHead>
                    <TableHead className={PREMIUM_TABLE_TOKENS.stickyHeader}>
                      {t('inbound.requestDate')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    (bffEnabled
                      ? overviewData?.internalShared?.items
                      : internalSharedImportsData?.data) ?? []
                  ).map((item) => (
                    <TableRow
                      key={item.id}
                      className={[
                        CHECKOUT_INTERACTION_TOKENS.clickableRow,
                        PREMIUM_TABLE_TOKENS.stripe,
                      ].join(' ')}
                      onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))}
                    >
                      <TableCell
                        className={[PREMIUM_TABLE_TOKENS.importantCol, 'line-clamp-1'].join(' ')}
                      >
                        {item.equipmentName}
                      </TableCell>
                      <TableCell>
                        {tEquip(
                          `classification.${item.classification}` as Parameters<typeof tEquip>[0]
                        )}
                      </TableCell>
                      <TableCell className="line-clamp-1">
                        {'ownerDepartment' in item ? item.ownerDepartment || '-' : '-'}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {fmtDate(item.usagePeriodStart)}
                        {' ~ '}
                        {fmtDate(item.usagePeriodEnd)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <EquipmentImportStatusBadge
                            status={item.status as EquipmentImportStatus}
                          />
                          {item.status === EquipmentImportStatusValues.APPROVED && (
                            <Badge variant="outline" className={getSemanticBadgeClasses('warning')}>
                              {t('inbound.receiveRequired')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">{fmtDate(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            {renderSectionPagination(
              internalPage,
              internalTotalPages,
              bffEnabled ? overviewLoading : internalSharedImportsLoading,
              setInternalPage
            )}
          </>
        )}
      </div>
    </div>
  );
}
