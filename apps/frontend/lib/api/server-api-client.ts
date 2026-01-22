/**
 * ============================================================================
 * Server-Side API Client
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용 API 클라이언트
 *
 * 이 파일은 Server Components에서만 사용됩니다.
 * - Next.js 16 Server Components에서 안전하게 사용 가능
 * - getServerSession()을 통해 NextAuth 세션에서 토큰 가져오기
 * - 절대로 'use client' 컴포넌트에서 import하지 마세요
 *
 * 사용 예시:
 *   // app/equipment/[id]/page.tsx (Server Component)
 *   import { createServerApiClient } from '@/lib/api/server-api-client';
 *
 *   export default async function Page(props: PageProps) {
 *     const apiClient = await createServerApiClient();
 *     const equipment = await apiClient.get('/api/equipment/123');
 *   }
 *
 * 아키텍처 원칙:
 * - NextAuth = 단일 인증 소스 (Single Source of Truth)
 * - Server Component: getServerSession() 사용
 * - Client Component: getSession() 사용 (기존 api-client.ts)
 * - localStorage 토큰 사용 금지
 *
 * 참고: docs/development/AUTH_ARCHITECTURE.md
 * ============================================================================
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createApiError } from './utils/response-transformers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Server Component용 API 클라이언트 생성
 *
 * ✅ Next.js 16 Server Component에서 안전하게 사용
 * ✅ NextAuth 세션에서 accessToken 자동 주입
 * ✅ 인증 토큰 SSOT 원칙 준수
 *
 * @returns Promise<AxiosInstance> - 인증 토큰이 설정된 Axios 인스턴스
 *
 * @example
 * ```typescript
 * // Server Component에서 사용
 * export default async function EquipmentPage() {
 *   const apiClient = await createServerApiClient();
 *   const response = await apiClient.get('/api/equipment');
 *   const equipment = response.data;
 *   return <EquipmentList data={equipment} />;
 * }
 * ```
 */
export async function createServerApiClient(): Promise<AxiosInstance> {
  // ✅ Server Component에서 NextAuth 세션 가져오기
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken;

  // Axios 인스턴스 생성
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      // ✅ NextAuth 세션에서 가져온 토큰 설정
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
  });

  // 요청 인터셉터: API 경로 검증
  client.interceptors.request.use(
    (config) => {
      // 개발 모드에서 API 경로 검증
      if (process.env.NODE_ENV === 'development' && config.url) {
        if (!config.url.startsWith('/api/') && !config.url.startsWith('/api?')) {
          console.warn(
            `[Server API Client Warning] API 경로가 '/api/'로 시작하지 않습니다: "${config.url}"\n` +
            `올바른 형식: '/api/endpoint' (예: '/api/equipment', '/api/calibration')`
          );
        }
        if (config.url.includes('/api/api')) {
          console.error(
            `[Server API Client Error] API 경로에 '/api/api' 중복이 감지되었습니다: "${config.url}"\n` +
            `환경변수 NEXT_PUBLIC_API_URL에 '/api'가 포함되어 있지 않은지 확인하세요.`
          );
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // 응답 인터셉터: 에러 처리
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // ✅ 공통 에러 변환 유틸리티 사용
      const apiError = createApiError(error);

      // 401 에러 로깅 (Server Component에서는 자동 재시도 불가)
      if (error.response?.status === 401) {
        console.error(
          '[Server API Client] 인증 실패 (401):\n' +
          `  - URL: ${error.config?.url}\n` +
          `  - Session exists: ${!!session}\n` +
          `  - Access token exists: ${!!accessToken}\n` +
          '  - 해결 방법: 사용자가 로그인했는지 확인하고, NextAuth 세션이 올바르게 설정되었는지 확인하세요.'
        );
      }

      return Promise.reject(apiError);
    }
  );

  return client;
}

/**
 * Server Component에서 직접 fetch 사용 시 헬퍼 함수
 *
 * Axios 대신 native fetch를 사용하고 싶을 때 사용
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   const headers = await getServerAuthHeaders();
 *   const response = await fetch(`${API_BASE_URL}/api/equipment`, {
 *     headers,
 *     cache: 'no-store',
 *   });
 *   const data = await response.json();
 *   return <EquipmentList data={data} />;
 * }
 * ```
 */
export async function getServerAuthHeaders(): Promise<HeadersInit> {
  const session = await getServerSession(authOptions);
  const accessToken = (session as any)?.accessToken;

  return {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
}

/**
 * Server Component에서 현재 세션 정보 가져오기
 *
 * @returns Promise<Session | null>
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   const session = await getServerAuthSession();
 *   if (!session) {
 *     redirect('/login');
 *   }
 *   return <div>Welcome, {session.user?.name}</div>;
 * }
 * ```
 */
export async function getServerAuthSession() {
  return getServerSession(authOptions);
}
