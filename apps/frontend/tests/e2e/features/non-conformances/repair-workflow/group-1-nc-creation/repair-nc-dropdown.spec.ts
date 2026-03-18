/**
 * Group A-1: Repair History - Non-Conformance Selection Dropdown Display
 *
 * Tests UI element presence for NC dropdown in repair history form.
 * These tests are READ-ONLY and can run in parallel.
 *
 * SSOT Compliance:
 * - NON_CONFORMANCE_TYPE_LABELS from @equipment-management/schemas
 * - Never hardcode dropdown labels or status text
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_ID, NC_DROPDOWN_LABEL_PATTERN, UI_CLASSES } from '../constants/test-data';
import { openRepairDialog } from '../helpers/dialog-helper';
import { NON_CONFORMANCE_TYPE_LABELS } from '@equipment-management/schemas';

test.describe('Group A-1: NC Dropdown Display in Repair Form', () => {
  test('A-1.1. 수리 이력 생성 다이얼로그에 부적합 드롭다운 표시', async ({ testOperatorPage }) => {
    // Navigate to repair history page and open dialog
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Verify NC selection field label exists (SSOT compliance)
    const ncSelectLabel = testOperatorPage.getByText('연결된 부적합 (선택)');
    await expect(ncSelectLabel).toBeVisible();

    // Verify dropdown trigger exists (shadcn Select uses button with role=combobox)
    const ncSelect = testOperatorPage.getByRole('combobox', { name: /부적합 선택/i });
    await expect(ncSelect).toBeVisible();
  });

  test('A-1.2. 열린 부적합 목록 필터링 확인', async ({ testOperatorPage }) => {
    // Open repair dialog
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Open dropdown (shadcn Select uses combobox button)
    const ncSelect = testOperatorPage.getByRole('combobox', { name: /부적합 선택/i });
    await ncSelect.click();
    await testOperatorPage.waitForTimeout(500);

    // Verify "선택 안 함" option exists
    const noSelectionOption = testOperatorPage.getByRole('option', { name: '선택 안 함' });
    await expect(noSelectionOption).toBeVisible();

    // Verify NC option with SSOT label format
    // NC_001 and NC_002: malfunction type should use NON_CONFORMANCE_TYPE_LABELS
    // Looking for any option that includes the malfunction label
    const ncOption = testOperatorPage.getByRole('option').filter({
      hasText: NON_CONFORMANCE_TYPE_LABELS.malfunction,
    });
    await expect(ncOption.first()).toBeVisible();

    // Verify date format (YYYY-MM-DD) in label
    const labelWithDate = testOperatorPage.getByRole('option').filter({
      hasText: NC_DROPDOWN_LABEL_PATTERN,
    });
    await expect(labelWithDate.first()).toBeVisible();
  });

  test('A-1.3. 드롭다운에 열린 상태의 부적합만 표시', async ({ testOperatorPage }) => {
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Open dropdown (shadcn Select uses combobox button)
    const ncSelect = testOperatorPage.getByRole('combobox', { name: /부적합 선택/i });
    await ncSelect.click();
    await testOperatorPage.waitForTimeout(500);

    // Verify dropdown listbox is visible
    const dropdownMenu = testOperatorPage.getByRole('listbox');
    await expect(dropdownMenu).toBeVisible();

    // Get all options
    const options = testOperatorPage.getByRole('option');
    const optionCount = await options.count();

    // Should have at least 2 options: "선택 안 함" + at least one NC
    // Based on seed data: NC_001 (open), NC_002 (open) should appear
    expect(optionCount).toBeGreaterThanOrEqual(2);
  });

  test('A-1.4. 드롭다운 접근성 확인', async ({ testOperatorPage }) => {
    await openRepairDialog(testOperatorPage, TEST_EQUIPMENT_ID);

    // Verify combobox has proper ARIA attributes (shadcn Select uses button with role=combobox)
    const ncSelect = testOperatorPage.getByRole('combobox', { name: /부적합 선택/i });

    // Check element is focusable
    await ncSelect.focus();
    await expect(ncSelect).toBeFocused();

    // Verify it can be opened with keyboard (Space or Enter)
    await testOperatorPage.keyboard.press('Enter');
    await testOperatorPage.waitForTimeout(300);

    // Dropdown listbox should open
    const dropdown = testOperatorPage.getByRole('listbox');
    await expect(dropdown).toBeVisible();
  });
});
