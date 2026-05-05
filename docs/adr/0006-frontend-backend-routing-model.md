# ADR-0006: Frontend ↔ Backend 라우팅 모델 — Same-Origin Reverse-Proxy

- **상태**: Accepted
- **일시**: 2026-04-28
- **결정자**: kmjkds (시니어 아키텍트 라운드)
- **맥락 범위**: frontend, backend, infra(nginx/compose), security(CSP/CORS), pwa(SW)

## Context

본 프로젝트는 Next.js 16 frontend(:3000) + NestJS backend(:3001) monorepo 구성이다. 도입 초기에는 frontend가 backend를 절대 URL(`http://localhost:3001`)로 직접 호출하는 **dual-origin 모델**을 사용했고, NextAuth(Auth.js v5)는 frontend의 catch-all route handler(`app/api/auth/[...nextauth]`)에서 처리하는 형태로 공존시켰다.

이 모델은 시간이 지나며 다음 결함을 누적시켰다:

1. **NextAuth 핸들러 경로(`/api/auth/csrf`, `/session`, `/providers`, `/signin`, `/signout`, `/callback/*`)가 backend로 흘러 404를 반복**. backend 콘솔에 3~5초마다 `NotFoundException: Cannot GET /api/auth/csrf`. 원인은 axios baseURL=backend 절대 URL + Next.js rewrites destination이 `/api` prefix를 잃은 채 backend로 보내는 두 결함의 조합.
2. **CSP `connect-src`가 강제로 `http://localhost:*`까지 허용** — same-origin이 아니어서 `'self'` 정책 불가.
3. **dev/lan/prod 환경별 라우팅 모델 비대칭** — prod compose는 이미 single-origin(`/api`) 정착, lan/dev만 dual-origin. nginx도 backend auth 경로만 명시하고 NextAuth 핸들러 경로는 fallthrough로 backend에 도달.
4. **PWA Service Worker `defaultCache`가 API 응답 SWR 캐시** — NextAuth GET 응답이 stale되면 CSRF 토큰 발급 실패 가능.

이 문제를 단편적으로 해결(예: NEXT_PUBLIC_API_URL만 변경)하면 nginx/SW/CSP 정합성이 무너진다. 아키텍처 수준의 통일된 결정이 필요하다.

## Decision

**Frontend ↔ Backend 라우팅 모델을 dev/lan/prod 모든 환경에서 same-origin reverse-proxy 단일 모델로 정착한다.**

핵심 규칙:

- **클라이언트 axios `baseURL` = `''` (또는 상대 경로)** — 모든 호출은 `/api/*` 상대.
- **`/api/auth/(csrf|session|providers|signin|signout|callback|error|verify-request)` → frontend NextAuth route handler**가 처리.
- **그 외 `/api/*` → backend**로 forward (dev: `next.config.js` rewrites, lan/prod: nginx).
- **server-side fetch**(SSR/Server Component, NextAuth callback)는 `INTERNAL_BACKEND_URL`을 사용해 backend를 직접 호출.
- 위 분류의 SSOT는 `packages/shared-constants/src/api-routing.ts`. nginx 정규식·next.config.js rewrites·proxy.ts matcher가 모두 본 SSOT를 참조하거나 verify-routing-origin이 동기화 검증.

### 검토한 대안 (Options)

1. **Same-Origin Reverse-Proxy (채택)**
   - ✅ CSP `connect-src 'self'` 가능
   - ✅ NextAuth가 자연스럽게 동작 (basePath 설정 fragile 제거)
   - ✅ dev/lan/prod 모델 통일
   - ✅ Backend `enableCors` 의존 축소 (production은 `false` 또는 `frontendUrl`만)
   - ❗ dev rewrites 1-hop 추가 (latency +1~5ms, LAN 무시 가능)
   - ❗ INTERNAL_BACKEND_URL 환경변수 추가 필요

2. **Dual-Origin (현행 유지) + NextAuth basePath 명시**
   - ✅ dev에서 backend 직접 호출 디버깅 편의
   - ❌ CSP 완화 강제 (`connect-src http://localhost:*`)
   - ❌ NextAuth client basePath fragile — 환경마다 다른 origin
   - ❌ prod 모델과 비대칭 — dev에서 통과한 코드가 prod에서 깨질 수 있음

3. **CSP 완화 + 직접 호출**
   - ❌ root cause 회피일 뿐 — 추후 CSP 강화 재시도 시 재발

→ **Option 1 채택**. dev에서 backend 직접 호출 디버깅이 필요하면 `pnpm --filter backend run dev`만 띄우고 `curl -s http://localhost:3001/api/...`로 충분. frontend 거치지 않는 별도 흐름.

## Consequences

### 긍정

- backend 콘솔의 `Cannot GET /api/auth/*` 404 0건 → 진단 노이즈 제거
- CSP strict-origin (`connect-src 'self'`) 회복 → XSS 차단력 향상
- PWA SW가 NextAuth GET 응답을 stale 캐시할 수 없도록 `/api/*` NetworkOnly 룰 강제
- dev/lan/prod 라우팅 모델 통일 — env 5종(`.env.local`/`.env.example`/`.env.production.template`/`.env.test`/`infra/compose/lan.override.yml`)이 같은 패턴 사용
- nginx auth 분기가 backend ∩ NextAuth disjoint 보장 → production 동일 회귀 차단
- backend `enableCors` production은 `origin: frontendUrl || false` — same-origin 환경에서 CORS 의존 0

### 부정

