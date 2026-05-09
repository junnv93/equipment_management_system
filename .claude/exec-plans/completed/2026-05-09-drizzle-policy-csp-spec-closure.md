# 2026-05-09 drizzle-policy-csp-spec-closure — Mode 2 Plan

## 메타

- 생성: 2026-05-09T00:00:00+09:00
- 모드: Mode 2 Full (Planner → Generator → Evaluator harness)
- 슬러그: `drizzle-policy-csp-spec-closure`
- 처리 대상 tech-debt: `.claude/exec-plans/tech-debt-tracker.md` 라인 56·57 — 2026-04-17 harness "QR Phase 1-3 후속 정리" 2건
- 신규 ADR: ADR-0010 (Drizzle manual SQL policy)
- 예상 신규 파일: 3 / 수정 파일: 5

## Goal (3 줄)

(1) Drizzle 운영 정책의 *진짜 SSOT*인 "수동 SQL + journal append" 패턴을 private memory에서 프로젝트 doc + ADR로 승격해 doc-vs-memory 모순을 종결한다.
(2) QR Phase 1-3 후속 "수동 브라우저 검증" 항목은 이미 자동화된 e2e spec(phase1/2/3)으로 OBSOLETE 처리하고, 진짜 잔여 갭(CSP 위반 보고 wire 검증)을 새 e2e spec으로 결빙한다.
(3) Drizzle snapshot 재생성은 by-design WON'T-DO로 명시 종결한다 (memory feedback 정책 인용).

## 설계 철학

1. **Doc-vs-Memory 모순 영구 차단**: private memory feedback이 진짜 운영 정책이라면 그 정책은 누구나 읽을 수 있는 ADR + doc로 승격되어야 한다. 새 인원이 `DRIZZLE_MIGRATIONS.md`만 보고 `drizzle-kit generate`를 실행해 누적된 manual SQL을 잃을 위험을 차단.
2. **CSP wire 검증은 e2e 스코프 1건이면 충분**: 컨트롤러 unit test가 dispatch 로직을 커버하고 있고, 진짜 회귀 위험은 (a) proxy.ts가 CSP 헤더를 emit하지 않거나, (b) report-uri 경로가 SSOT에서 벗어나거나, (c) backend `/api/security/csp-report`가 라우팅 변경으로 도달 불가능해지는 시나리오. 이 3개를 1개 spec 파일로 결빙.
3. **No Drizzle SQL 생성**: 본 sprint는 doc/ADR/test-only — schema 변경 0건. tech-debt-tracker 닫는 행위가 schema 변경을 유발하지 않음.
4. **No 새 SSOT 도입**: 기존 `API_ENDPOINTS.SECURITY.CSP_REPORT` + `BASE_URLS.BACKEND` + `BASE_URLS.FRONTEND` 만 재사용. spec 내 하드코딩 0건.

## Pre-plan reality check

