# Locator Patterns & Browser Interaction — verify-e2e references

> 2026-05-03 verify-e2e 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.

---

## Step 4: waitForTimeout 금지 — Event-based wait 패턴 (2026-04-27 추가)

**PASS:** `waitForTimeout` 0건. **WARN:** 헬퍼의 짧은 대기는 경고 수준.

`waitForTimeout`은 DOM 상태 변화와 무관한 고정 sleep이므로 flaky 위험이 있다. 대신 Playwright의 retry-until 기반 어서션을 사용한다:

```typescript
// ❌ WRONG — 고정 sleep
await page.waitForTimeout(2000);

// ✅ 모달 닫힘 대기
await expect(modal).not.toBeVisible({ timeout: 10000 });

// ✅ 행 제거 대기 (승인/반려 후 목록에서 사라짐)
await rows.first().waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

// ✅ 카운트 변화 대기
await expect(rows).not.toHaveCount(initialCount, { timeout: 5000 });
```

`waitFor({state:'detached'})` + `.catch(() => {})` 패턴: 조건부 플로우(if 블록 내)에서 액션이 실행될 수도 있고 안 될 수도 있을 때 — catch는 "실행 안 됨"을 정상 경로로 허용.

**예외:** 네거티브 네비게이션/토스트 assertion용 짧은 `waitForTimeout` — "클릭 후 아무 일도 일어나지 않음"을 증명하려면 일정 시간 대기가 불가피. `≤ 1000ms` 이내의 `waitForTimeout` + 직후 `toHaveURL` / `toHaveCount(0)` 쌍 패턴은 정당.

---

## Step 5: Locator 안티패턴

**PASS:** `locator('[role=]')` 0건(예외 허용 목록 제외), `waitForFunction` 0건, **Tailwind utility class selector 0건**.

### ARIA 역할 locator 허용 예외 (2026-04-27 추가)

`[role="X"]` CSS selector는 일반적으로 안티패턴이나, **ARIA 역할 속성 자체를 검증하는 목적**에서는 허용한다. 해당 역할이 올바르게 설정되어 있는지가 테스트 의도일 때 `getByRole()`로 대체하면 검증이 사라진다.

허용 목록:
- `[role="progressbar"]` — ARIA progressbar 균일 렌더 + aria-valuenow/valuemax 속성 검증
- `[role="dialog"]` — 모달 열림/닫힘 상태 검증
- `[role="toolbar"]` — BulkActionBar 같은 toolbar 역할 검증
- `[role="checkbox"]` — 체크박스 역할 + 선택 상태 연동 검증
- `[role="menuitem"]` — 드롭다운 메뉴 아이템 역할 검증

```typescript
// ✅ ARIA 역할 검증 목적 — 허용
const stepper = row.locator('[role="progressbar"]');
await expect(stepper).toHaveAttribute('aria-valuemax', '1');

// ✅ dialog 열림 상태 검증 — 허용
const modal = page.locator('[role="dialog"]');
await expect(modal).toBeVisible();

// ❌ 일반 레이아웃 요소에 role selector 사용 — 금지 (getByRole 대체)
const nav = page.locator('[role="navigation"]');  // → page.getByRole('navigation')
```

### Tailwind utility class selector 금지 (33차 추가)

스켈레톤/로딩 상태 대기를 위해 `locator('.h-8.w-14')` 같은 Tailwind utility class literal을 쓰면
Tailwind 리팩토링 시 무음 브레이크. 스켈레톤 컴포넌트에 `data-testid` 부여 후 `getByTestId` 사용.

탐지:
```bash
grep -rn "\.locator('\\.\\(h\\|w\\|p\\|m\\|bg\\|text\\|flex\\|grid\\)-" apps/frontend/tests/e2e \
  --include="*.ts" --include="*.spec.ts"
```
→ 0 hit 이어야 함.

**기존 hit (33차 현재):**
- `apps/frontend/tests/e2e/workflows/wf-33-approval-count-realtime.spec.ts` (KPI 스켈레톤 `.h-8.w-14`)
- `apps/frontend/tests/e2e/features/approvals/comprehensive/09-actual-approve-reject.spec.ts` (동일)

