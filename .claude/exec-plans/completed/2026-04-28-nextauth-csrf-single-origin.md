# NextAuth CSRF 404 — Single-Origin Reverse-Proxy 모델 정착

## 메타

- 생성: 2026-04-28T00:00:00+09:00
- 모드: Mode 2 (Harness Planner)
- Slug: `nextauth-csrf-single-origin`
- 예상 변경: 약 12~16 파일 (env 4 + 코드 6 + nginx/compose 2 + docs 2~3 + verify-skill 1)
- Branching: **main 직접 작업** (memory: feedback_main_only_no_branches)
- 관련 ADR: 신규 ADR-0006 제안 — "Frontend ↔ Backend 라우팅 모델: Same-Origin Reverse-Proxy 채택"

---

## 1. Problem Statement

`pnpm dev` 실행 중 backend 콘솔에 다음 404가 3~5초 간격으로 반복 출력된다.

```
backend:dev: NotFoundException: Cannot GET /api/auth/csrf
backend:dev:   at MiddlewareHost.use (apps/backend/src/common/middleware/monitoring.middleware.ts:22:5)
```

원인은 **NextAuth가 자기 핸들러 경로(`/api/auth/csrf`, `/api/auth/session` 등)에 대한 `GET`을 backend로 흘려보내기 때문**이다. NextAuth는 frontend `/api/auth/[...nextauth]/route.ts`가 처리해야 한다. 그런데:

1. `apps/frontend/.env.local`이 `NEXT_PUBLIC_API_URL=http://localhost:3001`(backend 절대 URL)로 설정되어 있어서, axios 클라이언트들의 `baseURL`이 backend를 직접 가리킨다. — **현재 코드베이스의 실효 라우팅 모델은 dual-origin 직접 호출**.
2. `next.config.js`의 `rewrites.fallback`은 NextAuth 경로를 `(?!auth)`로 제외하지만, **destination이 `${NEXT_PUBLIC_API_URL}/:path*`로 `/api` prefix가 빠진 채 그대로 backend(`http://localhost:3001/foo`)로 가서 backend `setGlobalPrefix('api')`와 충돌**. fallback rewrites는 사실상 무용.
3. `auth.ts`의 NextAuth 설정 자체는 정상이지만, `getSession()`이 자체 호출하는 `/api/auth/session`이 어떻게든 backend port 3001로 도달해 404. 정확한 경로는 SW(legacy registration) 또는 axios baseURL 설정이 fetch 인터셉트를 일으키는 것.

이 404는 단순히 노이즈가 아니라 **`SessionProvider`의 `refetchInterval(5분)`과 `getSession()` 호출이 매번 실패할 위험을 안고 있다**. CSRF 발급 실패 시 NextAuth signIn POST 또한 차단된다.

---

## 2. Root Cause Analysis

### 2.1 메인 분석 결과 (검증 완료)

| # | 메인 가설 | 검증 결과 |
|---|-----------|----------|
| A1 | dual-origin 모델 | ✅ 확인 — `NEXT_PUBLIC_API_URL=http://localhost:3001` + axios baseURL이 backend 절대 URL |
| A2 | rewrites destination 깨짐 | ✅ 확인 — `next.config.js:70` `destination: NEXT_PUBLIC_API_URL + '/:path*'`. backend는 `setGlobalPrefix('api')`이라 `/api/equipment` rewrite 시 `http://localhost:3001/equipment`(404) 호출됨 |
| A3 | NextAuth signIn fetch가 backend로 도달 | ⚠️ 부분 확인 — backend에는 `/api/auth/csrf`/`/api/auth/session` 핸들러 없음. 도달 경로는 dev에서 잔존 SW(legacy production build)가 fetch을 가로채거나, 직접 `getSession()`이 axios baseURL로 향했을 가능성 (자세한 reproduction은 §2.3) |
| A4 | proxy.ts matcher가 PWA 자산 미제외 | ✅ 확인 — `manifest.json`/`sw.js`/`icons/*`/`workbox-*.js`가 인증 가드에 걸려 `GET /login?callbackUrl=%2Fmanifest.json`을 발생시킴. PWA 메타가 익명 사용자에게 노출되어야 정상 |
| A5 | CSP `connect-src` 과다 | ✅ 확인 — dev에서 `connect-src 'self' ws: wss: http://localhost:*` 허용. single-origin이면 `'self' ws:`만으로 충분 |
| A6 | backend `enableCors` 불필요성 | ✅ 부분 확인 — same-origin이면 dev/prod 모두 CORS 불필요. 단, dev에서 직접 backend port 디버깅(curl/Swagger UI)은 origin이 다를 수 있어 dev만 명시적 허용 필요 |

### 2.2 2차 아키텍처 감사 (메인이 못 잡은 결함)

