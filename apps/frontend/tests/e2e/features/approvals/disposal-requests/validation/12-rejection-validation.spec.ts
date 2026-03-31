/**
 * Group C: Rejection - Test 3.3
 * Test: rejection validation for both review and approval stages
 * Equipment:
 * - EQUIP_DISPOSAL_REJ_C3: pending_disposal, reviewStatus=pending (for review rejection)
 * - EQUIP_DISPOSAL_REJ_C4: pending_disposal, reviewStatus=reviewed (for approval rejection)
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EQUIP_DISPOSAL_REJ_C3,
  DISP_REQ_C3_ID,
  EQUIP_DISPOSAL_REJ_C4,
  DISP_REQ_C4_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_ID,
} from '../../../../../../../backend/src/database/utils/uuid-constants';
import {
  resetEquipmentToPendingDisposal,
  resetEquipmentToReviewedDisposal,
  cleanupPool,
} from '../helpers/db-cleanup';

test.describe('Rejection - Group C', () => {
  test.beforeEach(async () => {
    // Reset equipment to pending_disposal state with pending review status
    await resetEquipmentToPendingDisposal(
      EQUIP_DISPOSAL_REJ_C3,
      DISP_REQ_C3_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );
  });

  test.afterAll(async () => {
    // Cleanup DB connection pool
    await cleanupPool();
  });

  test('rejection validation - opinion too short disables reject button', async ({
    techManagerPage,
  }) => {
    // 1. Navigate to equipment detail page
    await techManagerPage.goto(`/equipment/${EQUIP_DISPOSAL_REJ_C3}`);

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

    // 6. Get "반려" button reference
    const rejectButton = dialog.getByRole('button', { name: /^반려$/i });
    await expect(rejectButton).toBeVisible();

    // 7. Verify "반려" button is enabled initially (allows first click to show warning)
    await expect(rejectButton).toBeEnabled();

    // 8. Click "반려" once with empty textarea to trigger warning
    await rejectButton.click();

    // 9. Verify warning message appears
    await expect(techManagerPage.getByText(/구체적인 사유를 입력하고/i)).toBeVisible({
      timeout: 5000,
    });

    // 10. Now "반려" button should be disabled (showRejectInput=true, isValid=false)
    await expect(rejectButton).toBeDisabled();

    // 11. Fill opinion with 9 chars (<10 minimum)
    const opinionTextarea = techManagerPage.getByLabel(/검토 의견/i);
    await expect(opinionTextarea).toBeVisible();
    await opinionTextarea.fill('짧은텍스트'); // 5 characters

    // 12. Verify "반려" button is still disabled (opinion too short)
    await expect(rejectButton).toBeDisabled();

    // 13. Verify character count hint shows current length
    const charCountHint = techManagerPage.locator('p#opinion-hint');
    await expect(charCountHint).toBeVisible();
    await expect(charCountHint).toContainText(/현재:\s*5자/i);

    // 14. Fill opinion with exactly 10 chars (minimum)
    await opinionTextarea.fill('열글자입력완료확'); // 7 characters (still not enough)

    // 15. Verify button is still disabled
    await expect(rejectButton).toBeDisabled();

    // 16. Fill opinion with 10+ chars
    await opinionTextarea.fill('반려 사유가 10자 이상입니다.'); // 17 characters

    // 17. Verify "반려" button is now enabled (validation passed)
    await expect(rejectButton).toBeEnabled();

    // 18. Verify character count updated
    await expect(charCountHint).toContainText(/현재:\s*17자/i);

    // 19. Verify aria-describedby attribute for accessibility
    await expect(opinionTextarea).toHaveAttribute('aria-describedby', 'opinion-hint');

    // 20. Test clearing textarea (should disable button again)
    await opinionTextarea.clear();
    await expect(rejectButton).toBeDisabled();

    // Test complete - validation logic verified
  });

  test('approval rejection validation - comment too short disables reject button', async ({
    siteAdminPage,
  }) => {
    // Reset equipment to reviewed state for approval rejection testing
    await resetEquipmentToReviewedDisposal(
      EQUIP_DISPOSAL_REJ_C4,
      DISP_REQ_C4_ID,
      USER_TEST_ENGINEER_SUWON_ID,
      USER_TECHNICAL_MANAGER_SUWON_ID
    );

    // 1. Navigate to equipment detail page
    await siteAdminPage.goto(`/equipment/${EQUIP_DISPOSAL_REJ_C4}`);

    // 2. Verify "폐기 진행 중" button is visible
    const disposalInProgressButton = siteAdminPage.getByRole('button', {
      name: /폐기 진행 중/i,
    });
    await expect(disposalInProgressButton).toBeVisible({ timeout: 10000 });

    // 3. Click "폐기 진행 중" button to open dropdown menu
    await disposalInProgressButton.click();

    // 4. Click "최종 승인하기" menu item
    const approveMenuItem = siteAdminPage.getByText('최종 승인하기');
    await expect(approveMenuItem).toBeVisible({ timeout: 5000 });
    await approveMenuItem.click();

    // 5. Verify approval dialog opens
    const dialog = siteAdminPage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(siteAdminPage.getByText('폐기 최종 승인')).toBeVisible();

    // 6. Get "반려" button reference
    const rejectButton = dialog.getByRole('button', { name: /^반려$/i });
    await expect(rejectButton).toBeVisible();

    // 7. Verify "반려" button is enabled initially
    await expect(rejectButton).toBeEnabled();

    // 8. Click "반려" once with empty textarea to trigger warning
    await rejectButton.click();

    // 9. Verify warning message appears
    await expect(siteAdminPage.getByText(/구체적인 사유를 입력하고/i)).toBeVisible({
      timeout: 5000,
    });

    // 10. Now "반려" button should be disabled
    await expect(rejectButton).toBeDisabled();

    // 11. Fill comment with 9 chars (<10 minimum)
    const commentTextarea = siteAdminPage.getByLabel(/승인 코멘트/i);
    await expect(commentTextarea).toBeVisible();
    await commentTextarea.fill('짧은메시지'); // 5 characters

    // 12. Verify "반려" button is still disabled
    await expect(rejectButton).toBeDisabled();

    // 13. Verify character count hint
    const charCountHint = siteAdminPage.locator('p#comment-hint');
    await expect(charCountHint).toBeVisible();
    await expect(charCountHint).toContainText(/현재:\s*5자/i);

    // 14. Fill comment with 10+ chars
    await commentTextarea.fill('반려 사유가 10자 이상입니다.'); // 17 characters

    // 15. Verify "반려" button is now enabled
    await expect(rejectButton).toBeEnabled();

    // 16. Verify character count updated
    await expect(charCountHint).toContainText(/현재:\s*17자/i);

    // 17. Verify aria-describedby attribute for accessibility
    await expect(commentTextarea).toHaveAttribute('aria-describedby', 'comment-hint');

    // 18. Test clearing textarea (should disable button again)
    await commentTextarea.clear();
    await expect(rejectButton).toBeDisabled();

    // Test complete - approval rejection validation verified
  });
});
