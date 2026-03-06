/**
 * 사용자 역할 상수
 *
 * ⚠️ SSOT: 역할의 원본 정의는 @equipment-management/schemas의 UserRoleEnum
 * 이 파일은 re-export + 추가 유틸리티 제공
 *
 * 역할 계층 (UL-QP-18 기준 + 3단계 승인):
 * - test_engineer: 시험실무자 (기본 운영, 승인 요청)
 * - technical_manager: 기술책임자 (승인, 교정 관리, 교정계획서 작성)
 * - quality_manager: 품질책임자 (교정계획서 검토)
 * - lab_manager: 시험소장 (전체 권한, 자가 승인, 교정계획서 최종 승인)
 * - system_admin: 시스템 관리자 (전체 접근, CREATE_CALIBRATION 제외)
 */

// SSOT에서 re-export
export {
  UserRoleEnum,
  type UserRole,
  USER_ROLE_VALUES,
  USER_ROLE_LABELS,
  UserRoleValues,
} from '@equipment-management/schemas';

import type { UserRole } from '@equipment-management/schemas';

/**
 * 역할 계층 우선순위 (높을수록 상위 권한)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  test_engineer: 1,
  technical_manager: 2,
  quality_manager: 3,
  lab_manager: 4,
  system_admin: 5,
};

/**
 * 상위 역할 여부 확인
 * @param userRole 확인할 역할
 * @param requiredRole 요구 역할
 * @returns userRole이 requiredRole 이상이면 true
 */
export function hasEqualOrHigherRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * 역할이 기술책임자 이상인지 확인
 */
export function isTechnicalManagerOrAbove(role: UserRole): boolean {
  return hasEqualOrHigherRole(role, 'technical_manager');
}

/**
 * 역할이 품질책임자 이상인지 확인
 */
export function isQualityManagerOrAbove(role: UserRole): boolean {
  return hasEqualOrHigherRole(role, 'quality_manager');
}

/**
 * 역할이 품질책임자인지 확인
 */
export function isQualityManager(role: UserRole): boolean {
  return role === 'quality_manager';
}

/**
 * 역할이 시험소장인지 확인
 */
export function isLabManager(role: UserRole): boolean {
  return role === 'lab_manager';
}

/**
 * 역할이 시험소장 이상인지 확인
 */
export function isLabManagerOrAbove(role: UserRole): boolean {
  return hasEqualOrHigherRole(role, 'lab_manager');
}

/**
 * 역할이 시스템 관리자인지 확인
 */
export function isSystemAdmin(role: UserRole): boolean {
  return role === 'system_admin';
}

/**
 * 승인 권한이 있는 역할 목록
 * (기술책임자, 품질책임자, 시험소장)
 */
export const APPROVAL_ROLES: UserRole[] = [
  'technical_manager',
  'quality_manager',
  'lab_manager',
  'system_admin',
];

/**
 * 관리자 권한이 있는 역할 목록
 * (시험소장)
 */
export const ADMIN_ROLES: UserRole[] = ['lab_manager', 'system_admin'];

/**
 * 팀 제한 역할 목록
 * (시험실무자, 기술책임자는 자기 팀 장비만 등록/조회 가능)
 */
export const TEAM_RESTRICTED_ROLES: UserRole[] = ['test_engineer', 'technical_manager'];

/**
 * 사이트 제한 역할 목록
 * (모든 일반 역할은 자기 사이트 데이터만 기본 조회)
 */
export const SITE_RESTRICTED_ROLES: UserRole[] = [
  'test_engineer',
  'technical_manager',
  'quality_manager',
  'lab_manager',
];

/**
 * 역할이 승인 권한이 있는지 확인
 */
export function canApprove(role: UserRole): boolean {
  return APPROVAL_ROLES.includes(role);
}

/**
 * 역할이 팀 제한인지 확인
 */
export function isTeamRestricted(role: UserRole): boolean {
  return TEAM_RESTRICTED_ROLES.includes(role);
}

/**
 * 역할이 사이트 제한인지 확인
 */
export function isSiteRestricted(role: UserRole): boolean {
  return SITE_RESTRICTED_ROLES.includes(role);
}

/**
 * 팀 관리 페이지용 사이트 제한 역할 목록
 * quality_manager는 전체 사이트 조회 가능 (교정계획서 검토 역할)
 */
export const TEAMS_SITE_RESTRICTED_ROLES: UserRole[] = [
  'test_engineer',
  'technical_manager',
  'lab_manager',
];
