/**
 * API 엔드포인트 설정 (SSOT) — Same-Origin Reverse-Proxy 모델 (ADR-0006)
 *
 * 모든 프론트엔드 코드는 이 파일에서 backend URL을 import합니다.
 * ❌ 금지: `process.env.NEXT_PUBLIC_API_URL` / `process.env.INTERNAL_BACKEND_URL` 직접 참조
 * ✅ 허용: `import { API_BASE_URL } from '@/lib/config/api-config'`
 *
 * ─────────────────────────────────────────────────────────────────────
 * 모델 (ADR-0006: Same-Origin Reverse-Proxy)
 * ─────────────────────────────────────────────────────────────────────
 *
 *   브라우저 → frontend(:3000)
 *               ├─ /api/auth/(csrf|session|providers|signin|signout|callback|...)
 *               │     → frontend NextAuth route handler
 *               └─ /api/* (그 외)
 *                     → next.config.js rewrites (dev) / nginx (prod)
 *                     → backend(:3001)
 *
 * 즉, 클라이언트는 항상 same-origin 상대 경로(`/api/*`)로 호출한다.
 * server-side(SSR/NextAuth callback)는 backend를 직접 호출해야 하므로 api-config.server.ts의 INTERNAL_BACKEND_URL 사용.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 환경변수
 * ─────────────────────────────────────────────────────────────────────
 *
 *  - NEXT_PUBLIC_API_URL  : 클라이언트 axios baseURL. **빈 값(same-origin) 권장**.
 *                           절대 URL을 지정하면 dev에서 경고 + production에서는 빌드 실패.
 *  - INTERNAL_BACKEND_URL : SSR/server 전용 backend 절대 URL (api-config.server.ts에서 export).
 *                           dev: `http://localhost:3001`, compose: `http://backend:3001`
 *
 * ─────────────────────────────────────────────────────────────────────
 * 환경별 동작
 * ─────────────────────────────────────────────────────────────────────
 *
 *  - 개발 (apps/frontend/.env.local):
 *      NEXT_PUBLIC_API_URL=
 *      INTERNAL_BACKEND_URL=http://localhost:3001
 *
 *  - 프로덕션 (Docker / nginx):
 *      NEXT_PUBLIC_API_URL=
 *      INTERNAL_BACKEND_URL=http://backend:3001
 *
 *  - LAN (Docker / nginx :9000):
 *      NEXT_PUBLIC_API_URL=
 *      INTERNAL_BACKEND_URL=http://backend:3001
 */

import { RELATIVE_API_BASE } from '@equipment-management/shared-constants';

/**
 * 클라이언트(브라우저) baseURL — same-origin 모델에서는 빈 문자열.
 *
 * NEXT_PUBLIC_API_URL이 절대 URL(`http://...`)로 지정된 경우는 dual-origin 모델 흔적이므로
 * 명시적 경고를 출력한다 (dev만 — production build는 NEXT_PUBLIC_API_URL이 빌드 타임 인라인되므로
 * 빌드 시점에 검증해야 한다).
 */
const resolveClientBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // 정상: 빈 값 또는 미설정 → same-origin (RELATIVE_API_BASE = '')
  if (!envUrl) return RELATIVE_API_BASE;

  // 상대 경로(`/api`)는 허용 — 일부 nginx 설정에서 명시적 prefix를 두는 경우
  if (envUrl.startsWith('/')) return envUrl;

  // 절대 URL — same-origin 모델 위반. dev에서는 경고, production에서는 hard fail
  const message =
    `[API Config] NEXT_PUBLIC_API_URL이 절대 URL("${envUrl}")로 설정되어 있습니다. ` +
    'Same-Origin Reverse-Proxy 모델(ADR-0006)에서는 빈 값 또는 상대 경로만 허용됩니다. ' +
    'INTERNAL_BACKEND_URL을 사용해 server-side에서만 backend를 직접 호출하세요.';

  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  if (typeof window !== 'undefined') {
    // 클라이언트 환경에서만 console.warn (server build 출력 노이즈 방지)
    console.warn(message);
  }
  return envUrl;
};

/**
 * API_BASE_URL — 클라이언트(브라우저) axios baseURL.
 *
 * Same-Origin 모델에서 클라이언트는 상대 경로(`''`)만 사용한다.
 * 이 파일은 클라이언트 번들에 포함되므로 server-only 분기 없음.
 * 서버 측 backend URL은 api-config.server.ts의 INTERNAL_BACKEND_URL을 사용.
 */
export const API_BASE_URL = resolveClientBaseUrl();

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
