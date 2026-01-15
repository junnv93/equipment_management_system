/**
 * 인증 관련 커스텀 훅
 */

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

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

  // 관리자 권한 확인
  const isAdmin = useCallback(() => {
    return hasRole(['ADMIN', 'admin']);
  }, [hasRole]);

  // 매니저 권한 확인
  const isManager = useCallback(() => {
    return hasRole(['MANAGER', 'manager', 'ADMIN', 'admin']);
  }, [hasRole]);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  }, [router]);

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    hasRole,
    isAdmin,
    isManager,
    logout,
  };
}
