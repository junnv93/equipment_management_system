'use client';

import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type {
  Site,
  EquipmentStatus,
  ManagementMethod,
  Classification,
} from '@equipment-management/schemas';
import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
  withPreferences,
  countActiveFilters,
  DEFAULT_UI_FILTERS,
  type UIEquipmentFilters,
} from '@/lib/utils/equipment-filter-utils';
import { useUserPreferences } from '@/hooks/use-user-preferences';

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
  managementMethod: ManagementMethod | '';
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
// pageSize SSOT: URL 파라미터 (현재 세션) + DB preferences (기본값, page.tsx에서 redirect로 적용)

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

  // ✅ 사용자 표시 설정 (showRetiredEquipment → queryFilters에 자동 주입)
  const preferences = useUserPreferences();

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

  // ✅ 최신 필터 상태를 ref로 추적 — stale closure 방지
  // 클라이언트 네비게이션 중 Radix Select의 onValueChange가 stale closure로
  // 잘못된 filters 값을 참조하는 것을 방지. ref는 항상 최신 렌더의 값을 보유.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // URL 업데이트 함수
  // ✅ 무한 리다이렉트 방지: "_all" 센티널 값으로 "첫 방문"과 "전체 선택" 구분
  const updateURL = useCallback(
    (newFilters: Partial<EquipmentFilters>) => {
      // ✅ ref에서 최신 필터 읽기 — useCallback의 stale closure 대신 항상 최신 값 사용
      const currentFilters = { ...filtersRef.current };
      const updatedFilters = { ...currentFilters, ...newFilters }; // 병합
      const params = new URLSearchParams();

      // 검색어 (빈 문자열이 아닐 때만)
      if (updatedFilters.search && updatedFilters.search !== DEFAULT_FILTERS.search) {
        params.set('search', updatedFilters.search);
      }

      // ✅ site: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
      if ('site' in newFilters) {
        params.set('site', updatedFilters.site || '_all');
      } else if (updatedFilters.site) {
        params.set('site', updatedFilters.site);
      }

      // ✅ status: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
      if ('status' in newFilters) {
        params.set('status', updatedFilters.status || '_all');
      } else if (updatedFilters.status) {
        params.set('status', updatedFilters.status);
      }

      // ✅ managementMethod: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
      if ('managementMethod' in newFilters) {
        params.set('managementMethod', updatedFilters.managementMethod || '_all');
      } else if (updatedFilters.managementMethod) {
        params.set('managementMethod', updatedFilters.managementMethod);
      }

      // ✅ classification: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
      if ('classification' in newFilters) {
        params.set('classification', updatedFilters.classification || '_all');
      } else if (updatedFilters.classification) {
        params.set('classification', updatedFilters.classification);
      }

      // ✅ teamId: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
      // spurious onValueChange는 useFilterSelect 훅에서 source 수준에서 차단됨
      if ('teamId' in newFilters) {
        params.set('teamId', updatedFilters.teamId || '_all');
      } else if (updatedFilters.teamId) {
        params.set('teamId', updatedFilters.teamId);
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
    [pathname, router]
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

  const setManagementMethod = useCallback(
    (managementMethod: ManagementMethod | '') => {
      updateURL({ managementMethod, page: 1 });
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
    },
    [updateURL]
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
  // ✅ SSOT: convertFiltersToApiParams (URL 필터) + withPreferences (사용자 설정) 합성
  // @see lib/utils/equipment-filter-utils.ts
  const queryFilters = useMemo(() => {
    return withPreferences(convertFiltersToApiParams(filters as UIEquipmentFilters), preferences);
  }, [filters, preferences]);

  return {
    // 필터 상태
    filters,
    view,
    isClient,

    // 필터 설정 함수
    setSearch,
    setSite,
    setStatus,
    setManagementMethod,
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
