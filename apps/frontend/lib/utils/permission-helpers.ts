/**
 * 권한 체크 유틸리티
 *
 * 사용자 역할 기반 권한 확인 함수들
 * ⚠️ SSOT: 역할 상수는 @equipment-management/shared-constants에서 import
 */

import { APPROVAL_ROLES, ADMIN_ROLES, type UserRole } from '@equipment-management/shared-constants';
import { UserRoleValues as URVal } from '@equipment-management/schemas';

// Fallback values in case of module resolution issues during HMR
const FALLBACK_APPROVAL_ROLES: UserRole[] = [
  URVal.TECHNICAL_MANAGER,
  URVal.QUALITY_MANAGER,
  URVal.LAB_MANAGER,
  URVal.SYSTEM_ADMIN,
];
const FALLBACK_ADMIN_ROLES: UserRole[] = [URVal.LAB_MANAGER, URVal.SYSTEM_ADMIN];

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

  const roles = APPROVAL_ROLES ?? FALLBACK_APPROVAL_ROLES;
  return roles.includes(userRole.toLowerCase() as UserRole);
}

/**
 * 사용자가 관리자 권한을 가지고 있는지 확인
 *
 * @param userRole - 사용자 역할
 * @returns 관리자 권한 여부
 */
export function hasAdminPermissions(userRole?: string | null): boolean {
  if (!userRole) return false;

  const roles = ADMIN_ROLES ?? FALLBACK_ADMIN_ROLES;
  return roles.includes(userRole.toLowerCase() as UserRole);
}

/** 역할 코드 → 표시명 매핑 (React 컨텍스트 외 API 레이어 SSOT) */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [URVal.TEST_ENGINEER]: 'Test Engineer',
  [URVal.TECHNICAL_MANAGER]: 'Technical Manager',
  [URVal.QUALITY_MANAGER]: 'Quality Manager',
  [URVal.LAB_MANAGER]: 'Lab Manager',
  [URVal.SYSTEM_ADMIN]: 'System Admin',
};

/**
 * 역할 코드 → 표시명 변환
 *
 * API 매핑 레이어에서 사용자명 fallback에 사용.
 * React hook 컨텍스트 밖이므로 정적 테이블 사용 (i18n 불가).
 */
export function getRoleDisplayName(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  return ROLE_DISPLAY_NAMES[role] ?? role;
}
