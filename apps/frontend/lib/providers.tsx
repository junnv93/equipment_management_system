'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { clearTokenCache } from '@/lib/api/api-client';
import { AuthenticatedClientProvider } from '@/lib/api/authenticated-client-provider';

// React Query 클라이언트 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

/**
 * 인증 상태 동기화 컴포넌트
 *
 * ⚠️ 중요: localStorage 토큰 사용 금지
 * - 모든 인증 토큰은 NextAuth 세션(httpOnly 쿠키)에서 관리
 * - API 클라이언트는 getSession()을 통해 토큰 접근
 * - 참고: docs/development/AUTH_ARCHITECTURE.md
 *
 * Token Refresh 아키텍처:
 * - SessionProvider refetchInterval(5분)로 주기적 JWT 콜백 트리거
 * - session.error === 'RefreshAccessTokenError' 감지 시 자동 로그아웃
 */
function AuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // 로그아웃 시 API 클라이언트 토큰 캐시 초기화
    if (status === 'unauthenticated') {
      clearTokenCache();
    }
  }, [status]);

  // Refresh Token 만료 감지 → 자동 로그아웃
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      console.error('[AuthSync] Refresh token expired, signing out...');
      signOut({ callbackUrl: '/login' });
    }
  }, [session?.error]);

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

  // 레거시 localStorage 토큰 정리 (마이그레이션)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const legacyToken = localStorage.getItem('token');
      if (legacyToken) {
        console.warn('[Auth] 레거시 localStorage 토큰 발견. 삭제합니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
      }
    }
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          {/* ✅ Best Practice: SessionProvider 내부에서 useSession() 사용 */}
          <AuthenticatedClientProvider>
            <AuthSync>{children}</AuthSync>
          </AuthenticatedClientProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
