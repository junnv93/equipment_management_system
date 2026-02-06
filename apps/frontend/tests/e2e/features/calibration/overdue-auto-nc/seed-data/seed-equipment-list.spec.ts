/**
 * Seed File for Group 5: Frontend - Equipment List Integration
 * Calibration Overdue Auto Non-Conformance
 *
 * Purpose: Ensures frontend can access equipment list page for UI testing
 * Seed Strategy: Verify page accessibility and basic rendering
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.PLAYWRIGHT_BACKEND_URL || 'http://localhost:3001';

test.describe('Group 5: Equipment List Integration - Seed Setup', () => {
  test.beforeEach(async ({}, testInfo) => {
    // Only run on chromium
    if (testInfo.project.name && testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('Verify backend equipment API is accessible', async ({ request }) => {
    const loginResponse = await request.get(`${BACKEND_URL}/api/auth/test-login?role=lab_manager`);
    const { access_token } = await loginResponse.json();

    const response = await request.get(`${BACKEND_URL}/api/equipment`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('meta');

    console.log('✅ Backend equipment API accessible');
  });
});
