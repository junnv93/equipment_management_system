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
 * server-side(SSR/NextAuth callback)는 backend를 직접 호출해야 하므로 INTERNAL_BACKEND_URL 사용.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 환경변수
 * ─────────────────────────────────────────────────────────────────────
 *
 *  - NEXT_PUBLIC_API_URL  : 클라이언트 axios baseURL. **빈 값(same-origin) 권장**.
 *                           절대 URL을 지정하면 dev에서 경고 + production에서는 빌드 실패.
 *  - INTERNAL_BACKEND_URL : SSR/server 전용 backend 절대 URL.
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

/** dev에서 INTERNAL_BACKEND_URL 미설정 시 사용하는 기본 backend URL */
const DEV_FALLBACK_INTERNAL_BACKEND_URL = 'http://localhost:3001';

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
 * 서버(SSR/Server Component/NextAuth callback) baseURL.
 *
 * server-side는 backend를 직접 호출해야 하므로 INTERNAL_BACKEND_URL을 SSOT로 사용.
 * 미설정 시:
 *  - dev: localhost:3001 fallback
 *  - production: hard fail (Docker 환경에서 backend hostname resolve 불가하면 SSR 전체 실패)
 */
const resolveServerBaseUrl = (): string => {
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
};

/**
 * API_BASE_URL — 실행 환경(server/client)에 따라 자동 분기
 *
 * - server (`typeof window === 'undefined'`) → resolveServerBaseUrl() — backend 절대 URL
 * - client (`typeof window !== 'undefined'`) → resolveClientBaseUrl() — 빈 문자열(상대) 권장
 *
 * Same-Origin 모델에서 client는 axios가 호출자 origin을 자동으로 사용한다.
 */
export const API_BASE_URL =
  typeof window === 'undefined' ? resolveServerBaseUrl() : resolveClientBaseUrl();

/**
 * INTERNAL_BACKEND_URL — server 전용 직접 호출용 SSOT
 *
 * NextAuth callback (Credentials authorize, refresh) 등 server-only 코드에서 명시적으로 사용.
 * client 코드에서는 import 금지 (server-only constraint는 각 호출처가 책임).
 */
export const INTERNAL_BACKEND_URL = (() => {
  if (typeof window !== 'undefined') {
    // client에서 접근 시 즉시 발견되도록 빈 문자열 반환 + dev에서 console.error
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[API Config] INTERNAL_BACKEND_URL은 server-only 상수입니다. ' +
          'client 코드에서는 API_BASE_URL을 사용하세요.'
      );
    }
    return '';
  }
  return resolveServerBaseUrl();
})();

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
