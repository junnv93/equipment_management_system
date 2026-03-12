/**
 * 서버→백엔드 내부 통신 헤더 (SSOT)
 *
 * Next.js 서버 사이드(Server Component, NextAuth 콜백 등)에서
 * 백엔드 API를 호출할 때 InternalApiThrottlerGuard의 throttle bypass를 위한
 * X-Internal-Api-Key 헤더를 중앙 관리합니다.
 *
 * ⚠️ 이 함수는 서버 사이드 전용입니다 (process.env.INTERNAL_API_KEY는 클라이언트에 노출되지 않음)
 *
 * 사용처:
 * - server-session.ts → getServerAuthHeaders() (Server Component native fetch)
 * - server-api-client.ts → createServerApiClient() (Server Component Axios)
 * - auth.ts → refreshAccessToken() (NextAuth JWT 콜백)
 *
 * @see apps/backend/src/common/guards/internal-api-throttler.guard.ts
 */
export function getInternalApiKeyHeaders(): Record<string, string> {
  const key = process.env.INTERNAL_API_KEY;
  return key ? { 'X-Internal-Api-Key': key } : {};
}