| 항목 | 발견 사실 |
|------|-----------|
| Drizzle journal 상태 | `_journal.json` 58 entries (idx 0~57), 마지막 tag `0057_add_documents_checkout_id` |
| Drizzle snapshot 상태 | `apps/backend/drizzle/meta/*.json` 26 파일 (0000~0025) — desync intentional (memory `feedback_drizzle_kit_interactive_prompt.md`) |
| Drizzle SQL 파일 수 | 62개 (baseline + 0001~0057 + rollback 4개 + 일부 누락 idx 사이의 manual file) |
| 기존 doc 위치 | `docs/development/DRIZZLE_MIGRATIONS.md` (203 lines) — §1 "반드시 drizzle-kit generate" 가 memory 정책과 모순 |
| memory feedback | `feedback_drizzle_kit_interactive_prompt.md` — "❌ 전체 snapshot 재생성 — 누적된 manual SQL을 잃음" 명시 |
| ADR 슬롯 | 0001~0009 점유, 0010 비어있음 |
| ADR 템플릿 | `docs/adr/template.md` — `### Trigger Conditions for Reconsideration` h3 사용 |
| CSP SSOT | `API_ENDPOINTS.SECURITY.CSP_REPORT = '/api/security/csp-report'` (`packages/shared-constants/src/api-endpoints.ts:610`) |
| proxy.ts CSP | `apps/frontend/proxy.ts:118-146` — `buildCspHeader(nonce, isDev, SSOT)` + `Content-Security-Policy` + `Report-To` JSON, success path만 emit |
| proxy matcher | `app(dashboard)` 외 routes (`/login`, `/api`, `_next`, 정적자산) 제외 → CSP는 dashboard 라우트만 |
| backend endpoint | `POST /api/security/csp-report` — `@Public()` + `@Throttle(10/min)`, legacy `csp-report` + Reporting API `csp-violation` 둘 다 분기 처리 |
| 기존 backend unit test | `apps/backend/src/modules/security/__tests__/security.controller.spec.ts` — controller dispatch 로직 커버. wire 미커버 |
| 기존 frontend e2e | `apps/frontend/tests/e2e/security.spec.ts` — Guard 7섹션. CSP 0섹션 |
| Playwright config | `testDir: './tests/e2e'`, `testMatch: '**/*.spec.ts'` — 새 spec 자동 발견 |
| storageState | `apps/frontend/tests/e2e/.auth/{role}.json` 5개 — auth.setup.ts가 생성 |

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| ADR 신설 여부 | **Yes — ADR-0010** | 운영 정책이 업계 표준(`drizzle-kit generate`)에서 의도적으로 이탈한 load-bearing 결정. 발견 가능성을 위해 ADR 형식 필수. ADR-0007/0008 패턴 답습 |
| Doc 갱신 범위 | DRIZZLE_MIGRATIONS.md §1 + §3 + 상태 절 + §4 + §7 갱신 | "반드시 drizzle-kit generate" 라는 misleading 지시 제거가 핵심 |
| Doc-ADR 관계 | Doc는 *operational how-to*, ADR은 *왜* | DRIZZLE_MIGRATIONS.md §1 위에 "결정 근거: ADR-0010" 백링크 |
| ADR Decision 본문 | "수동 SQL + journal append + DB 직접 apply + tracking sync" 4단 + `drizzle-kit generate` / `db:push` 금지 명시 | memory feedback 4-step 그대로 승격 |
| CSP spec 위치 | `apps/frontend/tests/e2e/security/csp-violation.spec.ts` (신규 폴더) | 기존 `security.spec.ts` (~260줄, Guard 7섹션) 단일 책임 보존, 향후 폴더 마이그레이션 여지 |
| CSP spec 인증 모델 | `storageState` (lab_manager) 사용 | proxy.ts 분석: CSP 헤더는 인증 성공 path에만 emit. unauthenticated request는 `/login` redirect → CSP 헤더 없음 |
| CSP spec 카테고리 | 3 MUST + 1 SHOULD | TC-1 header / TC-2 report-to SSOT / TC-3 양 payload shape (MUST), TC-4 real violation (SHOULD — flaky 가능) |
| Playwright API 선택 | `request` fixture (HTTP) + `page.evaluate` (DOM 주입) + `expect.poll` (타이밍) | `page.route` 사용 회피 — 실제 wire 검증이 목적, intercept 부적합 |

## 구현 Phase

### Phase 1 — ADR-0010 신설 (Drizzle Manual SQL Policy)

**목표:** "수동 SQL + journal append" 정책의 발견 가능한 공식 결정 문서 결빙.

