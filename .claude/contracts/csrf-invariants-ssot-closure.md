# 스프린트 계약: csrf-invariants SSOT 5-place + 7 invariants closure

## 생성 시점

2026-05-07

## 슬러그 / 모드

- 슬러그: `csrf-invariants-ssot-closure`
- 모드: Mode 2 (Planner → Generator → Evaluator 루프)
- 평가 보고: `.claude/evaluations/csrf-invariants-ssot-closure.md`
- 출처: tracker.md `nextauth-handler-paths-5place-ssot-drift` 🟡 MEDIUM (라운드 #3 자기검토 scope 확장 — csrf-invariants.json 전체 hand-copy invariant 결빙)

## 배경

`commit-pipeline-safety-should-followups` sprint 시니어 #2 라운드에서 BACKEND_MODULE_SCOPES 3-way SSOT 정합을 잠근 패턴을 NextAuth handler paths + csrf-invariants 영역에 적용. 현재 5곳에 hand-copy 잔존하지만 spec 미잠금 → silent miss 위험.

**조사 결과 (commit `09608d78` 시점)**:
- 5-place 모두 *현재* 정합 (우연히): packages api-routing.ts (8 paths) ↔ csrf-invariants.json `nextAuthHandlerPaths.all` ↔ nginx lan.conf + nginx.conf.template ↔ next.config.js NEXTAUTH_HANDLER_REGEX_GROUP
- **Auth.js v4 dead invariant 발견**: `cookieInvariants.expectedCookies`에 `next-auth.*` 3종 (v4) + `authjs.*` 3종 (v5) = 6종. 본 시스템 `next-auth@5.0.0-beta.30` (Auth.js v5)이므로 v4 항목은 dead.

## 설계 결정 (over-engineering 회피)

| 옵션 | 선택 | 근거 |
|------|------|------|
| (a) Build script generation (`pnpm prebuild`) | ❌ | build chain 복잡도 ↑, 유지보수 비용 |
| (b) **Spec test cross-check (api-routing.spec.ts 확장)** | ✅ | 가장 적은 침습 (새 파일 0), pre-push 자동 실행, drift 즉시 fail |
| (c) JSON → .ts export | ❌ | nginx hand-copy 잔존, JSON schema SSOT 가치 손실 |

## Files in scope (변경 허용 파일 — 외부 수정 시 M-15 FAIL)

1. `packages/shared-constants/__tests__/api-routing.spec.ts` (수정 — describe block 확장)
2. `scripts/diagnostics/csrf-invariants.json` (수정 — v4 cookie 3종 제거 + version bump + 주석 갱신)
3. `.claude/exec-plans/tech-debt-tracker.md` (수정 — closure 표시)
4. `.claude/contracts/csrf-invariants-ssot-closure.md` (본 파일)
5. `.claude/exec-plans/active/2026-05-07-csrf-invariants-ssot-closure.md` (Generator 의사결정 로그 가능)
6. (옵션) `.claude/evaluations/csrf-invariants-ssot-closure.md` (Evaluator 출력)

## Out of Scope (Generator 절대 수정 금지)

- ❌ `packages/shared-constants/src/api-routing.ts` 본문 (NEXTAUTH_HANDLER_PATHS 자체는 변경 X — spec 검증만)
- ❌ `infra/nginx/lan.conf` 또는 `nginx.conf.template` 본문 (regex 변경 X)
- ❌ `apps/frontend/next.config.js` 본문 (NEXTAUTH_HANDLER_REGEX_GROUP 변경 X)
- ❌ `apps/frontend/lib/auth.ts` 본문 (cookies/basePath override 추가 금지 — 현재 default 의존이 invariant)
- ❌ `apps/frontend/app/sw.ts` 본문
- ❌ `scripts/onprem-verify.mjs` 또는 `scripts/diagnostics/nextauth-csrf-trace.mjs` 본문 (소비자만)
- ❌ `apps/frontend/package.json` next-auth 버전 (Auth.js v6 migration은 별도 sprint)
- ❌ ADR-0006 본문

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 5-place SSOT cross-check (api-routing.spec.ts 확장)

- [ ] **M-1: NEXTAUTH_HANDLER_PATHS ↔ csrf-invariants.json `nextAuthHandlerPaths.all` set equality**
  - spec describe block 추가 — fs read csrf-invariants.json + JSON.parse + Set 비교
  - missing/extra 모두 0 강제
  - `grep -c "nextAuthHandlerPaths" packages/shared-constants/__tests__/api-routing.spec.ts` ≥ 2

- [ ] **M-2: NEXTAUTH_HANDLER_PATHS ↔ infra/nginx/lan.conf regex set equality**
  - spec이 nginx config fs read + regex group 추출 (`(csrf|session|...)`) + Set 비교
  - `grep -c "lan.conf" packages/shared-constants/__tests__/api-routing.spec.ts` ≥ 1
  - `grep -c "extractNginxNextAuthGroup\|extractRegexGroup" packages/shared-constants/__tests__/api-routing.spec.ts` ≥ 1 (헬퍼 함수)

- [ ] **M-3: NEXTAUTH_HANDLER_PATHS ↔ infra/nginx/nginx.conf.template regex set equality**
  - 동일 패턴, 다른 fixture path
  - `grep -c "nginx.conf.template" packages/shared-constants/__tests__/api-routing.spec.ts` ≥ 1

- [ ] **M-4: NEXTAUTH_HANDLER_PATHS ↔ apps/frontend/next.config.js NEXTAUTH_HANDLER_REGEX_GROUP set equality**
  - spec이 next.config.js fs read + 정규식으로 NEXTAUTH_HANDLER_REGEX_GROUP 값 추출 + Set 비교
  - `grep -c "next.config.js" packages/shared-constants/__tests__/api-routing.spec.ts` ≥ 1

- [ ] **M-5: csrf-invariants.json `nginxRoutingInvariants.regexLocation` ↔ 실제 nginx regex 정합**
  - 4-way 일관성 (api-routing.ts ↔ JSON.nextAuthHandlerPaths.all ↔ JSON.nginxRoutingInvariants.regexLocation ↔ 실제 nginx 파일)
  - `grep -c "regexLocation\|nginxRoutingInvariants" packages/shared-constants/__tests__/api-routing.spec.ts` ≥ 1

#### 7 invariants 결빙

- [ ] **M-6: cookieInvariants.expectedCookies — Auth.js v5 only (v4 dead invariant 제거)**
  - `next-auth.csrf-token` / `__Host-next-auth.csrf-token` / `__Secure-next-auth.csrf-token` (v4) 3종 **제거**
  - `authjs.csrf-token` / `__Host-authjs.csrf-token` / `__Secure-authjs.csrf-token` (v5) 3종 **유지**
  - 검증: `grep -c '"next-auth\.csrf-token"' scripts/diagnostics/csrf-invariants.json` = 0
  - 검증: `grep -c '"authjs\.csrf-token"' scripts/diagnostics/csrf-invariants.json` = 1
  - spec assertion: cookieInvariants.expectedCookies length === 3 + 모두 `authjs.` prefix
  - 주석에 "Auth.js v5 (next-auth@5.0.0-beta.30) — v4 항목은 v6 migration 시 재검토" 명시

- [ ] **M-7: nextAuthClientBasePath — apps/frontend/lib/auth.ts에 basePath override 부재 cross-check**
  - spec이 lib/auth.ts fs read + `basePath:` 또는 `basePath ` 라인 검색 → 0건이면 default `/api/auth` 보장
  - csrf-invariants.json `nextAuthClientBasePath.expectedDefault === "/api/auth"` 정합 검증

- [ ] **M-8: serviceWorkerInvariants.swEntryPoint — fs 존재 + 경로 일치**
  - spec이 `apps/frontend/app/sw.ts` fs.statSync exists 검증
  - csrf-invariants.json `serviceWorkerInvariants.swEntryPoint === "apps/frontend/app/sw.ts"` 정합

- [ ] **M-9: cookieInvariants.samesite — Auth.js v5 기본 정합 (Lax 포함)**
  - spec assertion: csrf-invariants.json `cookieInvariants.samesite` 배열에 `"Lax"` 포함 (Auth.js v5 기본)
  - `httpOnlyRequired === true` 정합

- [ ] **M-10: requiredEnvVars.smoke — onprem-verify.mjs와 정합**
  - spec이 `scripts/onprem-verify.mjs` fs read + `process.env.ONPREM_PUBLIC_ORIGIN` 등의 사용 검색
  - csrf-invariants.json `requiredEnvVars.smoke`의 모든 키가 onprem-verify.mjs에서 process.env 참조되는지 검증

- [ ] **M-11: csrf-invariants.json schema integrity — version bump + adrRef + ssotCodeRef 보존**
  - version 문자열 SemVer (예: `1.0.0` → `1.1.0` bump — invariant scope 확장이므로 minor)
  - `$schema` / `adrRef` / `ssotCodeRef` 필드 보존
  - spec assertion: 본 4 필드 존재 + 타입 string

#### 회귀 가드

- [ ] **M-12: api-routing.spec.ts 모든 cases PASS**
  - `pnpm --filter @equipment-management/shared-constants run test --silent` exit 0
  - 기존 cases (BACKEND ∩ NEXTAUTH = ∅ 등) 회귀 0
  - 신규 cases ≥ 8 (M-1~M-11 매핑)

- [ ] **M-13: nextauth-csrf 진단 스크립트 회귀 없음**
  - `node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run` exit 0 (기존 동작 보존)
  - csrf-invariants.json 변경이 trace 스크립트의 invariants 참조 키 set에 영향 없음
    (cookieInvariants.expectedCookies 항목 수 6→3 변경은 trace 결과 메시지에 반영되어야 함)

- [ ] **M-14: tsc + 회귀 spec PASS**
  - `pnpm tsc --noEmit` exit 0
  - `pnpm --filter @equipment-management/shared-constants run test --silent --passWithNoTests` exit 0

- [ ] **M-15: Files in scope 외 수정 0건**
  - `git diff --name-only` 결과가 §Files in scope 6개 화이트리스트의 부분집합
  - `apps/`, `infra/nginx/`, `apps/frontend/`, `packages/shared-constants/src/`, `docs/adr/` 영역 modify 0
  - apps/frontend/next-env.d.ts 등 auto-generated는 예외 (다른 세션 잔존)

### 권장 (SHOULD) — 실패 시 tech-debt 기록, 루프 차단 없음

- [ ] **S-1: spec 헬퍼 함수 SSOT 분리 (nginx regex parser / next.config regex parser)**
  - 헬퍼 함수에 명시적 return type + JSDoc 1줄

- [ ] **S-2: csrf-invariants.json 주석에 v6 migration 시 재평가 가이드 명시**
  - cookieInvariants 주석에 "Auth.js v6 migration 시 재검토 — v6는 prefix 변경 가능" 추가

- [ ] **S-3: redactionPatterns SSOT cross-check (양 진단 스크립트 import 정합)**
  - spec이 onprem-verify.mjs + nextauth-csrf-trace.mjs 양쪽이 csrf-invariants.json `redactionPatterns`를 참조하는지 grep cross-check

- [ ] **S-4: responseHeaders.cacheControlPolicy 실제 응답 cross-check (e2e 또는 mock spec)**
  - 즉시 closure 부담 시 tech-debt 등록 (별도 sprint)

- [ ] **S-5: sprint history 메모리 + skill 갱신 (verify-routing-origin SKILL Step에 csrf-invariants 5-place 결빙 명시)**
  - manage-skills SSOT 갱신

### 적용 verify 스킬

- `verify-routing-origin` (SSOT 검증 — Step 12/13/14 csrf-invariants 무결성 + 신규 5-place spec 검증)
- 자동 verify 스킬 미해당 영역 (cookie/basePath cross-check) — 본 contract spec 자체가 직접 검증

### 부수 회귀 가드

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm --filter @equipment-management/shared-constants run test --silent` exit 0
- [ ] `pnpm verify:lint-ruleset-parity` exit 0 (24 checks PASS)
- [ ] `node --test scripts/__tests__/commitlint-config.spec.mjs scripts/__tests__/hook-timing.spec.mjs` (38 cases PASS)

---

## 검증 명령 (Evaluator 일괄 실행)

```bash
set -e
cd /home/kmjkds/equipment_management_system

# M-1 ~ M-5 (5-place spec)
grep -cE "nextAuthHandlerPaths|nginxRoutingInvariants" packages/shared-constants/__tests__/api-routing.spec.ts
grep -c "lan.conf" packages/shared-constants/__tests__/api-routing.spec.ts
grep -c "nginx.conf.template" packages/shared-constants/__tests__/api-routing.spec.ts
grep -c "next.config.js" packages/shared-constants/__tests__/api-routing.spec.ts

# M-6 (Auth.js v4 cleanup)
grep -c '"next-auth\.csrf-token"' scripts/diagnostics/csrf-invariants.json    # = 0 expected
grep -c '"authjs\.csrf-token"' scripts/diagnostics/csrf-invariants.json        # = 1 expected
node -e "const j=require('./scripts/diagnostics/csrf-invariants.json'); if(j.cookieInvariants.expectedCookies.length!==3) process.exit(1); j.cookieInvariants.expectedCookies.forEach(c=>{ if(!c.includes('authjs.')) process.exit(1) })"

# M-7 (basePath override 부재 cross-check)
grep -cE "basePath\s*:" apps/frontend/lib/auth.ts                              # = 0 expected (override 없음)

# M-8 (sw.ts 존재)
test -f apps/frontend/app/sw.ts

# M-11 (schema integrity)
node -e "const j=require('./scripts/diagnostics/csrf-invariants.json'); ['$schema','adrRef','ssotCodeRef','version'].forEach(k=>{ if(typeof j[k]!=='string') process.exit(1) })"

# M-12 (spec PASS)
pnpm --filter @equipment-management/shared-constants run test --silent 2>&1 | tail -10

# M-13 (trace 스크립트 dry-run)
node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run 2>&1 | tail -5

# M-14 (tsc)
pnpm tsc --noEmit

# M-15 (scope check)
git diff --name-only | sort -u

# 부수 회귀
pnpm verify:lint-ruleset-parity 2>&1 | tail -3
node --test scripts/__tests__/commitlint-config.spec.mjs scripts/__tests__/hook-timing.spec.mjs 2>&1 | tail -5
```

---

## 종료 조건

- 필수 (MUST) 15개 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제로 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패 → tech-debt-tracker.md 등록, 루프 차단 없음

## 시니어 자기검토 라운드 (Evaluator PASS 후)

본 sprint 자체가 직전 sprint 시니어 자기검토 #2 라운드에서 발견된 갭 closure 후속.
Evaluator PASS 후 다음 라운드 검토:

- **라운드 #1 (표면)**: spec grep 정확도 / nginx regex 추출 정규식 brittle 회피
- **라운드 #2 (architecture)**: SSOT 분산 추가 잔존 (Auth.js cookies가 v5 default에 의존하지만 default 자체가 v6로 바뀌면 silent break — Auth.js 라이브러리 버전 cross-check?)
- **라운드 #3 (운영)**: 신규 NextAuth endpoint 추가 시 (예: webauthn) 5-place + spec 모두 갱신 워크플로 분명한가? 개발자 경험 점검
