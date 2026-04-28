# 스프린트 계약: NextAuth CSRF 404 — Single-Origin Reverse-Proxy 모델 정착

## 생성 시점

2026-04-28T00:00:00+09:00

## Slug

`nextauth-csrf-single-origin`

## Goal

`backend:dev` 콘솔에 3~5초마다 발생하는 `NotFoundException: Cannot GET /api/auth/csrf` 404를 종결시키고, frontend ↔ backend 라우팅 모델을 dev/lan/prod 모든 환경에서 same-origin reverse-proxy 단일 모델로 정착한다.

관련 exec-plan: `/home/kmjkds/equipment_management_system/.claude/exec-plans/active/2026-04-28-nextauth-csrf-single-origin.md`

---

## 1. 변경 금지 영역 (Generator Hard-Block)

다음 파일/영역은 **다른 세션의 in-progress 작업**이므로 **절대 수정 금지**. 수정 발견 시 Evaluator는 즉시 FAIL 판정.

| 파일 | 사유 |
|------|------|
| `apps/frontend/next-env.d.ts` | git status M — 다른 세션의 in-progress |
| `apps/frontend/tests/e2e/features/layout/sidebar-nav-action.spec.ts` | git status M — 다른 세션의 in-progress |
| `.claude/settings.local.json` | git status M — 다른 세션의 in-progress |
| `.claude/evaluations/next-session-handoff-2026-04-29-software-validation-approve-comment-complete.md` | untracked — 다른 세션 산출물 |
| DB 스키마 (`packages/db/src/schema.ts`, drizzle 마이그레이션 0048+) | 본 작업 범위 외 |
| 도메인 로직 (`apps/backend/src/modules/equipment`, `checkouts`, `calibration`, `non-conformances`, `software-validations` 등 24개 모듈 비즈니스 로직) | 인증·라우팅과 무관 |
| `packages/schemas/src/*.ts` (stable Zod 스키마) | SSOT, 본 작업과 무관 |

**예외:** `packages/shared-constants/src/api-routing.ts` 신규 추가는 허용 (본 작업의 SSOT 헬퍼). `index.ts` re-export 1줄 변경 허용.

---

## 2. 성공 기준

### 2.1 필수 (MUST) — 실패 시 루프 재진입

- [ ] **M1.** `pnpm tsc --noEmit` (root 실행, 모든 패키지) 에러 0
- [ ] **M2.** `pnpm --filter backend run build` 성공
- [ ] **M3.** `pnpm --filter frontend run build` 성공 (production build, cacheComponents=true)
- [ ] **M4.** `pnpm --filter backend run test` 기존 단위 테스트 통과 (회귀 0)
- [ ] **M5.** `pnpm lint` PASS (frontend + backend + packages)
- [ ] **M6.** **verify-ssot** PASS — env URL/auth path SSOT 확인:
  - `packages/shared-constants/src/api-routing.ts` 신규 export 정상
  - `BACKEND_AUTH_PATHS` ∩ `NEXTAUTH_HANDLER_PATHS` = ∅ (런타임 또는 spec 단위)
  - `apps/frontend/lib/auth.ts`, `lib/api/*-client.ts`, `lib/api/server/*.ts`, `lib/error-reporter.ts`, `app/api/health/route.ts` 가 직접 `process.env.NEXT_PUBLIC_API_URL`/`BACKEND_URL` 참조 0건 (api-config.ts 또는 명시적 server-only 변수만)
- [ ] **M7.** **verify-hardcoding** PASS — `http://localhost:3001` 또는 `http://localhost:3000` 하드코딩:
  - 코드 (`apps/frontend/lib/`, `apps/frontend/app/`, `apps/frontend/components/`, `apps/backend/src/`)에서 0건 (단, `api-config.ts`의 `DEV_FALLBACK_URL` 상수 1건 + 주석은 허용)
  - env 파일 (`.env.local`, `.env.example`, `.env.production.template`, `.env.test`, `infra/compose/*.yml`)은 정의 위치이므로 허용
- [ ] **M8.** **verify-security** PASS:
  - CSP `connect-src` 갱신 — dev: `'self' ws: wss:`, prod: `'self'`. backend port 명시 0건
  - Backend CORS `enableCors` 정책: production은 `frontendUrl` 또는 `false`, dev만 `localhost:3000` 허용
  - `proxy.ts`의 fail-closed 동작 유지 (try/catch + login redirect)
  - INTERNAL_API_KEY가 client bundle 미인라인 (`pnpm --filter frontend build` 후 `.next/static`에 grep 0건)
