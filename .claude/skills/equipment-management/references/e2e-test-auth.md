# E2E 테스트 인증 가이드

**작성일**: 2026-02-12
**아키텍처**: Setup Project + storageState (Playwright 공식 패턴)

---

## 개요

Playwright E2E 테스트는 **Setup Project + storageState** 기반 인증을 사용합니다.

**핵심 원칙**: NextAuth를 "단일 인증 소스(SSOT)"로 사용하며, 실제 프로덕션과 동일한 browser-native 로그인 플로우를 통해 인증 상태를 생성합니다.

### 실행 순서

```
globalSetup (health check, seed data, .auth/ 디렉토리)
  → setup project (auth.setup.ts — 5개 역할 browser-native 로그인)
    → browser projects (chromium, firefox, webkit — storageState 로드)
      → globalTeardown (cleanup)
```

---

## 기존 방식의 근본 결함 (loginAs)

기존 `loginAs()` API 기반 인증에는 3가지 근본적 문제가 있었습니다:

### 1. Per-test 로그인 반복

```typescript
// ❌ 기존: 매 테스트마다 ~2초 로그인 오버헤드
testOperatorPage: async ({ browser }, use) => {
  const page = await context.newPage();
  await loginAs(page, 'test_engineer'); // CSRF + callback + goto + waitForTimeout
  await use(page);
};
```

256개 테스트 × 2초 = **~8분 순수 로그인 대기 시간**.

### 2. 수동 쿠키 파싱

```typescript
// ❌ 기존: Set-Cookie 헤더를 직접 파싱 — 브라우저 구현 차이로 깨짐
const setCookieHeaders = loginResponse.headers()['set-cookie'];
const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
  const parts = cookieStr.split(';');
  const [name, ...valueParts] = parts[0].split('=');
  return { name: name.trim(), value: valueParts.join('='), domain: 'localhost', path: '/' };
});
await page.context().addCookies(cookies);
```

### 3. 비결정적 대기

```typescript
// ❌ 기존: 하드코딩된 1초 대기 — CI에서 간헐적 실패
await page.goto('/');
await page.waitForTimeout(1000);
```

---

## 해결 방법: Setup Project + storageState

### 아키텍처 개요

| 파일                                        | 역할                                                 | 실행 시점           |
| ------------------------------------------- | ---------------------------------------------------- | ------------------- |
| `tests/e2e/global-setup.ts`                 | Health check, 시드 데이터, `.auth/` 디렉토리 보장    | 최초 1회            |
| `tests/e2e/auth.setup.ts`                   | 5개 역할 browser-native 로그인 → `.auth/*.json` 저장 | setup project (1회) |
| `tests/e2e/shared/fixtures/auth.fixture.ts` | storageState 파일 로드 → 역할별 인증된 Page 제공     | 테스트마다 (~30ms)  |
| `playwright.config.ts`                      | `setup` project 정의 + `dependencies: ['setup']`     | 설정                |

### 장점

| 항목              | 기존 (loginAs)         | 현재 (storageState)  |
| ----------------- | ---------------------- | -------------------- |
| 로그인 횟수       | 테스트당 1회           | 전체 1회 (5개 역할)  |
| 쿠키 처리         | 수동 Set-Cookie 파싱   | 브라우저 자체 처리   |
| CSRF 관리         | 수동 GET + form submit | signIn()이 자동 처리 |
| 대기 방식         | `waitForTimeout(1000)` | `waitForURL('/')`    |
| 테스트당 오버헤드 | ~2초                   | ~30ms (파일 로드)    |

---

## 구현 상세

### 1. auth.setup.ts (Setup Project)

**파일**: `apps/frontend/tests/e2e/auth.setup.ts`

5개 역할에 대해 browser-native 로그인을 수행하고 storageState를 저장합니다.

```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '.auth');

const ROLES = [
  { role: 'test_engineer', label: '시험실무자', file: 'test-engineer.json' },
  { role: 'technical_manager', label: '기술책임자', file: 'technical-manager.json' },
  { role: 'quality_manager', label: '품질책임자', file: 'quality-manager.json' },
  { role: 'lab_manager', label: '시험소장', file: 'lab-manager.json' },
  { role: 'system_admin', label: '시스템 관리자', file: 'system-admin.json' },
] as const;

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

for (const { role, label, file } of ROLES) {
  const outputPath = path.join(AUTH_DIR, file);

  setup(`authenticate as ${role}`, async ({ page }) => {
    // 1. 로그인 페이지 이동
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 2. DevLoginButtons의 역할 버튼 클릭
    const button = page.getByRole('button', { name: label });
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();

    // 3. NextAuth redirect 완료 대기 (로그인 → 대시보드)
    await page.waitForURL('/', { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/);

    // 4. storageState 저장 (쿠키 + localStorage)
    await page.context().storageState({ path: outputPath });
  });
}
```

