# API Routing Architecture — Same-Origin Reverse-Proxy

> 본 문서는 ADR-0006의 운영 가이드. 모든 환경(dev/lan/prod)에서 frontend ↔ backend 라우팅이 동일한 패턴을 따르도록 강제한다.

## 1. 핵심 원칙

```
브라우저 → frontend(:3000) ┬─ /api/auth/(csrf|session|providers|signin|signout|callback|error|verify-request)
                            │     → frontend NextAuth route handler
                            └─ /api/* (그 외)
                                  → next.config.js rewrites (dev)
                                     또는 nginx (lan/prod)
                                  → backend(:3001)
```

- 클라이언트는 **항상 same-origin 상대 경로** (`/api/*`)로 호출한다.
- server-side(SSR/Server Component, NextAuth callback)는 `INTERNAL_BACKEND_URL`로 backend를 직접 호출한다.
- NextAuth 핸들러 경로와 backend NestJS 경로의 분류는 `packages/shared-constants/src/api-routing.ts`를 SSOT로 한다.

## 2. 환경변수

| 변수                   | 의미                                     | dev (`.env.local`)                  | lan/prod (compose)                              |
| ---------------------- | ---------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | 클라이언트 axios baseURL. **빈 값 강제** | `` (empty)                          | `` (empty)                                      |
| `INTERNAL_BACKEND_URL` | server-side backend 직접 호출 URL        | `http://localhost:3001`             | `http://backend:3001`                           |
| `NEXTAUTH_URL`         | NextAuth가 callback URL 생성 시 사용     | `http://localhost:3000`             | `http://${SERVER_LAN_IP}:9000` 또는 외부 도메인 |
| `INTERNAL_API_KEY`     | backend internal-only 호출 인증 키       | `.env.local` 값 = backend `.env` 값 | compose secrets                                 |

⚠️ **`NEXT_PUBLIC_API_URL`에 절대 URL을 지정하면 ADR-0006 위반.** dev에서는 console.error로 즉시 발견되며, production build에서는 `[API Config]` 에러로 hard-fail한다.

## 3. 코드 진입점 (SSOT)

| 진입점                     | 파일                                                              | 용도                                                                                             |
| -------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 클라이언트 axios `baseURL` | `apps/frontend/lib/config/api-config.ts` (`API_BASE_URL`)         | client 환경에서는 빈 문자열, server 환경에서는 자동으로 `INTERNAL_BACKEND_URL`                   |
| server-only fetch          | `apps/frontend/lib/config/api-config.ts` (`INTERNAL_BACKEND_URL`) | NextAuth callback, health route 등 server 코드에서 명시적 사용                                   |
| auth path 분류 SSOT        | `packages/shared-constants/src/api-routing.ts`                    | `BACKEND_AUTH_PATHS`, `NEXTAUTH_HANDLER_PATHS`, `isNextAuthHandlerPath()`, `isBackendAuthPath()` |

## 4. 라우팅 분기 (4 레이어 동기화 의무)

본 4 레이어는 **동일한 분류 규칙**을 따라야 한다. 한 곳만 변경하면 다른 레이어와 disjoint 되지 않아 라우팅 버그 발생.

| 레이어               | 파일                                           | NextAuth 핸들러 분기                                                                         |
| -------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| SSOT (TypeScript)    | `packages/shared-constants/src/api-routing.ts` | `NEXTAUTH_HANDLER_PATHS` 배열 + 정규식                                                       |
| Next.js dev rewrites | `apps/frontend/next.config.js`                 | inline 정규식 `(csrf\|session\|providers\|signin\|signout\|callback\|error\|verify-request)` |
| nginx (lan/prod)     | `infra/nginx/lan.conf`                         | `location ~ ^/api/auth/(csrf\|...)(/\|$)` → `proxy_pass http://frontend`                     |
| proxy.ts matcher     | `apps/frontend/proxy.ts`                       | `/api` 경로는 매처에서 제외(NextAuth 자체가 자기 가드 처리)                                  |

**SSOT 동기화 의무**: 새 NextAuth 핸들러 경로(예: Auth.js v6 추가) 등장 시 위 4곳을 모두 갱신. `verify-routing-origin` (SHOULD skill)이 자동 검증.

## 5. 환경별 흐름

### 5.1 Dev (`pnpm dev`)

```
사용자 브라우저 → http://localhost:3000/api/auth/csrf
              → Next.js NextAuth route handler 직접 응답 (rewrite 안 함)

사용자 브라우저 → http://localhost:3000/api/equipment
              → next.config.js rewrites fallback
              → http://localhost:3001/api/equipment (backend)
```

NextAuth callback (server-side):

```
NextAuth.refresh callback (server)
  → fetch(`${INTERNAL_BACKEND_URL}/api/auth/refresh`, {...})
  → http://localhost:3001/api/auth/refresh (backend NestJS auth controller)
```

### 5.2 LAN (`pnpm compose:lan up`)

nginx(:9000)가 reverse proxy 진입점.

