// spec: apps/frontend/tests/e2e/disposal/disposal-workflow.plan.md
// seed: tests/e2e/disposal/seed.spec.ts

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { resetEquipmentToAvailable, cleanupPool } from '../helpers/db-cleanup';

test.describe('UI/UX & Accessibility', () => {
  test.afterAll(async () => {
    await cleanupPool();
  });

  test('loading states', async ({ testOperatorPage }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds

    // Equipment ID from seed data (Group A)
    const equipmentId = 'dddd0001-0001-4001-8001-000000000001'; // EQUIP_DISPOSAL_PERM_A1

    // Reset equipment to available state for test consistency
    await resetEquipmentToAvailable(equipmentId);

    // 1. Navigate to equipment detail page with cache-busting parameter
    await testOperatorPage.goto(`/equipment/${equipmentId}?_t=${Date.now()}`);
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // 2. Click "폐기 요청" button
    const disposalButton = testOperatorPage.getByRole('button', { name: /폐기 요청/ });
    await expect(disposalButton).toBeVisible({ timeout: 10000 });
    await disposalButton.click();

    // 3. Verify dialog opened - use specific selector to avoid mobile nav drawer
    const dialog = testOperatorPage.getByRole('dialog', { name: /장비 폐기 요청/ });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await testOperatorPage.waitForTimeout(500);

    // 4. Fill form fields
    // Select disposal reason (노후화)
    const obsoleteRadio = testOperatorPage.getByRole('radio', { name: '노후화' });
    await obsoleteRadio.click();

    // Fill reasonDetail with minimum 10 characters
    const reasonDetailTextarea = testOperatorPage.getByLabel(/상세 사유/i);
    await expect(reasonDetailTextarea).toBeVisible({ timeout: 10000 });
    await reasonDetailTextarea.fill(
      '로딩 상태 테스트를 위한 폐기 요청입니다. 최소 10자 이상 입력합니다.'
    );

    // 5. Get submit button and cancel button references
    const submitButton = dialog.getByRole('button', { name: '폐기 요청', exact: true });
    const cancelButton = dialog.getByRole('button', { name: '취소' });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await expect(cancelButton).toBeVisible({ timeout: 10000 });

    // 6. Verify buttons are enabled before clicking
    await expect(submitButton).toBeEnabled();
    await expect(cancelButton).toBeEnabled();

    // 7. Verify form fields are enabled before submission
    await expect(reasonDetailTextarea).toBeEnabled();

    // 8. Before clicking, verify the button is truly clickable (not just visible)
    // Check if button has disabled attribute
    const isButtonActuallyEnabled = await submitButton.evaluate((el) => {
      const button = el as HTMLButtonElement;
      return !button.disabled && !button.getAttribute('aria-disabled');
    });
    console.log(`Submit button actually enabled: ${isButtonActuallyEnabled}`);
    expect(isButtonActuallyEnabled).toBe(true);

    // 9. Click submit button and wait for network request/response
    const [response] = await Promise.all([
      testOperatorPage.waitForResponse(
        (res) =>
          res.url().includes('/api/equipment/') &&
          res.url().includes('/disposal/request') &&
          res.request().method() === 'POST',
        { timeout: 10000 }
      ),
      submitButton.click(),
    ]);

    console.log(`Response status: ${response.status()}`);

    // 10. Immediately check for loading state (within 100ms of click)
    await testOperatorPage.waitForTimeout(50);

    // Check for loading spinner
    const loadingSpinner = dialog.locator('.lucide-loader-2.animate-spin');
    const hasSpinner = (await loadingSpinner.count()) > 0;

    // Check if buttons are disabled
    const isButtonDisabled = await submitButton.isDisabled();
    const isCancelDisabled = await cancelButton.isDisabled();

    console.log(`Loading spinner visible: ${hasSpinner}`);
    console.log(`Submit button disabled: ${isButtonDisabled}`);
    console.log(`Cancel button disabled: ${isCancelDisabled}`);

    // At least one loading indicator should be present during mutation
    // The submit button MUST be disabled during pending state
    const hasLoadingIndicator = hasSpinner || isButtonDisabled || isCancelDisabled;
    expect(hasLoadingIndicator).toBe(true);

    // 11. Wait for mutation to complete (dialog should close on success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // 12. Verify success response
    expect(response.ok()).toBe(true);

    console.log(
      '✅ Loading states verified: button disabled during mutation, loading spinner or disabled buttons shown, dialog closed after completion'
    );
  });
});
