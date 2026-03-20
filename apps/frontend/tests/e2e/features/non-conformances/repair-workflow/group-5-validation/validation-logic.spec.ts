/**
 * Group E: Business Logic Validation Tests
 *
 * Tests validation rules and business constraints.
 * These tests MUST run SEQUENTIALLY as they modify database state.
 *
 * SSOT Compliance:
 * - NonConformanceType, NonConformanceStatus from schemas
 * - Business rules for damage/malfunction requiring repair
 *
 * @group sequential
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  TEST_EQUIPMENT_AVAILABLE_ID,
  NC_WITH_REPAIR_ID,
  NC_CLOSED_ID,
  TIMEOUTS,
  UI_CLASSES,
} from '../constants/test-data';
import { openIncidentDialog, selectShadcnOption } from '../helpers/dialog-helper';
import { NonConformanceStatusValues as NCSVal } from '@equipment-management/schemas';

test.describe.serial('Group E: 비즈니스 로직 검증', () => {
  let testEquipmentId: string;
  let createdNcId: string;

  test.beforeAll(() => {
    // Use available equipment for validation tests
    testEquipmentId = TEST_EQUIPMENT_AVAILABLE_ID;
  });

  test('E-1. 수리 없이 부적합 종료 시도 → 다이얼로그 표시', async ({
    testOperatorPage,
    techManagerPage,
  }) => {
    // Step 1: Test operator creates damage NC
    await openIncidentDialog(testOperatorPage, testEquipmentId);

    const today = new Date().toISOString().split('T')[0];
    await testOperatorPage.fill('[name="occurredAt"]', today);
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '손상');
    await testOperatorPage.fill('[name="content"]', 'E2E 검증: 케이블 손상');
    await testOperatorPage.waitForTimeout(1000);
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });
    await ncLabel.click();

    // Use dispatchEvent as the button is outside viewport
    await testOperatorPage.getByRole('button', { name: /저장/i }).dispatchEvent('click');
    await testOperatorPage.waitForTimeout(TIMEOUTS.UI_UPDATE);

    // Step 2: Technical manager tries to close without repair
    await techManagerPage.goto(`/equipment/${testEquipmentId}/non-conformance`);

    // Find NC card using the actual structure
    const ncCard = techManagerPage
      .locator('div.bg-white.border.border-gray-200.rounded-lg')
      .filter({ hasText: 'E2E 검증: 케이블 손상' })
      .first();
    await expect(ncCard).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });

    // Try to edit NC to set status to corrected without repair
    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await expect(editButton).toBeVisible();
    await editButton.click();
    await techManagerPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Fill correction content
    await techManagerPage.fill('textarea[placeholder*="조치"]', '임시 조치');

    // Try to change status to corrected
    const statusSelect = ncCard.locator('select');
    await statusSelect.selectOption(NCSVal.CORRECTED);

    // Set up dialog handler
    let dialogShown = false;
    let dialogMessage = '';
    techManagerPage.on('dialog', async (dialog) => {
      dialogShown = true;
      dialogMessage = dialog.message();
      console.log('[E-1] Dialog message:', dialogMessage);
      await dialog.dismiss(); // Cancel
    });

    // Try to save
    await techManagerPage.getByRole('button', { name: /저장/i }).click();
    await techManagerPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Verify dialog was shown
    expect(dialogShown).toBe(true);
    expect(dialogMessage).toMatch(/수리 기록.*연결.*필요|수리 이력.*페이지/i);

    // Cancel the dialog and verify status didn't change
    const cancelButton = ncCard.getByRole('button', { name: /취소/i });
    if ((await cancelButton.count()) > 0) {
      await cancelButton.click();
    }
  });

  test('E-2. 다이얼로그 확인 클릭 시 수리 이력 페이지 이동', async ({ techManagerPage }) => {
    await techManagerPage.goto(`/equipment/${testEquipmentId}/non-conformance`);

    // Find the NC card we created in E-1
    const ncCard = techManagerPage
      .locator('div.bg-white.border.border-gray-200.rounded-lg')
      .filter({ hasText: 'E2E 검증: 케이블 손상' })
      .first();
    await expect(ncCard).toBeVisible({ timeout: TIMEOUTS.API_RESPONSE });

    const editButton = ncCard.getByRole('button', { name: /기록 수정/i });
    await expect(editButton).toBeVisible();
    await editButton.click();
    await techManagerPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Fill form
    await techManagerPage.fill('textarea[placeholder*="조치"]', '임시 조치 2');

    const statusSelect = ncCard.locator('select');
    await statusSelect.selectOption(NCSVal.CORRECTED);

    // Accept dialog to navigate
    techManagerPage.on('dialog', async (dialog) => {
      await dialog.accept(); // Confirm
    });

    await techManagerPage.getByRole('button', { name: /저장/i }).click();
    await techManagerPage.waitForTimeout(TIMEOUTS.NAVIGATION);

    // Should redirect to repair history page
    await expect(techManagerPage).toHaveURL(/repair-history/, {
      timeout: TIMEOUTS.NAVIGATION,
    });
  });

  test('E-3. 이미 연결된 부적합 재연결 방지', async ({ testOperatorPage }) => {
    // Use equipment that has NC_006 (already linked to REPAIR_001)
    const equipmentWithLinkedNC = 'eeee4001-0001-4001-8001-000000000001'; // EQUIP_HARNESS_COUPLER_SUW_A_ID

    // Navigate directly to repair history page (it's a separate page, not a tab)
    await testOperatorPage.goto(`/equipment/${equipmentWithLinkedNC}/repair-history`);

    // Try to create new repair (use .first() as there may be multiple buttons)
    await testOperatorPage
      .getByRole('button', { name: /수리 이력 추가/i })
      .first()
      .click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Open NC dropdown
    await testOperatorPage.click('[id="nonConformanceId"]');
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Verify already-linked NC is NOT in the list
    // NC_006 cause: "내부 연결부 불량"
    const linkedNcOption = testOperatorPage.getByText(/내부 연결부 불량/i);
    await expect(linkedNcOption).not.toBeVisible();

    // Or if it's visible, it should be disabled or marked as linked
    if ((await linkedNcOption.count()) > 0) {
      const optionText = await linkedNcOption.textContent();
      expect(optionText).toMatch(/연결됨|linked|사용 불가/i);
    }
  });

  test('E-4. 종료된 NC에 수리 연결 방지', async ({ testOperatorPage }) => {
    // Use equipment that has NC_004 (closed status)
    const equipmentWithClosedNC = 'eeee4004-0004-4004-8004-000000000004'; // EQUIP_BCI_SUW_A_ID

    // Navigate directly to repair history page (it's a separate page, not a tab)
    await testOperatorPage.goto(`/equipment/${equipmentWithClosedNC}/repair-history`);

    // Try to create new repair (use .first() as there may be multiple buttons)
    await testOperatorPage
      .getByRole('button', { name: /수리 이력 추가/i })
      .first()
      .click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Open NC dropdown
    await testOperatorPage.click('[id="nonConformanceId"]');
    await testOperatorPage.waitForTimeout(TIMEOUTS.DIALOG_ANIMATION);

    // Verify closed NC is NOT in the list
    // NC_004 cause: "주입 효율 저하"
    const closedNcOption = testOperatorPage.getByText(/주입 효율 저하/i);
    await expect(closedNcOption).not.toBeVisible();
  });

  test('E-5. damage/malfunction 유형만 수리 필수 검증', async ({ testOperatorPage }) => {
    // Create measurement_error NC (doesn't require repair)
    await openIncidentDialog(testOperatorPage, testEquipmentId);

    const today = new Date().toISOString().split('T')[0];
    await testOperatorPage.fill('[name="occurredAt"]', today);
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '변경');
    await testOperatorPage.fill('[name="content"]', 'E2E 검증: 설정 변경');
    await testOperatorPage.waitForTimeout(1000);
    // For 'change' type, the checkbox should not appear
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    if (await ncLabel.isVisible()) {
      await ncLabel.click();
    }

    // No workflow guidance for non-damage/malfunction types
    const guidanceCard = testOperatorPage.locator(UI_CLASSES.INFO_CARD).filter({
      hasText: /처리 워크플로우/i,
    });
    await expect(guidanceCard).not.toBeVisible();

    await testOperatorPage.getByRole('button', { name: /저장/i }).click();
    await testOperatorPage.waitForTimeout(TIMEOUTS.UI_UPDATE);

    // Navigate to NC management
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);

    const ncCard = testOperatorPage
      .locator('div.bg-white.border.border-gray-200.rounded-lg')
      .filter({ hasText: 'E2E 검증: 설정 변경' })
      .first();

    // Should NOT have repair warning card (yellow bg-yellow-50)
    const warningCard = ncCard.locator('.bg-yellow-50').filter({
      hasText: /수리 기록 필요/i,
    });
    await expect(warningCard).not.toBeVisible();
  });

  test('E-6. 부적합 생성 시 장비 상태 자동 변경 검증', async ({ testOperatorPage }) => {
    // Create new damage NC and verify equipment status changes to non_conforming
    const newTestEquipment = 'eeee1001-0001-4001-8001-000000000001'; // EQUIP_SPECTRUM_ANALYZER_SUW_E_ID

    // Navigate to equipment detail page
    await testOperatorPage.goto(`/equipment/${newTestEquipment}`);
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // Create damage incident with NC
    await openIncidentDialog(testOperatorPage, newTestEquipment);

    const today = new Date().toISOString().split('T')[0];
    await testOperatorPage.fill('[name="occurredAt"]', today);
    await selectShadcnOption(testOperatorPage, /사고 유형/i, '손상');
    await testOperatorPage.fill('[name="content"]', 'E2E 검증: 상태 변경 테스트');
    await testOperatorPage.waitForTimeout(1000);
    const ncLabel = testOperatorPage.getByText('부적합으로 등록', { exact: false });
    await ncLabel.waitFor({ state: 'visible', timeout: 10000 });
    await ncLabel.click();

    // Use dispatchEvent as the button is outside viewport
    await testOperatorPage.getByRole('button', { name: /저장/i }).dispatchEvent('click');
    await testOperatorPage.waitForTimeout(TIMEOUTS.UI_UPDATE);

    // Verify equipment status changed to non_conforming
    await testOperatorPage.goto(`/equipment/${newTestEquipment}`);
    const ncStatus = testOperatorPage.getByText(/부적합|non.?conforming/i).first();
    await expect(ncStatus).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });
  });
});
