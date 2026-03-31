---
name: verify-e2e
description: Verifies E2E test code compliance AND architectural coverage — auth fixture usage, locator patterns, SSOT constants, test isolation, plus architecture-level checks (CAS VERSION_CONFLICT scenarios, cache invalidation after mutation, site access control on mutations). Run after adding/modifying E2E test specs.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 spec 파일명 또는 feature 디렉토리]'
---

# E2E 테스트 패턴 검증

## Purpose

Playwright E2E 테스트 코드가 프로젝트 규칙을 올바르게 준수하는지 검증합니다:

1. **Auth Fixture 사용** — `auth.fixture.ts`의 storageState 기반 fixture 사용, `loginAs()` / 직접 로그인 금지
2. **networkidle 금지** — `waitForLoadState('networkidle')` 사용 금지 (Next.js HMR 차단)
3. **waitForTimeout 금지** — `waitForTimeout()` 대신 locator assertion 사용
4. **Locator 패턴** — `getByRole` 우선, raw CSS selector / `page.locator('[role="..."]')` 지양
5. **Import 소스** — spec 파일은 `auth.fixture`에서 `test, expect` import
6. **SSOT 상수** — UUID 하드코딩 금지, `shared-test-data.ts` 또는 `uuid-constants.ts` 사용
7. **테스트 격리** — 상태 변경 테스트에 `mode: 'serial'` 설정, 캐시 클리어 호출
8. **Backend 토큰** — `getBackendToken()` 캐싱 사용, 직접 test-login 호출 금지

## When to Run

- E2E 테스트를 새로 작성한 후
- 기존 E2E 테스트를 수정한 후
- E2E 헬퍼 함수를 추가/수정한 후
- PR 전 E2E 코드 점검 시

## Related Files

| File | Purpose |
|------|---------|
| `apps/frontend/tests/e2e/shared/fixtures/auth.fixture.ts` | storageState 기반 인증 fixture |
| `apps/frontend/tests/e2e/auth.setup.ts` | Setup project — 역할별 로그인 수행 |
| `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts` | 테스트 데이터 SSOT (IDs, URLs, Timeouts) |
| `apps/frontend/tests/e2e/shared/helpers/api-helpers.ts` | 토큰 캐싱(getBackendToken, fetchBackendToken), 캐시 클리어 헬퍼 |
| `apps/frontend/tests/e2e/global-setup.ts` | 글로벌 설정 (시드 + overdue check 트리거, fetchBackendToken 사용) |
| `apps/frontend/tests/e2e/shared/helpers/approval-helpers.ts` | 승인 API 헬퍼 (CAS-Aware) |
| `apps/frontend/tests/e2e/shared/helpers/navigation.ts` | 네비게이션 헬퍼 |
| `apps/frontend/tests/e2e/shared/helpers/dialog.ts` | 다이얼로그 상호작용 헬퍼 |
| `apps/frontend/tests/e2e/common/status-badge-update/helpers/navigation.ts` | status-badge-update 전용 네비게이션 헬퍼 |
| `apps/frontend/tests/e2e/features/checkouts/helpers/checkout-helpers.ts` | 체크아웃 헬퍼 (getBackendToken re-export) |
| `apps/backend/src/database/utils/uuid-constants.ts` | 백엔드 UUID 상수 SSOT |
| `.claude/skills/playwright-e2e/LEARNINGS.md` | E2E 스킬 경험 기록 |

## Workflow

### Step 1: Auth Fixture 사용 검증

spec 파일에서 `auth.fixture.ts`의 fixture를 사용하는지 확인합니다.

```bash
# loginAs 패턴 사용 탐지 (금지)
grep -rn "loginAs\|signIn\|login(" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "auth.setup.ts\|auth-role-access\|// "
```

**PASS 기준:** 0건 — spec 파일에서 `loginAs()` 호출 없어야 함.

```bash
# spec 파일에서 직접 /login 페이지 접근 탐지 (금지)
grep -rn "goto.*['\"].*\/login" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "auth.setup.ts\|auth.spec.ts\|auth-token-sync\|auth-role-access\|// "
```

**PASS 기준:** 0건 — auth 테스트 파일 이외에서 `/login` 직접 접근 없어야 함.

### Step 2: Import 소스 검증

