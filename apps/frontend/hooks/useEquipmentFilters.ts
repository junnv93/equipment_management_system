'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type {
  Site,
  EquipmentStatus,
  CalibrationMethod,
  Classification,
} from '@equipment-management/schemas';
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  DEFAULT_UI_FILTERS,
  type UIEquipmentFilters,
} from '@/lib/utils/equipment-filter-utils';

/**
 * 교정 기한 필터 타입
 */
export type CalibrationDueFilter = 'all' | 'due_soon' | 'overdue' | 'normal';

/**
 * 장비 필터 상태 타입
 *
 * ✅ SSOT: UIEquipmentFilters와 동일한 구조 (sortBy 타입만 더 제한적)
 * @see lib/utils/equipment-filter-utils.ts
 */
export interface EquipmentFilters {
  search: string;
  site: Site | '';
  status: EquipmentStatus | '';
  calibrationMethod: CalibrationMethod | '';
  classification: Classification | '';
  isShared: 'all' | 'shared' | 'normal';
  calibrationDueFilter: CalibrationDueFilter;
  teamId: string;
  sortBy:
    | 'name'
    | 'createdAt'
    | 'lastCalibrationDate'
    | 'nextCalibrationDate'
    | 'status'
    | 'managementNumber';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/**
 * 필터 기본값
 *
 * ✅ SSOT: DEFAULT_UI_FILTERS 사용
 * @see lib/utils/equipment-filter-utils.ts
 */
const DEFAULT_FILTERS: EquipmentFilters = {
  ...DEFAULT_UI_FILTERS,
  sortBy: 'createdAt', // 타입 호환을 위해 명시
} as EquipmentFilters;

/**
 * 뷰 타입
 */
export type ViewType = 'table' | 'card';

/**
 * localStorage 키
 */
const VIEW_STORAGE_KEY = 'equipment-list-view';
const PAGE_SIZE_STORAGE_KEY = 'equipment-list-page-size';

/**
 * 장비 목록 필터 훅
 *
 * - URL 쿼리 파라미터로 필터 상태 관리
 * - 뷰 타입은 localStorage에 저장
 * - 뒤로가기/새로고침 시 상태 유지
 * - 공유 가능한 URL 생성
 *
 * ============================================================================
 * 🔴 SSOT 주의사항
 * ============================================================================
 * - 필터 파싱/변환 로직은 equipment-filter-utils.ts에서 관리
 * - 이 파일에서 직접 파싱 로직을 작성하지 마세요!
 * - 새 필터 추가 시 equipment-filter-utils.ts 먼저 수정
 * @see lib/utils/equipment-filter-utils.ts
 * ============================================================================
 */
export function useEquipmentFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // localStorage 상태 (클라이언트 사이드에서만 사용)
  const [view, setViewState] = useState<ViewType>('table');
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서 localStorage 읽기
  useEffect(() => {
    setIsClient(true);
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY) as ViewType | null;
    if (savedView === 'table' || savedView === 'card') {
      setViewState(savedView);
    }
  }, []);

  // URL에서 필터 파싱
  // ✅ SSOT: parseEquipmentFiltersFromSearchParams 유틸리티 사용
  // @see lib/utils/equipment-filter-utils.ts
  const filters = useMemo<EquipmentFilters>(() => {
    const parsed = parseEquipmentFiltersFromSearchParams(searchParams);
    // sortBy 타입을 EquipmentFilters['sortBy']로 캐스팅 (더 제한적인 타입)
    return {
      ...parsed,
      sortBy: (parsed.sortBy || 'createdAt') as EquipmentFilters['sortBy'],
    };
  }, [searchParams]);

  // URL 업데이트 함수
  const updateURL = useCallback(
    (newFilters: Partial<EquipmentFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      // 변경된 필터만 업데이트
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === '' || value === DEFAULT_FILTERS[key as keyof EquipmentFilters]) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      // URL 업데이트 (shallow routing)
      const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newURL, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // 개별 필터 업데이트
  const setSearch = useCallback(
    (search: string) => {
      updateURL({ search, page: 1 }); // 검색 시 페이지 초기화
    },
    [updateURL]
  );

  const setSite = useCallback(
    (site: Site | '') => {
      updateURL({ site, page: 1 });
    },
    [updateURL]
  );

  const setStatus = useCallback(
    (status: EquipmentStatus | '') => {
      updateURL({ status, page: 1 });
    },
    [updateURL]
  );

  const setCalibrationMethod = useCallback(
    (calibrationMethod: CalibrationMethod | '') => {
      updateURL({ calibrationMethod, page: 1 });
    },
    [updateURL]
  );

  const setClassification = useCallback(
    (classification: Classification | '') => {
      updateURL({ classification, page: 1 });
    },
    [updateURL]
  );

  const setIsShared = useCallback(
    (isShared: 'all' | 'shared' | 'normal') => {
      updateURL({ isShared, page: 1 });
    },
    [updateURL]
  );

  const setCalibrationDueFilter = useCallback(
    (calibrationDueFilter: CalibrationDueFilter) => {
      updateURL({ calibrationDueFilter, page: 1 });
    },
    [updateURL]
  );

  const setTeamId = useCallback(
    (teamId: string) => {
      updateURL({ teamId, page: 1 });
    },
    [updateURL]
  );

  const setSortBy = useCallback(
    (sortBy: EquipmentFilters['sortBy']) => {
      updateURL({ sortBy });
    },
    [updateURL]
  );

  const setSortOrder = useCallback(
    (sortOrder: 'asc' | 'desc') => {
      updateURL({ sortOrder });
    },
    [updateURL]
  );

  const setSort = useCallback(
    (sortBy: EquipmentFilters['sortBy'], sortOrder: 'asc' | 'desc') => {
      updateURL({ sortBy, sortOrder });
    },
    [updateURL]
  );

  const toggleSortOrder = useCallback(() => {
    updateURL({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
  }, [updateURL, filters.sortOrder]);

  const setPage = useCallback(
    (page: number) => {
      updateURL({ page });
    },
    [updateURL]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      updateURL({ pageSize, page: 1 }); // 페이지 크기 변경 시 페이지 초기화
      if (isClient) {
        localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
      }
    },
    [updateURL, isClient]
  );

  // 뷰 변경 (localStorage 저장)
  const setView = useCallback(
    (newView: ViewType) => {
      setViewState(newView);
      if (isClient) {
        localStorage.setItem(VIEW_STORAGE_KEY, newView);
      }
    },
    [isClient]
  );

  // 모든 필터 초기화
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // 활성 필터 개수
  // ✅ SSOT: countActiveFilters 유틸리티 사용
  const activeFilterCount = useMemo(() => {
    return countActiveFilters(filters as UIEquipmentFilters);
  }, [filters]);

  // 활성 필터 여부
  const hasActiveFilters = activeFilterCount > 0;

  // API 쿼리용 필터 객체 생성
  // ✅ SSOT: convertFiltersToApiParams 유틸리티 사용
  // @see lib/utils/equipment-filter-utils.ts
  const queryFilters = useMemo(() => {
    return convertFiltersToApiParams(filters as UIEquipmentFilters);
  }, [filters]);

  return {
    // 필터 상태
    filters,
    view,
    isClient,

    // 필터 설정 함수
    setSearch,
    setSite,
    setStatus,
    setCalibrationMethod,
    setClassification,
    setIsShared,
    setCalibrationDueFilter,
    setTeamId,
    setSortBy,
    setSortOrder,
    setSort,
    toggleSortOrder,
    setPage,
    setPageSize,
    setView,
    clearFilters,

    // 유틸리티
    activeFilterCount,
    hasActiveFilters,
    queryFilters,
    updateURL,
  };
}

export default useEquipmentFilters;
