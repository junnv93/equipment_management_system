'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useNavigateWithPending } from '@/hooks/use-navigate-with-pending';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
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
import { CheckoutInboundBulkActionBar } from '@/components/checkouts/CheckoutInboundBulkActionBar';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { useAuth } from '@/hooks/use-auth';
import { useRowSelection } from '@/hooks/use-bulk-selection';
import { useCheckoutBulkReceiveMutation } from '@/hooks/use-checkout-bulk-receive-mutation';
import { applyGroupToggle } from '@/lib/checkouts/group-selection';
import checkoutApi, { type Checkout } from '@/lib/api/checkout-api';
import {
  type EquipmentImportStatus,
  EquipmentImportStatusValues,
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import CheckoutListTabs from '@/components/checkouts/CheckoutListTabs';
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
import {
  buildInboundOverviewQuery,
  countActiveFilters,
  filtersToSearchParams,
  IMPORT_SUBTAB_STATUS_GROUPS,
  type UICheckoutFilters,
  type CheckoutSubTab,
} from '@/lib/utils/checkout-filter-utils';

interface InboundCheckoutsTabProps {
  filters: UICheckoutFilters;
  onResetFilters: () => void;
}

/**
 * 반입 탭 컴포넌트 — BFF 단일 집계 API 전용
 *
 * BFF는 섹션당 limitPerSection개의 미리보기 데이터만 반환하므로
 * 섹션별 페이지네이션을 지원하지 않음. 전체 건수는 InboundSectionHeader에서 표시.
 * 3섹션: 타팀 대여 · 외부 렌탈 · 내부 공용
 */
export default function InboundCheckoutsTab({ filters, onResetFilters }: InboundCheckoutsTabProps) {
  const t = useTranslations('checkouts');
  const tEquip = useTranslations('equipment');
  const navigateWithPending = useNavigateWithPending();
  const router = useRouter();
  const { fmtDate } = useDateFormatter();
  const { can } = useAuth();

  const handleCheckoutClick = useCallback(
    (id: string) => navigateWithPending(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id)),
    [navigateWithPending]
  );

  const { subTab } = filters;
  const filterActive = countActiveFilters(filters) > 0;

  const canReceiveCheckout = can(Permission.COMPLETE_CHECKOUT);

  const handleSubTabChange = useCallback(
    (newSubTab: CheckoutSubTab) => {
      const params = filtersToSearchParams({
        ...filters,
        subTab: newSubTab,
        status: 'all',
        page: 1,
      });
      const qs = params.toString();
      router.replace(
        qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST,
        { scroll: false }
      );
    },
    [filters, router]
  );

  const inboundOverviewQuery = useMemo(() => buildInboundOverviewQuery(filters), [filters]);

  const {
    data: overviewData,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: queryKeys.checkouts.view.inboundOverview(inboundOverviewQuery),
    queryFn: () => checkoutApi.getInboundOverview(inboundOverviewQuery),
    ...QUERY_CONFIG.CHECKOUT_LIST,
  });

  const standardItems: readonly Checkout[] = useMemo(
    () => overviewData?.standard?.items ?? [],
    [overviewData?.standard?.items]
  );

  const inboundGroups = useMemo(() => {
    if (standardItems.length === 0) return [];
    return groupCheckoutsByDateAndDestination(standardItems);
  }, [standardItems]);

  // Bulk selection — 타팀 장비 대여(standard) 섹션 전용
  // resetOn: filters 직접 전달 — useRowSelection 내부가 JSON.stringify(resetOn) 처리
  const selection = useRowSelection<Checkout>(standardItems, (c) => c.id, {
    isSelectable: (c) =>
      c.status === CSVal.LENDER_CHECKED && (c.meta?.availableActions?.canBorrowerApprove ?? false),
    resetOn: [filters],
  });

  const { isPending: isBulkPending, handleBulkReceive } = useCheckoutBulkReceiveMutation({
    selection,
  });

  // CheckoutGroupCard 그룹·행 토글 핸들러 — SSOT 헬퍼 (lib/checkouts/group-selection.ts)
  const handleToggleGroup = useCallback(
    (rowIds: readonly string[], allCurrentlySelected: boolean) => {
      applyGroupToggle(selection, standardItems, rowIds, allCurrentlySelected);
    },
    [standardItems, selection]
  );

  const handleToggleRow = useCallback(
    (rowId: string) => {
      const item = standardItems.find((c) => c.id === rowId);
      if (item) selection.toggle(rowId, item);
    },
    [standardItems, selection]
  );

  // isRowSelectable predicate: lender_checked + rental purpose + borrower 권한 보유 행만 체크박스 노출
  // purpose === RENTAL 명시적 가드: standard 섹션이 direction=INBOUND만 필터하므로
  // calibration/repair 방향 inbound 건이 포함될 수 있음 — FSM상 해당 건은 borrower_receive 불가
  const isRowSelectable = useCallback(
    (row: { status: string; purpose: string; canBorrowerApproveItem: boolean }) =>
      row.status === CSVal.LENDER_CHECKED &&
      row.purpose === CPVal.RENTAL &&
      row.canBorrowerApproveItem,
    []
  );

  // rental/internalShared: BFF는 EquipmentImportStatus 다중값 무시 → 클라이언트 필터
  const filteredRentalItems = useMemo(() => {
    const statuses = IMPORT_SUBTAB_STATUS_GROUPS[subTab] as string[];
    return (overviewData?.rental?.items ?? []).filter((item) => statuses.includes(item.status));
  }, [overviewData?.rental?.items, subTab]);
  const filteredInternalItems = useMemo(() => {
    const statuses = IMPORT_SUBTAB_STATUS_GROUPS[subTab] as string[];
    return (overviewData?.internalShared?.items ?? []).filter((item) =>
      statuses.includes(item.status)
    );
  }, [overviewData?.internalShared?.items, subTab]);

  const hasInboundCheckouts = inboundGroups.length > 0;
  const hasRentalImports = filteredRentalItems.length > 0;
  const hasInternalSharedImports = filteredInternalItems.length > 0;

  const inboundTotal = overviewData?.standard?.meta?.totalItems ?? inboundGroups.length;
  const rentalTotal = filteredRentalItems.length;
  const internalTotal = filteredInternalItems.length;

  // 타팀 장비 대여 섹션 — 현재 페이지 장비 대수 (OutboundCheckoutsTab과 동일 방식)
  const inboundEquipmentCount = useMemo(
    () => inboundGroups.reduce((sum, g) => sum + g.totalEquipment, 0),
    [inboundGroups]
  );

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
    <div className="space-y-4">
      {/* 진행 중 / 완료 서브탭 */}
      <CheckoutListTabs
        currentSubTab={subTab}
        onSubTabChange={handleSubTabChange}
        currentCount={inboundTotal}
        currentEquipmentCount={inboundEquipmentCount}
      />

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
            isLoading={overviewLoading}
          />

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
            inboundGroups.map((group) => (
              <CheckoutGroupCard
                key={group.key}
                group={group}
                onCheckoutClick={handleCheckoutClick}
                selectedRowIds={canReceiveCheckout ? selection.selected : undefined}
                onToggleGroup={canReceiveCheckout ? handleToggleGroup : undefined}
                onToggleRow={canReceiveCheckout ? handleToggleRow : undefined}
                isRowSelectable={canReceiveCheckout ? isRowSelectable : undefined}
              />
            ))
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
                  {filteredRentalItems.map((item) => (
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
                  {filteredInternalItems.map((item) => (
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
          )}
        </div>
      </div>

      {/* 타팀 장비 대여 bulk action bar — canReceiveCheckout + selection 조건부 렌더 */}
      {canReceiveCheckout && (
        <CheckoutInboundBulkActionBar
          selectedCount={selection.count}
          totalCount={standardItems.length}
          isAllPageSelected={selection.isAllPageSelected}
          isIndeterminate={selection.isIndeterminate}
          onSelectAll={selection.selectAllOnPage}
          onClearSelection={selection.clear}
          onBulkReceive={handleBulkReceive}
          isPending={isBulkPending}
        />
      )}
    </div>
  );
}
