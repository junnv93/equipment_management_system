# Auth Fixtures & Actor Rules — verify-e2e references

> 2026-05-03 verify-e2e 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.

---

## Step 20: email 기반 멀티롤 token 주입 + negative 시나리오 assertion

`getBackendTokenByEmail`을 사용하는 E2E spec은 다음 패턴을 준수해야 한다.

### 20a: tokenCache 네임스페이스 격리

`tokenCache` 키가 `'email:' + email` 형태여야 role 기반 키(`'technical_manager'` 등)와 충돌하지 않는다.

```bash
# 'email:' 프리픽스 네임스페이스 확인
grep -A5 "const cacheKey" \
  apps/frontend/tests/e2e/shared/helpers/api-helpers.ts \
  | grep "email:"
# 결과: `email:${email}` 패턴 존재 → PASS
```

### 20b: negative 시나리오 assertion 수준

403(scope/identity 실패) 또는 400(purpose/FSM 불일치) 케이스에서 HTTP 상태 코드 + 에러 코드 문자열을 함께 검증해야 한다.
단순 `expect(resp.ok()).toBeFalsy()`는 실패 — 상태 코드와 에러 코드 `toBe()`가 필수.

```bash
# negative 테스트에서 status + errorCode 모두 검증하는지 확인
grep -A5 "expect(resp.status()).toBe(403\|400)" \
  apps/frontend/tests/e2e/workflows/wf-34-rental-2step-approval.spec.ts
# 403/400 단독 status 체크 → 경고
# status + errorCode toBe() 쌍 → PASS
```

### 20c: storageState 신규 생성 없이 token 주입으로 충분한지

`getBackendTokenByEmail` 사용 시 새 `.auth/*.json` 파일이 추가되지 않아야 한다.

```bash
# storageState 파일 수가 6개 유지되는지
ls apps/frontend/tests/e2e/.auth/*.json | wc -l
# 6 → PASS, 7 이상 → FAIL (신규 storageState 추가 확인 필요)
```

**PASS:** `apiGetWithToken/apiPatchWithToken`이 token 파라미터로 정의되고 borrower 함수들이 이를 경유.
**FAIL:** `apiGet('borrower')` 형태로 role 기반 헬퍼에 존재하지 않는 role 전달, 또는 storageState 기반 context에서 token 헬퍼 혼용.

---

## Step 20d: apiGetWithToken / apiPatchWithToken — role vs token 헬퍼 분리

borrower처럼 storageState가 없는 역할(동적 token 주입)에서 API 호출 시
`apiGet(role)` / `apiPatch(role)` 대신 `apiGetWithToken(token)` / `apiPatchWithToken(token)` 헬퍼를 사용해야 한다.
두 헬퍼를 동일 operation에 혼용하면 Authorization 헤더 전략이 충돌한다.

```bash
# workflow-helpers.ts에 apiGetWithToken 정의 확인
grep -n "apiGetWithToken\|apiPatchWithToken" \
  apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts \
  | head -10
# 결과: function apiGetWithToken(token: string) 및 apiPatchWithToken(token: string) → PASS

# borrowerApproveCheckout / borrowerRejectCheckout이 token 헬퍼를 사용하는지 확인
grep -A5 "borrowerApproveCheckout\|borrowerRejectCheckout" \
  apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts \
  | grep "apiGetWithToken\|apiPatchWithToken"
# 결과: 두 함수 모두 token 헬퍼 경유 → PASS

# storageState와 token 주입 혼용 금지 확인
grep -B2 -A2 "apiGet\b\|apiPatch\b" \
  apps/frontend/tests/e2e/workflows/helpers/workflow-helpers.ts \
  | grep -c "borrower"
# 0 → PASS (role 기반 헬퍼에 borrower 혼용 없음)
```

**PASS:** 첫 인자가 token string, `loginAs(role)` 반환값 직접 전달.
**FAIL:** role 문자열을 첫 인자로 전달 (타입 에러이지만 런타임 동작은 가능).

---

## Step 20e: 로그인 폼 E2E 자격증명 — DEV_*_PASSWORD 환경변수 + fallback SSOT

로그인 폼 UI를 직접 테스트하는 spec(auth-role-access.spec.ts Group 1 등)에서
시드 자격증명을 하드코딩하면 CI 환경 password 변경 시 일괄 수정이 필요하다.
`DEV_*_PASSWORD` 환경변수 + fallback 패턴으로 추출해야 한다.

