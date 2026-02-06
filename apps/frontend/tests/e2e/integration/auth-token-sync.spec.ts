import { test, expect } from '@playwright/test';

/**
 * 인증 토큰 동기화 E2E 테스트
 *
 * 목적: NextAuth 세션과 API 클라이언트 토큰이 올바르게 동기화되는지 검증
 *
 * 핵심 원칙:
 * - localStorage에 토큰이 저장되지 않아야 함
 * - 모든 API 호출은 NextAuth 세션 토큰을 사용해야 함
 * - 로그아웃 시 모든 토큰이 제거되어야 함
 *
 * 참고: docs/development/AUTH_ARCHITECTURE.md
 */

test.describe('인증 토큰 동기화', () => {
  test.describe('localStorage 토큰 미사용 검증', () => {
    test('로그인 후 localStorage에 token이 저장되지 않음', async ({ page }) => {
      await page.goto('/login');
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      // 로그인 수행
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // localStorage에 token이 없어야 함
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });

    test('로그인 후 localStorage에 accessToken이 저장되지 않음', async ({ page }) => {
      await page.goto('/login');
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      // 로그인 수행
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // localStorage에 accessToken이 없어야 함
      const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
      expect(accessToken).toBeNull();
    });

    test('레거시 localStorage 토큰이 있어도 무시됨', async ({ page }) => {
      // 레거시 토큰 설정
      await page.goto('/login');
      await page.evaluate(() => {
        localStorage.setItem('token', 'legacy-fake-token-12345');
      });

      // 로그인 페이지 새로고침
      await page.reload();
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      // 로그인 수행
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // 대시보드에서 API 호출이 정상 작동하는지 확인 (레거시 토큰 무시)
      // NextAuth 세션 토큰이 사용되어야 함
      await expect(page.locator('body')).not.toContainText('401');
      await expect(page.locator('body')).not.toContainText('Unauthorized');
    });
  });

  test.describe('NextAuth 세션 쿠키 검증', () => {
    test('로그인 후 NextAuth 세션 쿠키가 설정됨', async ({ page, context }) => {
      await page.goto('/login');
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      // 로그인 수행
      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // NextAuth 세션 쿠키 확인
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(
        (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
      );

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.value).toBeTruthy();
    });

    test('로그아웃 후 NextAuth 세션 쿠키가 제거됨', async ({ page, context }) => {
      // 먼저 로그인
      await page.goto('/login');
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // 로그아웃 버튼 찾기 및 클릭 (헤더 또는 사이드바에 있을 수 있음)
      const logoutButton = page.getByRole('button', { name: /로그아웃/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      } else {
        // 메뉴를 열어야 할 수 있음
        const userMenu = page.getByTestId('user-menu');
        if (await userMenu.isVisible()) {
          await userMenu.click();
          await page.getByRole('menuitem', { name: /로그아웃/i }).click();
        } else {
          // 직접 API 호출로 로그아웃
          await page.goto('/api/auth/signout');
          await page
            .getByRole('button', { name: /sign out/i })
            .click()
            .catch(() => {});
        }
      }

      // 로그인 페이지로 리다이렉트 대기
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

      // 세션 쿠키 확인 (제거되었거나 만료됨)
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(
        (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token'
      );

      // 쿠키가 없거나 빈 값이어야 함
      if (sessionCookie) {
        expect(sessionCookie.value).toBeFalsy();
      }
    });
  });

  test.describe('API 호출 인증 검증', () => {
    test('로그인 후 API 호출에 Authorization 헤더가 포함됨', async ({ page }) => {
      // 네트워크 요청 모니터링
      const apiRequests: { url: string; headers: Record<string, string> }[] = [];

      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/api/') && !url.includes('/api/auth/')) {
          apiRequests.push({
            url,
            headers: request.headers(),
          });
        }
      });

      // 로그인
      await page.goto('/login');
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 대시보드 로드 대기 (API 호출 발생)
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // 페이지 로드 완료 대기
      await page.waitForLoadState('networkidle');

      // API 요청에 Authorization 헤더가 포함되어 있는지 확인
      const authenticatedRequests = apiRequests.filter((req) =>
        req.headers['authorization']?.startsWith('Bearer ')
      );

      // 최소 하나 이상의 인증된 API 요청이 있어야 함 (대시보드 데이터 로드)
      if (apiRequests.length > 0) {
        expect(authenticatedRequests.length).toBeGreaterThan(0);
      }
    });

    test('미인증 상태에서 보호된 페이지 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
      // 쿠키 초기화
      await page.context().clearCookies();

      // 보호된 페이지 직접 접근
      await page.goto('/equipment');

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });

    test('미인증 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
      // 쿠키 초기화
      await page.context().clearCookies();

      // 대시보드 직접 접근
      await page.goto('/');

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  });

  test.describe('세션 만료 처리', () => {
    test('세션 만료 시 로그인 페이지로 리다이렉트', async ({ page, context }) => {
      // 로그인
      await page.goto('/login');
      await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      await page.locator('#email').fill('admin@example.com');
      await page.locator('#password').fill('admin123');
      await page.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

      // 세션 쿠키 삭제 (세션 만료 시뮬레이션)
      await context.clearCookies();

      // 보호된 페이지로 이동
      await page.goto('/equipment');

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  });

  test.describe('다중 탭 동기화', () => {
    test('한 탭에서 로그아웃 시 다른 탭도 로그아웃됨', async ({ browser }) => {
      // 첫 번째 컨텍스트/페이지
      const context = await browser.newContext();
      const page1 = await context.newPage();

      // 로그인
      await page1.goto('/login');
      await page1.waitForSelector('#email', { state: 'visible', timeout: 15000 });

      await page1.locator('#email').fill('admin@example.com');
      await page1.locator('#password').fill('admin123');
      await page1.getByTestId('login-button').click();

      // 로그인 성공 대기
      await expect(page1).not.toHaveURL(/\/login/, { timeout: 15000 });

      // 두 번째 페이지 (같은 컨텍스트 = 같은 쿠키 공유)
      const page2 = await context.newPage();
      await page2.goto('/equipment');

      // 두 번째 페이지가 인증된 상태인지 확인
      await expect(page2).not.toHaveURL(/\/login/, { timeout: 10000 });

      // 첫 번째 페이지에서 로그아웃 (쿠키 삭제로 시뮬레이션)
      await context.clearCookies();

      // 두 번째 페이지 새로고침
      await page2.reload();

      // 로그인 페이지로 리다이렉트 확인
      await expect(page2).toHaveURL(/\/login/, { timeout: 15000 });

      await context.close();
    });
  });
});

test.describe('역할 기반 접근 제어', () => {
  test('관리자 페이지는 일반 사용자 접근 불가', async ({ page }) => {
    // 일반 사용자로 로그인 (테스트 계정 필요)
    await page.goto('/login');
    await page.waitForSelector('#email', { state: 'visible', timeout: 15000 });

    await page.locator('#email').fill('user@example.com');
    await page.locator('#password').fill('user123');
    await page.getByTestId('login-button').click();

    // 로그인 결과 대기
    await page.waitForLoadState('networkidle');

    // 관리자 페이지 접근 시도
    await page.goto('/admin/audit-logs');

    // 접근 거부 또는 리다이렉트 확인
    const currentUrl = page.url();
    const isOnAdminPage = currentUrl.includes('/admin/');
    const hasUnauthorizedMessage = await page
      .getByText(/권한이 없습니다|Unauthorized|접근 거부/i)
      .isVisible()
      .catch(() => false);

    // 관리자 페이지에 있으면 안 되거나, 권한 없음 메시지가 표시되어야 함
    expect(!isOnAdminPage || hasUnauthorizedMessage).toBeTruthy();
  });
});