| # | 추가 발견 결함 | 파일·라인 | 영향 |
|---|---------------|----------|------|
| B1 | **prod nginx도 NextAuth를 backend로 흘림** | `infra/nginx/lan.conf:154` `location /api { proxy_pass http://backend; }` | **production 동일 버그**. lan/prod 환경에서도 `/api/auth/csrf`/`/api/auth/session`이 backend로 가서 404. `/api/auth/(login\|signin\|token\|refresh)` 만 별도 location으로 분리되어 있고 NextAuth 자체 핸들러 경로는 fallthrough로 backend 도착 |
| B2 | **lan compose `NEXT_PUBLIC_API_URL=http://${SERVER_LAN_IP}:9000`** | `infra/compose/lan.override.yml:126` | **client baseURL이 `http://server:9000`(절대 URL). axios가 `/api/equipment`를 호출하면 같은 origin이라 정상 작동하지만 SSR fetch에서 host resolve 의존성 발생**. INTERNAL_BACKEND_URL=http://backend:3001은 정상 |
| B3 | **prod compose는 single-origin (`/api`) 정상** | `infra/compose/prod.override.yml:95` `NEXT_PUBLIC_API_URL=/api` | prod는 이미 single-origin 모델 적용. lan/dev만 dual-origin 잔존 — **dev/lan/prod 세 환경의 모델 비대칭성이 본 버그의 본질** |
| B4 | **`.env.test`에 `NEXT_PUBLIC_API_URL=http://localhost:3002/api` (`/api` 접미사 포함)** | `.env.test:30` | 다른 env들은 `/api` 미포함. 이 비대칭이 `apiClient.get('/api/...')` 호출 시 `http://localhost:3002/api/api/...` 중복 → e2e가 실측 안 잡으면 잠복 |
| B5 | **api-client.ts의 validateApiPath warn은 `/api/api` 중복만 경고** | `apps/frontend/lib/api/api-client.ts:69` | dev mode에서 `localhost:3001/api/auth/csrf` 같은 잘못된 경로는 잡지 못함. base URL 검증 로직은 없음 |
| B6 | **`app/api/health/route.ts:5` `process.env.BACKEND_URL` 직접 참조** | health route | `BACKEND_URL` 환경변수는 다른 env 파일들에 정의되지 않은 별개 키. SSOT 위반. `INTERNAL_BACKEND_URL`로 통일 필요 |
| B7 | **`error-reporter.ts`가 client에서 `${API_BASE_URL}/api/monitoring/client-errors`** | `apps/frontend/lib/error-reporter.ts:107` | `sendBeacon`은 절대 URL이 가장 안전. single-origin 채택 후에도 client에서 호출되므로 `/api/monitoring/client-errors` 상대 경로 ok. SSR 분기 필요 없음 |
| B8 | **legacy SW 잔존 위험** | `app/sw.ts` + `next.config.js:81 disable: process.env.NODE_ENV === 'development'` | dev에서 SW 비활성이지만 사용자가 한 번이라도 production build를 띄웠다면 `/sw.js` 등록이 브라우저에 남음. `.next/`만 클리어 시 unregister 안 됨 → fetch hijack 가능. **명시적 unregister hook 필요** |
| B9 | **i18n request handler는 영향 없음** | `apps/frontend/i18n.ts` + `proxy.ts` | proxy.ts가 `x-next-intl-locale` 헤더를 주입. matcher 변경(api/auth 명시 제외)이 i18n 헤더 주입에 영향 X. ✅ 안전 |
| B10 | **CSP `report-uri ${API_ENDPOINTS.SECURITY.CSP_REPORT}` 단일 origin과 정합** | `proxy.ts:117` | 이미 path-based이고 `Report-To.endpoints[0].url`도 `request.nextUrl.origin` 기준 절대 URL. ✅ 정합 |
| B11 | **Bundle size 영향: rewrites 변경은 0**, axios baseURL 분기 단순화는 client bundle ~수백 byte 감소 | — | 영향 미미 |
| B12 | **PWA defaultCache가 `/api/*` 응답 stale-while-revalidate** | `serwist defaultCache` | dev에선 disabled지만 prod에서 NextAuth GET 응답이 캐시되면 stale CSRF 토큰 위험. **API 요청은 NetworkOnly로 강제하는 runtimeCaching rule 필수** |
| B13 | **proxy.ts matcher가 `_next/data` 제외 안 함** | `apps/frontend/proxy.ts:177` | `_next/data`는 RSC payload. 인증 가드가 걸려도 동작은 하지만 callbackUrl이 `_next/data/...`로 지저분해짐. 명시적 제외 권장 |
| B14 | **JWT cookie `__Host-next-auth.session-token` SameSite=Lax** (NextAuth 기본) | next-auth 기본 | single-origin 채택 후 same-site 정책에 부합. 별도 변경 불요 |
| B15 | **monitoring.middleware.ts는 모든 요청 ETA 측정** | `apps/backend/src/common/middleware/monitoring.middleware.ts:22` | NotFoundException은 monitoring middleware 통과 후 NestJS RouterModule이 던짐. middleware는 잘못 없음. 본 버그의 원인 아님 |

### 2.3 호출 경로 추적 (왜 `/api/auth/csrf`가 backend로?)

가능한 경로 3가지 — Phase 0 검증 시 reproduction 통해 어느 것인지 확정해야 함:

1. **(가능성 높음) NextAuth client `getSession()`이 axios baseURL을 따름** — `next-auth/react`의 `fetchData`는 `/api/auth/session`을 자기 origin에 호출하지만, 일부 환경에서 `__NEXTAUTH.basePath`가 잘못 설정되면 절대 URL로 변환됨. `NEXTAUTH_URL=http://localhost:3000`은 정상이지만 `NEXT_PUBLIC_API_URL=http://localhost:3001`이 같이 인라인되면 SDK 일부가 혼동 가능.
2. **(가능성 중간) Legacy Service Worker 잔존** — 이전에 production build 띄운 적 있다면 `/sw.js` 등록됨. defaultCache의 fetch handler가 `/api/auth/csrf`를 가로채고 NetworkFirst로 fetch하는데 base URL 처리가 잘못된 경우.
3. **(가능성 낮음) 외부 proxy/extension** — 사용자 Chrome 확장이 `/api/*` 요청을 backend로 redirect.

**Phase 0 reproduction 시나리오:**
- (a) Incognito Chrome + `chrome://serviceworker-internals/`에서 SW 확인 → 등록되어 있으면 unregister 후 재현 시도 (B8 가설 검증)
- (b) `Network` 탭에서 `/api/auth/csrf` 호출의 Initiator stack trace 확인 → `next-auth/client.js`인지 `sw.js`인지 식별
- (c) `NEXT_PUBLIC_API_URL`을 임시로 비워두고(`unset` 후 `pnpm dev`) 404 재현 여부 확인 → A1/A3 검증

이 reproduction 결과는 Phase 0 산출물의 일부.

---

## 3. Architectural Decision (ADR-0006 본문 후보)

### 3.1 결정

**Frontend ↔ Backend 라우팅 모델을 dev/lan/prod 모든 환경에서 same-origin reverse-proxy 단일 모델로 정착한다.**

- 클라이언트 axios `baseURL`은 `''` (상대) — 모든 호출이 `/api/...` 상대 경로
- Next.js dev에서는 `next.config.js` `rewrites`가 `/api/auth/*` 제외하고 `/api/*` → `INTERNAL_BACKEND_URL/api/*`로 프록시 (destination에 `/api` 포함)
- Production/lan에서는 nginx가 `/api/auth/(callback|providers|signin|signout|session|csrf)` → frontend, 그 외 `/api/*` → backend로 분기
- Server-side fetch (Server Component, NextAuth refresh callback)는 `INTERNAL_BACKEND_URL` 사용

