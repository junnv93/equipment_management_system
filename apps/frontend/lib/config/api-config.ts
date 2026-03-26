/**
 * API 엔드포인트 설정 (SSOT)
 *
 * 모든 프론트엔드 코드는 이 파일에서 백엔드 URL을 import합니다.
 * ❌ 금지: 파일 내부에서 직접 `process.env.NEXT_PUBLIC_API_URL` 참조
 * ✅ 허용: `import { API_BASE_URL } from '@/lib/config/api-config'`
 *
 * 환경변수:
 * - NEXT_PUBLIC_API_URL: 브라우저에서 사용할 백엔드 URL (예: /api, http://localhost:3001)
 * - INTERNAL_BACKEND_URL: SSR에서 사용할 Docker 내부 URL (예: http://backend:3001)
 *   - NEXT_PUBLIC_API_URL이 상대 경로(/api)일 때 SSR은 호스트를 모르므로 별도 내부 URL 필요
 *
 * 환경별 동작:
 * - 개발: NEXT_PUBLIC_API_URL=http://localhost:3001 → 서버/클라이언트 동일
 * - 프로덕션 (Docker): NEXT_PUBLIC_API_URL=/api (nginx 프록시) + INTERNAL_BACKEND_URL=http://backend:3001
 */

const DEV_FALLBACK_URL = 'http://localhost:3001';

/**
 * 클라이언트(브라우저) 전용 API Base URL
 *
 * 상대 경로(/api)도 허용 — 브라우저에서 현재 호스트 기준으로 해석됨.
 */
const resolveClientBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[API Config] NEXT_PUBLIC_API_URL 환경변수가 설정되지 않았습니다. ' +
        '프로덕션 환경에서는 반드시 설정해야 합니다.'
    );
  }

  return DEV_FALLBACK_URL;
};

/**
 * 서버(SSR/Server Component) 전용 API Base URL
 *
 * NEXT_PUBLIC_API_URL이 상대 경로(/api)인 경우 INTERNAL_BACKEND_URL을 사용.
 * Docker Compose 환경에서 서비스 간 통신(http://backend:3001)에 필요.
 */
const resolveServerBaseUrl = (): string => {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  const internalUrl = process.env.INTERNAL_BACKEND_URL;

  // 명시적 내부 URL이 있으면 우선 사용
  if (internalUrl) return internalUrl;

  // 절대 URL이면 서버에서도 그대로 사용 가능
  if (publicUrl?.startsWith('http')) return publicUrl;

  // 상대 경로(/api)인데 내부 URL이 없으면 — 프로덕션에서 SSR 불가
  if (publicUrl && process.env.NODE_ENV === 'production') {
    throw new Error(
      '[API Config] NEXT_PUBLIC_API_URL이 상대 경로이지만 INTERNAL_BACKEND_URL이 설정되지 않았습니다. ' +
        'SSR에서 백엔드 연결이 실패합니다. INTERNAL_BACKEND_URL을 설정하세요 (예: http://backend:3001).'
    );
  }

  return publicUrl || DEV_FALLBACK_URL;
};

/**
 * API_BASE_URL — 실행 환경(서버/클라이언트)에 따라 자동 분기
 *
 * - typeof window === 'undefined': Node.js (SSR) → resolveServerBaseUrl()
 * - typeof window !== 'undefined': 브라우저 → resolveClientBaseUrl()
 */
export const API_BASE_URL =
  typeof window === 'undefined' ? resolveServerBaseUrl() : resolveClientBaseUrl();

/**
 * API 타임아웃 설정 (ms)
 *
 * - SERVER_SIDE: Server Component SSR 렌더링 시간 고려 (짧게)
 * - CLIENT_SIDE: 브라우저 환경, 느린 네트워크 고려 (길게)
 */
export const API_TIMEOUTS = {
  SERVER_SIDE: 15_000,
  CLIENT_SIDE: 30_000,
} as const;
