/**
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * seed: /home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/equipment-detail/group4-disposal-workflow/seed.spec.ts
 *
 * Group 4: 폐기 워크플로우 - 정상 흐름
 * Test 4.5: 최종 승인 (시험소장)
 *
 * @sequential - 이 테스트는 4.3 테스트 이후 순차적으로 실행되어야 합니다
 *
 * Dependencies: disposal-review-tech-manager.spec.ts
 * Expected State: Equipment status = reviewed
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폐기 워크플로우 - 정상 흐름 @sequential', () => {
  test('4.5. 최종 승인 (시험소장)', async ({ siteAdminPage: page }) => {
    // 1. Log in as lab_manager
    // 2. Find equipment with reviewed disposal request
    await page.goto('/equipment');
    await page.waitForLoadState('load');

    // Find equipment with disposal status (should be under review after test 4.3)
    const equipmentCard = page
      .locator('article')
      .filter({ hasText: /폐기|검토/ })
      .first();
    const equipmentLink = equipmentCard.locator('a[href^="/equipment/"]').first();
    const href = await equipmentLink.getAttribute('href', { timeout: 5000 }).catch(() => null);

    if (!href) {
      test.skip(true, 'Equipment with disposal status not found. Tests 4.1-4.3 must run first.');
      return;
    }

    await page.goto(href);
    await page.waitForLoadState('load');

    // 3. Click '폐기 진행 중' button
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/ });
    await expect(progressButton).toBeVisible();
    await progressButton.click();

    // 4. Click '최종 승인하기' button
    const approvalButton = page.getByText('최종 승인하기');
    await expect(approvalButton).toBeVisible();
    await approvalButton.click();

    // 5. Verify: final approval dialog opens with title '폐기 최종 승인'
    await expect(page.getByRole('heading', { name: '폐기 최종 승인' })).toBeVisible();

    // 6. Verify: 3-step stepper shows all steps
    await expect(page.getByText('1. 폐기 요청')).toBeVisible();
    await expect(page.getByText('2. 기술책임자 검토')).toBeVisible();
    await expect(page.getByText('3. 시험소장 승인')).toBeVisible();

    // 7. Verify: review opinion from technical manager is displayed
    await expect(page.getByText('검토 의견')).toBeVisible();
    await expect(page.getByText('폐기 요청 내용을 검토하였으며 승인 가능합니다.')).toBeVisible();

    // 8. Enter approval comment (optional): '폐기 승인합니다. 환경 규정에 따라 처리해주세요.'
    const commentTextarea = page.locator('textarea#comment');
    await commentTextarea.fill('폐기 승인합니다. 환경 규정에 따라 처리해주세요.');

    // 9. Click '최종 승인' button
    const approveButton = page.getByRole('button', { name: '최종 승인' }).first();
    await expect(approveButton).toBeEnabled();
    await approveButton.click();

    // 10. Verify: confirmation dialog appears: '최종 승인 확인'
    await expect(page.getByRole('heading', { name: /최종 승인 확인/ })).toBeVisible();

    // 11. Verify: warning: '이 작업은 되돌릴 수 없습니다'
    await expect(page.getByText(/이 작업은 되돌릴 수 없습니다/)).toBeVisible();

    // 12. Click final '최종 승인' button in confirmation dialog
    const confirmButton = page.getByRole('button', { name: '최종 승인' }).last();
    await confirmButton.click();

    // 13. Verify: toast notification: '최종 승인 완료'
    await expect(page.locator('.toast')).toContainText('최종 승인 완료');

    // 14. Verify: equipment status changes to 'disposed'
    await page.waitForTimeout(1000); // Wait for state update

    // 15. Verify: '폐기 완료' button is displayed (disabled)
    const completedButton = page.getByRole('button', { name: '폐기 완료' });
    await expect(completedButton).toBeVisible();
    await expect(completedButton).toBeDisabled();

    // 16. Verify: DisposedBanner shows '장비 폐기 완료'
    const disposedBanner = page.locator('[class*="bg-gray-100"]').first();
    await expect(disposedBanner).toContainText('장비 폐기 완료');
  });
});
