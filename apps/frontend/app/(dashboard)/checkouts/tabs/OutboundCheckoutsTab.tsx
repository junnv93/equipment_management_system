'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import {
  CHECKOUT_STATS_VARIANTS,
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
} from '@/lib/design-tokens';
import { CONTENT_TOKENS } from '@/lib/design-tokens';
import {
  convertFiltersToApiParams,
  type UICheckoutFilters,
} from '@/lib/utils/checkout-filter-utils';

interface OutboundCheckoutsTabProps {
  teamId?: string;
  filters: UICheckoutFilters;
  summary: {
    total: number;
    pending: number;
    approved: number;
    overdue: number;
    returnedToday: number;
  };
  onStatCardClick: (status: string) => void;
  onResetFilters: () => void;
}

/**
 * 반출 탭 컴포넌트
 * ✅ 코드 분할: 반출 관련 로직만 포함 (Bundle size optimization)
 * ✅ URL SSOT: 페이지네이션 포함 모든 필터를 URL에서 읽음
 */
export default function OutboundCheckoutsTab({
  teamId,
  filters,
  summary,
  onStatCardClick,
  onResetFilters,
}: OutboundCheckoutsTabProps) {
  const t = useTranslations('checkouts');
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.replace(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?${params.toString()}`, { scroll: false });
  };

  // ──────────────────────────────────────────────
  // 반출 목록 조회 (URL 필터 기반)
  // ──────────────────────────────────────────────
  const apiParams = convertFiltersToApiParams(filters);
  const { data: checkoutsData, isLoading: checkoutsLoading } = useQuery({
    queryKey: queryKeys.checkouts.list({
      direction: 'outbound',
      ...apiParams,
      teamId,
    }),
    queryFn: async () => {
      const query: CheckoutQuery = {
        page: apiParams.page,
        pageSize: apiParams.pageSize,
        search: apiParams.search,
        teamId,
        direction: 'outbound',
        includeSummary: true,
        statuses: apiParams.statuses,
        destination: apiParams.destination,
        purpose: apiParams.purpose,
      };
      return checkoutApi.getCheckouts(query);
    },
    staleTime: CACHE_TIMES.SHORT,
  });

  // ──────────────────────────────────────────────
  // 그룹화
  // ──────────────────────────────────────────────
  const outboundGroups = useMemo(() => {
    if (!checkoutsData?.data) return [];
    return groupCheckoutsByDateAndDestination(checkoutsData.data);
  }, [checkoutsData?.data]);

  // ──────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────
  const renderLoadingState = () => (
    <>
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
    </>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ClipboardList className="h-12 w-12 text-brand-text-muted mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-brand-text-primary">{t('outbound.noData')}</h3>
      <p className="text-sm text-brand-text-muted mt-2 mb-4">{t('outbound.noDataDesc')}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onResetFilters}>
          {t('actions.resetFilters')}
        </Button>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────
  // 통계 카드
  // ──────────────────────────────────────────────
  const renderStats = () => {
    const isAllActive =
      filters.status === 'all' && filters.destination === 'all' && !filters.search;
    const isPendingActive = filters.status === 'pending';
    const isOverdueActive = filters.status === 'overdue';
    const isInProgressActive =
      filters.status ===
      'checked_out,lender_checked,borrower_received,in_use,borrower_returned,lender_received';

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card
          className={`${getCheckoutStatsClasses('total', isAllActive)} ${CHECKOUT_MOTION.statsCard}`}
          onClick={() => {
            onResetFilters();
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('outbound.totalCheckouts')}</CardTitle>
            <ClipboardList
              className={`h-4 w-4 ${isAllActive ? CHECKOUT_STATS_VARIANTS.total.iconColor : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${CONTENT_TOKENS.numeric.tabular}`}>
              {summary.total}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`${getCheckoutStatsClasses('pending', isPendingActive)} ${CHECKOUT_MOTION.statsCard}`}
          onClick={() => onStatCardClick('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('outbound.pendingApproval')}</CardTitle>
            <Clock
              className={`h-4 w-4 ${isPendingActive ? CHECKOUT_STATS_VARIANTS.pending.iconColor : 'text-brand-warning'}`}
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${CONTENT_TOKENS.numeric.tabular}`}>
              {summary.pending}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`${getCheckoutStatsClasses('overdue', isOverdueActive)} ${CHECKOUT_MOTION.statsCard}`}
          onClick={() => onStatCardClick('overdue')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('outbound.overdue')}</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${isOverdueActive ? CHECKOUT_STATS_VARIANTS.overdue.iconColor : 'text-brand-critical'}`}
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${CONTENT_TOKENS.numeric.tabular}`}>
              {summary.overdue}
            </div>
          </CardContent>
        </Card>
        <Card
          className={`${getCheckoutStatsClasses('inProgress', isInProgressActive)} ${CHECKOUT_MOTION.statsCard}`}
          onClick={() =>
            onStatCardClick(
              'checked_out,lender_checked,borrower_received,in_use,borrower_returned,lender_received'
            )
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('outbound.returnToday')}</CardTitle>
            <Clock
              className={`h-4 w-4 ${isInProgressActive ? CHECKOUT_STATS_VARIANTS.inProgress.iconColor : 'text-brand-purple'}`}
              aria-hidden="true"
            />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${CONTENT_TOKENS.numeric.tabular}`}>
              {summary.returnedToday}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  return (
    <>
      {/* 통계 카드 */}
      {renderStats()}

      {/* 목록 */}
      <div className="space-y-3">
        {checkoutsLoading
          ? renderLoadingState()
          : outboundGroups.length === 0
            ? renderEmptyState()
            : outboundGroups.map((group) => (
                <CheckoutGroupCard
                  key={group.key}
                  group={group}
                  onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
                />
              ))}
      </div>

      {/* 페이지네이션 (URL 기반) */}
      {checkoutsData && checkoutsData.meta.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
            disabled={filters.page === 1 || checkoutsLoading}
          >
            {t('actions.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {filters.page} / {checkoutsData.meta.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePageChange(Math.min(checkoutsData.meta.pagination.totalPages, filters.page + 1))
            }
            disabled={filters.page === checkoutsData.meta.pagination.totalPages || checkoutsLoading}
          >
            {t('actions.next')}
          </Button>
        </div>
      )}
    </>
  );
}
