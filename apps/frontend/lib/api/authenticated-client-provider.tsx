'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';
import { useSession } from 'next-auth/react';
import { createApiError } from './utils/response-transformers';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthenticatedClientContext = createContext<AxiosInstance | null>(null);

interface AuthenticatedClientProviderProps {
  children: ReactNode;
}

export function AuthenticatedClientProvider({ children }: AuthenticatedClientProviderProps) {
  const { data: session, status } = useSession();

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
      timeout: 30000, // 30초
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

    // ✅ 응답 인터셉터: 표준 에러 처리
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // 401 에러 시 리다이렉트 (refresh token도 만료됨)
        if (error.response?.status === 401) {
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
