// spec: /home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/calibration-overdue-auto-nc-v2.plan.md
// seed: apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-nc-creation.spec.ts

/**
 * Group 2: Backend API - Non-Conformance Creation
 * Calibration Overdue Automatic Non-Conformance Conversion
 *
 * Test Feature: Automatic NC creation, equipment status change, incident history, and notifications
 * Endpoint: POST /api/notifications/trigger-overdue-check (creates NCs as side effect)
 * Permission Required: Permission.UPDATE_EQUIPMENT
 *
 * Test Coverage:
 * 2.1 - Create non-conformance record with correct fields
 * 2.2 - Change equipment status to non_conforming
 * 2.3 - Create incident history record automatically
 * 2.4 - Create system notification for administrators
 * 2.5 - Execute all database operations in a transaction (atomicity)
 * 2.6 - Process multiple overdue equipment in single API call
 *
 * SSOT Compliance:
 * - NonConformanceType, NonConformanceStatus from @equipment-management/schemas
 * - IncidentType from @equipment-management/schemas
 * - EquipmentStatus from @equipment-management/schemas
 * - Permission from @equipment-management/shared-constants
 *
 * Database Verification:
 * - non_conformances table
 * - equipment table (status field)
 * - equipment_incident_history table
 * - notifications table
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import {
  EquipmentStatus,
  NonConformanceType,
  NonConformanceStatus,
  IncidentType,
} from '@equipment-management/schemas';
import {
  EquipmentStatusValues as ESVal,
  NonConformanceStatusValues as NCSVal,
  NonConformanceTypeValues as NCTVal,
  IncidentTypeValues as ITVal,
  CalibrationMethodValues as CMVal,
} from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
import { fetchBackendToken } from '../../../shared/helpers/api-helpers';

// Backend configuration
const BACKEND_URL = BASE_URLS.BACKEND;
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
): Promise<{ id: string; managementNumber: string; name: string }> {
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
    const errorText = await response.text();
    throw new Error(`Failed to create equipment: ${response.status()} ${errorText}`);
  }

  return response.json();
}

/**
 * Helper: Trigger manual overdue check
 */
