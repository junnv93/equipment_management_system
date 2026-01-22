/**
 * 인증 관련 유틸리티 함수
 */

/**
 * URL이 안전한 콜백 URL인지 확인
 * 외부 URL로의 리다이렉트를 방지
 */
export function isValidCallbackUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  // 상대 경로는 항상 허용
  if (url.startsWith('/')) return true;

  try {
    const parsedUrl = new URL(url);
    const currentOrigin =
      typeof window !== 'undefined' ? window.location.origin : '';

    // localhost는 개발 환경에서 허용
    if (parsedUrl.hostname === 'localhost') return true;

    // 같은 origin만 허용
    if (currentOrigin && parsedUrl.origin === currentOrigin) return true;

    return false;
  } catch {
    // URL 파싱 실패 시 허용하지 않음
    return false;
  }
}

/**
 * 안전한 콜백 URL 반환
 * 유효하지 않은 URL은 기본값으로 대체
 */
export function getSafeCallbackUrl(
  url: string | null | undefined,
  defaultUrl: string = '/'
): string {
  if (isValidCallbackUrl(url)) {
    return url!;
  }
  return defaultUrl;
}

/**
 * 사용자 역할 확인
 */
export function hasRole(
  userRoles: string[] | undefined | null,
  requiredRole: string
): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  const normalizedRequired = requiredRole.toLowerCase();
  return userRoles.some((role) => role.toLowerCase() === normalizedRequired);
}

/**
 * 여러 역할 중 하나라도 가지고 있는지 확인
 */
export function hasAnyRole(
  userRoles: string[] | undefined | null,
  requiredRoles: string[]
): boolean {
  return requiredRoles.some((role) => hasRole(userRoles, role));
}

/**
 * 모든 역할을 가지고 있는지 확인
 */
export function hasAllRoles(
  userRoles: string[] | undefined | null,
  requiredRoles: string[]
): boolean {
  return requiredRoles.every((role) => hasRole(userRoles, role));
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(userRoles: string[] | undefined | null): boolean {
  return hasAnyRole(userRoles, [
    'admin',
    'ADMIN',
    'system_admin',
    'SYSTEM_ADMIN',
  ]);
}

/**
 * 시험소 관리자 권한 확인
 */
export function isSiteAdmin(userRoles: string[] | undefined | null): boolean {
  return hasAnyRole(userRoles, [
    'lab_manager',
    'LAB_MANAGER',
    'system_admin',
    'SYSTEM_ADMIN',
  ]);
}

/**
 * 기술책임자 권한 확인
 */
export function isTechnicalManager(
  userRoles: string[] | undefined | null
): boolean {
  return (
    hasAnyRole(userRoles, [
      'technical_manager',
      'TECHNICAL_MANAGER',
      'manager',
      'MANAGER',
    ]) || isSiteAdmin(userRoles)
  );
}

/**
 * 매니저 이상 권한 확인
 */
export function isManager(userRoles: string[] | undefined | null): boolean {
  return isTechnicalManager(userRoles);
}

/**
 * 역할 레벨 비교
 * 높은 숫자가 더 높은 권한
 */
export function getRoleLevel(role: string): number {
  const roleLevels: Record<string, number> = {
    test_engineer: 1,
    technical_manager: 2,
    manager: 2,
    lab_manager: 3,
    system_admin: 4,
    admin: 4,
  };

  return roleLevels[role.toLowerCase()] || 0;
}

/**
 * 사용자가 필요한 권한 레벨 이상인지 확인
 */
export function hasMinimumRoleLevel(
  userRoles: string[] | undefined | null,
  minimumRole: string
): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;

  const minimumLevel = getRoleLevel(minimumRole);
  return userRoles.some((role) => getRoleLevel(role) >= minimumLevel);
}
