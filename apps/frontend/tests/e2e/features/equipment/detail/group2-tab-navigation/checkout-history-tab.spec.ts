/**
 * Equipment Detail Page - Checkout History Tab
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

test.describe('Tab Navigation', () => {
  test('Checkout history tab content', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`);
    await page.waitForLoadState('networkidle');

    // Click '반출 이력' tab
    const checkoutTab = page.locator('[role="tab"][aria-label="반출 이력 탭"]');
    await checkoutTab.click();
    await page.waitForTimeout(1000);

    // Verify content loads
    const checkoutPanel = page.locator('[role="tabpanel"][aria-label="반출 이력 탭 패널"]');
    await expect(checkoutPanel).toBeVisible();

    // Check for data or empty state
    const hasTable = (await page.locator('table').count()) > 0;
    const hasNoData = (await page.locator('text=/반출.*없습니다/i').count()) > 0;
    expect(hasTable || hasNoData).toBeTruthy();

    console.log('✓ Checkout history tab loaded');
  });
});