### 3.2 채택 사유

| 기준 | Same-Origin Proxy | Dual-Origin 직접 | CSP 완화 |
|------|------------------|-----------------|----------|
| 보안 (CSP) | `connect-src 'self'`로 strict | `connect-src http://localhost:*` 강제 | 완화는 root cause 회피 |
| NextAuth 호환 | 자연스럽게 작동 | basePath 설정 fragile | 무관 |
| Production 정합성 | prod와 동일 모델 | prod와 다름 (debt) | 무관 |
| CORS 설정 | 불필요 | dev에서 명시 필요 | 완화는 위험 증가 |
| dev 디버깅 | nginx/Next rewrite 추가 1단계 | backend 직접 호출 가능 | — |

→ **Same-Origin 채택**. dev 디버깅 시 backend 직접 호출이 필요하면 `pnpm --filter backend run dev`만 띄우고 `curl -s http://localhost:3001/api/...`로 테스트 가능 (frontend 없이).

### 3.3 트레이드오프

- ❗ dev rewrites가 추가 hop 1회 → 응답 latency +1~5ms (LAN 무시 가능)
- ❗ Next.js rewrites는 production build에서도 동작하지만 prod는 nginx가 SSOT — rewrites는 fallback (빌드 산출물에 dead code 0 — Next.js가 server-only 처리)
- ❗ INTERNAL_BACKEND_URL이 server-only → SSR이 Docker 내부 host name resolve 가능해야 함 (`backend:3001` in compose, `localhost:3001` in dev)
- ✅ NextAuth가 `/api/auth/*`를 self-contained로 처리 (CSRF/session/signin/signout/callback 모두 frontend)
- ✅ CSP strict — `connect-src 'self' ws:` (dev ws만 추가)
- ✅ Backend는 same-origin이라 `enableCors` 불필요. dev만 `localhost:3000` 허용 (SSR 직접 디버깅 호환)

### 3.4 롤백 시나리오

각 Phase는 독립 commit. 단계별 git revert 가능.

- Phase 1 (env 변경) revert → Phase 0 SSOT 헬퍼는 그대로 두고 env만 dual-origin 복원
- Phase 2 (next.config rewrites) revert → 기존 `(?!auth)` 패턴 + destination 회복
- Phase 7 (CSP strict) revert → `connect-src http://localhost:*` 복원
- 전체 롤백: 본 plan 슬러그 commit들을 순서 역으로 revert. 사용자 영향 0 (인증 토큰 호환성 변경 없음, 쿠키 schema 그대로)

---

## 4. Affected Layers Matrix

| Layer | 파일 | Before | After | 근거 |
|-------|------|--------|-------|------|
| env (dev) | `apps/frontend/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:3001` | `NEXT_PUBLIC_API_URL=` (empty/주석) + `INTERNAL_BACKEND_URL=http://localhost:3001` | client는 상대 경로, server는 internal URL |
| env (template) | `apps/frontend/.env.example` | 동일 | 동일 패턴 + 주석 강화 | 신규 PC setup 가이드 |
| env (root) | `.env`, `.env.example` | `NEXT_PUBLIC_API_URL=http://localhost:3001` | `NEXT_PUBLIC_API_URL=` + `INTERNAL_BACKEND_URL=http://localhost:3001` | monorepo root는 backend용. frontend는 자체 `.env.local`. root는 backend 변수만 (`NEXT_PUBLIC_*`는 frontend `.env.local` SSOT) |
| env (test) | `.env.test` | `NEXT_PUBLIC_API_URL=http://localhost:3002/api` | `NEXT_PUBLIC_API_URL=` + `INTERNAL_BACKEND_URL=http://localhost:3002` | `/api` 접미사 제거하면 SSOT 정합 |
| env (lan) | `infra/compose/lan.override.yml:126` | `NEXT_PUBLIC_API_URL: http://...:9000` | `NEXT_PUBLIC_API_URL: ""` (single-origin) | nginx가 9000에서 /api → backend 처리하므로 client는 상대 경로면 충분 |
| Next.js rewrites | `apps/frontend/next.config.js:62-73` | `(?!auth).*` + destination missing `/api` | `/(?!auth)` + destination `${INTERNAL_BACKEND_URL}/api/:path*` (NextAuth 외 + `/api` 보존) | Next dev rewrites가 backend로 정확히 프록시 |
| api-config | `apps/frontend/lib/config/api-config.ts` | client absolute URL | client `''` (상대), server `INTERNAL_BACKEND_URL` | dual-mode 명확화. validation 강화 |
| api-client | `apps/frontend/lib/api/api-client.ts` | `baseURL: API_BASE_URL` (절대) | `baseURL: API_BASE_URL` (client는 빈 문자열, 결과적으로 same-origin) | 코드 변경 없음, env에 의해 결정. 단 validateApiPath에 절대 URL 경고 추가 |
| auth.ts (NextAuth) | `apps/frontend/lib/auth.ts:114,194,294,396` | `${API_BASE_URL}/api/auth/login` | `${INTERNAL_BACKEND_URL}/api/auth/login` (server-only) | NextAuth callback은 server에서 실행 — 명시적으로 server URL 사용 |
| server team api | `apps/frontend/lib/api/server/team-api-server.ts` | `${API_BASE_URL}` | `${INTERNAL_BACKEND_URL}` (또는 server-only API_BASE_URL이 internal로 resolve) | api-config의 `resolveServerBaseUrl`이 자동으로 internal URL을 반환하므로 코드 변경 0. 단 명시적 검증 |
| error-reporter | `apps/frontend/lib/error-reporter.ts:107` | `${API_BASE_URL}/api/monitoring/client-errors` | `/api/monitoring/client-errors` (client 전용 이미 `process.env.NODE_ENV !== 'development'` 가드) | client에서만 실행되므로 상대 경로면 충분 |
| health route | `apps/frontend/app/api/health/route.ts:5` | `process.env.BACKEND_URL \|\| 'http://localhost:3001'` | `process.env.INTERNAL_BACKEND_URL` 또는 `resolveServerBaseUrl()` 사용 | SSOT 통일 |
| proxy matcher | `apps/frontend/proxy.ts:177` | `'/((?!login\|api\|_next/static\|_next/image\|images\|favicon.ico).*)'` | `'/((?!login\|api\|_next/static\|_next/image\|_next/data\|images\|icons\|favicon.ico\|manifest.json\|manifest.webmanifest\|sw.js\|workbox-.*\|robots.txt\|sitemap.xml\|~offline).*)'` | PWA 자산 + Next.js 내부 자산 제외 |
| SW (legacy unregister) | `apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx` (신규) | 없음 | 마운트 시 `navigator.serviceWorker.getRegistrations()`로 모든 SW unregister | dev에서 production SW 잔존 차단 |
| SW (정책) | `apps/frontend/app/sw.ts` | `runtimeCaching: defaultCache` | `runtimeCaching: defaultCache` + 명시적 `/api/*` NetworkOnly 룰 prepend | API 응답 캐시 stale 방지 |
| CSP | `apps/frontend/proxy.ts:73` | `connect-src 'self' ws: wss: http://localhost:*` | dev `connect-src 'self' ws: wss:`, prod `connect-src 'self'` | same-origin 정착으로 backend port 제거 |
| Backend CORS | `apps/backend/src/main.ts:104` | `origin: frontendUrl \|\| 'http://localhost:3000'` | dev에서만 `origin: ['http://localhost:3000']`, prod는 `origin: false` 또는 제거 | same-origin이라 prod CORS 불필요. dev만 명시 |
| nginx | `infra/nginx/lan.conf:121` | `^/api/auth/(login\|signin\|token\|refresh)` → backend | `^/api/auth/(login\|signin\|token\|refresh\|test-login\|logout\|profile)` → backend (NextAuth 핸들러는 default `/api` rule에서 frontend로 흐르도록 reorder) — **또는** NextAuth 경로 명시: `^/api/auth/(callback\|csrf\|session\|signin/?$\|signout/?$\|providers)` → frontend, 나머지 `/api/*` → backend | NextAuth 핸들러가 frontend에 도달하도록 정확히 분기 |
| 운영 문서 | `docs/references/api-routing-architecture.md` (신규) | — | dev/lan/prod 라우팅 모델 SSOT 문서, NextAuth vs backend auth 경로 구분, INTERNAL_BACKEND_URL 운영 가이드 | 단일 진실의 소스 |
| 기존 문서 | `docs/references/dev-server-hygiene.md` | NotFoundException 증상 언급 | 본 plan 결과 반영하여 "이 증상이 single-origin 정착으로 해소됨" 추가 + 트러블슈팅 갱신 | 진단 가이드 정합성 |
| ADR | `docs/adr/0006-frontend-backend-routing-model.md` (신규) | — | ADR-0006 본문 (§3 결정 + §3.3 트레이드오프 + §3.4 롤백) | 결정 기록 |
| verify skill | `.claude/skills/verify-nextjs/SKILL.md` 또는 신규 `.claude/skills/verify-routing-origin/SKILL.md` | 없음 | env URL 절대/상대 분기 검증 + nginx auth path 분기 검증 + matcher PWA 자산 제외 검증 | 회귀 방지 |

