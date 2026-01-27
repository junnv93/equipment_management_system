# E2E 테스트 인증 가이드

**작성일**: 2026-01-22
**작성자**: Claude Sonnet 4.5

---

## 개요

이 문서는 Playwright E2E 테스트에서 NextAuth 기반 인증을 올바르게 처리하는 방법을 설명합니다.

**핵심 원칙**: NextAuth를 "단일 인증 소스(Single Source of Truth)"로 사용하여 실제 프로덕션 환경과 동일한 인증 플로우를 테스트합니다.

---

## 문제 상황

### ❌ 잘못된 접근 방식

E2E 테스트에서 백엔드 JWT를 직접 쿠키에 저장하는 방식:

```typescript
// ❌ 이렇게 하지 마세요!
const response = await page.request.get('http://localhost:3001/api/auth/test-login?role=test_engineer');
const data = await response.json();

await page.context().addCookies([{
  name: 'auth-token',
  value: data.access_token,
  domain: 'localhost',
  path: '/',
}]);
```

**문제점**:
1. NextAuth의 인증 플로우를 완전히 우회
2. NextAuth는 자체 세션 토큰(`next-auth.session-token`)을 사용
3. 백엔드 JWT(`auth-token`)를 NextAuth가 인식하지 못함
4. Middleware와 Server Components가 인증 실패로 판단
5. 로그인 페이지로 리다이렉트 발생

**테스트 결과**: 20/24 테스트 실패 (83.3% 실패율)

---

## 해결 방법

### ✅ 올바른 접근 방식

NextAuth의 Credentials callback API를 직접 호출하는 방식:

```typescript
// ✅ 이렇게 하세요!
async function loginAs(page: Page, role: string) {
  // 1. CSRF 토큰 획득
  const csrfResponse = await page.request.get('http://localhost:3000/api/auth/csrf');
  const { csrfToken } = await csrfResponse.json();

  // 2. NextAuth callback API로 POST 요청
  const loginResponse = await page.request.post(
    'http://localhost:3000/api/auth/callback/test-login?callbackUrl=/',
    {
      form: {
        role: role,
        csrfToken: csrfToken,
        json: 'true',
      },
    }
  );

  // 3. 메인 페이지로 이동하여 세션 확인
  await page.goto('/');
}
```

**장점**:
1. ✅ NextAuth의 정상적인 인증 플로우 사용
2. ✅ NextAuth가 세션 생성 및 쿠키 관리 (`next-auth.session-token`)
3. ✅ Middleware, Server Components, Client Components 모두에서 세션 인식
4. ✅ 실제 프로덕션 환경과 동일한 인증 플로우 테스트
5. ✅ "단일 인증 소스(SSOT)" 아키텍처 원칙 준수

**테스트 결과**: 인증 문제 해결, 테스트 통과율 향상

---

## 구현 단계

### 1단계: NextAuth에 테스트용 Provider 추가

**파일**: `apps/frontend/lib/auth.ts`

```typescript
// 환경 변수 확인
const isTest = process.env.NODE_ENV === 'test';

export const authOptions = {
  providers: [
    // ... 기존 providers

    // ✅ E2E 테스트 전용 Provider
    ...(isTest || isDevelopment
      ? [
          CredentialsProvider({
            id: 'test-login',
            name: 'Test Login',
            credentials: {
              role: {
                label: 'Role',
                type: 'text',
                placeholder: 'test_engineer | technical_manager | lab_manager | system_admin'
              },
            },
            async authorize(credentials) {
              if (!credentials?.role) {
                return null;
              }

              // 백엔드 test-login 엔드포인트 호출
              const response = await fetch(
                `${API_BASE_URL}/api/auth/test-login?role=${credentials.role}`
              );

              if (!response.ok()) {
                return null;
              }

              const data = await response.json();

              // NextAuth 세션에 저장할 사용자 정보 반환
              return {
                id: data.user.id || data.user.uuid,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                roles: [data.user.role],
                department: data.user.department,
                site: data.user.site,
                teamId: data.user.teamId,
                accessToken: data.access_token,
              };
            },
          }),
        ]
      : []),
  ],
  // ... 나머지 설정
};
```

**중요 사항**:
- `test-login` provider는 테스트/개발 환경에서만 활성화
- 백엔드 `/api/auth/test-login` 엔드포인트를 호출
- `authorize` 함수에서 백엔드 JWT를 받아서 NextAuth 사용자 객체로 변환
- `site`, `teamId` 등 프로젝트별 필드도 포함

### 2단계: auth.fixture.ts 작성