**핵심 포인트**:

- `page.goto('/login')` → DevLoginButtons 렌더링 대기
- `getByRole('button', { name: label })` → 한국어 역할명 매칭
- `waitForURL('/')` → NextAuth redirect 완료의 결정적 감지
- `storageState({ path })` → 쿠키 + localStorage를 JSON으로 저장

### 2. playwright.config.ts

```typescript
projects: [
  // Setup Project: auth.setup.ts 1회 실행
  {
    name: 'setup',
    testMatch: /auth\.setup\.ts/,
  },
  // Browser projects: setup 완료 후 실행
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['setup'],
  },
  // firefox, webkit, Mobile Chrome, Mobile Safari도 동일
],
```

**`dependencies: ['setup']`**: 모든 browser project는 setup project 완료를 보장한 후 실행됩니다.

### 3. auth.fixture.ts (테스트 Fixture)

**파일**: `apps/frontend/tests/e2e/shared/fixtures/auth.fixture.ts`

storageState 파일을 로드하여 역할별 인증된 Page를 제공합니다.

```typescript
import { test as base, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.join(__dirname, '../../.auth');

const STORAGE_STATE = {
  test_engineer: path.join(AUTH_DIR, 'test-engineer.json'),
  technical_manager: path.join(AUTH_DIR, 'technical-manager.json'),
  quality_manager: path.join(AUTH_DIR, 'quality-manager.json'),
  lab_manager: path.join(AUTH_DIR, 'lab-manager.json'),
  system_admin: path.join(AUTH_DIR, 'system-admin.json'),
} as const;

interface AuthFixtures {
  testOperatorPage: Page; // 시험실무자
  techManagerPage: Page; // 기술책임자
  qualityManagerPage: Page; // 품질책임자
  siteAdminPage: Page; // 시험소 관리자
  systemAdminPage: Page; // 시스템 관리자
}

async function createAuthenticatedPage(
  browser: import('@playwright/test').Browser,
  storageStatePath: string
) {
  if (!fs.existsSync(storageStatePath)) {
    throw new Error(
      `[Auth Fixture] storageState 파일 없음: ${storageStatePath}\n` +
        `Setup project가 실행되지 않았습니다.\n` +
        `실행: npx playwright test --project=setup`
    );
  }
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const context = await browser.newContext({ baseURL, storageState: storageStatePath });
  const page = await context.newPage();
  return { context, page };
}

export const test = base.extend<AuthFixtures>({
  testOperatorPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(browser, STORAGE_STATE.test_engineer);
    await use(page);
    await context.close();
  },
  techManagerPage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(
      browser,
      STORAGE_STATE.technical_manager
    );
    await use(page);
    await context.close();
  },
  // qualityManagerPage, siteAdminPage, systemAdminPage도 동일 패턴
});

export { expect } from '@playwright/test';
```

**핵심 포인트**:

- `browser.newContext({ storageState })`: 파일에서 쿠키/localStorage를 로드한 새 컨텍스트 생성
- 각 fixture는 독립적인 브라우저 컨텍스트 → 테스트 간 격리
- `await context.close()`: 테스트 완료 후 리소스 정리

### 4. global-setup.ts

**파일**: `apps/frontend/tests/e2e/global-setup.ts`

```typescript
async function globalSetup(config: FullConfig) {
  // 1. .auth 디렉토리 보장
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // 2. Health checks (Backend 5회 재시도 — 필수, Frontend 3회 — 필수)
  await checkHealth(`${apiURL}/api/monitoring/health`, 'Backend API', 5, 3000, true);
  await checkHealth(`${baseURL}/login`, 'Frontend', 3, 2000, true);

  // 3. 테스트 시드 데이터 로딩
  execSync(`cd ../backend && npx ts-node src/database/seed-test-new.ts`, { ... });
}
```

**실행 순서**: globalSetup → setup project (auth.setup.ts) → browser projects

---