---

## 5. Phase별 실행 순서

각 Phase는 독립 commit. 의존성: P0 → P1 → P2 → P3 → P4 → (P5 ‖ P6 ‖ P7) → P8 → P9 → P10. P5/P6/P7은 P4 완료 후 병렬 가능.

---

### Phase 0: SSOT 헬퍼 신설 + Reproduction

**목표:** URL 결정/엔드포인트 분류의 단일 진실의 소스 구축. 본 작업의 회귀 방지 토대.

**산출물:**

- `packages/shared-constants/src/api-routing.ts` 신규
  - `RELATIVE_API_BASE = ''` — 클라이언트 axios baseURL용
  - `NEXTAUTH_PATH_PREFIX = '/api/auth'` + `BACKEND_AUTH_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/test-login', '/api/auth/logout', '/api/auth/profile']` (backend가 핸들링하는 auth 경로)
  - `NEXTAUTH_HANDLER_PATHS = ['/api/auth/csrf', '/api/auth/session', '/api/auth/providers', '/api/auth/signin', '/api/auth/signout', '/api/auth/callback']` (NextAuth가 핸들링하는 경로)
  - `isBackendAuthPath(path)` / `isNextAuthHandlerPath(path)` 분류 헬퍼
  - 타입: `BackendAuthPath` / `NextAuthHandlerPath` 리터럴 union
- `packages/shared-constants/src/index.ts`에 re-export 추가

**Reproduction:** §2.3 시나리오 (a)(b)(c)를 실행해 NetworkTab Initiator stack 또는 SW 활성 여부를 기록. 결과를 Phase 0 commit message에 첨부.

**변경 파일:**

1. `packages/shared-constants/src/api-routing.ts` — 신규
2. `packages/shared-constants/src/index.ts` — export 추가

**검증:**
- `pnpm --filter @equipment-management/shared-constants tsc --noEmit`
- `pnpm tsc --noEmit` (전체)
- `BACKEND_AUTH_PATHS` ∩ `NEXTAUTH_HANDLER_PATHS` = ∅ (런타임 assertion 또는 spec 1건)

---

### Phase 1: env 모델 전환

**목표:** `NEXT_PUBLIC_API_URL`을 빈 값(상대 경로)로, `INTERNAL_BACKEND_URL`을 server 전용으로 정착.

**원칙:**
- frontend client는 same-origin → `NEXT_PUBLIC_API_URL=` (빈 값)
- frontend server는 backend 직접 호출 → `INTERNAL_BACKEND_URL=http://localhost:3001` (dev) / `http://backend:3001` (compose)
- root `.env`는 backend variable의 SSOT, frontend `NEXT_PUBLIC_*`은 `apps/frontend/.env.local` SSOT (memory: monorepo root .env Next.js 자동 미인식)

**변경 파일:**

1. `apps/frontend/.env.local` — `NEXT_PUBLIC_API_URL` 빈 값화, `INTERNAL_BACKEND_URL=http://localhost:3001` 추가, 주석 갱신
2. `apps/frontend/.env.example` — 동일 패턴 + 모델 설명 주석
3. `.env.example` — `NEXT_PUBLIC_API_URL` 주석 + `INTERNAL_BACKEND_URL` 추가, "frontend는 .env.local SSOT" 강조
4. `.env.test` — `NEXT_PUBLIC_API_URL=` (빈 값), `INTERNAL_BACKEND_URL=http://localhost:3002`, `/api` 접미사 제거
5. `infra/compose/lan.override.yml:126` — `NEXT_PUBLIC_API_URL: ""` (frontend 컨테이너), `INTERNAL_BACKEND_URL: http://backend:3001` 유지
6. `.env.production.template` — 신규 변수 안내 추가