→ `ApprovalKpi` 컴포넌트에 `data-testid="kpi-pending-skeleton"` 부여 + 일괄 전환 필요 (별도 harness 프롬프트 등재됨).

---

## Step 16: E2E data-* 셀렉터 × 컴포넌트 attribute 일관성 (2026-04-19 추가)

E2E spec이 `[data-xxx]` 커스텀 attribute 셀렉터를 사용할 때, 해당 컴포넌트 구현에
동일 attribute가 실제로 부착되어 있는지 확인.

### 16a: data-timeline-card 셀렉터 일관성

```bash
# E2E spec에서 [data-timeline-card] 셀렉터를 사용하는지 확인
grep -rn "data-timeline-card" \
  apps/frontend/tests/e2e --include="*.spec.ts"

# 컴포넌트에서 실제 attribute가 부착되어 있는지 확인 (동일 개수 이상이어야 함)
grep -rn "data-timeline-card" \
  apps/frontend/components --include="*.tsx"
# 결과: 1건 이상 (spec 사용 수 ≤ 컴포넌트 정의 수)
```

### 16b: 신규 data-* 셀렉터 드리프트 탐지

```bash
# E2E spec에서 사용하는 모든 data-* 셀렉터 목록 추출
grep -rn '\[data-[a-z]' \
  apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -oE 'data-[a-z-]+' | sort -u

# 각 셀렉터가 컴포넌트/레이아웃 파일에 존재하는지 수동 확인
# (자동화 불가 — 셀렉터마다 별도 grep 필요)
```

**PASS:** spec의 `[data-xxx]` 셀렉터가 컴포넌트에 attribute로 실재함.
**FAIL:** spec이 존재하지 않는 attribute를 참조 → 셀렉터가 항상 0 match → 결과가 false negative.

**현재 baseline (2026-04-27):**
- `data-widget` — `DashboardRow4.tsx:` `data-widget={widget}` 부착. `auth-role-access.spec.ts`에서 `[data-widget="systemHealth"]` 등 사용.
- `data-timeline-card` — `CheckoutTimeline.tsx` 부착. E2E 워크플로우 spec에서 사용.
- `data-guidance-key` — `GuidanceCallout.tsx` 부착. NC E2E spec에서 사용.

### 16c: `toHaveAttribute` 기반 상태 검증 패턴 (2026-04-22 추가)

상태 머신(FSM) 컴포넌트의 현재 상태를 E2E에서 검증할 때 `data-<domain>-key` attribute +
`toHaveAttribute(attr, value)` 패턴을 사용한다.
텍스트 내용(`toHaveText`)이나 클래스(`toHaveClass`)로 상태를 추론하면 UI 리팩토링 시 silent break.

**올바른 패턴 (GuidanceCallout 기준):**
```typescript
// ✅ attribute 기반 상태 검증 — 리팩토링에 안전
const callout = page.getByTestId('nc-guidance-callout');
await expect(callout).toHaveAttribute('data-guidance-key', 'openBlockedRepair_operator');

// ❌ 텍스트 기반 상태 추론 — UI 문구 변경 시 silent break
await expect(callout).toContainText('수리 이력을 먼저');
```

**탐지 — data-guidance-key 일관성:**
```bash
# spec에서 사용하는 data-guidance-key 값 목록
grep -rn "data-guidance-key" \
  apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -oE "'[a-z_]+'" | sort -u

# 컴포넌트에서 해당 attribute가 부착되어 있는지 확인
grep -rn "data-guidance-key" \
  apps/frontend/components --include="*.tsx"
# 결과: 1건 이상 (GuidanceCallout.tsx의 data-guidance-key={guidanceKey})
```

**PASS:** spec의 `data-guidance-key` 값이 `NC_WORKFLOW_GUIDANCE_TOKENS` 키 집합에 속함.
**FAIL:** spec이 존재하지 않는 guidance key를 참조 → 항상 false negative.

---

## Step 17: 브라우저 기반 Feature Flag 감지 패턴 (2026-04-22 추가)

