/**
 * Group C: Rejection - Test 3.1
 * Test: technical_manager rejects at review stage
 * Equipment: EQUIP_DISPOSAL_REJ_C1 (pending_disposal, reviewStatus=pending)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_REJ_C1,
  DISP_REQ_C1_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import { resetEquipmentToPendingDisposal, cleanupPool } from '../helpers/db-cleanup';

test.describe('Rejection - Group C', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending_disposal state with pending review status
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C1,
      DISP_REQ_C1_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );
  });

  test.afterAll(async () => {
    // Cleanup DB connection pool
    await cleanupPool();
  });

  test('technical_manager rejects at review stage', async ({ techManagerPage }) => {
    // 1. Navigate to equipment detail page
    await techManagerPage.goto(`/equipment/${EQUIP_DISPOSAL_REJ_C1}`);

    // 2. Verify "폐기 진행 중" button is visible
    const disposalInProgressButton = techManagerPage.getByRole('button', {
      name: /폐기 진행 중/i,
    });
    await expect(disposalInProgressButton).toBeVisible({ timeout: 10000 });

    // 3. Click "폐기 진행 중" button to open dropdown menu
    await disposalInProgressButton.click();

    // 4. Click "폐기 검토하기" menu item in the dropdown
    const reviewMenuItem = techManagerPage.getByRole('menuitem', {
      name: /폐기 검토하기/i,
    });
    await expect(reviewMenuItem).toBeVisible({ timeout: 5000 });
    await reviewMenuItem.click();

    // 5. Verify dialog opens
    const dialog = techManagerPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(techManagerPage.getByRole('heading', { name: /폐기 검토/i })).toBeVisible();

    // 6. Fill rejection reason in "검토 의견" textarea (≥10 chars)
    const opinionTextarea = techManagerPage.getByLabel(/검토 의견/i);
    await expect(opinionTextarea).toBeVisible();
    await opinionTextarea.fill(
      '추가 점검이 필요하여 반려합니다. 수리 후 재사용 가능성을 확인해주세요.'
    );

    // 7. Click "반려" button (first click - show warning)
    const rejectButton = techManagerPage.getByRole('button', { name: /^반려$/i });
    await expect(rejectButton).toBeEnabled();
    await rejectButton.click();

    // 8. Verify warning message appears
    await expect(techManagerPage.getByText(/구체적인 사유를 입력하고/i)).toBeVisible({
      timeout: 5000,
    });

    // 9. Click "반려" button (second click - confirm rejection)
    await expect(rejectButton).toBeEnabled();
    await rejectButton.click();

    // 10. Verify toast notification or success (toast may be transient)
    // Try to find success indicators - either toast or dialog closed
    const successVisible = await Promise.race([
      techManagerPage
        .getByText(/반려.*완료/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
      techManagerPage
        .getByText(/반려되었습니다/i)
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true),
    ]).catch(() => false);

    if (!successVisible) {
      console.log('[INFO] Toast notification did not appear (may have been transient)');
    }

    // 11. Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // 12. Reload page to fetch fresh data from backend
    await techManagerPage.reload({ waitUntil: 'networkidle' });

    // 13. Debug: Check what buttons are actually visible
    const allButtons = await techManagerPage.locator('button').allTextContents();
    console.log('[DEBUG] Visible buttons:', allButtons);

    // 14. Verify status reverts to available - "폐기 요청" button should be visible again
    // Try multiple selectors
    const requestButton = techManagerPage.getByRole('button', {
      name: /폐기 요청/i,
    });

    // If not found, try checking if "폐기 진행 중" is still there (bug indicator)
    const progressButton = techManagerPage.getByRole('button', { name: /폐기 진행 중/i });
    const isProgressVisible = await progressButton.isVisible().catch(() => false);

    if (isProgressVisible) {
      console.log(
        '[ERROR] "폐기 진행 중" button is still visible - rejection might not have worked!'
      );
      // Continue to fail the test with better error message
    }

    await expect(requestButton).toBeVisible({ timeout: 10000 });
    await expect(requestButton).toBeEnabled();

    // 14. Verify DB state: equipment status should be 'available'
    // DB verification happens implicitly through UI state change
    // The presence of "폐기 요청" button confirms status is 'available'
  });
});
