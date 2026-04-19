'use client';

import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import equipmentApi from '@/lib/api/equipment-api';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { useTranslations } from 'next-intl';
import { useEquipmentFilters } from '@/hooks/useEquipmentFilters';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { EquipmentSearchBar } from '@/components/equipment/EquipmentSearchBar';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { EquipmentCardGrid } from '@/components/equipment/EquipmentCardGrid';
import { ViewToggle } from '@/components/equipment/ViewToggle';
import { EquipmentPagination } from '@/components/equipment/EquipmentPagination';
import {
  EmptySearchResults,
  EquipmentEmptyState,
} from '@/components/equipment/EquipmentEmptyState';
import { StatusSummaryStrip } from '@/components/equipment/StatusSummaryStrip';
import { BulkLabelPrintButton } from '@/components/equipment/BulkLabelPrintButton';
import { BulkActionBar } from '@/components/common/BulkActionBar';
import { useRowSelection } from '@/hooks/use-bulk-selection';
import type { PaginatedResponse } from '@/lib/api/types';
import type { Equipment } from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { EquipmentStatusEnum } from '@equipment-management/schemas';
import type { EquipmentStatus } from '@equipment-management/schemas';
import { EQUIPMENT_TOOLBAR_TOKENS, EQUIPMENT_STATS_STRIP_TOKENS } from '@/lib/design-tokens';

/**
 * 스켈레톤 로딩 컴포넌트
 */
export function EquipmentListSkeleton() {
  const t = useTranslations('equipment');
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={t('list.loading')}
    >
      {/* 상태 요약 스트립 스켈레톤 */}
      <div className={EQUIPMENT_STATS_STRIP_TOKENS.container}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20 shrink-0" />
        ))}
      </div>

      {/* 통합 Command Bar 스켈레톤 */}
      <div className={EQUIPMENT_TOOLBAR_TOKENS.commandBar}>
        <div className="flex flex-wrap gap-2 items-center">
          <Skeleton className="h-9 w-full sm:w-[200px] rounded-md" />
          <Skeleton className="h-9 w-[120px] rounded-md" />
          <Skeleton className="h-9 w-[130px] rounded-md" />
          <Skeleton className="h-9 w-[130px] rounded-md" />
          <Skeleton className="h-9 w-[120px] rounded-md" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-[100px] rounded-md" />
          </div>
        </div>
      </div>

      {/* 결과 정보 바 스켈레톤 */}
      <div className="flex items-center justify-between px-1">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-5 w-[120px] rounded" />
      </div>

      {/* 테이블 스켈레톤 — 7개 컬럼 (상태 바 포함) */}
      <div className="border rounded-lg overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-muted/50 px-4 py-3 flex items-center gap-4">
          <div className="w-1 shrink-0" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 hidden md:block" />
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
        {/* 테이블 행 */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-t flex items-stretch">
            <div className="w-1 bg-muted shrink-0" />
            <div className="flex items-center gap-4 px-4 py-3 flex-1">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-20 hidden md:block" />
              <Skeleton className="h-4 w-24 hidden md:block" />
              <Skeleton className="h-5 w-[4.5rem] rounded-full" />
              <Skeleton className="h-8 w-16 ml-auto rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-[160px]" />
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
        </div>
      </div>

      <span className="sr-only">{t('list.loadingText')}</span>
    </div>
  );
}

interface EquipmentListContentProps {
  /**
   * Server에서 fetch한 초기 데이터 (선택적)
   * 전달 시 초기 로딩 없이 바로 표시
   */
  initialData?: PaginatedResponse<Equipment>;
}

/** 정렬 표시 i18n 키 맵 (중첩 삼항 대체) */
const SORT_LABEL_KEYS = {
  managementNumber: 'sort.managementNumber',
  name: 'sort.name',
  lastCalibrationDate: 'sort.lastCalibrationDate',
  nextCalibrationDate: 'sort.nextCalibrationDate',
  status: 'sort.status',
  createdAt: 'sort.createdAt',
} as const;

interface ResultsInfoBarProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  sortBy: string | undefined;
  sortOrder: string | undefined;
}

/**
 * 결과 정보 바 — toolbar과 목록 사이에 표시
 * 좌: "55개 장비 · 1-10 표시" / 우: "정렬: 관리번호 ↑"
 */