**파일**: `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

```typescript
import { test as base, Page } from '@playwright/test';

/**
 * ⚠️ 중요: Playwright의 page.request.post()는 Set-Cookie 헤더를 자동으로
 * 브라우저 컨텍스트에 저장하지 않습니다. 수동으로 쿠키를 파싱하여 추가해야 합니다.
 */
async function loginAs(page: Page, role: string) {
  try {
    console.log(`[Auth Fixture] Logging in as ${role}...`);

    // 1. CSRF 토큰 획득
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    // 2. NextAuth callback API로 POST 요청
    const loginResponse = await page.request.post(
      `${baseURL}/api/auth/callback/test-login?callbackUrl=/`,
      {
        form: {
          role: role,
          csrfToken: csrfToken,
          json: 'true',
        },
      }
    );

    if (!loginResponse.ok()) {
      throw new Error(`Login callback failed: ${loginResponse.status()}`);
    }

    // ⚠️ 핵심: Set-Cookie 헤더를 수동으로 파싱하여 브라우저 컨텍스트에 추가
    // Playwright는 API 요청의 Set-Cookie를 자동으로 브라우저에 저장하지 않음
    const setCookieHeaders = loginResponse.headers()['set-cookie'];
    if (setCookieHeaders) {
      const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
        const parts = cookieStr.split(';');
        const [name, ...valueParts] = parts[0].split('=');
        const value = valueParts.join('=');

        // Parse cookie attributes
        const attributes: Record<string, string> = {};
        for (let i = 1; i < parts.length; i++) {
          const attr = parts[i].trim();
          if (attr.includes('=')) {
            const [key, val] = attr.split('=');
            attributes[key.toLowerCase()] = val;
          }
        }

        return {
          name: name.trim(),
          value,
          domain: 'localhost',
          path: attributes['path'] || '/',
          httpOnly: parts.some(p => p.trim().toLowerCase() === 'httponly'),
          sameSite: (attributes['samesite'] || 'Lax') as 'Lax' | 'Strict' | 'None',
          expires: attributes['expires'] ? new Date(attributes['expires']).getTime() / 1000 : undefined,
        };
      });
      await page.context().addCookies(cookies);
      console.log(`[Auth Fixture] Added ${cookies.length} cookies`);
    }

    // 3. 메인 페이지로 이동하여 세션 확인
    await page.goto('/');
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed: redirected to login page');
    }

    console.log(`[Auth Fixture] Successfully logged in as ${role}`);
  } catch (error) {
    console.error(`[Auth Fixture] Failed to login as ${role}:`, error);
    throw error;
  }
}

export const test = base.extend<AuthFixtures>({
  testOperatorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'test_engineer');
    await use(page);
    await context.close();
  },
  // ... 다른 역할 fixtures
});

export { expect } from '@playwright/test';
```

**플로우**:
1. `/api/auth/csrf`에서 CSRF 토큰 획득
2. `/api/auth/callback/test-login`으로 POST 요청 (form data로 role + csrfToken 전달)
3. NextAuth가 `authorize` 함수 실행 → 백엔드 호출 → 세션 생성
4. NextAuth가 `next-auth.session-token` 쿠키 저장
5. 메인 페이지 이동하여 세션 확인

### 3단계: .env.test 설정

**파일**: `apps/frontend/.env.test`

```bash
# 환경 설정
NODE_ENV=test

# NextAuth.js 설정
# 프론트엔드 URL (E2E 테스트 서버 - Playwright 전용 포트)
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=test_super_secret_key_for_e2e_testing_32chars

# 백엔드 API URL (개발 서버)
NEXT_PUBLIC_API_URL=http://localhost:3001

# 로컬 인증 활성화 (테스트 환경)
ENABLE_LOCAL_AUTH=true
```

**참고**: E2E 테스트는 포트 3002에서 실행되므로 `NEXTAUTH_URL`도 3002로 설정해야 합니다.

### 4단계: 백엔드 테스트 로그인 엔드포인트

**파일**: `apps/backend/src/modules/auth/auth.controller.ts`

```typescript
/**
 * 테스트 전용 로그인 엔드포인트
 * E2E 테스트에서 사용됩니다.
 */