**올바른 패턴:**
```typescript
// ✅ 파일 상단 상수 — 환경변수 우선, 없으면 시드 fallback
const E2E_PASSWORDS = {
  user: process.env.DEV_USER_PASSWORD ?? 'user123',
  manager: process.env.DEV_MANAGER_PASSWORD ?? 'manager123',
  admin: process.env.DEV_ADMIN_PASSWORD ?? 'admin123',
} as const;

// ✅ 사용
await passwordInput.fill(E2E_PASSWORDS.user);
```

**탐지:**
```bash
# 로그인 폼 spec에 하드코딩 password 리터럴 탐지
grep -rn "\.fill('user123'\|\.fill('manager123'\|\.fill('admin123'" \
  apps/frontend/tests/e2e --include="*.spec.ts" \
  | grep -v "auth.setup\|global-setup"
# → 0건 (E2E_PASSWORDS 상수 경유)

# E2E_PASSWORDS 상수가 DEV_*_PASSWORD 환경변수 경유인지 확인
grep -n "E2E_PASSWORDS\|DEV_USER_PASSWORD\|DEV_MANAGER_PASSWORD\|DEV_ADMIN_PASSWORD" \
  apps/frontend/tests/e2e/features/dashboard/auth-role-access.spec.ts
# → DEV_*_PASSWORD ?? 'fallback' 패턴 존재
```

백엔드 E2E에서 credentials 하드코딩 방지 — `DEV_ADMIN_PASSWORD`, `DEV_MANAGER_PASSWORD` 등 환경변수 경유 + fallback.

**PASS:** `process.env.DEV_*_PASSWORD ?? 'fallback'` 패턴 및 로그인 폼 spec 내 `fill('user123')` / `fill('manager123')` / `fill('admin123')` 리터럴 0건.
**FAIL:** 하드코딩 → `E2E_PASSWORDS` 상수 경유로 교체.

**예외:** `auth.setup.ts` 및 `global-setup.ts` — test-login endpoint 경유 storageState 생성, 패스워드 직접 참조 없음.

---

## Step 21: test.use() describe 스코프 위반 탐지 (2026-04-30 추가)

Playwright의 `test.use()` 호출은 반드시 `test.describe()` 블록의 **직속 자식** 위치에 있어야 한다. `test()` 콜백 내부에서 호출하면 storageState가 이미 확립된 이후이므로 **silently ignored** — 에러도 경고도 없이 잘못된 인증 상태로 테스트가 실행된다.

**위반 패턴 (FC-13~20에서 발견, 2026-04-30 수정):**

```typescript
// ❌ WRONG — test() 내부 test.use()는 Playwright에서 무시됨
test.describe('FC: 여러 역할 묶음', () => {
  test('FC-13: technical_manager', async ({ page }) => {
    test.use({ storageState: 'technical-manager.json' }); // 무시됨!
    await expect(page.getByRole('button')).toBeHidden();
  });
  test('FC-14: quality_manager', async ({ page }) => {
    test.use({ storageState: 'quality-manager.json' });   // 무시됨!
    ...
  });
});

// ✅ CORRECT — 역할별로 describe 분리, test.use()는 describe 직속
test.describe('FC-13: technical_manager — 반려 버튼 fail-closed', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'technical-manager.json') });
  test('FC-13: ...', async ({ page }) => {
    await expect(page.getByRole('button')).toBeHidden();
  });
});
test.describe('FC-14: quality_manager — 승인 버튼 회귀', () => {
  test.use({ storageState: path.join(AUTH_DIR, 'quality-manager.json') });
  test('FC-14: ...', async ({ page }) => { ... });
});
```

**탐지:**

```bash
# test.use() 호출 전체 목록 추출 후 describe 스코프 여부 수동 확인
grep -rn "test\.use({" apps/frontend/tests/e2e --include="*.spec.ts"
# 각 결과에서 해당 라인이 test.describe() 블록 내부의 '직속 자식'인지 확인
# (test() 콜백 내부가 아닌 describe() 바디 직속 위치)
```

