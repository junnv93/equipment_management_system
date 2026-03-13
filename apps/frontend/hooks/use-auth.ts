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
import {
  ADMIN_ROLES,
  SESSION_SYNC_CHANNEL,
  SESSION_SYNC_MESSAGE,
} from '@equipment-management/shared-constants';
import { UserRoleValues as URVal } from '@equipment-management/schemas';

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
    return hasRole([URVal.TECHNICAL_MANAGER, ...ADMIN_ROLES]);
  }, [hasRole]);

  // 로그아웃 함수
  const logout = useCallback(async () => {
    // ✅ API 클라이언트 토큰 캐시 초기화
    clearTokenCache();
    // 다른 탭에 수동 로그아웃 알림 (BroadcastChannel 미지원 브라우저 안전 처리)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL);
      ch.postMessage({ type: SESSION_SYNC_MESSAGE.LOGOUT });
      ch.close();
    }
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
    logout,
  };
}
