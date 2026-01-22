import axios from 'axios';
import { getSession } from 'next-auth/react';
// ✅ 일관된 에러 처리: 공통 유틸리티 사용
import { createApiError } from './utils/response-transformers';

/**
 * ============================================================================
 * 인증 토큰 관리 정책
 * ============================================================================
 *
 * ⚠️ 중요: localStorage 토큰 사용 금지
 *
 * 이 프로젝트는 NextAuth를 단일 인증 소스(Single Source of Truth)로 사용합니다.
 * - 인증 토큰은 NextAuth 세션(httpOnly 쿠키)에서만 관리
 * - localStorage.token 사용 시 NextAuth 세션과 불일치 문제 발생
 *
 * 올바른 패턴:
 *   const session = await getSession();
 *   const token = session?.accessToken;
 *
 * 잘못된 패턴:
 *   localStorage.getItem('token')  // ❌ 사용 금지
 *   localStorage.setItem('token')  // ❌ 사용 금지
 *
 * 참고: docs/development/AUTH_ARCHITECTURE.md
 * ============================================================================
 */

// 토큰 캐싱 (성능 최적화 - 매 요청마다 getSession 호출 방지)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * API 클라이언트 설정
 *
 * ⚠️ 중요: API 경로 규칙
 * - 환경변수 NEXT_PUBLIC_API_URL: 'http://localhost:3001' (호스트만, /api 미포함)
 * - 모든 API 호출 경로는 '/api/'로 시작해야 함
 *
 * ✅ 올바른 예시:
 *   apiClient.get('/api/equipment')
 *   apiClient.post('/api/calibration', data)
 *
 * ❌ 잘못된 예시:
 *   apiClient.get('/equipment')      // '/api' 접두사 누락
 *   apiClient.get('api/equipment')   // 슬래시 누락
 *
 * 이 규칙을 따르지 않으면 404 에러 또는 '/api/api/...' 중복 오류 발생
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 개발 모드에서 잘못된 API 경로 감지
const validateApiPath = (path: string): void => {
  if (process.env.NODE_ENV === 'development') {
    // /api로 시작하지 않는 경우 경고
    if (path && !path.startsWith('/api/') && !path.startsWith('/api?')) {
      console.warn(
        `[API Client Warning] API 경로가 '/api/'로 시작하지 않습니다: "${path}"\n` +
        `올바른 형식: '/api/endpoint' (예: '/api/equipment', '/api/calibration')`
      );
    }
    // /api/api 중복 감지
    if (path && path.includes('/api/api')) {
      console.error(
        `[API Client Error] API 경로에 '/api/api' 중복이 감지되었습니다: "${path}"\n` +
        `환경변수 NEXT_PUBLIC_API_URL에 '/api'가 포함되어 있지 않은지 확인하세요.`
      );
    }
  }
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * NextAuth 세션에서 액세스 토큰 가져오기
 * 캐싱을 통해 성능 최적화 (5분 캐시)
 */
async function getAccessToken(): Promise<string | null> {
  const now = Date.now();

  // 캐시된 토큰이 유효하면 재사용 (5분 캐시)
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  try {
    const session = await getSession();
    if (session?.accessToken) {
      cachedToken = session.accessToken as string;
      // 5분 캐시 (토큰 만료 전에 갱신)
      tokenExpiry = now + 5 * 60 * 1000;
      return cachedToken;
    }
  } catch (error) {
    console.error('[API Client] 세션 조회 실패:', error);
  }

  return null;
}

/**
 * 토큰 캐시 초기화 (로그아웃 또는 401 에러 시 호출)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  async (config) => {
    // ✅ 개발 모드에서 API 경로 유효성 검사
    if (config.url) {
      validateApiPath(config.url);
    }

    // ✅ NextAuth 세션에서 토큰 가져오기 (localStorage 사용 금지)
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 토큰이 만료된 경우 (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // ✅ NextAuth 기반 토큰 갱신
      // 캐시 초기화 후 세션 재조회 (NextAuth가 자동으로 토큰 갱신 처리)
      clearTokenCache();

      try {
        const token = await getAccessToken();

        if (token) {
          // 새로운 토큰으로 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API Client] 토큰 갱신 실패:', refreshError);
      }

      // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
      // ⚠️ signOut()은 next-auth/react에서 호출해야 하므로 이벤트로 처리
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // ✅ 공통 에러 변환 유틸리티 사용: ApiError로 변환하여 상세 정보 유지
    const apiError = createApiError(error);
    return Promise.reject(apiError);
  }
);
