# E2E Testing Patterns

> 이 파일은 CLAUDE.md에서 분리된 상세 참조 문서입니다.

### Auth Architecture (Setup Project + storageState)

**실행 순서**: `globalSetup` → `setup` project (auth.setup.ts) → browser projects → `globalTeardown`

| 파일                                        | 역할                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `tests/e2e/auth.setup.ts`                   | 5개 역할 browser-native 로그인 → `.auth/*.json` storageState 저장         |
| `tests/e2e/shared/fixtures/auth.fixture.ts` | storageState 파일 로드 → 역할별 인증 Page 제공                            |
| `playwright.config.ts`                      | `setup` project + `dependencies: ['setup']`                               |
| `tests/e2e/global-setup.ts`                 | Health check (Backend/Frontend), 시드 데이터 로딩, `.auth/` 디렉토리 보장 |

**Fixtures**: `testOperatorPage`, `techManagerPage`, `qualityManagerPage`, `siteAdminPage`, `systemAdminPage`

### E2E Auth Rules (CRITICAL)

1. **storageState 기반 인증 — loginAs() 사용 금지**
   - 모든 테스트는 `auth.fixture.ts`의 fixture 사용
   - 직접 로그인 코드 작성 금지 (`loginAs`, `signIn`, `page.goto('/login')` 등)

2. **새 역할/팀 추가 시**
   - `auth.setup.ts`의 ROLES 배열에 추가
   - `auth.fixture.ts`의 STORAGE_STATE와 AuthFixtures 인터페이스에 추가
   - 절대 spec 파일에서 직접 로그인하지 않음

3. **Backend API 직접 호출 시**
   - `getBackendToken()` 사용 (checkout-helpers.ts)
   - storageState와는 별도 — NextAuth 세션이 아닌 raw JWT 반환

### Test Template

```typescript
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Feature Name', () => {
  test.describe.configure({ mode: 'serial' }); // 상태 변경 테스트만

  test('TC-01: description', async ({ techManagerPage: page }) => {
    await page.goto('/target-page');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '승인' }).click();
    await expect(page.getByText('성공')).toBeVisible();
  });
});
```

### Test Isolation

- `fullyParallel: true` → 상태 변경 테스트는 `test.describe.configure({ mode: 'serial' })`
- UUID 상수: `backend/src/database/utils/uuid-constants.ts`
- 체크아웃 ID 격리: c2(승인용: 001,002,003,005) ≠ c3(반려용: 004,006,007,008,015)
- Overdue checkout(056+)는 승인/반려 버튼 없음 — 승인 테스트에 사용 금지

### Anti-Patterns

| ❌ 잘못된 패턴                       | ✅ 올바른 패턴                                |
| ------------------------------------ | --------------------------------------------- |
| `loginAs(page, role)`                | `auth.fixture.ts` fixture 사용                |
| `page.goto('/login')` in spec        | `auth.setup.ts`가 처리 (Setup Project)        |
| `waitForTimeout(1000)`               | `waitForURL` + locator assertion              |
| `page.locator('[role="dialog"]')`    | `page.getByRole('dialog', { name: 'Title' })` |
| `page.waitForFunction()`             | `await expect(locator).toBeVisible()`         |
| `locator1.or(locator2)` (둘 다 표시) | 조건부 분기                                   |
| 체크아웃 ID 공유                     | 스위트별 격리                                 |
| "반입 처리" `getByRole('button')`    | `getByRole('link')` (HTML `<a>` 태그)         |

### global-setup System Trigger API — 역할 선택 가이드

**원칙:** `global-setup.ts`에서 시스템 트리거 API(예: overdue 체크, 캐시 워밍 등 변경 권한 필요 작업)를 호출할 때는 **`technical_manager` 토큰을 사용**한다.

**근거:**

- 시스템 트리거 API는 일반적으로 `Permission.UPDATE_EQUIPMENT` 또는 그 이상의 권한을 요구.
- `system_admin`은 RBAC 최상위 권한이지만 일상 시스템 작업에 사용하면 권한 leak 위험 (audit log에서 admin 액션이 setup 잡음으로 분류됨).
- `technical_manager`는 모든 도메인 변경 권한을 가지며 운영자 페르소나에 가까워 setup 컨텍스트에 적합.
- `lab_manager` / `test_engineer`는 권한 부족(403) 가능성.

**적용 예시 — `tests/e2e/global-setup.ts`:**

```typescript
// ✅ CORRECT — technical_manager 토큰으로 시스템 트리거
const tmToken = await loginAs('technical_manager');
await fetch(`${API}/checkouts/trigger-overdue-check`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${tmToken}` },
});

// ❌ WRONG — system_admin 토큰 사용
const adminToken = await loginAs('system_admin'); // 권한 over-grant + audit 잡음
```

**관련 파일:**

- `tests/e2e/global-setup.ts:122` — overdue 트리거 호출 (technical_manager 사용)
