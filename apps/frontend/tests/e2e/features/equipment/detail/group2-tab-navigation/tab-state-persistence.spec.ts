/**
 * Equipment Detail Page - Tab State Persistence
 *
 * SSOT: Uses equipment ID constant
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

test.describe('Tab Navigation', () => {
  test('Tab state persistence across navigation', async ({ testOperatorPage: page }) => {
    // 1. Navigate to equipment detail page
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`);
    await page.waitForLoadState('networkidle');

    // 2. Click '교정 이력' tab
    const calibrationTab = page.locator('[role="tab"][aria-label="교정 이력 탭"]');
    await calibrationTab.click();

    // 3. Verify URL has ?tab=calibration
    await expect(page).toHaveURL(/\?tab=calibration/);

    // 4. Navigate to equipment list
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // 5. Use browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // 6. Verify '교정 이력' tab is still active
    await expect(page).toHaveURL(/\?tab=calibration/);
    await expect(calibrationTab).toHaveAttribute('data-state', 'active');

    // 7. Test direct URL with tab parameter
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}?tab=checkout`);
    await page.waitForLoadState('networkidle');

    // 8. Verify '반출 이력' tab is active
    const checkoutTab = page.locator('[role="tab"][aria-label="반출 이력 탭"]');
    await expect(checkoutTab).toHaveAttribute('data-state', 'active');

    console.log('✓ Tab state persists correctly');
  });
});
