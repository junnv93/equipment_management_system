'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Clock, AlertTriangle, PackageCheck, PackageOpen } from 'lucide-react';
import checkoutApi, { type CheckoutQuery } from '@/lib/api/checkout-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import {
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
  CONTENT_TOKENS,
  CHECKOUT_STATS_VARIANTS,
  CHECKOUT_PAGINATION_TOKENS,
  type CheckoutStatsVariant,
} from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
import {
  convertFiltersToApiParams,
  type UICheckoutFilters,
} from '@/lib/utils/checkout-filter-utils';
import {
  getCheckoutStatusGroupFilterValue,
  UserRoleValues as URVal,
} from '@equipment-management/schemas';

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
      variantKey: 'total' as CheckoutStatsVariant,
      labelKey: 'outbound.totalCheckouts',
      subKey: 'outbound.totalSub',
      value: summary.total,
      icon: ClipboardList,
      filterStatus: 'all',
      dotColor: 'bg-brand-info',
    },
    {
      variantKey: 'pending' as CheckoutStatsVariant,
      labelKey: 'outbound.pendingApproval',
      subKey: 'outbound.pendingSub',
      value: summary.pending,
      icon: Clock,
      filterStatus: 'pending',
      dotColor: 'bg-brand-warning',
    },
    {
      variantKey: 'checkedOut' as CheckoutStatsVariant,
      labelKey: 'outbound.inProgress',
      subKey: 'outbound.inProgressSub',
      value: summary.approved,
      icon: PackageOpen,
      filterStatus: getCheckoutStatusGroupFilterValue('in_progress'),
      dotColor: 'bg-brand-purple',
    },
    {
      variantKey: 'overdue' as CheckoutStatsVariant,
      labelKey: 'outbound.overdue',
      subKey: 'outbound.overdueSub',
      value: summary.overdue,
      icon: AlertTriangle,
      filterStatus: 'overdue',
      dotColor: 'bg-brand-critical',
    },
    {
      variantKey: 'returned' as CheckoutStatsVariant,
      labelKey: 'outbound.returnToday',
      subKey: 'outbound.returnedSub',
      value: summary.returnedToday,
      icon: PackageCheck,
      filterStatus: getCheckoutStatusGroupFilterValue('completed'),
      dotColor: 'bg-brand-ok',
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
  const canApprove = hasRole([URVal.TECHNICAL_MANAGER, URVal.LAB_MANAGER, URVal.SYSTEM_ADMIN]);

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
        checkoutFrom: apiParams.checkoutFrom,
        checkoutTo: apiParams.checkoutTo,
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
  const isAllActive =
    filters.status === 'all' &&
    filters.destination === 'all' &&
    filters.period === 'all' &&
    !filters.search;

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

        const finalCardClasses = [
          getCheckoutStatsClasses(card.variantKey, isActive),
          CHECKOUT_MOTION.statsCard,
        ].join(' ');

        const IconComponent = card.icon;
        const iconColorClass = isActive
          ? CHECKOUT_STATS_VARIANTS[card.variantKey].iconColor
          : 'text-muted-foreground';

        return (
          <Card
            key={card.variantKey}
            className={finalCardClasses}
            onClick={() =>
              card.filterStatus === 'all' ? onResetFilters() : onStatCardClick(card.filterStatus)
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${card.dotColor}`}
                  aria-hidden="true"
                />
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
                  card.variantKey === 'overdue' && card.value > 0 ? 'text-brand-critical' : ''
                } ${card.variantKey === 'pending' && card.value > 0 ? 'text-brand-warning' : ''}`}
              >
                {card.value}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t(card.subKey)}</p>
              {isActive && (
                <p className="text-[9px] text-primary font-semibold mt-1">
                  {t('outbound.activeFilter')}
                </p>
              )}
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
      {checkoutsData &&
        checkoutsData.meta.pagination.totalPages > 1 &&
        (() => {
          const totalPages = checkoutsData.meta.pagination.totalPages;
          const current = filters.page;

          // 표시할 페이지 번호 배열 계산 (최대 5개, 현재 페이지 중심)
          const pageNumbers: number[] = [];
          const delta = 2;
          const left = Math.max(1, current - delta);
          const right = Math.min(totalPages, current + delta);
          for (let i = left; i <= right; i++) pageNumbers.push(i);

          return (
            <div className={CHECKOUT_PAGINATION_TOKENS.container}>
              <p className={CHECKOUT_PAGINATION_TOKENS.info}>
                {t('outbound.paginationInfo', {
                  total: checkoutsData.meta.pagination.total,
                  from: (current - 1) * (checkoutsData.meta.pagination.pageSize ?? 10) + 1,
                  to: Math.min(
                    current * (checkoutsData.meta.pagination.pageSize ?? 10),
                    checkoutsData.meta.pagination.total
                  ),
                })}
              </p>
              <div className={CHECKOUT_PAGINATION_TOKENS.buttons}>
                {/* 이전 */}
                <button
                  type="button"
                  className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${
                    current === 1
                      ? CHECKOUT_PAGINATION_TOKENS.btn.disabled
                      : CHECKOUT_PAGINATION_TOKENS.btn.default
                  }`}
                  onClick={() => current > 1 && handlePageChange(current - 1)}
                  disabled={current === 1 || checkoutsLoading}
                  aria-label={t('actions.previous')}
                >
                  ‹
                </button>

                {/* 첫 페이지 + 줄임표 */}
                {left > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${CHECKOUT_PAGINATION_TOKENS.btn.default}`}
                      onClick={() => handlePageChange(1)}
                    >
                      1
                    </button>
                    {left > 2 && <span className={CHECKOUT_PAGINATION_TOKENS.ellipsis}>…</span>}
                  </>
                )}

                {/* 페이지 번호 */}
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${
                      p === current
                        ? CHECKOUT_PAGINATION_TOKENS.btn.active
                        : CHECKOUT_PAGINATION_TOKENS.btn.default
                    }`}
                    onClick={() => p !== current && handlePageChange(p)}
                    aria-current={p === current ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}

                {/* 끝 페이지 + 줄임표 */}
                {right < totalPages && (
                  <>
                    {right < totalPages - 1 && (
                      <span className={CHECKOUT_PAGINATION_TOKENS.ellipsis}>…</span>
                    )}
                    <button
                      type="button"
                      className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${CHECKOUT_PAGINATION_TOKENS.btn.default}`}
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* 다음 */}
                <button
                  type="button"
                  className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${
                    current === totalPages
                      ? CHECKOUT_PAGINATION_TOKENS.btn.disabled
                      : CHECKOUT_PAGINATION_TOKENS.btn.default
                  }`}
                  onClick={() => current < totalPages && handlePageChange(current + 1)}
                  disabled={current === totalPages || checkoutsLoading}
                  aria-label={t('actions.next')}
                >
                  ›
                </button>
              </div>
            </div>
          );
        })()}
    </>
  );
}