`NEXT_PUBLIC_*` 환경 변수는 Next.js 빌드 타임에 앱 번들에 인라인된다.
E2E 테스트 러너(Node.js)의 `process.env.NEXT_PUBLIC_*`는 빌드된 앱의 플래그 상태를 반영하지 않으므로,
이를 기반으로 `testInfo.skip()` 또는 `test.describe.skip()`을 결정하는 것은 **무음 오검출**을 유발한다.

**올바른 패턴:**
`test.describe.configure({ mode: 'serial' })` + `beforeAll`에서 `browser.newContext({ baseURL, storageState })`로
임시 컨텍스트를 생성해 실제 앱 DOM을 확인해야 한다.

```typescript
// ✅ 올바른 패턴 — 브라우저 DOM으로 플래그 감지
test.describe.configure({ mode: 'serial' });
let flagEnabled = false;
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',  // baseURL 필수
    storageState: path.join(__dirname, '../../../.auth/technical-manager.json'),
  });
  const probe = await context.newPage();
  await probe.goto('/some-page');
  await probe.waitForLoadState('domcontentloaded');
  flagEnabled = await probe.locator('[data-feature-panel]').isVisible();
  await context.close();
});

// ❌ 잘못된 패턴 — 테스트 러너 env는 빌드 타임 플래그를 반영 안 함
const FLAG_ENABLED = process.env.NEXT_PUBLIC_MY_FEATURE === 'true';
```

**탐지:**
```bash
# spec에서 NEXT_PUBLIC_* env 직접 조건 분기 탐지
grep -rn "process\.env\.NEXT_PUBLIC_" \
  apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -v "shared-test-data\|BASE_URLS\|process\.env\.NEXT_PUBLIC_API_URL"
# → 0건 (NEXT_PUBLIC_API_URL은 BASE_URLS 경유로 허용됨)

# browser.newContext에 baseURL 없는 패턴 탐지
grep -rn "browser\.newContext(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -A3 \
  | grep -B1 "storageState" | grep -v "baseURL"
# 결과가 있으면 해당 컨텍스트에 baseURL 없음 — 상대경로 goto 실패
```

**PASS:** `NEXT_PUBLIC_*` env 직접 조건 분기 0건, `browser.newContext` 호출 시 `baseURL` 포함.
**FAIL:** spec에서 `process.env.NEXT_PUBLIC_FEATURE === 'true'` 분기 → `beforeAll` DOM 검사 패턴으로 교체.

**예외:**
- `process.env.NEXT_PUBLIC_API_URL` — API 엔드포인트 URL(feature flag 아님), `BASE_URLS` 폴백 경유 허용
- `shared-test-data.ts` 내 `BASE_URLS.BACKEND/FRONTEND` 정의 — SSOT 상수 정의이므로 허용

### 17b: browser.newContext() try/finally 보장 (2026-04-24 추가)

`beforeAll` 내에서 `browser.newContext()`로 임시 컨텍스트를 생성한 뒤 `context.close()`를
`try/finally` 없이 호출하면, probe 네비게이션 타임아웃 등 예외 발생 시 컨텍스트가 누수된다.

```typescript
// ✅ 올바른 패턴 — try/finally로 context 누수 방지
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL, storageState });
  try {
    const probe = await context.newPage();
    await probe.goto('/some-page');
    await probe.waitForLoadState('domcontentloaded');
    flagEnabled = await probe.locator('[data-feature]').isVisible();
  } finally {
    await context.close();
  }
});

// ❌ 잘못된 패턴 — 예외 시 context 누수
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL, storageState });
  const probe = await context.newPage();
  await probe.goto('/some-page');
  flagEnabled = await probe.locator('[data-feature]').isVisible();
  await context.close();  // 예외 발생 시 도달 불가
});
```

**탐지:**
```bash
# beforeAll 내 browser.newContext() 가 try/finally 없이 사용되는지 확인
grep -rn "browser\.newContext(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -B5 \
  | grep "beforeAll" | grep -v "try {"
# 상세 확인 필요 시 해당 파일에서 context 생성 전후 try/finally 수동 확인
```

**PASS:** `browser.newContext()` + `context.close()` 가 `try/finally` 블록 내에 존재.
**FAIL:** `context.close()` 가 `finally` 없이 직접 호출 → 예외 시 컨텍스트 누수.

---

## Step 18: page.route() API 모킹 패턴 (2026-04-24 추가)