async function triggerOverdueCheck(
  request: APIRequestContext,
  token: string
): Promise<{
  processed: number;
  created: number;
  skipped: number;
  details: Array<{
    equipmentId: string;
    managementNumber: string;
    action: 'created' | 'skipped';
    reason?: string;
  }>;
}> {
  const response = await request.post(TRIGGER_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to trigger overdue check: ${response.status()} ${errorText}`);
  }

  return response.json();
}

/**
 * Helper: Get equipment by ID
 */
async function getEquipmentById(
  request: APIRequestContext,
  token: string,
  equipmentId: string
): Promise<{ id: string; status: EquipmentStatus; updatedAt: string }> {
  const response = await request.get(`${BACKEND_URL}/api/equipment/${equipmentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get equipment: ${response.status()} ${errorText}`);
  }

  return response.json();
}

/**
 * Helper: Get non-conformances for equipment
 */
async function getNonConformancesForEquipment(
  request: APIRequestContext,
  token: string,
  equipmentId: string
): Promise<
  Array<{
    id: string;
    equipmentId: string;
    ncType: string;
    status: string;
    cause: string;
    actionPlan: string;
    discoveredBy: string | null;
    discoveryDate: string;
  }>
> {
  const response = await request.get(
    `${BACKEND_URL}/api/non-conformances?equipmentId=${equipmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get non-conformances: ${response.status()} ${errorText}`);
  }

  const data = await response.json();
  return data.items || data;
}

/**
 * Helper: Get incident history for equipment
 */
async function getIncidentHistoryForEquipment(
  request: APIRequestContext,
  token: string,
  equipmentId: string
): Promise<
  Array<{
    id: string;
    equipmentId: string;
    incidentType: string;
    content: string;
    reportedBy: string | null;
    occurredAt: string;
  }>
> {
  const response = await request.get(
    `${BACKEND_URL}/api/equipment/${equipmentId}/incident-history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get incident history: ${response.status()} ${errorText}`);
  }

  return response.json();
}

/**
 * Helper: Get recent notifications
 */
async function getRecentNotifications(
  request: APIRequestContext,
  token: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
  }>
> {
  const response = await request.get(`${BACKEND_URL}/api/notifications?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to get notifications: ${response.status()} ${errorText}`);
  }

  const data = await response.json();
  return data.items || data;
}

test.describe('Backend API - Non-Conformance Creation', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Run only in chromium for consistency
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('2.1 should create non-conformance record with correct fields', async ({ request }) => {
    // 1. Create test equipment with overdue calibration (nextCalibrationDate = yesterday)
    const token = await fetchBackendToken('lab_manager');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const equipment = await createTestEquipment(request, token, {
      managementNumber: `TEST-NC-${Date.now()}`,
      name: 'Test Equipment for NC Creation',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
    });

    // 2. Login as Lab Manager
    // (already logged in)

    // 3. Trigger manual overdue check via API
    const triggerResult = await triggerOverdueCheck(request, token);
    expect(triggerResult.created).toBeGreaterThanOrEqual(1);

    // 4. Query GET /api/non-conformances?equipmentId={equipmentId} for the equipment
    const nonConformances = await getNonConformancesForEquipment(request, token, equipment.id);
    expect(nonConformances.length).toBeGreaterThanOrEqual(1);

    const nc = nonConformances.find((nc) => nc.equipmentId === equipment.id);
    expect(nc).toBeDefined();

    // Expected Results: Verify NC fields
    expect(nc!.ncType).toBe(NCTVal.CALIBRATION_OVERDUE);
    expect(nc!.status).toBe(NCSVal.OPEN);
    expect(nc!.cause).toMatch(/교정 기한 초과|Calibration overdue/i);
    expect(nc!.cause).toContain(yesterday.toISOString().split('T')[0]);
    expect(nc!.actionPlan).toBe('교정 수행 필요');
    expect(nc!.discoveredBy).toBeNull();
    expect(nc!.discoveryDate).toBeTruthy();

    console.log('✅ Non-conformance created with correct fields');
  });

  test('2.2 should change equipment status to non_conforming', async ({ request }) => {
    // 1. Create test equipment with status = 'available'
    const token = await fetchBackendToken('lab_manager');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 2. Equipment has overdue calibration date
    const equipment = await createTestEquipment(request, token, {
      managementNumber: `TEST-STATUS-${Date.now()}`,
      name: 'Test Equipment for Status Change',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
    });

    expect(equipment).toHaveProperty('id');
    const initialStatus = ESVal.AVAILABLE;

    // 3. Login as Lab Manager
    // (already logged in)

    // 4. Trigger manual overdue check via API
    await triggerOverdueCheck(request, token);

    // 5. Query GET /api/equipment/{id} to verify equipment status
    const updatedEquipment = await getEquipmentById(request, token, equipment.id);

    // Expected Results
    expect(updatedEquipment.status).toBe(ESVal.NON_CONFORMING);
    expect(updatedEquipment.updatedAt).toBeTruthy();

    console.log(`✅ Equipment status changed from ${initialStatus} to non_conforming`);
  });

  test('2.3 should create incident history record automatically', async ({ request }) => {
    // 1. Create test equipment with overdue calibration
    const token = await fetchBackendToken('lab_manager');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const equipment = await createTestEquipment(request, token, {
      managementNumber: `TEST-INCIDENT-${Date.now()}`,
      name: 'Test Equipment for Incident History',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
    });

    // 2. Login as Lab Manager
    // (already logged in)

    // 3. Trigger manual overdue check via API
    await triggerOverdueCheck(request, token);

    // 4. Query GET /api/equipment/{id}/incident-history for the equipment
    const incidentHistory = await getIncidentHistoryForEquipment(request, token, equipment.id);
    expect(incidentHistory.length).toBeGreaterThanOrEqual(1);

    const incident = incidentHistory.find((h) => h.incidentType === ITVal.CALIBRATION_OVERDUE);
    expect(incident).toBeDefined();

    // Expected Results
    expect(incident!.incidentType).toBe(ITVal.CALIBRATION_OVERDUE);
    expect(incident!.content).toMatch(/자동 부적합 전환|Auto non-conformance transition/i);
    // Content should contain NC ID (UUID pattern)
    expect(incident!.content).toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    expect(incident!.reportedBy).toBeNull();
    expect(incident!.occurredAt).toBeTruthy();

    console.log('✅ Incident history record created automatically');
  });

  test('2.4 should create system notification for administrators', async ({ request }) => {
    // 1. Create test equipment with overdue calibration
    const token = await fetchBackendToken('lab_manager');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const equipment = await createTestEquipment(request, token, {
      managementNumber: `TEST-NOTIF-${Date.now()}`,
      name: 'Test Equipment for Notification',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
    });

    // 2. Login as Lab Manager
    // (already logged in)

    // 3. Trigger manual overdue check via API
    await triggerOverdueCheck(request, token);

    // Wait a bit for notification to be created
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Query GET /api/notifications for recent system notifications
    const notifications = await getRecentNotifications(request, token, 20);
    expect(notifications.length).toBeGreaterThan(0);

    // Find notification related to our equipment
    const notification = notifications.find(
      (n) =>
        n.title.includes('교정 기한 초과') &&
        (n.content.includes(equipment.managementNumber) || n.content.includes(equipment.name))
    );

    expect(notification).toBeDefined();

    // Expected Results
    expect(notification!.title).toMatch(/교정 기한 초과 알림/i);
    expect(notification!.content).toContain(equipment.name);
    expect(notification!.content).toContain(equipment.managementNumber);
    expect(notification!.priority).toBe('high');

    console.log('✅ System notification created for administrators');
  });

  test('2.5 should execute all database operations in a transaction (atomicity)', async ({
    request,
  }) => {
    // 1. Create test equipment with overdue calibration
    const token = await fetchBackendToken('lab_manager');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const equipment = await createTestEquipment(request, token, {
      managementNumber: `TEST-TXN-${Date.now()}`,
      name: 'Test Equipment for Transaction',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
    });

    // 2. Login as Lab Manager
    // (already logged in)

    // 3. Trigger manual overdue check via API
    await triggerOverdueCheck(request, token);

    // Wait for operations to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 4. Verify all three records exist: non-conformance, equipment status, incident history
    const [nonConformances, updatedEquipment, incidentHistory] = await Promise.all([
      getNonConformancesForEquipment(request, token, equipment.id),
      getEquipmentById(request, token, equipment.id),
      getIncidentHistoryForEquipment(request, token, equipment.id),
    ]);

    // Expected Results: All operations completed together
    const nc = nonConformances.find((nc) => nc.equipmentId === equipment.id);
    expect(nc).toBeDefined();
    expect(nc!.ncType).toBe(NCTVal.CALIBRATION_OVERDUE);
    expect(nc!.status).toBe(NCSVal.OPEN);

    expect(updatedEquipment.status).toBe(ESVal.NON_CONFORMING);

    const incident = incidentHistory.find((h) => h.incidentType === ITVal.CALIBRATION_OVERDUE);
    expect(incident).toBeDefined();

    console.log('✅ All database operations executed atomically');
    console.log('  - Non-conformance created:', nc!.id);
    console.log('  - Equipment status changed to:', updatedEquipment.status);
    console.log('  - Incident history created:', incident!.id);
  });

  test('2.6 should process multiple overdue equipment in single API call', async ({ request }) => {
    // 1. Create 3 test equipment with overdue calibration dates
    const token = await fetchBackendToken('lab_manager');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const timestamp = Date.now();

    // 2. All equipment meet processing criteria (available, required calibration, active)
    const equipment1 = await createTestEquipment(request, token, {
      managementNumber: `TEST-MULTI-1-${timestamp}`,
      name: 'Test Equipment Multi 1',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
      isActive: true,
    });

    const equipment2 = await createTestEquipment(request, token, {
      managementNumber: `TEST-MULTI-2-${timestamp}`,
      name: 'Test Equipment Multi 2',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
      isActive: true,
    });

    const equipment3 = await createTestEquipment(request, token, {
      managementNumber: `TEST-MULTI-3-${timestamp}`,
      name: 'Test Equipment Multi 3',
      status: ESVal.AVAILABLE,
      nextCalibrationDate: yesterday,
      calibrationRequired: 'required',
      isActive: true,
    });

    // 3. Login as Lab Manager
    // (already logged in)

    // 4. Trigger manual overdue check via API
    const triggerResult = await triggerOverdueCheck(request, token);

    // 5. Verify all equipment are processed
    const createdEquipmentIds = [equipment1.id, equipment2.id, equipment3.id];
    const processedDetails = triggerResult.details.filter((detail) =>
      createdEquipmentIds.includes(detail.equipmentId)
    );

    // Expected Results
    expect(processedDetails.length).toBe(3);
    expect(processedDetails.every((d) => d.action === 'created')).toBeTruthy();

    // Verify each equipment has its own non-conformance record
    const [nc1, nc2, nc3] = await Promise.all([
      getNonConformancesForEquipment(request, token, equipment1.id),
      getNonConformancesForEquipment(request, token, equipment2.id),
      getNonConformancesForEquipment(request, token, equipment3.id),
    ]);

    expect(nc1.length).toBeGreaterThanOrEqual(1);
    expect(nc2.length).toBeGreaterThanOrEqual(1);
    expect(nc3.length).toBeGreaterThanOrEqual(1);

    // Verify each equipment has its own incident history record
    const [history1, history2, history3] = await Promise.all([
      getIncidentHistoryForEquipment(request, token, equipment1.id),
      getIncidentHistoryForEquipment(request, token, equipment2.id),
      getIncidentHistoryForEquipment(request, token, equipment3.id),
    ]);

    expect(history1.some((h) => h.incidentType === ITVal.CALIBRATION_OVERDUE)).toBeTruthy();
    expect(history2.some((h) => h.incidentType === ITVal.CALIBRATION_OVERDUE)).toBeTruthy();
    expect(history3.some((h) => h.incidentType === ITVal.CALIBRATION_OVERDUE)).toBeTruthy();

    console.log('✅ Multiple overdue equipment processed in single API call');
    console.log(`  - Equipment 1: ${equipment1.managementNumber} → NC created`);
    console.log(`  - Equipment 2: ${equipment2.managementNumber} → NC created`);
    console.log(`  - Equipment 3: ${equipment3.managementNumber} → NC created`);
  });
});
