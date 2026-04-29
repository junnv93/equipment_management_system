/**
 * api-config.server.ts — server-only backend URL SSOT
 *
 * ⚠️ 이 파일은 Server Component, NextAuth callback, Route Handler에서만 import해야 합니다.
 * Client Component에서 import하면 번들에 INTERNAL_BACKEND_URL IIFE가 포함되어
 * console.error가 발생합니다. (ADR-0006)
 *
 * 클라이언트 코드에서는 `@/lib/config/api-config` 의 API_BASE_URL을 사용하세요.
 */

/** dev에서 INTERNAL_BACKEND_URL 미설정 시 사용하는 기본 backend URL */
const DEV_FALLBACK_INTERNAL_BACKEND_URL = 'http://localhost:3001';

/**
 * 서버(SSR/Server Component/NextAuth callback) baseURL.
 *
 * server-side는 backend를 직접 호출해야 하므로 INTERNAL_BACKEND_URL을 SSOT로 사용.
 * 미설정 시:
 *  - dev: localhost:3001 fallback
 *  - production: hard fail (Docker 환경에서 backend hostname resolve 불가하면 SSR 전체 실패)
 */
export function resolveServerBaseUrl(): string {
  const internalUrl = process.env.INTERNAL_BACKEND_URL;
  if (internalUrl) return internalUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[API Config] INTERNAL_BACKEND_URL 환경변수가 설정되지 않았습니다. ' +
        'Same-Origin Reverse-Proxy 모델(ADR-0006)에서는 server-side가 backend를 직접 호출하므로 ' +
        'INTERNAL_BACKEND_URL이 필수입니다 (예: http://backend:3001).'
    );
  }

  return DEV_FALLBACK_INTERNAL_BACKEND_URL;
}

/**
 * INTERNAL_BACKEND_URL — server 전용 직접 호출용 SSOT
 *
 * NextAuth callback (Credentials authorize, refresh) 등 server-only 코드에서 명시적으로 사용.
 * ❌ client 코드에서 import 금지 — api-config.ts의 API_BASE_URL 사용.
 */
export const INTERNAL_BACKEND_URL = resolveServerBaseUrl();