seed 데이터로 자연 유도 불가능한 빈 상태(empty state) 등 결정론적 조건이 필요할 때
`page.route()`로 API 응답을 모킹한다.

### 18a: 모킹 응답 스키마 — FrontendPaginatedResponse SSOT 준수

```bash
# page.route() 내부 pagination 키 검사 — 'page:' 금지, 'currentPage:' 필수
grep -rn "page\.route(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -A 20 \
  | grep -E "^\s+(page|currentPage):"
# 'page:' 이 나오면 FAIL — FrontendPaginatedResponse는 currentPage 필드 사용
```

**PASS:** 모킹 응답의 pagination 객체가 `{ currentPage, pageSize, total, totalPages }` 형태.
**FAIL:** `page:` 필드 사용 → 컴포넌트의 `meta.pagination.currentPage` 참조가 `undefined` → UI 오동작.

### 18b: page.unroute() 정리 필수 (픽스처 명 포함 — 2026-04-30 확장)

`page.route()` 뿐 아니라 `techManagerPage.route()` / `testOperatorPage.route()` 등 픽스처 이름이 붙은 호출도 탐지 대상.
`await.*\.route\('` 패턴으로 모든 Playwright Page 객체의 route 호출을 포괄한다.

```bash
# 모든 Playwright Page 객체 route 호출 수 vs unroute 수 불균형 탐지
grep -rn "page\.route(\|Page\.route(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -l \
  | while read f; do
      routes=$(grep -cE "Page\.route\(|page\.route\(" "$f")
      unroutes=$(grep -cE "unroute|unrouteAll" "$f")
      [ "$routes" -gt "$unroutes" ] && echo "UNROUTE 누락: $f (route=$routes unroute=$unroutes)"
    done
# → 0건 (workflow spec은 finally 블록 내 unroute 필수)
```

**근거 (2026-04-30):** WF-AP02-EXT Step EXT-3에서 `techManagerPage.route()` 패턴 도입. 기존 `page\.route(` 소문자 grep은 `techManagerPage.route(` (대문자 P) 미탐지 — 카운트 불일치 시 unroute 누락 감지 불가. `Page\.route(|page\.route(` 대소문자 OR 패턴으로 확장.

**판정 기준:**
- `workflows/` 스펙: **FAIL** — serial 모드 상태 공유 컨텍스트에서 route 누출은 실제 위험
- `features/` 스펙: **WARN** — 각 test()가 fresh fixture를 받으므로 test 종료 시 자동 cleanup. 위생 권장

**알려진 부채 (2026-04-30, WARN 수준):**
- `features/dashboard/statistics.spec.ts` (route=1, unroute=0)
- `features/equipment/list/equipment-list.spec.ts` (route=9, unroute=0)
- `features/equipment/list/group-f-loading-states.spec.ts` (route=2, unroute=0)
- `features/dashboard/dashboard.spec.ts` (route=3, unroute=0)
- `features/equipment/create/equipment-form-errors.spec.ts` (route=7, unroute=0)
- `features/calibration/certificate/registration-approval-flow.spec.ts` (route=1, unroute=0)
- `features/calibration/certificate/rejection-workflow.spec.ts` (route=1, unroute=0)
- `features/calibration/certificate/permission-error.spec.ts` (route=4, unroute=1)
- `features/checkouts/suite-list-ia/s-empty-states.spec.ts` (route=3, unroute=2)

### 18c: goto 후 networkidle 금지

```bash
# page.route()를 사용하는 파일에서 networkidle 탐지
grep -rn "page\.route(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -l \
  | xargs grep -l "networkidle" 2>/dev/null
# → 0건
```

**PASS:** 0건. **FAIL:** networkidle → Next.js HMR/SSE 커넥션이 유지되어 타임아웃.

**현재 사용처:** `suite-list-ia/s-empty-states.spec.ts` — completed/inProgress 탭 빈 상태 결정론적 검증.

---

## Step 19: suite-ux 패턴 — localStorage 조작·emulateMedia·모바일 viewport (2026-04-24 추가)

`tests/e2e/features/checkouts/suite-ux/` 디렉토리는 UX 레이어 전용 테스트 묶음이다.
아래 세 가지 패턴이 이 suite에서 사용되며 일관성 검사가 필요하다.

