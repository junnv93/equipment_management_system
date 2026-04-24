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
| `apps/frontend/tests/e2e/a11y/` | 접근성 게이트 (공개 라우트 전용, auth 불필요) |
| `apps/frontend/playwright.a11y.config.ts` | a11y 전용 Playwright 설정 (globalSetup 없음) |

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

### Step 5: Locator 안티패턴

**PASS:** `locator('[role=]')` 0건, `waitForFunction` 0건, **Tailwind utility class selector 0건**.

**Tailwind utility class selector 금지** (33차 추가, review-architecture 발견):
스켈레톤/로딩 상태 대기를 위해 `locator('.h-8.w-14')` 같은 Tailwind utility class literal 을 쓰면
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

### Step 5a: actionability 우회 안티패턴 (35차 추가)

`click({ force: true })` / `.first()` 우회는 sticky overlay/ aria-live 중복 같은 **실제 UX/접근성 결함을 가립니다**. 회피책 대신 SSOT 헬퍼로 교정하고 spec 에서는 헬퍼만 호출.

**현재 SSOT 헬퍼:**
- `apps/frontend/tests/e2e/shared/helpers/sticky-helpers.ts` — `safeClick` / sticky-aware scroll utilities (force 사용 금지)
- `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` — useToast 중복 발화 우회 (`.first()` 대신)

**탐지:**
```bash
# spec 파일에서 force:true 사용 금지 (sticky-helpers 내부는 면제)
# 면제: position 좌표 클릭 (드로어 외부 클릭 등 의도적 a11y 패턴)
grep -rn "force:\s*true" apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -v "position:"

# 토스트/리스트 .first() 우회 패턴 검출 (헬퍼 내부 면제)
grep -rn "getByText.*\.first()\|getByRole.*status.*\.first()" \
  apps/frontend/tests/e2e --include="*.spec.ts"
```

**PASS:** spec 파일에서 0건 (헬퍼 내부 + position 좌표 클릭 면제). **FAIL:** spec 에서 직접 사용 → 헬퍼 호출로 교체.

**예외:**
- `click({ force: true, position: ... })` — 정확한 좌표 클릭 (드로어 외부, 캔버스, 오버레이 영역 테스트). 현재 면제 위치: `apps/frontend/tests/e2e/common/accessibility/accessibility.spec.ts`.

**기존 hit (35차 현재 — 알려진 부채):**
- `apps/frontend/tests/e2e/features/approvals/comprehensive/04-bulk-actions.spec.ts` — `#select-all` checkbox 가 6건 force-click. sticky overlay 또는 hidden checkbox 가 원인일 가능성 → SelectAll 컴포넌트 actionability 점검 후 `safeClick` 으로 마이그레이션 필요 (별도 harness 프롬프트 등재 권장).

**근거:** WF-20 spec 작성 중 sticky header z-index 결함 + useToast 중복 aria-live 발화가 force/first 우회로 가려져 있던 것을 발견 (34차 부채 → 35차 헬퍼 추출 완료).

### Step 5b: Export 양식 Cross-spec Pairing (35차 추가, 38차 form-level 승격)

Export 양식 spec 이 `page.request` 로 API 응답만 검증하고 사용자 다운로드 동선("내보내기" 버튼 → `<a download>` → `download` 이벤트)이 **어느 spec 에서도** cover 되지 않으면 해당 **양식(form)** 을 WARN 으로 보고. 31차 발견 → 35차 per-file WARN → **38차 form-identifier 단위 cross-spec pairing 으로 승격**.

**승격 배경**: 35차 per-file 검사는 `wf-export-ui-download.spec.ts` 가 별도 파일로 UI 동선을 cover 하게 된 뒤로 `wf-19b/20b` 같은 의도적 API-only regression spec 을 false WARN 으로 계속 보고했다. `@api-only` 마커로 suppress 하는 방식도 시도되었으나, 마커는 "spec 파일의 의도" 만 표현할 뿐 **양식 단위로 UI 동선이 실제 cover 되는지** 는 답하지 못한다. form-level pairing 은 spec 파일 배치와 무관하게 **양식마다 API + UI 한 쌍이 존재하는가** 를 직접 검증한다.

