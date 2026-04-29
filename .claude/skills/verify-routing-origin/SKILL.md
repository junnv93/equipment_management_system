---
name: verify-routing-origin
description: ADR-0006 Same-Origin Reverse-Proxy 모델 검증. env 절대 URL 잠입, next.config.js rewrites destination, nginx auth 분기, proxy.ts matcher PWA 자산 제외, BACKEND ∩ NEXTAUTH disjoint를 grep 기반 자동 검증. 라우팅·인증 관련 변경 후 실행.
disable-model-invocation: true
argument-hint: '(없음)'
---

# Routing Origin (Same-Origin Reverse-Proxy) 검증

## Purpose

ADR-0006의 Same-Origin Reverse-Proxy 모델 정합성을 검증한다. 다음 4 레이어가 동일한 분류 규칙을 따르고 있는지 grep + jq + curl 기반으로 확인:

1. **SSOT** — `packages/shared-constants/src/api-routing.ts`의 `BACKEND_AUTH_PATHS` ∩ `NEXTAUTH_HANDLER_PATHS` = ∅
2. **env** — `NEXT_PUBLIC_API_URL`이 빈 값 또는 상대 경로(절대 URL 금지)
3. **Next.js rewrites** — `next.config.js` destination에 `/api` prefix 보존, NextAuth 핸들러 정확히 제외
4. **proxy.ts matcher** — PWA 자산 (manifest, sw, icons, workbox) 명시적 제외
5. **nginx** — NextAuth 핸들러는 frontend, 그 외 `/api/*`는 backend 분기

## When to Run

- `apps/frontend/.env.local`, `.env.example`, `.env.production.template`, `.env.test`, `infra/compose/*.yml` 변경 후
- `apps/frontend/next.config.js`, `proxy.ts`, `app/sw.ts`, `lib/config/api-config.ts` 변경 후
- `apps/backend/src/main.ts` (CORS) 변경 후
- `infra/nginx/lan.conf`, `nginx.conf.template` 변경 후
- `packages/shared-constants/src/api-routing.ts` 변경 후
- Auth.js 버전 업그레이드 후 (NextAuth 핸들러 경로 추가/제거 검증)

## Verification Steps

### Step 1: SSOT — BACKEND ∩ NEXTAUTH disjoint

```bash
node -e "
const m = require('./packages/shared-constants/dist/api-routing');
const inter = m.BACKEND_AUTH_PATHS.filter(p => m.NEXTAUTH_HANDLER_PATHS.includes(p));
if (inter.length) { console.error('FAIL: overlap', inter); process.exit(1); }
console.log('PASS: BACKEND ∩ NEXTAUTH = ∅');
"
```

기대: `PASS: BACKEND ∩ NEXTAUTH = ∅`

dist 미빌드 시 `pnpm --filter @equipment-management/shared-constants build` 선행.

### Step 2: env 절대 URL 잠입 검사

```bash
grep -nE "^NEXT_PUBLIC_API_URL=https?://" \
  apps/frontend/.env.local \
  apps/frontend/.env.example \
  .env.example \
  .env.test \
  infra/compose/*.yml 2>&1 | grep -v "^[^:]*:[^:]*:#"
```

기대: 출력 없음 (빈 값 또는 상대경로만 허용)

### Step 3: INTERNAL_BACKEND_URL 정의 확인

```bash
grep -nE "^INTERNAL_BACKEND_URL=" \
  apps/frontend/.env.local \
  apps/frontend/.env.example \
  .env.example \
  .env.test
```

기대: 4개 파일 모두 1줄씩 (값은 `http://localhost:300x` 또는 빈 값 무방)

### Step 4: next.config.js rewrites 정합

```bash
# destination에 /api prefix 보존 확인
grep -E "destination:" apps/frontend/next.config.js | grep -E "/api/:path\*"
# 기대: 1건 매칭 (예: `${internalBackendUrl}/api/:path*`)

# NextAuth 핸들러 제외 정규식 확인 (8개 경로)
grep -E "csrf\|session\|providers\|signin\|signout\|callback\|error\|verify-request" \
  apps/frontend/next.config.js
# 기대: 1건 매칭 (NEXTAUTH_HANDLER_REGEX_GROUP)

# NEXT_PUBLIC_API_URL 직접 참조 금지 (server-side rewrites는 INTERNAL_BACKEND_URL 사용)
grep -n "NEXT_PUBLIC_API_URL" apps/frontend/next.config.js
# 기대: 0건
```

### Step 5: api-config.ts SSOT 진입점

```bash
# API_BASE_URL과 INTERNAL_BACKEND_URL 둘 다 export
grep -E "^export const (API_BASE_URL|INTERNAL_BACKEND_URL)" \
  apps/frontend/lib/config/api-config.ts | wc -l
# 기대: 2

# RELATIVE_API_BASE를 SSOT에서 import
grep "RELATIVE_API_BASE" apps/frontend/lib/config/api-config.ts
# 기대: 1건 (import + resolveClientBaseUrl 반환값)
```

### Step 6: proxy.ts matcher PWA 자산 제외

