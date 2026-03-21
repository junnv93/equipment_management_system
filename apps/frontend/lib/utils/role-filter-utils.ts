/**
 * 역할별 기본 필터 리다이렉트 유틸리티
 *
 * SSOT: TEAM_RESTRICTED_ROLES, SITE_RESTRICTED_ROLES from @equipment-management/shared-constants
 *
 * 사용처: Server Component의 page.tsx에서 역할별 기본 필터를 URL에 반영
 * - equipment/page.tsx
 * - calibration/page.tsx
 * - 기타 역할별 필터가 필요한 목록 페이지
 *
 * 아키텍처 원칙:
 * - URL 파라미터가 유일한 진실의 소스 (SSOT)
 * - 서버 사이드 redirect만 사용 (클라이언트 useEffect 금지)
 */

import {
  TEAM_RESTRICTED_ROLES,
  SITE_RESTRICTED_ROLES,
  TEAMS_SITE_RESTRICTED_ROLES,
  type UserRole,
} from '@equipment-management/shared-constants';
import {
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
} from '@equipment-management/schemas';

/**
 * 역할별 기본 필터 리다이렉트 URL 생성
 *
 * @param basePath - 페이지 경로 (예: '/equipment', '/calibration')
 * @param searchParams - 현재 URL searchParams
 * @param user - 세션 사용자 정보 (role, site, teamId)
 * @returns redirect URL string if redirect needed, null if not
 *
 * 무한 리다이렉트 방지:
 * - site=_all 또는 teamId=_all: 사용자가 명시적으로 "전체" 선택 → 리다이렉트 안 함
 * - 파라미터 없음: 첫 방문 → 기본 필터 적용
 */
export function buildRoleBasedRedirectUrl(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  user: { role: string; site?: string; teamId?: string }
): string | null {
  const siteParam = searchParams.site;
  const teamIdParam = searchParams.teamId;

  // ✅ "_all"이 있으면 사용자가 명시적으로 "전체" 선택 → 리다이렉트 안 함
  if (siteParam === '_all' || teamIdParam === '_all') return null;

  const hasSiteParam = siteParam !== undefined;
  const hasTeamParam = teamIdParam !== undefined;

  const shouldApplySite =
    SITE_RESTRICTED_ROLES.includes(user.role as UserRole) && !!user.site && !hasSiteParam;

  const shouldApplyTeam =
    TEAM_RESTRICTED_ROLES.includes(user.role as UserRole) && !!user.teamId && !hasTeamParam;

  if (!shouldApplySite && !shouldApplyTeam) return null;

  const params = new URLSearchParams();

  // 기존 파라미터 유지
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null) {
      params.set(key, Array.isArray(value) ? value[0] : String(value));
    }
  }

  // 기본 필터 추가
  if (shouldApplySite) params.set('site', user.site!);
  if (shouldApplyTeam) params.set('teamId', user.teamId!);

  return `${basePath}?${params.toString()}`;
}

/**
 * 팀 페이지 역할별 사이트 필터 리다이렉트 URL 생성
 *
 * 장비 페이지와 다른 점:
 * - 사이트 필터만 적용 (팀 필터 없음 — 팀 목록 자체가 팀 필터)
 * - quality_manager는 사이트 제한 없음 (교차 사이트 검토 업무)
 * - TEAMS_SITE_RESTRICTED_ROLES: TE, TM, LM만 사이트 제한
 *
 * 무한 리다이렉트 방지:
 * - site=_all: 사용자가 명시적으로 "전체" 선택 → 리다이렉트 안 함
 * - site 없음: 첫 방문 → 기본 필터 적용
 */
export function buildTeamsPageRedirectUrl(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  user: { role: string; site?: string }
): string | null {
  const siteParam = searchParams.site;

  // ✅ "_all"이 있으면 사용자가 명시적으로 "전체" 선택 → 리다이렉트 안 함
  if (siteParam === '_all') return null;

  // ✅ 파라미터가 아예 없으면 첫 방문 → 기본 필터 적용
  const hasSiteParam = siteParam !== undefined;

  const shouldApplySite =
    TEAMS_SITE_RESTRICTED_ROLES.includes(user.role as UserRole) && !!user.site && !hasSiteParam;

  if (!shouldApplySite) return null;

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null) {
      params.set(key, Array.isArray(value) ? value[0] : String(value));
    }
  }

  params.set('site', user.site!);

  return `${basePath}?${params.toString()}`;
}

/**
 * 사용자 표시 설정 기반 기본 필터 리다이렉트 URL 생성
 *
 * URL에 명시적 파라미터가 없을 때만 사용자 설정값을 적용합니다.
 * 기본값(DEFAULT_DISPLAY_PREFERENCES)과 동일한 경우 리다이렉트하지 않습니다.
 *
 * 적용 항목:
 * - sortBy: 사용자 기본 정렬 (managementNumber/name/updatedAt)
 * - pageSize: 사용자 기본 페이지 크기 (10/20/50)
 *
 * 무한 리다이렉트 방지:
 * - 이미 URL에 해당 파라미터가 있으면 건드리지 않음
 * - 사용자 설정이 시스템 기본값과 같으면 리다이렉트 불필요
 */
export function buildPreferencesRedirectUrl(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  preferences: DisplayPreferences
): string | null {
  const hasSortBy = searchParams.sortBy !== undefined;
  const hasPageSize = searchParams.pageSize !== undefined;

  // 사용자 설정이 시스템 기본값과 다른 항목만 리다이렉트 대상
  const shouldApplySort =
    !hasSortBy &&
    preferences.defaultEquipmentSort !== DEFAULT_DISPLAY_PREFERENCES.defaultEquipmentSort;

  const shouldApplyPageSize =
    !hasPageSize && preferences.itemsPerPage !== DEFAULT_DISPLAY_PREFERENCES.itemsPerPage;

  if (!shouldApplySort && !shouldApplyPageSize) return null;

  const params = new URLSearchParams();

  // 기존 파라미터 유지
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null) {
      params.set(key, Array.isArray(value) ? value[0] : String(value));
    }
  }

  if (shouldApplySort) {
    params.set('sortBy', preferences.defaultEquipmentSort);
    // 정렬 방향은 기본값(asc) 유지
  }
  if (shouldApplyPageSize) {
    params.set('pageSize', preferences.itemsPerPage);
  }

  return `${basePath}?${params.toString()}`;
}
