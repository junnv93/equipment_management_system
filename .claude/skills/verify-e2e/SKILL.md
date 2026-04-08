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

### Step 5b: Export spec API-only 갭 (35차 추가)

Export 양식 spec(`wf-*-export.spec.ts`, `*-cable-path-loss.spec.ts` 등)이 `page.request.get`/`page.request.post` 으로 **API 응답만** 검증하고 사용자 동선("내보내기" 버튼 → 브라우저 다운로드 트리거)을 cover 하지 않으면 WARN. 31차에서 wf-19b/20b/21 3개 spec이 모두 동일 함정에 빠진 것이 발견됨.

**탐지:**
```bash
# export 키워드 + page.request 사용 + waitForEvent('download') 부재 → WARN
for f in $(grep -lE "UL-QP-1[89]|export|cable-path-loss" apps/frontend/tests/e2e/workflows --include="*.spec.ts" -r); do
  if grep -q "page.request" "$f" && ! grep -q "waitForEvent.*download" "$f"; then
    echo "WARN: $f — API-only export, no UI download flow"
  fi
done
```

**WARN:** 동일 양식의 UI 다운로드 spec이 존재하지 않음 (한 양식당 API + UI 한 쌍 권장).
**FAIL 조건 없음** — 메타 가드. tech-debt-tracker.md 에 누적 트래킹.

**근거:** API-only spec 은 backend regression 만 잡고, 한국어 filename UTF-8, 권한 가드 토스트, dropdown 선택 UX 등 사용자 경험 결함을 0건 cover 한다. WF-21 케이블 spec도 동일 패턴으로 작성되어 31차 후속 부채로 등재됨.

### Step 6: UUID 하드코딩

**PASS:** spec에 UUID 리터럴 0건. `shared-test-data.ts` 또는 constants에서 import.

### Step 7: 상태 변경 테스트 격리

**PASS:** 순서 의존적 상태 변경 테스트에 `mode: 'serial'` 설정.

### Step 8: Backend 캐시 클리어

**PASS:** DB 직접 수정 파일 모두 `clearBackendCache()` 호출.

### Step 9: Backend 토큰 직접 호출

**PASS:** `api-helpers.ts` 외 `test-login` 직접 호출 0건.

### Step 10: Backend URL 하드코딩

**PASS:** `shared-test-data.ts` 외 localhost URL 0건.

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
