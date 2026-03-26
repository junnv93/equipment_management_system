/**
 * Group E: End-to-End Integration Tests
 * Calibration Overdue Auto Non-Conformance - E2E Workflows
 *
 * Test Feature: Complete end-to-end workflows combining API and UI testing
 * Test Coverage:
 * - Subgroup E1-E2: Main Workflows (Sequential - 3 tests)
 *   - 5.1: Full overdue detection to resolution workflow
 *   - 5.2: Data consistency across multiple overdue equipment
 *   - 5.3: Calibration approval with multiple non-conformances
 * - Subgroup E3: Concurrency Tests (Parallel - 2 tests)
 *   - 5.4: UI updates after backend state changes
 *   - 5.5: Rapid successive overdue checks without duplicates
 *
 * SSOT Compliance:
 * - Import EquipmentStatus, NonConformanceStatus from @equipment-management/schemas
 * - Import Permission from @equipment-management/shared-constants
 * - Use backend test-login endpoint for authentication
 */

import { test, expect, APIRequestContext, Page } from '@playwright/test';
import {
  EquipmentStatus,
  NonConformanceStatus,
  EquipmentStatusValues as ESVal,
  NonConformanceStatusValues as NCSVal,
  NonConformanceTypeValues as NCTVal,
  IncidentTypeValues as ITVal,
  CalibrationMethodValues as CMVal,
  ResolutionTypeValues as RTVal,
} from '@equipment-management/schemas';
import { Permission, API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
import { fetchBackendToken } from '../../../shared/helpers/api-helpers';

// Test configuration
const BACKEND_URL = BASE_URLS.BACKEND;
const FRONTEND_URL = BASE_URLS.FRONTEND;
const TRIGGER_ENDPOINT = `${BACKEND_URL}${API_ENDPOINTS.NOTIFICATIONS.TRIGGER_OVERDUE_CHECK}`;

/**
 * Helper: Create test equipment with specific properties
 */
async function createTestEquipment(
  request: APIRequestContext,
  token: string,
  equipmentData: {
    managementNumber: string;
    name: string;
    status: EquipmentStatus;
    nextCalibrationDate?: Date;
    calibrationRequired?: 'required' | 'not_required';
    isActive?: boolean;
  }
) {
  const response = await request.post(`${BACKEND_URL}/api/equipment`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      managementNumber: equipmentData.managementNumber,
      name: equipmentData.name,
      status: equipmentData.status,
      site: 'suwon',
      classification: 'fcc_emc_rf',
      teamId: '00000000-0000-0000-0000-000000000099', // Test team
      calibrationRequired: equipmentData.calibrationRequired || 'required',
      calibrationMethod: CMVal.EXTERNAL_CALIBRATION,
      nextCalibrationDate: equipmentData.nextCalibrationDate?.toISOString(),
      isActive: equipmentData.isActive ?? true,
      manufacturer: 'Test Manufacturer',
      modelNumber: 'TEST-001',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create equipment: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Helper: Create non-conformance for equipment
 */
async function createNonConformance(
  request: APIRequestContext,
  token: string,
  equipmentId: string,
  ncType: string,
  status: string
) {
  const response = await request.post(`${BACKEND_URL}/api/non-conformances`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      equipmentId,
      ncType,
      status,
      description: 'Test NC',
      discoveryDate: new Date().toISOString(),
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create NC: ${response.status()}`);
  }

  return response.json();
}

/**
 * Helper: Create calibration record
 */
async function createCalibration(
  request: APIRequestContext,
  token: string,
  equipmentId: string,
  approvalStatus: string = 'pending_approval'
) {
  const today = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const response = await request.post(`${BACKEND_URL}/api/calibration`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      equipmentId,
      calibrationDate: today.toISOString(),
      nextCalibrationDate: nextYear.toISOString(),
      result: 'pass',
      agency: 'Test Agency',
      certificateNumber: `CERT-${Date.now()}`,
      approvalStatus,
      registeredByRole: 'test_engineer',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create calibration: ${response.status()}`);
  }

  return response.json();
}

/**
 * Helper: Approve calibration record
 */
async function approveCalibration(
  request: APIRequestContext,
  token: string,
  calibrationId: string
) {
  const response = await request.patch(`${BACKEND_URL}/api/calibration/${calibrationId}/approve`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      approved: true,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to approve calibration: ${response.status()}`);
  }

  return response.json();
}

/**
 * Helper: Get equipment by ID
 */
async function getEquipment(request: APIRequestContext, token: string, equipmentId: string) {
  const response = await request.get(`${BACKEND_URL}/api/equipment/${equipmentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to get equipment: ${response.status()}`);
  }

  return response.json();
}

/**
 * Helper: Get non-conformances by equipment ID
 */
async function getNonConformances(request: APIRequestContext, token: string, equipmentId: string) {
  const response = await request.get(
    `${BACKEND_URL}/api/non-conformances?equipmentId=${equipmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok()) {
    throw new Error(`Failed to get non-conformances: ${response.status()}`);
  }

  return response.json();
}

/**
 * Helper: Login to frontend using NextAuth
 */
async function loginToFrontend(page: Page, role: string) {
  // Get CSRF token
  const csrfResponse = await page.request.get(`${FRONTEND_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();

  if (!csrfToken) {
    throw new Error('Failed to get CSRF token');
  }

  // Login via NextAuth callback
  const loginResponse = await page.request.post(
    `${FRONTEND_URL}/api/auth/callback/test-login?callbackUrl=/`,
    {
      form: {
        role: role,
        csrfToken: csrfToken,
        json: 'true',
      },
    }
  );

  if (!loginResponse.ok()) {
    throw new Error(`Login callback failed: ${loginResponse.status()}`);
  }

  // Add cookies to page context
  const setCookieHeaders = loginResponse.headers()['set-cookie'];
  if (setCookieHeaders) {
    const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
      const parts = cookieStr.split(';');
      const [name, ...valueParts] = parts[0].split('=');
      const value = valueParts.join('=');

      const attributes: Record<string, string> = {};
      for (let i = 1; i < parts.length; i++) {
        const attr = parts[i].trim();
        if (attr.includes('=')) {
          const [key, val] = attr.split('=');
          attributes[key.toLowerCase()] = val;
        }
      }

      return {
        name: name.trim(),
        value,
        domain: 'localhost',
        path: attributes['path'] || '/',
        httpOnly: parts.some((p) => p.trim().toLowerCase() === 'httponly'),
        sameSite: (attributes['samesite'] || 'Lax') as 'Lax' | 'Strict' | 'None',
        expires: attributes['expires']
          ? new Date(attributes['expires']).getTime() / 1000
          : undefined,
      };
    });
    await page.context().addCookies(cookies);
  }

  await page.goto(`${FRONTEND_URL}/`);
  await page.waitForTimeout(1000);
}

// ============================================================================
// Subgroup E1-E2: Main Workflows (Sequential)
// ============================================================================

test.describe('Subgroup E1-E2: Main Workflows (Sequential)', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Run only in chromium for consistency
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should complete full overdue detection to resolution workflow', async ({
    request,
    page,
  }) => {
    const timestamp = Date.now();
    const equipmentId = `equip-e1-${timestamp}`;

    // 1. Setup test equipment: nextCalibrationDate = 7 days ago, status = 'available' (equipmentId: `equip-e1-${timestamp}`)
    const labManagerToken = await fetchBackendToken('lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const equipment = await createTestEquipment(request, labManagerToken, {
      managementNumber: equipmentId,
      name: `Test Equipment E1 ${timestamp}`,
      status: ESVal.AVAILABLE,
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    console.log('Created equipment:', equipment.id);

    // 2. Login as Lab Manager
    // Already logged in via API

    // 3. Trigger manual overdue check via API
    const triggerResponse = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${labManagerToken}`,
      },
    });

    expect(triggerResponse.ok()).toBeTruthy();
    const triggerResult = await triggerResponse.json();
    console.log('Trigger result:', triggerResult);

    // 4. Verify equipment status changed to `non_conforming`
    const updatedEquipment = await getEquipment(request, labManagerToken, equipment.id);
    expect(updatedEquipment.status).toBe(ESVal.NON_CONFORMING);
    console.log('Equipment status changed to non_conforming');

    // 5. Navigate to equipment detail page in UI
    await loginToFrontend(page, 'lab_manager');
    await page.goto(`${FRONTEND_URL}/equipment/${equipment.id}`);
    await page.waitForLoadState('networkidle');

    // 6. Verify NonConformanceBanner is displayed
    const ncBanner = page
      .locator('[data-testid="non-conformance-banner"]')
      .or(page.locator('text=/부적합/i'));
    await expect(ncBanner.first()).toBeVisible({ timeout: 10000 });
    console.log('NonConformanceBanner is visible');

    // 7. Login as Technical Manager
    const techManagerToken = await fetchBackendToken('technical_manager');

    // 8. Create and approve calibration record
    const calibration = await createCalibration(request, techManagerToken, equipment.id);
    console.log('Created calibration:', calibration.id);

    await approveCalibration(request, techManagerToken, calibration.id);
    console.log('Calibration approved');

    // 9. Verify non-conformance status changed to 'corrected'
    const ncs = await getNonConformances(request, techManagerToken, equipment.id);
    const calibrationOverdueNC = ncs.data.find(
      (nc: any) => nc.ncType === NCTVal.CALIBRATION_OVERDUE
    );
    expect(calibrationOverdueNC).toBeDefined();
    expect(calibrationOverdueNC.status).toBe(NCSVal.CORRECTED);
    expect(calibrationOverdueNC.resolutionType).toBe(RTVal.RECALIBRATION);
    console.log('Non-conformance auto-corrected:', calibrationOverdueNC);

    // Verify equipment calibration dates updated
    const finalEquipment = await getEquipment(request, techManagerToken, equipment.id);
    expect(new Date(finalEquipment.nextCalibrationDate).getTime()).toBeGreaterThan(Date.now());
    console.log('Equipment calibration dates updated');
  });

  test('should maintain data consistency across multiple overdue equipment', async ({
    request,
  }) => {
    const timestamp = Date.now();

    const labManagerToken = await fetchBackendToken('lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Setup 3 equipment:
    // - Equipment A: available, no existing NC (equipmentId: `equip-e2a-${timestamp}`)
    const equipmentA = await createTestEquipment(request, labManagerToken, {
      managementNumber: `equip-e2a-${timestamp}`,
      name: `Test Equipment E2A ${timestamp}`,
      status: ESVal.AVAILABLE,
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });
    console.log('Created Equipment A:', equipmentA.id);

    // - Equipment B: available, existing open `calibration_overdue` NC (equipmentId: `equip-e2b-${timestamp}`)
    const equipmentB = await createTestEquipment(request, labManagerToken, {
      managementNumber: `equip-e2b-${timestamp}`,
      name: `Test Equipment E2B ${timestamp}`,
      status: ESVal.AVAILABLE,
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });
    await createNonConformance(
      request,
      labManagerToken,
      equipmentB.id,
      NCTVal.CALIBRATION_OVERDUE,
      NCSVal.OPEN
    );
    console.log('Created Equipment B with existing NC:', equipmentB.id);

    // - Equipment C: `non_conforming` status, different cause (equipmentId: `equip-e2c-${timestamp}`)
    const equipmentC = await createTestEquipment(request, labManagerToken, {
      managementNumber: `equip-e2c-${timestamp}`,
      name: `Test Equipment E2C ${timestamp}`,
      status: ESVal.NON_CONFORMING,
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });
    await createNonConformance(request, labManagerToken, equipmentC.id, 'damage', NCSVal.OPEN);
    console.log('Created Equipment C (non_conforming):', equipmentC.id);

    // 2. Trigger manual overdue check
    const triggerResponse = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${labManagerToken}`,
      },
    });

    expect(triggerResponse.ok()).toBeTruthy();
    const result = await triggerResponse.json();
    console.log('Trigger result:', result);

    // 3. Verify each equipment processed correctly
    // Equipment A: processed, NC created, status = `non_conforming`
    const updatedEquipmentA = await getEquipment(request, labManagerToken, equipmentA.id);
    expect(updatedEquipmentA.status).toBe(ESVal.NON_CONFORMING);
    const ncsA = await getNonConformances(request, labManagerToken, equipmentA.id);
    const ncA = ncsA.data.find((nc: any) => nc.ncType === NCTVal.CALIBRATION_OVERDUE);
    expect(ncA).toBeDefined();
    expect(ncA.status).toBe(NCSVal.OPEN);
    console.log('Equipment A: processed, NC created');

    // Equipment B: skipped (existing NC), status unchanged
    const updatedEquipmentB = await getEquipment(request, labManagerToken, equipmentB.id);
    const ncsB = await getNonConformances(request, labManagerToken, equipmentB.id);
    const openNCs = ncsB.data.filter(
      (nc: any) => nc.ncType === NCTVal.CALIBRATION_OVERDUE && nc.status === NCSVal.OPEN
    );
    expect(openNCs.length).toBe(1); // Only one NC should exist
    console.log('Equipment B: skipped (existing NC)');

    // Equipment C: skipped (already `non_conforming`), no new NC
    const updatedEquipmentC = await getEquipment(request, labManagerToken, equipmentC.id);
    expect(updatedEquipmentC.status).toBe(ESVal.NON_CONFORMING);
    const ncsC = await getNonConformances(request, labManagerToken, equipmentC.id);
    const calibrationOverdueNCs = ncsC.data.filter(
      (nc: any) => nc.ncType === NCTVal.CALIBRATION_OVERDUE
    );
    expect(calibrationOverdueNCs.length).toBe(0); // No calibration_overdue NC should be created
    console.log('Equipment C: skipped (already non_conforming)');

    // Response categorizes each correctly
    const detailA = result.details.find((d: any) => d.equipmentId === equipmentA.id);
    const detailB = result.details.find((d: any) => d.equipmentId === equipmentB.id);
    const detailC = result.details.find((d: any) => d.equipmentId === equipmentC.id);

    if (detailA) {
      expect(detailA.action).toBe('created');
      console.log('Response: Equipment A marked as created');
    }
    if (detailB) {
      expect(detailB.action).toBe('skipped');
      console.log('Response: Equipment B marked as skipped');
    }
    // Equipment C should not be in details (excluded by status)
    expect(detailC).toBeUndefined();
    console.log('Response: Equipment C not in details (excluded)');
  });

  test('should handle calibration approval for equipment with multiple non-conformances', async ({
    request,
  }) => {
    const timestamp = Date.now();

    const labManagerToken = await fetchBackendToken('lab_manager');
    const techManagerToken = await fetchBackendToken('technical_manager');

    // 1. Setup equipment with two NCs (equipmentId: `equip-e3-${timestamp}`)
    const equipment = await createTestEquipment(request, labManagerToken, {
      managementNumber: `equip-e3-${timestamp}`,
      name: `Test Equipment E3 ${timestamp}`,
      status: ESVal.NON_CONFORMING,
      calibrationRequired: 'required',
      isActive: true,
    });
    console.log('Created equipment:', equipment.id);

    // - `calibration_overdue` (status: open)
    const calibrationOverdueNC = await createNonConformance(
      request,
      labManagerToken,
      equipment.id,
      NCTVal.CALIBRATION_OVERDUE,
      NCSVal.OPEN
    );
    console.log('Created calibration_overdue NC:', calibrationOverdueNC.id);

    // - `damage` (status: open)
    const damageNC = await createNonConformance(
      request,
      labManagerToken,
      equipment.id,
      'damage',
      NCSVal.OPEN
    );
    console.log('Created damage NC:', damageNC.id);

    // 2. Create pending calibration record
    const calibration = await createCalibration(
      request,
      techManagerToken,
      equipment.id,
      'pending_approval'
    );
    console.log('Created pending calibration:', calibration.id);

    // 3. Login as Technical Manager
    // Already logged in

    // 4. Approve calibration
    await approveCalibration(request, techManagerToken, calibration.id);
    console.log('Calibration approved');

    // 5. Query non-conformances
    const ncs = await getNonConformances(request, techManagerToken, equipment.id);

    // Only `calibration_overdue` NC is auto-corrected
    const updatedCalibrationOverdueNC = ncs.data.find(
      (nc: any) => nc.id === calibrationOverdueNC.id
    );
    expect(updatedCalibrationOverdueNC).toBeDefined();
    expect(updatedCalibrationOverdueNC.status).toBe(NCSVal.CORRECTED);
    expect(updatedCalibrationOverdueNC.resolutionType).toBe(RTVal.RECALIBRATION);
    console.log('calibration_overdue NC auto-corrected');

    // Damage NC remains in 'open' status
    const updatedDamageNC = ncs.data.find((nc: any) => nc.id === damageNC.id);
    expect(updatedDamageNC).toBeDefined();
    expect(updatedDamageNC.status).toBe(NCSVal.OPEN);
    console.log('damage NC remains in open status');

    // Equipment may still have `non_conforming` status if other NC is open
    const updatedEquipment = await getEquipment(request, techManagerToken, equipment.id);
    // Status might be non_conforming due to damage NC still open
    console.log('Equipment status:', updatedEquipment.status);
  });
});

// ============================================================================
// Subgroup E3: Concurrency Tests (Parallel)
// ============================================================================

test.describe('Subgroup E3: Concurrency Tests (Parallel)', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Run only in chromium for consistency
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should verify UI updates after backend state changes', async ({ request, page }) => {
    const timestamp = Date.now();
    const equipmentId = `equip-e4-${timestamp}`;

    const labManagerToken = await fetchBackendToken('lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const equipment = await createTestEquipment(request, labManagerToken, {
      managementNumber: equipmentId,
      name: `Test Equipment E4 ${timestamp}`,
      status: ESVal.AVAILABLE,
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    console.log('Created equipment:', equipment.id);

    // 1. Open equipment detail page in browser (equipmentId: `equip-e4-${timestamp}`)
    await loginToFrontend(page, 'lab_manager');
    await page.goto(`${FRONTEND_URL}/equipment/${equipment.id}`);
    await page.waitForLoadState('networkidle');

    // Verify initial status
    const statusBadge = page.locator('text=/사용.*가능|Available/i').first();
    await expect(statusBadge).toBeVisible();
    console.log('Initial status: available');

    // 2. Trigger manual overdue check via API (separate request)
    const triggerResponse = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${labManagerToken}`,
      },
    });

    expect(triggerResponse.ok()).toBeTruthy();
    console.log('Triggered overdue check');

    // 3. Refresh the equipment detail page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. Verify UI reflects new state
    // Status badge updates to 'Non-conforming'
    const nonConformingBadge = page.locator('text=/부적합|Non-conforming/i').first();
    await expect(nonConformingBadge).toBeVisible({ timeout: 10000 });
    console.log('Status badge updated to non_conforming');

    // NonConformanceBanner appears
    const ncBanner = page
      .locator('[data-testid="non-conformance-banner"]')
      .or(page.locator('text=/부적합/i'));
    await expect(ncBanner.first()).toBeVisible();
    console.log('NonConformanceBanner appears');

    // Incident History tab shows new `calibration_overdue` entry
    const incidentTab = page.locator('text=/이력|History/i');
    if (await incidentTab.isVisible()) {
      await incidentTab.click();
      await page.waitForTimeout(1000);
      const calibrationOverdueEntry = page.locator('text=/교정.*기한.*초과|Calibration.*Overdue/i');
      await expect(calibrationOverdueEntry.first()).toBeVisible();
      console.log('Incident History tab shows calibration_overdue entry');
    }

    // Checkout button disabled/hidden
    const checkoutButton = page
      .locator('button:has-text("반출")')
      .or(page.locator('button:has-text("Checkout")'));
    if (await checkoutButton.isVisible()) {
      await expect(checkoutButton).toBeDisabled();
      console.log('Checkout button is disabled');
    } else {
      console.log('Checkout button is hidden');
    }
  });

  test('should handle rapid successive overdue checks without creating duplicates', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const equipmentId = `equip-e5-${timestamp}`;

    // 1. Setup equipment with overdue calibration (equipmentId: `equip-e5-${timestamp}`)
    const labManagerToken = await fetchBackendToken('lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const equipment = await createTestEquipment(request, labManagerToken, {
      managementNumber: equipmentId,
      name: `Test Equipment E5 ${timestamp}`,
      status: ESVal.AVAILABLE,
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    console.log('Created equipment:', equipment.id);

    // 2. Login as Lab Manager
    // Already logged in

    // 3. Trigger manual overdue check (first call)
    const firstTriggerResponse = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${labManagerToken}`,
      },
    });

    expect(firstTriggerResponse.ok()).toBeTruthy();
    const firstResult = await firstTriggerResponse.json();
    console.log('First trigger result:', firstResult);

    // 4. Immediately trigger again (second call)
    const secondTriggerResponse = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${labManagerToken}`,
      },
    });

    expect(secondTriggerResponse.ok()).toBeTruthy();
    const secondResult = await secondTriggerResponse.json();
    console.log('Second trigger result:', secondResult);

    // 5. Query non-conformances
    const ncs = await getNonConformances(request, labManagerToken, equipment.id);

    // First call creates NC successfully
    const calibrationOverdueNCs = ncs.data.filter(
      (nc: any) => nc.ncType === NCTVal.CALIBRATION_OVERDUE
    );
    expect(calibrationOverdueNCs.length).toBe(1); // Only one NC should exist
    console.log('Only one NC record exists (no duplicates)');

    // Second call skips equipment (existing NC detected)
    const firstDetail = firstResult.details.find((d: any) => d.equipmentId === equipment.id);
    const secondDetail = secondResult.details.find((d: any) => d.equipmentId === equipment.id);

    if (firstDetail) {
      expect(firstDetail.action).toBe('created');
      console.log('First call: NC created');
    }

    if (secondDetail) {
      expect(secondDetail.action).toBe('skipped');
      console.log('Second call: Equipment skipped');
    }

    // Only one incident history record exists
    const incidentHistoryResponse = await request.get(
      `${BACKEND_URL}/api/equipment/${equipment.id}/incident-history`,
      {
        headers: {
          Authorization: `Bearer ${labManagerToken}`,
        },
      }
    );

    if (incidentHistoryResponse.ok()) {
      const incidentHistory = await incidentHistoryResponse.json();
      const calibrationOverdueIncidents = incidentHistory.data.filter(
        (incident: any) => incident.incidentType === ITVal.CALIBRATION_OVERDUE
      );
      expect(calibrationOverdueIncidents.length).toBe(1);
      console.log('Only one incident history record exists');
    }
  });
});
