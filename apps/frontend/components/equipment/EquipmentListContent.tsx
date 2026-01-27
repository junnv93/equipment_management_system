'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Package, SearchX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import equipmentApi from '@/lib/api/equipment-api';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { useEquipmentFilters } from '@/hooks/useEquipmentFilters';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { EquipmentSearchBar } from '@/components/equipment/EquipmentSearchBar';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { EquipmentCardGrid } from '@/components/equipment/EquipmentCardGrid';
import { ViewToggle } from '@/components/equipment/ViewToggle';
import { EquipmentPagination } from '@/components/equipment/EquipmentPagination';
import type { PaginatedResponse } from '@/lib/api/types';
import type { Equipment } from '@/lib/api/equipment-api';

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
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">검색 결과가 없습니다</h3>
      <p className="text-muted-foreground mt-1 max-w-md">
        {searchTerm
          ? `"${searchTerm}"에 대한 검색 결과가 없습니다.`
          : '현재 필터 조건에 맞는 장비가 없습니다.'}
      </p>
      {hasActiveFilters && (
        <Button variant="outline" className="mt-4" onClick={onClearFilters} type="button">
          필터 초기화
        </Button>
      )}
    </div>
  );
}

/**
 * 빈 상태 컴포넌트 (데이터 없음)
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">등록된 장비가 없습니다</h3>
      <p className="text-muted-foreground mt-1">첫 번째 장비를 등록해보세요.</p>
      <Button className="mt-4" asChild>
        <Link href="/equipment/create">장비 등록</Link>
      </Button>
    </div>
  );
}

/**
 * 스켈레톤 로딩 컴포넌트
 */
export function EquipmentListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      {/* 필터 스켈레톤 */}
      <Skeleton className="h-[120px] w-full rounded-lg" />

      {/* 검색바 & 뷰 토글 스켈레톤 */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>

      {/* 페이지네이션 스켈레톤 */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[300px]" />
      </div>
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

/**
 * 장비 목록 컨텐츠 컴포넌트 (Client Component)
 *
 * Next.js 16 패턴:
 * - Server Component(page.tsx)에서 초기 데이터를 fetch하여 전달 가능
 * - 클라이언트에서 필터/검색/정렬 등 인터랙션 처리
 * - useQuery의 initialData로 hydration 최적화
 */
export function EquipmentListContent({ initialData }: EquipmentListContentProps) {
  // URL 상태 관리 훅
  const {
    filters,
    view,
    setSearch,
    setSite,
    setStatus,
    setCalibrationMethod,
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

  // 장비 목록 쿼리
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['equipmentList', queryFilters],
    queryFn: () => equipmentApi.getEquipmentList(queryFilters),
    initialData,  // Server에서 전달받은 초기 데이터
    retry: 3,
    staleTime: 30 * 1000, // 30초
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
    return (
      <ErrorAlert
        error={error}
        title="장비 목록 로드 실패"
        onRetry={() => refetch()}
      />
    );
  }

  // 초기 로딩 상태 (initialData가 없는 경우에만)
  if (isLoading && items.length === 0) {
    return <EquipmentListSkeleton />;
  }

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={isFetching}>
      {/* 필터 패널 */}
      <EquipmentFilters
        filters={filters}
        onSiteChange={setSite}
        onStatusChange={setStatus}
        onCalibrationMethodChange={setCalibrationMethod}
        onIsSharedChange={setIsShared}
        onCalibrationDueFilterChange={setCalibrationDueFilter}
        onTeamIdChange={setTeamId}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 검색바 & 정렬 & 뷰 전환 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <EquipmentSearchBar
          value={filters.search}
          onChange={setSearch}
          isLoading={isFetching}
          className="w-full sm:max-w-md"
        />

        <div className="flex items-center gap-4">
          {/* 정렬 표시 */}
          {filters.sortBy && filters.sortBy !== 'createdAt' && (
            <Badge variant="outline" className="text-xs">
              정렬: {filters.sortBy === 'name' ? '이름순' : filters.sortBy === 'lastCalibrationDate' ? '교정일순' : filters.sortBy === 'nextCalibrationDate' ? '교정기한순' : filters.sortBy === 'status' ? '상태순' : filters.sortBy === 'managementNumber' ? '관리번호순' : ''}
              ({filters.sortOrder === 'asc' ? '오름차순' : '내림차순'})
            </Badge>
          )}

          {/* 뷰 전환 */}
          {isClient && (
            <ViewToggle view={view} onChange={setView} />
          )}
        </div>
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
            <EquipmentCardGrid
              items={items}
              isLoading={isFetching}
              searchTerm={filters.search}
            />
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
