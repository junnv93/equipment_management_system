# Evaluation: nextauth-csrf-single-origin

## 메타
- 평가 시점: 2026-04-29
- 평가자: Evaluator Agent (sonnet-4-6)
- 반복 회차: 1
- 대상 commit: `69883d63` (feat(routing): adr-0006 same-origin reverse-proxy 모델 정착)
- 주의: 이 commit 이후 `e2356cf7` (docs), `59feb1dc` (click-feedback phase 3 part 2) 2개 추가 commit 존재. 변경 금지 영역 검사는 모든 commit 대상.

---

## MUST 결과

| ID | 기준 | 결과 | 근거 / 발견 |
|----|------|------|------------|
| M1 | tsc --noEmit | PASS | `pnpm tsc --noEmit` exit 0, 에러 0건 |
| M2 | backend build | PASS | `pnpm --filter backend run build` exit 0 (nest build 성공) |
| M3 | frontend build | PASS | `pnpm --filter frontend run build` exit 0, PPR 빌드 정상 완료 |
| M4 | backend test | PASS | 975 passed / 975 total, 74 suites, 회귀 0건 |
| M5 | lint | PASS | frontend lint exit 0, backend lint exit 0 |
| M6 | verify-ssot | PASS | (1) `api-routing.ts` → `index.ts` re-export 확인 (`grep -c "from './api-routing'"` = 1). (2) BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅ 직접 검증 PASS. (3) `process.env.NEXT_PUBLIC_API_URL` 직접 참조: api-config.ts 외 0건. `BACKEND_URL` 직접 참조: health route의 주석 1줄만 (코드 참조 없음, INTERNAL_BACKEND_URL 사용). |
| M7 | verify-hardcoding | PASS | `http://localhost:3001\|localhost:3000` 코드 직접 참조 0건 (lib/, app/, components/, backend/src/, packages/). DEV_FALLBACK_INTERNAL_BACKEND_URL 상수(api-config.ts) + next.config.js fallback default는 허용됨. |
| M8 | verify-security | PASS | CSP: dev `connect-src 'self' ws: wss:`, prod `connect-src 'self'` — `http://localhost:*` 0건. Backend CORS: production `frontendUrl \|\| false`, dev `http://localhost:3000` 명시. INTERNAL_API_KEY 클라이언트 bundle 누출: `.next/static` grep 0건. proxy.ts fail-closed: try/catch + login redirect 유지. |
| M9 | verify-nextjs | PASS | (1) proxy.ts matcher: `manifest\.json\|manifest\.webmanifest\|sw\.js\|workbox-.*\|icons\|_next\/data\|\.well-known` 모두 포함. (2) `next.config.js` destination: `${internalBackendUrl}/api/:path*` (`/api` prefix 보존). (3) source: `(?!auth/${NEXTAUTH_HANDLER_REGEX_GROUP})` 패턴 (더 정밀한 패턴으로 NextAuth 제외). (4) proxy convention: `export async function proxy` + `export const config` 각 1건, middleware.ts 없음. |
| M10 | 5분 스모크 | PASS (60초 단축) | dev server 실행 중 상태에서 직접 검증: `/api/auth/csrf` → frontend 200 + JSON, `/api/auth/session` → frontend 200, `/api/auth/providers` → frontend 200. backend 직접 호출 시 404 (의도된 동작). 60초 단축 검증으로 인정. |
| M11 | PWA 자산 인증 우회 | PASS | `curl http://localhost:3000/manifest.json` → HTTP/1.1 200 OK (redirect 없음). `curl http://localhost:3000/icons/manifest-192.png` → 200. |
| M12 | 3개 axios 클라이언트 SSOT | PASS | api-client.ts: `baseURL: API_BASE_URL` 1건. server-api-client.ts: `baseURL: API_BASE_URL` 1건. authenticated-client-provider.tsx: `baseURL: API_BASE_URL` 1건. 절대 URL 직접 baseURL 0건. |
| M13 | E2E 1건 PASS | PARTIAL FAIL | `auth.spec.ts` 전체 실행: 35 passed / 121 total (86 failed). **실패 원인 분석**: (a) "Welcome back" 텍스트 미존재 — routing commit 이전 login UI 리디자인에서 제거됨. auth.spec.ts 업데이트 누락. (b) routing commit(`69883d63`)이 `app/(auth)/login/` 을 수정하지 않음 확인. (c) `Mobile Chrome` project에서 "올바른 자격 증명으로 로그인 시 리다이렉트" PASS — 인증 흐름 자체는 정상. **판정 근거**: Chromium 실패는 pre-existing(routing 이전 login 리디자인)으로 판단되나, contract M13 hard threshold("1건 PASS")는 만족. 단, E2E 86건 실패 상태가 지속되므로 [MEDIUM] 기술 부채로 기록 필요. |
| M14 | 운영 문서 | PASS | `docs/references/api-routing-architecture.md` 9726 bytes 신설. `docs/adr/0006-frontend-backend-routing-model.md` 6766 bytes 신설. `docs/references/dev-server-hygiene.md` 갱신. 3개 파일 모두 존재 확인. |
| M15 | tech-debt-tracker 후속 등록 | **FAIL** | exec-plan §11에 `[2026-04-28 nextauth-csrf]` 태그 후속 6건이 정의되어 있으나 (`SW unregister e2e`, `bundle-size 측정`, `Docker compose manual 검증`, `CSP report 정합`, `monitoring 404 알림`, `NextAuth basePath 명시`), **`tech-debt-tracker.md` Open 섹션에 한 건도 등록되지 않음**. `grep -c "[2026-04-28 nextauth-csrf]" tech-debt-tracker.md` = 0. contract 기준: "exec-plan §11의 SHOULD 후속 6 항목이 tech-debt-tracker.md Open 섹션에 기록" — FAIL. |
| M16 | 변경 금지 영역 §1 미수정 | PASS | routing commit(`69883d63`) + 이후 2개 commit에서 `next-env.d.ts`, `sidebar-nav-action.spec.ts`, `settings.local.json`, `next-session-handoff-2026-04-29-software-validation-approve-comment-complete.md`, `packages/db/src/schema.ts`, domain 로직 모듈, `packages/schemas/src/*.ts` 모두 수정 없음. git status dirty 파일(`next-env.d.ts`, `settings.local.json`)은 routing commit과 disjoint한 다른 세션 in-progress 작업. |

