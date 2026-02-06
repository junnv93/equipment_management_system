/**
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * seed: /home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/equipment-detail/group4-disposal-workflow/seed.spec.ts
 *
 * Group 4: 폐기 워크플로우 - 정상 흐름
 * Test 4.1: 폐기 요청 (시험실무자)
 *
 * @sequential - 이 테스트는 순차적으로 실행되어야 합니다
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폐기 워크플로우 - 정상 흐름 @sequential', () => {
  test('4.1. 폐기 요청 (시험실무자)', async ({ testOperatorPage: page }) => {
    // 1. Log in as test_engineer (already done by fixture)

    // 2. Navigate to equipment with status 'available'
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Find first available equipment (non-shared, from test_engineer's team)
    // Using the second equipment card to avoid shared equipment
    const equipmentCards = page.getByRole('article');
    const secondCard = equipmentCards.nth(1);
    await expect(secondCard).toBeVisible();

    // Click on equipment to go to detail page
    const detailLink = secondCard.getByRole('link', { name: /상세/i });
    await detailLink.click();
    await page.waitForLoadState('networkidle');

    // 3. Click '폐기 요청' button
    const disposalButton = page.getByRole('button', { name: /폐기 요청/ });
    await expect(disposalButton).toBeVisible();
    await disposalButton.click();

    // 4. Verify disposal request dialog opens with title '장비 폐기 요청'
    const dialogTitle = page.getByRole('heading', { name: '장비 폐기 요청' });
    await expect(dialogTitle).toBeVisible();

    // 5. Select disposal reason: '노후화' (obsolete)
    const obsoleteReason = page.locator('input[value="obsolete"]');
    await obsoleteReason.click();

    // 6. Enter detailed reason (minimum 10 characters): '장비 노후화로 인한 성능 저하가 심각합니다.'
    const detailTextarea = page.locator('textarea#reasonDetail');
    await detailTextarea.fill('장비 노후화로 인한 성능 저하가 심각합니다.');

    // 7. Verify character count hint updates
    const charCountHint = page.locator('p#reasonDetail-hint');
    await expect(charCountHint).toContainText(/현재: \d+자/);

    // Verify the hint shows correct character count (25 characters)
    await expect(charCountHint).toContainText('현재: 25자');

    // 8. Verify submit button is enabled when reason length >= 10
    const submitButtons = page.getByRole('button', { name: '폐기 요청' });
    // Get the second button (the one in the dialog, not the header button)
    const submitButton = submitButtons.nth(1);
    await expect(submitButton).toBeEnabled();

    // Test validation: clear text and verify button disables
    await detailTextarea.fill('짧은글');
    await expect(submitButton).toBeDisabled();

    // Re-enter valid text
    await detailTextarea.fill('장비 노후화로 인한 성능 저하가 심각합니다.');
    await expect(submitButton).toBeEnabled();

    // 9. Click '폐기 요청' submit button
    await submitButton.click();

    // 10. Verify toast notification: '폐기 요청 완료'
    const toast = page.locator('.toast, [role="status"], [aria-live="polite"]');
    await expect(toast).toContainText('폐기 요청 완료', { timeout: 5000 });

    // 11. Verify button changes to '폐기 진행 중'
    await page.waitForLoadState('networkidle');
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/ });
    await expect(progressButton).toBeVisible({ timeout: 5000 });

    // 12. Verify equipment status badge updates
    // The status badge should reflect the pending disposal state
    const statusBadge = page.locator('[class*="badge"], .bg-orange-100, .bg-yellow-100');
    await expect(statusBadge.first()).toBeVisible();
  });
});
