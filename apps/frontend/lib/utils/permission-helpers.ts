/**
 * 권한 체크 유틸리티
 *
 * 사용자 역할 기반 권한 확인 함수들
 * ⚠️ SSOT: 역할 상수는 @equipment-management/shared-constants에서 import
 */

import { APPROVAL_ROLES, ADMIN_ROLES, type UserRole } from '@equipment-management/shared-constants';

// Fallback values in case of module resolution issues during HMR
const FALLBACK_APPROVAL_ROLES: UserRole[] = [
  'technical_manager',
  'quality_manager',
  'lab_manager',
  'system_admin',
];
const FALLBACK_ADMIN_ROLES: UserRole[] = ['lab_manager', 'system_admin'];

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