spec 파일이 `@playwright/test`가 아닌 `auth.fixture`에서 `test, expect`를 import하는지 확인합니다.

```bash
# spec 파일에서 @playwright/test 직접 import 탐지
grep -rn "from '@playwright/test'" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "auth.setup.ts\|auth.spec.ts\|auth-token-sync\|auth-role-access\|security.spec\|overdue-auto-nc\|seed-\|equipment-seed\|checkout-seed\|manual-test-seed\|accessibility.spec"
```

**PASS 기준:** 0건 — 예외 파일 외 모든 spec 파일은 `auth.fixture`에서 import.

**FAIL 기준:** spec 파일에서 `@playwright/test` 직접 import → fixture 기반 인증이 누락됨.

**예외:** auth 테스트, 보안 테스트, API 전용 테스트(overdue-auto-nc), seed 파일, 접근성 테스트(커스텀 fixture extend)는 `@playwright/test` 직접 import 허용.

### Step 3: networkidle 사용 금지

`waitForLoadState('networkidle')` 또는 `waitUntil: 'networkidle'`을 탐지합니다.
Next.js dev 서버의 HMR WebSocket이 idle 상태를 차단하여 2분 타임아웃을 유발합니다.

```bash
# networkidle 사용 탐지
grep -rn "networkidle" apps/frontend/tests/e2e --include="*.ts"
```

**PASS 기준:** 0건.

**FAIL 기준:** `networkidle` 사용 → `domcontentloaded` + 요소 대기(`expect(locator).toBeVisible()`)로 교체 필요.

```typescript
// ❌ WRONG — HMR WebSocket이 idle 방해 → 2분 타임아웃
await page.waitForLoadState('networkidle');
await page.goto('/equipment', { waitUntil: 'networkidle' });

// ✅ CORRECT — 구체적 요소 대기
await page.goto('/equipment');
await expect(page.getByRole('heading', { name: '장비 목록' })).toBeVisible();
```

### Step 4: waitForTimeout 사용 탐지

`page.waitForTimeout()` 사용을 탐지합니다.
명시적 타임아웃 대기는 테스트를 느리고 불안정하게 만듭니다.

```bash
# waitForTimeout 사용 탐지
grep -rn "waitForTimeout" apps/frontend/tests/e2e --include="*.ts"
```

**PASS 기준:** 0건.

**FAIL 기준:** `waitForTimeout()` 사용 → locator assertion이나 `waitForURL`로 교체 권장.

```typescript
// ❌ WRONG — 임의의 대기 시간
await page.waitForTimeout(1000);
await page.click('.button');

// ✅ CORRECT — 조건부 대기
await expect(page.getByRole('button', { name: '승인' })).toBeEnabled();
await page.getByRole('button', { name: '승인' }).click();
```

**예외:** 헬퍼 함수(`dialog.ts` 등)에서 애니메이션 대기용 짧은 `waitForTimeout(200~500)`은 경고 수준으로만 보고. 단, 신규 코드에서는 `waitFor`나 locator assertion 사용을 권장.

### Step 5: Locator 안티패턴 탐지

프로젝트 규칙에 맞지 않는 locator 패턴을 탐지합니다.

```bash
# [role="..."] CSS selector 패턴 탐지 (getByRole 사용해야 함)
grep -rn 'locator.*\[role=' apps/frontend/tests/e2e --include="*.ts" | grep -v "// "
```

**PASS 기준:** 0건 — `page.locator('[role="dialog"]')` 대신 `page.getByRole('dialog', { name: '...' })` 사용.

```bash
# page.waitForFunction 사용 탐지 (locator assertion 사용해야 함)
grep -rn "waitForFunction" apps/frontend/tests/e2e --include="*.ts" | grep -v "// "
```

**PASS 기준:** 0건.

```bash
# locator1.or(locator2) 패턴 탐지 (둘 다 표시되는 경우 문제)
grep -rn "\.or(" apps/frontend/tests/e2e --include="*.ts" | grep -v "// \|emptyState\|empty"
```

**참고:** `emptyState.or(dataList)` 같은 "목록 또는 빈 상태 대기" 패턴은 정상. 그 외 `.or()` 사용은 검토 필요.

### Step 6: UUID 하드코딩 탐지

spec 파일에서 UUID를 직접 하드코딩하는 패턴을 탐지합니다.