```bash
grep -E "matcher:" apps/frontend/proxy.ts -A 2 | grep -oE "manifest\\\\\.json|manifest\\\\\.webmanifest|sw\\\\\.js|workbox-|icons|_next/data|\\\\\.well-known"
# 기대: 6건 이상 (PWA + Next.js internal 자산 모두)
```

### Step 7: nginx NextAuth 분기 (모든 nginx 설정 + 템플릿)

⚠️ `infra/nginx/`에는 `lan.conf`(LAN 운영) + `nginx.conf.template`(prod) 두 파일이 있다. 두 파일 **모두** 동일한 분기 정책을 따라야 한다 (prod 배포 회귀 차단).

```bash
# NextAuth handler → frontend (lan.conf + nginx.conf.template 모두)
grep -lE "location.*\\^/api/auth/\(csrf\\|session\\|providers\\|signin\\|signout\\|callback" \
  infra/nginx/*.conf infra/nginx/*.template
# 기대: 2건 (lan.conf + nginx.conf.template)

# 각 파일에서 NextAuth 분기 직후 proxy_pass http://frontend
for f in infra/nginx/lan.conf infra/nginx/nginx.conf.template; do
  echo "=== $f ===";
  awk '/location.*api\/auth\/\(csrf\|session/,/}/' "$f" | grep "proxy_pass http://frontend";
done
# 기대: 각 1건 (총 2건)

# Backend auth 분리 location도 동일하게 두 파일 모두 존재
grep -lE "location.*\\^/api/auth/\(login\\|refresh\\|logout\\|profile" \
  infra/nginx/*.conf infra/nginx/*.template
# 기대: 2건
```

### Step 8: SW `/api/*` NetworkOnly 강제

```bash
grep -E "NetworkOnly|matcher.*\\/api\\/" apps/frontend/app/sw.ts
# 기대: NetworkOnly import + matcher /api/ 규칙 모두 매칭
```

### Step 9: backend CORS 정책 정합

```bash
grep -A 5 "enableCors" apps/backend/src/main.ts | grep -E "frontendUrl|nodeEnv|origin"
# 기대: production에서 origin: false 또는 frontendUrl만 허용. dev만 localhost:3000 명시
```

### Step 10: 클라이언트 fetch baseURL 일관성

```bash
# 3개 axios 클라이언트 모두 baseURL: API_BASE_URL 사용
grep -c "baseURL: API_BASE_URL" \
  apps/frontend/lib/api/api-client.ts \
  apps/frontend/lib/api/server-api-client.ts \
  apps/frontend/lib/api/authenticated-client-provider.tsx
# 기대: 각 1

# 절대 URL을 baseURL에 직접 지정 금지
grep -rE 'baseURL:\s*"https?://' apps/frontend/lib/api/ apps/frontend/components/ 2>&1 | grep -v node_modules
# 기대: 0건
```

### Step 11: 코드 하드코딩 (localhost:300x) 검사

```bash
grep -rnE "http://localhost:300[0-9]" \
  apps/frontend/lib/ apps/frontend/app/ apps/frontend/components/ apps/backend/src/ \
  packages/shared-constants/src/ packages/schemas/src/ \
  | grep -v "node_modules\|.next/\|__tests__\|.test.ts\|.spec.ts\|DEV_FALLBACK_INTERNAL_BACKEND_URL\|//\|INTERNAL_BACKEND_URL"
# 기대: 0건 (DEV_FALLBACK 상수와 주석은 허용)
```

## Failure Recovery

| Step | FAIL 의미 | 복구 |
|------|----------|------|
| 1 | SSOT 분류 충돌 — backend auth가 NextAuth handler 경로를 덮어 noted | `packages/shared-constants/src/api-routing.ts` 분류 재검토 |
| 2 | env 절대 URL 잠입 — Same-Origin 모델 위반 | 빈 값으로 복구. `INTERNAL_BACKEND_URL`로 server-side 호출 분리 |
| 4 | rewrites destination에 `/api` 누락 | `${internalBackendUrl}/api/:path*` 패턴으로 복구 |
| 6 | PWA 자산 인증 가드 노출 | matcher 정규식에 `manifest\\.json|sw\\.js|icons|workbox-.*` 추가 |
| 7 | nginx가 NextAuth를 backend로 흘림 | NextAuth handler location을 backend auth location보다 위에 두고 `proxy_pass http://frontend` |
| 8 | SW가 NextAuth GET 응답 stale 캐시 | `/api/*` NetworkOnly 룰을 defaultCache보다 먼저 prepend |
| 9 | production CORS가 와일드 origin | `origin: frontendUrl || false`로 좁힘 |
| 10 | axios가 절대 URL 사용 | `baseURL: API_BASE_URL`로 통일 (api-config 자동 분기) |
| 11 | 코드 하드코딩 | INTERNAL_BACKEND_URL/API_BASE_URL 진입점 사용 |

## Related Files

- [docs/adr/0006-frontend-backend-routing-model.md](../../../docs/adr/0006-frontend-backend-routing-model.md)
- [docs/references/api-routing-architecture.md](../../../docs/references/api-routing-architecture.md)
- [packages/shared-constants/src/api-routing.ts](../../../packages/shared-constants/src/api-routing.ts)
- [apps/frontend/lib/config/api-config.ts](../../../apps/frontend/lib/config/api-config.ts)
