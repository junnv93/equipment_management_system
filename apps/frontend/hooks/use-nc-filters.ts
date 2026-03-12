/**
 * 부적합 관리 필터 관리 훅
 *
 * URL 상태를 SSOT(Single Source of Truth)로 사용하여 부적합 관리 필터를 관리합니다.
 *
 * 특징:
 * - URL 파라미터가 유일한 진실의 소스
 * - 필터 변경 시 URL 업데이트 (router.replace)
 * - SSOT 유틸리티 함수 재사용 (non-conformances-filter-utils.ts)
 * - 활성 필터 개수 자동 계산
 *
 * 사용처:
 * - app/(dashboard)/non-conformances/NonConformancesContent.tsx
 *
 * @see lib/utils/non-conformances-filter-utils.ts
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  type UINonConformancesFilters,
  parseNCFiltersFromSearchParams,
  convertNCFiltersToApiParams,
  countActiveNCFilters,
  getDefaultNCFilters,
  NC_DEFAULT_SORT,
  NC_DEFAULT_PAGE_SIZE,
} from '@/lib/utils/non-conformances-filter-utils';

/**
 * 부적합 관리 필터 관리 훅
 */
export function useNCFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 (URL SSOT)
  const currentFilters = useMemo(
    () => parseNCFiltersFromSearchParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  // API 파라미터 변환
  const apiFilters = useMemo(() => convertNCFiltersToApiParams(currentFilters), [currentFilters]);

  // 활성 필터 개수
  const activeCount = useMemo(() => countActiveNCFilters(currentFilters), [currentFilters]);

  /**
   * 필터 업데이트 함수
   *
   * ✅ 무한 리다이렉트 방지: "_all" 센티널 값으로 "첫 방문"과 "전체 선택" 구분
   * - scroll: false로 스크롤 위치 유지
   * - 필터 변경 시 page=1로 리셋 (페이지네이션 정합성)
   */
  const updateFilters = (updates: Partial<UINonConformancesFilters>) => {
    const isFilterChange = Object.keys(updates).some((k) => k !== 'page' && k !== 'pageSize');
    const pageReset = isFilterChange && !('page' in updates) ? { page: 1 } : {};
    const newFilters = { ...currentFilters, ...updates, ...pageReset };
    const params = new URLSearchParams();

    // ✅ status: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('status' in updates || newFilters.status) {
      params.set('status', newFilters.status || '_all');
    }

    // ✅ ncType
    if ('ncType' in updates || newFilters.ncType) {
      params.set('ncType', newFilters.ncType || '_all');
    }

    // ✅ site
    if ('site' in updates || newFilters.site) {
      params.set('site', newFilters.site || '_all');
    }

    // search
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }

    // equipmentId (장비 상세에서 진입 시 유지)
    if (newFilters.equipmentId) {
      params.set('equipmentId', newFilters.equipmentId);
    }

    // sort (기본값이 아닐 때만)
    if (newFilters.sort && newFilters.sort !== NC_DEFAULT_SORT) {
      params.set('sort', newFilters.sort);
    }

    // page (기본값 1이 아닐 때만)
    if (newFilters.page && newFilters.page > 1) {
      params.set('page', String(newFilters.page));
    }

    // pageSize (기본값이 아닐 때만)
    if (newFilters.pageSize && newFilters.pageSize !== NC_DEFAULT_PAGE_SIZE) {
      params.set('pageSize', String(newFilters.pageSize));
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/non-conformances?${queryString}` : '/non-conformances';

    router.replace(newUrl, { scroll: false });
  };

  /** 상태 필터 업데이트 */
  const updateStatus = (status: string) => updateFilters({ status });

  /** 유형 필터 업데이트 */
  const updateNCType = (ncType: string) => updateFilters({ ncType });

  /** 사이트 필터 업데이트 */
  const updateSite = (site: string) => updateFilters({ site });

  /** 검색어 업데이트 */
  const updateSearch = (search: string) => updateFilters({ search });

  /** 정렬 업데이트 */
  const updateSort = (sort: string) => updateFilters({ sort });

  /** 페이지 업데이트 */
  const updatePage = (page: number) => updateFilters({ page });

  /** 페이지 크기 업데이트 (page=1 리셋) */
  const updatePageSize = (pageSize: number) => updateFilters({ pageSize, page: 1 });

  /** 필터 초기화 */
  const clearFilters = () => {
    const defaults = getDefaultNCFilters();
    updateFilters({
      status: '',
      ncType: '',
      site: '',
      search: '',
      sort: defaults.sort,
    });
  };

  return {
    /** 현재 UI 필터 */
    filters: currentFilters,
    /** API 호출용 필터 */
    apiFilters,
    /** 활성 필터 개수 */
    activeCount,
    /** 필터 업데이트 함수 */
    updateFilters,
    /** 상태 필터 업데이트 */
    updateStatus,
    /** 유형 필터 업데이트 */
    updateNCType,
    /** 사이트 필터 업데이트 */
    updateSite,
    /** 검색어 업데이트 */
    updateSearch,
    /** 정렬 업데이트 */
    updateSort,
    /** 페이지 업데이트 */
    updatePage,
    /** 페이지 크기 업데이트 */
    updatePageSize,
    /** 필터 초기화 */
    clearFilters,
  };
}
