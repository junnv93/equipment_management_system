/**
 * Seed File for Group 7: Permission Tests
 * Calibration Overdue Auto Non-Conformance
 *
 * Purpose: Verify authentication and authorization setup for permission testing
 * Seed Strategy: Validate backend endpoints and role permissions are configured correctly
 *
 * SSOT Compliance:
 * - Permission enum from @equipment-management/shared-constants
 * - Backend test-login endpoint for authentication
 */

import { test, expect } from '@playwright/test';
import { Permission, API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

test.describe('Group 7: Permission Tests - Seed Setup', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('seed - Verify backend API is accessible', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/auth/test`);
    expect(response.ok()).toBeTruthy();
    console.log('✅ Backend API accessible');
  });

  test('seed - Verify test-login endpoint works for all required roles', async ({ request }) => {
    const roles = ['test_engineer', 'technical_manager', 'lab_manager'];

    for (const role of roles) {
      const response = await request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('access_token');
      expect(data.user.roles).toContain(role);
      console.log(`✅ Test login successful for role: ${role}`);
    }
  });

  test('seed - Verify trigger-overdue-check endpoint exists', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    const response = await request.post(
      `${BACKEND_URL}${API_ENDPOINTS.NOTIFICATIONS.TRIGGER_OVERDUE_CHECK}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('created');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('details');

    console.log('✅ Trigger endpoint accessible and returns expected structure');
  });

  test('seed - Verify Permission.UPDATE_EQUIPMENT constant exists', async () => {
    // Validate SSOT - Permission enum is correctly imported
    expect(Permission.UPDATE_EQUIPMENT).toBe('update:equipment');
    console.log('✅ Permission.UPDATE_EQUIPMENT imported from SSOT:', Permission.UPDATE_EQUIPMENT);
  });

  test('seed - Verify equipment API endpoints are accessible', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    // Verify equipment list endpoint
    const equipmentResponse = await request.get(`${BACKEND_URL}/api/equipment`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    expect(equipmentResponse.ok()).toBeTruthy();
    console.log('✅ Equipment API endpoints accessible');
  });
});
