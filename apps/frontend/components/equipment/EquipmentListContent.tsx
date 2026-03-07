'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Package, SearchX, FilterX, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  EQUIPMENT_EMPTY_STATE_TOKENS,
  EQUIPMENT_STATUS_TOKENS,
  EQUIPMENT_STATS_STRIP_TOKENS,
} from '@/lib/design-tokens';
import equipmentApi from '@/lib/api/equipment-api';
import dashboardApi from '@/lib/api/dashboard-api';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { useTranslations } from 'next-intl';
import { useEquipmentFilters } from '@/hooks/useEquipmentFilters';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { EquipmentSearchBar } from '@/components/equipment/EquipmentSearchBar';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { EquipmentCardGrid } from '@/components/equipment/EquipmentCardGrid';
import { ViewToggle } from '@/components/equipment/ViewToggle';
import { EquipmentPagination } from '@/components/equipment/EquipmentPagination';
import type { PaginatedResponse } from '@/lib/api/types';
import type { Equipment } from '@/lib/api/equipment-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';

/**
 * 빈 상태 컴포넌트 (검색 결과 없음)
 */
function EmptySearchResults({
  hasActiveFilters,
  searchTerm,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  searchTerm?: string;
  onClearFilters: () => void;
}) {
  const t = useTranslations('equipment');
  const Icon = searchTerm ? SearchX : FilterX;

  return (
    <div className={`${EQUIPMENT_EMPTY_STATE_TOKENS.container} py-16`}>
      <Icon className={EQUIPMENT_EMPTY_STATE_TOKENS.icon} aria-hidden="true" />
      <h3 className={EQUIPMENT_EMPTY_STATE_TOKENS.title}>
        {searchTerm ? t('list.noSearchResults') : t('list.noFilterResults')}
      </h3>
      <p className={`${EQUIPMENT_EMPTY_STATE_TOKENS.description} max-w-md mx-auto`}>
        {searchTerm
          ? t('list.noSearchResultsDesc', { term: searchTerm })
          : t('list.noFilterResultsDesc')}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters} type="button">
          <FilterX className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {t('list.clearFilters')}
        </Button>
      )}
    </div>
  );
}

/**
 * 빈 상태 컴포넌트 (데이터 없음)
 */