**검증:**
- `pnpm --filter frontend run dev`로 dev 기동, 5분간 backend 콘솔 모니터링 → `Cannot GET /api/auth/csrf` 0건
- 단, Phase 2(rewrites) 미적용 상태에서는 `/api/equipment` 같은 일반 API가 깨질 수 있음 — Phase 2와 paired commit 권장 (또는 commit-time에는 dev 미가동, Phase 2 commit 후 통합 검증)
- `grep -rn "http://localhost:3001\|http://localhost:3000" apps/frontend/.env*` → 0 또는 주석만

---

### Phase 2: next.config.js rewrites 정합화

**목표:** Next.js rewrites가 NextAuth 핸들러는 frontend에 두고, 그 외 `/api/*`는 정확히 `${INTERNAL_BACKEND_URL}/api/:path*`로 라우팅.

**변경 파일:**

1. `apps/frontend/next.config.js:62-73`
   - `source: '/api/:path((?!auth).*)'` → 유지 (NextAuth 제외 정확함)
   - `destination: (process.env.INTERNAL_BACKEND_URL \|\| process.env.NEXT_PUBLIC_API_URL \|\| 'http://localhost:3001') + '/api/:path*'` — **`/api` prefix 보존**
   - `fallback` → `beforeFiles` 또는 동일 단계 유지하되 destination 정합 (실측: fallback이 매칭 우선순위 낮으므로 frontend `/api/auth/*` route handler가 먼저 매칭됨)

**근거:** `next.config.js`는 Node.js에서 평가되므로 `process.env.INTERNAL_BACKEND_URL` 직접 참조 가능 (server-only 변수 ok).

**검증:**
- `curl -s http://localhost:3000/api/equipment` → 401 (인증 필요) — backend로 정상 도달
- `curl -s http://localhost:3000/api/auth/csrf` → 200 + `csrfToken: ...` JSON — frontend NextAuth 핸들러 응답
- `pnpm --filter frontend run build` → 빌드 성공, rewrites 메타 산출물에 destination 포함 확인

---

### Phase 3: api-config.ts 모델 변경

**목표:** 클라이언트는 빈 baseURL, 서버는 internal URL. 검증/에러 메시지 갱신.

**변경 파일:**

1. `apps/frontend/lib/config/api-config.ts`
   - `resolveClientBaseUrl()` — `NEXT_PUBLIC_API_URL`이 빈 값/undefined면 `''` 반환 (상대 경로). 절대 URL이면 경고 + 그대로 사용 (점진적 마이그레이션 호환)
   - `resolveServerBaseUrl()` — `INTERNAL_BACKEND_URL` 우선. 없으면 `process.env.NEXT_PUBLIC_API_URL`이 절대 URL이면 사용 (dev 호환), 없으면 `DEV_FALLBACK_URL=http://localhost:3001`. production에서 internal/public 둘 다 없으면 throw
   - validateApiPath에 base URL 절대값 경고 추가: `if (process.env.NEXT_PUBLIC_API_URL?.startsWith('http')) console.warn('[API Config] NEXT_PUBLIC_API_URL이 절대 URL입니다. same-origin 모델 권장.')`

2. `apps/frontend/lib/api/api-client.ts`
3. `apps/frontend/lib/api/server-api-client.ts`
4. `apps/frontend/lib/api/authenticated-client-provider.tsx`

3개 파일 모두 baseURL은 `API_BASE_URL` 그대로 사용 (api-config가 자동으로 client/server 분기). 코드 변경 없음, 단 주석 갱신:
- "❌ 금지: 절대 URL 직접 baseURL 지정"
- "✅ 권장: 빈 baseURL → axios가 same-origin으로 자동 처리"

**검증:**
- `pnpm tsc --noEmit` PASS
- 브라우저 NetworkTab: 모든 axios 요청이 `http://localhost:3000/api/...` (frontend origin) 호출
- 절대 URL 호출 0건

---

### Phase 4: proxy.ts matcher 보강 + legacy SW unregister

**목표:** PWA 자산 + Next.js 내부 자산이 인증 가드에 걸리지 않도록 matcher 정밀화 + legacy SW unregister.

**변경 파일:**

1. `apps/frontend/proxy.ts:177` matcher 갱신
   - 제외 추가: `_next/data`, `icons`, `manifest.json`, `manifest.webmanifest`, `sw.js`, `workbox-.*`, `robots.txt`, `sitemap.xml`, `~offline`
   - 정규식: `'/((?!login|api|_next/static|_next/image|_next/data|images|icons|favicon.ico|manifest.json|manifest.webmanifest|sw.js|workbox-.*|robots.txt|sitemap.xml|~offline).*)'`

2. `apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx` 신규 (`'use client'`)
   - 마운트 시 `navigator.serviceWorker.getRegistrations()` → `process.env.NODE_ENV === 'development'`인 경우 모두 unregister
   - production에서는 현재 SW만 유지 (다음 sw.js 버전이 자동 교체)
   - 1회 실행 후 `sessionStorage`에 marker 저장 (재실행 방지)

3. `apps/frontend/app/layout.tsx` — `<LegacyServiceWorkerCleanup />` 마운트 (Suspense 내부)

**검증:**
- `curl -s http://localhost:3000/manifest.json -o /dev/null -w "%{http_code}"` → 200 (인증 가드 우회)
- `curl -s http://localhost:3000/icons/manifest-192.png -o /dev/null -w "%{http_code}"` → 200
- 브라우저 DevTools Application → SW unregister 동작 확인 (dev에서)
- 콘솔: `GET /login?callbackUrl=%2Fmanifest.json` 로그 0건

---

### Phase 5: auth.ts / error-reporter.ts / health route SSOT 정합

**목표:** server-side fetch는 `INTERNAL_BACKEND_URL`, client-side는 상대 경로.

**변경 파일:**

