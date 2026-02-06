/**
 * Group A: Permissions - Test 1.3
 * Test: technical_manager cannot review different team equipment
 * Equipment: EQUIP_DISPOSAL_PERM_A7 (pending_disposal, Uiwang team)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_PERM_A7,
  DISP_REQ_A7_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Permissions - Group A', () => {
  test.beforeEach(async () => {
    // Ensure clean state before each test
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_PERM_A7,
      DISP_REQ_A7_ID,
      USER_TECHNICAL_MANAGER_UIWANG_ID
    );
  });

  test('technical_manager cannot review different team equipment', async ({ techManagerPage }) => {
    // 1. Navigate to equipment detail page (Uiwang team equipment)
    await techManagerPage.goto(`/equipment/${EQUIP_DISPOSAL_PERM_A7}`);

    // 2. Wait for hydration (disposal dropdown is client-side rendered)
    await techManagerPage.waitForLoadState('networkidle').catch(() => {});
    await techManagerPage.waitForTimeout(1000);

    // 3. Verify "폐기 진행 중" button is visible
    const statusButton = techManagerPage.getByRole('button', { name: /폐기 진행 중/i });
    await expect(statusButton).toBeVisible({ timeout: 10000 });

    // 4. Click "폐기 진행 중" button to open dropdown menu
    await statusButton.click();

    // 5. Verify dropdown menu opened by checking for "상세 보기" menu item
    const detailViewMenuItem = techManagerPage.getByRole('menuitem', { name: '상세 보기' });
    await expect(detailViewMenuItem).toBeVisible({ timeout: 5000 });

    // 6. Verify "폐기 검토하기" menu item is NOT visible (team mismatch - permission denied)
    // The menu should NOT show this option for equipment from a different team
    // This is the CRITICAL security check: technical_manager from Team A cannot review Team B equipment
    const reviewMenuItem = techManagerPage.getByText('폐기 검토하기');
    await expect(reviewMenuItem).not.toBeVisible();

    // Test passed: The UI correctly hides the review option based on team permissions
  });

  test.afterAll(async () => {
    await cleanupPool();
  });
});