**변경 파일:**
1. `docs/adr/0010-drizzle-manual-sql-policy.md` — 신규. `docs/adr/template.md` 형식 준수:
   - **상태**: Accepted, **일시**: 2026-05-09, **맥락 범위**: backend, ops
   - **Context**: baseline squash(2026-04-07) 이후 `drizzle-kit generate`가 column rename 모호성으로 TTY interactive prompt 발생 → CI/Claude/non-TTY 환경에서 실행 불가 → 후속 schema 변경 ~30건이 manual SQL + journal append 방식으로 누적. snapshot은 0025까지만 유지(현재 0025 / journal 0057). 정책 SSOT가 private memory feedback에만 존재 → doc(`DRIZZLE_MIGRATIONS.md`)이 모순된 지시("반드시 drizzle-kit generate")를 표시하여 새 인원이 따라가면 manual SQL 누적분 손실 위험.
   - **Decision**: "Drizzle 마이그레이션 작성은 수동 SQL + `_journal.json` append + DB 직접 apply + `__drizzle_migrations` tracking row sync 4단계로 통일한다. `drizzle-kit generate`와 `drizzle-kit push`는 본 레포에서 금지한다. snapshot 재생성도 금지한다(누적된 manual SQL 손실)."
   - **검토한 대안**:
     - Option A — 매번 baseline squash. **거부**: 다환경 배포 가능성 + 58 entries 누적 비현실적.
     - Option B — TTY 자동 응답 우회. **거부**: drizzle-kit이 TTY 직접 검사라 stdin pipe/`--force` 무효 (memory 검증 완료).
     - Option C — manual SQL + journal + tracking sync. **채택**: 운영 검증 완료(2026-04-07~현재 ~30건 무회귀).
   - **Consequences (긍정)**: TTY 의존 0 / CI 자동화 가능 / 백필 SQL 인라인 작성 자유.
   - **Consequences (부정)**: snapshot~journal desync 영구화 → `drizzle-kit generate` 사용 시 last snapshot(0025)부터 diff 재계산 → 0026~0057 변경이 "변경사항 없음"으로 누락 위험.
   - **Mitigations**:
     - (a) `drizzle-kit generate` 호출을 ESLint/CI grep으로 차단 (향후 SHOULD)
     - (b) DRIZZLE_MIGRATIONS.md §1을 "manual SQL 절차"로 갱신 (Phase 2)
     - (c) PR 체크리스트에 "snapshot 변경 0건 확인" 명시 (Phase 2)
   - **Trigger Conditions for Reconsideration**:
     | 트리거 | 임계값 |
     | ------ | ------ |
     | drizzle-kit이 manual SQL 인식 가능한 새 명령 추가 | 출시 후 검증 |
     | 다환경(staging/prod) 배포 시작 | 배포 결정 시점 |
     | manual SQL 회귀(잘못된 hash로 db:reset 실패) 누적 | 분기당 ≥ 2건 |
   - **References**: ADR-0002 (Drizzle ORM 채택), `docs/development/DRIZZLE_MIGRATIONS.md`, memory `feedback_drizzle_kit_interactive_prompt.md` (private).

**검증:**
- 파일 존재 + Decision/Consequences/Trigger Conditions/References 헤더 모두 존재
- `drizzle-kit generate` 금지 명시
- 회피 시도 3건 (TTY/stdin/snapshot 재생성) 모두 명시

### Phase 2 — DRIZZLE_MIGRATIONS.md 갱신 (모순 제거)

**목표:** "반드시 `drizzle-kit generate`" 지시를 manual workflow로 교체. 상태 절을 현재 수치로 갱신.

**변경 파일:**
1. `docs/development/DRIZZLE_MIGRATIONS.md` — 수정.
   - **상태 절** (라인 5~13): 헤더 "(2026-04-07 baseline squash / 2026-05-09 업데이트 — ADR-0010)"; 라인 8 "0001~0031" → "0001~0057"; 라인 9 "0024까지만" → "0025까지만 (journal 58 entries / SQL 62 파일 / snapshot 26 파일 — desync intentional, ADR-0010 참조)"; 라인 12 "0001~0031 row" → "0001~0057 row".
   - **§1 (라인 49~62) 전면 교체** — "스키마 변경은 반드시 `drizzle-kit generate`" → "스키마 변경은 manual SQL + journal append (ADR-0010)":
     - 메인 지시: "`drizzle-kit generate`는 본 레포에서 금지(ADR-0010). 새 마이그레이션은 다음 4단계로 작성한다."
     - 4단계 (memory feedback 결빙):
       1. SQL 파일 작성 — `apps/backend/drizzle/{NNNN}_{tag}.sql`
       2. journal entry append — `apps/backend/drizzle/meta/_journal.json`
       3. DB 직접 apply — `docker compose exec -T postgres psql ...`
       4. `__drizzle_migrations` tracking sync — SHA256 + INSERT ON CONFLICT DO NOTHING
     - PR 체크리스트:
       - SQL 파일 1개 추가 ✓
       - `_journal.json`에 entry 1개 append ✓
       - **snapshot 파일 변경 0건** ✓
       - `pnpm --filter backend run db:reset` 후 정상 적용 검증
     - Decision 백링크: "결정 근거 + 회피 시도 3건은 [ADR-0010](../adr/0010-drizzle-manual-sql-policy.md) 참조"
   - **§2 (라인 64~68)**: `db:push` 금지 부분 보존.
   - **§3 (라인 70~83)**: snapshot 미수정 룰 보존, "수동 SQL이 필요할 때" 절 제목/설명을 "백필 UPDATE를 마이그레이션 SQL에 포함" 패턴 강조로 정리.
   - **§4 (라인 85~93)**: SHOULD로 "drizzle-kit generate 호출 감지 → CI fail" 차원 추가, ADR-0010 §Mitigations 인용.
   - **§5 (라인 95~130)**: squash 절차 보존(레거시 fallback). 헤더 위에 "현재 정책: ADR-0010 manual SQL — squash는 단일 환경 한정 fallback" 1줄 추가.
   - **§6 (라인 132~191)**: uuid-cast 가드 절 보존(독립 운영 가이드).
   - **§7 (라인 193~203)**: 업계 표준 표 마지막 셀 "**본 문서의 squash 절차** + ADR-0010 manual SQL"로 갱신.

