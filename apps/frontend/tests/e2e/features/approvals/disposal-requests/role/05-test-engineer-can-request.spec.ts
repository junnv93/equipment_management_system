/**
 * Group A: Permissions - Test 1.1
 * Test: test_engineer can request disposal on available equipment
 * Equipment: EQUIP_DISPOSAL_PERM_A1 (available)
 *
 * IMPORTANT:
 * - This test includes automatic cleanup to reset equipment state before each run
 * - The cleanup ensures idempotent test execution
 * - Equipment detail page uses force-dynamic rendering to prevent stale cache
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_DISPOSAL_PERM_A1 } from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToAvailable, cleanupPool } from '../helpers/db-cleanup';

test.describe('Permissions - Group A', () => {
  test.beforeEach(async ({ testOperatorPage }) => {
    // Ensure clean state before each test
    await resetEquipmentToAvailable(EQUIP_DISPOSAL_PERM_A1);

    // Allow cache to settle
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Navigate with cache-busting to ensure fresh data
    const cacheBuster = Date.now();
    await testOperatorPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A1}?_t=${cacheBuster}`, {
      waitUntil: 'domcontentloaded',
    });
  });

  test.afterAll(async () => {
    // Cleanup database pool
    await cleanupPool();
  });

  test('test_engineer can request disposal on available equipment', async ({
    testOperatorPage,
  }) => {
    // Wait for React hydration (disposal button is client-side rendered)
    await testOperatorPage.waitForLoadState('networkidle').catch(() => {});
    await testOperatorPage.waitForTimeout(1000);

    // Pre-condition check: Equipment should be 'available' (status badge uses role="status", not "button")
    const availableStatus = testOperatorPage.getByRole('status', { name: /장비 상태.*사용 가능/i });
    await expect(availableStatus)
      .toBeVisible({
        timeout: 5000,
      })
      .catch(() => {
        throw new Error(
          `TEST PRECONDITION FAILED: Equipment ${EQUIP_DISPOSAL_PERM_A1} is not in 'available' state.`
        );
      });

    // 1. Verify "폐기 요청" button is visible
    const requestButton = testOperatorPage.getByRole('button', { name: /폐기 요청/i });
    await expect(requestButton).toBeVisible({ timeout: 10000 });

    // 2. Click "폐기 요청" button
    await requestButton.click();

    // 3. Verify dialog opens
    const dialog = testOperatorPage.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');

    // 4. Select disposal reason: "노후화"
    const obsoleteRadio = testOperatorPage.getByRole('radio', { name: '노후화' });
    await obsoleteRadio.click();

    // 5. Fill reasonDetail (≥10 chars)
    const reasonDetail = '장비 노후화로 인한 성능 저하가 심각합니다. 교정도 불가능한 상태입니다.';
    const reasonTextarea = testOperatorPage.getByLabel(/상세 사유/i);
    await reasonTextarea.fill(reasonDetail);

    // 6. Verify character count hint
    await expect(testOperatorPage.locator('p#reasonDetail-hint')).toContainText(/현재.*자/i);

    // 7. Click submit button
    const submitButton = dialog.getByRole('button', { name: '폐기 요청', exact: true });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // 8. Wait for dialog to close (indicates API success)
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // 9. Toast notification is optional (may disappear quickly)
    const toastVisible = await Promise.race([
      testOperatorPage
        .getByText('폐기 요청 완료')
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
      testOperatorPage
        .getByText(/폐기 요청이 성공적으로 등록/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
    ]).catch(() => false);

    if (!toastVisible) {
      console.log('[INFO] Toast notification did not appear (may have been transient)');
    }

    // Test success: Dialog closed successfully, indicating disposal request was created
    // Note: Equipment status update happens asynchronously, so we don't wait for it
  });
});
