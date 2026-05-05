'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNavigateWithPending } from '@/hooks/use-navigate-with-pending';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Clock, AlertTriangle, PackageCheck, PackageOpen } from 'lucide-react';

import { HeroKPI } from '@/components/checkouts/HeroKPI';
import { SparklineMini } from '@/components/checkouts/SparklineMini';
import { EmptyState } from '@/components/shared/EmptyState';
import CheckoutEmptyState from '@/components/checkouts/CheckoutEmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import checkoutApi, { type CheckoutQuery, type Checkout } from '@/lib/api/checkout-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { CheckoutCacheInvalidation } from '@/lib/api/cache-invalidation';
import {
  FRONTEND_ROUTES,
  Permission,
  DEFAULT_PAGE_SIZE,
} from '@equipment-management/shared-constants';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { CheckoutBulkActionBar } from '@/components/checkouts/CheckoutBulkActionBar';
import { CheckoutListSkeleton } from '@/components/checkouts/CheckoutListSkeleton';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import { useToast } from '@/components/ui/use-toast';
import { useRowSelection } from '@/hooks/use-bulk-selection';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { applyGroupToggle } from '@/lib/checkouts/group-selection';
import { track } from '@/lib/analytics/track';
import {
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
  CHECKOUT_STATS_VARIANTS,
  CHECKOUT_STATS_ALERT_THRESHOLD,
  CHECKOUT_PAGINATION_TOKENS,
  getStatsGridClass,
  MICRO_TYPO,
  SECTION_RHYTHM_TOKENS,
  TYPOGRAPHY_TOKENS,
  CHECKOUT_ICON_MAP,
  type CheckoutStatsVariant,
} from '@/lib/design-tokens';
import { selectHeroVariant } from '@/lib/utils/checkout-hero-selector';
import { useAuth } from '@/hooks/use-auth';
import {
  convertFiltersToApiParams,
  filtersToSearchParams,
  countActiveFilters,
  type UICheckoutFilters,
  type CheckoutSubTab,
} from '@/lib/utils/checkout-filter-utils';
import CheckoutListTabs from '@/components/checkouts/CheckoutListTabs';
import {
  getCheckoutStatusGroupFilterValue,
  CheckoutStatusValues as CSVal,
} from '@equipment-management/schemas';
import type { CheckoutSummary } from '@equipment-management/schemas';

interface OutboundCheckoutsTabProps {
  teamId?: string;
  filters: UICheckoutFilters;
  summary: CheckoutSummary;
  onStatCardClick: (status: string) => void;
  onResetFilters: () => void;
}

