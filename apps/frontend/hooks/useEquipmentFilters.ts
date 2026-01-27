'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Site, EquipmentStatus, CalibrationMethod } from '@equipment-management/schemas';

/**
 * 교정 기한 필터 타입
 */
export type CalibrationDueFilter = 'all' | 'due_soon' | 'overdue' | 'normal';

/**
 * 장비 필터 상태 타입
 */
export interface EquipmentFilters {
  search: string;
  site: Site | '';
  status: EquipmentStatus | '';
  calibrationMethod: CalibrationMethod | '';
  isShared: 'all' | 'shared' | 'normal';
  calibrationDueFilter: CalibrationDueFilter;
  teamId: string;
  sortBy: 'name' | 'createdAt' | 'lastCalibrationDate' | 'nextCalibrationDate' | 'status' | 'managementNumber';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/**
 * 필터 기본값
 */
const DEFAULT_FILTERS: EquipmentFilters = {
  search: '',
  site: '',
  status: '',
  calibrationMethod: '',
  isShared: 'all',
  calibrationDueFilter: 'all',
  teamId: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20,
};

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
  const filters = useMemo<EquipmentFilters>(() => {
    const search = searchParams.get('search') || DEFAULT_FILTERS.search;
    const site = (searchParams.get('site') || DEFAULT_FILTERS.site) as Site | '';
    const status = (searchParams.get('status') || DEFAULT_FILTERS.status) as EquipmentStatus | '';
    const calibrationMethod = (searchParams.get('calibrationMethod') || DEFAULT_FILTERS.calibrationMethod) as CalibrationMethod | '';
    const isSharedParam = searchParams.get('isShared');
    const isShared = isSharedParam === 'shared' || isSharedParam === 'normal' ? isSharedParam : 'all';
    const calibrationDueFilterParam = searchParams.get('calibrationDueFilter');
    const calibrationDueFilter = (calibrationDueFilterParam === 'due_soon' || calibrationDueFilterParam === 'overdue' || calibrationDueFilterParam === 'normal' ? calibrationDueFilterParam : 'all') as CalibrationDueFilter;
    const teamId = searchParams.get('teamId') || DEFAULT_FILTERS.teamId;
    const sortBy = (searchParams.get('sortBy') || DEFAULT_FILTERS.sortBy) as EquipmentFilters['sortBy'];
    const sortOrder = (searchParams.get('sortOrder') || DEFAULT_FILTERS.sortOrder) as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || String(DEFAULT_FILTERS.page), 10);
    const pageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_FILTERS.pageSize), 10);

    return {
      search,
      site,
      status,
      calibrationMethod,
      isShared,
      calibrationDueFilter,
      teamId,
      sortBy,
      sortOrder,
      page: isNaN(page) || page < 1 ? DEFAULT_FILTERS.page : page,
      pageSize: isNaN(pageSize) || pageSize < 1 ? DEFAULT_FILTERS.pageSize : pageSize,
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
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.site) count++;
    if (filters.status) count++;
    if (filters.calibrationMethod) count++;
    if (filters.isShared !== 'all') count++;
    if (filters.calibrationDueFilter !== 'all') count++;
    if (filters.teamId) count++;
    return count;
  }, [filters]);

  // 활성 필터 여부
  const hasActiveFilters = activeFilterCount > 0;

  // API 쿼리용 필터 객체 생성
  const queryFilters = useMemo(() => {
    // 교정 기한 필터를 백엔드 파라미터로 변환
    let calibrationDue: number | undefined;
    let calibrationDueAfter: number | undefined;
    let statusOverride: EquipmentStatus | '' = filters.status;

    if (filters.calibrationDueFilter === 'due_soon') {
      calibrationDue = 30; // 30일 이내 교정 예정 (오늘 <= nextCalibrationDate <= 오늘+30일)
    } else if (filters.calibrationDueFilter === 'overdue') {
      statusOverride = 'calibration_overdue'; // 교정 기한 초과 상태
    } else if (filters.calibrationDueFilter === 'normal') {
      calibrationDueAfter = 30; // 30일 이후 교정 예정 (nextCalibrationDate > 오늘+30일)
    }
    // 'all'은 추가 필터 없음

    return {
      search: filters.search || undefined,
      site: filters.site || undefined,
      status: statusOverride || undefined,
      calibrationMethod: filters.calibrationMethod || undefined,
      isShared: filters.isShared === 'shared' ? true : filters.isShared === 'normal' ? false : undefined,
      calibrationDue,
      calibrationDueAfter,
      teamId: filters.teamId || undefined,
      sort: filters.sortBy ? `${filters.sortBy}.${filters.sortOrder}` : undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    };
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