function EmptyState() {
  const t = useTranslations('equipment');
  return (
    <div className={`${EQUIPMENT_EMPTY_STATE_TOKENS.container} py-16`}>
      <Package className={EQUIPMENT_EMPTY_STATE_TOKENS.icon} aria-hidden="true" />
      <h3 className={EQUIPMENT_EMPTY_STATE_TOKENS.title}>{t('list.empty')}</h3>
      <p className={`${EQUIPMENT_EMPTY_STATE_TOKENS.description} max-w-md mx-auto`}>
        {t('list.emptyDescription')}
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link href="/equipment/create">
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t('list.createButton')}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/equipment/create-shared">
            <Package className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t('list.createSharedButton')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

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
      <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg border border-border overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20 shrink-0" />
        ))}
      </div>

      {/* 툴바 스켈레톤 */}
      <div className="flex flex-col gap-3">
        {/* Row 1: 검색바 + 뷰 토글 */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Skeleton className="h-9 w-full sm:max-w-sm rounded-md" />
          <div className="sm:ml-auto">
            <Skeleton className="h-9 w-[100px] rounded-md" />
          </div>
        </div>
        {/* Row 2: 인라인 필터 바 */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-[120px] rounded-md" />
          <Skeleton className="h-9 w-[130px] rounded-md" />
          <Skeleton className="h-9 w-[130px] rounded-md" />
          <Skeleton className="h-9 w-[120px] rounded-md" />
        </div>
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

/** 상태 분포 스트립 표시 우선순위 */
const STATUS_PRIORITY_ORDER = [
  'available',
  'in_use',
  'checked_out',
  'calibration_scheduled',
  'non_conforming',
  'calibration_overdue',
  'pending_disposal',
  'spare',
  'retired',
  'disposed',
  'temporary',
  'inactive',
] as const;

/**
 * 상태 분포 요약 스트립 (Dashboard API 재활용)
 *
 * scope 설계:
 * - teamId 있음 → 팀 범위 통계 (test_engineer, technical_manager)
 * - teamId 없음 → site 전체 통계 (백엔드 @SiteScoped 자동 격리)
 *
 * 표시할 상태 우선순위 및 색상 점:
 * - 전체(totalItems) → 항상 첫 번째
 * - available → brand-ok (bg-brand-ok)
 * - in_use → brand-info
 * - checked_out → brand-warning
 * - non_conforming / calibration_overdue → brand-critical
 * - 기타 count > 0인 것만 동적 표시
 */
function StatusSummaryStrip({
  stats,
  totalItems,
  isTeamScoped,
}: {
  stats: Record<string, number> | undefined;
  totalItems: number;
  /** URL ?teamId= 존재 여부 — 레이블 표시 결정 */
  isTeamScoped: boolean;
}) {
  const t = useTranslations('equipment');

  const visibleStats = useMemo(() => {
    if (!stats) return [];
    return STATUS_PRIORITY_ORDER.filter((key) => (stats[key] || 0) > 0).map((key) => ({
      key,
      count: stats[key] || 0,
      statusBarColor: EQUIPMENT_STATUS_TOKENS[key]?.card.statusBarColor || 'bg-brand-neutral',
      label: t(`status.${key}` as Parameters<typeof t>[0]),
    }));
  }, [stats, t]);

  // 총계 레이블: 팀 스코프면 "팀 장비", 아니면 "전체 장비"
  const totalLabel = isTeamScoped ? t('filters.teamEquipment') : t('filters.allEquipment');

  return (
    <div className={EQUIPMENT_STATS_STRIP_TOKENS.container}>
      {/* 전체 수 */}
      <span className={EQUIPMENT_STATS_STRIP_TOKENS.item}>
        <span className={EQUIPMENT_STATS_STRIP_TOKENS.totalCount}>{totalItems}</span>
        <span className={EQUIPMENT_STATS_STRIP_TOKENS.label}>{totalLabel}</span>
      </span>

      {visibleStats.length > 0 && (
        <span className={EQUIPMENT_STATS_STRIP_TOKENS.divider} aria-hidden="true" />
      )}

      {visibleStats.map((stat, i) => (
        <span key={stat.key} className={EQUIPMENT_STATS_STRIP_TOKENS.item}>
          {i > 0 && <span className={EQUIPMENT_STATS_STRIP_TOKENS.divider} aria-hidden="true" />}
          <span
            className={`${EQUIPMENT_STATS_STRIP_TOKENS.dot} ${stat.statusBarColor}`}
            aria-hidden="true"
          />
          <span className={EQUIPMENT_STATS_STRIP_TOKENS.count}>{stat.count}</span>
          <span className={EQUIPMENT_STATS_STRIP_TOKENS.label}>{stat.label}</span>
        </span>
      ))}
    </div>
  );
}

/** 정렬 배지 i18n 키 맵 (중첩 삼항 대체) */
const SORT_LABEL_KEYS = {
  name: 'sort.name',
  lastCalibrationDate: 'sort.lastCalibrationDate',
  nextCalibrationDate: 'sort.nextCalibrationDate',
  status: 'sort.status',
  createdAt: 'sort.createdAt',
} as const;

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
  // URL 상태 관리 훅
  const {
    filters,
    view,
    setSearch,
    setSite,
    setStatus,
    setCalibrationMethod,
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
  } = useEquipmentFilters();

  // 장비 상태 분포 (기존 Dashboard API 재활용, 30s TTL)
  //
  // ✅ scope 설계: URL ?teamId= (SSOT)를 그대로 전달
  //   - test_engineer / technical_manager: page.tsx의 buildRoleBasedRedirectUrl이
  //     이미 ?teamId=자기팀 을 URL에 주입 → filters.teamId = 팀 스코프
  //   - quality_manager / lab_manager / system_admin: teamId 없음
  //     → undefined → 백엔드 @SiteScoped 인터셉터가 JWT site로 자동 격리
  //
  // ✅ 캐시 격리: teamId가 달라지면 다른 queryKey → 팀A와 팀B 통계 충돌 없음
  const { data: statusStats } = useQuery({
    queryKey: queryKeys.dashboard.equipmentStatusStats(undefined, filters.teamId || undefined),
    queryFn: () => dashboardApi.getEquipmentStatusStats(filters.teamId || undefined),
    staleTime: CACHE_TIMES.SHORT,
  });

  // 장비 목록 쿼리
  // ✅ Vercel Best Practice: Query Key 객체 사용
  // - React Query v5는 queryKey 객체를 deep comparison으로 비교
  // - useEquipmentFilters가 queryFilters를 useMemo로 안정화하므로 캐시 히트율 최적
  //
  // ⚠️ staleTime: 0 is intentional for real-time accuracy
  //
  // Equipment status changes from:
  // - 부적합 등록 (Non-conformance registration)
  // - 사고이력 등록 (Incident history with status change)
  // - 교정기한 초과 자동 처리 (Calibration overdue auto-processing)
  // - 폐기 신청 (Disposal workflows)
  //
  // Users expect immediate status badge updates after these operations.
  //
  // ✅ refetchOnMount: 'always' - 항상 최신 데이터 확인
  // - 목록 페이지는 상태 변경에 민감 (상세 페이지에서 NC 등록 등)
  // - 새 페이지 컨텍스트에서도 최신 상태 보장
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.equipment.list(queryFilters), // ✅ 표준화된 키
    queryFn: () => equipmentApi.getEquipmentList(queryFilters),
    placeholderData: initialData, // Server에서 전달받은 초기 데이터
    retry: 3,
    staleTime: 0, // 장비 상태는 실시간 정확성이 중요 (부적합, 교정기한초과 등)
    refetchOnMount: 'always', // ✅ 항상 최신 데이터 확인 (상태 변경 민감)
  });

  // 페이지네이션 정보 계산
  const paginationInfo = useMemo(() => {
    const totalItems = data?.meta?.pagination?.total || 0;
    const totalPages = data?.meta?.pagination?.totalPages || 1;
    const currentPage = data?.meta?.pagination?.currentPage || filters.page;
    return { totalItems, totalPages, currentPage };
  }, [data, filters.page]);

  // 장비 데이터
  const items = data?.data || [];

  // 에러 상태 처리
  if (error) {
    return <ErrorAlert error={error} title={t('list.loadError')} onRetry={() => refetch()} />;
  }

  // 초기 로딩 상태 (initialData가 없는 경우에만)
  if (isLoading && items.length === 0) {
    return <EquipmentListSkeleton />;
  }

  return (
    <div className="space-y-3" aria-live="polite" aria-busy={isFetching}>
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

      {/* 상태 요약 스트립 (URL ?teamId= SSOT → scope 자동 결정) */}
      <StatusSummaryStrip
        stats={statusStats}
        totalItems={paginationInfo.totalItems}
        isTeamScoped={!!filters.teamId}
      />

      {/* 툴바: 검색+정렬+뷰 토글 / 필터 */}
      <div className="flex flex-col gap-3">
        {/* Row 1: 검색바 + 정렬 배지 + 뷰 토글 */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <EquipmentSearchBar
            value={filters.search}
            onChange={setSearch}
            isLoading={isFetching}
            className="w-full sm:max-w-sm"
          />
          <div className="flex items-center gap-3 sm:ml-auto">
            {/* 정렬 표시 */}
            {filters.sortBy &&
              filters.sortBy !== 'managementNumber' &&
              filters.sortBy in SORT_LABEL_KEYS && (
                <Badge variant="outline" className="text-xs">
                  {t('sort.label')}{' '}
                  {t(SORT_LABEL_KEYS[filters.sortBy as keyof typeof SORT_LABEL_KEYS])} (
                  {filters.sortOrder === 'asc' ? t('sort.asc') : t('sort.desc')})
                </Badge>
              )}
            {/* 뷰 전환 */}
            {isClient && <ViewToggle view={view} onChange={setView} />}
          </div>
        </div>

        {/* Row 2: 인라인 필터 바 */}
        <EquipmentFilters
          filters={filters}
          onSiteChange={setSite}
          onStatusChange={setStatus}
          onCalibrationMethodChange={setCalibrationMethod}
          onClassificationChange={setClassification}
          onIsSharedChange={setIsShared}
          onCalibrationDueFilterChange={setCalibrationDueFilter}
          onTeamIdChange={setTeamId}
          onClearFilters={clearFilters}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* 장비 목록 (테이블 또는 카드) */}
      {items.length === 0 ? (
        hasActiveFilters || filters.search ? (
          <EmptySearchResults
            hasActiveFilters={hasActiveFilters}
            searchTerm={filters.search}
            onClearFilters={clearFilters}
          />
        ) : (
          <EmptyState />
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
            />
          ) : (
            <EquipmentCardGrid items={items} isLoading={isFetching} searchTerm={filters.search} />
          )}

          {/* 페이지네이션 */}
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