**검증:**
- ADR-0010 백링크 ≥ 2회
- "0057" 또는 "journal 58" 1회 이상 (현재 상태 반영)
- "반드시 drizzle-kit generate" 0건 (모순 제거)
- "manual SQL" 또는 "수동 SQL" ≥ 3회
- §6 uuid-cast 가드 보존 검증

### Phase 3 — CSP violation E2E spec 신설

**목표:** proxy.ts CSP header → backend `/api/security/csp-report` ingest wire를 e2e로 결빙.

**변경 파일:**
1. `apps/frontend/tests/e2e/security/csp-violation.spec.ts` — 신규.

**Spec 구조 (3 MUST + 1 SHOULD):**

```typescript
import { test, expect } from '@playwright/test';
import { BASE_URLS } from '../shared/constants/shared-test-data';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

const BACKEND_API = `${BASE_URLS.BACKEND}/api`;
const CSP_REPORT_PATH = API_ENDPOINTS.SECURITY.CSP_REPORT;

// chromium 단독 실행 — webkit/firefox는 CSP report-uri 처리 차이로 별도 sprint

test.describe('CSP violation wire (proxy.ts → backend ingest)', () => {
  test.use({ storageState: 'tests/e2e/.auth/lab-manager.json' });

  // TC-1: dashboard route → CSP header present + key directives
  // TC-2: Report-To header JSON points to API_ENDPOINTS.SECURITY.CSP_REPORT
  // TC-3: backend endpoint accepts both legacy & Reporting API payload (request fixture, no auth — @Public)
  // TC-4 [SHOULD]: real DOM violation triggers POST to /csp-report (best-effort + expect.poll)
});
```

**MUST cases:**
- **TC-1**: `page.goto('/equipment')` → response 헤더의 `Content-Security-Policy` 존재 + `script-src`/`default-src`/`report-uri`/`report-to` directive 포함 + `report-uri` 값이 `CSP_REPORT_PATH`로 끝나는지 검증.
- **TC-2**: 동일 페이지의 `Report-To` 헤더 JSON 파싱 → `endpoints[0].url`이 `${origin}${CSP_REPORT_PATH}` 패턴인지 검증. SSOT 회귀 차단.
- **TC-3**: `request.post(${BACKEND_API}${CSP_REPORT_PATH}, { data: { 'csp-report': { ... } } })` → 204 (legacy). 동일하게 `data: [{ type: 'csp-violation', body: { ... } }]` (Reporting API) → 204. throttle 통과 위해 두 호출 사이 지연.

**SHOULD case:**
- **TC-4**: `page.evaluate(() => { const img = document.createElement('img'); img.src = 'http://forbidden.example.invalid/x.png'; document.body.appendChild(img); })` — img-src 'self' 위배. `page.on('response')`으로 `/csp-report` POST 도착 listen + `expect.poll`로 ≥ 1건 확인. 5s timeout. flaky 시 SHOULD-skip + tech-debt 등록.

**Spec 제약:**
- 하드코딩 URL 0건 — 모든 host는 `BASE_URLS.*`, 모든 path는 `API_ENDPOINTS.*`. 단 `forbidden.example.invalid` 예외 (RFC 6761 reserved TLD, intentional violation trigger).
- `page.route` 미사용 (실제 wire 검증).
- Playwright 기본 fixture만 — `request`, `page`. 별도 helper 없음.
- timeout: 각 TC 30s 이내.

**검증:**
- spec 파일 존재 + `test()` ≥ 3건
- `BASE_URLS` + `API_ENDPOINTS.SECURITY.CSP_REPORT` 사용
- 하드코딩 URL grep 0건 (예외 1개 제외)
- `page.route` / middleware / `useFormState` 0건
- `pnpm --filter frontend exec playwright test security/csp-violation --project=chromium --workers=1` 종료 코드 0

### Phase 4 — tech-debt-tracker + archive 종결

