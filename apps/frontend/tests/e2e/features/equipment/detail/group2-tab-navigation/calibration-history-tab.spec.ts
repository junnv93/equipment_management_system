/**
 * Equipment Detail Page - Calibration History Tab
 *
 * SSOT: Uses EQUIP_SPECTRUM_ANALYZER_SUW_E_ID
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

test.describe('Tab Navigation', () => {
  test('Calibration history tab content', async ({ testOperatorPage: page }) => {
    // 1. Navigate to equipment with calibration history
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`);
    await page.waitForLoadState('networkidle');

    // 2. Click '교정 이력' tab
    const calibrationTab = page.locator('[role="tab"][aria-label="교정 이력 탭"]');
    await calibrationTab.click();

    // 3. Wait for content to load
    await page.waitForTimeout(1000);

    // 4. Verify table displays or no-data message
    const calibrationPanel = page.locator('[role="tabpanel"][aria-label="교정 이력 탭 패널"]');
    await expect(calibrationPanel).toBeVisible();

    // Check if there's data or empty state
    const hasTable = (await page.locator('table').count()) > 0;
    const hasNoData =
      (await page.locator('text=/교정 이력이 없습니다|등록된.*없습니다/i').count()) > 0;

    expect(hasTable || hasNoData).toBeTruthy();

    console.log('✓ Calibration history tab loaded');
  });
});