### 19a: localStorage 조작 패턴

온보딩 힌트 테스트는 `localStorage.removeItem`으로 힌트 상태를 초기화하고, 클릭 후 `localStorage.getItem`으로 결과를 검증한다.
`page.evaluate()` 내부에서만 localStorage에 접근해야 한다 (직접 Playwright API 없음).

```bash
# suite-ux에서 localStorage 직접 조작 확인
grep -rn "localStorage\|evaluate" \
  apps/frontend/tests/e2e/features/checkouts/suite-ux \
  --include="*.spec.ts"
```

**✅ 올바른 패턴:**
```typescript
// 초기화
await page.evaluate(() =>
  localStorage.removeItem('onboarding-dismissed:checkout-next-step')
);
// 검증
const stored = await page.evaluate(() =>
  localStorage.getItem('onboarding-dismissed:checkout-next-step')
);
expect(stored).toBe('true');
```

**❌ 금지:**
```typescript
// page.localstorage_delete() 같은 존재하지 않는 API 사용
// localStorage 키 하드코딩 시 'onboarding-dismissed:' prefix 빠뜨리기
```

### 19b: prefers-reduced-motion 검증 패턴

`page.emulateMedia({ reducedMotion: 'reduce' })` → pulse 클래스 미적용 확인.

```bash
# emulateMedia 사용 확인
grep -rn "emulateMedia\|reducedMotion\|prefers-reduced-motion" \
  apps/frontend/tests/e2e/features/checkouts/suite-ux \
  --include="*.spec.ts"
```

### 19c: 모바일 viewport 패턴

모바일 테스트는 `test.use({ viewport: { width: 375, height: 812 } })` 또는 `page.setViewportSize()` 사용.
`md:hidden` 클래스로 숨겨진 요소는 `toBeHidden()`으로 검증 (DOM에 존재하지만 CSS로 숨김).

```bash
# 모바일 viewport 설정 확인
grep -rn "setViewportSize\|width: 375\|MOBILE_VIEWPORT" \
  apps/frontend/tests/e2e/features/checkouts/suite-ux \
  --include="*.spec.ts"
```

**PASS 기준:**
- `suite-ux/*.spec.ts` 존재 (s-onboarding, s-toast, s-mobile-bottom-sheet 3파일)
- localStorage 접근이 모두 `page.evaluate()` 경유
- 모바일 peek 버튼 높이 56px~72px 범위 검증 포함
- `aria-modal="true"` Drawer 검증 포함

**FAIL 기준:**
- `waitForTimeout` 사용 (Step 4 위반) — `waitForSelector` 또는 `expect(...).toBeVisible()` 대체
- `[data-radix-toast-viewport]`가 아닌 `[data-sonner-toast]` — 현재 구현이 shadcn toast이므로 Radix selector 사용

**관련 파일:**
- `tests/e2e/features/checkouts/suite-ux/s-onboarding.spec.ts`
- `tests/e2e/features/checkouts/suite-ux/s-toast.spec.ts`
- `tests/e2e/features/checkouts/suite-ux/s-mobile-bottom-sheet.spec.ts`

---

## Step 22: goto/reload 후 `waitForLoadState('networkidle')` + 조건 기반 wait 중복 탐지 (2026-04-30 추가)

`goto()` / `reload()` 직후에 `waitForFunction()` 또는 `waitForSelector()` 같은 조건 기반 wait가 이어진다면, 그 사이의 `waitForLoadState('networkidle')` 은 **중복**이다. 조건 기반 wait 자체가 해당 조건이 충족될 때까지 폴링하므로 네트워크 안정화를 별도로 기다릴 필요가 없다.

**위반 패턴 (legacy-sw-cleanup.spec.ts에서 발견, 2026-04-30 수정):**

```typescript
// ❌ WRONG — reload 후 networkidle + 바로 waitForFunction 조합 (networkidle 중복)
await page.reload();
await page.waitForLoadState('networkidle');
await page.waitForFunction((key) => localStorage.getItem(key) === '1', STORAGE_KEY);
```