**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — 수정.
   - 라인 56 (수동 검증): `[ ]` → `[x]`. 끝에 `완료(2026-05-09 drizzle-policy-csp-spec-closure): OBSOLETE — phase1-mobile-landing.spec.ts + phase2-scanner-ncr.spec.ts + phase3-handover.spec.ts (commits c3fa9b4d/512476cf)로 자동화. 잔여 갭(CSP wire)은 apps/frontend/tests/e2e/security/csp-violation.spec.ts로 결빙.` 추가.
   - 라인 57 (snapshot 재생성): `[ ]` → `[x]`. 끝에 `완료(2026-05-09 drizzle-policy-csp-spec-closure): WON'T-DO by design — ADR-0010 (Drizzle Manual SQL Policy) 채택. snapshot 재생성은 누적 manual SQL 손실 위험으로 금지.` 추가.
2. `.claude/exec-plans/tech-debt-tracker-archive.md` — 수정. 5월 batch 표 끝에 row 추가.

**검증:**
- 두 라인 모두 `[x]` + slug 인용
- archive batch row 5월 영역 내 위치

### Phase 5 — MEMORY.md 인덱스 등록

**변경 파일:**
1. `/home/kmjkds/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md` — "## 프로젝트 이력" 상단에 ★ entry 추가.

**검증:**
- "drizzle-policy-csp-spec-closure" 1회 이상 매칭

## 전체 변경 파일 요약

### 신규 생성

| 파일 | 목적 |
|------|------|
| `docs/adr/0010-drizzle-manual-sql-policy.md` | Drizzle 정책 결정 (ADR template 형식) |
| `apps/frontend/tests/e2e/security/csp-violation.spec.ts` | CSP header + report wire e2e 검증 |

### 수정

| 파일 | 변경 의도 |
|------|----------|
| `docs/development/DRIZZLE_MIGRATIONS.md` | 상태 절 + §1 + §3 + §4 + §7 갱신, ADR-0010 백링크 |
| `.claude/exec-plans/tech-debt-tracker.md` | 라인 56/57 종결 마크 |
| `.claude/exec-plans/tech-debt-tracker-archive.md` | 5월 batch 표에 row 추가 |
| `/home/kmjkds/.claude/.../memory/MEMORY.md` | "프로젝트 이력"에 ★ entry |

### 의도적으로 안 하는 것

- Drizzle SQL 변경 0건 / `drizzle-kit generate` 호출 0건 / snapshot 파일 변경 0건
- backend production 코드 수정 0건 (security.controller.ts 등)
- 기존 e2e spec 수정 0건 (security.spec.ts, phase1/2/3)
- proxy.ts / auth.setup.ts / playwright.config.ts 수정 0건
- ESLint custom rule (drizzle-kit generate 차단) — over-engineering 회피, ADR §Mitigations에 SHOULD로 명시

## Verification commands

```bash
# 1. tsc 정합성
pnpm tsc --noEmit

# 2. backend test (security controller 회귀 0건)
pnpm --filter backend test --testPathPattern=security

# 3. CSP spec 실행 (chromium 단독)
ls apps/frontend/tests/e2e/.auth/lab-manager.json || pnpm --filter frontend exec playwright test --project=setup
pnpm --filter frontend exec playwright test security/csp-violation --project=chromium --workers=1

# 4. Lint
pnpm --filter frontend run lint -- apps/frontend/tests/e2e/security/csp-violation.spec.ts

# 5. 하드코딩 URL grep
grep -nE "https?://[a-z0-9.-]+(:[0-9]+)?" apps/frontend/tests/e2e/security/csp-violation.spec.ts \
  | grep -vE "BASE_URLS|forbidden\.example\.invalid|^[^:]+:[^:]+:\s*(\*|//|#)"

# 6. ADR-0010 형식
grep -c "## Decision\|## Consequences\|Trigger Conditions" docs/adr/0010-drizzle-manual-sql-policy.md  # ≥ 3

# 7. DRIZZLE_MIGRATIONS.md 모순 제거
grep -c "반드시.*drizzle-kit generate" docs/development/DRIZZLE_MIGRATIONS.md  # 0건
grep -c "ADR-0010" docs/development/DRIZZLE_MIGRATIONS.md  # ≥ 2

# 8. tech-debt-tracker 마감
grep -E "^- \[x\].*수동 검증" .claude/exec-plans/tech-debt-tracker.md
grep -E "^- \[x\].*Drizzle snapshot 재생성" .claude/exec-plans/tech-debt-tracker.md

# 9. archive batch row
grep -c "drizzle-policy-csp-spec-closure" .claude/exec-plans/tech-debt-tracker-archive.md  # ≥ 1

# 10. MEMORY.md 인덱스
grep -c "drizzle-policy-csp-spec-closure" /home/kmjkds/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md  # ≥ 1

# 11. CSP backend smoke (backend dev 실행 중일 때만)
curl -sf -X POST -H "Content-Type: application/csp-report" \
  -d '{"csp-report":{"document-uri":"http://localhost:3000/test","violated-directive":"img-src","blocked-uri":"http://forbidden.example.invalid/"}}' \
  http://localhost:3001/api/security/csp-report -o /dev/null -w "%{http_code}\n"  # 204
```