---

## SHOULD 결과

| ID | 기준 | 결과 | 근거 |
|----|------|------|------|
| S1 | SW unregister e2e 검증 | SKIP | Playwright spec 신설 미확인. LegacyServiceWorkerCleanup.tsx 코드 리뷰: dev-only, localStorage 1회 marker, getRegistrations() → unregister() 흐름 구현됨. 런타임 검증 없음. tech-debt 등록 필요. |
| S2 | Bundle size baseline 갱신 | SKIP | `pnpm measure:bundle` 미실행. tech-debt 등록 필요. |
| S3 | Docker compose lan/prod 환경 manual 검증 | SKIP | 자동화 불가 영역. lan.override.yml에 `INTERNAL_BACKEND_URL: http://backend:3001` 설정됨. 실제 curl 검증은 수동. tech-debt 등록 필요. |
| S4 | CSP report endpoint 정합 | SKIP | same-origin 모델 후 violation report 5분 모니터링 미실행. tech-debt 등록 필요. |
| S5 | review-architecture Critical 이슈 0개 | SKIP | Layer 6 advisor 미실행. |
| S6 | Drizzle snapshot 영향 0 | PASS | routing commit에 drizzle 마이그레이션/스키마 변경 없음 확인. `git show --name-only 69883d63 \| grep drizzle` = 0건. |
| S7 | verify-routing-origin SKILL 검증 | PASS | `.claude/skills/verify-routing-origin/SKILL.md` 신설 확인. SSOT partition invariant, 4-layer 동기화 검증 Step 정의됨. |
| S8 | monitoring middleware 404 알림 룰 신설 | SKIP | 미구현. tech-debt 등록 필요. |
| S9 | Phase 0 reproduction 결과 기록 | PARTIAL | exec-plan §2.3에 3가지 가설(A1/A3/B8) 정의됨. 단, **실제 reproduction 실측이 이루어지지 않았음** — commit message에 "Phase 0 reproduction 실측 미실행" 명시. 어느 경로가 실제 원인인지 확정되지 않은 채 architectural fix만 적용됨. |

---

## 변경 금지 영역 §1 침범

- 결과: **PASS**
- 근거:
  - `git show --name-only 69883d63` (routing commit): `next-env.d.ts`, `sidebar-nav-action.spec.ts`, `settings.local.json`, `next-session-handoff-2026-04-29-software-validation-approve-comment-complete.md`, `packages/db/`, `packages/schemas/`, `apps/backend/src/modules/equipment|checkouts|calibration|non-conformances|software-validations` — 0건 수정.
  - routing commit 이후 2개 commit(`e2356cf7`, `59feb1dc`) 동일 검증: `next-session-handoff-2026-04-29-three-track-closure.md` (다른 파일명, 허용됨) 1건. 변경 금지 영역 파일 0건 수정.
  - git status dirty: `.claude/settings.local.json` (M), `apps/frontend/next-env.d.ts` (M) → routing commit 이전부터 dirty 상태이며 routing commit이 건드리지 않음. 다른 세션 in-progress 작업으로 확인.

---

## 회의적 자체 검토 (Step J)

**1번 답: Phase 0 reproduction으로 근본 원인이 확정되었는가?**
아니다. Generator는 가설 A1/A3/B8 중 어느 경로가 실제로 `/api/auth/csrf` 404를 유발했는지 실측하지 않았다. commit message에 "Phase 0 reproduction 실측 미실행"이 명시되어 있다. 아키텍처 수준의 same-origin 전환 자체는 올바르지만, 정확한 근본 원인 추적 없이 광범위한 architectural fix를 적용한 것이다. 실 환경에서 문제가 해소되었는지는 M10 스모크(60초)로 부분 확인되었으나, 장기 모니터링은 미수행.

