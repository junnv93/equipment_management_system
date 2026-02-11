/**
 * Checkout Race Condition Prevention Tests
 *
 * ✅ Phase 1: Optimistic Locking (Compare-And-Swap)
 *
 * Tests that concurrent mutations are properly prevented using version-based
 * optimistic locking at the database level.
 *
 * Test Strategy:
 * - Use Promise.allSettled() to guarantee true simultaneity
 * - Verify 409 Conflict responses contain version information
 * - Validate DB state after concurrent operations
 * - Test UI auto-retry mechanism
 */

import { test as base, expect } from '@playwright/test';
import { test as authTest } from '../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS, BASE_URLS } from '../../shared/constants/shared-test-data';
import { getBackendToken, apiPost, apiPatch, apiGet } from './helpers/checkout-helpers';

// Backend API URL
const BACKEND_URL = BASE_URLS.BACKEND;

// Use base test for API-only tests
const test = base;

// Configure serial execution to prevent test interference
test.describe.configure({ mode: 'serial' });

// Use authTest for all tests to get authenticated request context
authTest.describe('Checkout Race Condition Prevention', () => {
  authTest.beforeEach(async () => {
    // Test isolation: Each test should reset the checkout state
    // This would typically be handled by a DB cleanup helper
  });

  authTest(
    'P0-RACE-01: prevents concurrent approve/reject via optimistic locking',
    async ({ techManagerPage }) => {
      const page = techManagerPage;
      const token = await getBackendToken(page, 'technical_manager');

      // Setup: Create a pending checkout via API
      const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          equipmentIds: [TEST_EQUIPMENT_IDS.EQUIPMENT_1],
          destination: 'Race Condition Test Lab',
          phoneNumber: '010-1234-5678',
          purpose: 'calibration',
          reason: 'Testing concurrent operations',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const checkout = await createResponse.json();
      const checkoutId = checkout.id;
      const initialVersion = checkout.version;

      console.log(`Created checkout ${checkoutId} with version ${initialVersion}`);

      // Execute: Simulate concurrent approve + reject with same version
      const [result1, result2] = await Promise.allSettled([
        page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: initialVersion },
        }),
        page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/reject`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: initialVersion, reason: 'Test rejection' },
        }),
      ]);

      // Assert: Exactly one succeeds, one fails with 409
      const results = [result1, result2];
      const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.ok());
      const failed = results.filter((r) => r.status === 'fulfilled' && r.value.status() === 409);

      console.log(
        `Result 1: ${result1.status} - ${result1.status === 'fulfilled' ? result1.value.status() : 'N/A'}`
      );
      console.log(
        `Result 2: ${result2.status} - ${result2.status === 'fulfilled' ? result2.value.status() : 'N/A'}`
      );
      console.log(`Succeeded: ${succeeded.length}, Failed (409): ${failed.length}`);

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // Verify 409 response contains version conflict information
      const failedResult = failed[0] as PromiseFulfilledResult<any>;
      const failedJson = await failedResult.value.json();

      expect(failedJson).toMatchObject({
        message: expect.stringContaining('다른 사용자'),
        code: 'VERSION_CONFLICT',
        currentVersion: initialVersion + 1,
        expectedVersion: initialVersion,
      });

      // Get the successful result to verify it actually updated the checkout
      const successResult = succeeded[0] as PromiseFulfilledResult<any>;
      const successJson = await successResult.value.json();
      console.log(
        `Successful operation result: status=${successJson.status}, version=${successJson.version}`
      );

      // Verify final DB state: checkout should be in one of the two states
      // Small delay to ensure DB write is committed
      await page.waitForTimeout(100);

      const finalResponse = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const finalCheckout = await finalResponse.json();

      expect(['approved', 'rejected']).toContain(finalCheckout.status);
      expect(finalCheckout.version).toBe(initialVersion + 1);

      console.log(`Final state: status=${finalCheckout.status}, version=${finalCheckout.version}`);
    }
  );

  authTest(
    'P0-RACE-02: prevents concurrent approve/approve (double approval)',
    async ({ techManagerPage }) => {
      const page = techManagerPage;
      const token = await getBackendToken(page, 'technical_manager');
      // Setup: Create pending checkout
      const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          equipmentIds: [TEST_EQUIPMENT_IDS.EQUIPMENT_2],
          destination: 'Double Approval Test',
          phoneNumber: '010-5678-1234',
          purpose: 'repair',
          reason: 'Testing double approval prevention',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const checkout = await createResponse.json();
      const checkoutId = checkout.id;
      const initialVersion = checkout.version;

      // Execute: Two simultaneous approvals
      const [result1, result2] = await Promise.allSettled([
        page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: initialVersion },
        }),
        page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: initialVersion },
        }),
      ]);

      // Assert: One succeeds, one gets 409
      const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled' && r.value.ok());
      const conflicted = [result1, result2].filter(
        (r) => r.status === 'fulfilled' && r.value.status() === 409
      );

      expect(succeeded).toHaveLength(1);
      expect(conflicted).toHaveLength(1);

      // Verify final state: exactly one approval recorded
      const finalResponse = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const finalCheckout = await finalResponse.json();

      expect(finalCheckout.status).toBe('approved');
      expect(finalCheckout.version).toBe(initialVersion + 1);
    }
  );

  authTest(
    'P1-RACE-03: sequential operations succeed with correct version',
    async ({ techManagerPage }) => {
      const page = techManagerPage;
      const token = await getBackendToken(page, 'technical_manager');
      // Setup: Create pending checkout
      const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          equipmentIds: [TEST_EQUIPMENT_IDS.EQUIPMENT_3],
          destination: 'Sequential Operations Test',
          phoneNumber: '010-9999-8888',
          purpose: 'calibration',
          reason: 'Testing sequential version updates',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const checkout = await createResponse.json();
      let checkoutId = checkout.id;
      let currentVersion = checkout.version;

      // Step 1: Approve (version 1 → 2)
      const approveResponse = await page.request.patch(
        `${BACKEND_URL}/api/checkouts/${checkoutId}/approve`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: currentVersion },
        }
      );
      expect(approveResponse.ok()).toBeTruthy();

      const approved = await approveResponse.json();
      expect(approved.status).toBe('approved');
      expect(approved.version).toBe(currentVersion + 1);
      currentVersion = approved.version;

      // Step 2: Start checkout (version 2 → 3)
      const startResponse = await page.request.post(
        `${BACKEND_URL}/api/checkouts/${checkoutId}/start`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: currentVersion },
        }
      );
      expect(startResponse.ok()).toBeTruthy();

      const started = await startResponse.json();
      expect(started.status).toBe('checked_out');
      expect(started.version).toBe(currentVersion + 1);
      currentVersion = started.version;

      // Step 3: Return (version 3 → 4)
      const returnResponse = await page.request.post(
        `${BACKEND_URL}/api/checkouts/${checkoutId}/return`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            version: currentVersion,
            calibrationChecked: true,
            repairChecked: false,
            workingStatusChecked: true,
            inspectionNotes: 'All checks passed',
          },
        }
      );
      expect(returnResponse.ok()).toBeTruthy();

      const returned = await returnResponse.json();
      expect(returned.status).toBe('returned');
      expect(returned.version).toBe(currentVersion + 1);
      currentVersion = returned.version;

      // Step 4: Approve return (version 4 → 5)
      const approveReturnResponse = await page.request.patch(
        `${BACKEND_URL}/api/checkouts/${checkoutId}/approve-return`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { version: currentVersion },
        }
      );
      expect(approveReturnResponse.ok()).toBeTruthy();

      const completed = await approveReturnResponse.json();
      expect(completed.status).toBe('return_approved');
      expect(completed.version).toBe(currentVersion + 1);

      console.log(`Sequential flow completed successfully. Final version: ${completed.version}`);
    }
  );

  authTest('P1-RACE-04: stale version is rejected at any step', async ({ techManagerPage }) => {
    const page = techManagerPage;
    const token = await getBackendToken(page, 'technical_manager');
    // Setup: Create and approve a checkout
    // Use EQUIPMENT_1 (same team as technical_manager) to avoid team permission issues
    const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        equipmentIds: [TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E], // Same team
        destination: 'Stale Version Test',
        phoneNumber: '010-7777-6666',
        purpose: 'repair',
        reason: 'Testing stale version rejection',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    console.log(`Create response status: ${createResponse.status()}`);
    if (!createResponse.ok()) {
      const errorText = await createResponse.text();
      console.log(`Create failed: ${errorText}`);
    }
    const checkout = await createResponse.json();
    console.log(`Checkout created: id=${checkout?.id}, version=${checkout?.version}`);
    const checkoutId = checkout.id;
    const staleVersion = checkout.version;

    // Approve (version 1 → 2)
    await page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { version: staleVersion },
    });

    // Attempt to start with stale version (should fail)
    console.log(
      `DEBUG: checkoutId=${checkoutId}, staleVersion=${staleVersion}, typeof staleVersion=${typeof staleVersion}`
    );
    const staleStartResponse = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/start`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { version: staleVersion }, // Using version 1 when current is 2
      }
    );

    console.log(`Stale start response status: ${staleStartResponse.status()}`);
    if (staleStartResponse.status() !== 409) {
      const errorBody = await staleStartResponse.text();
      console.log(`Unexpected error response: ${errorBody}`);
    }

    expect(staleStartResponse.status()).toBe(409);

    const errorJson = await staleStartResponse.json();
    expect(errorJson).toMatchObject({
      code: 'VERSION_CONFLICT',
      currentVersion: staleVersion + 1,
      expectedVersion: staleVersion,
    });
  });
});