@Get('test-login')
@Public()
async testLogin(@Query('role') role: string) {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    throw new ForbiddenException('Test login is only available in development and test environments');
  }

  // 주의: id, uuid, teamId는 반드시 유효한 UUID 형식이어야 함 (DB 저장 시 UUID 타입 검증)
  const testUsers: Record<string, any> = {
    test_engineer: {
      id: '00000000-0000-0000-0000-000000000001',
      uuid: '00000000-0000-0000-0000-000000000001',
      email: 'test.engineer@example.com',
      name: '테스트 시험실무자',
      role: 'test_engineer',
      site: 'suwon',
      teamId: '00000000-0000-0000-0000-000000000099',
    },
    technical_manager: {
      id: '00000000-0000-0000-0000-000000000002',
      uuid: '00000000-0000-0000-0000-000000000002',
      email: 'tech.manager@example.com',
      name: '테스트 기술책임자',
      role: 'technical_manager',
      site: 'suwon',
      teamId: '00000000-0000-0000-0000-000000000099',
    },
    lab_manager: {
      id: '00000000-0000-0000-0000-000000000003',
      uuid: '00000000-0000-0000-0000-000000000003',
      email: 'lab.manager@example.com',
      name: '테스트 시험소장',
      role: 'lab_manager',
      site: 'suwon',
      teamId: '00000000-0000-0000-0000-000000000099',
    },
    system_admin: {
      id: '00000000-0000-0000-0000-000000000004',
      uuid: '00000000-0000-0000-0000-000000000004',
      email: 'system.admin@example.com',
      name: '테스트 시스템관리자',
      role: 'system_admin',
      site: 'suwon',
      teamId: '00000000-0000-0000-0000-000000000099',
    },
  };

  const testUser = testUsers[role];
  if (!testUser) {
    throw new ForbiddenException(`Invalid role: ${role}`);
  }

  return this.authService.generateTestToken(testUser);
}
```

**파일**: `apps/backend/src/modules/auth/auth.service.ts`

```typescript
/**
 * 테스트 전용 토큰 생성
 */
generateTestToken(testUser: any): AuthResponse {
  const user: UserDto = {
    id: testUser.id || testUser.uuid,
    email: testUser.email,
    name: testUser.name,
    roles: [testUser.role as UserRole],
    department: testUser.department,
    site: testUser.site,
    teamId: testUser.teamId,
  };

  return this.generateToken(user);
}
```

---

## 인증 플로우 다이어그램

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Playwright │────▶│  NextAuth   │────▶│   Backend    │────▶│  NextAuth    │
│    Test     │     │  /csrf      │     │ /test-login  │     │   Session    │
└─────────────┘     └─────────────┘     └──────────────┘     └──────────────┘
      │                    │                     │                    │
      │ 1. GET csrf        │                     │                    │
      │◀───────────────────┤                     │                    │
      │                    │                     │                    │
      │ 2. POST /callback/test-login             │                    │
      │────────────────────▶│                     │                    │
      │    (role + csrf)   │                     │                    │
      │                    │                     │                    │
      │                    │ 3. authorize(role)  │                    │
      │                    │────────────────────▶│                    │
      │                    │                     │                    │
      │                    │ 4. Return user+JWT  │                    │
      │                    │◀────────────────────┤                    │
      │                    │                     │                    │
      │                    │ 5. Create session   │                    │
      │                    │─────────────────────────────────────────▶│
      │                    │     Set cookie      │                    │
      │                    │◀─────────────────────────────────────────┤
      │                    │                     │                    │
      │ 6. Session ready   │                     │                    │
      │◀────────────────────                     │                    │
      │                    │                     │                    │
      │ 7. goto('/')       │                     │                    │
      │────────────────────▶│                     │                    │
      │    (with session)  │                     │                    │
      │                    │                     │                    │
      │ 8. Authenticated!  │                     │                    │
      │◀────────────────────                     │                    │
```

---

## 아키텍처 원칙

### 1. NextAuth = 단일 인증 소스 (SSOT)

```
┌────────────────────────────────────────────────────────┐
│                   NextAuth 세션                         │
│            (httpOnly 쿠키에 JWT 저장)                   │
│                                                         │
│  ┌───────────────┬──────────────────┬─────────────────┐│
│  ▼               ▼                  ▼                 ││
│ Server        Client           API Client             ││
│ Component     Component                               ││
│ getServer     useSession()    getSession()            ││
│ Session                                               ││
└────────────────────────────────────────────────────────┘
```

**절대 금지 사항**:
- ❌ `localStorage.getItem('token')` - NextAuth 세션과 동기화 불가
- ❌ `localStorage.setItem('token')` - 이중 인증 소스 발생
- ❌ 쿠키 직접 설정 - NextAuth 우회

**권장 사항**:
- ✅ `getSession().accessToken` - NextAuth 세션과 동기화
- ✅ `getServerSession().accessToken` - 서버 사이드에서 안전
- ✅ NextAuth Provider를 통한 인증 - 정상적인 플로우

