/**
 * Group A-4: Workflow Guidance Card in Incident History Tab
 *
 * Tests workflow guidance card display when creating NC from incident.
 * These tests are READ-ONLY and can run in parallel.
 *
 * SSOT Compliance:
 * - Uses IncidentType enum values
 * - Never hardcode workflow step text
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_ID, TIMEOUTS, UI_CLASSES } from '../constants/test-data';
import { openIncidentDialog, selectShadcnOption } from '../helpers/dialog-helper';

test.describe('Group A-4: Workflow Guidance Card Display', () => {
  test('A-4.1. damage 유형 부적합 생성 시 워크플로우 안내 표시', async ({ testOperatorPage }) => {
    // Open incident registration dialog
    await openIncidentDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select damage type using shadcn Select component
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '손상');

    // Wait for the conditional checkbox section to render
    // The checkbox appears only when incidentType is 'damage' or 'malfunction'
    await testOperatorPage.waitForTimeout(1000);

    // Check "create non-conformance" checkbox
    // Find by the text and then locate the checkbox
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });

    // Click the label which will toggle the checkbox
    await ncLabel.click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Verify workflow guidance card is displayed
    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /처리 워크플로우/i,
    });
    await expect(guidanceCard).toBeVisible();

    // Verify Info icon exists
    const infoIcon = guidanceCard.locator('svg[class*="lucide-info"]');
    await expect(infoIcon.or(guidanceCard.locator('svg').first())).toBeVisible();

    // Verify 4-step workflow is displayed
    const steps = guidanceCard.locator('ol li');
    const stepCount = await steps.count();
    expect(stepCount).toBeGreaterThanOrEqual(4);

    // Verify each step text (don't hardcode exact text, use partial matches)
    await expect(steps.nth(0)).toContainText(/사고.*이력.*등록/i);
    await expect(steps.nth(1)).toContainText(/수리.*이력.*페이지/i);
    await expect(steps.nth(2)).toContainText(/조치.*완료/i);
    await expect(steps.nth(3)).toContainText(/기술책임자/i);
  });

  test('A-4.2. malfunction 유형도 워크플로우 안내 표시', async ({ testOperatorPage }) => {
    await openIncidentDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select malfunction type
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '오작동');

    // Wait for checkbox section to render
    await testOperatorPage.waitForTimeout(1000);

    // Click the label to check the checkbox
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });
    await ncLabel.click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Verify workflow card is displayed
    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /처리 워크플로우/i,
    });
    await expect(guidanceCard).toBeVisible();
  });

  test('A-4.3. 다른 사고 유형은 워크플로우 안내 미표시', async ({ testOperatorPage }) => {
    await openIncidentDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select change type (not damage/malfunction)
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '변경');

    // Wait for form to update
    await testOperatorPage.waitForTimeout(1000);

    // For 'change' type, the checkbox should not appear at all
    // because it's only shown for damage/malfunction
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await expect(ncLabel).not.toBeVisible();

    // Verify workflow card is NOT displayed (since no NC checkbox was checked)
    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /처리 워크플로우/i,
    });
    await expect(guidanceCard).not.toBeVisible();
  });

  test('A-4.4. 부적합 생성 체크 해제 시 워크플로우 안내 숨김', async ({ testOperatorPage }) => {
    await openIncidentDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Select damage and check NC creation
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '손상');
    await testOperatorPage.waitForTimeout(1000);

    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });
    await ncLabel.click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Verify guidance is visible
    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /처리 워크플로우/i,
    });
    await expect(guidanceCard).toBeVisible();

    // Uncheck NC creation by clicking the label again
    await ncLabel.click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Guidance should be hidden
    await expect(guidanceCard).not.toBeVisible();
  });

  test('A-4.5. 워크플로우 안내에 명확한 액션 가이드 포함', async ({ testOperatorPage }) => {
    await openIncidentDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    await selectShadcnOption(testOperatorPage, /사고 유형/i, '손상');
    await testOperatorPage.waitForTimeout(1000);

    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });
    await ncLabel.click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /처리 워크플로우/i,
    });

    // Should have ordered list (ol) for step-by-step guide
    const orderedList = guidanceCard.locator('ol');
    await expect(orderedList).toBeVisible();

    // Should mention repair and NC closure workflow
    await expect(guidanceCard).toContainText(/수리/i);
    await expect(guidanceCard).toContainText(/종료/i);
  });
});
