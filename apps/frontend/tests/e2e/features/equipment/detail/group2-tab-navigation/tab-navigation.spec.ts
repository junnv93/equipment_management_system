/**
 * Equipment Detail Page - Tab Navigation
 *
 * SSOT: Uses relative paths and proper imports
 *
 * Tests tab navigation functionality including:
 * - All tabs are clickable
 * - URL query parameters update correctly
 * - Tab content loads properly
 * - Active tab visual indicators
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

test.describe('Tab Navigation', () => {
  test('Navigate through all tabs', async ({ testOperatorPage: page }) => {
    // 1. Navigate to equipment detail page
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`);

    // 2. Verify default tab is '기본 정보'
    const basicTab = page.locator('[role="tab"][aria-label="기본 정보 탭"]');
    await expect(basicTab).toHaveAttribute('data-state', 'active');

    // 3. Click '교정 이력' tab
    const calibrationTab = page.locator('[role="tab"][aria-label="교정 이력 탭"]');
    await calibrationTab.click();

    // 4. Verify URL updates to include ?tab=calibration
    await expect(page).toHaveURL(/\?tab=calibration/);

    // 5. Verify calibration history content loads
    const calibrationPanel = page.locator('[role="tabpanel"][aria-label="교정 이력 탭 패널"]');
    await expect(calibrationPanel).toBeVisible();

    // 6. Click '반출 이력' tab
    const checkoutTab = page.locator('[role="tab"][aria-label="반출 이력 탭"]');
    await checkoutTab.click();

    // 7. Verify URL updates to ?tab=checkout
    await expect(page).toHaveURL(/\?tab=checkout/);

    // 8. Click '첨부파일' tab
    const attachmentsTab = page.locator('[role="tab"][aria-label="첨부파일 탭"]');
    await attachmentsTab.click();

    // 9. Verify URL updates to ?tab=attachments
    await expect(page).toHaveURL(/\?tab=attachments/);

    // 10. Click '기본 정보' tab to return
    await basicTab.click();

    // 11. Verify URL returns to ?tab=basic
    await expect(page).toHaveURL(/\?tab=basic/);

    console.log('✓ All tabs navigated successfully');
  });
});
