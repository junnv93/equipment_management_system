import { test } from '@playwright/test';

test('setup page for settings profile', async ({ page }) => {
  const baseURL = 'http://localhost:3000';

  // 1. CSRF 토큰 취득
  const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();

  // 2. test-login provider로 로그인 (technical_manager — 전자서명 업로드 가능)
  await page.request.post(`${baseURL}/api/auth/callback/test-login?callbackUrl=/`, {
    form: { role: 'technical_manager', csrfToken, json: 'true' },
  });

  // 3. 설정 프로필 페이지 이동
  await page.goto(`${baseURL}/settings/profile`);
  await page.waitForLoadState('domcontentloaded');
});
