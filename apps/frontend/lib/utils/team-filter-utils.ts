/**
 * ============================================================================
 * 🔴 SSOT: 팀 필터 변환 유틸리티 (Single Source of Truth)
 * ============================================================================
 *
 * ⚠️ 이 파일은 팀 필터 파싱/변환의 유일한 소스입니다.
 * 다른 파일에서 직접 필터 파싱 로직을 작성하지 마세요!
 *
 * 이 파일이 존재하는 이유:
 * - 2026-02-14 버그: page.tsx와 TeamList.tsx가 각각 다른 상태 관리 방식을
 *   사용하여 "전체 사이트" 선택 시 무한 리다이렉트 문제 발생
 * - Equipment 페이지의 성공 패턴을 Teams 페이지에 적용
 *
 * 사용처:
 * - app/(dashboard)/teams/page.tsx (Server Component)
 * - hooks/use-team-filters.ts (Client Hook)
 * - components/teams/TeamListContent.tsx (Client Component)
 *
 * ============================================================================
 * 🔴 새로운 필터 추가 시 체크리스트
 * ============================================================================
 *
 * 1. [이 파일] UITeamFilters 인터페이스에 필드 추가
 * 2. [이 파일] ApiTeamFilters 인터페이스에 필드 추가 (필요시)
 * 3. [이 파일] DEFAULT_UI_FILTERS에 기본값 추가
 * 4. [이 파일] parseTeamFiltersFromSearchParams() 함수 업데이트
 * 5. [이 파일] convertFiltersToApiParams() 함수 업데이트
 * 6. [이 파일] countActiveFilters() 함수 업데이트
 * 7. hooks/use-team-filters.ts - updateFilters 함수 (필요시)
 * 8. components/teams/TeamFilters.tsx - UI 컴포넌트
 * 9. packages/schemas/src/team.ts - 백엔드 Zod 스키마 (필요시)
 * 10. backend/.../teams.service.ts - 백엔드 쿼리 로직
 *
 * ============================================================================
 */

import type { Site, TeamType } from '@equipment-management/schemas';

/**
 * UI에서 사용하는 필터 타입 (URL 파라미터와 1:1 대응)
 */
export interface UITeamFilters {
  search: string; // 검색어 (팀 이름, 설명)
  site: Site | ''; // 사이트 ('' = 전체)
  type: TeamType | ''; // 팀 유형 ('' = 전체)
}

/**
 * API에서 사용하는 필터 타입 (백엔드 쿼리 파라미터)
 */
export interface ApiTeamFilters {
  search?: string;
  site?: Site;
  type?: TeamType;
  pageSize?: number; // 팀은 보통 많지 않으므로 한 번에 로드
}

/**
 * UI 필터 기본값
 */
export const DEFAULT_UI_FILTERS: UITeamFilters = {
  search: '',
  site: '',
  type: '',
};

/**
 * URLSearchParams에서 UI 필터 객체로 변환
 *
 * 서버 컴포넌트와 클라이언트 훅에서 동일하게 사용
 *
 * @param searchParams - URL 쿼리 파라미터 (URLSearchParams 또는 Record<string, string | string[] | undefined>)
 * @returns UI 필터 객체
 *
 * "_all" 변환 규칙:
 * - URL: site=_all → UI State: site='' (빈 문자열)
 * - 이유: 무한 리다이렉트 방지 + Radix UI Select 제약 우회
 */
export function parseTeamFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): UITeamFilters {
  // URLSearchParams와 일반 객체 모두 지원
  const get = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (typeof value === 'string') return value;
    // 배열인 경우 첫 번째 값 반환 (Next.js가 중복 쿼리 파라미터를 배열로 전달할 수 있음)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }
    return null;
  };

  const search = get('search') || DEFAULT_UI_FILTERS.search;

  // ✅ "_all"을 빈 문자열로 변환 (무한 리다이렉트 방지)
  const siteRaw = get('site') || DEFAULT_UI_FILTERS.site;
  const site = (siteRaw === '_all' ? '' : siteRaw) as Site | '';

  const typeRaw = get('type') || DEFAULT_UI_FILTERS.type;
  const type = (typeRaw === '_all' ? '' : typeRaw) as TeamType | '';

  return {
    search,
    site,
    type,
  };
}

/**
 * UI 필터를 API 쿼리 파라미터로 변환
 *
 * @param filters - UI 필터 객체
 * @returns API 쿼리 파라미터 객체
 */
export function convertFiltersToApiParams(filters: UITeamFilters): ApiTeamFilters {
  return {
    search: filters.search || undefined,
    site: filters.site || undefined,
    type: filters.type || undefined,
    pageSize: 50, // 팀은 보통 많지 않으므로 한 번에 로드
  };
}

/**
 * 활성 필터 개수 계산
 *
 * @param filters - UI 필터 객체
 * @returns 활성 필터 개수
 */
export function countActiveFilters(filters: UITeamFilters): number {
  let count = 0;
  if (filters.search) count++;
  if (filters.site) count++;
  if (filters.type) count++;
  return count;
}