const ResultsInfoBar = memo(function ResultsInfoBar({
  totalItems,
  currentPage,
  pageSize,
  sortBy,
  sortOrder,
}: ResultsInfoBarProps) {
  const t = useTranslations('equipment');

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const sortLabel =
    sortBy && sortBy in SORT_LABEL_KEYS
      ? t(SORT_LABEL_KEYS[sortBy as keyof typeof SORT_LABEL_KEYS] as Parameters<typeof t>[0])
      : null;

  return (
    <div
      className={EQUIPMENT_TOOLBAR_TOKENS.resultsBar}
      role="status"
      aria-label={t('resultsBar.ariaLabel')}
    >
      <span className={EQUIPMENT_TOOLBAR_TOKENS.resultsCount}>
        {totalItems > 0
          ? t('resultsBar.totalWithRange', { total: totalItems, start, end })
          : t('resultsBar.totalWithRange', { total: 0, start: 0, end: 0 })}
      </span>
      {sortLabel && (
        <span className={EQUIPMENT_TOOLBAR_TOKENS.sortIndicator}>
          {t('sort.label')} {sortLabel} {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );
});

/**
 * 장비 목록 컨텐츠 컴포넌트 (Client Component)
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 초기 데이터를 fetch하여 전달 가능
 * - 클라이언트에서 필터/검색/정렬 등 인터랙션 처리
 * - useQuery의 initialData로 hydration 최적화
 *
 * ⚠️ Hydration 처리:
 * - 이 컴포넌트는 ClientOnly wrapper로 감싸서 사용해야 함
 * - Radix UI 컴포넌트(Select, Collapsible)의 ID mismatch 방지
 * - page.tsx에서 <ClientOnly> wrapper 적용
 */
export function EquipmentListContent({ initialData }: EquipmentListContentProps) {
  const t = useTranslations('equipment');
  const {
    filters,
    view,
    setSearch,
    setSite,
    setStatus,
    setManagementMethod,
    setClassification,
    setIsShared,
    setCalibrationDueFilter,
    setTeamId,
    setSort,
    setPage,
    setPageSize,
    setView,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
    queryFilters,
    isClient,
    updateURL,
  } = useEquipmentFilters();

  // 장비 목록 쿼리
  // ✅ queryFilters에 showRetired가 useEquipmentFilters에서 자동 주입됨 (useUserPreferences 연동)
  // ✅ QUERY_CONFIG.EQUIPMENT_LIST_FRESH: 상세 페이지 이탈 후 목록 복귀 시 항상 최신 상태 보장
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.equipment.list(queryFilters),
    queryFn: () => equipmentApi.getEquipmentList(queryFilters),
    placeholderData: initialData,
    ...QUERY_CONFIG.EQUIPMENT_LIST_FRESH,
  });

  const paginationInfo = useMemo(() => {
    const totalItems = data?.meta?.pagination?.total || 0;
    const totalPages = data?.meta?.pagination?.totalPages || 1;
    const currentPage = data?.meta?.pagination?.currentPage || filters.page;
    return { totalItems, totalPages, currentPage };
  }, [data, filters.page]);

  const items = data?.data || [];
  const statusCounts = data?.meta?.summary;

  // per-row 선택 — DISPOSED 장비는 선택 불가, 필터 변경 시 자동 초기화
  const selection = useRowSelection<Equipment>(items, (e) => e.id, {
    isSelectable: (e) => e.status !== EquipmentStatusEnum.enum.disposed,
    resetOn: [queryFilters],
  });

  if (error) {
    return <ErrorAlert error={error} title={t('list.loadError')} onRetry={() => refetch()} />;
  }

  if (isLoading && items.length === 0) {
    return <EquipmentListSkeleton />;
  }

  return (
    <div className="space-y-4" aria-live="polite" aria-busy={isFetching}>
      {/* 진행 표시줄 — 백그라운드 데이터 갱신 시 thin indeterminate bar */}
      {isFetching && !isLoading && (
        <div
          className="fixed top-0 left-0 right-0 h-0.5 bg-primary/20 z-50 overflow-hidden"
          role="progressbar"
          aria-label={t('list.refreshing')}
        >
          <div className="h-full bg-primary w-1/3 rounded-r motion-safe:animate-progress-indeterminate motion-reduce:hidden" />
        </div>
      )}

      {/*
       * 상태 요약 스트립
       * - StatusSummaryStrip이 Dashboard API를 자체 fetch (SRP)
       * - onStatusChange 연결 → 클릭으로 상태 필터 즉시 적용
       * - teamId: URL ?teamId= SSOT → scope 자동 결정
       */}
      <StatusSummaryStrip
        isTeamScoped={!!filters.teamId}
        totalItems={paginationInfo.totalItems}
        activeStatus={filters.status as EquipmentStatus | ''}
        isCalibrationOverdueActive={filters.calibrationDueFilter === 'overdue'}
        onStatusChange={(key) => {
          // "교정기한초과" 칩은 status enum이 아닌 derived 필터(calibrationDueFilter='overdue')로 라우팅.
          // status 컬럼의 calibration_overdue 값은 스케줄러에 의해 즉시 non_conforming으로 전이되므로
          // 단순 status 필터로는 0건이 나오는 문제 회피.
          //
          // ⚠️ 반드시 updateURL로 atomic 업데이트: setStatus + setCalibrationDueFilter를
          // 연속 호출하면 각각 router.push를 일으켜 두 번째가 첫 번째 스냅샷을 덮어쓰며
          // 한쪽 변경이 유실됨 (overdue → 다른 칩 클릭 시 overdue 필터가 남는 버그 원인).
          if ((key as string) === 'calibration_overdue') {
            updateURL({ status: '', calibrationDueFilter: 'overdue', page: 1 });
            return;
          }
          // 다른 칩으로 이동 시 derived overdue 필터가 켜져 있었다면 함께 해제
          updateURL({
            status: key,
            calibrationDueFilter:
              filters.calibrationDueFilter === 'overdue' ? 'all' : filters.calibrationDueFilter,
            page: 1,
          });
        }}
        statusCounts={statusCounts}
      />

      {/* Unified Command Bar: 검색 + 필터 + 뷰 토글 통합 */}
      <div className={EQUIPMENT_TOOLBAR_TOKENS.commandBar}>
        <EquipmentFilters
          filters={filters}
          onSiteChange={setSite}
          onStatusChange={setStatus}
          onManagementMethodChange={setManagementMethod}
          onClassificationChange={setClassification}
          onIsSharedChange={setIsShared}
          onCalibrationDueFilterChange={setCalibrationDueFilter}
          onTeamIdChange={setTeamId}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          slotBefore={
            <EquipmentSearchBar
              value={filters.search}
              onChange={setSearch}
              isLoading={isFetching}
              className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[280px]"
            />
          }
          slotAfter={
            isClient ? (
              <>
                <ViewToggle view={view} onChange={setView} />
                <BulkLabelPrintButton
                  selectedItems={
                    selection.count > 0 ? (selection.selectedItems as Equipment[]) : items
                  }
                  onComplete={selection.count > 0 ? selection.clear : undefined}
                  variant="outline"
                />
              </>
            ) : undefined
          }
        />
      </div>

      {/* 결과 정보 바 */}
      <ResultsInfoBar
        totalItems={paginationInfo.totalItems}
        currentPage={paginationInfo.currentPage}
        pageSize={filters.pageSize}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
      />

      {/* 벌크 액션 바 — per-row 선택 시 표시 (QR 인쇄는 toolbar 상시 노출) */}
      <BulkActionBar
        selectedCount={selection.count}
        totalCount={items.length}
        isAllPageSelected={selection.isAllPageSelected}
        isIndeterminate={selection.isIndeterminate}
        onSelectAll={selection.selectAllOnPage}
        onClear={selection.clear}
        variant="inline"
        className="print:hidden"
      />

      {/* 장비 목록 (테이블 또는 카드) */}
      {items.length === 0 ? (
        hasActiveFilters || filters.search ? (
          <EmptySearchResults
            hasActiveFilters={hasActiveFilters}
            searchTerm={filters.search}
            onClearFilters={clearFilters}
          />
        ) : (
          <EquipmentEmptyState />
        )
      ) : (
        <>
          {view === 'table' ? (
            <EquipmentTable
              items={items}
              isLoading={isFetching}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSort={setSort}
              searchTerm={filters.search}
              selection={selection}
            />
          ) : (
            <EquipmentCardGrid
              items={items}
              isLoading={isFetching}
              searchTerm={filters.search}
              selection={selection}
            />
          )}

          <EquipmentPagination
            currentPage={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
            pageSize={filters.pageSize}
            totalItems={paginationInfo.totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