### 2. 테스트 환경에서도 동일한 원칙 적용

E2E 테스트는 실제 프로덕션 환경과 동일한 인증 플로우를 사용해야 합니다.

**이유**:
- 실제 사용자가 경험하는 인증 플로우를 테스트
- Middleware, Server/Client Components가 모두 정상 작동 확인
- 인증 관련 버그를 조기에 발견

---

## 트러블슈팅

### 문제 1: "Login failed: redirected to login page"

**증상**: 로그인 후에도 계속 로그인 페이지로 리다이렉트

**원인**: NextAuth 세션이 생성되지 않음

**해결 방법**:
1. CSRF 토큰이 올바르게 전달되었는지 확인
2. NextAuth Provider ID가 올바른지 확인 (`test-login`)
3. 백엔드 test-login 엔드포인트가 작동하는지 확인
4. NextAuth callbacks에서 accessToken이 전달되는지 확인

```bash
# 백엔드 엔드포인트 확인
curl http://localhost:3001/api/auth/test-login?role=test_engineer

# NextAuth providers 확인
curl http://localhost:3000/api/auth/providers
```

### 문제 2: "TypeError: Failed to resolve module specifier"

**증상**: `page.evaluate`에서 `import('next-auth/react')` 실패

**원인**: 브라우저 컨텍스트에서는 Node.js 모듈을 import할 수 없음

**해결 방법**: NextAuth callback API를 직접 POST로 호출 (현재 방식 사용)

### 문제 3: 세션은 있지만 API 호출 실패

**증상**: 로그인은 성공하지만 API 요청 시 401 에러

**원인**: `accessToken`이 NextAuth 세션에 포함되지 않음

**해결 방법**: `lib/auth.ts`의 callbacks 확인

```typescript
callbacks: {
  async jwt({ token, user, account }) {
    // test-login provider도 포함
    if ((account?.provider === 'credentials' || account?.provider === 'test-login') && user) {
      token.accessToken = (user as any).accessToken; // ✅ 토큰 저장
    }
    return token;
  },
  async session({ session, token }) {
    (session as any).accessToken = token.accessToken; // ✅ 세션에 전달
    return session;
  },
}
```

---

## 체크리스트

새로운 E2E 테스트 작성 시 확인 사항:

- [ ] `NODE_ENV=test`로 실행
- [ ] NextAuth test-login provider가 활성화되어 있음
- [ ] 백엔드 `/api/auth/test-login` 엔드포인트가 작동함
- [ ] auth.fixture.ts를 사용하여 로그인
- [ ] `localStorage` 토큰 사용하지 않음
- [ ] NextAuth callback API를 직접 호출
- [ ] CSRF 토큰을 올바르게 전달
- [ ] 세션 확인 후 테스트 진행

---

## 참고 자료

- **인증 아키텍처 가이드**: `/equipment-management` 스킬 - `references/auth-architecture.md`
- **NextAuth 공식 문서**: https://next-auth.js.org/configuration/providers/credentials
- **Playwright 공식 문서**: https://playwright.dev/docs/auth
- **프로젝트 인증 설정**: `apps/frontend/lib/auth.ts`
- **테스트 픽스처**: `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

---

## 결론

E2E 테스트에서 NextAuth 인증을 올바르게 처리하려면:

1. ✅ NextAuth의 정상적인 인증 플로우를 사용
2. ✅ test-login Provider를 NextAuth에 등록
3. ✅ NextAuth callback API를 직접 POST로 호출
4. ✅ NextAuth가 세션을 생성하고 쿠키를 관리하도록 함
5. ✅ "단일 인증 소스(SSOT)" 원칙 준수

**절대 금지**:
- ❌ 백엔드 JWT를 직접 쿠키에 저장
- ❌ NextAuth를 우회하는 어떤 방법도 사용하지 않음
- ❌ `localStorage`에 토큰 저장

이 가이드를 따르면 **실제 프로덕션 환경과 동일한 인증 플로우를 테스트**하여 높은 신뢰성을 확보할 수 있습니다.

---

**최종 수정일**: 2026-01-27
**작성자**: Claude Sonnet 4.5
**버전**: 1.1.0

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.1.0 | 2026-01-27 | loginAs 함수에 쿠키 파싱 로직 추가, 테스트 사용자 ID를 UUID 형식으로 수정, .env.test 포트 설정 반영 |
| 1.0.0 | 2026-01-22 | 최초 작성 |
