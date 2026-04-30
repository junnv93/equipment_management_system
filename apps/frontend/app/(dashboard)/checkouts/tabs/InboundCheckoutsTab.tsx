'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useNavigateWithPending } from '@/hooks/use-navigate-with-pending';
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
import checkoutApi from '@/lib/api/checkout-api';
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

interface InboundCheckoutsTabProps {
  filters: UICheckoutFilters;
  onResetFilters: () => void;
}

/**
 * 반입 탭 컴포넌트
 *
 * BFF 단일 집계 API 경로 사용 (canary flag 제거됨).
 * teamId 파라미터 제거 — 백엔드가 JWT에서 역할 기반 필터링 수행.
 * 3섹션: 타팀 대여 · 외부 렌탈 · 내부 공용
 */
export default function InboundCheckoutsTab({ filters, onResetFilters }: InboundCheckoutsTabProps) {
  const t = useTranslations('checkouts');
  const tEquip = useTranslations('equipment');
  const navigateWithPending = useNavigateWithPending();
  const { fmtDate } = useDateFormatter();
  const { inboundPage, rentalPage, internalPage, setInboundPage, setRentalPage, setInternalPage } =
    useInboundSectionPagination();

  const handleCheckoutClick = useCallback(
    (id: string) => navigateWithPending(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id)),
    [navigateWithPending]
  );

  const { status: statusFilter, search: searchTerm } = filters;
  const filterActive = countActiveFilters(filters) > 0;

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
    ...QUERY_CONFIG.CHECKOUT_LIST,
  });

  const inboundGroups = useMemo(() => {
    const items = overviewData?.standard?.items;
    if (!items) return [];
    return groupCheckoutsByDateAndDestination(items);
  }, [overviewData?.standard]);

  const hasInboundCheckouts = inboundGroups.length > 0;
  const hasRentalImports = (overviewData?.rental?.items?.length ?? 0) > 0;
  const hasInternalSharedImports = (overviewData?.internalShared?.items?.length ?? 0) > 0;

  const rentalTotal = overviewData?.rental?.meta?.totalItems ?? 0;
  const internalTotal = overviewData?.internalShared?.meta?.totalItems ?? 0;
  const inboundTotal = overviewData?.standard?.meta?.totalItems ?? inboundGroups.length;

  const rentalTotalPages = overviewData?.rental?.meta?.totalPages ?? 1;
  const internalTotalPages = overviewData?.internalShared?.meta?.totalPages ?? 1;
  const inboundTotalPages = overviewData?.standard?.meta?.totalPages ?? 1;

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

  if (
    !overviewLoading &&
    !overviewError &&
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

  return (
    <div className="space-y-6">
      {/* 타팀 장비 대여 건 */}
      <div
        className={[
          CHECKOUT_INBOUND_SECTION_TOKENS.container,
          CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent.teamLoan,
        ].join(' ')}
      >
        <InboundSectionHeader variant="teamLoan" count={inboundTotal} isLoading={overviewLoading} />

        {overviewData?.sparkline && overviewData.sparkline.standard.length > 1 && (
          <SparklineMini values={overviewData.sparkline.standard} trend="flat" variant="info" />
        )}

        {overviewLoading ? (
          <CheckoutListSkeleton label={t('loading.teamLoan')} srOnly={t('loading.teamLoanSr')} />
        ) : overviewError ? (
          <div className="p-6">
            <ErrorState
              title={t('inbound.sectionFetchError')}
              onRetry={() => void refetchOverview()}
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
                onCheckoutClick={handleCheckoutClick}
              />
            ))}
            {renderSectionPagination(
              inboundPage,
              inboundTotalPages,
              overviewLoading,
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
          isLoading={overviewLoading}
        />

        {overviewData?.sparkline && overviewData.sparkline.rental.length > 1 && (
          <SparklineMini values={overviewData.sparkline.rental} trend="flat" variant="info" />
        )}

        {overviewLoading ? (
          <CheckoutListSkeleton
            label={t('loading.externalRental')}
            srOnly={t('loading.externalRentalSr')}
          />
        ) : overviewError ? (
          <div className="p-6">
            <ErrorState
              title={t('inbound.sectionFetchError')}
              onRetry={() => void refetchOverview()}
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
                  {(overviewData?.rental?.items ?? []).map((item) => (
                    <TableRow
                      key={item.id}
                      className={[
                        CHECKOUT_INTERACTION_TOKENS.clickableRow,
                        PREMIUM_TABLE_TOKENS.stripe,
                      ].join(' ')}
                      onClick={() =>
                        navigateWithPending(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))
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
            {renderSectionPagination(rentalPage, rentalTotalPages, overviewLoading, setRentalPage)}
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
          isLoading={overviewLoading}
        />

        {overviewData?.sparkline && overviewData.sparkline.internalShared.length > 1 && (
          <SparklineMini
            values={overviewData.sparkline.internalShared}
            trend="flat"
            variant="info"
          />
        )}

        {overviewLoading ? (
          <CheckoutListSkeleton
            label={t('loading.internalShared')}
            srOnly={t('loading.internalSharedSr')}
          />
        ) : overviewError ? (
          <div className="p-6">
            <ErrorState
              title={t('inbound.sectionFetchError')}
              onRetry={() => void refetchOverview()}
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
                  {(overviewData?.internalShared?.items ?? []).map((item) => (
                    <TableRow
                      key={item.id}
                      className={[
                        CHECKOUT_INTERACTION_TOKENS.clickableRow,
                        PREMIUM_TABLE_TOKENS.stripe,
                      ].join(' ')}
                      onClick={() =>
                        navigateWithPending(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))
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
              overviewLoading,
              setInternalPage
            )}
          </>
        )}
      </div>
    </div>
  );
}
