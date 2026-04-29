# 다음 세션 핸드오프 — ADR-0006 Same-Origin Reverse-Proxy 완료 + push 차단 해소

## 메타
- 작성: 2026-04-29
- 슬러그: `nextauth-csrf-single-origin`
- 상태: **로컬 commit 완료, push 차단** (다른 세션 잔존 테스트 fail로 pre-push hook 차단)
- 본 세션 commit: `5e2b06fb` (마무리 fix), `69883d63` (본체 — 다른 세션이 합쳐 commit한 것)

---

## 1. 본 세션 요약

backend 콘솔의 `NotFoundException: Cannot GET /api/auth/csrf` 4040 반복 버그를 단편적이 아닌 아키텍처 수준에서 종결했다.

**아키텍처 결정**: ADR-0006 — Frontend ↔ Backend 라우팅 모델을 dev/lan/prod 모든 환경에서 same-origin reverse-proxy 단일 모델로 정착.

**4 레이어 SSOT 정합**:
1. `packages/shared-constants/src/api-routing.ts` — `BACKEND_AUTH_PATHS` ∩ `NEXTAUTH_HANDLER_PATHS` = ∅
2. `apps/frontend/next.config.js` rewrites — destination에 `/api` 보존, NextAuth 8 path 제외
3. `infra/nginx/{lan.conf, nginx.conf.template}` — NextAuth → frontend, backend auth → backend (두 파일 모두)
4. `apps/frontend/proxy.ts` matcher — PWA 자산(manifest/sw/workbox/icons) + `_next/data` 명시 제외

**부수 보강**: SW `/api/*` NetworkOnly prepend, CSP `connect-src 'self'` 회복, prod CORS `origin: false`, INTERNAL_BACKEND_URL hard-fail, `LegacyServiceWorkerCleanup` 컴포넌트.

**산출물**: ADR-0006, `docs/references/api-routing-architecture.md` (운영 가이드), `verify-routing-origin` skill (Step 1~11 grep + nginx 두 파일 검증), evaluation report.

---

## 2. push 차단 사유 (다음 세션 처리 필요)

```
apps/frontend/components/ui/__tests__/inline-action-button.test.tsx:49
  expect(btn.querySelector('.animate-spin')).toBeInTheDocument(); // FAIL
  Test Suites: 1 failed, 18 passed, 19 total
```

원인: 다른 세션의 click-feedback Phase 4d/4e 작업이 `animate-spin` → `motion-safe:animate-spin`으로 마이그레이션했는데 InlineActionButton 테스트 selector(`.animate-spin`)가 갱신되지 않음.

본 작업과 무관 (`apps/frontend/components/ui/inline-action-button.tsx`도 본 commit 변경 없음).

**다음 세션 첫 액션** (택1):
- **권장 A**: `inline-action-button.test.tsx:49`의 selector를 `.motion-safe\\:animate-spin` 또는 더 안정적으로 `[role="status"]` 또는 `aria-busy` 검사로 교체. 1줄 fix 후 push.
- **B**: `git push --no-verify` (hook 우회). 메모리 feedback `feedback_destructive_dry_run_first` + `git_workflow` 룰에 따라 사용자 명시 승인 없이는 회피.

---

## 3. 검증 상태

| 항목 | 결과 |
|------|------|
| tsc --noEmit | ✅ PASS (모든 패키지) |
| backend test | ✅ PASS (975/975) |
| backend build | ✅ PASS |
| frontend production build | ✅ PASS |
| backend lint | ✅ PASS |
| frontend lint | ✅ PASS |
| **frontend test** | ⚠️ 261/262 PASS (1건 fail: InlineActionButton — 다른 세션 잔존) |
| 60s dev 스모크 (`Cannot GET /api/auth/*`) | ✅ 0건 |
| PWA `/manifest.json` | ✅ 200 |
| PWA `/icons/manifest-192.png` | ✅ 200 |
| `/login?callbackUrl=%2Fmanifest` redirect | ✅ 0건 |
| INTERNAL_API_KEY client bundle 누출 | ✅ 0건 |
| 변경 금지 영역 §1 침범 | ✅ 0줄 |
| Evaluator 1차 판정 | ✅ MUST 16/16 (M15 fix 후) |

---

## 4. SHOULD 후속 (tech-debt-tracker 등록 완료)

`### 2026-04-29 harness: nextauth-csrf-single-origin SHOULD 후속` 섹션에 7건 등록:

1. **§S1 🟡 MEDIUM** legacy SW unregister e2e 검증 (`LegacyServiceWorkerCleanup` Playwright spec)
2. **§S2 🟢 LOW** bundle-size baseline 갱신
3. **§S3 🟡 MEDIUM** Docker compose lan/prod manual 검증
4. **§S4 🟢 LOW** CSP report endpoint violation 모니터링
5. **§S8 🟢 LOW** monitoring middleware `/api/auth/*` 404 알림 룰
6. **§J3 🟢 LOW** verify-routing-origin pre-commit hook 자동화
7. **§J1 🟢 LOW** Phase 0 reproduction actual network trace (사후 분석)

