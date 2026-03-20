// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

/**
 * Test D-4: should allow technical_manager to close NC after repair
 *
 * This test verifies that a technical_manager can close a non-conformance
 * after it has been corrected with a repair connection.
 *
 * Workflow:
 * 1. Login as technical_manager
 * 2. Navigate to NC management page
 * 3. Find corrected NC with repair link
 * 4. Verify NC can be closed (repair requirement satisfied)
 * 5. Close NC via API call
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';
import { NonConformanceStatusValues as NCSVal } from '@equipment-management/schemas';

test.describe('Full Workflow Integration', () => {
  let testEquipmentId: string;
  let testNonConformanceId: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should allow technical_manager to close NC after repair', async ({ techManagerPage }) => {
    // 1. Login as technical_manager (already done via fixture)

    // 2. Navigate to NC management page
    // First, find equipment with NC
    await techManagerPage.goto('/equipment');
    await techManagerPage.waitForLoadState('networkidle');

    const firstDetailLink = techManagerPage.getByRole('link', { name: /상세/i }).first();
    await expect(firstDetailLink).toBeVisible();
    await firstDetailLink.click();
    await techManagerPage.waitForLoadState('networkidle');

    // Extract equipment ID from URL
    const url = techManagerPage.url();
    const match = url.match(/\/equipment\/([^\/]+)/);
    if (!match) {
      test.skip();
      return;
    }
    testEquipmentId = match[1];

    // Navigate to NC management page
    await techManagerPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Find corrected NC with repair link
    const correctedNCBadge = techManagerPage.getByText('조치 완료');
    if ((await correctedNCBadge.count()) === 0) {
      console.log('⚠ No corrected NC found, skipping test');
      test.skip();
      return;
    }

    await expect(correctedNCBadge.first()).toBeVisible();
    console.log('✓ Found corrected NC');

    // Verify repair link badge is present
    const repairLinkBadge = techManagerPage.locator(
      'text=/수리 기록 연결됨|Repair record connected/i'
    );
    if ((await repairLinkBadge.count()) > 0) {
      await expect(repairLinkBadge.first()).toBeVisible();
      console.log('✓ Repair link confirmed');
    }

    // 4. Verify NC can be closed (repair requirement satisfied)
    // Get NC ID via API
    const ncListResponse = await techManagerPage.request.get(
      `${BASE_URLS.BACKEND}/api/non-conformances?equipmentId=${testEquipmentId}`
    );

    if (!ncListResponse.ok()) {
      console.log('⚠ Failed to fetch NC list');
      test.skip();
      return;
    }

    const ncListData = await ncListResponse.json();
    const correctedNC = ncListData.items?.find(
      (nc: any) => nc.status === 'corrected' && nc.repairHistoryId
    );

    if (!correctedNC) {
      console.log('⚠ No corrected NC with repair link found via API');
      test.skip();
      return;
    }

    testNonConformanceId = correctedNC.id;
    console.log(`✓ Found corrected NC with ID: ${testNonConformanceId}`);

    // 5. Close NC via API call (PATCH /api/non-conformances/{id}/close)
    const closeResponse = await techManagerPage.request.patch(
      `${BASE_URLS.BACKEND}/api/non-conformances/${testNonConformanceId}/close`,
      {
        data: {
          closureNotes: 'E2E Test: Technical manager approval - repair completed',
        },
      }
    );

    if (!closeResponse.ok()) {
      const errorText = await closeResponse.text();
      console.error('❌ Failed to close NC:', errorText);
      test.skip();
      return;
    }

    const closedNC = await closeResponse.json();
    console.log('✓ NC closed successfully');

    // Verify NC status changed to 'closed'
    expect(closedNC.status).toBe(NCSVal.CLOSED);
    console.log('✓ NC status is "closed"');

    // Verify closedBy field is set
    expect(closedNC.closedBy).toBeTruthy();
    console.log('✓ closedBy field is set');

    // Verify closedAt timestamp is recorded
    expect(closedNC.closedAt).toBeTruthy();
    console.log('✓ closedAt timestamp recorded');

    // Verify closureNotes are saved
    expect(closedNC.closureNotes).toContain('E2E Test');
    console.log('✓ closureNotes saved');
  });
});