```bash
# spec 파일에서 UUID 리터럴 하드코딩 탐지
grep -rn "'[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}'" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "// \|import "
```

**PASS 기준:** 0건 — spec 파일에서 UUID 직접 사용 없이 `shared-test-data.ts` 또는 `uuid-constants.ts`에서 import.

**FAIL 기준:** spec 파일에 UUID 리터럴 → 상수로 추출하여 SSOT 유지.

**예외:** 헬퍼 파일(`helpers/*.ts`, `constants/*.ts`)의 UUID 정의는 정상 (SSOT 역할).

### Step 7: 상태 변경 테스트 격리

상태를 변경하는 테스트 스위트(승인, 반려, 생성 등)에 `mode: 'serial'`이 설정되어 있는지 확인합니다.

```bash
# 상태 변경 키워드가 있는 spec 파일 목록
grep -rln "approve\|reject\|create\|delete\|cancel" apps/frontend/tests/e2e --include="*.spec.ts" | head -20
```

```bash
# 위 파일들 중 serial 모드 미설정 파일 탐지
for f in $(grep -rln "approve\|reject\|\.click.*승인\|\.click.*반려" apps/frontend/tests/e2e --include="*.spec.ts" | head -20); do
  grep -L "mode.*serial" "$f" 2>/dev/null
done
```

**참고:** 모든 상태 변경 테스트에 반드시 serial이 필요한 것은 아닙니다(단일 테스트 케이스만 있는 경우 등). 여러 상태 변경 테스트가 순서 의존적인 경우에만 FAIL로 판단합니다.

### Step 8: Backend 캐시 클리어 검증

DB 직접 리셋 후 `clearBackendCache()`를 호출하는지 확인합니다.

```bash
# DB 직접 접근하는 헬퍼에서 clearBackendCache 호출 확인
grep -rn "pool.query.*UPDATE\|pool.query.*DELETE\|pool.query.*INSERT" apps/frontend/tests/e2e --include="*.ts" -l | xargs grep -L "clearBackendCache" 2>/dev/null
```

**PASS 기준:** DB 직접 수정하는 모든 헬퍼 파일이 `clearBackendCache()` import/호출.

**FAIL 기준:** DB 수정 후 캐시 클리어 없음 → 백엔드 인메모리 캐시가 stale 데이터 반환.

### Step 9: Backend 토큰 직접 호출 탐지

`getBackendToken()` (Page 기반) 또는 `fetchBackendToken()` (Node fetch 기반) 대신 test-login 엔드포인트를 직접 호출하는 패턴을 탐지합니다.

```bash
# test-login 엔드포인트 직접 호출 탐지 (SSOT 헬퍼 사용해야 함)
grep -rn "test-login" apps/frontend/tests/e2e --include="*.ts" | grep -v "api-helpers.ts\|// \|getBackendToken\|fetchBackendToken"
```

**PASS 기준:** `api-helpers.ts` 이외에서 `test-login` 직접 호출 없어야 함.

**FAIL 기준:** 직접 호출 → rate limit(100/분) 초과 시 429 에러 발생. spec 파일에서는 `getBackendToken(page, role)`, global-setup/beforeAll 등 Page 없는 컨텍스트에서는 `fetchBackendToken(role)` 사용.

### Step 10: Backend URL 하드코딩 탐지

`http://localhost:3001` 또는 `http://localhost:3000`을 직접 하드코딩하는 패턴을 탐지합니다.

```bash
# localhost URL 하드코딩 탐지
grep -rn "localhost:3001\|localhost:3000" apps/frontend/tests/e2e --include="*.ts" | grep -v "shared-test-data.ts\|constants/\|// \|process\.env"
```

**PASS 기준:** `shared-test-data.ts`의 `BASE_URLS` 이외에서 URL 하드코딩 없어야 함.

**FAIL 기준:** 하드코딩 URL → 환경에 따라 테스트 실패. `BASE_URLS.BACKEND`/`BASE_URLS.FRONTEND` 사용.

### Step 11b: shared-test-data.ts의 TEST_USERS_BY_TEAM import 확인

`shared-test-data.ts`가 `TEST_USERS_BY_TEAM`을 `@equipment-management/shared-constants`에서 import하는지 확인합니다.

