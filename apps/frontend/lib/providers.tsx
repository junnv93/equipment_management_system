'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession, signOut, getSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { clearTokenCache } from '@/lib/api/api-client';
import { AuthenticatedClientProvider } from '@/lib/api/authenticated-client-provider';
import { CACHE_TIMES } from '@/lib/api/query-config';
import { patchPerformanceMeasure } from '@/lib/utils/patch-performance-measure';
import {
  AUTH_ERROR_CODE,
  AUTH_EVENT,
  SESSION_SYNC_CHANNEL,
  SESSION_SYNC_MESSAGE,
  type SessionSyncMessageType,
  FRONTEND_ROUTES,
} from '@equipment-management/shared-constants';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { IdleTimeoutDialog } from '@/components/auth/IdleTimeoutDialog';

// 탭 복귀 후 쿼리 갱신 임계값: 5분 이상 자리를 비웠으면 세션+쿼리 함께 갱신
const TAB_AWAY_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Turbopack 개발 모드 Performance.measure 음수 타임스탬프 버그 패치
// https://github.com/vercel/next.js/issues/86060
patchPerformanceMeasure();

// React Query 클라이언트 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: CACHE_TIMES.LONG,
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
 * - session.error === AUTH_ERROR_CODE.REFRESH_TOKEN_EXPIRED 감지 시 자동 로그아웃
 */
/**
 * 안전한 signOut — 이중 호출 방지
 *
 * 여러 경로(이벤트 핸들러, status 전환, BroadcastChannel)가 동시에
 * signOut을 트리거할 수 있음. 첫 번째 호출만 실행하고 나머지는 무시.
 */
const isSigningOutRef = { current: false };

function safeSignOut() {
  if (isSigningOutRef.current) return;
  isSigningOutRef.current = true;
  clearTokenCache();
  signOut({ callbackUrl: FRONTEND_ROUTES.AUTH.LOGIN });
}

function AuthSync({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const statusRef = useRef(status);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
    if (status === 'authenticated') {
      wasAuthenticatedRef.current = true;
      isSigningOutRef.current = false; // 재인증 시 guard 리셋
    }
  }, [status]);

  useEffect(() => {
    // 로그아웃 시 API 클라이언트 토큰 캐시 초기화
    if (status === 'unauthenticated') {
      clearTokenCache();
    }
  }, [status]);

  // 세션 상실 감지: authenticated → unauthenticated 전환 시 로그인 리다이렉트
  // 시나리오: JWT 만료, auth 엔드포인트 장애, 쿠키 삭제 등
  // loading → unauthenticated 전환은 무시 (proxy.ts가 초기 진입 시 처리)
  useEffect(() => {
    if (status === 'unauthenticated' && wasAuthenticatedRef.current) {
      const loginPath = FRONTEND_ROUTES.AUTH.LOGIN;
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith(loginPath)) {
        safeSignOut();
      }
    }
  }, [status]);

  // Refresh Token 만료 감지 → 자동 로그아웃
  useEffect(() => {
    if (session?.error === AUTH_ERROR_CODE.REFRESH_TOKEN_EXPIRED) {
      console.error('[AuthSync] Refresh token expired, signing out...');
      safeSignOut();
    }
  }, [session?.error]);

  // 세션 만료 이벤트 SSOT 핸들러 (api-client, authenticated-client-provider에서 발생)
  // loading/unauthenticated 상태: 세션 복원 과정이거나 이미 로그아웃됨 → 무시
  useEffect(() => {
    const handleSessionExpired = () => {
      if (statusRef.current === 'authenticated') {
        safeSignOut();
      }
    };

    window.addEventListener(AUTH_EVENT.SESSION_EXPIRED, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_EVENT.SESSION_EXPIRED, handleSessionExpired);
    };
  }, []);

  // 탭 복귀 핸들러: 오래 자리를 비운 뒤 돌아오면 세션 갱신 + 스테일 쿼리 무효화
  // 브라우저 타이머 스로틀링으로 refetchInterval이 제대로 안 돌았을 수 있으므로
  // visibilitychange 이벤트를 직접 처리해 토큰과 캐시를 함께 복구
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }

      // 탭이 다시 보임 — 충분히 오래 자리를 비웠을 때만 갱신
      if (hiddenAt === null || Date.now() - hiddenAt < TAB_AWAY_REFRESH_THRESHOLD_MS) {
        hiddenAt = null;
        return;
      }
      hiddenAt = null;

      if (statusRef.current !== 'authenticated') return;

      // 1단계: 세션(토큰) 갱신 — JWT 콜백이 서버에서 Access Token을 재발급
      const refreshed = await getSession();
      if (refreshed?.error === AUTH_ERROR_CODE.REFRESH_TOKEN_EXPIRED) {
        // Refresh Token도 만료 → AuthSync의 session.error 감지 로직이 처리
        return;
      }

      // 2단계: 갱신된 토큰으로 스테일 쿼리 재조회 (현재 마운트된 것만)
      queryClient.invalidateQueries({ refetchType: 'active' });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  // ─── Idle Timeout ────────────────────────────────────────────────────────────
  const { isWarningVisible, secondsRemaining, handleContinue, handleLogout } = useIdleTimeout();

  // ─── Multi-tab BroadcastChannel 수신 ─────────────────────────────────────────
  // logout / idle-logout 메시지를 수신해 다른 탭에서 발생한 로그아웃을 동기화
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const ch = new BroadcastChannel(SESSION_SYNC_CHANNEL);
    ch.onmessage = (event: MessageEvent<{ type: SessionSyncMessageType }>) => {
      const { type } = event.data;
      if (
        (type === SESSION_SYNC_MESSAGE.LOGOUT || type === SESSION_SYNC_MESSAGE.IDLE_LOGOUT) &&
        statusRef.current === 'authenticated'
      ) {
        safeSignOut();
      }
    };
    return () => ch.close();
  }, []); // statusRef로 최신 status 참조 — 의존성 불필요

  return (
    <>
      {children}
      <IdleTimeoutDialog
        open={isWarningVisible}
        secondsRemaining={secondsRemaining}
        onContinue={handleContinue}
        onLogout={handleLogout}
      />
    </>
  );
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
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