authTest.describe('Checkout UI Auto-Retry', () => {
  authTest(
    'P2-UI-01: auto-retry recovers from version conflict in UI',
    async ({ techManagerPage: page }) => {
      // Setup: Create pending checkout
      const createResponse = await page.request.post('/api/checkouts', {
        data: {
          equipmentIds: [TEST_EQUIPMENT_IDS.EQUIPMENT_5],
          destination: 'UI Auto-Retry Test',
          phoneNumber: '010-5555-4444',
          purpose: 'calibration',
          reason: 'Testing UI auto-retry',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const checkout = await createResponse.json();
      const checkoutId = checkout.id;

      // Navigate to checkout detail page
      await page.goto(`/checkouts/${checkoutId}`);

      // Wait for page to load
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();

      // Verify initial status is pending
      await expect(page.getByText('승인 대기')).toBeVisible();

      // Simulate another user approving (via API in background)
      const approveResponse = await page.request.patch(
        `${BACKEND_URL}/api/checkouts/${checkoutId}/approve`,
        {
          data: { version: checkout.version },
        }
      );
      expect(approveResponse.ok()).toBeTruthy();

      console.log('Simulated concurrent approval by another user');

      // Current user tries to reject (with stale version from page load)
      await page.getByRole('button', { name: '반려' }).click();

      // Wait for reject dialog
      await expect(page.getByRole('dialog', { name: '반출 반려' })).toBeVisible();

      // Fill reason and submit
      await page.getByLabel('반려 사유').fill('Test rejection after concurrent approval');
      await page.getByRole('button', { name: '반려', exact: true }).click();

      // Expected behavior (depending on Phase 3 implementation):
      // Option 1: Error toast appears with refresh message
      // Option 2: Auto-retry toast appears, then success/failure

      // Wait for either success or error toast
      const toastLocator = page.locator('[role="status"], [role="alert"]').first();
      await expect(toastLocator).toBeVisible({ timeout: 10000 });

      const toastText = await toastLocator.textContent();
      console.log(`Toast message: ${toastText}`);

      // Verify page shows latest state (approved by other user)
      await page.waitForTimeout(2000); // Wait for router.refresh()
      await expect(page.getByText('승인됨')).toBeVisible();

      console.log('UI correctly shows latest state after conflict');
    }
  );

  authTest(
    'P2-UI-02: displays version conflict error to user',
    async ({ techManagerPage: page }) => {
      // Setup: Create and approve a checkout
      const createResponse = await page.request.post('/api/checkouts', {
        data: {
          equipmentIds: [TEST_EQUIPMENT_IDS.EQUIPMENT_6],
          destination: 'Error Display Test',
          phoneNumber: '010-3333-2222',
          purpose: 'repair',
          reason: 'Testing error display',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const checkout = await createResponse.json();
      const checkoutId = checkout.id;

      // Approve it
      await page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
        data: { version: checkout.version },
      });

      // Navigate to the page (which will load with status='approved')
      await page.goto(`/checkouts/${checkoutId}`);
      await expect(page.getByText('승인됨')).toBeVisible();

      // Simulate another user starting the checkout in background
      await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/start`, {
        data: { version: checkout.version + 1 },
      });

      // Current user tries to start (with stale version)
      await page.getByRole('button', { name: '반출 시작' }).click();

      // Confirm in dialog
      await expect(page.getByRole('dialog', { name: '반출 시작' })).toBeVisible();
      await page.getByRole('button', { name: '확인' }).click();

      // Expect error toast
      await expect(
        page.locator('text=/상태가 변경되었을 수 있습니다|다른 사용자가 수정했습니다/')
      ).toBeVisible({ timeout: 10000 });

      console.log('Error message correctly displayed to user');
    }
  );
});

authTest.describe('Checkout Version Propagation', () => {
  authTest('P1-VER-01: version increments on every mutation', async ({ techManagerPage }) => {
    const page = techManagerPage;
    const token = await getBackendToken(page, 'technical_manager');
    // Create checkout (version 1)
    const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        equipmentIds: [TEST_EQUIPMENT_IDS.EQUIPMENT_7],
        destination: 'Version Increment Test',
        phoneNumber: '010-1111-2222',
        purpose: 'calibration',
        reason: 'Testing version increments',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    const checkout = await createResponse.json();
    expect(checkout.version).toBe(1);

    let currentVersion = checkout.version;
    const checkoutId = checkout.id;

    // Approve (1 → 2)
    const approved = await (
      await page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { version: currentVersion },
      })
    ).json();
    expect(approved.version).toBe(currentVersion + 1);
    currentVersion = approved.version;

    // Start (2 → 3)
    const started = await (
      await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/start`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { version: currentVersion },
      })
    ).json();
    expect(started.version).toBe(currentVersion + 1);
    currentVersion = started.version;

    // Return (3 → 4)
    const returned = await (
      await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/return`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          version: currentVersion,
          calibrationChecked: true,
          repairChecked: false,
          workingStatusChecked: true,
        },
      })
    ).json();
    expect(returned.version).toBe(currentVersion + 1);
    currentVersion = returned.version;

    // Approve return (4 → 5)
    const completed = await (
      await page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve-return`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { version: currentVersion },
      })
    ).json();
    expect(completed.version).toBe(currentVersion + 1);

    console.log(`Version incremented correctly through full lifecycle: 1 → ${completed.version}`);
  });
});