```bash
# shared-test-data.ts에서 TEST_USERS_BY_TEAM import 확인
grep -rn "import.*TEST_USERS_BY_TEAM.*@equipment-management/shared-constants" apps/frontend/tests/e2e/shared/constants/shared-test-data.ts
```

**PASS 기준:** import 존재 — `TEST_USERS_BY_TEAM`이 `@equipment-management/shared-constants`에서 import됨.

**FAIL 기준:** import 누락 — 이메일 SSOT가 `shared-constants` 패키지와 통합되지 않음. `shared-test-data.ts`에서 테스트 이메일을 로컬 정의하고 있으면 `@equipment-management/shared-constants`의 `TEST_USERS_BY_TEAM`으로 교체 필요.

### Step 11: Pool 정리 검증

DB Pool을 생성하는 헬퍼에서 `cleanupPool()` 또는 `pool.end()`를 export하는지 확인합니다.

```bash
# Pool 생성 파일에서 cleanup 함수 export 확인
grep -rln "new Pool" apps/frontend/tests/e2e --include="*.ts" | xargs grep -L "cleanupPool\|pool\.end\|closePool"
```

**PASS 기준:** Pool을 생성하는 모든 파일이 정리 함수를 export.

**FAIL 기준:** Pool 정리 함수 미제공 → 테스트 종료 시 connection leak.

### Step 12: 아키텍처 시나리오 커버리지 검증

기존 Step 1~11은 테스트 "코드 형식"을 검사한다 (올바른 import, 올바른 locator 패턴 등).
이 Step은 테스트가 실제로 "무엇을 검증하는지" — 즉 아키텍처 관심사를 커버하는지 확인한다.

형식이 완벽해도 내용이 happy-path뿐이면, 테스트가 통과해도 시스템의 정합성은 보장되지 않는다.
CAS 충돌, 캐시 stale, 접근 제어 우회 같은 실제 프로덕션 버그는 이 검사가 잡아야 한다.

#### 12a. CAS 엔티티의 VERSION_CONFLICT 테스트 존재 여부

CAS 엔티티(equipment, checkouts, calibrations, non_conformances, equipment_imports 등)에 대한
뮤테이션 테스트가 있는 feature 디렉토리에서, 409 VERSION_CONFLICT 시나리오도 함께 테스트하는지 확인한다.

```bash
# CAS 관련 뮤테이션 테스트가 있는 feature 디렉토리 목록
FEATURES=$(grep -rln "approve\|reject\|receive\|cancel\|dispose" apps/frontend/tests/e2e/features --include="*.spec.ts" | sed 's|/[^/]*$||' | sort -u)

# 해당 디렉토리에서 409/VERSION_CONFLICT/conflict 테스트 존재 여부
for dir in $FEATURES; do
  HAS_CONFLICT=$(grep -rln "409\|VERSION_CONFLICT\|conflict\|version.*mismatch" "$dir" --include="*.spec.ts" 2>/dev/null | wc -l)
  if [ "$HAS_CONFLICT" -eq 0 ]; then
    echo "WARN: $dir — 뮤테이션 테스트 있지만 VERSION_CONFLICT 시나리오 없음"
  fi
done
```

**PASS 기준:** CAS 뮤테이션이 있는 모든 feature 디렉토리에 최소 1개의 conflict 시나리오 테스트 존재.

**WARN 기준:** 뮤테이션 테스트만 있고 conflict 테스트가 없는 디렉토리 — 테스트 계획 보완 권장.

#### 12b. 뮤테이션 후 캐시 일관성 테스트 존재 여부

뮤테이션(승인, 반려, 생성 등) 후 목록 페이지로 돌아갈 때 데이터가 갱신되는지 검증하는 테스트가 있는지 확인한다.
이 테스트가 없으면 Navigate-Before-Invalidate 버그를 잡을 수 없다.

```bash
# 뮤테이션 후 목록 복귀 패턴 검색 (뮤테이션 → 네비게이션 → 목록 검증)
grep -rn "click.*승인\|click.*반려\|click.*수령\|mutate" apps/frontend/tests/e2e/features --include="*.spec.ts" -l | while read f; do
  # 같은 파일에서 뮤테이션 후 목록 검증이 있는지
  HAS_LIST_CHECK=$(grep -c "goto.*list\|goto.*checkouts\|goto.*equipment[^/]\|getByText.*건\|getByText.*총" "$f" 2>/dev/null)
  if [ "$HAS_LIST_CHECK" -eq 0 ]; then
    echo "INFO: $f — 뮤테이션 있지만 목록 복귀 후 데이터 갱신 검증 없음"
  fi
done
```

