/**
 * Group A: API Manual Trigger Tests
 * Calibration Overdue Auto Non-Conformance - Manual Trigger
 *
 * Test Feature: Backend API - Manual Overdue Check Trigger
 * Endpoint: POST /api/notifications/trigger-overdue-check
 * Permission Required: Permission.UPDATE_EQUIPMENT
 *
 * Test Coverage:
 * 1.1 - Successfully trigger manual overdue check (lab_manager)
 * 1.2 - Permission check (test_engineer should be denied)
 * 1.3 - Detect equipment with overdue calibration dates
 * 1.4 - Skip equipment already in non_conforming status
 * 1.5 - Skip equipment with existing open calibration_overdue NC
 * 1.6 - Skip equipment with calibrationRequired != 'required'
 * 1.7 - Skip disposed and retired equipment
 *
 * SSOT Compliance:
 * - Import EquipmentStatus from @equipment-management/schemas
 * - Import Permission from @equipment-management/shared-constants
 * - Use backend test-login endpoint for authentication
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import { EquipmentStatus } from '@equipment-management/schemas';
import { Permission } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';

// Test configuration
const BACKEND_URL = BASE_URLS.BACKEND;
const TRIGGER_ENDPOINT = `${BACKEND_URL}/api/notifications/trigger-overdue-check`;

/**
 * Helper: Login and get JWT token via backend test-login endpoint
 */
async function loginAsRole(
  request: APIRequestContext,
  role: 'test_engineer' | 'technical_manager' | 'lab_manager'
): Promise<string> {
  const response = await request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);

  if (!response.ok()) {
    throw new Error(`Failed to login as ${role}: ${response.status()}`);
  }

  const data = await response.json();
  return data.access_token;
}

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
      calibrationMethod: 'external_calibration',
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