- [ ] **M9.** **verify-nextjs** PASS:
  - `proxy.ts` matcher가 `manifest.json`, `manifest.webmanifest`, `sw.js`, `workbox-.*`, `icons/*`, `_next/data` 명시적 제외
  - `next.config.js` `rewrites` destination에 `/api` prefix 포함 (`${INTERNAL_BACKEND_URL}/api/:path*` 패턴)
  - `next.config.js` rewrites source에 `(?!auth)` NextAuth 제외 패턴 보존
  - `proxy.ts`가 Next.js 16 `proxy` (not `middleware`) 컨벤션 준수 (CLAUDE.md Rule 4)
- [ ] **M10.** **5분 스모크 테스트** — `pnpm dev` 기동 후 5분간 backend 콘솔 모니터링 (mode: detached `--force`):
  - `Cannot GET /api/auth/csrf` **0건**
  - `Cannot GET /api/auth/session` **0건**
  - `Cannot GET /api/auth/providers` **0건**
  - `Cannot GET /api/auth/signin` **0건**
  - `Cannot GET /api/auth/signout` **0건**
  - `Cannot GET /api/auth/callback` **0건**
- [ ] **M11.** **PWA 자산 인증 우회** — 다음 curl 모두 `200`:
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/manifest.json` → `200`
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/icons/manifest-192.png` → `200`
  - 5분 모니터링 동안 `frontend:dev` 콘솔에 `GET /login?callbackUrl=%2Fmanifest.json` **0건**
- [ ] **M12.** **3개 axios 클라이언트 SSOT 정합** — 모두 `import { API_BASE_URL } from '../config/api-config'` + `baseURL: API_BASE_URL`:
  - `apps/frontend/lib/api/api-client.ts`
  - `apps/frontend/lib/api/server-api-client.ts`
  - `apps/frontend/lib/api/authenticated-client-provider.tsx`
  - `grep -c "baseURL: API_BASE_URL" <3 files>` → 각 1
  - 절대 URL 직접 baseURL 0건
- [ ] **M13.** **NextAuth signIn → dashboard E2E** — 기존 storageState 기반 e2e 1건 PASS:
  - 적절한 spec 선택 (예: `tests/e2e/features/auth/login.spec.ts` 또는 dashboard 첫 진입 spec)
  - 본 작업이 sidebar-nav-action.spec.ts를 건드리지 않으므로 다른 spec 사용
  - 변경 금지 §1 위반 없음 확인
- [ ] **M14.** **운영 문서** — `docs/references/api-routing-architecture.md` 신설 + `docs/references/dev-server-hygiene.md` 갱신 + `docs/adr/0006-frontend-backend-routing-model.md` 신설. 마크다운 lint PASS, 링크 깨짐 0
- [ ] **M15.** **tech-debt-tracker.md 후속 등록** — exec-plan §11의 SHOULD 후속 6 항목이 `tech-debt-tracker.md` Open 섹션에 기록 (또는 본 작업 직접 처리)
- [ ] **M16.** **변경 금지 영역 §1 미수정** — git diff에서 §1 표 파일 0줄 변경

### 2.2 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] **S1.** SW unregister 로직 e2e 검증 — `LegacyServiceWorkerCleanup` 마운트 후 `getRegistrations().length === 0` 확인. Playwright spec 신설 또는 manual 검증
- [ ] **S2.** Bundle size 측정 — `pnpm measure:bundle` baseline 갱신. axios baseURL 분기 단순화 영향
- [ ] **S3.** Docker compose lan/prod 환경 manual 검증:
  - `pnpm compose:lan up -d --build` 후 `curl http://lan-ip:9000/api/auth/csrf` → 200 + JSON
  - `curl http://lan-ip:9000/api/auth/login -X POST` → backend 응답 (200 또는 401)
- [ ] **S4.** CSP report endpoint 정합 — same-origin 모델 후 violation report 5분 0건 + dashboard 알림 룰 검토
- [ ] **S5.** review-architecture Critical 이슈 0개 (Layer 6 advisor)
- [ ] **S6.** Drizzle snapshot 영향 0 (본 작업 DB 변경 없으므로 자동 PASS) — 명시 확인
- [ ] **S7.** verify-routing-origin (신규 skill) Step N 검증 PASS
- [ ] **S8.** monitoring middleware 404 알림 룰 신설 — `/api/auth/*` 404 0건 alert (즉시 회귀 감지)
- [ ] **S9.** Phase 0 reproduction 결과 commit message 또는 plan 본문에 기록 (§2.3 시나리오 (a)(b)(c) 중 어느 경로가 재현된 원인인지)