**PASS 기준:** 뮤테이션 테스트의 50% 이상이 뮤테이션 후 목록/상위 페이지 데이터 갱신을 검증.

**INFO 기준:** 뮤테이션 후 목록 갱신 검증이 없는 파일 — 캐시 무효화 누락 위험.

#### 12c. 사이트 접근 제어 테스트 범위

사이트 격리가 적용된 모듈(equipment, checkouts, equipment-imports 등)에서
GET뿐 아니라 mutation(POST/PATCH/DELETE)에 대한 접근 제어도 테스트하는지 확인한다.

```bash
# 사이트 격리 테스트 파일
SITE_TESTS=$(find apps/frontend/tests/e2e -name "*.spec.ts" | xargs grep -l "site.*isolation\|cross.*site\|enforceSite\|403.*Forbidden\|다른.*사이트" 2>/dev/null)

if [ -z "$SITE_TESTS" ]; then
  echo "WARN: 사이트 접근 제어 테스트 파일이 존재하지 않음"
else
  # mutation 접근 제어 테스트 포함 여부
  HAS_MUTATION=$(echo "$SITE_TESTS" | xargs grep -l "patch\|post\|delete\|approve\|reject" 2>/dev/null | wc -l)
  if [ "$HAS_MUTATION" -eq 0 ]; then
    echo "WARN: 사이트 격리 테스트가 GET만 검증 — mutation(PATCH/POST/DELETE) 접근 제어 미검증"
  fi
fi
```

**PASS 기준:** 사이트 격리 테스트가 GET + mutation 모두 검증.

**WARN 기준:** GET만 검증하거나 테스트 자체가 없음 — 타 사이트 데이터 변조 위험.

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
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **`auth.setup.ts`** — setup project이므로 `@playwright/test` 직접 import, `/login` 접근, `networkidle` 허용
2. **헬퍼 파일(`helpers/*.ts`, `constants/*.ts`)의 UUID 정의** — SSOT 역할이므로 UUID 리터럴 허용
3. **`shared-test-data.ts`의 URL 상수 정의** — `process.env` 폴백으로 URL 정의는 정상
4. **`Promise.race` 내 `waitForTimeout`** — 타임아웃 폴백 용도 (e.g. `page.waitForTimeout(3000).then(() => false)`)는 정당한 사용
5. **`emptyState.or(dataList)` 패턴** — 목록/빈 상태 분기 대기는 올바른 사용
6. **`api-helpers.ts`의 `test-login` 참조** — 토큰 캐싱 헬퍼 내부에서 호출하는 것은 정상 (SSOT)
7. **단일 테스트만 있는 describe 블록에 serial 미설정** — 순서 의존성이 없으면 불필요
8. **`global-setup.ts`, `global-teardown.ts`** — 글로벌 설정 파일은 프로젝트 레벨이므로 대부분 검사에서 제외. localhost 폴백은 정상
9. **`auth.spec.ts`, `auth-token-sync.spec.ts`** — 로그인 플로우 자체를 테스트하므로 `/login` 접근, `@playwright/test` import 허용
10. **`auth-role-access.spec.ts`** — 비인증 상태에서 리다이렉트를 테스트하므로 `@playwright/test` import 의도적
11. **`security.spec.ts`** — API 보안 테스트로 `@playwright/test` import + `test-login` 직접 호출 허용 (refresh_token 등 특수 필드 필요)
12. **`calibration/overdue-auto-nc/` (testIgnore)** — API 전용 테스트로 `@playwright/test` import 정당. `loginToFrontend`는 TODO 상태
13. **seed 파일(`shared/seed/`, `manual-test-seed.spec.ts`)** — 시드 스크립트로 `@playwright/test` import, localhost URL 허용
14. **복합 CSS 셀렉터** — `[role="X"][aria-label="Y"]`, `[role="X"], [class*="Y"]` 등 복합 속성 조합은 `getByRole`로 대체 불가하므로 허용
