import { test, expect } from '@playwright/test';

test.use({
  storageState: 'apps/frontend/tests/e2e/.auth/site-admin.json',
});

test.describe('Dashboard Parallel Group 1 - Seed', () => {
  test('setup', async ({ page }) => {
    // Seed test for parallel group 1
    // This test uses existing lab_manager authentication
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
});
