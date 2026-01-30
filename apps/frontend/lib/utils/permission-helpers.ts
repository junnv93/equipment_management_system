/**
 * 권한 체크 유틸리티
 *
 * 사용자 역할 기반 권한 확인 함수들
 */

/**
 * 사용자가 승인 권한을 가지고 있는지 확인
 *
 * 승인 권한이 있는 역할:
 * - technical_manager: 장비, 교정, 반출, 보정계수 승인
 * - quality_manager: 교정계획서 검토, 소프트웨어 승인
 * - lab_manager: 모든 최종 승인
 *
 * @param userRole - 사용자 역할
 * @returns 승인 권한 여부
 */
export function hasApprovalPermissions(userRole?: string | null): boolean {
  if (!userRole) return false;

  const approvalRoles = ['technical_manager', 'quality_manager', 'lab_manager'];

  return approvalRoles.includes(userRole.toLowerCase());
}

/**
 * 사용자가 관리자 권한을 가지고 있는지 확인
 *
 * @param userRole - 사용자 역할
 * @returns 관리자 권한 여부
 */
export function hasAdminPermissions(userRole?: string | null): boolean {
  if (!userRole) return false;

  const adminRoles = ['lab_manager', 'system_admin'];

  return adminRoles.includes(userRole.toLowerCase());
}

/**
 * 사용자가 특정 역할인지 확인
 *
 * @param userRole - 사용자 역할
 * @param targetRole - 확인할 대상 역할
 * @returns 역할 일치 여부
 */
export function hasRole(userRole?: string | null, targetRole?: string): boolean {
  if (!userRole || !targetRole) return false;

  return userRole.toLowerCase() === targetRole.toLowerCase();
}
