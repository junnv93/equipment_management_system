/**
 * 교정계획서 필터 관리 훅
 *
 * URL 상태를 SSOT(Single Source of Truth)로 사용하여 교정계획서 필터를 관리합니다.
 *
 * 특징:
 * - URL 파라미터가 유일한 진실의 소스
 * - 필터 변경 시 URL 업데이트 (router.replace)
 * - SSOT 유틸리티 함수 재사용 (calibration-plans-filter-utils.ts)
 * - 활성 필터 개수 자동 계산
 *
 * 사용처:
 * - app/(dashboard)/calibration-plans/CalibrationPlansContent.tsx
 *
 * @see lib/utils/calibration-plans-filter-utils.ts
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { CalibrationPlanStatus, Site } from '@equipment-management/schemas';
import {
  UICalibrationPlansFilters,
  parseCalibrationPlansFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  getDefaultUIFilters,
} from '@/lib/utils/calibration-plans-filter-utils';

/**
 * 교정계획서 필터 관리 훅
 *
 * @param initialFilters - 서버에서 전달받은 초기 필터 (optional)
 * @returns 필터 상태 및 업데이트 함수
 */
export function useCalibrationPlansFilters(_initialFilters?: UICalibrationPlansFilters) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 (URL SSOT)
  const currentFilters = useMemo(
    () => parseCalibrationPlansFiltersFromSearchParams(Object.fromEntries(searchParams)),
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
   * - 필터 변경 시 page=1로 리셋 (페이지네이션 정합성)
   *
   * @param updates - 업데이트할 필터 (부분 업데이트 가능)
   */
  const updateFilters = (updates: Partial<UICalibrationPlansFilters>) => {
    // 필터(page/pageSize 제외) 변경 시 page=1로 리셋
    const isFilterChange = Object.keys(updates).some((k) => k !== 'page' && k !== 'pageSize');
    const pageReset = isFilterChange && !('page' in updates) ? { page: 1 } : {};
    const newFilters = { ...currentFilters, ...updates, ...pageReset };
    const defaultFilters = getDefaultUIFilters();
    const params = new URLSearchParams();

    // year (기본값이 아닐 때만)
    if (newFilters.year && newFilters.year !== defaultFilters.year) {
      params.set('year', newFilters.year);
    }

    // ✅ siteId: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
    if ('siteId' in updates) {
      params.set('siteId', newFilters.siteId || '_all');
    } else if (newFilters.siteId) {
      params.set('siteId', newFilters.siteId);
    }

    // ✅ teamId: 브라우저 URL ground truth로 spurious clear 차단
    if ('teamId' in updates) {
      if (!updates.teamId && typeof window !== 'undefined') {
        const browserTeamId = new URLSearchParams(window.location.search).get('teamId');
        if (browserTeamId && browserTeamId !== '_all') {
          params.set('teamId', browserTeamId);
        } else {
          params.set('teamId', '_all');
        }
      } else {
        params.set('teamId', newFilters.teamId || '_all');
      }
    } else if (newFilters.teamId) {
      params.set('teamId', newFilters.teamId);
    }

    // ✅ status: 명시적 변경 시 _all 센티널, 그 외에는 현재 값 보존
    if ('status' in updates) {
      params.set('status', newFilters.status || '_all');
    } else if (newFilters.status) {
      params.set('status', newFilters.status);
    }

    // page (기본값 1이 아닐 때만)
    if (newFilters.page && newFilters.page > 1) {
      params.set('page', String(newFilters.page));
    }

    // pageSize (기본값이 아닐 때만)
    if (newFilters.pageSize && newFilters.pageSize !== defaultFilters.pageSize) {
      params.set('pageSize', String(newFilters.pageSize));
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/calibration-plans?${queryString}` : '/calibration-plans';

    router.replace(newUrl, { scroll: false });
  };

  /**
   * 연도 필터 업데이트 헬퍼
   */
  const updateYear = (year: string) => {
    updateFilters({ year });
  };

  /**
   * 사이트 필터 업데이트 헬퍼
   */
  const updateSiteId = (siteId: Site | '') => {
    updateFilters({ siteId });
  };

  /**
   * 팀 필터 업데이트 헬퍼
   */
  const updateTeamId = (teamId: string) => {
    updateFilters({ teamId });
  };

  /**
   * 상태 필터 업데이트 헬퍼
   */
  const updateStatus = (status: CalibrationPlanStatus | '') => {
    updateFilters({ status });
  };

  /**
   * 페이지 업데이트 헬퍼
   */
  const updatePage = (page: number) => {
    updateFilters({ page });
  };

  /**
   * 페이지 크기 업데이트 헬퍼 (page=1 리셋)
   */
  const updatePageSize = (pageSize: number) => {
    updateFilters({ pageSize, page: 1 });
  };

  /**
   * 필터 초기화 (현재 연도 유지)
   */
  const clearFilters = () => {
    const defaultFilters = getDefaultUIFilters();
    updateFilters({
      year: defaultFilters.year, // 현재 연도로 리셋
      siteId: '',
      teamId: '',
      status: '',
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
    /** 연도 필터 업데이트 */
    updateYear,
    /** 사이트 필터 업데이트 */
    updateSiteId,
    /** 팀 필터 업데이트 */
    updateTeamId,
    /** 상태 필터 업데이트 */
    updateStatus,
    /** 페이지 업데이트 */
    updatePage,
    /** 페이지 크기 업데이트 */
    updatePageSize,
    /** 필터 초기화 */
    clearFilters,
  };
}
