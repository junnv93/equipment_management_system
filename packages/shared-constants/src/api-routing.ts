/**
 * API 라우팅 SSOT — Frontend ↔ Backend Same-Origin Reverse-Proxy 모델
 *
 * 본 모듈은 다음 4개 레이어가 동일한 분류 규칙을 사용하도록 SSOT를 제공한다:
 *
 *   1. `apps/frontend/next.config.js` rewrites (dev) — `/api/auth/*` 제외 + `/api/*` → backend
 *   2. `infra/nginx/lan.conf` / `prod.conf` (lan/prod) — NextAuth 핸들러는 frontend, 그 외 backend로 분기
 *   3. `apps/frontend/proxy.ts` matcher — PWA 자산 + auth 경로 인증 가드 제외 정책
 *   4. `apps/frontend/lib/auth.ts` — backend가 노출하는 auth 경로만 명시적으로 호출
 *
 * 본 분류는 backend 컨트롤러의 실제 데코레이터(`auth.controller.ts`, `test-auth.controller.ts`)와
 * Auth.js v5 핸들러의 등록 경로를 기반으로 한다.
 *
 * Invariant: `BACKEND_AUTH_PATHS` ∩ `NEXTAUTH_HANDLER_PATHS` = ∅
 *  - 두 집합의 합집합은 `/api/auth/*` 네임스페이스를 분할(partition)한다.
 *  - 둘 중 어느 쪽으로도 분류되지 않는 `/api/auth/*` 경로는 정의되지 않은(undefined) 라우트이며,
 *    이는 코드 변경 시 SSOT 갱신 누락이므로 verify-ssot가 검출해야 한다.
 *
 * 관련 ADR: ADR-0006 — Frontend ↔ Backend Routing Model: Same-Origin Reverse-Proxy
 */

/**
 * 클라이언트 axios 기본 baseURL (상대 경로).
 *
 * Same-origin 모델에서는 빈 문자열을 사용해야 axios가 호출자 origin(브라우저 location.origin)을
 * 그대로 사용한다. `'/api'` 같은 prefix를 baseURL에 두면 호출 코드가 `/api/...`로 시작할 때
 * `/api/api/...` 중복이 발생하므로 빈 문자열로 고정한다.
 */
export const RELATIVE_API_BASE = '' as const;

/** NextAuth 핸들러 경로의 공통 prefix. Auth.js v5 catch-all route handler가 처리한다. */
export const NEXTAUTH_PATH_PREFIX = '/api/auth' as const;

/**
 * Backend NestJS auth 컨트롤러가 노출하는 경로 (실제 라우트 데코레이터 기반).
 *
 * 출처:
 *  - `apps/backend/src/modules/auth/auth.controller.ts` (login, refresh, profile, logout, azure-login)
 *  - `apps/backend/src/modules/auth/test-auth.controller.ts` (test, test-login, test-cache-clear, forge-handover-token)
 *
 * 이 경로들은 frontend NextAuth가 server-side에서 직접 호출하거나(Credentials authorize),
 * 별도 백엔드 인증 흐름에서 사용된다.
 */
export const BACKEND_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/profile',
  '/api/auth/azure-login',
  '/api/auth/test',
  '/api/auth/test-login',
  '/api/auth/test-cache-clear',
  '/api/auth/forge-handover-token',
] as const;

export type BackendAuthPath = (typeof BACKEND_AUTH_PATHS)[number];

/**
 * NextAuth (Auth.js v5) 핸들러가 처리하는 경로.
 *
 * Auth.js core가 `app/api/auth/[...nextauth]/route.ts`에서 catch-all로 등록한다.
 * 이 경로들은 **반드시 frontend origin이 응답해야** CSRF 토큰/세션 쿠키 흐름이 성립한다.
 *
 * 참조: https://authjs.dev/getting-started/migrating-to-v5#auth
 *  - csrf, session, providers — GET 메타 정보
 *  - signin, signout — GET(form) + POST(action)
 *  - callback/[provider] — OAuth 리다이렉트 수신
 *  - error, verify-request — 에러/검증 페이지
 */
export const NEXTAUTH_HANDLER_PATHS = [
  '/api/auth/csrf',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/callback',
  '/api/auth/error',
  '/api/auth/verify-request',
] as const;

export type NextAuthHandlerPath = (typeof NEXTAUTH_HANDLER_PATHS)[number];

/**
 * NextAuth 경로의 정규식 (nginx/Next.js rewrite 등 패턴 기반 라우터에 활용).
 *
 * - `^/api/auth/(csrf|session|providers|signin|signout|callback|error|verify-request)(/.*)?$`
 * - `callback/azure-ad` 같은 동적 segment를 포함하므로 `(/.*)?$`로 trailing path 허용
 * - `signin`/`signout`은 그 자체가 종단 경로이므로 trailing slash optional
 */
export const NEXTAUTH_HANDLER_PATH_REGEX =
  /^\/api\/auth\/(csrf|session|providers|signin|signout|callback|error|verify-request)(\/.*)?$/;

/**
 * Backend auth 경로의 정규식.
 *
 * `test-login`, `test-cache-clear` 같은 dash-separated segment를 포함하므로
 * `(/.*)?` 접미사로 정확히 매칭한다.
 */
export const BACKEND_AUTH_PATH_REGEX =
  /^\/api\/auth\/(login|refresh|logout|profile|azure-login|test|test-login|test-cache-clear|forge-handover-token)(\/.*)?$/;

/**
 * 경로가 NextAuth 핸들러로 라우팅되어야 하는지 판정.
 *
 * 사용처:
 *  - `proxy.ts` matcher 보조 (auth 경로는 인증 가드 제외)
 *  - `verify-ssot` 자동 검증 (BACKEND ∩ NEXTAUTH = ∅ assertion)
 */
export function isNextAuthHandlerPath(path: string): boolean {
  return NEXTAUTH_HANDLER_PATH_REGEX.test(path);
}

/**
 * 경로가 backend NestJS 컨트롤러로 라우팅되어야 하는지 판정.
 */
export function isBackendAuthPath(path: string): boolean {
  return BACKEND_AUTH_PATH_REGEX.test(path);
}

/**
 * Single-origin reverse-proxy 모델의 운영 환경 변수 키.
 *
 * Frontend `apps/frontend/lib/config/api-config.ts`가 server/client 분기 시 이 키를 참조한다.
 *  - `NEXT_PUBLIC_API_URL` — client-side baseURL. same-origin 모델에서는 빈 문자열 또는 미설정.
 *  - `INTERNAL_BACKEND_URL` — server-side(SSR/NextAuth callback) backend 직접 호출용.
 *    dev: `http://localhost:3001`, compose: `http://backend:3001`
 *
 * env 파일(`.env.local`, `.env.example`, compose yml)이 같은 키를 사용해야 함을 코드에서 강제하기 위해
 * 키 이름 자체를 SSOT로 노출한다.
 */
export const API_ROUTING_ENV = {
  PUBLIC_API_URL: 'NEXT_PUBLIC_API_URL',
  INTERNAL_BACKEND_URL: 'INTERNAL_BACKEND_URL',
} as const;
