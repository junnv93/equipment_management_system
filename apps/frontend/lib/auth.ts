/**
 * 인증 관련 유틸리티 함수
 */

import { getSession } from 'next-auth/react';

/**
 * 현재 사용자의 세션 정보 가져오기
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * 사용자 역할 확인
 */
export function hasRole(userRoles: string[] | undefined, requiredRole: string): boolean {
  if (!userRoles) return false;
  return userRoles.includes(requiredRole) || userRoles.includes(requiredRole.toUpperCase());
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, 'ADMIN') || hasRole(userRoles, 'admin');
}

/**
 * 매니저 권한 확인
 */
export function isManager(userRoles: string[] | undefined): boolean {
  return hasRole(userRoles, 'MANAGER') || hasRole(userRoles, 'manager') || isAdmin(userRoles);
}