- `INTERNAL_BACKEND_URL` 환경변수 추가 — Docker compose / k8s manifest 업데이트 필요
- dev에서 frontend → backend 1-hop 추가 (HMR 재시작 시 rewrites 재로드 비용 0)
- legacy production SW 잔존 사용자는 `LegacyServiceWorkerCleanup`이 unregister하기 전까지 stale SW 영향 가능 — 첫 진입 시 한 번 reload 필요할 수 있음

### 완화 (Mitigations)

- `apps/frontend/lib/api/api-client.ts`의 `validateApiPath`에 절대 URL 감지 추가 — dev에서 console.error로 즉시 발견
- `apps/frontend/lib/config/api-config.ts`가 production에서 `INTERNAL_BACKEND_URL` 미설정 시 hard-fail throw — 운영 사고 차단
- `LegacyServiceWorkerCleanup` 컴포넌트가 dev 마운트 시 1회 SW unregister — stale fetch 가로채기 즉시 차단
- verify-routing-origin (신규 SHOULD skill)이 SSOT ↔ next.config.js ↔ nginx 동기화 검증 — 회귀 방지

### Trigger Conditions for Reconsideration

| 트리거                                                              | 임계값                                                |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| frontend rewrites latency overhead 측정                             | LAN p99 > 50ms 지속 시 nginx-only 모델로 단순화 검토  |
| backend 직접 호출(예: edge worker, mobile native)이 필요해지는 시점 | 별도 endpoint 분리 + CORS 명시적 허용 ADR로 별도 검토 |
| Auth.js basePath 변경(v6 등)                                        | 본 ADR 재평가                                         |
| CSP `connect-src` 완화가 필요한 외부 의존(예: Sentry SaaS) 도입     | endpoint 화이트리스트로 한정 — 모델 자체는 유지       |

## Recurrence Response (재발 시 1차 응답 절차)

본 ADR이 정착한 이후에도 동일한 증상(`Cannot GET /api/auth/csrf` 404, signin 무한 로딩,
세션 502/503 등)이 재발할 가능성에 대비해, manual 재현 시나리오를 코드로 결빙한 진단 harness를 제공한다.

### 1. 운영 스모크 (배포 직후 게이트)

`pnpm compose:onprem` 또는 어떤 deploy 직후에든 다음 1줄 명령으로 ADR-0006 invariant를 자동 검증한다.

```bash
pnpm compose:onprem:verify          # 표준
pnpm compose:onprem:verify -- --json # CI-friendly
```

검사 항목 (`scripts/diagnostics/csrf-invariants.json` SSOT 기반):

- `/api/auth/csrf`, `/api/auth/session`, `/api/auth/providers` 200 + JSON shape
- Set-Cookie SameSite/HttpOnly/Secure(https) + cookie domain host-only 정책
- `/api/auth/login`(backend 전용 경로)이 NextAuth JSON shape를 반환하지 않음 — 분기 disjoint sanity

종료 코드 0=PASS / 1=FAIL / 2=usage error.

### 2. 회귀 진단 harness (재발 시 1차 응답)

위 스모크가 FAIL이거나 운영 중 동일 증상이 재발하면 다음을 즉시 실행한다.

```bash
pnpm diagnostics:csrf                                   # ONPREM_PUBLIC_ORIGIN 또는 NEXTAUTH_URL 자동 사용
pnpm diagnostics:csrf -- --origin <url>                 # ad-hoc 검증
```

진단 항목:

- 환경변수 stack (`NEXT_PUBLIC_API_URL`/`INTERNAL_BACKEND_URL`/`NEXTAUTH_URL`/`ONPREM_PUBLIC_ORIGIN`)
- 정적 코드 검사 (`apps/frontend/app/sw.ts` NetworkOnly + `apps/frontend/lib/auth.ts` basePath 미override)
- 외부 proxy 헤더 chain (`X-Forwarded-Proto`/`-Host`/`-For`/`-Real-IP`)
- cookie domain 정책 (host-only 또는 origin host 일치)
- ADR-0006 invariant 위배 자동 평가 → `tmp/diagnostics/<ISO>-trace.json` artifact

상세 절차: [scripts/diagnostics/README.md](../../scripts/diagnostics/README.md)

### 3. CI 통합 결정

본 검증을 `.husky/pre-push`에는 통합하지 않는다. 외부 네트워크 의존이 solo trunk-based
정책(pre-push는 tsc/test만)과 충돌하기 때문이다. 권장 운영 모델:

```bash
pnpm compose:onprem && pnpm compose:onprem:verify
```

향후 `infra/scripts/deploy.sh` 표준화 시점에 자동 wiring을 검토한다.

## References

- 관련 ADR: ADR-0003 (NestJS + Next.js App Router), ADR-0004 (Docker Compose over Kubernetes)
- exec-plan: `.claude/exec-plans/active/2026-04-28-nextauth-csrf-single-origin.md`
- exec-plan: `.claude/exec-plans/completed/2026-05-05-nextauth-csrf-verify-harness.md`(본 ADR Recurrence Response 결빙)
- 운영 가이드: `docs/references/api-routing-architecture.md`
- SSOT 코드: `packages/shared-constants/src/api-routing.ts`
- Invariants SSOT: `scripts/diagnostics/csrf-invariants.json`
- 진단 harness: `scripts/diagnostics/nextauth-csrf-trace.mjs`
- 운영 스모크: `scripts/onprem-verify.mjs`
- Auth.js v5 docs: https://authjs.dev/getting-started/migrating-to-v5
- Next.js rewrites: https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
