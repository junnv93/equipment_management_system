/**
 * Seed File for Group 1: Backend API - Manual Overdue Check Trigger
 * Calibration Overdue Auto Non-Conformance
 *
 * Purpose: Ensures backend API and database are accessible for testing
 * Seed Strategy: No pre-seeded data required - tests create their own equipment
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL || 'http://localhost:3001';

test.describe('Group 1: Manual Overdue Check Trigger - Seed Setup', () => {
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

  test('Verify test-login endpoint works for required roles', async ({ request }) => {
    const roles = ['test_engineer', 'lab_manager'];

    for (const role of roles) {
      const response = await request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('access_token');
      expect(data.user.role).toBe(role);
      console.log(`✅ Test login successful for role: ${role}`);
    }
  });

  test('Verify trigger-overdue-check endpoint exists', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    const response = await request.post(`${BACKEND_URL}/api/notifications/trigger-overdue-check`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result).toHaveProperty('processed');
    expect(result).toHaveProperty('created');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('details');

    console.log('✅ Trigger endpoint accessible');
  });
});