### 2.3 적용 verify 스킬

변경 파일 경로 기반 자동 선택:

| 파일 영역 | 적용 verify 스킬 |
|----------|------------------|
| `apps/frontend/lib/config/api-config.ts`, `lib/api/*.ts`, `lib/auth.ts`, `lib/error-reporter.ts` | verify-ssot, verify-hardcoding, verify-security |
| `apps/frontend/proxy.ts` | verify-nextjs, verify-security |
| `apps/frontend/app/sw.ts`, `components/pwa/*` | verify-nextjs |
| `apps/frontend/next.config.js` | verify-nextjs |
| `apps/backend/src/main.ts` | verify-security |
| `infra/nginx/lan.conf`, `infra/compose/*.yml` | (manual + verify-routing-origin if created) |
| `packages/shared-constants/src/api-routing.ts` | verify-ssot |
| 운영 문서 | manual 검증 |

review-architecture (Layer 6) — 머지 전 advisor 권장 (SHOULD).

---

## 3. 검증 명령 (각 MUST에 1:1 매핑)

```bash
# M1
pnpm tsc --noEmit

# M2
pnpm --filter backend run build

# M3
pnpm --filter frontend run build

# M4
pnpm --filter backend run test

# M5
pnpm lint

# M6 — verify-ssot (Evaluator는 .claude/skills/verify-ssot/SKILL.md 참조)
# 핵심 grep:
grep -rn "process.env.NEXT_PUBLIC_API_URL\|process.env.BACKEND_URL" apps/frontend/lib/ apps/frontend/app/ \
  | grep -v "config/api-config.ts" \
  | grep -v "//"
# 기대: 0건 (api-config.ts 외)

# M7 — verify-hardcoding
grep -rn "http://localhost:3001\|http://localhost:3000" \
  apps/frontend/lib/ apps/frontend/app/ apps/frontend/components/ apps/frontend/hooks/ \
  apps/backend/src/ packages/shared-constants/src/ packages/schemas/src/ \
  | grep -v "node_modules\|.next/\|__tests__\|.test.ts\|.spec.ts\|DEV_FALLBACK_URL" \
  | grep -v "//"
# 기대: 0건

# M8 — verify-security
grep "connect-src" apps/frontend/proxy.ts
# 기대: dev 'self' ws: wss:, prod 'self' (http://localhost:* 0건)

grep "enableCors" apps/backend/src/main.ts
# 기대: dev/prod 분기 + production은 origin: false 또는 frontendUrl

# INTERNAL_API_KEY 클라이언트 누출 확인
pnpm --filter frontend run build
grep -rn "INTERNAL_API_KEY" apps/frontend/.next/static/ 2>&1 | head -5
# 기대: 0건

# M9 — verify-nextjs
grep "matcher" apps/frontend/proxy.ts
# 기대: manifest.json|sw.js|icons|workbox|_next/data 모두 포함

grep "destination" apps/frontend/next.config.js
# 기대: + '/api/:path*' (또는 동등) 포함

grep "(?!auth)" apps/frontend/next.config.js
# 기대: 1건 (NextAuth 제외 패턴)

grep "export async function proxy\|export const config" apps/frontend/proxy.ts
# 기대: 둘 다 1건씩 (Next.js 16 proxy convention)

# M10 — 5분 스모크 (Evaluator 자동화)
pnpm dev:fresh --force --no-restart  # 환경 정리만
pnpm dev > /tmp/dev-smoke.log 2>&1 &
DEV_PID=$!
sleep 300
kill $DEV_PID 2>/dev/null
grep -c "Cannot GET /api/auth/" /tmp/dev-smoke.log
# 기대: 0

# M11 — PWA 자산
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/manifest.json
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/icons/manifest-192.png
# 기대: 200, 200

grep -c "GET /login?callbackUrl=%2Fmanifest" /tmp/dev-smoke.log
# 기대: 0

# M12 — axios SSOT
grep -c "baseURL: API_BASE_URL" \
  apps/frontend/lib/api/api-client.ts \
  apps/frontend/lib/api/server-api-client.ts \
  apps/frontend/lib/api/authenticated-client-provider.tsx
# 기대: 각 1

# 절대 URL 직접 baseURL 검사
grep -rn 'baseURL:.*"http' apps/frontend/lib/api/ | grep -v "node_modules"
# 기대: 0건

# M13 — E2E (변경 금지 영역 §1 회피)
pnpm --filter frontend run test:e2e -- tests/e2e/features/auth/login.spec.ts \
  || pnpm --filter frontend run test:e2e -- --grep "login"
# 기대: PASS

# M14 — 문서
ls docs/references/api-routing-architecture.md docs/adr/0006-frontend-backend-routing-model.md
# 기대: 양쪽 존재

# M15 — tech-debt 등록
grep -c "nextauth-csrf" .claude/exec-plans/tech-debt-tracker.md
# 기대: ≥ 6 (SHOULD 후속 6 항목 또는 직접 처리 시 0~5)

# M16 — 변경 금지 영역
git diff --name-only main \
  | grep -E "(apps/frontend/next-env.d.ts|sidebar-nav-action.spec.ts|.claude/settings.local.json|next-session-handoff-2026-04-29)"
# 기대: 0건
```

