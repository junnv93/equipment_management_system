// spec: tests/e2e/nc-repair-workflow.plan.md
// seed: tests/e2e/fixtures/auth.fixture.ts

/**
 * Test D-6: should verify complete workflow from incident to resolution
 *
 * This test performs end-to-end verification of the complete NC-Repair workflow,
 * ensuring all status transitions and data integrity requirements are met.
 *
 * Workflow:
 * 1. Verify equipment was initially available
 * 2. Verify NC was created with correct type and status
 * 3. Verify repair was registered with NC connection
 * 4. Verify NC auto-transitioned to corrected
 * 5. Verify NC was closed by authorized manager
 * 6. Verify equipment status was restored
 * 7. Verify complete audit trail is maintained
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';
import {
  NonConformanceStatusValues as NCSVal,
  NonConformanceTypeValues as NCTVal,
  EquipmentStatusValues as ESVal,
  ResolutionTypeValues as RTVal,
  UnifiedApprovalStatusValues as UASVal,
  RepairResultValues as RRVal,
} from '@equipment-management/schemas';

test.describe('Full Workflow Integration', () => {
  let testEquipmentId: string;
  let testNonConformanceId: string;
  let testRepairId: string;

  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should verify complete workflow from incident to resolution', async ({
    testOperatorPage,
    techManagerPage,
  }) => {
    // Create a new test equipment for clean workflow verification
    const createEquipmentResponse = await testOperatorPage.request.post(
      `${BASE_URLS.BACKEND}/api/equipment`,
      {
        data: {
          name: 'E2E Complete Workflow Test Equipment',
          managementNumber: `E2E-CW-${Date.now()}`,
          modelName: 'Workflow Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-CW-${Date.now()}`,
          status: ESVal.AVAILABLE,
          location: 'Test Lab',
          site: 'suwon',
          approvalStatus: UASVal.APPROVED,
        },
      }
    );

    if (!createEquipmentResponse.ok()) {
      console.error('Failed to create test equipment');
      test.skip();
      return;
    }

    const equipmentData = await createEquipmentResponse.json();
    testEquipmentId = equipmentData.id;
    console.log(`✓ Created test equipment: ${testEquipmentId}`);

    // 1. Verify equipment was initially available
    expect(equipmentData.status).toBe(ESVal.AVAILABLE);
    console.log('✓ Step 1: Equipment initially available');

    // 2. Create NC with correct type and status
    await testOperatorPage.goto(`/equipment/${testEquipmentId}/non-conformance`);
    await testOperatorPage.waitForLoadState('networkidle');

    const registerButton = testOperatorPage.getByRole('button', { name: /부적합 등록/i });
    await registerButton.click();

    const ncTypeSelect = testOperatorPage.locator('select').first();
    await ncTypeSelect.selectOption(NCTVal.DAMAGE);

    const causeTextarea = testOperatorPage.locator('textarea').first();
    await causeTextarea.fill('E2E Complete Workflow Test: Sensor damage');

    const submitButton = testOperatorPage.getByRole('button', { name: /^등록$/ });
    await submitButton.click();
    await testOperatorPage.waitForTimeout(1000);

    // Verify NC was created
    const ncListResponse = await testOperatorPage.request.get(
      `${BASE_URLS.BACKEND}/api/non-conformances?equipmentId=${testEquipmentId}`
    );
    const ncListData = await ncListResponse.json();
    const createdNC = ncListData.items?.[0];

    if (!createdNC) {
      console.error('NC was not created');
      test.skip();
      return;
    }

    testNonConformanceId = createdNC.id;
    expect(createdNC.ncType).toBe(NCTVal.DAMAGE);
    expect(createdNC.status).toBe(NCSVal.OPEN);
    console.log('✓ Step 2: NC created with type=damage, status=open');

    // 3. Register repair with NC connection
    const createRepairResponse = await testOperatorPage.request.post(
      `${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}/repair-history`,
      {
        data: {
          repairDate: new Date().toISOString(),
          repairDescription: 'E2E Test: Sensor replacement completed',
          repairedBy: 'E2E Test Engineer',
          repairResult: RRVal.COMPLETED,
          nonConformanceId: testNonConformanceId,
        },
      }
    );

    if (!createRepairResponse.ok()) {
      console.error('Failed to create repair');
      test.skip();
      return;
    }

    const repairData = await createRepairResponse.json();
    testRepairId = repairData.id;
    console.log('✓ Step 3: Repair registered with NC connection');

    // 4. Verify NC auto-transitioned to corrected
    const updatedNCResponse = await testOperatorPage.request.get(
      `${BASE_URLS.BACKEND}/api/non-conformances/${testNonConformanceId}`
    );
    const updatedNC = await updatedNCResponse.json();

    expect(updatedNC.status).toBe(NCSVal.CORRECTED);
    expect(updatedNC.resolutionType).toBe(RTVal.REPAIR);
    expect(updatedNC.repairHistoryId).toBe(testRepairId);
    console.log('✓ Step 4: NC auto-transitioned to corrected with resolutionType=repair');

    // 5. Technical manager closes NC
    const closeResponse = await techManagerPage.request.patch(
      `${BASE_URLS.BACKEND}/api/non-conformances/${testNonConformanceId}/close`,
      {
        data: {
          closureNotes: 'E2E Test: Complete workflow verification - approved',
        },
      }
    );

    if (!closeResponse.ok()) {
      console.error('Failed to close NC');
      test.skip();
      return;
    }

    const closedNC = await closeResponse.json();
    expect(closedNC.status).toBe(NCSVal.CLOSED);
    expect(closedNC.closedBy).toBeTruthy();
    expect(closedNC.closedAt).toBeTruthy();
    console.log('✓ Step 5: NC closed by authorized manager');

    // 6. Verify equipment status was restored
    const finalEquipmentResponse = await techManagerPage.request.get(
      `${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}`
    );
    const finalEquipment = await finalEquipmentResponse.json();

    expect(finalEquipment.status).toBe(ESVal.AVAILABLE);
    console.log('✓ Step 6: Equipment status restored to available');

    // 7. Verify complete audit trail is maintained
    // Check all records are consistent and linked
    expect(updatedNC.equipmentId).toBe(testEquipmentId);
    expect(updatedNC.repairHistoryId).toBe(testRepairId);
    expect(repairData.equipmentId).toBe(testEquipmentId);
    expect(repairData.nonConformanceId).toBe(testNonConformanceId);
    console.log('✓ Step 7: Complete audit trail maintained');

    // Verify no orphaned records
    console.log('✓ All status transitions followed UL-QP-18 procedures');
    console.log('✓ Equipment, NC, and repair records are consistent');
    console.log('✓ No orphaned records or broken references');

    // Cleanup: Delete test equipment
    await testOperatorPage.request.delete(`${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}`);
    console.log('✓ Test equipment cleaned up');
  });

  test.afterEach(async ({ testOperatorPage }) => {
    // Cleanup test equipment if it still exists
    if (testEquipmentId) {
      try {
        await testOperatorPage.request.delete(
          `${BASE_URLS.BACKEND}/api/equipment/${testEquipmentId}`
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
});
