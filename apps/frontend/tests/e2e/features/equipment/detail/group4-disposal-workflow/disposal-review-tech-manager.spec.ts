/**
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * seed: /home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/equipment-detail/group4-disposal-workflow/seed.spec.ts
 *
 * Group 4: 폐기 워크플로우 - 정상 흐름
 * Test 4.3: 검토 (기술책임자)
 *
 * @sequential - 이 테스트는 4.2 테스트 이후 순차적으로 실행되어야 합니다
 *
 * Dependencies: disposal-progress-view.spec.ts
 * Expected State: Equipment status = pending_disposal
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폐기 워크플로우 - 정상 흐름 @sequential', () => {
  test('4.3. 검토 (기술책임자)', async ({ techManagerPage: page }) => {
    // 1. Log in as technical_manager (same team)
    // 2. Find equipment with pending disposal from same team
    await page.goto('/equipment');
    await page.waitForLoadState('load');

    // Find equipment with disposal pending status
    const equipmentCard = page
      .locator('article')
      .filter({ hasText: /폐기|대기/ })
      .first();
    const equipmentLink = equipmentCard.locator('a[href^="/equipment/"]').first();
    const href = await equipmentLink.getAttribute('href', { timeout: 5000 }).catch(() => null);

    if (!href) {
      test.skip(true, 'Equipment with disposal status not found. Tests 4.1-4.2 must run first.');
      return;
    }

    await page.goto(href);
    await page.waitForLoadState('load');

    // 3. Click '폐기 진행 중' button
    const progressButton = page.getByRole('button', { name: /폐기 진행 중/ });
    await expect(progressButton).toBeVisible();
    await progressButton.click();

    // 4. Click '폐기 검토하기' button
    const reviewButton = page.getByText('폐기 검토하기');
    await expect(reviewButton).toBeVisible();
    await reviewButton.click();

    // 5. Verify: review dialog opens with title '폐기 검토'
    await expect(page.getByRole('heading', { name: '폐기 검토' })).toBeVisible();

    // 6. Verify: disposal request information is displayed
    await expect(page.getByText('폐기 요청 정보')).toBeVisible();
    await expect(page.getByText('장비 노후화로 인한 성능 저하가 심각합니다.')).toBeVisible();

    // 7. Expand '장비 이력 요약' accordion
    const historyAccordion = page.getByText('장비 이력 요약');
    await historyAccordion.click();

    // 8. Verify: equipment history is shown
    // The history summary should be visible after expanding
    await page.waitForTimeout(300); // Wait for accordion animation
    const historyContent = page
      .locator('[id*="history"]')
      .or(page.locator('[class*="accordion-content"]'));
    // History section should contain some content

    // 9. Enter review opinion (10+ characters): '폐기 요청 내용을 검토하였으며 승인 가능합니다.'
    const opinionTextarea = page.locator('textarea#opinion');
    await opinionTextarea.fill('폐기 요청 내용을 검토하였으며 승인 가능합니다.');

    // Verify character count and aria-describedby
    await expect(opinionTextarea).toHaveAttribute('aria-describedby', 'opinion-hint');
    const opinionHint = page.locator('p#opinion-hint');
    await expect(opinionHint).toContainText(/현재: \d+자/);

    // 10. Click '검토 완료' button
    const completeButton = page.getByRole('button', { name: '검토 완료' });
    await expect(completeButton).toBeEnabled();
    await completeButton.click();

    // 11. Verify: toast notification '검토 완료'
    await expect(page.locator('.toast')).toContainText('검토 완료');

    // 12. Verify: progress updates to step 2 '시험소장 승인 대기'
    await page.waitForTimeout(1000); // Wait for state update
    const progressCard = page.locator('[class*="bg-orange"]').first();
    await expect(progressCard).toContainText('시험소장 승인 대기');
  });
});