**판정 규칙** (양식 식별자 = `UL-QP-18-NN`):

| API cover | UI cover | 결과 |
|---|---|---|
| ≥1 | ≥1 | PASS — regression 가드 + 사용자 동선 양쪽 cover |
| ≥1 | 0   | **WARN** — backend-only, 한국어 filename/권한 토스트/드롭다운 UX 0건 cover |
| 0   | ≥1 | INFO — UI-only (회귀 가드 부재, tolerable) |
| 0   | 0   | skip — export 대상 아님 |

**시그널 정의**:
- **API cover**: spec 파일이 `page.request` 호출을 포함
- **UI cover**: spec 파일이 `suggestedFilename().*toMatch.*<form-id>` 또는 `filenamePattern.*<form-id>` 을 포함. **단순 literal 등장은 주석/"미커버" 목록과 구분 불가하므로 부적합** — 파일명 어서션 위치만 신뢰.

**SSOT 헬퍼**: UI spec 은 `apps/frontend/tests/e2e/shared/helpers/download-helpers.ts` 의 `expectFileDownload(page, action, { filenamePattern })` 를 호출. 새 양식 추가 시 spec 은 helper + filenamePattern 만 지정하면 자동 가드 편입.

**탐지 스크립트**:

```bash
# 양식별 API/UI cover 집계 → WARN 리스트 출력
# 양식 식별자는 spec 에서 동적 추출 (하드코딩 없음 — 새 양식 추가 시 자동 편입)
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

**PASS 기준**: WARN 출력 0건. **FAIL 조건 없음** — 메타 가드. WARN 은 tech-debt-tracker.md `Export UI 다운로드 동선 미검증 양식` 항목과 1:1 대응되어야 한다.

**현재 baseline (38차 실측)**:
- **PASS**: UL-QP-18-01 / -07 / -08 / -09 (`wf-export-ui-download.spec.ts` + `wf-21-cable-ui.spec.ts`)
- **WARN**: UL-QP-18-03 / -05 / -06 / -10 (UI 진입점 부재 — backend-only export 설계. 잔여 부채로 tech-debt-tracker 등재)
- **skip**: UL-QP-18-02 (history-card 전용 endpoint 로 API-test 없음), -04, -11

**WARN 대응**: 새 WARN 등장 시 (a) `wf-export-ui-download.spec.ts` 에 `expectFileDownload` 케이스 추가로 해소하거나, (b) UI 진입점 부재로 의도된 부채면 tracker 항목에 양식 번호 추가. spec 파일 단위 `@api-only` 마커는 form-level pairing 이 직접 답을 주므로 **deprecated** (기존 마커 보유 파일이 있으면 다음 편집 시 제거 가능).

**근거**: API-only spec 은 backend regression 만 잡고 한국어 filename UTF-8 보존(RFC 5987), 권한 가드 토스트, dropdown 선택 UX 등 사용자 시점 결함을 0건 cover 한다. form-level pairing 은 "spec 파일 의도" 가 아닌 "양식별 실제 coverage" 를 측정해 false WARN 없이 진짜 갭만 보고한다.

### Step 6: UUID 하드코딩

**PASS:** spec에 UUID 리터럴 0건. `shared-test-data.ts` 또는 constants에서 import.

### Step 7: 상태 변경 테스트 격리

**PASS:** 순서 의존적 상태 변경 테스트에 `mode: 'serial'` 설정.

### Step 8: Backend 캐시 클리어

**PASS:** DB 직접 수정 파일 모두 `clearBackendCache()` 호출.

### Step 9: Backend 토큰 직접 호출

**PASS:** `api-helpers.ts` 외 `test-login` 직접 호출 0건.

### Step 10: Backend URL 하드코딩

`tests/e2e/scripts/` 유틸리티 스크립트도 검사 범위에 포함. spec 파일이 아니어서 `--include="*.spec.ts"` 단독 grep으로는 탐지되지 않는 맹점 존재.

**탐지:**
```bash
# spec 파일 + scripts/ 유틸리티 스크립트 모두 검사
grep -rn "localhost:3001\|localhost:3000" \
  apps/frontend/tests/e2e \
  --include="*.ts" --include="*.spec.ts" \
  | grep -v "shared-test-data\|process\.env\|// "