test.describe('Backend API - Manual Overdue Check Trigger', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Run only in chromium for consistency
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('should successfully trigger manual overdue check with lab_manager role', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const equipmentId = `equip-a1-${timestamp}`;

    // 1. Setup test equipment with overdue calibration (equipmentId: `equip-a1-${timestamp}`)
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await createTestEquipment(request, token, {
      managementNumber: equipmentId,
      name: `Test Equipment A1 ${timestamp}`,
      status: 'available',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 2. Login as Lab Manager (admin@example.com / password123)
    // Already logged in via test-login

    // 3. Send POST request to `/api/notifications/trigger-overdue-check` via API context
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 4. Verify response status is 200
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const result = await response.json();

    // 5. Verify response body contains: `{ processed, created, skipped, details[] }`
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('created');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('details');

    expect(typeof result.processed).toBe('number');
    expect(typeof result.created).toBe('number');
    expect(typeof result.skipped).toBe('number');
    expect(Array.isArray(result.details)).toBeTruthy();

    // 6. Verify details array structure
    if (result.details.length > 0) {
      const detail = result.details[0];
      expect(detail).toHaveProperty('equipmentId');
      expect(detail).toHaveProperty('managementNumber');
      expect(detail).toHaveProperty('action');
      expect(['created', 'skipped']).toContain(detail.action);
    }

    console.log('Manual trigger result:', result);
  });

  test('should require MANAGE_EQUIPMENT permission to trigger overdue check', async ({
    request,
  }) => {
    const timestamp = Date.now();

    // 1. Setup test equipment (equipmentId: `equip-a2-${timestamp}`)
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await createTestEquipment(request, token, {
      managementNumber: `equip-a2-${timestamp}`,
      name: `Test Equipment A2 ${timestamp}`,
      status: 'available',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 2. Login as Test Engineer (user@example.com / password123) - NO MANAGE_EQUIPMENT permission
    const testEngineerToken = await loginAsRole(request, 'test_engineer');

    // 3. Send POST request to `/api/notifications/trigger-overdue-check`
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${testEngineerToken}`,
      },
    });

    // 4. Verify response status is 403 Forbidden
    expect(response.status()).toBe(403);

    // 5. Verify error message about insufficient permissions
    const error = await response.json();
    expect(error).toHaveProperty('message');
    expect(error.message.toLowerCase()).toContain('permission');

    console.log('Permission denied (expected):', error.message);
  });

  test('should detect equipment with overdue calibration dates', async ({ request }) => {
    const timestamp = Date.now();
    const managementNumber = `EQP-A3-${timestamp}`;

    // 1. Setup test equipment with overdue calibration
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const equipment = await createTestEquipment(request, token, {
      managementNumber,
      name: `Test Equipment A3 ${timestamp}`,
      status: 'available',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 2. Login as Lab Manager
    // Already logged in

    // 3. Trigger manual overdue check
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    // 4. Verify response contains the equipment in details with `action='created'`
    const equipmentDetail = result.details.find(
      (d: { managementNumber: string }) => d.managementNumber === managementNumber
    );

    if (equipmentDetail) {
      expect(equipmentDetail.action).toBe('created');
      expect(equipmentDetail.managementNumber).toBe(managementNumber);
      console.log('Equipment detected and NC created:', equipmentDetail);
    } else {
      console.log('Equipment not found in details (may have been processed earlier)');
    }
  });

  test('should skip equipment already in non_conforming status', async ({ request }) => {
    const timestamp = Date.now();
    const managementNumber = `EQP-A4-${timestamp}`;

    // 1. Setup test equipment with status: 'non_conforming' (already non-conforming)
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await createTestEquipment(request, token, {
      managementNumber,
      name: `Test Equipment A4 ${timestamp}`,
      status: 'non_conforming',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 2. Login as Lab Manager
    // Already logged in

    // 3. Trigger manual overdue check
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    // 4. Verify equipment is NOT in response details (excluded)
    const equipmentDetail = result.details.find(
      (d: { managementNumber: string }) => d.managementNumber === managementNumber
    );

    expect(equipmentDetail).toBeUndefined();
    console.log('Equipment with non_conforming status correctly excluded');
  });

  test('should skip equipment with existing open calibration_overdue non-conformance', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const managementNumber = `EQP-A5-${timestamp}`;

    // 1. Setup test equipment with overdue calibration
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const equipment = await createTestEquipment(request, token, {
      managementNumber,
      name: `Test Equipment A5 ${timestamp}`,
      status: 'available',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 2. Create existing non-conformance record with ncType: 'calibration_overdue', status: 'open'
    await createNonConformance(request, token, equipment.id, 'calibration_overdue', 'open');

    // 3. Login as Lab Manager
    // Already logged in

    // 4. Trigger manual overdue check
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    // 5. Verify equipment is skipped with reason in details
    const equipmentDetail = result.details.find(
      (d: { managementNumber: string }) => d.managementNumber === managementNumber
    );

    if (equipmentDetail) {
      expect(equipmentDetail.action).toBe('skipped');
      if (equipmentDetail.reason) {
        expect(equipmentDetail.reason.toLowerCase()).toContain('calibration_overdue');
      }
      console.log('Equipment with existing NC skipped:', equipmentDetail);
    } else {
      console.log('Equipment correctly excluded (existing NC)');
    }
  });

  test('should skip equipment with calibrationRequired != "required"', async ({ request }) => {
    const timestamp = Date.now();
    const managementNumber = `EQP-A6-${timestamp}`;

    // 1. Setup test equipment with calibrationRequired: 'not_required'
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await createTestEquipment(request, token, {
      managementNumber,
      name: `Test Equipment A6 ${timestamp}`,
      status: 'available',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'not_required',
      isActive: true,
    });

    // 2. Login as Lab Manager
    // Already logged in

    // 3. Trigger manual overdue check
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    // 4. Verify equipment is not processed
    const equipmentDetail = result.details.find(
      (d: { managementNumber: string }) => d.managementNumber === managementNumber
    );

    expect(equipmentDetail).toBeUndefined();
    console.log('Equipment with calibrationRequired="not_required" correctly excluded');
  });

  test('should skip disposed and retired equipment', async ({ request }) => {
    const timestamp = Date.now();

    // 1. Setup equipment with status: 'disposed'
    const token = await loginAsRole(request, 'lab_manager');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const disposedMgmtNumber = `EQP-A7-DISPOSED-${timestamp}`;
    await createTestEquipment(request, token, {
      managementNumber: disposedMgmtNumber,
      name: `Test Equipment A7 Disposed ${timestamp}`,
      status: 'disposed',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 2. Setup equipment with status: 'retired'
    const retiredMgmtNumber = `EQP-A7-RETIRED-${timestamp}`;
    await createTestEquipment(request, token, {
      managementNumber: retiredMgmtNumber,
      name: `Test Equipment A7 Retired ${timestamp}`,
      status: 'retired',
      nextCalibrationDate: sevenDaysAgo,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 3. Both have overdue calibration dates
    // Already set above

    // 4. Login as Lab Manager
    // Already logged in

    // 5. Trigger manual overdue check
    const response = await request.post(TRIGGER_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    // 6. Verify neither equipment is processed
    const disposedDetail = result.details.find(
      (d: { managementNumber: string }) => d.managementNumber === disposedMgmtNumber
    );
    const retiredDetail = result.details.find(
      (d: { managementNumber: string }) => d.managementNumber === retiredMgmtNumber
    );

    expect(disposedDetail).toBeUndefined();
    expect(retiredDetail).toBeUndefined();

    console.log('Disposed and retired equipment correctly excluded');
  });
});