```bash
# Node.js 기반 구조적 탐지 (더 신뢰성 높음)
node -e "
const fs = require('fs');
const {execSync} = require('child_process');
const files = execSync('find apps/frontend/tests/e2e -name \"*.spec.ts\" 2>/dev/null')
  .toString().trim().split('\n').filter(Boolean);
let issues = [];
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf-8').split('\n');
  let insideTest = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s*test\s*\(/.test(l) && !/test\.describe/.test(l) && !/test\.use/.test(l) && !/test\.beforeEach/.test(l) && !/test\.afterEach/.test(l) && !/test\.only/.test(l) || /^\s*test\.only\s*\(/.test(l)) {
      insideTest++;
    }
    if (insideTest > 0 && /test\.use\s*\(/.test(l)) {
      issues.push(f + ':' + (i+1) + ' — test.use() inside test() body (silently ignored)');
    }
    if (insideTest > 0 && /^\s*\}\s*\)\s*;?\s*$/.test(l)) insideTest = Math.max(0, insideTest - 1);
  }
}
console.log(issues.length ? 'FAIL:\n' + issues.join('\n') : 'PASS: all test.use() at describe() scope');
"
```

**PASS:** `PASS: all test.use() at describe() scope`. **FAIL:** 위반 파일:라인 목록 출력.

**수정 패턴:**
동일 `describe()` 블록에 여러 역할이 묶인 경우 → 역할별로 별도 `describe()` 블록으로 분리하고, 각 `describe()` 바디에 `test.use()` 배치.

**예외:** `test.describe.configure()` 호출(`mode: 'serial'` 설정)은 `test.use()`와 다르며 `describe()` 내부 어느 위치든 허용.

---

## Step 23: TestRole 4-place SSOT 정합성 (2026-05-01 추가)

> **2026-05-01 자동화 승격 (senior-permission-ssot-20260501 Phase 3):**
> 본 Step의 grep 명령은 보조 수단으로 강등됨. 1차 검증은 자동 정적 분석:
> ```bash
> pnpm --filter backend run verify:e2e-actors  # R3 룰 = Step 23 strict
> ```
> pre-push hook이 자동 실행. R3 위반 시 push 차단.

`apps/backend/test/helpers/test-auth.ts`의 `TestRole` 유니언 타입에 새 역할을 추가할 때, **반드시 다음 4곳의 `Record<TestRole, ...>` 매핑을 동시 갱신**해야 한다. 누락 시 `Record<TestRole, T>` 타입 강제로 컴파일 에러는 발생하나, `TEST_USER_DETAILS` 배열은 `as const` 튜플이라 타입 강제 없이 silent omission 위험.

**4곳 SSOT (test-auth.ts):**

```typescript
// 1. CANONICAL_ROLE: TestRole → canonical UserRole
const CANONICAL_ROLE: Record<TestRole, string> = {
  admin: 'lab_manager',
  manager: 'technical_manager',
  user: 'test_engineer',
  systemAdmin: 'system_admin',  // ← 신규 추가 시
};

// 2. TEST_USERS: TestRole → email
export const TEST_USERS: Record<TestRole, { email: string }> = {
  // ... systemAdmin: { email: DEFAULT_ROLE_EMAILS['system_admin'] }
};

// 3. TEST_USER_IDS: TestRole → UUID
export const TEST_USER_IDS: Record<TestRole, string> = {
  // ... systemAdmin: USER_SYSTEM_ADMIN_ID
};

// 4. TEST_USER_DETAILS: 시드 entry array (jest-global-setup이 사용)
export const TEST_USER_DETAILS = [
  // ... { id: TEST_USER_IDS.systemAdmin, email: ..., role: 'system_admin', site, location, teamId }
] as const;
```

**탐지:**

```bash
# TestRole 정의 확인
grep -n "export type TestRole" apps/backend/test/helpers/test-auth.ts
# 출력 예: export type TestRole = 'admin' | 'manager' | 'user' | 'systemAdmin';

# 4곳 매핑 entry 수 일치 확인 (TestRole 멤버 수 = N이면 각 매핑도 N entry)
grep -c "^\s*\(admin\|manager\|user\|systemAdmin\):" apps/backend/test/helpers/test-auth.ts
# 정합 시: CANONICAL_ROLE(N) + TEST_USERS(N) + TEST_USER_IDS(N) = 3N 출력

# TEST_USER_DETAILS 배열 길이 = TestRole 멤버 수 일치 확인
grep -c "id: TEST_USER_IDS\." apps/backend/test/helpers/test-auth.ts
# 결과 = TestRole 멤버 수와 일치해야 PASS
```

