/**
 * 팀 필터 관리 훅
 *
 * URL 상태를 SSOT(Single Source of Truth)로 사용하여 팀 필터를 관리합니다.
 *
 * 특징:
 * - URL 파라미터가 유일한 진실의 소스
 * - 필터 변경 시 URL 업데이트 (router.replace)
 * - SSOT 유틸리티 함수 재사용 (team-filter-utils.ts)
 * - 활성 필터 개수 자동 계산
 *
 * 사용처:
 * - components/teams/TeamListContent.tsx
 *
 * @see lib/utils/team-filter-utils.ts
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  UITeamFilters,
  ApiTeamFilters,
  parseTeamFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  DEFAULT_UI_FILTERS,
} from '@/lib/utils/team-filter-utils';
import type { Site, Classification } from '@equipment-management/schemas';

/**
 * 팀 필터 관리 훅
 *
 * @param initialFilters - 서버에서 전달받은 초기 필터 (optional)
 * @returns 필터 상태 및 업데이트 함수
 */
export function useTeamFilters(initialFilters?: UITeamFilters) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 필터 (URL SSOT)
  const currentFilters = useMemo(
    () => parseTeamFiltersFromSearchParams(Object.fromEntries(searchParams)),
    [searchParams]
  );

  // API 파라미터 변환
  const apiFilters = useMemo(() => convertFiltersToApiParams(currentFilters), [currentFilters]);

  // 활성 필터 개수
  const activeCount = useMemo(() => countActiveFilters(currentFilters), [currentFilters]);

  /**
   * 필터 업데이트 함수
   *
   * - 기본값과 같은 필터는 URL에서 제거 (깔끔한 URL)
   * - scroll: false로 스크롤 위치 유지
   *
   * "_all" 변환 규칙:
   * - UI State: site='' (빈 문자열) → URL: site=_all
   * - 이유: 무한 리다이렉트 방지 (서버가 "첫 방문"과 "전체 선택" 구분)
   *
   * @param updates - 업데이트할 필터 (부분 업데이트 가능)
   */
  const updateFilters = (updates: Partial<UITeamFilters>) => {
    const newFilters = { ...currentFilters, ...updates };
    const params = new URLSearchParams();

    // 검색어 추가 (비어있지 않을 때만)
    if (newFilters.search && newFilters.search !== DEFAULT_UI_FILTERS.search) {
      params.set('search', newFilters.search);
    }

    // ✅ site: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('site' in updates || newFilters.site) {
      params.set('site', newFilters.site || '_all');
    }

    // ✅ classification: 값이 있거나, 명시적으로 변경되었으면 URL에 포함
    if ('classification' in updates || newFilters.classification) {
      params.set('classification', newFilters.classification || '_all');
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/teams?${queryString}` : '/teams';

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
   * 팀 분류 필터 업데이트 헬퍼
   */
  const updateClassification = (classification: Classification | '') => {
    updateFilters({ classification });
  };

  /**
   * 필터 초기화
   */
  const clearFilters = () => {
    router.replace('/teams', { scroll: false });
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
    /** 팀 분류 필터 업데이트 */
    updateClassification,
    /** 필터 초기화 */
    clearFilters,
  };
}
