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

import axios, { AxiosInstance } from 'axios';
import { createApiError } from './utils/response-transformers';
import {
  getServerAuthSession,
  getServerAuthHeaders as getAuthHeaders,
} from '@/lib/auth/server-session';
import { API_BASE_URL, API_TIMEOUTS } from '../config/api-config';
import { getInternalApiKeyHeaders } from '../config/internal-headers';

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
  // ✅ 중앙화된 세션 유틸리티 사용 (cache()로 dedup됨)
  const session = await getServerAuthSession();
  const accessToken = session?.accessToken ?? null;

  // Axios 인스턴스 생성
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUTS.SERVER_SIDE,
    headers: {
      'Content-Type': 'application/json',
      // ✅ NextAuth 세션에서 가져온 토큰 설정
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      // ✅ 내부 서비스 식별 (Throttle bypass — 브라우저 요청엔 없는 헤더)
      ...getInternalApiKeyHeaders(),
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

  // 응답 인터셉터: 래핑 해제 + 에러 처리
  client.interceptors.response.use(
    (response) => {
      // ResponseTransformInterceptor 래핑 해제 (SSOT: 클라이언트 레벨에서 중앙화)
      // 백엔드가 { success, data, message, timestamp } 형태로 래핑하는 경우 data만 추출
      const responseData: unknown = response.data;
      if (
        responseData &&
        typeof responseData === 'object' &&
        'success' in responseData &&
        (responseData as Record<string, unknown>).success === true &&
        'data' in responseData
      ) {
        response.data = (responseData as Record<string, unknown>).data;
      }
      return response;
    },
    async (error) => {
      // ✅ 공통 에러 변환 유틸리티 사용
      const apiError = createApiError(error);

      // 🔴 개발 모드: 모든 에러에 대해 상세 정보 로깅
      if (process.env.NODE_ENV === 'development') {
        const status = error.response?.status;
        const errorData = error.response?.data;

        console.error(
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '[Server API Client] API 에러 발생\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            `📍 URL: ${error.config?.method?.toUpperCase()} ${error.config?.url}\n` +
            `🌐 Base URL: ${API_BASE_URL}\n` +
            `🔢 Status: ${status || 'N/A (응답 없음 - 연결 실패 가능성)'}\n` +
            `⚡ Axios error code: ${error.code || 'N/A'}\n` +
            `📝 Raw error message: ${error.message || 'N/A'}\n` +
            `🔐 Session exists: ${!!session}\n` +
            `🎫 Access token exists: ${!!accessToken}\n` +
            `📦 Response data: ${errorData ? JSON.stringify(errorData, null, 2) : 'N/A'}\n` +
            `💬 Transformed error message: "${apiError.message}"\n` +
            `🔑 Error code: ${apiError.code}\n` +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
        );
      }

      // 401 에러 특별 처리: 로그인 페이지로 리다이렉트
      if (error.response?.status === 401) {
        console.error(
          '[Server API Client] 인증 실패 (401):\n' +
            `  - URL: ${error.config?.url}\n` +
            `  - Session exists: ${!!session}\n` +
            `  - Access token exists: ${!!accessToken}\n` +
            '  - 로그인 페이지로 리다이렉트합니다.'
        );
        // Server Component에서 401 발생 시 로그인 페이지로 리다이렉트
        const { redirect } = await import('next/navigation');
        redirect('/login');
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
 * @deprecated '@/lib/auth/server-session'의 getServerAuthHeaders를 사용하세요
 */
export const getServerAuthHeaders = getAuthHeaders;

/**
 * Server Component에서 현재 세션 정보 가져오기
 *
 * @deprecated '@/lib/auth/server-session'의 getServerAuthSession을 직접 import하세요
 */
export { getServerAuthSession };
