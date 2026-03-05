import axios from 'axios';
import { getSession } from 'next-auth/react';
// ✅ 일관된 에러 처리: 공통 유틸리티 사용
import { createApiError } from './utils/response-transformers';
import { API_BASE_URL } from '../config/api-config';

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
 * Token Refresh 아키텍처:
 *   - Access Token은 15분 수명
 *   - SessionProvider refetchInterval(4분)로 JWT 콜백이 자동 갱신
 *   - 401 발생 시 getSession()으로 최신 토큰 재조회
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
 * NextAuth가 세션을 클라이언트에 캐싱하므로 별도 캐시 불필요
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();

    if (session?.error === 'RefreshAccessTokenError') {
      // Refresh token도 만료됨 — 재로그인 필요
      console.error('[API Client] 세션 갱신 실패 (RefreshAccessTokenError)');
      return null;
    }

    if (session?.accessToken) {
      return session.accessToken as string;
    } else if (session) {
      console.warn('[API Client] 세션은 있지만 accessToken이 없습니다:', Object.keys(session));
    }
  } catch (error) {
    console.error('[API Client] 세션 조회 실패:', error);
  }

  return null;
}

/**
 * 토큰 캐시 초기화 (하위 호환 - no-op)
 * 이전에는 5분 캐시를 사용했으나 JWT 콜백 기반 갱신으로 불필요
 */
export function clearTokenCache(): void {
  // no-op: NextAuth가 세션 관리를 전담
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

    // i18n: 현재 로케일을 Accept-Language 헤더로 전달 (백엔드 에러 메시지 로케일화)
    // NEXT_LOCALE 쿠키를 우선 읽어 document.lang의 stale 문제 방지
    if (typeof document !== 'undefined') {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
      const locale = cookieMatch?.[1] || document.documentElement.lang || 'ko';
      config.headers['Accept-Language'] = locale;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
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
    const originalRequest = error.config;

    // 토큰이 만료된 경우 (401) - 1회 재시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // getSession()을 호출하면 NextAuth JWT 콜백이 트리거되어 토큰 갱신
        const session = await getSession();

        if (session?.error === 'RefreshAccessTokenError') {
          // Refresh token도 만료됨 — AuthSync SSOT 핸들러로 위임
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          }
          return Promise.reject(error);
        }

        if (session?.accessToken) {
          // 새로운 토큰으로 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API Client] 토큰 갱신 실패:', refreshError);
      }

      // 토큰 갱신 실패 — AuthSync SSOT 핸들러로 위임
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
      return Promise.reject(error);
    }

    // ✅ 공통 에러 변환 유틸리티 사용: ApiError로 변환하여 상세 정보 유지
    const apiError = createApiError(error);
    return Promise.reject(apiError);
  }
);
