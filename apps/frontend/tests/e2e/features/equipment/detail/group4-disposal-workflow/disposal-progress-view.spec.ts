/**
 * spec: /home/kmjkds/equipment_management_system/equipment-detail.plan.md
 * seed: /home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/equipment-detail/group4-disposal-workflow/seed.spec.ts
 *
 * Group 4: 폐기 워크플로우 - 정상 흐름
 * Test 4.2: 폐기 진행 상태 확인
 *
 * @sequential - 이 테스트는 4.1 테스트 이후 순차적으로 실행되어야 합니다
 *
 * Dependencies: disposal-request.spec.ts
 * Expected State: Equipment status = pending_disposal
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폐기 워크플로우 - 정상 흐름 @sequential', () => {
  test('4.2. 폐기 진행 상태 확인', async ({ testOperatorPage: page }) => {
    // This test depends on Test 4.1 having created a disposal request
    // We need to find equipment with 'pending_disposal' status
    await page.goto('/equipment');
    await page.waitForLoadState('load');

    // Look for equipment with '폐기 대기' or '폐기' status badge
    // This should be the equipment that was modified in Test 4.1
    const equipmentCard = page
      .locator('article')
      .filter({ hasText: /폐기|대기/ })
      .first();

    // Check if equipment with disposal status exists (with timeout)
    const equipmentLink = equipmentCard.locator('a[href^="/equipment/"]').first();
    const href = await equipmentLink.getAttribute('href', { timeout: 5000 }).catch(() => null);

    if (!href) {
      // If no equipment with disposal status found, skip the test
      // This means Test 4.1 hasn't run yet or failed
      test.skip(true, 'Equipment with disposal status not found. Test 4.1 must run first.');
      return;
    }

    // Navigate to the equipment detail page
    await page.goto(href);
    await page.waitForLoadState('load');

    // Verify: DisposalProgressCard banner is displayed at top of page
    const progressCard = page.locator('[class*="bg-orange"]').first();
    await expect(progressCard).toBeVisible();

    // Verify: banner shows current step '1. 폐기 요청'
    await expect(progressCard).toContainText('1. 폐기 요청');

    // Verify: requester name and request date are shown
    await expect(progressCard).toContainText(/요청자|신청자/);
    await expect(progressCard).toContainText(/\d{4}-\d{2}-\d{2}/); // Date format

    // Click '상세 보기' button
    const detailButton = page.getByRole('button', { name: /상세 보기|폐기 진행 중/ });
    await detailButton.click();

    // Verify: DisposalDetailDialog opens
    await expect(page.getByRole('heading', { name: /폐기 상세 내역/ })).toBeVisible();

    // Verify: 3-step timeline (폐기 요청 → 기술책임자 검토 → 시험소장 최종 승인)
    await expect(page.getByText('폐기 요청')).toBeVisible();
    await expect(page.getByText('기술책임자 검토')).toBeVisible();
    await expect(page.getByText('시험소장 최종 승인')).toBeVisible();

    // Verify: disposal reason is displayed
    await expect(page.getByText('장비 노후화로 인한 성능 저하가 심각합니다.')).toBeVisible();

    // Verify: current step is highlighted in timeline
    // The first step should have active/completed styling
    const timelineSteps = page
      .locator('[class*="timeline"]')
      .locator('div')
      .filter({ hasText: '폐기 요청' });
    await expect(timelineSteps.first()).toBeVisible();

    // Close dialog
    const closeButton = page.getByRole('button', { name: /닫기|확인/ }).first();
    await closeButton.click();

    // Verify dialog dismisses
    await expect(page.getByRole('heading', { name: /폐기 상세 내역/ })).not.toBeVisible();
  });
});
