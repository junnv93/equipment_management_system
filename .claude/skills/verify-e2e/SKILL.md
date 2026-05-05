---
name: verify-e2e
description: Verifies E2E test code compliance AND architectural coverage — auth fixture usage, locator patterns, SSOT constants, test isolation, plus architecture-level checks (CAS VERSION_CONFLICT scenarios, cache invalidation after mutation, site access control on mutations). Run after adding/modifying E2E test specs.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 spec 파일명 또는 feature 디렉토리]'
---

# E2E 테스트 패턴 검증

## Purpose

Playwright E2E 테스트 코드가 프로젝트 규칙을 올바르게 준수하는지 검증합니다:

1. **Auth Fixture 사용** — storageState 기반 fixture, `loginAs()` 금지
2. **networkidle / waitForTimeout 금지** — Next.js HMR 차단 방지
3. **Locator 패턴** — `getByRole` 우선, raw CSS selector 지양
4. **SSOT 상수** — UUID 하드코딩 금지, `shared-test-data.ts` 사용
5. **테스트 격리** — 상태 변경 테스트에 `mode: 'serial'`
6. **아키텍처 커버리지** — CAS 충돌, 캐시 일관성, 사이트 접근 제어 검증

## When to Run

- E2E 테스트를 새로 작성하거나 수정한 후
- PR 전 E2E 코드 점검 시

## Related Files

| File | Purpose |
|------|---------|
| `apps/frontend/tests/e2e/shared/fixtures/auth.fixture.ts` | storageState 기반 인증 fixture |
| `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts` | 테스트 데이터 SSOT |
| `apps/frontend/tests/e2e/shared/helpers/api-helpers.ts` | 토큰 캐싱, 캐시 클리어 헬퍼 |
| `apps/backend/src/database/utils/uuid-constants.ts` | 백엔드 UUID 상수 SSOT |
| `apps/frontend/tests/e2e/a11y/login.a11y.spec.ts` | 공개 라우트 접근성 게이트 (auth 불필요) |
| `apps/frontend/tests/e2e/shared/utils/quality-audit-routes.ts` | quality audit route registry 로더 |
| `apps/frontend/playwright.a11y.config.ts` | 공개 a11y 전용 Playwright 설정 (globalSetup 없음) |
| `docs/operations/quality-audit-routes.json` | Lighthouse/a11y 감사 대상 라우트 SSOT |

## Workflow

각 Step의 bash 명령어, 코드 예시: [references/step-details.md](references/step-details.md) 참조

### Step 1: Auth Fixture 사용

**PASS:** spec에서 `loginAs()`/`signIn()` 0건, `/login` 직접 접근 0건.

### Step 2: Import 소스

**PASS:** 예외 파일 외 `@playwright/test` 직접 import 0건. 모두 `auth.fixture` import.

### Step 3: networkidle 금지

**PASS:** `networkidle` 사용 0건. `domcontentloaded` + 요소 대기 사용.

### Step 4: waitForTimeout 금지

**PASS:** `waitForTimeout` 0건. **WARN:** 헬퍼의 짧은 대기는 경고 수준.