```

**PASS:** 0건. `BASE_URLS.BACKEND` 또는 `process.env.NEXT_PUBLIC_API_URL` 폴백 경유.
**근거 (2026-04-21 수정):** `tests/e2e/scripts/generate-inspection-docx.ts` 등 scripts/ 파일이 `const BACKEND = 'http://localhost:3001'` 하드코딩을 가지고 있었음. `BASE_URLS.BACKEND` SSOT 경유로 수정됨.

### Step 11b: TEST_USERS_BY_TEAM SSOT

**PASS:** `shared-test-data.ts`가 `@equipment-management/shared-constants`에서 import.

### Step 11: Pool 정리

**PASS:** Pool 생성 파일 모두 cleanup 함수 export.

### Step 12: 아키텍처 시나리오 커버리지

- **12a:** CAS 뮤테이션 있는 feature에 VERSION_CONFLICT 테스트 존재
- **12b:** 뮤테이션 후 목록 갱신 검증 50% 이상
- **12c:** 사이트 격리 테스트가 GET + mutation 모두 검증

### Step 13: global-setup 시드 실패 fail-fast

테스트 시드/검증 실패가 `console.warn` 뒤에 진행되면 false negative 가 발생한다
(e.g. 스키마 drift 또는 시드 검증 실패를 조용히 통과). 시드/검증 실패는 **throw** 로
글로벌 설정을 중단해야 한다.

**탐지:**
```bash
grep -nA3 "시드 데이터 로딩\|seed.*load" apps/frontend/tests/e2e/global-setup.ts \
  | grep -B1 "console\.warn" && echo "❌ seed 실패가 warn-and-continue 로 흡수됨"