## 인증 플로우 다이어그램

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ auth.setup  │     │  /login 페이지 │     │   NextAuth   │     │   Backend    │
│ (1회 실행)   │     │ DevLoginBtns │     │  Callback    │     │ /test-login  │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │                    │
       │ 1. goto('/login')  │                     │                    │
       │───────────────────▶│                     │                    │
       │                    │                     │                    │
       │ 2. click('시험실무자') │                   │                    │
       │───────────────────▶│                     │                    │
       │                    │                     │                    │
       │                    │ 3. signIn('test-login', { role })        │
       │                    │────────────────────▶│                    │
       │                    │                     │                    │
       │                    │                     │ 4. authorize(role) │
       │                    │                     │───────────────────▶│
       │                    │                     │                    │
       │                    │                     │ 5. user + JWT      │
       │                    │                     │◀───────────────────┤
       │                    │                     │                    │
       │                    │ 6. Set-Cookie (session-token)            │
       │◀────────────────────────────────────────┤                    │
       │                    │                     │                    │
       │ 7. waitForURL('/') │                     │                    │
       │  (redirect 감지)    │                     │                    │
       │                    │                     │                    │
       │ 8. storageState({ path: '.auth/test-engineer.json' })        │
       │  (쿠키 + localStorage 저장)               │                    │
       │                    │                     │                    │
       ▼                    │                     │                    │
  ┌────────────────┐        │                     │                    │
  │ .auth/*.json   │        │                     │                    │
  │ (5개 파일)      │        │                     │                    │
  └────────┬───────┘        │                     │                    │
           │                │                     │                    │
           ▼                │                     │                    │
  ┌────────────────┐        │                     │                    │
  │ auth.fixture   │        │                     │                    │
  │ (storageState  │        │                     │                    │
  │  파일 로드)     │        │                     │                    │
  └────────────────┘
```

---

## 아키텍처 원칙

### 1. NextAuth = 단일 인증 소스 (SSOT)

```
┌────────────────────────────────────────────────────┐
│                   NextAuth 세션                      │
│            (httpOnly 쿠키에 JWT 저장)                 │
│                                                      │
│  ┌───────────────┬──────────────────┬──────────────┐│
│  ▼               ▼                  ▼              ││
│ Server        Client           API Client          ││
│ Component     Component                            ││
│ getServer     useSession()    getSession()         ││
│ Session                                            ││
└────────────────────────────────────────────────────┘
```

**절대 금지 사항**:

- ❌ `localStorage.getItem('token')` — NextAuth 세션과 동기화 불가
- ❌ `localStorage.setItem('token')` — 이중 인증 소스 발생
- ❌ 쿠키 직접 설정 (`addCookies`) — NextAuth 우회

**권장 사항**:

- ✅ `getSession().accessToken` — NextAuth 세션과 동기화
- ✅ `getServerSession().accessToken` — 서버 사이드에서 안전
- ✅ storageState 기반 인증 — 브라우저가 쿠키 자체 관리

### 2. Setup Project = 1회 실행

auth.setup.ts는 전체 테스트 스위트에서 **1번만** 실행됩니다. browser project들은 `dependencies: ['setup']`으로 setup 완료를 보장합니다.

---

## 역할/팀 추가 가이드

### 새 역할 추가

**1. `auth.setup.ts`의 ROLES 배열에 추가**:

```typescript
const ROLES = [
  // ... 기존 역할
  { role: 'new_role', label: '새 역할 버튼 텍스트', file: 'new-role.json' },
];
```

**2. `auth.fixture.ts`에 추가**:

```typescript
// STORAGE_STATE에 추가
const STORAGE_STATE = {
  // ... 기존
  new_role: path.join(AUTH_DIR, 'new-role.json'),
};

// AuthFixtures 인터페이스에 추가
interface AuthFixtures {
  // ... 기존
  newRolePage: Page;
}

// test.extend에 fixture 추가
export const test = base.extend<AuthFixtures>({
  // ... 기존
  newRolePage: async ({ browser }, use) => {
    const { context, page } = await createAuthenticatedPage(browser, STORAGE_STATE.new_role);
    await use(page);
    await context.close();
  },
});
```

**3. DevLoginButtons에 해당 역할 버튼이 있는지 확인** (없으면 추가)

### 다른 팀으로 로그인

현재 모든 테스트 사용자는 **수원 FCC EMC/RF** 팀 소속입니다. 다른 팀으로 로그인이 필요한 경우:

1. `auth.setup.ts`에 별도 setup 테스트 추가
2. DevLoginButtons에서 팀 선택 후 로그인
3. 별도 storageState 파일로 저장 (예: `tech-manager-uiwang.json`)

---

## Backend API 직접 호출

storageState는 브라우저 인증을 위한 것입니다. 테스트 내에서 Backend API를 직접 호출해야 할 때는 `getBackendToken()`을 사용합니다.

**파일**: `tests/e2e/features/checkouts/helpers/checkout-helpers.ts`

```typescript
// Backend test-login으로 raw JWT 획득
export async function getBackendToken(role: string = 'technical_manager'): Promise<string> {
  const response = await fetch(`http://localhost:3001/api/auth/test-login?role=${role}`);
  const data = await response.json();
  return data.data.access_token;
}

// 사용 예: 테스트 상태 리셋
const token = await getBackendToken('technical_manager');
await fetch(`http://localhost:3001/api/checkouts/${id}/status`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ status: 'pending', version: 1 }),
});
```

**주의**: `getBackendToken()`은 NextAuth 세션과 별개입니다. 브라우저 인증에는 storageState fixture를, Backend 직접 호출에는 `getBackendToken()`을 사용하세요.

---

## 트러블슈팅

### 문제 1: Setup project 실패 — "Timeout exceeded"

**증상**: `authenticate as test_engineer` 테스트가 타임아웃

**원인**: Frontend 또는 Backend가 실행되지 않음

**해결**:

```bash
# 서비스 상태 확인
curl http://localhost:3000/login      # Frontend
curl http://localhost:3001/api/monitoring/health  # Backend

# 서비스 시작
pnpm dev  # 또는 개별 시작
```

### 문제 2: storageState 파일 없음

**증상**: `[Auth Fixture] storageState 파일 없음: .auth/test-engineer.json`

**원인**: Setup project가 실행되지 않았거나 실패

**해결**:

```bash
# Setup project만 재실행
npx playwright test --project=setup

# .auth/ 디렉토리 확인
ls tests/e2e/.auth/
# test-engineer.json  technical-manager.json  quality-manager.json
# lab-manager.json    system-admin.json       site-admin.json
```

### 문제 3: 인증은 되지만 API 호출 실패 (401)

**증상**: 페이지 로드는 성공하지만 API 요청이 401 반환

**원인**: storageState의 토큰이 만료됨 (Access Token 15분 수명)

**해결**:

```bash
# storageState 재생성
rm -rf tests/e2e/.auth/
npx playwright test --project=setup
```

### 문제 4: DevLoginButtons가 표시되지 않음

**증상**: Setup project에서 역할 버튼을 찾지 못함

**원인**: `NODE_ENV`가 `production`이거나 `ENABLE_LOCAL_AUTH`가 비활성화

**해결**:

```bash
# .env 확인
ENABLE_LOCAL_AUTH=true
NODE_ENV=development
```

### 문제 5: 특정 browser project에서만 인증 실패

**증상**: chromium은 통과하지만 firefox/webkit에서 실패

**원인**: storageState 파일이 있지만 해당 브라우저에서 쿠키 형식 비호환

**해결**: `.auth/` 디렉토리를 삭제하고 setup project 재실행

---

## 체크리스트

새 E2E 테스트 작성 시:

- [ ] `auth.fixture.ts`에서 `test`와 `expect`를 import
- [ ] 역할별 fixture 사용 (`testOperatorPage`, `techManagerPage` 등)
- [ ] spec 파일에서 직접 로그인하지 않음
- [ ] `waitForTimeout` 사용하지 않음
- [ ] `localStorage`에 토큰 저장하지 않음
- [ ] 상태 변경 테스트는 `test.describe.configure({ mode: 'serial' })`
- [ ] Backend API 직접 호출 시 `getBackendToken()` 사용

새 역할 추가 시:

- [ ] `auth.setup.ts` ROLES 배열에 추가
- [ ] `auth.fixture.ts` STORAGE_STATE + AuthFixtures + test.extend에 추가
- [ ] DevLoginButtons에 해당 역할 버튼 존재 확인

---

## 참고 자료

- **Playwright 공식 문서 (Authentication)**: https://playwright.dev/docs/auth
- **인증 아키텍처 가이드**: `references/auth-architecture.md`
- **프로젝트 인증 설정**: `apps/frontend/lib/auth.ts`
- **테스트 Setup**: `apps/frontend/tests/e2e/auth.setup.ts`
- **테스트 Fixture**: `apps/frontend/tests/e2e/shared/fixtures/auth.fixture.ts`

---

**최종 수정일**: 2026-02-12
**아키텍처**: Setup Project + storageState
**버전**: 2.0.0
