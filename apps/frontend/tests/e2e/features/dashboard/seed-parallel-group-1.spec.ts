import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Dashboard Parallel Group 1 - Seed', () => {
  test('setup', async ({ siteAdminPage: page }) => {
    // Seed test for parallel group 1
    // This test uses existing lab_manager authentication
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/');
  });
});
