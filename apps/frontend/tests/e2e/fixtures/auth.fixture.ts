/**
 * Playwright E2E 테스트용 인증 픽스처
 *
 * ⚠️ 중요: E2E 테스트에서 인증을 올바르게 처리하는 방법
 *
 * ## 잘못된 접근 (이전 방식)
 *
 * ```typescript
 * // ❌ 백엔드 JWT를 직접 쿠키에 저장
 * const response = await page.request.get('http://localhost:3001/api/auth/test-login?role=test_engineer');
 * const data = await response.json();
 * await page.context().addCookies([{ name: 'auth-token', value: data.access_token }]);
 * ```
 *
 * 문제:
 * - NextAuth의 인증 플로우를 우회
 * - NextAuth는 자체 세션 토큰(next-auth.session-token)을 사용
 * - Middleware, Server Components가 인증 실패로 판단
 * - 로그인 페이지로 리다이렉트
 *
 * ## 올바른 접근 (현재 방식)
 *
 * ```typescript
 * // ✅ NextAuth Credentials callback을 POST로 호출
 * await page.request.post('http://localhost:3000/api/auth/callback/credentials?callbackUrl=/', {
 *   form: {
 *     role: 'test_engineer',
 *     csrfToken: token,
 *   },
 * });
 * ```
 *
 * 장점:
 * - NextAuth가 세션을 생성하고 쿠키 관리
 * - Middleware, Server/Client Components에서 세션 인식
 * - 실제 프로덕션 환경과 동일한 인증 플로우 테스트
 * - "단일 인증 소스(SSOT)" 아키텍처 원칙 준수
 *
 * ## 아키텍처 원칙
 *
 * 1. NextAuth = 단일 인증 소스
 * 2. localStorage 토큰 사용 금지
 * 3. 모든 인증은 NextAuth 세션을 통해서만 처리
 *
 * 참고:
 * - /equipment-management 스킬 - references/auth-architecture.md
 * - apps/frontend/lib/auth.ts - test-login Provider 구현
 * - docs/development/E2E_TEST_AUTH_GUIDE.md - 상세 가이드
 */

import { test as base, Page } from '@playwright/test';

/**
 * 역할별 페이지 픽스처 인터페이스
 */
interface AuthFixtures {
  testOperatorPage: Page;      // 시험실무자
  techManagerPage: Page;        // 기술책임자
  qualityManagerPage: Page;     // 품질책임자 (3단계 승인 - 검토)
  siteAdminPage: Page;          // 시험소 관리자
  systemAdminPage: Page;        // 시스템 관리자
}

/**
 * 역할별 로그인 함수
 *
 * NextAuth의 test-login Provider를 사용하여 로그인합니다.
 * NextAuth Credentials callback API를 직접 POST 호출합니다.
 *
 * @param page - Playwright Page 객체
 * @param role - 사용자 역할 (test_engineer | technical_manager | lab_manager | system_admin)
 *
 * 플로우:
 * 1. NextAuth CSRF 토큰 획득 (/api/auth/csrf)
 * 2. NextAuth callback 엔드포인트로 credentials POST (/api/auth/callback/test-login)
 * 3. NextAuth가 세션 생성 및 쿠키 저장 (next-auth.session-token)
 * 4. 세션 확인을 위해 메인 페이지 방문
 */
async function loginAs(page: Page, role: string) {
  try {
    console.log(`[Auth Fixture] Logging in as ${role}...`);

    // 1단계: CSRF 토큰 획득
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();

    if (!csrfToken) {
      throw new Error('Failed to get CSRF token');
    }

    console.log(`[Auth Fixture] Got CSRF token`);

    // 2단계: NextAuth callback API로 POST 요청
    // test-login provider의 credentials를 전달
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
      const text = await loginResponse.text();
      console.error('[Auth Fixture] Login callback failed:', loginResponse.status(), text);
      throw new Error(`Login callback failed: ${loginResponse.status()}`);
    }

    const loginData = await loginResponse.json();
    console.log(`[Auth Fixture] Login response:`, loginData);

    // 디버깅: Set-Cookie 헤더 확인
    const setCookieHeaders = loginResponse.headers()['set-cookie'];
    console.log(`[Auth Fixture] Set-Cookie headers:`, setCookieHeaders);

    // 중요: page.request의 Set-Cookie를 page 컨텍스트에 수동 추가
    // Playwright는 API 요청의 Set-Cookie를 자동으로 브라우저에 저장하지 않음
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
      console.log(`[Auth Fixture] Added ${cookies.length} cookies:`, cookies.map(c => c.name).join(', '));
    }

    // 3단계: 쿠키가 설정되었는지 확인하기 위해 메인 페이지 방문
    await page.goto('/');

    // 로그인이 성공하면 로그인 페이지로 리다이렉트되지 않아야 함
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Login failed: redirected to login page');
    }

    // 디버깅: 쿠키 확인
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('next-auth'));
    console.log(`[Auth Fixture] Session cookies:`, sessionCookie ? `Found: ${sessionCookie.name}` : 'Not found');

    console.log(`[Auth Fixture] Successfully logged in as ${role}`);
  } catch (error) {
    console.error(`[Auth Fixture] Failed to login as ${role}:`, error);
    throw error;
  }
}

/**
 * 역할별 인증 픽스처
 *
 * 각 테스트는 독립적인 브라우저 컨텍스트에서 실행됩니다.
 * 이를 통해 테스트 간 세션 격리를 보장합니다.
 *
 * 사용 예:
 * ```typescript
 * test('시험실무자는 장비 목록을 볼 수 있다', async ({ testOperatorPage }) => {
 *   await testOperatorPage.goto('/equipment');
 *   await expect(testOperatorPage.locator('h1')).toContainText('장비 목록');
 * });
 * ```
 */
export const test = base.extend<AuthFixtures>({
  /**
   * 시험실무자 (Test Engineer) 픽스처
   * - 장비 운영/관리
   * - 점검 실시
   * - 이력카드 작성
   */
  testOperatorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'test_engineer');
    await use(page);
    await context.close();
  },

  /**
   * 기술책임자 (Technical Manager) 픽스처
   * - 교정계획 수립
   * - 점검 결과 확인
   * - 반출입 승인
   * - 보정인자 관리
   */
  techManagerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'technical_manager');
    await use(page);
    await context.close();
  },

  /**
   * 품질책임자 (Quality Manager) 픽스처
   * - 교정계획서 검토 (3단계 승인 워크플로우)
   * - 품질 관리 업무
   */
  qualityManagerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'quality_manager');
    await use(page);
    await context.close();
  },

  /**
   * 시험소 관리자 (Lab Manager) 픽스처
   * - 교정계획 승인
   * - 장비 폐기 승인
   * - 시험소 전체 관리
   */
  siteAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'lab_manager');
    await use(page);
    await context.close();
  },

  /**
   * 시스템 관리자 (System Admin) 픽스처
   * - 전체 시스템 관리
   * - 모든 시험소 접근
   */
  systemAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'system_admin');
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
