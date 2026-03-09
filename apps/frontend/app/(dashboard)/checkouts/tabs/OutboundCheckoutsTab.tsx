'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  PackageCheck,
  PackageOpen,
  CheckCircle2,
} from 'lucide-react';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import {
  CHECKOUT_STATS_VARIANTS,
  CHECKOUT_STATS_CHECKED_OUT,
  CHECKOUT_STATS_RETURNED,
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
  CONTENT_TOKENS,
} from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
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

/** 반출 탭 통계 카드 데이터 정의 */
function useStatCards(summary: OutboundCheckoutsTabProps['summary']) {
  return [
    {
      key: 'total' as const,
      labelKey: 'outbound.totalCheckouts',
      subKey: 'outbound.totalSub',
      value: summary.total,
      icon: ClipboardList,
      filterStatus: 'all',
      variant: CHECKOUT_STATS_VARIANTS.total,
    },
    {
      key: 'pending' as const,
      labelKey: 'outbound.pendingApproval',
      subKey: 'outbound.pendingSub',
      value: summary.pending,
      icon: Clock,
      filterStatus: 'pending',
      variant: CHECKOUT_STATS_VARIANTS.pending,
    },
    {
      key: 'checkedOut' as const,
      labelKey: 'outbound.inProgress',
      subKey: 'outbound.inProgressSub',
      value: summary.approved,
      icon: PackageOpen,
      filterStatus:
        'checked_out,lender_checked,borrower_received,in_use,borrower_returned,lender_received',
      variant: CHECKOUT_STATS_CHECKED_OUT,
    },
    {
      key: 'overdue' as const,
      labelKey: 'outbound.overdue',
      subKey: 'outbound.overdueSub',
      value: summary.overdue,
      icon: AlertTriangle,
      filterStatus: 'overdue',
      variant: CHECKOUT_STATS_VARIANTS.overdue,
    },
    {
      key: 'returned' as const,
      labelKey: 'outbound.returnToday',
      subKey: 'outbound.returnedSub',
      value: summary.returnedToday,
      icon: PackageCheck,
      filterStatus: 'returned,return_approved',
      variant: CHECKOUT_STATS_RETURNED,
    },
  ];
}

/**
 * 반출 탭 컴포넌트
 *
 * v2 변경:
 * - 5개 통계 카드 (전체/승인대기/반출중/기한초과/반입완료)
 * - 기한 초과 그룹 최상단 고정 (overdue 그룹 id 부여)
 * - 인라인 승인 권한 (canApprove) 전달
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
  const { hasRole } = useAuth();
  const canApprove = hasRole(['technical_manager', 'lab_manager', 'system_admin']);

  const statCards = useStatCards(summary);

  // URL 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.replace(`${FRONTEND_ROUTES.CHECKOUTS.LIST}?${params.toString()}`, { scroll: false });
  };

  // ──────────────────────────────────────────────
  // 반출 목록 조회
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
  // 그룹화 + 기한 초과 그룹 최상단 고정
  // ──────────────────────────────────────────────
  const { overdueGroups, normalGroups } = useMemo(() => {
    if (!checkoutsData?.data) return { overdueGroups: [], normalGroups: [] };
    const all = groupCheckoutsByDateAndDestination(checkoutsData.data);
    const overdue = all.filter((g) => g.statuses.includes('overdue'));
    const normal = all.filter((g) => !g.statuses.includes('overdue'));
    return { overdueGroups: overdue, normalGroups: normal };
  }, [checkoutsData?.data]);

  const allGroups = [...overdueGroups, ...normalGroups];

  // ──────────────────────────────────────────────
  // 활성 필터 판단
  // ──────────────────────────────────────────────
  const isAllActive = filters.status === 'all' && filters.destination === 'all' && !filters.search;

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
      <Button variant="outline" onClick={onResetFilters}>
        {t('actions.resetFilters')}
      </Button>
    </div>
  );

  // ──────────────────────────────────────────────
  // 5개 통계 카드
  // ──────────────────────────────────────────────
  const renderStats = () => (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-5">
      {statCards.map((card) => {
        const isActive =
          card.filterStatus === 'all' ? isAllActive : filters.status === card.filterStatus;

        const cardClasses = [
          getCheckoutStatsClasses(
            card.key === 'total'
              ? 'total'
              : card.key === 'pending'
                ? 'pending'
                : card.key === 'overdue'
                  ? 'overdue'
                  : 'inProgress', // inProgress 폴백 — CHECKOUT_STATS_CHECKED_OUT/RETURNED는 직접 적용
            false // getCheckoutStatsClasses는 variant별로 partial — 별도 처리
          ),
          CHECKOUT_MOTION.statsCard,
        ].join(' ');

        // checkedOut / returned 는 custom variant (CHECKOUT_STATS_VARIANTS에 없음)
        const customVariant =
          card.key === 'checkedOut'
            ? CHECKOUT_STATS_CHECKED_OUT
            : card.key === 'returned'
              ? CHECKOUT_STATS_RETURNED
              : null;

        const finalCardClasses = customVariant
          ? [
              'cursor-pointer border-2',
              isActive
                ? `${customVariant.activeBorder} ${customVariant.activeBg}`
                : `border-transparent ${customVariant.hoverBorder}`,
              CHECKOUT_MOTION.statsCard,
            ].join(' ')
          : [
              getCheckoutStatsClasses(
                card.key === 'total' ? 'total' : card.key === 'pending' ? 'pending' : 'overdue',
                isActive
              ),
              CHECKOUT_MOTION.statsCard,
            ].join(' ');

        const IconComponent = card.icon;
        const iconColorClass = isActive
          ? (customVariant?.iconColor ??
            CHECKOUT_STATS_VARIANTS[
              card.key === 'total' ? 'total' : card.key === 'pending' ? 'pending' : 'overdue'
            ]?.iconColor ??
            'text-muted-foreground')
          : 'text-muted-foreground';

        return (
          <Card
            key={card.key}
            className={finalCardClasses}
            onClick={() =>
              card.filterStatus === 'all' ? onResetFilters() : onStatCardClick(card.filterStatus)
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {t(card.labelKey)}
              </CardTitle>
              <IconComponent
                className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`}
                aria-hidden="true"
              />
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div
                className={`text-2xl font-bold ${CONTENT_TOKENS.numeric.tabular} ${
                  card.key === 'overdue' && card.value > 0 ? 'text-brand-critical' : ''
                } ${card.key === 'pending' && card.value > 0 ? 'text-brand-warning' : ''}`}
              >
                {card.value}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t(card.subKey)}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  return (
    <>
      {renderStats()}

      <div className="space-y-3">
        {checkoutsLoading
          ? renderLoadingState()
          : allGroups.length === 0
            ? renderEmptyState()
            : allGroups.map((group) => (
                <div
                  key={group.key}
                  id={group.statuses.includes('overdue') ? 'overdue-group-section' : undefined}
                >
                  <CheckoutGroupCard
                    group={group}
                    onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
                    canApprove={canApprove}
                    isOverdueGroup={group.statuses.includes('overdue')}
                  />
                </div>
              ))}
      </div>

      {/* 페이지네이션 */}
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
