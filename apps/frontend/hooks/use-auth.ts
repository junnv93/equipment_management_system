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
  SESSION_SYNC_CHANNEL,
  SESSION_SYNC_MESSAGE,
  type Permission,
  hasPermission,
} from '@equipment-management/shared-constants';
import { type UserRole } from '@equipment-management/schemas';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';

  // 원시값 추출 — useCallback 의존성을 객체 참조가 아닌 원시값으로 좁혀
  // NextAuth 토큰 자동 갱신(만료 60초 전) 시 불필요한 콜백 재생성 방지
  const userRole = session?.user?.role;

  // Permission 기반 권한 확인 (SSOT: shared-constants/role-permissions.ts)
  //
  // 역할 기반 `hasRole()`은 2026-04-08에 제거되었다 — 모든 호출처가 `can(Permission.X)`로
  // 마이그레이션되어 백엔드 @RequirePermissions 정책과 단일 SSOT를 공유한다.
  // 서버 액션에서의 역할 체크는 `lib/auth/server-session.ts#hasRole`을 사용하라.
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!userRole) return false;
      return hasPermission(userRole as UserRole, permission);
    },
    [userRole]
  );

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
    can,
    logout,
  };
}