```typescript
// ✅ CORRECT — 조건 기반 wait 하나로 충분
await page.reload();
await page.waitForFunction((key) => localStorage.getItem(key) === '1', STORAGE_KEY, { timeout: 5000 });
```

**단, TC-03처럼 이어지는 조건 기반 wait 없이 `reload()` 후 단순 상태 확인만 한다면** `waitForLoadState('domcontentloaded')`가 적합하다 (`networkidle` 보다 빠르고 충분):

```typescript
// TC-03 패턴 — 이미 정착된 상태를 확인하는 경우
await page.reload();
await page.waitForLoadState('domcontentloaded');
const flag = await page.evaluate(/* ... */);
```

**탐지:**

```bash
# goto/reload 직후 networkidle이 있고, 그 뒤 waitForFunction/waitForSelector가 이어지는 파일 탐지
grep -rn "waitForLoadState.*networkidle" apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -v "/seeds/"
# 각 결과의 앞뒤 10줄 확인 — 직후 waitForFunction/waitForSelector가 있으면 WARN
```

**예외:**
- seed 파일 (`/seeds/`, `seed.spec.ts`) — 데이터 준비용으로 안정성 우선
- `page.route()` 컨텍스트 내 networkidle → Step 18c에서 별도 관리
- 이어지는 조건 기반 wait가 없는 단독 networkidle — Step 18c에 해당하지 않는 경우 WARN(검토 권장)

**발생 이력 (2026-04-30):** `legacy-sw-cleanup.spec.ts` TC-01에서 `reload()` + `networkidle` + `waitForFunction` 3단 조합 발견. networkidle 2건 제거 완료 (`waitForFunction` + `domcontentloaded` 대체).

---

## Step 26: 도메인 e2e helper SSOT 분리 + value-based selector (2026-05-02 추가)

prefill된 폼 + 도메인별 helper 누적은 시스템 정합성을 깨뜨리는 두 가지 anti-pattern이다.

### 26a: 도메인 e2e helper SSOT 분리

`workflow-helpers.ts`는 *cross-domain generic* helper(`apiGet/apiPost`, `extractId/Version`, `clearBackendCache`)에 한정. 도메인별 API 헬퍼 (≥3 함수)는 `helpers/<domain>-helpers.ts`로 분리하여 SSOT 유지. workflow-helpers.ts에 모든 도메인 헬퍼가 누적되면 1500+ lines 비대화 → 도메인 추가 시 충돌.

```typescript
// ✅ CORRECT — 도메인별 helper file
// helpers/inspection-template-helpers.ts
export async function getInspectionTemplate(...) {...}
export async function upsertInspectionTemplate(...) {...}
export async function resetInspectionTemplates(...) {...}
export async function findCurrentTemplateId(...) {...}  // DB 직접 검증용

// ❌ WRONG — workflow-helpers.ts에 도메인 helper 누적
// (이미 1276 lines — 새 도메인 helper 추가 시 분리 필수)
```

### 26b: prefill 폼에서 `input[value=""]` 위치 의존 selector 금지

REFERENCE_TEMPLATE_STRUCTURE 같은 prefill source가 있는 폼에서 `dialog.locator('input[value=""]').first()` / `.nth(N)` 패턴은 *DOM 순서 의존*으로 brittle. inspectionDate(빈 시작) + items[*].checkResult(prefill 후 비워짐) + 추가 input이 모두 매칭되어 의도와 다른 input 채움 → false PASS 또는 silent fail.

```typescript
// ❌ WRONG — DOM 순서 의존 (inspectionDate / 다른 빈 input과 충돌)
const newItemInputs = dialog.locator('input[value=""]');
await newItemInputs.first().fill('새 항목');
await newItemInputs.nth(1).fill('새 기준');

// ✅ CORRECT — value-based selector + rename trigger (정확히 1개 input 매칭)
await dialog.locator('input[value="WF-19f 외관 검사"]').fill('WF-19f 외관 검사 (변경됨)');
```

### 26c: backend hook fail-soft 회귀 가드 — DB 직접 검증

승인 시 `templateService.autoCreateIfAbsent` 같은 *fail-soft* hook(approve 자체는 성공해도 hook 실패는 logger만)은 UI 검증만으로 catch 못함. *helper 작성 후 사용 안 함* 분리는 단편 처리 — spec에서 직접 호출.

