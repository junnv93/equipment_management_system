/**
 * Seed File for Group 2: Backend API - Non-Conformance Creation
 * Calibration Overdue Auto Non-Conformance
 *
 * Purpose: Ensures backend API and database are accessible for NC creation testing
 * Seed Strategy: No pre-seeded data required - tests create their own equipment
 */

import { test, expect } from '@playwright/test';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { BASE_URLS } from '../../../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

test.describe('Group 2: NC Creation - Seed Setup', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Verify backend API is accessible', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/auth/test`);
    expect(response.ok()).toBeTruthy();
    console.log('✅ Backend API accessible');
  });

  test('Verify test-login endpoint works for lab_manager', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('access_token');
    expect(data.user.role).toBe('lab_manager');
    console.log('✅ Test login successful for lab_manager');
  });

  test('Verify equipment API endpoints exist', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    // Verify equipment list endpoint
    const equipmentResponse = await request.get(`${BACKEND_URL}/api/equipment`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(equipmentResponse.ok()).toBeTruthy();
    console.log('✅ Equipment API accessible');
  });

  test('Verify non-conformance API endpoints exist', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    // Verify non-conformances list endpoint
    const ncResponse = await request.get(`${BACKEND_URL}/api/non-conformances`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(ncResponse.ok()).toBeTruthy();
    console.log('✅ Non-conformance API accessible');
  });

  test('Verify notifications API endpoints exist', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    // Verify notifications list endpoint
    const notificationsResponse = await request.get(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(notificationsResponse.ok()).toBeTruthy();
    console.log('✅ Notifications API accessible');
  });

  test('Verify trigger-overdue-check endpoint exists', async ({ request }) => {
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

    console.log('✅ Trigger endpoint accessible');
  });
});