**SSOT 의존성:**
- `DEFAULT_ROLE_EMAILS[<canonical_role>]` (`packages/shared-constants/src/test-users.ts`) — email 파생
- `USER_<ROLE>_ID` 상수 (`apps/backend/src/database/utils/uuid-constants.ts`) — UUID 파생

**위반 시 영향:**
- CANONICAL_ROLE 누락 → `loginAs(app, '<role>')` 런타임 실패 (`canonicalRole === undefined`)
- TEST_USER_IDS 누락 → spec 파일에서 `TEST_USER_IDS.<role>` undefined → silent test 실패
- TEST_USER_DETAILS 누락 → jest-global-setup이 해당 사용자 시딩 안 함 → loginAs() 401

**발생 이력 (2026-05-01):** stale-contract-cleanup 세션에서 `systemAdmin` 추가 시 4곳 동시 갱신 필요. `Record<TestRole, ...>` 강제로 1-3은 자동 검증되나 TEST_USER_DETAILS는 array length 수동 확인 필요.

---

## Step 24: Fixture 권한 격리 패턴 (2026-05-01 추가)

> **2026-05-01 자동화 승격 (senior-permission-ssot-20260501 Phase 3):**
> ```bash
> pnpm --filter backend run verify:e2e-actors  # R2 룰 = Step 24 (WARN: deprecation 진행 추적)
> ```
> Phase 5 codemod 완료 시 R2 WARN 자동 해소.

`apps/backend/test/helpers/test-fixtures.ts`의 fixture 헬퍼(`createTestEquipment`, `createTestCheckout` 등)가 **호출부의 `token` 인자에 의존하면 도메인 권한 정책 변경 시 전체 fixture가 깨진다**. fixture는 setup용이므로 자체 권한 토큰을 발급해 호출부 역할과 분리해야 한다.

**위반 패턴 (UL-QP-18 직무분리 commit 77cb3f37 후 발견):**

```typescript
// ❌ WRONG — 호출부 token에 의존, lab_manager가 CREATE_EQUIPMENT 권한 박탈되면 전체 fixture 회귀
export async function createTestEquipment(app, token: string, overrides?) {
  const response = await request(app.getHttpServer())
    .post(API_ENDPOINTS.EQUIPMENT.CREATE)
    .set('Authorization', `Bearer ${token}`)  // ← 호출부 권한 의존
    .send(data);
  // ...
}
```

```typescript
// ✅ CORRECT — fixture가 자체 setup token 발급 (system_admin 권한 우회)
export async function createTestEquipment(app, _token: string, overrides?) {
  // UL-QP-18 직무분리: system_admin만 직접 등록 가능 (승인 워크플로 우회)
  const creatorToken = await loginAs(app, 'systemAdmin');
  const response = await request(app.getHttpServer())
    .post(API_ENDPOINTS.EQUIPMENT.CREATE)
    .set('Authorization', `Bearer ${creatorToken}`)  // ← 자체 발급 토큰
    .send(data);
  // ...
}
```

**탐지:**

```bash
# fixture 헬퍼 내부에서 인자 token을 직접 사용 + loginAs() 호출 0건 패턴 (위반)
grep -A20 "^export async function create" apps/backend/test/helpers/test-fixtures.ts \
  | grep -B5 "Bearer \${token}" \
  | grep -v "loginAs"
# 결과: 0건 PASS, 1+건이면 WARN (fixture가 호출부 token 의존)

# fixture가 자체 loginAs 발급 패턴 확인
grep -A5 "^export async function create" apps/backend/test/helpers/test-fixtures.ts \
  | grep "loginAs(app,"
# 결과: 자체 토큰 발급 패턴 확인
```

**예외:**
- fixture가 권한 자체를 검증하는 케이스 (예: `assertCannotCreate(token)`) — 의도적 token 인자 사용 허용
- DB 직접 시딩 fixture (request 미호출) — token 무관

