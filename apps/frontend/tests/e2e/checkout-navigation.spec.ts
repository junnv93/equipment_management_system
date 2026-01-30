/**
 * 대여/반출 관리 네비게이션 테스트 (UI-13 404 에러 수정 검증)
 *
 * 검증 항목:
 * - /checkouts 경로가 404를 반환하지 않음
 * - 사이드바 네비게이션이 올바른 경로로 이동
 * - 기존 /rentals, /loans 경로가 404 반환 (더 이상 사용하지 않음)
 */
import { test, expect, type Page } from '@playwright/test';

// 테스트용 로그인 헬퍼
async function loginAs(page: Page, role: string) {
  const csrfResponse = await page.request.get('/api/auth/csrf');
  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.csrfToken;

  await page.request.post('/api/auth/callback/test-login', {
    form: {
      role,
      csrfToken,
      json: 'true',
    },
  });
}

test.describe('대여/반출 관리 네비게이션 라우트 검증', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test_engineer');
  });

  test('/checkouts 페이지가 404 없이 로드됨', async ({ page }) => {
    const response = await page.goto('/checkouts');
    expect(response?.status()).not.toBe(404);

    // 페이지에 404 메시지가 없어야 함
    await expect(page.locator('body')).not.toContainText('This page could not be found');
  });

  test('/checkouts/create 페이지가 404 없이 로드됨', async ({ page }) => {
    const response = await page.goto('/checkouts/create');
    expect(response?.status()).not.toBe(404);
    await expect(page.locator('body')).not.toContainText('This page could not be found');
  });

  test('/checkouts/manage 페이지가 404 없이 로드됨', async ({ page }) => {
    await loginAs(page, 'technical_manager'); // 승인 관리는 기술책임자 이상
    const response = await page.goto('/checkouts/manage');
    expect(response?.status()).not.toBe(404);
    await expect(page.locator('body')).not.toContainText('This page could not be found');
  });

  test('/checkouts/pending-checks 페이지가 404 없이 로드됨', async ({ page }) => {
    const response = await page.goto('/checkouts/pending-checks');
    expect(response?.status()).not.toBe(404);
    await expect(page.locator('body')).not.toContainText('This page could not be found');
  });

  test('사이드바에서 "대여/반출 관리" 클릭 시 /checkouts로 이동', async ({ page }) => {
    await page.goto('/');

    // 데스크톱 사이드바에서 "대여/반출 관리" 링크 클릭
    const sidebarLink = page.locator('aside a[href="/checkouts"]').first();
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();

    // /checkouts 페이지로 이동 확인
    await expect(page).toHaveURL(/\/checkouts/);
    await expect(page.locator('body')).not.toContainText('This page could not be found');
  });

  test('기존 /rentals 경로는 404를 반환해야 함', async ({ page }) => {
    const response = await page.goto('/rentals');
    // 이 경로는 더 이상 존재하지 않으므로 404
    expect(response?.status()).toBe(404);
  });

  test('기존 /loans 경로는 404를 반환해야 함', async ({ page }) => {
    const response = await page.goto('/loans');
    // 이 경로는 더 이상 존재하지 않으므로 404
    expect(response?.status()).toBe(404);
  });

  test('기존 /dashboard/rentals 경로는 404를 반환해야 함', async ({ page }) => {
    const response = await page.goto('/dashboard/rentals');
    // 이 경로는 더 이상 존재하지 않으므로 404
    expect(response?.status()).toBe(404);
  });
});