```
LAN 사용자 → http://server-ip:9000/api/auth/csrf
         → nginx: location ~ ^/api/auth/(csrf|...) → http://frontend:3000
         → frontend NextAuth handler 응답

LAN 사용자 → http://server-ip:9000/api/equipment
         → nginx: location /api → http://backend:3001
         → backend Equipment controller 응답
```

### 5.3 Production

LAN과 동일 패턴 + TLS 종료. nginx가 `/api/auth/(NextAuth)` → frontend, 나머지 `/api` → backend.

## 6. 트러블슈팅

### 6.1 backend 콘솔에 `Cannot GET /api/auth/csrf` (또는 session/providers/signin/signout/callback) 404

본 ADR 정착 후 발생하면 회귀. 점검 순서:

1. `apps/frontend/.env.local`에 `NEXT_PUBLIC_API_URL=http://...` 절대 URL 잠입 — 빈 값으로 복구
2. `apps/frontend/next.config.js`의 rewrites destination에 `/api` prefix 누락 — `${INTERNAL_BACKEND_URL}/api/:path*` 확인
3. `infra/nginx/lan.conf` regex location 순서 — NextAuth 핸들러 location이 backend auth location보다 먼저
4. 사용자 브라우저에 stale Service Worker — `chrome://serviceworker-internals/`에서 unregister 또는 `LegacyServiceWorkerCleanup` 마운트 확인
5. `pnpm dev:fresh` 실행 → `.next/dev` 캐시 + 좀비 dev 프로세스 정리

### 6.2 dev에서 axios 호출이 CORS 에러

본 ADR에서는 same-origin이라 CORS 발생하지 않아야 정상. 발생 시:

- `axios.create({ baseURL: ... })`에 절대 URL 잠입 확인
- `apiClient.get('/api/...')`이 `apiClient.get('http://localhost:3001/api/...')`로 호출되지 않는지 확인 (validateApiPath가 dev console error 출력)

### 6.3 SSR fetch 실패 (`ECONNREFUSED`)

server-side는 `INTERNAL_BACKEND_URL`로 backend 직접 호출:

- `apps/frontend/.env.local`에 `INTERNAL_BACKEND_URL=http://localhost:3001` 설정 확인
- compose 환경: `INTERNAL_BACKEND_URL=http://backend:3001` (서비스 이름)

### 6.4 PWA `manifest.json` 호출이 `/login`으로 redirect

`apps/frontend/proxy.ts` matcher에 `manifest\\.json` 등 PWA 자산 제외 패턴 누락. 본 ADR 정착 후 회귀 시 matcher 검증.

## 7. 보안 영향

### 7.1 CSP `connect-src`

| 환경       | 정책                                                      |
| ---------- | --------------------------------------------------------- |
| dev        | `connect-src 'self' ws: wss:` (HMR/Turbopack용 ws만 추가) |
| production | `connect-src 'self'`                                      |

### 7.2 Backend CORS

| 환경                           | 정책                                                                       |
| ------------------------------ | -------------------------------------------------------------------------- |
| dev                            | `origin: 'http://localhost:3000'` (frontend 없이 backend 직접 디버깅 호환) |
| production                     | `origin: frontendUrl` (FRONTEND_URL env 명시 필수, 미설정 시 boot fail)    |
| production (FRONTEND_URL 누락) | bootstrap throw — 운영 사고 차단                                           |

### 7.3 INTERNAL_API_KEY 누출 방지

- `INTERNAL_API_KEY`는 server-only 환경변수. `NEXT_PUBLIC_*` prefix가 아니므로 client bundle에 인라인되지 않음 → verify-security가 검증.
- NextAuth signIn 콜백(Azure AD user sync)에서만 사용.

## 8. 회귀 방지 체크리스트

PR 단계에서 다음 시나리오에 대한 코드 변경이 있으면 본 문서 + ADR-0006 + verify-routing-origin 재확인:

- [ ] `NEXT_PUBLIC_API_URL` 또는 `INTERNAL_BACKEND_URL` 환경변수 변경
- [ ] `next.config.js` rewrites 변경
- [ ] `apps/frontend/proxy.ts` matcher 변경
- [ ] `infra/nginx/*.conf` location 변경
- [ ] `apps/frontend/lib/config/api-config.ts` 변경
- [ ] `packages/shared-constants/src/api-routing.ts` 변경
- [ ] `apps/frontend/app/api/auth/[...nextauth]/route.ts` (Auth.js 버전 변경)
- [ ] `apps/frontend/app/sw.ts` 캐싱 정책 변경
- [ ] backend `app.setGlobalPrefix()` 또는 `enableCors` 변경

## 9. 참고

- ADR-0006: `docs/adr/0006-frontend-backend-routing-model.md`
- exec-plan (구현 이력): `.claude/exec-plans/completed/2026-04-28-nextauth-csrf-single-origin.md`
- SSOT: `packages/shared-constants/src/api-routing.ts`
- Dev hygiene: `docs/references/dev-server-hygiene.md`
