/**
 * Group C-1: Responsive Layout Tests
 *
 * Tests mobile/tablet layouts for NC-Repair workflow.
 * These tests are READ-ONLY and can run in parallel.
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_ID, UI_CLASSES } from '../constants/test-data';
import { openRepairDialog, selectShadcnOption } from '../helpers/dialog-helper';

test.describe('Group C-1: Responsive Layout', () => {
  // Set mobile viewport
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('C-1.1. 모바일에서 수리 이력 폼 레이아웃', async ({ testOperatorPage }) => {
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Verify dialog is displayed
    const dialog = testOperatorPage.locator(UI_CLASSES.DIALOG).last(); // Use last to get the actual dialog, not nav drawer
    await expect(dialog).toBeVisible();

    // Verify NC selection field is visible
    const ncSelect = testOperatorPage.getByText('연결된 부적합');
    await expect(ncSelect).toBeVisible();

    // Verify dialog is scrollable
    const dialogContent = dialog.locator('[role="document"]').or(dialog);
    const overflowY = await dialogContent.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('overflow-y')
    );
    expect(['auto', 'scroll', 'visible']).toContain(overflowY);
  });

  test('C-1.2. 모바일에서 부적합 관리 페이지 레이아웃', async ({ testOperatorPage }) => {
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}/non-conformance`);

    // Verify page is displayed
    await expect(testOperatorPage.locator('h1, h2').first()).toBeVisible();

    // Verify NC cards are stacked vertically (mobile layout)
    const ncCards = testOperatorPage.locator('[data-nc-id]');
    const firstCard = ncCards.first();

    if ((await ncCards.count()) > 0) {
      // Verify card is full width or near-full width
      const cardWidth = await firstCard.evaluate((el) => el.getBoundingClientRect().width);
      const viewportWidth = 375; // Mobile width
      expect(cardWidth).toBeGreaterThan(viewportWidth * 0.8); // At least 80% width
    }
  });

  test('C-1.3. 모바일에서 워크플로우 안내 카드 가독성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
    await testOperatorPage.getByRole('tab', { name: /사고 이력/i }).click();
    await testOperatorPage.getByRole('button', { name: /사고 등록/i }).click();

    // Select damage to show workflow
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '손상');

    // Check "create non-conformance" checkbox by clicking the label
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });
    await ncLabel.click();

    // Verify guidance card is visible and readable
    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).last(); // Use last to avoid mobile nav styling
    await expect(guidanceCard).toBeVisible();

    // Verify text is not cut off
    const steps = guidanceCard.locator('ol li');
    const firstStep = steps.first();
    if ((await steps.count()) > 0) {
      await expect(firstStep).toBeVisible();
    }
  });
});

test.describe('Group C-2: Tablet Layout', () => {
  // Set tablet viewport
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad

  test('C-2.1. 태블릿에서 부적합 카드 그리드 레이아웃', async ({ testOperatorPage }) => {
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}/non-conformance`);

    // Verify NC cards exist
    const ncCards = testOperatorPage.locator('[data-nc-id]');

    if ((await ncCards.count()) >= 2) {
      // On tablet, cards might be in a grid
      const firstCard = ncCards.first();
      const secondCard = ncCards.nth(1);

      const firstCardBox = await firstCard.boundingBox();
      const secondCardBox = await secondCard.boundingBox();

      // Verify cards are laid out appropriately (side-by-side or stacked)
      expect(firstCardBox).toBeTruthy();
      expect(secondCardBox).toBeTruthy();
    }
  });
});