```

**PASS:** `} catch { throw ... }` 또는 `throw err`. **FAIL:** `} catch { console.warn(...) }` 후 진행.

**예외:** 시드 성공 이후의 부가 단계(예: overdue scheduler 트리거)는 warn 유지 가능 — 단 그 이유가 주석으로 명시되어야 함 ("optional enrichment — test seeds already cover...").

### Step 14: 장비 파티셔닝 (E2E 장비 격리)

상태를 mutate하는 checkout E2E suite(S23-S27 등)는 **전용 장비**를 사용해야 한다.
공용 장비(SPECTRUM_ANALYZER_SUW_E 등)를 여러 suite가 동시 mutate하면 병렬 실행 시 비결정적 실패.

**탐지:**
```bash
# S23-S27 spec에서 사용하는 장비 ID가 전용 상수인지 확인
grep -n "TEST_EQUIPMENT_IDS\." apps/frontend/tests/e2e/features/checkouts/suite-2[3-7]-*/*.spec.ts \
  | grep -v "RBAC_\|CANCEL_\|CAS_\|SHARED_\|RECEIVER_UIW\|SPECTRUM_ANALYZER.*NON_SHARED" \
  && echo "❌ S23-S27이 공용 장비를 primary로 사용 중"
```

**PASS:** S23-S27의 primary 장비가 전용 상수(`RBAC_SIGNAL_GEN_SUW_E`, `CANCEL_RECEIVER_SUW_E`, `CAS_ANALYZER_SUW_E`, `SHARED_ANALYZER_SUW_E`). read-only 참조(NON_SHARED, UIWANG_SHARED_REF)는 면제.

**불변식:** "상태를 mutate하는 E2E suite는 전용 장비를 소유하며 다른 suite와 공유하지 않는다."

### Step 15: Backend Jest/supertest E2E 헬퍼 패턴 (2026-04-18 추가)

`apps/backend/test/` 하위 Jest + supertest 기반 E2E 테스트의 인증/인프라 패턴 검증.

**15a: loginAs() SSOT — DEFAULT_ROLE_EMAILS 경유**

```bash
# test-auth.ts가 DEFAULT_ROLE_EMAILS를 shared-constants에서 import하는지 확인
grep -n "DEFAULT_ROLE_EMAILS" apps/backend/test/helpers/test-auth.ts
# → 1건 이상 (SSOT 경유)

# 하드코딩 이메일로 직접 인증하는 패턴 탐지 (auth.e2e-spec.ts 제외)
grep -rn "admin@example\.com\|manager@example\.com\|user@example\.com" \
  apps/backend/test/*.e2e-spec.ts | grep -v auth.e2e-spec.ts
# → 0건
```

**PASS:** `loginAs()` 가 `/auth/test-login?role=<role>` 엔드포인트 경유 + `DEFAULT_ROLE_EMAILS` SSOT 사용. **FAIL:** hardcoded credential 직접 사용.

**예외:** `auth.e2e-spec.ts` — `/auth/login` 엔드포인트 자체를 테스트하므로 로컬 `LOGIN_USERS` 상수 사용 정당.

**15b: TEST_USER_IDS 프로덕션 UUID 정합**

```bash
# TEST_USER_IDS가 uuid-constants.ts에서 import하는지 확인
grep -n "uuid-constants\|USER_LAB_MANAGER\|USER_TECHNICAL_MANAGER\|USER_TEST_ENGINEER" \
  apps/backend/test/helpers/test-auth.ts
# → production UUID 상수 import 확인
```

**PASS:** `TEST_USER_IDS`가 `uuid-constants.ts`의 production UUID 상수 경유 (e2e00000-... 형태 금지). **근거:** `/auth/test-login`이 DB lookup → JWT sub = 실제 DB UUID. e2e UUID를 쓰면 `TEST_USER_IDS.admin !== req.user.userId`.

**15c: jest-e2e.json maxWorkers:1 필수**

```bash
grep "maxWorkers" apps/backend/test/jest-e2e.json
# → "maxWorkers": 1
```

**PASS:** `"maxWorkers": 1`. **FAIL:** 없거나 1 초과. 단일 DB 아키텍처에서 병렬 실행은 시드 데이터 경합 → 비결정적 실패.

**15d: API_ENDPOINTS 직접 사용 SSOT — E2E spec 하드코딩 경로 금지 (2026-04-21 업데이트)**

`createTestApp`이 `setGlobalPrefix('api')`를 설정하므로 spec은 `API_ENDPOINTS.*`를 그대로 사용.
`test-paths.ts` / `toTestPath()` 래퍼는 2026-04-21 삭제됨 — 탐지 시 anti-pattern.

```bash
# E2E spec에서 하드코딩된 경로 문자열 리터럴 직접 사용 탐지
grep -rn "\.\(get\|post\|patch\|delete\|put\)(['\`]/api/" \
  apps/backend/test --include="*.e2e-spec.ts"
# 결과: 0건 (모두 API_ENDPOINTS.* 직접 경유)

# toTestPath 잔재 탐지 (삭제된 래퍼 재도입 방지)
grep -rn "toTestPath\|test-paths" apps/backend/test
# 결과: 0건 (파일 삭제됨)
```

**PASS:** 두 명령어 모두 0건. **FAIL:** 하드코딩 경로 리터럴 또는 toTestPath 재도입.

### Step 16: E2E data-* 셀렉터 × 컴포넌트 attribute 일관성 (2026-04-19 추가)

E2E spec이 `[data-xxx]` 커스텀 attribute 셀렉터를 사용할 때, 해당 컴포넌트 구현에
동일 attribute가 실제로 부착되어 있는지 확인.

**16a: data-timeline-card 셀렉터 일관성**
```bash
# E2E spec에서 [data-timeline-card] 셀렉터를 사용하는지 확인
grep -rn "data-timeline-card" \
  apps/frontend/tests/e2e --include="*.spec.ts"

# 컴포넌트에서 실제 attribute가 부착되어 있는지 확인 (동일 개수 이상이어야 함)
grep -rn "data-timeline-card" \
  apps/frontend/components --include="*.tsx"
# 결과: 1건 이상 (spec 사용 수 ≤ 컴포넌트 정의 수)
```

**16b: 신규 data-* 셀렉터 드리프트 탐지**
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

**16c: `toHaveAttribute` 기반 상태 검증 패턴 (2026-04-22 추가)**

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

### Step 17: 브라우저 기반 Feature Flag 감지 패턴 (2026-04-22 추가)

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

**17b: browser.newContext() try/finally 보장 (2026-04-24 추가)**

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

### Step 18: page.route() API 모킹 패턴 (2026-04-24 추가)

seed 데이터로 자연 유도 불가능한 빈 상태(empty state) 등 결정론적 조건이 필요할 때
`page.route()`로 API 응답을 모킹한다.

**필수 요건:**

**18a: 모킹 응답 스키마 — FrontendPaginatedResponse SSOT 준수**

```bash
# page.route() 내부 pagination 키 검사 — 'page:' 금지, 'currentPage:' 필수
grep -rn "page\.route(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -A 20 \
  | grep -E "^\s+(page|currentPage):"
# 'page:' 이 나오면 FAIL — FrontendPaginatedResponse는 currentPage 필드 사용
```

**PASS:** 모킹 응답의 pagination 객체가 `{ currentPage, pageSize, total, totalPages }` 형태.
**FAIL:** `page:` 필드 사용 → 컴포넌트의 `meta.pagination.currentPage` 참조가 `undefined` → UI 오동작.

**18b: page.unroute() 정리 필수**

```bash
# page.route() 사용 후 page.unroute() 없는 spec 탐지
grep -rn "page\.route(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -l \
  | while read f; do
      routes=$(grep -c "page\.route(" "$f")
      unroutes=$(grep -c "page\.unroute(" "$f")
      [ "$routes" -gt "$unroutes" ] && echo "UNROUTE 누락: $f (route=$routes unroute=$unroutes)"
    done
# → 0건
```

**PASS:** `page.route()` 호출 수 ≤ `page.unroute()` 호출 수. **FAIL:** unroute 누락 → 이후 테스트에 모킹 오염.

**18c: goto 후 networkidle 금지**

```bash
# page.route()를 사용하는 파일에서 networkidle 탐지
grep -rn "page\.route(" \
  apps/frontend/tests/e2e --include="*.spec.ts" -l \
  | xargs grep -l "networkidle" 2>/dev/null
# → 0건
```

**PASS:** 0건. **FAIL:** networkidle → Next.js HMR/SSE 커넥션이 유지되어 타임아웃.

**현재 사용처:** `suite-list-ia/s-empty-states.spec.ts` — completed/inProgress 탭 빈 상태 결정론적 검증.

### Step 19: suite-ux 패턴 — localStorage 조작·emulateMedia·모바일 viewport (2026-04-24 추가)

`tests/e2e/features/checkouts/suite-ux/` 디렉토리는 UX 레이어 전용 테스트 묶음이다.
아래 세 가지 패턴이 이 suite에서 사용되며 일관성 검사가 필요하다.

**19a: localStorage 조작 패턴**

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

**19b: prefers-reduced-motion 검증 패턴**

`page.emulateMedia({ reducedMotion: 'reduce' })` → pulse 클래스 미적용 확인.

```bash
# emulateMedia 사용 확인
grep -rn "emulateMedia\|reducedMotion\|prefers-reduced-motion" \
  apps/frontend/tests/e2e/features/checkouts/suite-ux \
  --include="*.spec.ts"
```

**19c: 모바일 viewport 패턴**

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

## Output Format

```markdown
| #   | 검사                    | 상태      | 상세                          |
| --- | ----------------------- | --------- | ----------------------------- |
| 1   | Auth Fixture 사용       | PASS/FAIL | loginAs/직접 로그인 위치      |
| 2   | Import 소스             | PASS/FAIL | @playwright/test 직접 import  |
| 3   | networkidle 금지        | PASS/FAIL | networkidle 사용 위치         |
| 4   | waitForTimeout 금지     | PASS/WARN | waitForTimeout 사용 위치      |
| 5   | Locator 안티패턴        | PASS/FAIL | CSS role selector 등          |
| 6   | UUID 하드코딩           | PASS/FAIL | spec 파일 내 UUID 리터럴      |
| 7   | 상태 변경 테스트 격리   | PASS/WARN | serial 모드 미설정            |
| 8   | Backend 캐시 클리어     | PASS/FAIL | DB 수정 후 캐시 클리어 누락   |
| 9   | Backend 토큰 직접 호출  | PASS/FAIL | test-login 직접 호출          |
| 10  | Backend URL 하드코딩    | PASS/FAIL | localhost URL 직접 사용       |
| 11b | TEST_USERS_BY_TEAM SSOT | PASS/FAIL | shared-test-data.ts import    |
| 11  | Pool 정리               | PASS/FAIL | cleanup 함수 미제공           |
| 12a | CAS 충돌 복구 테스트    | PASS/WARN | VERSION_CONFLICT 시나리오     |
| 12b | 캐시 일관성 테스트      | PASS/INFO | 뮤테이션 후 목록 갱신 검증    |
| 12c | 사이트 접근 제어 범위   | PASS/WARN | GET + mutation 모두 검증      |
| 13  | global-setup fail-fast  | PASS/FAIL | 시드 실패가 warn-and-continue |
| 14  | 장비 파티셔닝           | PASS/FAIL | S23-S27 공용 장비 사용        |
| 15a | Backend loginAs SSOT    | PASS/FAIL | hardcoded credential 탐지     |
| 15b | TEST_USER_IDS UUID 정합 | PASS/FAIL | e2e UUID 사용 탐지            |
| 15c | jest-e2e.json maxWorkers| PASS/FAIL | maxWorkers != 1               |
| 15d | API_ENDPOINTS SSOT (E2E) | PASS/FAIL | 하드코딩 경로 리터럴 또는 toTestPath 재도입 |
| 16a | data-* 셀렉터 일관성    | PASS/FAIL | spec 셀렉터 vs 컴포넌트 attribute 불일치 |
| 16c | `toHaveAttribute` 기반 상태 검증 | PASS/FAIL | data-guidance-key 등 FSM 상태 attribute 실재 여부 |
| 17  | 브라우저 기반 feature flag 감지 | PASS/FAIL | `process.env.NEXT_PUBLIC_*` 직접 분기 또는 `browser.newContext` baseURL 누락 |
| 17b | beforeAll newContext try/finally | PASS/FAIL | `browser.newContext()` 후 `finally` 없는 `context.close()` — 예외 시 context 누수 |
| 18a | page.route() 응답 스키마 SSOT  | PASS/FAIL | pagination `page:` 금지, `currentPage:` 필수 |
| 18b | page.unroute() 정리             | PASS/FAIL | route 후 unroute 누락 → 이후 테스트 오염 |
| 18c | route 후 networkidle 금지       | PASS/FAIL | page.route() 파일에 networkidle 잔존 |
| 19a | suite-ux localStorage 조작 패턴 | PASS/FAIL | page.evaluate() 외부 localStorage 직접 접근 또는 키 prefix 누락 위치 |
| 19b | emulateMedia reducedMotion 패턴 | PASS/INFO | pulse 클래스 검증 테스트에서 reduced-motion 시나리오 누락 |
| 19c | 모바일 viewport + aria-modal 검증 | PASS/FAIL | Drawer toBeVisible 후 aria-modal="true" 검증 누락 |
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
10. **auth-role-access.spec.ts** — 비인증 리다이렉트 테스트
11. **security.spec.ts** — API 보안 테스트
12. **calibration/overdue-auto-nc/** — API 전용 테스트
13. **seed 파일** — 시드 스크립트
14. **복합 CSS 셀렉터** — `getByRole`로 대체 불가한 경우 허용
15. **네거티브 네비게이션/토스트 assertion용 짧은 `waitForTimeout`** — "클릭 후 아무 일도 일어나지 않음"을 증명하려면 일정 시간 대기가 불가피. `≤ 1000ms` 이내의 `waitForTimeout` + 직후 `toHaveURL` / `toHaveCount(0)` 쌍 패턴은 정당. 예: early-return handler의 no-op 회귀 보호
16. **`getByPlaceholder`** — Playwright user-facing semantic locator 패밀리 소속(CSS 셀렉터 아님). shadcn `<Label>`이 `htmlFor` 바인딩 없이 사용된 폼에서 `getByLabel`이 불안정할 때 허용. `getByRole('textbox', { name })`이 가능하면 그 쪽을 우선
17. **`tests/e2e/a11y/*.a11y.spec.ts`** — 공개 라우트 접근성 게이트. 인증 불필요 페이지만 대상이므로 `auth.fixture` 대신 `@playwright/test` 직접 import 정당. `playwright.a11y.config.ts` 전용 설정 사용.
