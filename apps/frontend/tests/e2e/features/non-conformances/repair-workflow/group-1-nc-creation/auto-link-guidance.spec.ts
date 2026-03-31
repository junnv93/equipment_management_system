/**
 * Group A-2: Auto-Link Guidance Message Display
 *
 * Tests guidance message display when selecting NC in repair form.
 * These tests are READ-ONLY and can run in parallel.
 *
 * SSOT Compliance:
 * - Uses schema constants for status labels
 * - Verifies UI guidance without modifying state
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_ID, TIMEOUTS, UI_CLASSES } from '../constants/test-data';
import { openRepairDialog } from '../helpers/dialog-helper';

test.describe('Group A-2: Auto-Link Guidance Display', () => {
  test('A-2.1. 부적합 선택 시 자동 연동 안내 표시', async ({ testOperatorPage }) => {
    // Open repair history dialog
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select a non-conformance
    await testOperatorPage.click('[id="nonConformanceId"]');

    // Click first NC option (not "선택 안 함")
    const ncOptions = testOperatorPage.getByRole('option');
    const firstRealOption = ncOptions.nth(1); // Skip "선택 안 함"
    await firstRealOption.click();

    // Wait for UI update

    // Verify guidance message is displayed
    const guidanceBox = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /자동 연동/i,
    });
    await expect(guidanceBox).toBeVisible();

    // Verify guidance content mentions auto-completion
    await expect(guidanceBox).toContainText(/수리 완료/i);
    await expect(guidanceBox).toContainText(/조치 완료/i);

    // Verify info icon exists
    const infoIcon = guidanceBox.locator('svg').first();
    await expect(infoIcon).toBeVisible();
  });

  test('A-2.2. 부적합 선택 해제 시 안내 메시지 숨김', async ({ testOperatorPage }) => {
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select NC
    await testOperatorPage.click('[id="nonConformanceId"]');
    const firstNC = testOperatorPage.getByRole('option').nth(1);
    await firstNC.click();

    // Verify guidance is visible (be specific to avoid matching nav items)
    const guidanceBox = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /자동 연동/i,
    });
    await expect(guidanceBox).toBeVisible();

    // Deselect NC (선택 안 함)
    await testOperatorPage.click('[id="nonConformanceId"]');
    await testOperatorPage.getByText('선택 안 함').click();

    // Wait for UI update

    // Guidance should be hidden
    await expect(guidanceBox).not.toBeVisible();
  });

  test('A-2.3. 안내 메시지에 워크플로우 설명 포함', async ({ testOperatorPage }) => {
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select NC
    await testOperatorPage.click('[id="nonConformanceId"]');
    const firstNC = testOperatorPage.getByRole('option').nth(1);
    await firstNC.click();

    // Verify detailed workflow explanation exists
    const guidanceBox = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /자동 연동/i,
    });

    // Should mention both repair completion and NC correction
    await expect(guidanceBox).toContainText(/수리.*완료/i);
    await expect(guidanceBox).toContainText(/부적합.*조치/i);
  });
});
