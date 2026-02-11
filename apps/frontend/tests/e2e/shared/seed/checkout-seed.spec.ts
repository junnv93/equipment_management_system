import { test } from '@playwright/test';

/**
 * Seed test for checkout test planner
 * Navigates to checkout list page after login
 */
test('setup checkout list page', async ({ page }) => {
  // Navigate to home page
  await page.goto('http://localhost:3000');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Login as technical_manager (using test-login provider)
  await page.goto('http://localhost:3000/api/auth/signin');

  // Select test-login provider if available
  const testLoginButton = page.getByRole('button', { name: /test.*login/i });
  if (await testLoginButton.isVisible()) {
    await testLoginButton.click();

    // Select technical_manager role
    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('technical_manager');
    }

    // Submit login
    const submitButton = page.getByRole('button', { name: /로그인|sign.*in/i });
    await submitButton.click();
  }

  // Navigate to checkouts page
  await page.goto('http://localhost:3000/checkouts');

  // Wait for checkout list to load
  await page.waitForLoadState('networkidle');

  // Wait for main content to be visible
  await page.waitForTimeout(2000);
});