1. `apps/frontend/lib/auth.ts`
   - 파일 상단에 `const SERVER_API_BASE = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'` 추가 (server-only context)
   - `${API_BASE_URL}/api/auth/login` → `${SERVER_API_BASE}/api/auth/login` (4곳: refresh, login, test-login, users sync)
   - 또는 더 깔끔하게: `import { resolveServerBaseUrl } from './config/api-config'` 후 사용 (export 필요)

2. `apps/frontend/lib/error-reporter.ts:107`
   - `const backendUrl = '/api/monitoring/client-errors';` (상대) — client only이므로 same-origin
   - `${API_BASE_URL}/...` 제거

3. `apps/frontend/app/api/health/route.ts:5`
   - `const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://localhost:3001';` (`BACKEND_URL` deprecated)

4. `apps/frontend/lib/api/server/team-api-server.ts`
   - `API_BASE_URL` 그대로 사용 (resolveServerBaseUrl이 internal URL 자동 반환). 단 명시적 주석 "이 파일은 server-only — INTERNAL_BACKEND_URL로 resolve됨" 추가

**검증:**
- `grep -rn "API_BASE_URL\|process.env.NEXT_PUBLIC_API_URL\|process.env.BACKEND_URL" apps/frontend/lib/ apps/frontend/app/` 결과 분류:
  - api-config.ts: OK (definition)
  - server-only 파일 (auth.ts, server/*.ts, error-reporter.ts SSR fallback, health/route.ts): OK
  - client 파일에서 절대 URL 호출: 0건
- `pnpm --filter frontend run build` PASS

---

### Phase 6: SW 정책 강화

**목표:** API 응답이 SW 캐시에 저장되지 않도록 NetworkOnly 강제.

**변경 파일:**

1. `apps/frontend/app/sw.ts`
   - `runtimeCaching` 배열 prepend:
     ```typescript
     // 의도: NextAuth + API 응답은 절대 캐시하지 않음 (CSRF stale 방지, 인증 토큰 누설 방지)
     {
       matcher: ({ url }) => url.pathname.startsWith('/api/'),
       handler: new NetworkOnly(),
     },
     ```
   - navigation은 NetworkFirst (defaultCache 정책)
   - asset은 SWR (defaultCache 정책)

**검증:**
- `pnpm --filter frontend run build` PASS
- production build에서 SW 등록 후 `/api/auth/csrf` 응답이 `Cache-Control: no-store` 헤더와 함께 캐시 미저장 확인 (DevTools Application > Cache Storage)

---

### Phase 7: CSP 정책 정합화

**목표:** single-origin이 되었으므로 `connect-src 'self'`만 (dev는 ws:만 추가).

**변경 파일:**

1. `apps/frontend/proxy.ts:73` `buildCspHeader`
   - dev: `connect-src 'self' ws: wss:` (HMR WebSocket 허용)
   - prod: `connect-src 'self'`
   - `http://localhost:*` 제거

**검증:**
- `pnpm --filter frontend run build` PASS
- 브라우저 DevTools Console에서 CSP violation 0건 (5분 모니터링)
- `chrome://csp-violations`도 같이 확인

---

### Phase 8: Backend CORS 정책 축소

**목표:** same-origin 모델에서 production CORS는 불필요. dev만 명시적 허용.

**변경 파일:**

1. `apps/backend/src/main.ts:104`
   - production:  `origin: false` (CORS 비활성) 또는 same-origin이면 자동으로 허용 (preflight 미발생)
   - dev: `origin: ['http://localhost:3000']` 명시 — Swagger UI/외부 디버깅 호환
   - credentials: dev only true, prod 무관 (same-origin이라 미적용)

```typescript
const isProd = nodeEnv === 'production';
app.enableCors({
  origin: isProd ? (frontendUrl || false) : ['http://localhost:3000'],
  credentials: !isProd,
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
});
```

(prod에서 frontendUrl이 동일 origin이면 nginx가 same-origin이라 CORS 자체 미발동. frontendUrl이 다른 origin이면 명시적 허용 — back-compat)

**검증:**
- `pnpm --filter backend run test` PASS
- dev에서 `curl -H "Origin: http://localhost:3000" http://localhost:3001/api/equipment -I` → `Access-Control-Allow-Origin: http://localhost:3000`
- prod build에서 cross-origin curl 차단 확인 (또는 frontendUrl 명시된 origin만 허용)

---

### Phase 9: nginx (lan/prod) 분기 정확화

**목표:** NextAuth 핸들러 경로(`/api/auth/csrf`, `/api/auth/session` 등)를 frontend로 라우팅.

**변경 파일:**

1. `infra/nginx/lan.conf` — `/api` location 위에 NextAuth 핸들러 location 추가:
   ```nginx
   # NextAuth 자체 핸들러 경로 — frontend가 처리
   location ~ ^/api/auth/(csrf|session|providers|signin|signout|callback)(/.*)?$ {
       limit_req zone=auth burst=10 nodelay;
       proxy_pass http://frontend;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
   (기존 `^/api/auth/(login|signin|token|refresh)` location은 backend 매칭 — `signin` 충돌 → backend의 signin은 없으므로 제거 또는 NextAuth 우선 정렬)

2. `infra/nginx/nginx.conf.template` (prod) — 동일 패턴 적용 (있는 경우)

**검증:**
- compose lan 환경에서 `curl http://lan-ip:9000/api/auth/csrf` → 200 + JSON
- `curl http://lan-ip:9000/api/auth/login -X POST` → backend 응답 (200 또는 401)
- nginx config syntax: `nginx -t -c /etc/nginx/nginx.conf` PASS (compose 컨테이너 내부에서)

---

### Phase 10: 운영 문서 + ADR + verify skill

**목표:** 결정·운영 가이드·회귀 방지 모두 문서화.

**변경 파일:**

1. `docs/references/api-routing-architecture.md` (신규, ~200 lines)
   - dev/lan/prod 라우팅 모델 다이어그램
   - NextAuth vs backend auth 경로 구분 표
   - `INTERNAL_BACKEND_URL` 운영 가이드
   - 트러블슈팅: `Cannot GET /api/auth/csrf` 발생 시 체크리스트

2. `docs/references/dev-server-hygiene.md` 갱신
   - `Cannot GET /api/auth/csrf` 증상이 single-origin 정착으로 해소됨 명시
   - 잔존 시 → `api-routing-architecture.md` 트러블슈팅 참조

3. `docs/adr/0006-frontend-backend-routing-model.md` (신규)
   - §3.1~3.4 본문 (위 §3 참조)
   - Status: Accepted (2026-04-28)

4. `.claude/skills/verify-routing-origin/SKILL.md` (신규) 또는 `verify-nextjs/SKILL.md` 갱신
   - Step N: env URL 절대/상대 분기 검증 (`grep -rn "baseURL.*http" apps/frontend/lib/api/`)
   - Step N+1: nginx auth 경로 분기 검증 (lan.conf/nginx.conf.template grep)
   - Step N+2: proxy.ts matcher PWA 자산 제외 검증
   - Step N+3: BACKEND_URL/NEXT_PUBLIC_API_URL/INTERNAL_BACKEND_URL 사용처 검증

5. `CLAUDE.md` — Deep-Dive References 표에 `api-routing-architecture.md` 추가

6. `docs/references/skills-index.md` — 신규 verify-routing-origin (있으면) 추가

**검증:**
- `pnpm lint` PASS (마크다운/링크)
- 신규 ADR이 README index에 등록됨

---

### Phase 11 (검증): tsc/build/lint + verify-* + e2e + 5분 모니터링

**목표:** Contract MUST 항목 전부 PASS.

**검증 명령:**

```bash
# 1. 타입 체크
pnpm tsc --noEmit

# 2. 빌드
pnpm --filter backend run build
pnpm --filter frontend run build

# 3. 단위 테스트
pnpm --filter backend run test

# 4. lint
pnpm lint

# 5. verify skill 실행 (Evaluator가 수행)
# verify-ssot, verify-hardcoding, verify-security, verify-nextjs, verify-cache-events

# 6. 스모크: backend 콘솔 5분 모니터링
# pnpm dev 후 5분 대기, "Cannot GET /api/auth/" 0건 확인

# 7. e2e (login → dashboard)
pnpm --filter frontend run test:e2e -- tests/e2e/features/layout/sidebar-nav-action.spec.ts
# (가벼운 단일 spec — 본 작업이 인증 흐름에 직접 영향)

# 8. PWA 자산 verify
curl -sI http://localhost:3000/manifest.json | head -1   # HTTP/1.1 200
curl -sI http://localhost:3000/icons/manifest-192.png | head -1   # HTTP/1.1 200

# 9. axios 클라이언트 SSOT 정합 (3개 파일 동일 baseURL)
grep "baseURL: API_BASE_URL" apps/frontend/lib/api/api-client.ts apps/frontend/lib/api/server-api-client.ts apps/frontend/lib/api/authenticated-client-provider.tsx
```

---

## 6. 보안 영향

| 항목 | 영향 | 완화 |
|------|------|------|
| Internal-API-Key 누출 | INTERNAL_BACKEND_URL은 server-only env | `process.env.INTERNAL_BACKEND_URL`은 `NEXT_PUBLIC_` prefix 미보유 → 클라이언트 번들 미인라인 (Next.js 기본 동작). bundle analyzer로 검증 |
| backend 직접 노출 | prod에서는 nginx만 9000/443 노출, backend는 internal network | docker compose가 backend port를 호스트에 publish 안 함 (이미 그렇게 구성됨) |
| JWT cookie SameSite | `__Host-next-auth.session-token` SameSite=Lax (NextAuth 기본) | same-origin 모델로 변경되므로 정합 |
| CSP report-uri | path-based `${API_ENDPOINTS.SECURITY.CSP_REPORT}` | 변경 없음 — same-origin이라 자동 정합 |
| CORS preflight | same-origin이라 미발동 | dev만 cross-origin 디버깅 허용 |
| Authorization 헤더 누출 | same-origin → 전송 안전 | 변경 없음 |
| CSRF 토큰 | NextAuth `/api/auth/csrf`가 frontend에서 정상 발급 → POST signIn 정상 | Phase 9 nginx 분기로 lan/prod에서도 정합 |
| Service Worker stale 응답 | API NetworkOnly (Phase 6) → API 응답 캐시 미저장 | NextAuth CSRF token 갱신이 SW에 의해 stale되지 않음 |

---

## 7. 성능 영향

| 항목 | 영향 | 측정 |
|------|------|------|
| dev rewrites overhead | +1~5ms (Node→backend internal hop) | 무시 가능 |
| SSR fetch latency | INTERNAL_BACKEND_URL=loopback (`localhost:3001`) | 변화 0 |
| client bundle | axios 동적 baseURL 분기 단순화 | -0.1~0.5KB gzip (미미). `pnpm measure:bundle` baseline 갱신 (SHOULD) |
| nginx prod | 추가 location 1개 — regex 매칭 | 마이크로초 단위. 무시 가능 |
| SW cache miss (API) | API NetworkOnly → 매번 네트워크 | NextAuth CSRF 응답은 짧음 (~수십 byte). 영향 미미 |

---

## 8. Feature Flag / Rollout

본 변경은 env-driven이고 atomically 적용되므로 feature flag 불필요. 단계적 적용:

1. **dev**: Phase 1~7 atomic 적용. 5분 모니터링.
2. **lan**: Phase 9 (nginx) 적용 후 lan compose 재기동 (manual 검증 SHOULD).
3. **prod**: 실 사용자 발생 시점 (현재는 단독 사용자) 별도 PR + 사용자 통보.

각 환경의 진입점:
- dev: `pnpm dev:fresh` (좀비 정리 + .next/dev 클린 + 재기동)
- lan: `pnpm compose:lan up -d --build`
- prod: 별도 절차

롤백: §3.4 참조.

---

## 9. 관측/모니터링

- **Backend NotFoundException 알림**: `apps/backend/src/common/middleware/monitoring.middleware.ts`는 status 404를 monitoringService.recordHttpRequest에 기록함. monitoring 서비스에서 `/api/auth/*` 404 0건 알림 추가 (SHOULD, tech-debt-tracker로 이연 가능)
- **CSP violation report**: `/api/csp-report` 엔드포인트가 NextAuth 호출에 대한 violation을 잡으면 본 작업 회귀 신호. dashboard 알림 연결 (SHOULD)
- **5분 스모크**: contract MUST #10. dev 기동 후 backend 콘솔 5분 grep `Cannot GET /api/auth` 0건

---

## 10. 의사결정 로그

- **2026-04-28 14:00 — Single-origin vs CSP 완화**: 메인이 dual-origin 직접 호출을 사실상의 모델로 인식. 본 plan은 same-origin으로 정착 결정. 사유: prod와 정합, NextAuth 호환, CSP strict 회복
- **2026-04-28 14:15 — INTERNAL_BACKEND_URL 명명**: 이미 `api-config.ts`가 사용 중인 변수명 유지. 신규 명명(`BACKEND_LOOPBACK_URL` 등) 검토 후 SSOT 안정성 우선 → 기존 명 유지
- **2026-04-28 14:30 — NextAuth 경로 분류**: `BACKEND_AUTH_PATHS = [login, refresh, test-login, logout, profile]` (backend) vs `NEXTAUTH_HANDLER_PATHS = [csrf, session, providers, signin, signout, callback]` (frontend). 양 집합 disjoint. nginx에서 NextAuth 우선 매칭
- **2026-04-28 14:45 — feature flag 미채택**: env-driven atomic 변경이라 flag 불필요. 단일 사용자 환경에서 점진적 rollout overhead 불필요
- **2026-04-28 15:00 — `BACKEND_URL` env (health route) 통합**: SSOT 위반. `INTERNAL_BACKEND_URL`로 통일. 마이그레이션 비용 ~3 lines 미미
- **2026-04-28 15:15 — SW unregister 로직 위치**: layout.tsx (Suspense) vs `<head>` inline script. layout.tsx 채택 — `'use client'` 컴포넌트로 명시적 마운트가 검증·테스트 용이

---

## 전체 변경 파일 요약

### 신규 생성

| 파일 | 목적 |
|------|------|
| `packages/shared-constants/src/api-routing.ts` | URL/엔드포인트 분류 SSOT |
| `apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx` | dev에서 stale SW unregister |
| `docs/references/api-routing-architecture.md` | 라우팅 모델 SSOT 문서 |
| `docs/adr/0006-frontend-backend-routing-model.md` | ADR-0006 |
| `.claude/skills/verify-routing-origin/SKILL.md` | 회귀 방지 verify skill (또는 verify-nextjs 확장) |

### 수정

| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/.env.local` | NEXT_PUBLIC_API_URL 빈 값화, INTERNAL_BACKEND_URL 추가 |
| `apps/frontend/.env.example` | 동일 패턴 + 주석 강화 |
| `.env`, `.env.example` | NEXT_PUBLIC_API_URL 정합 |
| `.env.test` | /api 접미사 제거, INTERNAL_BACKEND_URL 추가 |
| `infra/compose/lan.override.yml` | NEXT_PUBLIC_API_URL 빈 값 |
| `apps/frontend/next.config.js` | rewrites destination에 /api 보존, INTERNAL_BACKEND_URL 사용 |
| `apps/frontend/lib/config/api-config.ts` | client/server 분기 명확화, validation 강화 |
| `apps/frontend/lib/api/api-client.ts` | 주석 갱신 |
| `apps/frontend/lib/api/server-api-client.ts` | 주석 갱신 |
| `apps/frontend/lib/api/authenticated-client-provider.tsx` | 주석 갱신 |
| `apps/frontend/lib/auth.ts` | NextAuth callback의 server-side fetch가 INTERNAL_BACKEND_URL 사용 |
| `apps/frontend/lib/error-reporter.ts` | client만 사용, 상대 경로로 |
| `apps/frontend/app/api/health/route.ts` | BACKEND_URL → INTERNAL_BACKEND_URL |
| `apps/frontend/lib/api/server/team-api-server.ts` | 주석으로 server-only 명시 |
| `apps/frontend/proxy.ts` | matcher PWA 자산 제외 + CSP connect-src strict화 |
| `apps/frontend/app/sw.ts` | API NetworkOnly 룰 추가 |
| `apps/frontend/app/layout.tsx` | LegacyServiceWorkerCleanup 마운트 |
| `apps/backend/src/main.ts` | CORS dev/prod 분기 |
| `infra/nginx/lan.conf` | NextAuth 핸들러 경로 → frontend 분기 |
| `infra/nginx/nginx.conf.template` | (prod 동일 패턴) |
| `docs/references/dev-server-hygiene.md` | 본 plan 결과 반영 |
| `CLAUDE.md` | Deep-Dive References 표에 api-routing-architecture.md 추가 |
| `docs/references/skills-index.md` | verify-routing-origin (생성 시) 추가 |

---

## 11. tech-debt-tracker 후속 (예상)

본 작업의 SHOULD 미완료 항목 또는 부수 발견:

- [ ] **[2026-04-28 nextauth-csrf] 🟢 LOW SW unregister e2e 검증** — Playwright로 dev에서 LegacyServiceWorkerCleanup 동작 검증. 시드 SW 등록 후 cleanup 후 `getRegistrations().length === 0` 확인. 트리거: 다음 PWA QA sprint
- [ ] **[2026-04-28 nextauth-csrf] 🟢 LOW bundle-size 측정** — `pnpm measure:bundle` baseline 갱신. axios baseURL 단순화 영향. 트리거: bundle 모니터링 sprint
- [ ] **[2026-04-28 nextauth-csrf] 🟢 LOW Docker compose 환경 manual 검증** — lan compose 기동 후 nginx auth 분기 + NEXT_PUBLIC_API_URL 빈 값 정합 확인. 트리거: lan 배포 sprint
- [ ] **[2026-04-28 nextauth-csrf] 🟢 LOW CSP report endpoint 정합 검증** — same-origin 모델에서 violation report 0건 5분 모니터링 후 alert 룰 추가. 트리거: 보안 모니터링 sprint
- [ ] **[2026-04-28 nextauth-csrf] 🟡 MEDIUM monitoring middleware 404 알림** — `/api/auth/*` 404 0건 알림 룰 신설. 본 작업 회귀 즉각 감지. 트리거: monitoring sprint
- [ ] **[2026-04-28 nextauth-csrf] 🟢 LOW NextAuth basePath 명시** — `next-auth/auth.ts`에 `pages.signIn` + 가능하면 `basePath` 명시. 트리거: NextAuth v6 마이그레이션 시
