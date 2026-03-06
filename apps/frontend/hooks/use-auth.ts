/**
 * 인증 관련 커스텀 훅
 *
 * ⚠️ 인증 정책: NextAuth 단일 인증 소스
 * - 모든 인증 상태는 NextAuth 세션에서 관리
 * - localStorage 토큰 사용 금지
 * - API 호출 시 세션의 accessToken 사용
 */

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { clearTokenCache } from '@/lib/api/api-client';
import { ADMIN_ROLES } from '@equipment-management/shared-constants';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';

  // 역할 확인 함수
  const hasRole = useCallback(
    (requiredRole: string | string[]): boolean => {
      if (!isAuthenticated || !session?.user?.roles) {
        return false;
      }

      const userRoles = session.user.roles;
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

      return requiredRoles.some(
        (role) =>
          userRoles.includes(role) ||
          userRoles.includes(role.toUpperCase()) ||
          userRoles.includes(role.toLowerCase())
      );
    },
    [isAuthenticated, session]
  );

  // 시험소 관리자 권한 확인 (lab_manager, system_admin — SSOT: ADMIN_ROLES)
  const isAdmin = useCallback(() => {
    return hasRole(ADMIN_ROLES);
  }, [hasRole]);

  // 기술책임자 이상 권한 확인 (technical_manager, lab_manager, system_admin)
  const isManager = useCallback(() => {
    return hasRole(['technical_manager', ...ADMIN_ROLES]);
  }, [hasRole]);

  // 시험실무자 권한 확인
  const isTestOperator = useCallback(() => {
    return hasRole(['test_engineer']);
  }, [hasRole]);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    // ✅ API 클라이언트 토큰 캐시 초기화
    clearTokenCache();
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  }, [router]);

  // auth:session-expired 핸들러는 AuthSync(providers.tsx)가 SSOT로 처리

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    hasRole,
    isAdmin,
    isManager,
    isTestOperator,
    logout,
  };
}
