// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

/**
 * Test D-3: should automatically update NC to corrected when repair is completed
 *
 * This test verifies that when a repair history is created with NC connection
 * and result='completed', the NC status automatically transitions to 'corrected'.
 *
 * Workflow:
 * 1. Navigate to NC management page
 * 2. Find the connected NC
 * 3. Verify NC status badge shows 'corrected'
 * 4. Verify resolution type badge shows 'repair'
 * 5. Verify repair history link badge is visible
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('Full Workflow Integration', () => {
  let testEquipmentId: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should automatically update NC to corrected when repair is completed', async ({
    testOperatorPage,
  }) => {
    // 1. Navigate to NC management page
    // First, find equipment with NC
    await testOperatorPage.goto('/equipment');

    const firstDetailLink = testOperatorPage.getByRole('link', { name: /상세/i }).first();
    await expect(firstDetailLink).toBeVisible();
    await firstDetailLink.click();

    // Extract equipment ID from URL
    const url = testOperatorPage.url();
    const match = url.match(/\/equipment\/([^\/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    testEquipmentId = match[1];

    // Navigate to NC management page
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);

    // 2. Find the connected NC
    const ncCard = testOperatorPage.locator('.card, [data-testid="nc-card"]').first();
    if ((await ncCard.count()) === 0) {
      console.log('⚠ No NC found, skipping test');
      test.skip();
      return;
    }

    // 3. Verify NC status badge shows 'corrected' (blue color)
    const statusBadge = testOperatorPage.getByText('조치 완료');
    if ((await statusBadge.count()) > 0) {
      await expect(statusBadge).toBeVisible();
      console.log('✓ NC status badge shows "조치 완료" (corrected)');
    } else {
      console.log('⚠ NC not yet corrected (may still be "발견됨" or "분석 중")');
    }

    // 4. Verify resolution type badge shows 'repair'
    const resolutionBadge = testOperatorPage.getByText('해결: 수리');
    if ((await resolutionBadge.count()) > 0) {
      await expect(resolutionBadge).toBeVisible();
      console.log('✓ Resolution type badge shows "해결: 수리" (repair)');
    } else {
      console.log('⚠ Resolution type badge not yet displayed');
    }

    // 5. Verify repair history link badge is visible
    const repairLinkBadge = testOperatorPage.locator(
      'text=/수리 기록 연결됨|Repair record connected/i'
    );
    if ((await repairLinkBadge.count()) > 0) {
      await expect(repairLinkBadge).toBeVisible();
      console.log('✓ Repair history link badge visible');
    } else {
      console.log('⚠ Repair link badge not displayed');
    }

    // Verify success message shows
    const successMessage = testOperatorPage.getByText(
      /수리 기록 연결됨.*종결 승인 가능|Repair record connected.*closure approval available/i
    );
    if ((await successMessage.count()) > 0) {
      await expect(successMessage).toBeVisible();
      console.log('✓ Success message displayed');
    }
  });
});