## Senior self-audit (pre-plan)

| 점검 항목 | 상태 |
|----------|------|
| SSOT — CSP_REPORT 경로 단일 소스 | ✅ Phase 3 spec에서 `API_ENDPOINTS.SECURITY.CSP_REPORT`만 사용 |
| SSOT — Drizzle 정책 단일 소스 | ✅ ADR-0010 = 결정, DRIZZLE_MIGRATIONS.md = 절차 |
| 하드코딩 — 0건 보장 | ✅ Phase 3 grep 검증 + RFC 6761 reserved TLD 예외 |
| Workflow 재사용 — auth.setup.ts | ✅ Phase 3 lab-manager.json 재사용. 새 fixture 0건 |
| 성능 — CSP spec 30s 이내 | ✅ TC-1/2/3 < 5s, TC-4 ≤ 5s timeout |
| 보안 — CSP report endpoint @Public 보존 | ✅ backend 변경 0건 |
| Old API 회귀 — middleware/page-router | ✅ Phase 3 grep 검증 |
| Stale-fact — DRIZZLE_MIGRATIONS.md 전체 read | ✅ Pre-plan 203 라인 전체 read |
| Memory awareness — drizzle interactive prompt | ✅ ADR-0010 Decision이 4-step + 회피 시도 3건 인용 |
| L0 inferred — 변경 없는 인접 파일 | ✅ security.spec.ts / phase1-3 / proxy.ts 모두 Out of scope |
| 관측성 — backend Logger.warn + DB INSERT | ✅ 기존 wire 검증, spec은 wire-level |
| 테스트 매트릭스 | ✅ 3 MUST + 1 SHOULD |
| 롤백 전략 | ✅ ADR additive / doc git revert / spec 삭제만으로 회귀 |
| Pre-commit audit (7항목) | SSOT ✅ / 하드코딩 0 ✅ / eslint-disable 0 ✅ / 워크플로 재사용 ✅ |

## 의사결정 로그

1. **ADR vs Doc-only**: doc 갱신만으로 충분한가? → No. ADR-0007/0008 패턴 답습 — load-bearing 운영 결정은 발견 가능한 ADR 필수.
2. **CSP spec 분리 vs 통합**: 새 폴더 `security/`. 기존 `security.spec.ts` 단일 책임 보존.
3. **인증 모델**: proxy.ts 분석 결과 CSP 헤더는 success path만 → storageState (lab_manager) 필수.
4. **TC-4 MUST vs SHOULD**: SHOULD. 브라우저별 directive 차이 + backend INSERT 비동기 → flaky 가능.
5. **snapshot 재생성 진짜 WON'T-DO?**: ADR-0010 Trigger Conditions에 정량 임계값 명시. 현재 시점은 WON'T-DO.
6. **ESLint custom rule**: 본 sprint 미포함. SHOULD로 ADR Mitigations에 명시.

## Out of scope

- 실제 Drizzle SQL 추가/수정/삭제
- `drizzle-kit generate` 또는 `db:push` 실행
- snapshot 파일 생성/삭제/수정
- `apps/backend/src/modules/security/` production 코드 수정
- 기존 `security.spec.ts` / phase1-3 / proxy.ts / auth.setup.ts / playwright.config.ts 수정
- ADR-0001~0009 수정
- `.husky/pre-push` 수정

## 종료 조건

- **MUST 1-15** 전체 PASS → `active/` → `completed/` 이동
- **SHOULD 16-20** 일부 FAIL → tech-debt-tracker 1건씩 등록 후 통과
- TC-4 flaky 시 SHOULD-skip + tech-debt 후속 등록