```typescript
// ✅ CORRECT — UI 검증 전 DB 직접 확인
const templateId = await findCurrentTemplateId(equipmentId, 'intermediate');
expect(templateId, 'approve hook 후 template auto-create row 존재해야 함').not.toBeNull();
await openInspectionDialog(page);
await expect(dialog.getByText(/v1/)).toBeVisible();
```

### 26d: 도메인 변경 후 legacy spec rewrite 패턴

도메인 메커니즘 변경(예: latestInspection prefill → template snapshot prefill)으로 기존 spec이 fail 상태가 되면 *단순 삭제 또는 skip 회피*. *의도(회귀 가드)는 유지하면서 메커니즘만 정합화*하는 rewrite가 시니어 표준. WF-19d.spec.ts (2026-05-02): legacy "직전 승인 점검 토글" 검증 → "template 기반 prefill regression" 정합 rewrite.

### 26e: backend 양면 도메인 페어링 (intermediate/self) 회귀 가드

같은 backend hook이 두 도메인(intermediate-inspections + self-inspections)에서 작동 시 e2e도 양면 spec 페어링 필수. 한쪽만 cover하면 *시스템 정합성* 단편. 2026-05-02 발견: wf-19* 시리즈가 intermediate만 cover → wf-20c-self-inspection-template-badge.spec.ts 추가.

**탐지 명령:**

```bash
# 26a: workflow-helpers.ts 라인 수 (≥1500 시 도메인 분리 검토 권고)
wc -l apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts

# 26b: brittle empty-value selector — 0건 강제
grep -rn 'input\[value=""\]' apps/frontend/tests/e2e/ --include="*.spec.ts"
# 결과: 0건이면 PASS, 1+건이면 value-based selector로 교체

# 26c: 도메인별 helper SSOT 패턴 — 신규 도메인 helper 신설 시 inspection-template-helpers.ts 패턴 정합 (top-level 주석 + workflow-helpers 재사용 + DB 직접 query helper 포함)
ls apps/frontend/tests/e2e/workflows/helpers/*-helpers.ts
```

**발생 이력 (2026-05-02):** inspection-template-1bg Mode 1 harness iter 1 PASS 후 시니어 자기검토에서 self-inspection 누락 + brittle selector + helper 작성-사용 분리 4건 발견. 26a-e 모두 closure.

---

## Step 27: 공개 a11y 감사 라우트 SSOT + config 경계 (2026-05-03 추가)

공개 접근성 게이트는 `docs/operations/quality-audit-routes.json`의 `publicRoutes`만 대상으로 한다.
인증이 필요한 a11y spec은 기본 Playwright 설정의 storageState/globalSetup 경계를 사용하고,
`playwright.a11y.config.ts`에는 포함하지 않는다.

```bash
# 공개 a11y config는 login 공개 spec만 수집해야 함
grep -n "testMatch: 'login\\.a11y\\.spec\\.ts'" apps/frontend/playwright.a11y.config.ts

# spec은 라우트 문자열을 직접 보유하지 않고 registry loader를 경유해야 함
grep -n "getPublicA11yRoutes" apps/frontend/tests/e2e/a11y/login.a11y.spec.ts
grep -n "quality-audit-routes.json" apps/frontend/tests/e2e/shared/utils/quality-audit-routes.ts

# CI workflow는 filter cwd 기준 config path를 사용해야 함
grep -n -- "--config playwright\\.a11y\\.config\\.ts" .github/workflows/accessibility-audit.yml
grep -n "apps/frontend/playwright\\.a11y\\.config\\.ts" .github/workflows/accessibility-audit.yml && echo "FAIL: duplicated cwd path" || true

# 실제 수집 대상 확인: 2 tests / login.a11y.spec.ts only
pnpm --filter frontend exec playwright test --config playwright.a11y.config.ts --list
```

**PASS:** 공개 a11y config가 `login.a11y.spec.ts`만 수집하고, spec/workflow가 `quality-audit-routes.json` SSOT를 경유.
**FAIL:** `/login` 같은 route literal이 spec/workflow/config에 직접 박히거나, auth-required a11y spec이 public config에 포함됨.
