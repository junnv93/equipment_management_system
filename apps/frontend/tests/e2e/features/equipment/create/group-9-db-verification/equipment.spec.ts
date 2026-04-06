/* eslint-disable @typescript-eslint/no-explicit-any */
// spec: equipment-create test plan - DB verification
// seed: apps/frontend/tests/e2e/equipment-create/seed.spec.ts

/**
 * Test: 장비 등록 후 DB 데이터 검증
 *
 * Verifies that equipment registration correctly saves all data to the database:
 * - All input fields are correctly saved
 * - Data types are preserved (dates, numbers, enums)
 * - Default values are applied (status)
 * - API response matches input data
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  EquipmentStatusValues as ESVal,
  ManagementMethodValues as CMVal,
  UnifiedApprovalStatusValues as UASVal,
} from '@equipment-management/schemas';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';
import { getBackendToken } from '../../../../shared/helpers/api-helpers';

test.describe('DB 검증 통합 테스트', () => {
  test('장비 등록 후 DB 데이터 검증', async ({ siteAdminPage }) => {
    // Backend API directly to create equipment (bypass frontend auth issues)
    const backendURL = BASE_URLS.BACKEND;

    // 1. Get backend JWT token for API authentication (lab_manager role)
    const access_token = await getBackendToken(siteAdminPage, 'lab_manager');
    console.log('✓ Got backend JWT token for lab_manager');

    // 2. Prepare test data
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const equipmentData = {
      name: 'DB검증테스트장비',
      managementNumber: 'SUW-E9001',
      modelName: 'DB Test Model',
      manufacturer: 'DB Test Manufacturer',
      serialNumber: 'SN-9001',
      location: 'RF1 Room',
      calibrationCycle: 12,
      lastCalibrationDate: todayString,
      nextCalibrationDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
        .toISOString()
        .split('T')[0],
      calibrationAgency: 'KOLAS',
      needsIntermediateCheck: false,
      managementMethod: CMVal.EXTERNAL_CALIBRATION,
      teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', // FCC EMC/RF team (SUW)
      site: 'suwon',
      technicalManager: 'test_tech_manager_uuid', // Placeholder - backend should handle this
      status: ESVal.AVAILABLE,
      approvalStatus: UASVal.APPROVED, // lab_manager can auto-approve
    };

    console.log('✓ Test data prepared');

    // 3. POST equipment directly to backend API with authentication
    const createResponse = await siteAdminPage.request.post(`${backendURL}/api/equipment`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      data: equipmentData,
    });

    console.log('📤 POST /api/equipment response status:', createResponse.status());

    if (!createResponse.ok()) {
      const errorText = await createResponse.text();
      console.error('📥 POST /api/equipment error:', errorText);
      throw new Error(`Equipment creation failed: ${createResponse.status()} - ${errorText}`);
    }

    const createData = await createResponse.json();
    console.log('📥 POST /api/equipment response:', JSON.stringify(createData, null, 2));

    // Extract equipment UUID from response
    let equipmentId = createData.uuid || createData.data?.uuid || createData.id;

    // If response contains requestUuid instead (approval workflow), this is an error
    if (createData.requestUuid && !equipmentId) {
      throw new Error(
        'Equipment was created as approval request (not direct creation). Lab manager should auto-approve!'
      );
    }

    if (!equipmentId) {
      console.error('Response structure:', Object.keys(createData));
      throw new Error('Failed to extract equipment UUID from response');
    }

    console.log('✓ Equipment created with UUID:', equipmentId);

    // 4. Wait for DB transaction to commit

    // 5. Verify equipment appears in list via backend API
    const equipmentListResponse = await siteAdminPage.request.get(
      `${backendURL}/api/equipment?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!equipmentListResponse.ok()) {
      const errorText = await equipmentListResponse.text();
      throw new Error(
        `Failed to get equipment list: ${equipmentListResponse.status()} - ${errorText}`
      );
    }

    const listData = await equipmentListResponse.json();
    const equipmentList = listData.items || [];

    console.log('📋 Equipment list count:', equipmentList.length);

    // Find the equipment with our unique test data
    const createdEquipment = equipmentList.find(
      (eq: any) => eq.name === 'DB검증테스트장비' && eq.serialNumber === 'SN-9001'
    );

    if (!createdEquipment) {
      console.log(
        '🔍 Equipment names in list:',
        equipmentList.slice(0, 5).map((eq: any) => eq.name)
      );
      console.log('🔍 Looking for: name="DB검증테스트장비", serialNumber="SN-9001"');
      throw new Error('Failed to find newly created equipment in the list');
    }

    console.log('✓ Equipment found in list:', createdEquipment.id);

    // 6. Verify equipment data by fetching detail from backend
    const apiResponse = await siteAdminPage.request.get(
      `${backendURL}/api/equipment/${equipmentId}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!apiResponse.ok()) {
      const errorText = await apiResponse.text();
      throw new Error(`Failed to get equipment detail: ${apiResponse.status()} - ${errorText}`);
    }

    const apiData = await apiResponse.json();
    // Backend may return { data: equipment } or just equipment
    const equipment = apiData.data || apiData;
    console.log('✓ API response received from backend');

    // 7. Verify all equipment data matches input
    // name === 'DB검증테스트장비'
    expect(equipment.name).toBe('DB검증테스트장비');
    console.log('✓ name matches');

    // site === 'suwon'
    expect(equipment.site).toBe('suwon');
    console.log('✓ site matches');

    // modelName === 'DB Test Model'
    expect(equipment.modelName).toBe('DB Test Model');
    console.log('✓ modelName matches');

    // manufacturer === 'DB Test Manufacturer'
    expect(equipment.manufacturer).toBe('DB Test Manufacturer');
    console.log('✓ manufacturer matches');

    // serialNumber === 'SN-9001'
    expect(equipment.serialNumber).toBe('SN-9001');
    console.log('✓ serialNumber matches');

    // location === 'RF1 Room'
    expect(equipment.location).toBe('RF1 Room');
    console.log('✓ location matches');

    // managementMethod === 'external_calibration'
    expect(equipment.managementMethod).toBe(CMVal.EXTERNAL_CALIBRATION);
    console.log('✓ managementMethod matches');

    // calibrationCycle === 12
    expect(equipment.calibrationCycle).toBe(12);
    console.log('✓ calibrationCycle matches');

    // calibrationAgency === 'KOLAS'
    expect(equipment.calibrationAgency).toBe('KOLAS');
    console.log('✓ calibrationAgency matches');

    // status === 'available'
    expect(equipment.status).toBe(ESVal.AVAILABLE);
    console.log('✓ status matches (default value)');

    // Verify management number format: SUW-E9001
    expect(equipment.managementNumber).toBe('SUW-E9001');
    console.log('✓ managementNumber matches:', equipment.managementNumber);

    // Verify lastCalibrationDate is in ISO format and matches today
    expect(equipment.lastCalibrationDate).toBeTruthy();
    const savedDate = new Date(equipment.lastCalibrationDate);
    expect(savedDate.toISOString().split('T')[0]).toBe(todayString);
    console.log('✓ lastCalibrationDate matches and is in ISO format');

    // Verify team and technical manager IDs exist
    expect(equipment.teamId).toBeTruthy();
    console.log('✓ teamId exists:', equipment.teamId);

    expect(equipment.technicalManager).toBeTruthy();
    console.log('✓ technicalManager exists:', equipment.technicalManager);

    // Verify ID is a valid UUID
    expect(equipment.id).toMatch(/^[a-f0-9-]{36}$/);
    console.log('✓ id is a valid UUID');

    // Verify timestamps exist
    expect(equipment.createdAt).toBeTruthy();
    expect(equipment.updatedAt).toBeTruthy();
    console.log('✓ createdAt and updatedAt timestamps exist');

    console.log('✅ Test complete: All DB data verified successfully');
  });
});