function deriveSparklineTrend(values: readonly number[]): 'up' | 'down' | 'flat' {
  if (values.length <= 1) return 'flat';
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const sum = (items: readonly number[]) => items.reduce((total, item) => total + item, 0);
  const delta = sum(secondHalf) - sum(firstHalf);
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

/** 반출 탭 통계 카드 데이터 정의 — referential stability 보장 (Phase 4 P1-1) */
function useStatCards(summary: OutboundCheckoutsTabProps['summary']) {
  return useMemo(
    () => [
      {
        variantKey: 'total' as CheckoutStatsVariant,
        labelKey: 'outbound.totalCheckouts',
        subKey: 'outbound.totalSub',
        value: summary.total,
        trendKey: 'total' as const,
        icon: ClipboardList,
        filterStatus: 'all',
        dotColor: 'bg-brand-info',
      },
      {
        variantKey: 'pending' as CheckoutStatsVariant,
        labelKey: 'outbound.pendingApproval',
        subKey: 'outbound.pendingSub',
        value: summary.pending,
        trendKey: 'pending' as const,
        icon: Clock,
        filterStatus: 'pending',
        dotColor: 'bg-brand-warning',
      },
      {
        variantKey: 'checkedOut' as CheckoutStatsVariant,
        labelKey: 'outbound.inProgress',
        subKey: 'outbound.inProgressSub',
        value: summary.inProgress,
        trendKey: 'inProgress' as const,
        icon: PackageOpen,
        filterStatus: getCheckoutStatusGroupFilterValue('in_progress'),
        dotColor: 'bg-brand-purple',
      },
      {
        variantKey: 'overdue' as CheckoutStatsVariant,
        labelKey: 'outbound.overdue',
        subKey: 'outbound.overdueSub',
        value: summary.overdue,
        trendKey: 'overdue' as const,
        icon: AlertTriangle,
        filterStatus: CSVal.OVERDUE,
        dotColor: 'bg-brand-critical',
      },
      {
        variantKey: 'returned' as CheckoutStatsVariant,
        labelKey: 'outbound.returnToday',
        subKey: 'outbound.returnedSub',
        value: summary.returnedToday,
        trendKey: 'returnedToday' as const,
        icon: PackageCheck,
        filterStatus: getCheckoutStatusGroupFilterValue('completed'),
        dotColor: 'bg-brand-ok',
      },
    ],
    [summary.total, summary.pending, summary.inProgress, summary.overdue, summary.returnedToday]
  );
}

/**
 * 반출 탭 컴포넌트
 *
 * v2 변경:
 * - 5개 통계 카드 (전체/승인대기/반출중/기한초과/반입완료)
 * - 기한 초과 그룹 최상단 고정 (overdue 그룹 id 부여)
 *
 * PR-7 Batch 2:
 * - overdue hero 카드 → HeroKPI 컴포넌트 연결
 * - secondary 카드에 SparklineMini 슬롯 추가 (현재 빈 배열 플레이스홀더 — 실제 데이터는 Phase 4.6에서 연결)
 * - overdue===0 + status=CSVal.OVERDUE 필터 시 EmptyState celebration 분기
 *
 * Phase 4 (P1-1):
 * - hero 선택 → selectHeroVariant SSOT 헬퍼 (priority 모델, 향후 확장 가능)
 * - grid className → getStatsGridClass(hasHero) 토큰
 * - hero wrapper → CHECKOUT_STATS_VARIANTS.hero.containerInGrid + alertRing
 * - hero 강조 신호: alertRing(시각) + label "기한 초과"(텍스트) + aria-pressed(SR 토글 상태)
 *   — aria-current는 ARIA 표준 의미(navigation 위치)와 어긋나므로 미사용
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
  const navigateWithPending = useNavigateWithPending();
  const { can } = useAuth();
  const canCreateCheckout = can(Permission.CREATE_CHECKOUT);
  const canApproveCheckout = can(Permission.APPROVE_CHECKOUT);
  const { toast } = useToast();

  const statCards = useStatCards(summary);

  // URL 페이지 변경 핸들러 — useCallback으로 referential stability (Phase 4.5 SHOULD-2 방어적 적용)
  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = filtersToSearchParams({ ...filters, page: newPage });
      const qs = params.toString();
      router.replace(
        qs ? `${FRONTEND_ROUTES.CHECKOUTS.LIST}?${qs}` : FRONTEND_ROUTES.CHECKOUTS.LIST,
        { scroll: false }
      );
    },
    [filters, router]
  );

  // 서브탭 전환: status + page 리셋 — filtersToSearchParams가 기본값(inProgress/all/1)을 자동 생략
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

  // ──────────────────────────────────────────────
  // 반출 목록 조회
  // ──────────────────────────────────────────────
  const apiParams = convertFiltersToApiParams(filters);
  const {
    data: checkoutsData,
    isLoading: checkoutsLoading,
    isError: checkoutsError,
    refetch: refetchCheckouts,
  } = useQuery({
    queryKey: queryKeys.checkouts.view.outbound({
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
    ...QUERY_CONFIG.CHECKOUT_LIST,
  });

  const handleCheckoutClick = useCallback(
    (id: string) => navigateWithPending(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id)),
    [navigateWithPending]
  );

  // ──────────────────────────────────────────────
  // 그룹화 + 기한 초과 그룹 최상단 고정
  // ──────────────────────────────────────────────
  const { overdueGroups, normalGroups } = useMemo(() => {
    if (!checkoutsData?.data) return { overdueGroups: [], normalGroups: [] };
    const all = groupCheckoutsByDateAndDestination(checkoutsData.data);
    const overdue = all.filter((g) => g.statuses.includes(CSVal.OVERDUE));
    const normal = all.filter((g) => !g.statuses.includes(CSVal.OVERDUE));
    return { overdueGroups: overdue, normalGroups: normal };
  }, [checkoutsData?.data]);

  const allGroups = [...overdueGroups, ...normalGroups];

  // ──────────────────────────────────────────────
  // Bulk selection + mutations (bulk-selection-tabs-integration sprint)
  // ──────────────────────────────────────────────
  const checkouts: readonly Checkout[] = useMemo(
    () => checkoutsData?.data ?? [],
    [checkoutsData?.data]
  );
  // resetOn deps — filters 변경 또는 페이지 변경 시 selection 자동 초기화
  const filtersKey = JSON.stringify(filters);

  const selection = useRowSelection<Checkout>(checkouts, (c) => c.id, {
    isSelectable: (c) =>
      c.status === CSVal.PENDING && (c.meta?.availableActions?.canApprove ?? false),
    resetOn: [filtersKey],
  });

  const bulkApproveMutation = useOptimisticMutation<
    { approved: { id: string; version: number }[]; failed: { id: string; error: string }[] },
    { ids: string[] },
    readonly Checkout[]
  >({
    mutationFn: async ({ ids }) => checkoutApi.bulkApproveCheckouts(ids),
    queryKey: queryKeys.checkouts.view.outbound({
      direction: 'outbound',
      ...apiParams,
      teamId,
    }),
    optimisticUpdate: (old) => old ?? [],
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    errorMessage: t('bulk.approveError'),
    onSuccessCallback: (result) => {
      const successCount = result.approved.length;
      const failedCount = result.failed.length;
      if (failedCount > 0 && successCount === 0) {
        toast({
          title: t('bulk.approveError'),
          description: t('bulk.approveResult', { success: 0, failed: failedCount }),
          variant: 'destructive',
        });
      } else if (failedCount > 0) {
        toast({
          title: t('bulk.approveResult', { success: successCount, failed: failedCount }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('bulk.approveAll', { count: successCount }) });
      }
      selection.clear();
    },
  });

  const bulkRejectMutation = useOptimisticMutation<
    { rejected: { id: string; version: number }[]; failed: { id: string; error: string }[] },
    { ids: string[]; reason: string },
    readonly Checkout[]
  >({
    mutationFn: async ({ ids, reason }) => checkoutApi.bulkRejectCheckouts(ids, reason),
    queryKey: queryKeys.checkouts.view.outbound({
      direction: 'outbound',
      ...apiParams,
      teamId,
    }),
    optimisticUpdate: (old) => old ?? [],
    invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS,
    errorMessage: t('bulk.rejectError'),
    onSuccessCallback: (result) => {
      const successCount = result.rejected.length;
      const failedCount = result.failed.length;
      if (failedCount > 0 && successCount === 0) {
        toast({
          title: t('bulk.rejectError'),
          description: t('bulk.rejectResult', { success: 0, failed: failedCount }),
          variant: 'destructive',
        });
      } else if (failedCount > 0) {
        toast({
          title: t('bulk.rejectResult', { success: successCount, failed: failedCount }),
          variant: 'destructive',
        });
      } else {
        toast({ title: t('bulk.rejectAll', { count: successCount }) });
      }
      selection.clear();
    },
  });

  const handleBulkApprove = useCallback(() => {
    if (selection.count === 0) return;
    track('checkout.bulk_approve', { count: selection.count });
    bulkApproveMutation.mutate({ ids: Array.from(selection.selected) });
  }, [bulkApproveMutation, selection]);

  const handleBulkReject = useCallback(
    async (reason: string) => {
      if (selection.count === 0) return;
      track('checkout.bulk_reject', { count: selection.count });
      await bulkRejectMutation.mutateAsync({ ids: Array.from(selection.selected), reason });
    },
    [bulkRejectMutation, selection]
  );

  // CheckoutGroupCard prop wiring — SSOT 헬퍼 (lib/checkouts/group-selection.ts)
  const handleToggleGroup = useCallback(
    (rowIds: readonly string[], allCurrentlySelected: boolean) => {
      applyGroupToggle(selection, checkouts, rowIds, allCurrentlySelected);
    },
    [checkouts, selection]
  );

  const handleToggleRow = useCallback(
    (rowId: string) => {
      const item = checkouts.find((c) => c.id === rowId);
      if (item) selection.toggle(rowId, item);
    },
    [checkouts, selection]
  );

  // 장비 총 대수 파생 — 반출별 equipment 배열 합산 (백엔드 스키마 변경 없이 클라이언트 계산)
  const currentEquipmentCount = useMemo(
    () => checkoutsData?.data?.reduce((sum, c) => sum + (c.equipment?.length ?? 0), 0) ?? 0,
    [checkoutsData?.data]
  );

  // ──────────────────────────────────────────────
  // 활성 필터 판단 — countActiveFilters SSOT (새 필터 추가 시 자동 동기화)
  // ──────────────────────────────────────────────
  const filterActive = countActiveFilters(filters) > 0;
  const isAllActive = !filterActive;
  // Hero 선택 SSOT — Phase 4 P1-1 (overdue>0 priority, 향후 priority 확장은 selectHeroVariant)
  const { heroVariantKey } = useMemo(
    () => selectHeroVariant({ overdue: summary.overdue, pending: summary.pending }),
    [summary.overdue, summary.pending]
  );

  // 카드 활성화 핸들러 — useCallback으로 referential stability (memo'd 자식 회귀 차단)
  const handleStatActivate = useCallback(
    (filterStatus: string) => {
      if (filterStatus === 'all') {
        onResetFilters();
      } else {
        onStatCardClick(filterStatus);
      }
    },
    [onResetFilters, onStatCardClick]
  );

  // ──────────────────────────────────────────────
  // 5개 통계 카드
  // ──────────────────────────────────────────────
  const renderStats = () => (
    <div className={getStatsGridClass(!!heroVariantKey)}>
      {statCards.map((card) => {
        const isActive =
          card.filterStatus === 'all' ? isAllActive : filters.status === card.filterStatus;

        const isAlert =
          (card.variantKey === 'overdue' && summary.overdue > 0) ||
          (card.variantKey === 'pending' &&
            summary.pending > CHECKOUT_STATS_ALERT_THRESHOLD.pending);
        const isHero = card.variantKey === heroVariantKey;

        const variantTokens = CHECKOUT_STATS_VARIANTS[card.variantKey];

        const onActivate = () => handleStatActivate(card.filterStatus);

        // Hero 카드: HeroKPI atom + alertRing wrapper + a11y 강조 시맨틱 (Phase 4 P1-1)
        if (isHero) {
          const heroTokens = CHECKOUT_STATS_VARIANTS.hero;
          const heroWrapperClass = [
            heroTokens.containerInGrid,
            'rounded-lg',
            isAlert ? heroTokens.alertRing : '',
          ]
            .filter(Boolean)
            .join(' ');
          // GAP-3: 우상단 우선 배지 — 시각 강조용. SR은 wrapper aria-label에 priority 의미 합성으로 전달.
          const priorityBadgeNode = isAlert ? (
            <span className={heroTokens.priorityBadge} aria-hidden="true">
              {t('outbound.priorityBadge')}
            </span>
          ) : null;
          const metaNode =
            card.variantKey === 'overdue' && summary.overdue > 0 ? (
              <span>
                {t('outbound.overdueMeta', {
                  average: summary.avgDelayDays,
                  max: summary.maxOverdueDays,
                })}
              </span>
            ) : undefined;
          // SR aria-label — isAlert 시 "{label}, 우선 항목" 합성 (시각 배지와 SR 정보 대칭)
          const heroAriaLabel = isAlert
            ? t('outbound.priorityHeroAriaLabel', { label: t(card.labelKey) })
            : t(card.labelKey);
          return (
            <div
              key={card.variantKey}
              className={heroWrapperClass}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={heroAriaLabel}
              onClick={onActivate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onActivate();
                }
              }}
            >
              <HeroKPI
                label={t(card.labelKey)}
                value={card.value}
                variant="critical"
                badge={priorityBadgeNode}
                meta={metaNode}
              />
            </div>
          );
        }

        const finalCardClasses = [
          getCheckoutStatsClasses(card.variantKey, isActive, isAlert),
          CHECKOUT_MOTION.statsCard,
          'elevation' in variantTokens ? variantTokens.elevation : '',
        ]
          .filter(Boolean)
          .join(' ');

        const IconComponent = card.icon;
        const iconColorClass = isActive
          ? CHECKOUT_STATS_VARIANTS[card.variantKey].iconColor
          : 'text-muted-foreground';
        const sparklineValues = summary.trends?.[card.trendKey] ?? [];
        const sparklineTrend = deriveSparklineTrend(sparklineValues);

        return (
          <Card
            key={card.variantKey}
            className={finalCardClasses}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={t(card.labelKey)}
            onClick={onActivate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
              }
            }}
          >
            <CardHeader
              className={
                'headerPadding' in variantTokens
                  ? variantTokens.headerPadding
                  : 'flex flex-row items-center justify-between p-3'
              }
            >
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
            <CardContent
              className={'contentPadding' in variantTokens ? variantTokens.contentPadding : 'p-3'}
            >
              <div
                aria-label={`${t(card.labelKey)} ${t('list.count.unit', { value: card.value })}`}
                className={[
                  'valueTypography' in variantTokens
                    ? variantTokens.valueTypography
                    : `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
                  card.variantKey === 'pending' && card.value > 0 ? 'text-brand-warning' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {card.value}
              </div>
              <p className={`${MICRO_TYPO.label} text-muted-foreground mt-0.5`}>{t(card.subKey)}</p>
              {isActive && (
                <p className={`${MICRO_TYPO.badge} text-primary font-semibold mt-1`}>
                  {t('outbound.activeFilter')}
                </p>
              )}
              {sparklineValues.length > 1 && (
                <SparklineMini values={sparklineValues} trend={sparklineTrend} variant="info" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // 서브탭별 빈 상태 렌더링 함수
  const renderEmptyState = () => {
    // overdue 필터 + summary.overdue === 0 → celebration variant (overdueClear)
    if (filters.status === CSVal.OVERDUE && summary.overdue === 0) {
      return (
        <EmptyState
          variant="celebration"
          icon={CHECKOUT_ICON_MAP.emptyState.overdueClear}
          title={t('emptyState.overdueClear.title')}
          description={t('emptyState.overdueClear.description')}
          testId="empty-state-overdue-clear"
        />
      );
    }
    if (filterActive) {
      return (
        <CheckoutEmptyState
          variant="filtered"
          title={t('emptyState.filtered.title')}
          description={t('emptyState.filtered.description')}
          secondaryAction={{ label: t('emptyState.filtered.cta'), onClick: onResetFilters }}
        />
      );
    }
    if (filters.subTab === 'completed') {
      return (
        <CheckoutEmptyState
          variant="completed"
          title={t('emptyState.completed.title')}
          description={t('emptyState.completed.description')}
        />
      );
    }
    return (
      <CheckoutEmptyState
        variant="in-progress"
        title={t('emptyState.inProgress.title')}
        description={t('emptyState.inProgress.description')}
        primaryAction={{
          label: t('emptyState.inProgress.cta'),
          href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
        }}
        canAct={canCreateCheckout}
      />
    );
  };

  // ──────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────
  const isBulkPending = bulkApproveMutation.isPending || bulkRejectMutation.isPending;

  return (
    <div className={SECTION_RHYTHM_TOKENS.tight}>
      {canApproveCheckout && (
        <CheckoutBulkActionBar
          selectedCount={selection.count}
          totalCount={checkouts.length}
          isAllPageSelected={selection.isAllPageSelected}
          isIndeterminate={selection.isIndeterminate}
          onSelectAll={selection.selectAllOnPage}
          onClearSelection={selection.clear}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
          isPending={isBulkPending}
        />
      )}
      {renderStats()}

      {/* 서브탭 (진행 중 / 완료) — tablist는 tabpanel의 sibling으로 배치 (WCAG 4.1.2) */}
      <CheckoutListTabs
        currentSubTab={filters.subTab}
        onSubTabChange={handleSubTabChange}
        currentCount={checkoutsData?.meta.pagination.total}
        currentEquipmentCount={currentEquipmentCount}
      />

      <div
        id={`subtab-panel-${filters.subTab}`}
        role="tabpanel"
        aria-labelledby={`subtab-trigger-${filters.subTab}`}
      >
        <div className={SECTION_RHYTHM_TOKENS.tight}>
          {checkoutsLoading ? (
            <CheckoutListSkeleton label={t('loading.outbound')} srOnly={t('loading.outboundSr')} />
          ) : checkoutsError ? (
            <div className="p-6">
              <ErrorState
                title={t('outbound.fetchError')}
                onRetry={() => void refetchCheckouts()}
              />
            </div>
          ) : allGroups.length === 0 ? (
            renderEmptyState()
          ) : (
            allGroups.map((group) => (
              <div
                key={group.key}
                id={group.statuses.includes(CSVal.OVERDUE) ? 'overdue-group-section' : undefined}
                tabIndex={group.statuses.includes(CSVal.OVERDUE) ? -1 : undefined}
              >
                <CheckoutGroupCard
                  group={group}
                  onCheckoutClick={handleCheckoutClick}
                  isOverdueGroup={group.statuses.includes(CSVal.OVERDUE)}
                  selectedRowIds={canApproveCheckout ? selection.selected : undefined}
                  onToggleGroup={canApproveCheckout ? handleToggleGroup : undefined}
                  onToggleRow={canApproveCheckout ? handleToggleRow : undefined}
                />
              </div>
            ))
          )}
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
                    from:
                      (current - 1) *
                        (checkoutsData.meta.pagination.pageSize ?? DEFAULT_PAGE_SIZE) +
                      1,
                    to: Math.min(
                      current * (checkoutsData.meta.pagination.pageSize ?? DEFAULT_PAGE_SIZE),
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
      </div>
    </div>
  );
}