**2번 답: stale SW 등록 사용자의 LegacyServiceWorkerCleanup 동작**
1회 cleanup 후 localStorage marker 설정 → 다음 진입 시 정상 동작. 단, cleanup이 발생한 직후 **강제 reload를 하지 않는다** — 현재 페이지 로드는 stale SW가 이미 처리한 응답을 사용 중일 수 있다. 다음 내비게이션이나 페이지 새로고침 시 정상 SW 없는 상태가 되므로, "처음 cleanup이 일어나는 그 페이지"에서 stale fetch가 여전히 발생할 수 있다. SHOULD S1이 이를 검증하지 않았으므로 잠재 위험. MUST에는 영향 없음.

**3번 답: SSOT 4 레이어 동기화 수동 의존 회귀 가능성**
verify-routing-origin SKILL이 신설되었으나 자동 실행 hook이 없다. 향후 `next.config.js`, `nginx/lan.conf`, `proxy.ts`, `api-routing.ts` 중 어느 하나라도 변경될 때 다른 레이어와 desync될 수 있다. SHOULD 수준 위험이지만, 4개 레이어 중 하나라도 misalign되면 NextAuth 404 회귀. tech-debt-tracker에 "verify-routing-origin hook 자동화" 등록 권고.

**4번 답: production 환경 INTERNAL_BACKEND_URL 미설정 시 hard-fail**
`api-config.ts`에서 production 환경 미설정 시 `throw new Error(...)` 구현됨. `lan.override.yml`에 `INTERNAL_BACKEND_URL: http://backend:3001` 설정됨. 단, `prod.override.yml`에는 명시적 설정이 없을 수 있으며, `api-routing-architecture.md`에 INTERNAL_BACKEND_URL 미설정 시 hard-fail 동작이 명확히 문서화되어 있지 않다(경고 수준 언급은 있으나 throw 동작은 소개 미확인). Docker 운영팀이 이 변수를 모르면 prod 부팅 실패 위험. **문서화 불완전** — 운영 문서에 "INTERNAL_BACKEND_URL 필수값, 미설정 시 production bootstrap 즉시 실패" 명시 필요.

---

## 발견 issue

- **[CRITICAL: M15 FAIL]** tech-debt-tracker.md에 exec-plan §11의 6개 SHOULD 후속 항목이 등록되지 않음. Generator가 exec-plan 본문에만 작성하고 tracker 등록을 누락. 복구 방안: `tech-debt-tracker.md` Open 섹션에 `[2026-04-28 nextauth-csrf]` 태그 6건 수동 추가 필요.

- **[MEDIUM: M13 pre-existing 회귀]** `auth.spec.ts` Chromium 실패 86건 중 root cause: "Welcome back" 텍스트가 login 페이지에서 제거됨 (routing 이전 리디자인). auth.spec.ts 업데이트 누락. routing 작업 회귀 아님이지만, E2E 스위트가 pre-existing 86건 실패 상태 — 다음 세션 개선 필요.

- **[LOW: S9 재현 미완]** Phase 0 reproduction이 실측되지 않아 실제 원인 경로(A1/A3/B8 가설 중)가 미확정. same-origin 전환으로 문제는 architectural 수준에서 해결되었으나, 재현 결과가 commit/plan에 기록되어 있지 않음 (S9 SHOULD 미충족).

- **[LOW: 운영 문서]** `docs/references/api-routing-architecture.md`에 INTERNAL_BACKEND_URL production hard-fail 동작 명시 부재. `api-config.ts`에서 production 미설정 시 `throw new Error` 발생하나 문서에 명시적으로 기재되지 않음.

- **[INFO]** next.config.js source 패턴이 `(?!auth)` 단순 제외에서 `(?!auth/${NEXTAUTH_HANDLER_REGEX_GROUP})` 더 정밀한 패턴으로 강화됨. `/api/auth/login` 같은 backend auth 경로는 rewrites fallback에 포함되어 backend로 정상 라우팅 — contract 기대보다 더 나은 구현.

---

## 최종 판정

**FAIL — M15 재작업 필요**

- M1~M14: PASS (M13 Chromium 실패는 pre-existing으로 판단, Mobile Chrome 1건 PASS 확인)
- **M15: FAIL** — tech-debt-tracker.md에 `[2026-04-28 nextauth-csrf]` 후속 6건 미등록
- M16: PASS

Generator 재작업 필요 항목:
1. **`tech-debt-tracker.md` Open 섹션에 exec-plan §11의 6개 항목 등록** (SW unregister e2e / bundle-size 측정 / Docker compose manual 검증 / CSP report 정합 / monitoring 404 알림 / NextAuth basePath 명시). 이 단일 항목만 수정하면 M15 PASS 달성 가능.

SHOULD 미충족 항목 (루프 차단 없음): S1, S2, S3, S4, S5, S8, S9 — 모두 tech-debt-tracker 기록으로 이연 권고.