---

## 5. 시니어 자기검토 약점 (사용자 요청으로 추가 발견)

검토 후 사용자가 "정말 시니어 표준이냐" 질문 → 5건 약점 발견 → 1건 즉시 fix:

| # | 약점 | 처리 |
|---|------|------|
| 1 | `infra/nginx/nginx.conf.template` 누락 (lan.conf만 fix) | ✅ 본 세션 fix (commit `5e2b06fb`) |
| 2 | Phase 0 reproduction 실측 미실행 | tracker §J1 |
| 3 | 5분 스모크 → 60초 단축 | 사용자가 dev 띄울 때 직접 모니터링 권장 |
| 4 | `api-routing.ts` invariant 단위 테스트 부재 | 미처리 (다음 세션 권장) |
| 5 | E2E Chromium failure 본 작업 영향 검증 부족 | 다음 세션 권장 |

---

## 6. 다음 세션 권장 시작 절차

```bash
# 1. push 차단 해소
git pull --rebase  # 다른 세션 커밋 동기화
# inline-action-button.test.tsx:49 selector fix
# - .animate-spin → .motion-safe\\:animate-spin 또는
# - [role="status"] / aria-busy 검사로 교체
git add apps/frontend/components/ui/__tests__/inline-action-button.test.tsx
git commit -m "fix(test): InlineActionButton motion-safe selector 갱신"
git push  # pre-push hook PASS 확인

# 2. ADR-0006 회귀 방지 hook 추가 (SHOULD §J3)
# .husky/pre-push 또는 pre-commit에 path-based gate:
# - infra/nginx/, next.config.js, proxy.ts, api-routing.ts 변경 시 verify-routing-origin 자동 실행

# 3. api-routing.ts invariant 단위 테스트 추가 (시니어 자기검토 #4)
# packages/shared-constants/__tests__/api-routing.spec.ts 신설
# - BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅ assert
# - 정규식 매칭 단위 테스트 (NextAuth 8개 + backend 9개 모두 분류)
```

---

## 7. 사용자 수동 확인 권장

세션 마무리 후 사용자가 브라우저에서 직접 확인:

1. **stale SW 제거 확인**: `chrome://serviceworker-internals/` → 등록된 SW 목록 → 모두 unregister 또는 `LegacyServiceWorkerCleanup` 마운트 후 자동 제거 확인
2. **NextAuth 흐름**: http://localhost:3000/login → test_engineer 로그인 → DevTools Network에서 `/api/auth/csrf` 호출이 frontend(:3000) 응답인지 확인 (status 200 + JSON `{csrfToken}`)
3. **5분 풀 스모크**: `pnpm dev` 띄우고 5분간 backend 콘솔에 `Cannot GET /api/auth/*` 0건 시각 확인 (60초 단축 검증을 보완)
4. **PWA manifest**: DevTools → Application → Manifest 정상 로드 (redirect to /login 없음)

---

## 8. 변경 파일 (본 세션)

### 신규 (8)
- `packages/shared-constants/src/api-routing.ts` — 4 레이어 SSOT
- `apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx`
- `docs/adr/0006-frontend-backend-routing-model.md`
- `docs/references/api-routing-architecture.md`
- `.claude/skills/verify-routing-origin/SKILL.md`
- `.claude/contracts/nextauth-csrf-single-origin.md`
- `.claude/exec-plans/completed/2026-04-28-nextauth-csrf-single-origin.md`
- `.claude/evaluations/nextauth-csrf-single-origin.md`

### 수정 (21)
- env: `apps/frontend/.env.local`, `apps/frontend/.env.example`, `.env.example`, `.env.test`, `infra/compose/lan.override.yml`
- 코드: `apps/frontend/{next.config.js, proxy.ts, lib/config/api-config.ts, lib/api/api-client.ts, lib/auth.ts, lib/api/server/team-api-server.ts, lib/error-reporter.ts, lib/providers.tsx, app/api/health/route.ts, app/sw.ts}`, `apps/backend/src/main.ts`
- nginx: `infra/nginx/lan.conf`, `infra/nginx/nginx.conf.template`
- 패키지: `packages/shared-constants/src/index.ts`
- 문서: `docs/references/dev-server-hygiene.md`, `docs/references/skills-index.md`, `CLAUDE.md`, `.claude/exec-plans/tech-debt-tracker.md`

---

## 9. 참조

- ADR: `docs/adr/0006-frontend-backend-routing-model.md`
- 운영 가이드: `docs/references/api-routing-architecture.md`
- Plan: `.claude/exec-plans/completed/2026-04-28-nextauth-csrf-single-origin.md`
- Contract: `.claude/contracts/nextauth-csrf-single-origin.md`
- Evaluation: `.claude/evaluations/nextauth-csrf-single-origin.md`
- SSOT: `packages/shared-constants/src/api-routing.ts`
- verify skill: `.claude/skills/verify-routing-origin/SKILL.md`
