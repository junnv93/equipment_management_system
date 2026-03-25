'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useSession, getSession } from 'next-auth/react';
import { createApiError, unwrapResponseData } from './utils/response-transformers';
import { API_BASE_URL, API_TIMEOUTS } from '../config/api-config';

/**
 * ============================================================================
 * Authenticated API Client Provider
 * ============================================================================
 *
 * NextAuth + axios 통합 Best Practice:
 * - useSession() hook으로 세션 토큰 가져오기 (getSession() 대신)
 * - 세션 변경 시 axios 인스턴스 자동 재생성
 * - 모든 Client Component에서 인증된 API 호출 가능
 *
 * 장점:
 * - ✅ 매 요청마다 getSession() 호출 불필요 (성능 개선)
 * - ✅ SessionProvider context 활용
 * - ✅ 세션 준비 타이밍 이슈 해결
 * - ✅ 토큰 갱신 시 자동 반영
 *
 * 사용법:
 * ```typescript
 * const client = useAuthenticatedClient();
 * const response = await client.get('/api/equipment');
 * ```
 * ============================================================================
 */

const AuthenticatedClientContext = createContext<AxiosInstance | null>(null);

interface AuthenticatedClientProviderProps {
  children: ReactNode;
}

export function AuthenticatedClientProvider({ children }: AuthenticatedClientProviderProps) {
  const { data: session } = useSession();

  /**
   * ✅ 세션 토큰이 변경될 때마다 axios 인스턴스 재생성
   * useMemo로 불필요한 재생성 방지
   */
  const apiClient = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: API_TIMEOUTS.CLIENT_SIDE,
    });

    // ✅ 요청 인터셉터: 세션이 있으면 모든 요청에 Authorization 헤더 자동 추가
    instance.interceptors.request.use(
      (config) => {
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // ✅ 응답 인터셉터: 래핑 해제 + 401 시 세션 갱신 1회 시도 → 재요청 → 실패 시에만 이벤트 dispatch
    instance.interceptors.response.use(
      // SSOT: unwrapResponseData — 3개 API 클라이언트 공유
      unwrapResponseData,
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _authRetried?: boolean;
        };

        if (error.response?.status === 401 && originalRequest && !originalRequest._authRetried) {
          originalRequest._authRetried = true;
          try {
            // getSession() 호출 → JWT 콜백 트리거 → 토큰 자동 갱신
            const freshSession = await getSession();
            if (freshSession?.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${freshSession.accessToken}`;
              return instance(originalRequest);
            }
          } catch {
            // 세션 갱신 실패 — 아래에서 이벤트 dispatch
          }
          // 재시도도 실패 → 진짜 세션 만료
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          }
        }

        // 공통 에러 변환
        const apiError = createApiError(error);
        return Promise.reject(apiError);
      }
    );

    return instance;
  }, [session?.accessToken]); // ✅ 토큰 변경 시에만 재생성

  return (
    <AuthenticatedClientContext.Provider value={apiClient}>
      {children}
    </AuthenticatedClientContext.Provider>
  );
}

/**
 * 인증된 API 클라이언트 가져오기
 *
 * @throws {Error} AuthenticatedClientProvider 외부에서 사용 시
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const client = useAuthenticatedClient();
 *
 *   const { data } = useQuery({
 *     queryKey: ['equipment'],
 *     queryFn: async () => {
 *       const response = await client.get('/api/equipment');
 *       return response.data;
 *     },
 *   });
 * }
 * ```
 */
export function useAuthenticatedClient(): AxiosInstance {
  const client = useContext(AuthenticatedClientContext);

  if (!client) {
    throw new Error(
      'useAuthenticatedClient must be used within AuthenticatedClientProvider. ' +
        'Ensure your component is wrapped with <AuthenticatedClientProvider>.'
    );
  }

  return client;
}

/**
 * 세션 준비 상태 확인
 *
 * @returns {boolean} 세션이 인증되었는지 여부
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isReady = useIsSessionReady();
 *
 *   if (!isReady) {
 *     return <Skeleton />;
 *   }
 *
 *   return <Content />;
 * }
 * ```
 */
export function useIsSessionReady(): boolean {
  const { status } = useSession();
  return status === 'authenticated';
}
