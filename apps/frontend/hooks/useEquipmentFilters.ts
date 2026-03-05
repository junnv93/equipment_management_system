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
  sortBy: 'managementNumber', // ✅ SSOT: DEFAULT_UI_FILTERS와 동일 (백엔드 기본 정렬 기준)
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
    try {
      const savedView = localStorage.getItem(VIEW_STORAGE_KEY) as ViewType | null;
      if (savedView === 'table' || savedView === 'card') {
        setViewState(savedView);
      }
    } catch {
      // Private Browsing, 스토리지 비활성화 등 예외 무시
    }
  }, []);

  // ✅ 역할별 기본 필터는 서버 컴포넌트(page.tsx)에서 처리
  // - SSOT 원칙: 서버 사이드에서 한 곳에서만 필터 적용
  // - 클라이언트 사이드 중복 로직 제거로 일관성 보장

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
  // ✅ 무한 리다이렉트 방지: "_all" 센티널 값으로 "첫 방문"과 "전체 선택" 구분
  const updateURL = useCallback(
    (newFilters: Partial<EquipmentFilters>) => {
      const currentFilters = { ...filters }; // 현재 필터 상태
      const updatedFilters = { ...currentFilters, ...newFilters }; // 병합
      const params = new URLSearchParams();

      // 검색어 (빈 문자열이 아닐 때만)
      if (updatedFilters.search && updatedFilters.search !== DEFAULT_FILTERS.search) {
        params.set('search', updatedFilters.search);
      }

      // ✅ site: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
      if ('site' in newFilters || updatedFilters.site) {
        params.set('site', updatedFilters.site || '_all');
      }

      // ✅ status: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
      if ('status' in newFilters || updatedFilters.status) {
        params.set('status', updatedFilters.status || '_all');
      }

      // ✅ calibrationMethod: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
      if ('calibrationMethod' in newFilters || updatedFilters.calibrationMethod) {
        params.set('calibrationMethod', updatedFilters.calibrationMethod || '_all');
      }

      // ✅ classification: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
      if ('classification' in newFilters || updatedFilters.classification) {
        params.set('classification', updatedFilters.classification || '_all');
      }

      // ✅ teamId: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
      if ('teamId' in newFilters || updatedFilters.teamId) {
        params.set('teamId', updatedFilters.teamId || '_all');
      }

      // isShared (기본값 'all'이 아닐 때만)
      if (updatedFilters.isShared !== 'all') {
        params.set('isShared', updatedFilters.isShared);
      }

      // calibrationDueFilter (기본값 'all'이 아닐 때만)
      if (updatedFilters.calibrationDueFilter !== 'all') {
        params.set('calibrationDueFilter', updatedFilters.calibrationDueFilter);
      }

      // sortBy (기본값이 아닐 때만)
      if (updatedFilters.sortBy !== DEFAULT_FILTERS.sortBy) {
        params.set('sortBy', updatedFilters.sortBy);
        // sortBy가 있으면 sortOrder도 항상 포함
        params.set('sortOrder', updatedFilters.sortOrder);
      }

      // page (1이 아닐 때만)
      if (updatedFilters.page !== 1) {
        params.set('page', String(updatedFilters.page));
      }

      // pageSize (기본값이 아닐 때만)
      if (updatedFilters.pageSize !== DEFAULT_FILTERS.pageSize) {
        params.set('pageSize', String(updatedFilters.pageSize));
      }

      // URL 업데이트 (shallow routing)
      const queryString = params.toString();
      const newURL = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newURL, { scroll: false });
    },
    [pathname, router, filters]
  );

  // 개별 필터 업데이트
  const setSearch = useCallback(
    (search: string) => {
      // 🔥 Trim whitespace and convert empty/whitespace-only strings to empty string
      const trimmedSearch = search.trim();
      updateURL({ search: trimmedSearch, page: 1 }); // 검색 시 페이지 초기화
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
      updateURL({ sortBy, sortOrder }); // 정렬 변경 시 페이지 유지 (결과셋은 동일하므로)
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
        try {
          localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
        } catch {
          // QuotaExceededError, 스토리지 비활성화 등 예외 무시
        }
      }
    },
    [updateURL, isClient]
  );

  // 뷰 변경 (localStorage 저장)
  const setView = useCallback(
    (newView: ViewType) => {
      setViewState(newView);
      if (isClient) {
        try {
          localStorage.setItem(VIEW_STORAGE_KEY, newView);
        } catch {
          // QuotaExceededError, 스토리지 비활성화 등 예외 무시
        }
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
