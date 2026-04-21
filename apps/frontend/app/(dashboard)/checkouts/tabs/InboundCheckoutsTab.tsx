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
import { EmptyState } from '@/components/shared/EmptyState';
import { InboundSectionHeader } from '@/components/checkouts/InboundSectionHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useInboundSectionPagination } from '@/hooks/use-inbound-section-pagination';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import equipmentImportApi from '@/lib/api/equipment-import-api';
import {
  type EquipmentImportStatus,
  EquipmentImportStatusValues,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES, DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { EquipmentImportStatusBadge } from '@/components/equipment-imports';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import {
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_INBOUND_SECTION_TOKENS,
  PREMIUM_TABLE_TOKENS,
  getSemanticBadgeClasses,
} from '@/lib/design-tokens';
import type { UICheckoutFilters } from '@/lib/utils/checkout-filter-utils';

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
  const { rentalPage, internalPage, setRentalPage, setInternalPage } =
    useInboundSectionPagination();

  const { status: statusFilter, search: searchTerm } = filters;
  const filterActive = statusFilter !== 'all' || !!searchTerm;

  // ──────────────────────────────────────────────
  // 반입: 타팀 장비 대여 건 (페이지네이션 — 기존 URL page 파라미터)
  // ──────────────────────────────────────────────
  const { data: inboundCheckoutsData, isLoading: inboundCheckoutsLoading } = useQuery({
    queryKey: queryKeys.checkouts.inbound({ statusFilter, searchTerm, teamId, page: filters.page }),
    queryFn: async () => {
      const query: CheckoutQuery = {
        page: filters.page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: searchTerm || undefined,
        teamId,
        direction: 'inbound',
      };
      if (statusFilter !== 'all') query.statuses = statusFilter;
      return checkoutApi.getCheckouts(query);
    },
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 반입: 외부 업체 렌탈 (독립 페이지네이션)
  // ──────────────────────────────────────────────
  const { data: rentalImportsData, isLoading: rentalImportsLoading } = useQuery({
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
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 반입: 내부 공용장비 (독립 페이지네이션)
  // ──────────────────────────────────────────────
  const { data: internalSharedImportsData, isLoading: internalSharedImportsLoading } = useQuery({
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
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 그룹화
  // ──────────────────────────────────────────────
  const inboundGroups = useMemo(() => {
    if (!inboundCheckoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(inboundCheckoutsData.data);
  }, [inboundCheckoutsData?.data]);

  // ──────────────────────────────────────────────
  // 로딩/빈 상태 판단
  // ──────────────────────────────────────────────
  const hasInboundCheckouts = inboundGroups.length > 0;
  const hasRentalImports = (rentalImportsData?.data?.length ?? 0) > 0;
  const hasInternalSharedImports = (internalSharedImportsData?.data?.length ?? 0) > 0;
  const isLoading = inboundCheckoutsLoading || rentalImportsLoading || internalSharedImportsLoading;

  const rentalTotal =
    rentalImportsData?.meta?.pagination?.total ?? rentalImportsData?.data?.length ?? 0;
  const internalTotal =
    internalSharedImportsData?.meta?.pagination?.total ??
    internalSharedImportsData?.data?.length ??
    0;
  const inboundTotal = inboundCheckoutsData?.meta?.pagination?.total ?? inboundGroups.length;

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────
  const renderLoadingState = () => (
    <div aria-busy="true" aria-label="반입 목록 로딩 중">
      <span className="sr-only">반입 목록을 불러오는 중입니다.</span>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-[60px]" />
              <Skeleton className="h-5 w-[50px]" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

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

  if (isLoading) return renderLoadingState();

  // 전체 빈 상태: 3섹션 모두 비었을 때만
  if (!hasInboundCheckouts && !hasRentalImports && !hasInternalSharedImports) {
    return (
      <EmptyState
        variant={filterActive ? 'filtered' : 'no-data'}
        icon={filterActive ? FilterX : ClipboardList}
        title={filterActive ? t('empty.filtered.title') : t('empty.noData.title')}
        description={filterActive ? t('empty.filtered.description') : t('empty.noData.description')}
        secondaryAction={
          filterActive ? { label: t('actions.resetFilters'), onClick: onResetFilters } : undefined
        }
      />
    );
  }

  const rentalTotalPages = rentalImportsData?.meta?.pagination?.totalPages ?? 1;
  const internalTotalPages = internalSharedImportsData?.meta?.pagination?.totalPages ?? 1;
  const inboundTotalPages = inboundCheckoutsData?.meta?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* 타팀 장비 대여 건 */}
      <div
        className={[
          CHECKOUT_INBOUND_SECTION_TOKENS.container,
          CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent.teamLoan,
          'pl-4',
        ].join(' ')}
      >
        <InboundSectionHeader
          variant="teamLoan"
          count={inboundTotal}
          isLoading={inboundCheckoutsLoading}
        />

        {inboundCheckoutsLoading ? (
          renderLoadingState()
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
              filters.page,
              inboundTotalPages,
              inboundCheckoutsLoading,
              (page) => {
                const params = new URLSearchParams(window.location.search);
                params.set('page', String(page));
                router.replace(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?${params.toString()}`, {
                  scroll: false,
                });
              }
            )}
          </>
        )}
      </div>

      {/* 외부 업체 렌탈 */}
      <div
        className={[
          CHECKOUT_INBOUND_SECTION_TOKENS.container,
          CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent.externalRental,
          'pl-4',
        ].join(' ')}
      >
        <InboundSectionHeader
          variant="externalRental"
          count={rentalTotal}
          isLoading={rentalImportsLoading}
        />

        {rentalImportsLoading ? (
          renderLoadingState()
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
                  {rentalImportsData!.data.map((item) => (
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
                      <TableCell className="line-clamp-1">{item.vendorName}</TableCell>
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
              rentalPage,
              rentalTotalPages,
              rentalImportsLoading,
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
          'pl-4',
        ].join(' ')}
      >
        <InboundSectionHeader
          variant="internalShared"
          count={internalTotal}
          isLoading={internalSharedImportsLoading}
        />

        {internalSharedImportsLoading ? (
          renderLoadingState()
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
                    <TableHead>{t('inbound.equipmentName')}</TableHead>
                    <TableHead>{t('inbound.classification')}</TableHead>
                    <TableHead>{t('inbound.ownerDepartment')}</TableHead>
                    <TableHead>{t('inbound.usagePeriod')}</TableHead>
                    <TableHead>{t('inbound.status')}</TableHead>
                    <TableHead>{t('inbound.requestDate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalSharedImportsData!.data.map((item) => (
                    <TableRow
                      key={item.id}
                      className={CHECKOUT_INTERACTION_TOKENS.clickableRow}
                      onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(item.id))}
                    >
                      <TableCell className="font-medium line-clamp-1">
                        {item.equipmentName}
                      </TableCell>
                      <TableCell>
                        {tEquip(
                          `classification.${item.classification}` as Parameters<typeof tEquip>[0]
                        )}
                      </TableCell>
                      <TableCell className="line-clamp-1">{item.ownerDepartment || '-'}</TableCell>
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
              internalSharedImportsLoading,
              setInternalPage
            )}
          </>
        )}
      </div>
    </div>
  );
}
