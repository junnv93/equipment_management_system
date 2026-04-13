import { test } from '@playwright/test';

test('setup page for design review', async ({ page }) => {
  const baseURL = 'http://localhost:3000';

  // 1. Get CSRF token
  const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();

  // 2. Login via NextAuth test-login provider
  await page.request.post(`${baseURL}/api/auth/callback/test-login?callbackUrl=/`, {
    form: {
      role: 'technical_manager',
      csrfToken,
      json: 'true',
    },
  });

  // 3. Navigate to calibration-plans
  await page.goto(
    `${baseURL}/calibration-plans?site=suwon&teamId=7dc3b94c-82b8-488e-9ea5-4fe71bb086e1`
  );
  await page.waitForLoadState('networkidle');
});
