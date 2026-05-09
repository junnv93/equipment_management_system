'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useNavigateWithPending } from '@/hooks/use-navigate-with-pending';

import { EmptyState } from '@/components/shared/EmptyState';
import CheckoutEmptyState from '@/components/checkouts/CheckoutEmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { type Checkout } from '@/lib/api/checkout-api';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import CheckoutGroupCard from '@/components/checkouts/CheckoutGroupCard';
import { CheckoutBulkActionBar } from '@/components/checkouts/CheckoutBulkActionBar';
import { CheckoutListPagination } from '@/components/checkouts/CheckoutListPagination';
import { OutboundStatsGrid } from '@/components/checkouts/OutboundStatsGrid';
import { CheckoutListSkeleton } from '@/components/checkouts/CheckoutListSkeleton';
import { groupCheckoutsByDateAndDestination } from '@/lib/utils/checkout-group-utils';
import { useRowSelection } from '@/hooks/use-bulk-selection';
import { useCheckoutsListQuery } from '@/hooks/use-checkouts-list-query';
import { useCheckoutBulkMutations } from '@/hooks/use-checkout-bulk-mutations';
import { applyGroupToggle } from '@/lib/checkouts/group-selection';
import { SECTION_RHYTHM_TOKENS, CHECKOUT_ICON_MAP } from '@/lib/design-tokens';
import { useAuth } from '@/hooks/use-auth';
import {
  convertFiltersToApiParams,
  filtersToSearchParams,
  countActiveFilters,
  type UICheckoutFilters,
  type CheckoutSubTab,
} from '@/lib/utils/checkout-filter-utils';
import CheckoutListTabs from '@/components/checkouts/CheckoutListTabs';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
import type { CheckoutSummary } from '@equipment-management/schemas';

interface OutboundCheckoutsTabProps {
  teamId?: string;
  filters: UICheckoutFilters;
  summary: CheckoutSummary;
  onStatCardClick: (status: string) => void;
  onResetFilters: () => void;
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
  // 반출 목록 조회 — useCheckoutsListQuery SSOT (tab-component-split-sprint 2026-05-06)
  // ──────────────────────────────────────────────
  const apiParams = convertFiltersToApiParams(filters);
  const {
    data: checkoutsData,
    isLoading: checkoutsLoading,
    isError: checkoutsError,
    refetch: refetchCheckouts,
  } = useCheckoutsListQuery({ apiParams, teamId });

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
  // Bulk selection + mutations — hook 추출 (tab-component-split-sprint 2026-05-06)
  // ──────────────────────────────────────────────
  const checkouts: readonly Checkout[] = useMemo(
    () => checkoutsData?.data ?? [],
    [checkoutsData?.data]
  );
  // resetOn: filters 직접 전달 — useRowSelection 내부가 JSON.stringify(resetOn) 처리하므로 외부 직렬화 불필요
  const selection = useRowSelection<Checkout>(checkouts, (c) => c.id, {
    isSelectable: (c) =>
      c.status === CSVal.PENDING && (c.meta?.availableActions?.canApprove ?? false),
    resetOn: [filters],
  });

  const {
    isPending: isBulkPending,
    handleBulkApprove,
    handleBulkReject,
  } = useCheckoutBulkMutations({ apiParams, teamId, selection });

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
  // Main render — isBulkPending은 useCheckoutBulkMutations 반환값 (라인 245)
  // ──────────────────────────────────────────────
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
      <OutboundStatsGrid summary={summary} filters={filters} onStatActivate={handleStatActivate} />

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

        {/* 페이지네이션 (CheckoutListPagination 추출, presentation SSOT) */}
        {checkoutsData && checkoutsData.meta.pagination.totalPages > 1 && (
          <CheckoutListPagination
            current={filters.page}
            totalPages={checkoutsData.meta.pagination.totalPages}
            total={checkoutsData.meta.pagination.total}
            pageSize={checkoutsData.meta.pagination.pageSize}
            onPageChange={handlePageChange}
            isLoading={checkoutsLoading}
          />
        )}
      </div>
    </div>
  );
}