상세: [references/locator-patterns.md](references/locator-patterns.md#step-4-waitfortimeout-금지--event-based-wait-패턴-2026-04-27-추가)

### Step 5: Locator 안티패턴

**PASS:** `locator('[role=]')` 0건(예외 허용 목록 제외), `waitForFunction` 0건, **Tailwind utility class selector 0건**.

ARIA 역할 locator 허용 예외 및 탐지 명령 상세: [references/locator-patterns.md](references/locator-patterns.md#step-5-locator-안티패턴)

### Step 5a: actionability 우회 안티패턴 (35차 추가)

`click({ force: true })` / `.first()` 우회는 sticky overlay/aria-live 중복 같은 **실제 UX/접근성 결함을 가립니다**. 회피책 대신 SSOT 헬퍼로 교정하고 spec에서는 헬퍼만 호출.

**현재 SSOT 헬퍼:**

- `apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts` — `safeClick` / sticky-aware scroll utilities
- `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` — useToast 중복 발화 우회

**탐지:**

```bash
grep -rn "force:\s*true" apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -v "position:"
grep -rn "getByText.*\.first()\|getByRole.*status.*\.first()" \
  apps/frontend/tests/e2e --include="*.spec.ts"
```

**PASS:** spec 파일에서 0건 (헬퍼 내부 + position 좌표 클릭 면제).

### Step 5b: Export 양식 Cross-spec Pairing (38차 form-level 승격)

양식(form) 단위로 API + UI 한 쌍이 존재하는가를 검증. 양식 식별자 = `UL-QP-18-NN`.

| API cover | UI cover | 결과 |
| --------- | -------- | ---- |
| ≥1        | ≥1       | PASS |
| ≥1        | 0        | **WARN** — backend-only |
| 0         | ≥1       | INFO — UI-only |
| 0         | 0        | skip |

**탐지 스크립트:**

```bash
SPECS_DIR="apps/frontend/tests/e2e/workflows"
FORM_IDS=$(grep -hoE 'UL-QP-18-[0-9]{2}' "$SPECS_DIR"/*.spec.ts 2>/dev/null | sort -u)
for id in $FORM_IDS; do
  files=$(grep -l "$id" "$SPECS_DIR"/*.spec.ts 2>/dev/null)
  api=0; ui=0
  for f in $files; do
    grep -q "page\.request" "$f" && api=$((api+1))
    grep -qE "suggestedFilename\(\).*toMatch.*$id|filenamePattern.*$id" "$f" \
      && ui=$((ui+1))
  done
  if [ $api -gt 0 ] && [ $ui -eq 0 ]; then
    echo "WARN: $id — API-only ($api spec), no UI download pairing"
  fi
done
```

**PASS 기준:** WARN 출력 0건. 현재 baseline (38차): PASS = UL-QP-18-01/-07/-08/-09, WARN = UL-QP-18-03/-05/-06/-10.

### Step 6: UUID 하드코딩

**PASS:** spec에 UUID 리터럴 0건. `shared-test-data.ts` 또는 constants에서 import.

### Step 7: 상태 변경 테스트 격리

**PASS:** 순서 의존적 상태 변경 테스트에 `mode: 'serial'` 설정.

### Step 8: Backend 캐시 클리어

**PASS:** DB 직접 수정 파일 모두 `clearBackendCache()` 호출.

### Step 9: Backend 토큰 직접 호출

**PASS:** `api-helpers.ts` 외 `test-login` 직접 호출 0건.

### Step 10: Backend URL 하드코딩

`tests/e2e/scripts/` 유틸리티 스크립트도 검사 범위에 포함.

```bash
grep -rn "localhost:3001\|localhost:3000" \
  apps/frontend/tests/e2e \
  --include="*.ts" --include="*.spec.ts" \
  | grep -v "shared-test-data\|process\.env\|// "
```

**PASS:** 0건. `BASE_URLS.BACKEND` 또는 `process.env.NEXT_PUBLIC_API_URL` 폴백 경유.

### Step 11b: TEST_USERS_BY_TEAM SSOT

**PASS:** `shared-test-data.ts`가 `@equipment-management/shared-constants`에서 import.

### Step 11: Pool 정리

**PASS:** Pool 생성 파일 모두 cleanup 함수 export.

### Step 12: 아키텍처 시나리오 커버리지

- **12a:** CAS 뮤테이션 있는 feature에 VERSION_CONFLICT 테스트 존재
- **12b:** 뮤테이션 후 목록 갱신 검증 50% 이상
- **12c:** 사이트 격리 테스트가 GET + mutation 모두 검증

### Step 13: global-setup 시드 실패 fail-fast

시드/검증 실패는 **throw** 로 글로벌 설정을 중단해야 한다.

```bash
grep -nA3 "시드 데이터 로딩\|seed.*load" apps/frontend/tests/e2e/global-setup.ts \
  | grep -B1 "console\.warn" && echo "❌ seed 실패가 warn-and-continue 로 흡수됨"
```

**PASS:** `} catch { throw ... }` 또는 `throw err`. **FAIL:** `} catch { console.warn(...) }` 후 진행.

### Step 14: 장비 파티셔닝 (E2E 장비 격리)

상태를 mutate하는 checkout E2E suite(S23-S27 등)는 전용 장비를 사용해야 한다.

```bash
grep -n "TEST_EQUIPMENT_IDS\." apps/frontend/tests/e2e/features/checkouts/suite-2[3-7]-*/*.spec.ts \
  | grep -v "RBAC_\|CANCEL_\|CAS_\|SHARED_\|RECEIVER_UIW\|SPECTRUM_ANALYZER.*NON_SHARED" \
  && echo "❌ S23-S27이 공용 장비를 primary로 사용 중"
```

**PASS:** S23-S27의 primary 장비가 전용 상수(`RBAC_SIGNAL_GEN_SUW_E`, `CANCEL_RECEIVER_SUW_E`, `CAS_ANALYZER_SUW_E`, `SHARED_ANALYZER_SUW_E`).

### Step 15: Backend Jest/supertest E2E 헬퍼 패턴 (2026-04-18 추가)

**15a: loginAs() SSOT — DEFAULT_ROLE_EMAILS 경유**

```bash
grep -n "DEFAULT_ROLE_EMAILS" apps/backend/test/helpers/test-auth.ts
grep -rn "admin@example\.com\|manager@example\.com\|user@example\.com" \
  apps/backend/test/*.e2e-spec.ts | grep -v auth.e2e-spec.ts
```

**PASS:** `loginAs()` 가 `/auth/test-login?role=<role>` 엔드포인트 경유 + `DEFAULT_ROLE_EMAILS` SSOT 사용.

**15b: TEST_USER_IDS 프로덕션 UUID 정합**

```bash
grep -n "uuid-constants\|USER_LAB_MANAGER\|USER_TECHNICAL_MANAGER\|USER_TEST_ENGINEER" \
  apps/backend/test/helpers/test-auth.ts
```

**PASS:** `TEST_USER_IDS`가 `uuid-constants.ts`의 production UUID 상수 경유 (e2e00000-... 형태 금지).

**15c: jest-e2e.json maxWorkers:1 필수**

```bash
grep "maxWorkers" apps/backend/test/jest-e2e.json
# → "maxWorkers": 1
```

**PASS:** `"maxWorkers": 1`. **FAIL:** 없거나 1 초과.

**15d: API_ENDPOINTS 직접 사용 SSOT (2026-04-21 업데이트)**

```bash
grep -rn "\.\(get\|post\|patch\|delete\|put\)(['\`]/api/" \
  apps/backend/test --include="*.e2e-spec.ts"
grep -rn "toTestPath\|test-paths" apps/backend/test
```

**PASS:** 두 명령어 모두 0건.

### Step 16: E2E data-* 셀렉터 × 컴포넌트 attribute 일관성

상세 탐지 명령 및 현재 baseline: [references/locator-patterns.md](references/locator-patterns.md#step-16-e2e-data--셀렉터--컴포넌트-attribute-일관성-2026-04-19-추가)

**PASS:** spec의 `[data-xxx]` 셀렉터가 컴포넌트에 attribute로 실재함.
**FAIL:** spec이 존재하지 않는 attribute를 참조 → false negative.

### Step 17: 브라우저 기반 Feature Flag 감지 패턴

`process.env.NEXT_PUBLIC_*` 직접 조건 분기 금지. `beforeAll` DOM 검사 패턴 사용.

상세 패턴 및 탐지 명령: [references/locator-patterns.md](references/locator-patterns.md#step-17-브라우저-기반-feature-flag-감지-패턴-2026-04-22-추가)

**PASS:** `NEXT_PUBLIC_*` env 직접 조건 분기 0건, `browser.newContext` 호출 시 `baseURL` 포함.

### Step 18: page.route() API 모킹 패턴

상세 패턴(18a 스키마 SSOT, 18b unroute 정리, 18c networkidle 금지): [references/locator-patterns.md](references/locator-patterns.md#step-18-pageroute-api-모킹-패턴-2026-04-24-추가)

**PASS:** 모킹 응답 `{ currentPage, pageSize, total, totalPages }` 형태, workflows/ spec에서 unroute 정리.

### Step 19: suite-ux 패턴 — localStorage·emulateMedia·모바일 viewport

상세 패턴(19a localStorage, 19b reducedMotion, 19c 모바일 viewport): [references/locator-patterns.md](references/locator-patterns.md#step-19-suite-ux-패턴--localstorage-조작emulatemedia모바일-viewport-2026-04-24-추가)

**PASS:** suite-ux 3파일 존재, localStorage 접근이 `page.evaluate()` 경유, `aria-modal="true"` 검증 포함.

### Step 20: email 기반 멀티롤 token 주입 + negative 시나리오 assertion

상세 패턴(20a tokenCache 격리, 20b negative assertion, 20c storageState 수): [references/auth-fixtures.md](references/auth-fixtures.md#step-20-email-기반-멀티롤-token-주입--negative-시나리오-assertion)

**PASS:** `email:${email}` 네임스페이스 격리, negative spec에서 status + errorCode 쌍 검증.

### Step 20d: apiGetWithToken / apiPatchWithToken role vs token 헬퍼 분리

상세 탐지 명령: [references/auth-fixtures.md](references/auth-fixtures.md#step-20d-apigetwithtoken--apipatchwithtokenrole-vs-token-헬퍼-분리)

**PASS:** `apiGetWithToken(token, url)` — 첫 인자가 token string. **FAIL:** role 문자열을 첫 인자로 전달.

### Step 20e: 로그인 폼 자격증명 DEV_*_PASSWORD 환경변수 + fallback SSOT

상세 패턴 및 탐지 명령: [references/auth-fixtures.md](references/auth-fixtures.md#step-20e-로그인-폼-e2e-자격증명--dev_password-환경변수--fallback-ssot)

**PASS:** `process.env.DEV_*_PASSWORD ?? 'fallback'` 패턴. **FAIL:** 비밀번호 리터럴 직접 사용.

### Step 21: test.use() describe 스코프 위반 탐지 (2026-04-30 추가)

`test()` 콜백 내부의 `test.use()`는 Playwright에서 **silently ignored** — 에러도 경고도 없이 잘못된 인증 상태로 실행.

상세 패턴 및 Node.js 구조적 탐지 스크립트: [references/auth-fixtures.md](references/auth-fixtures.md#step-21-testuse-describe-스코프-위반-탐지-2026-04-30-추가)

**PASS:** `PASS: all test.use() at describe() scope`. **FAIL:** 위반 파일:라인 목록 출력.

### Step 22: goto/reload 후 networkidle + 조건 기반 wait 중복

조건 기반 wait가 이어진다면 그 사이의 `waitForLoadState('networkidle')` 은 중복.

상세 패턴 및 탐지 명령: [references/locator-patterns.md](references/locator-patterns.md#step-22-gotoreload-후-waitforloadstatenetworkidle--조건-기반-wait-중복-탐지-2026-04-30-추가)

**PASS:** 0건. **WARN:** 검토 권장.

### Step 23: TestRole 4-place SSOT 정합성 (2026-05-01 추가)

> 1차 검증: `pnpm --filter backend run verify:e2e-actors` (R3 룰, pre-push 자동 실행)

`TestRole` 추가 시 CANONICAL_ROLE / TEST_USERS / TEST_USER_IDS / TEST_USER_DETAILS 4곳 동시 갱신 필수.

상세 SSOT 구조 및 탐지 명령: [references/auth-fixtures.md](references/auth-fixtures.md#step-23-testrole-4-place-ssot-정합성-2026-05-01-추가)

**PASS:** 4곳 매핑 entry 수 일치. **FAIL:** compile 에러 또는 TEST_USER_DETAILS silent omission.

### Step 24: Fixture 권한 격리 패턴 (2026-05-01 추가)

> 1차 검증: `pnpm --filter backend run verify:e2e-actors` (R2 룰)

`createTestEquipment` 등 fixture 헬퍼는 자체 `loginAs(app, 'systemAdmin')` 발급 필수.

상세 패턴 및 탐지 명령: [references/auth-fixtures.md](references/auth-fixtures.md#step-24-fixture-권한-격리-패턴-2026-05-01-추가)

**PASS:** fixture가 자체 setup token 발급. **WARN:** 호출부 token 의존.

### Step 25: e2e spec actor token 적절성 (2026-05-01 추가)

> 1차 검증: `pnpm --filter backend run verify:e2e-actors` (R1 룰, pre-push 자동 실행)

도메인 권한·scope 검증 spec은 `'systemAdmin'` 대신 의도된 도메인 역할 사용.

상세 패턴 및 token 매핑 가이드: [references/auth-fixtures.md](references/auth-fixtures.md#step-25-e2e-spec-actor-token-적절성--domain-permission-spec은-system_admin-사용-금지-2026-05-01-추가)

**PASS:** permission/scope/role-constraint spec에서 systemAdmin actor 0건.

### Step 26: 도메인 e2e helper SSOT 분리 + value-based selector (2026-05-02 추가)

상세 패턴(26a domain helper 분리, 26b value-based selector, 26c DB 직접 검증, 26d rewrite, 26e 양면 페어링): [references/locator-patterns.md](references/locator-patterns.md#step-26-도메인-e2e-helper-ssot-분리--value-based-selector-2026-05-02-추가)

**PASS:** `input[value=""]` brittle selector 0건, workflow-helpers.ts < 1500 lines.

### Step 27: 공개 a11y 감사 라우트 SSOT + config 경계 (2026-05-03 추가)

상세 탐지 명령: [references/locator-patterns.md](references/locator-patterns.md#step-27-공개-a11y-감사-라우트-ssot--config-경계-2026-05-03-추가)

**PASS:** 공개 a11y config가 `login.a11y.spec.ts`만 수집하고, spec/workflow가 `quality-audit-routes.json` SSOT 경유.

### Step 28: 워크플로우 커버리지 (verify-workflows 통합 — 2026-05-03)

`docs/workflows/critical-workflows.md`에 정의된 크리티컬 워크플로우(WF-01~WF-35 + WF-AP 시리즈)가 E2E 테스트로 올바르게 커버되는지 검증한다.

**핵심 invariant 7가지:**

1. **커버리지** — P0 (WF-03/10/11) 100% + P1 일부 + WF-AP 시리즈
2. **단계 완전성** — 워크플로우 문서 step ≥ test 'Step N'
3. **역할 정확성** — TE/TM/QM/LM ↔ testOperatorPage/techManagerPage/qualityManagerPage/siteAdminPage
4. **상태 전이 assertion** — `expectEquipmentStatus` 또는 유사
5. **부수 효과 검증** — 교정일 갱신, NC 자동 CORRECTED, 수리이력 연결
6. **serial 모드** — 워크플로우 테스트는 `mode: 'serial'` 필수
7. **DB 리셋 + 캐시 클리어** — `beforeAll`/`afterAll` + `resetEquipmentForWorkflow`/`cleanupSharedPool`

**진입 명령어:**

```bash
for wf in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16; do
  ls apps/frontend/tests/e2e/workflows/wf-${wf}-*.spec.ts 2>/dev/null
done
ls apps/frontend/tests/e2e/workflows/wf-ap*.spec.ts 2>/dev/null
grep -L "mode.*serial" apps/frontend/tests/e2e/workflows/*.spec.ts
```

**상세 체크리스트:** [references/workflows-coverage.md](references/workflows-coverage.md)

**PASS:** P0 워크플로우(WF-03/10/11) 모두 spec 존재 + 문서 step 90% 이상 커버 + serial 모드 + role fixture 정합.

### Step 29: Bulk-action spec — mock wiring + 실제 backend integration EXT 분리 (2026-05-06 추가)

`page.route()` mock 응답으로 frontend wiring(toast/AlertDialog/selection clear 등)을 검증한 spec은 **반드시 별도 `EXT` describe 블록에서 실제 backend integration도 검증**한다. mock-only는 backend FSM/scope/CAS 회귀를 놓치는 위험이 있다.

**Canonical reference**: `wf-ap02-approvals-bulk-reject.spec.ts` (mock Steps 8-9 + EXT Steps EXT-1~EXT-3), `tests/e2e/checkouts/outbound-bulk-action.spec.ts` (mock Step 4 + EXT Steps EXT-1~EXT-2).

✅ **Required pattern**:
```ts
test.describe('<feature> — mock wiring 검증', () => {
  test('Step N: mock 응답으로 toast/AlertDialog/selection clear 검증', async ({ page }) => {
    await page.route('**/api/<bulk-endpoint>', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ approved: [...], failed: [] }) });
    });
    try { /* ... */ } finally { await page.unroute('**/api/<bulk-endpoint>'); }
  });
});

test.describe('<feature> EXT — 실제 backend 통합', () => {
  test.describe.configure({ mode: 'serial' });
  // EXT_EQUIPMENT_IDS는 base block의 WF_EQUIPMENT_IDS와 비충돌
  const EXT_EQUIPMENT_IDS = [/* WF와 다른 ID들 */];

  test('Step EXT-1: 데이터 생성', async ({ testOperatorPage }) => { /* createCheckout */ });
  test('Step EXT-2: 실제 backend bulk-* → toast → DB 상태 전이 검증', async ({ techManagerPage }) => {
    // page.route mock 없음 — Promise.allSettled fail-close + scope guard 실제 동작
  });
});
```

❌ 안티패턴:
- bulk-action spec이 `page.route()` mock만 사용 — backend FSM/CAS 회귀 미검출
- EXT 블록 ID가 base block과 충돌 — 직렬 실행 시 상호 간섭
- EXT 블록 `serial` 모드 누락 — 데이터 생성/검증 순서 보장 실패
- 폴링 대신 `waitForTimeout` 사용 (Step 4 위반) — 본 SKILL Step 4가 우선

**탐지 명령**:
```bash
# bulk endpoint mock 사용 spec
SPECS=$(grep -rln "page.route.*api/.*bulk-" apps/frontend/tests/e2e --include="*.spec.ts" 2>/dev/null)

# 각 spec이 EXT 블록 (실제 backend integration) 을 가지고 있는지
for f in $SPECS; do
  if ! grep -q "describe.*EXT\|EXT_EQUIPMENT_IDS\|EXT-1\|EXT-2" "$f"; then
    echo "MISSING EXT block: $f"
  fi
done
# 기대: MISSING 0건
```

**PASS**: bulk endpoint mock 사용 spec 모두 EXT block 보유 + EXT_EQUIPMENT_IDS 비충돌 + EXT serial 모드.

## Output Format

```markdown
| #   | 검사                             | 상태      | 상세                                                           |
| --- | -------------------------------- | --------- | -------------------------------------------------------------- |
| 1   | Auth Fixture 사용                | PASS/FAIL | loginAs/직접 로그인 위치                                       |
| 2   | Import 소스                      | PASS/FAIL | @playwright/test 직접 import                                   |
| 3   | networkidle 금지                 | PASS/FAIL | networkidle 사용 위치                                          |
| 4   | waitForTimeout 금지              | PASS/WARN | waitForTimeout 사용 위치                                       |
| 5   | Locator 안티패턴                 | PASS/FAIL | CSS role selector 등                                           |
| 6   | UUID 하드코딩                    | PASS/FAIL | spec 파일 내 UUID 리터럴                                       |
| 7   | 상태 변경 테스트 격리            | PASS/WARN | serial 모드 미설정                                             |
| 8   | Backend 캐시 클리어              | PASS/FAIL | DB 수정 후 캐시 클리어 누락                                    |
| 9   | Backend 토큰 직접 호출           | PASS/FAIL | test-login 직접 호출                                           |
| 10  | Backend URL 하드코딩             | PASS/FAIL | localhost URL 직접 사용                                        |
| 11b | TEST_USERS_BY_TEAM SSOT          | PASS/FAIL | shared-test-data.ts import                                     |
| 11  | Pool 정리                        | PASS/FAIL | cleanup 함수 미제공                                            |
| 12a | CAS 충돌 복구 테스트             | PASS/WARN | VERSION_CONFLICT 시나리오                                      |
| 12b | 캐시 일관성 테스트               | PASS/INFO | 뮤테이션 후 목록 갱신 검증                                     |
| 12c | 사이트 접근 제어 범위            | PASS/WARN | GET + mutation 모두 검증                                       |
| 13  | global-setup fail-fast           | PASS/FAIL | 시드 실패가 warn-and-continue                                  |
| 14  | 장비 파티셔닝                    | PASS/FAIL | S23-S27 공용 장비 사용                                         |
| 15a | Backend loginAs SSOT             | PASS/FAIL | hardcoded credential 탐지                                      |
| 15b | TEST_USER_IDS UUID 정합          | PASS/FAIL | e2e UUID 사용 탐지                                             |
| 15c | jest-e2e.json maxWorkers         | PASS/FAIL | maxWorkers != 1                                                |
| 15d | API_ENDPOINTS SSOT (E2E)         | PASS/FAIL | 하드코딩 경로 리터럴 또는 toTestPath 재도입                    |
| 16a | data-* 셀렉터 일관성             | PASS/FAIL | spec 셀렉터 vs 컴포넌트 attribute 불일치                       |
| 16c | toHaveAttribute 기반 상태 검증   | PASS/FAIL | data-guidance-key 등 FSM 상태 attribute 실재 여부              |
| 17  | 브라우저 기반 feature flag 감지  | PASS/FAIL | process.env.NEXT_PUBLIC_* 직접 분기 또는 newContext baseURL 누락 |
| 17b | beforeAll newContext try/finally  | PASS/FAIL | browser.newContext() 후 finally 없는 context.close()           |
| 18a | page.route() 응답 스키마 SSOT    | PASS/FAIL | pagination page: 금지, currentPage: 필수                       |
| 18b | page.unroute() 정리              | PASS/FAIL | route 후 unroute 누락                                          |
| 18c | route 후 networkidle 금지        | PASS/FAIL | page.route() 파일에 networkidle 잔존                           |
| 19a | suite-ux localStorage 조작 패턴  | PASS/FAIL | page.evaluate() 외부 localStorage 직접 접근                    |
| 19b | emulateMedia reducedMotion 패턴  | PASS/INFO | reduced-motion 시나리오 누락                                   |
| 19c | 모바일 viewport + aria-modal 검증 | PASS/FAIL | Drawer aria-modal="true" 검증 누락                             |
| 20e | 로그인 폼 자격증명 SSOT          | PASS/FAIL | fill('user123') 등 하드코딩 리터럴                             |
| 22  | networkidle + 조건 기반 wait 중복 | PASS/WARN | reload 후 networkidle + waitForFunction 조합                   |
```

## Exceptions

1. **`auth.setup.ts`** — setup project이므로 모든 제한 면제
2. **헬퍼/constants 파일의 UUID 정의** — SSOT 역할
3. **`shared-test-data.ts`의 URL 상수** — `process.env` 폴백 정상
4. **`Promise.race` 내 `waitForTimeout`** — 타임아웃 폴백 용도 정당
5. **`emptyState.or(dataList)`** — 목록/빈 상태 분기 대기 정상
6. **`api-helpers.ts`의 `test-login` 참조** — SSOT 헬퍼 내부
7. **단일 테스트 describe에 serial 미설정** — 순서 의존성 없으면 불필요
8. **global-setup/teardown** — 글로벌 파일, localhost 폴백 정상
9. **auth.spec.ts, auth-token-sync.spec.ts** — 로그인 플로우 테스트
10. **auth-role-access.spec.ts Group 1 (1.1~1.3)** — 로그인 폼 UI 자체를 테스트하므로 `baseTest` + 실제 로그인 폼 접근이 정당. 단, 자격증명은 반드시 `DEV_*_PASSWORD` 환경변수 + fallback 상수를 경유해야 한다. 비인증 리다이렉트 검증(Group 7)도 포함.
11. **security.spec.ts** — API 보안 테스트
12. **calibration/overdue-auto-nc/** — API 전용 테스트
13. **seed 파일** — 시드 스크립트
14. **복합 CSS 셀렉터** — `getByRole`로 대체 불가한 경우 허용
15. **네거티브 네비게이션/토스트 assertion용 짧은 `waitForTimeout`** — `≤ 1000ms` + 직후 `toHaveURL` / `toHaveCount(0)` 쌍 패턴은 정당.
16. **`getByPlaceholder`** — Playwright user-facing semantic locator 패밀리. shadcn `<Label>`이 `htmlFor` 바인딩 없이 사용된 폼에서 허용.
17. **`tests/e2e/a11y/*.a11y.spec.ts`** — 공개 라우트 접근성 게이트. `auth.fixture` 대신 `@playwright/test` 직접 import 정당. `playwright.a11y.config.ts` 전용 설정 사용.
