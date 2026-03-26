import { test } from '@playwright/test';

/**
 * Seed test for equipment test planner
 * Navigates to equipment list page after login as technical_manager
 */
test('setup equipment list page', async ({ page }) => {
  // Navigate to home page
  await page.goto('http://localhost:3000');

  // Login as technical_manager via dev login buttons
  await page.goto('http://localhost:3000/api/auth/signin');

  const testLoginButton = page.getByRole('button', { name: /test.*login/i });
  if (await testLoginButton.isVisible()) {
    await testLoginButton.click();

    const roleSelect = page.locator('select[name="role"]');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('technical_manager');
    }

    const submitButton = page.getByRole('button', { name: /로그인|sign.*in/i });
    await submitButton.click();
  }

  // Wait for redirect after login

  // Navigate to equipment list
  await page.goto('http://localhost:3000/equipment');
});
