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
import { useCallback, useEffect } from 'react';
import { clearTokenCache } from '@/lib/api/api-client';

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

  // 시험소별 관리자 권한 확인
  const isAdmin = useCallback(() => {
    return hasRole(['LAB_MANAGER', 'lab_manager', 'ADMIN', 'admin']); // 하위 호환성 유지
  }, [hasRole]);

  // 기술책임자 권한 확인
  const isManager = useCallback(() => {
    return hasRole([
      'TECHNICAL_MANAGER',
      'technical_manager',
      'MANAGER',
      'manager',
      'LAB_MANAGER',
      'lab_manager',
      'ADMIN',
      'admin',
    ]); // 하위 호환성 유지
  }, [hasRole]);

  // 시험실무자 권한 확인
  const isTestOperator = useCallback(() => {
    return hasRole(['TEST_ENGINEER', 'test_engineer', 'USER', 'user']); // 하위 호환성 유지
  }, [hasRole]);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    // ✅ API 클라이언트 토큰 캐시 초기화
    clearTokenCache();
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  }, [router]);

  // 세션 만료 이벤트 핸들러 (api-client에서 발생)
  useEffect(() => {
    const handleSessionExpired = () => {
      clearTokenCache();
      signOut({ redirect: false });
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

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