**발생 이력 (2026-04-30):** UL-QP-18 직무분리(commit `77cb3f37`) 후 `lab_manager` (admin)가 `CREATE_EQUIPMENT` 권한 박탈. `createTestEquipment(app, accessToken)` 호출 시 14 e2e suite cascading 실패. fixture를 `loginAs(app, 'systemAdmin')` 자체 발급으로 전환하여 해결. `_token` 인자는 시그니처 호환성 위해 보존(deprecation 이연).

---

## Step 25: e2e spec actor token 적절성 — domain-permission spec은 system_admin 사용 금지 (2026-05-01 추가)

> **2026-05-01 자동화 승격 (senior-permission-ssot-20260501 Phase 3):**
> ```bash
> pnpm --filter backend run verify:e2e-actors  # R1 룰 = Step 25 strict
> ```
> pre-push hook이 자동 실행. setup 의도 화이트리스트: `loginAs(*, 'systemAdmin')` 직전
> 1~5 라인에 `// setup` 또는 `// fixture` 의도 주석이 있으면 화이트리스트 (의도 명시 필수).

E2E spec의 `accessToken = loginAs('systemAdmin')` 사용은 **모든 site/team/role scope 검증을 우회**한다. 도메인 권한·scope 검증을 본 의도로 하는 spec은 `'systemAdmin'` 대신 의도된 도메인 역할(`'admin'`/`'manager'`/`'user'`)을 사용해야 검증 의미가 보존된다.

**위반 패턴 (site-permissions.e2e-spec.ts에서 발견):**

```typescript
// ❌ WRONG — site-scope 검증 spec인데 system_admin 사용 → cross-site 차단 분기가 dead code화
adminToken = await loginAs(ctx.app, 'systemAdmin');
const uiwangResponse = await request(...).get('/equipment?site=uiwang')
  .set('Authorization', `Bearer ${adminToken}`);
if (uiwangResponse.status === 200) { ... }
else { expect(uiwangResponse.status).toBe(403); }  // ← system_admin이면 항상 200, 이 분기 절대 실행 안 됨
```

```typescript
// ✅ CORRECT — site-scope 검증은 site-scoped 역할(lab_manager) 토큰 사용
adminToken = await loginAs(ctx.app, 'systemAdmin');     // setup용 (cross-site 인프라 셋업)
labManagerToken = await loginAs(ctx.app, 'admin');     // 검증용 (site-scoped 역할)
const uiwangResponse = await request(...).get('/equipment?site=uiwang')
  .set('Authorization', `Bearer ${labManagerToken}`);  // ← lab_manager가 cross-site 차단되는지 검증
```

**탐지:**

```bash
# permission/scope/role-constraint spec에서 systemAdmin actor 사용 탐지
grep -l "site-permissions\|role-constraint\|permission" apps/backend/test/*.e2e-spec.ts \
  | xargs grep -l "loginAs(ctx.app, 'systemAdmin')"
# 결과: 0건이면 PASS, 1+건이면 spec 의도 재검토 필요

# 워크플로 spec(systemAdmin OK) vs permission spec(systemAdmin 금지) 분리
grep -rn "loginAs(ctx.app, 'systemAdmin')" apps/backend/test/*.e2e-spec.ts | \
  grep -E "(site-permissions|role-constraint|permission)"
# 결과: 0건이면 PASS
```

**적절한 token 매핑 가이드:**

| Spec 의도 | actor token | 근거 |
|---|---|---|
| 워크플로 검증 (NC 생성, checkout 워크플로 등) | `'systemAdmin'` | scope 검증 무관, fixture 일관성 |
| Site-scope 검증 (cross-site 차단) | `'admin'` (lab_manager) | site-scoped 역할 |
| Team-scope 검증 (cross-team 차단) | `'manager'`/`'user'` | team-scoped 역할 |
| Role-constraint 검증 (managerId 지정 등) | `'manager'` (technical_manager) | UPDATE 권한 보유 + scope 준수 |
| Setup/cleanup (fixture 외 직접 호출) | `'systemAdmin'` | 권한 우회 setup 전용 |

**발생 이력 (2026-04-30):** stale-contract-cleanup 세션에서 8 spec 일괄 `'admin'` → `'systemAdmin'` 교체 후 verify-e2e Agent가 `site-permissions.e2e-spec.ts:175` else 분기 dead code화 + `manager-role-constraint.e2e-spec.ts:30` 행위자 검증 약화 발견. labManagerToken/manager 토큰으로 분리 수정.
