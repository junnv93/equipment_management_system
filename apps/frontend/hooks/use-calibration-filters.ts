/**
 * 교정 필터 관리 훅
 *
 * URL 상태를 SSOT(Single Source of Truth)로 사용하여 교정 필터를 관리합니다.
 *
 * 특징:
 * - URL 파라미터가 유일한 진실의 소스
 * - 필터 변경 시 URL 업데이트 (router.replace)
 * - SSOT 유틸리티 함수 재사용 (calibration-filter-utils.ts)
 * - 활성 필터 개수 자동 계산
 *
 * 사용처:
 * - app/(dashboard)/calibration/CalibrationContent.tsx
 *
 * @see lib/utils/calibration-filter-utils.ts
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  UICalibrationFilters,
  parseCalibrationFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  DEFAULT_UI_FILTERS,
} from '@/lib/utils/calibration-filter-utils';
import type { Site } from '@equipment-management/schemas';

/**
 * 교정 필터 관리 훅
 *
 * @param initialFilters - 서버에서 전달받은 초기 필터 (optional)
 * @returns 필터 상태 및 업데이트 함수
 */
export function useCalibrationFilters(_initialFilters?: UICalibrationFilters) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 (URL SSOT)
  const currentFilters = useMemo(
    () => parseCalibrationFiltersFromSearchParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  // API 파라미터 변환
  const apiFilters = useMemo(() => convertFiltersToApiParams(currentFilters), [currentFilters]);

  // 활성 필터 개수
  const activeCount = useMemo(() => countActiveFilters(currentFilters), [currentFilters]);

  /**
   * 필터 업데이트 함수
   *
   * ✅ 무한 리다이렉트 방지: "_all" 센티널 값으로 "첫 방문"과 "전체 선택" 구분
   * - scroll: false로 스크롤 위치 유지
   *
   * @param updates - 업데이트할 필터 (부분 업데이트 가능)
   */
  const updateFilters = (updates: Partial<UICalibrationFilters>) => {
    const newFilters = { ...currentFilters, ...updates };
    const params = new URLSearchParams();

    // 검색어 (빈 문자열이 아닐 때만)
    if (newFilters.search && newFilters.search !== DEFAULT_UI_FILTERS.search) {
      params.set('search', newFilters.search);
    }

    // ✅ site: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('site' in updates || newFilters.site) {
      params.set('site', newFilters.site || '_all');
    }

    // ✅ teamId: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('teamId' in updates || newFilters.teamId) {
      params.set('teamId', newFilters.teamId || '_all');
    }

    // ✅ approvalStatus: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('approvalStatus' in updates || newFilters.approvalStatus) {
      params.set('approvalStatus', newFilters.approvalStatus || '_all');
    }

    // ✅ result: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('result' in updates || newFilters.result) {
      params.set('result', newFilters.result || '_all');
    }

    // 날짜 필터 (값이 있을 때만)
    if (newFilters.startDate && newFilters.startDate !== DEFAULT_UI_FILTERS.startDate) {
      params.set('startDate', newFilters.startDate);
    }
    if (newFilters.endDate && newFilters.endDate !== DEFAULT_UI_FILTERS.endDate) {
      params.set('endDate', newFilters.endDate);
    }

    // ✅ tab: 기본값('list')이 아닐 때만 URL에 포함
    if (newFilters.tab && newFilters.tab !== DEFAULT_UI_FILTERS.tab) {
      params.set('tab', newFilters.tab);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/calibration?${queryString}` : '/calibration';

    router.replace(newUrl, { scroll: false });
  };

  /**
   * 검색어 업데이트 헬퍼
   */
  const updateSearch = (search: string) => {
    updateFilters({ search });
  };

  /**
   * 사이트 필터 업데이트 헬퍼
   */
  const updateSite = (site: Site | '') => {
    updateFilters({ site });
  };

  /**
   * 팀 필터 업데이트 헬퍼
   */
  const updateTeamId = (teamId: string) => {
    updateFilters({ teamId });
  };

  /**
   * 승인 상태 필터 업데이트 헬퍼
   */
  const updateApprovalStatus = (approvalStatus: string) => {
    updateFilters({ approvalStatus });
  };

  /**
   * 교정 결과 필터 업데이트 헬퍼
   */
  const updateResult = (result: string) => {
    updateFilters({ result });
  };

  /**
   * 활성 탭 업데이트 헬퍼
   */
  const updateTab = (tab: UICalibrationFilters['tab']) => {
    updateFilters({ tab });
  };

  /**
   * 날짜 범위 필터 업데이트 헬퍼
   */
  const updateDateRange = (startDate: string, endDate: string) => {
    updateFilters({ startDate, endDate });
  };

  /**
   * 필터 초기화
   */
  const clearFilters = () => {
    router.replace('/calibration', { scroll: false });
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
    /** 검색어 업데이트 */
    updateSearch,
    /** 사이트 필터 업데이트 */
    updateSite,
    /** 팀 필터 업데이트 */
    updateTeamId,
    /** 승인 상태 필터 업데이트 */
    updateApprovalStatus,
    /** 교정 결과 필터 업데이트 */
    updateResult,
    /** 활성 탭 업데이트 */
    updateTab,
    /** 날짜 범위 필터 업데이트 */
    updateDateRange,
    /** 필터 초기화 */
    clearFilters,
  };
}