---

## 4. 수동 확인 항목 (사용자가 브라우저에서 검증)

본 작업 완료 후 사용자가 다음 시나리오를 수동 확인 (Generator는 자동화 불가):

1. **로그인 흐름** — http://localhost:3000/login 접속 → 콘솔 에러 0 → test_engineer credentials 입력 → 대시보드 정상 진입 → 새로고침 후에도 세션 유지
2. **NextAuth CSRF token 발급** — DevTools → Network → `/api/auth/csrf` 호출 시 응답 status 200 + `{"csrfToken":"..."}` JSON. backend port 3001로 향한 호출 0건
3. **PWA manifest** — DevTools → Application → Manifest 로드 정상. `/manifest.json` 호출 status 200, redirect to /login 없음
4. **Service Worker 정리** — dev에서 마운트 시 콘솔에 "[LegacyServiceWorkerCleanup] Unregistered N service workers" 로그 (과거 production build 띄운 적 있는 경우만). DevTools → Application → Service Workers 비어있음
5. **5분 모니터링 직접 확인** — `pnpm dev` 띄우고 5분간 backend 콘솔에 `Cannot GET /api/auth/...` 0건 시각 확인
6. **CSP violation 0건** — DevTools → Console에 `Refused to connect` 또는 `CSP violation` 0건
7. **로그아웃** — 사이드바 또는 IdleTimeoutDialog에서 signOut → 즉시 /login 리다이렉트 + 세션 쿠키 삭제

---

## 5. 종료 조건

- 필수 기준 (M1~M16) 전체 PASS → **성공**
- 동일 이슈 2회 연속 FAIL → **설계 문제 (수동 개입 요청)**
- 3회 반복 초과 → **수동 개입 요청**
- SHOULD 실패는 종료 조건에 영향 없음 — `tech-debt-tracker.md`에 기록 후 진행
- §1 변경 금지 영역 침범 시 즉시 FAIL + 핸드오프 종료

---

## 6. Generator 가이드

- exec-plan §5 Phase 0~10 순서대로 진행. 각 Phase 독립 commit 권장 (롤백 단위)
- Phase 0의 reproduction 결과를 commit message 또는 plan 본문에 기록 (§2.3)
- 변경 금지 영역 §1 침범 의심 시 즉시 중단 + 사용자 확인
- DB 변경 없음 — `db:generate` 실행 금지
- 본 작업은 **main 직접 작업** (memory: feedback_main_only_no_branches). 브랜치 만들지 말 것
- pre-push hook이 tsc + test 게이트 — push 전 자동 실행됨

---

## 7. 참조

- exec-plan: `/home/kmjkds/equipment_management_system/.claude/exec-plans/active/2026-04-28-nextauth-csrf-single-origin.md`
- ADR (신규): `/home/kmjkds/equipment_management_system/docs/adr/0006-frontend-backend-routing-model.md`
- 기존 라우팅 트러블슈팅: `/home/kmjkds/equipment_management_system/docs/references/dev-server-hygiene.md`
- handoff 형식: `/home/kmjkds/equipment_management_system/.claude/skills/harness/references/handoff-formats.md`
- Git workflow: `/home/kmjkds/equipment_management_system/docs/references/git-workflow.md`
- Tech debt: `/home/kmjkds/equipment_management_system/.claude/exec-plans/tech-debt-tracker.md`
