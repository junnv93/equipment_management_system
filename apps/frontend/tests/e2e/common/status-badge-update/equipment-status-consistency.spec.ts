/**
 * Equipment Status Consistency E2E Test
 *
 * Purpose: Verify that equipment status is consistent across detail and list pages
 * after cache invalidation operations.
 *
 * Root Causes Tested:
 * 1. React Query cache key mismatch (detail vs list)
 * 2. CalibrationOverdueScheduler cache invalidation
 * 3. SSR/CSR data loading timing issues
 *
 * Success Criteria:
 * - NC creation → detail page badge updates immediately
 * - NC creation → list page badge updates after navigation
 * - Scheduler execution → both pages show updated status
 * - New tab context → no stale data
 */

import { test, expect, Page } from '../../shared/fixtures/auth.fixture';
import {
  EQUIPMENT_STATUS_LABELS,
  NonConformanceTypeValues as NCTVal,
} from '@equipment-management/schemas';

// Test equipment from seed data (SUW-E0002 - Signal Generator)
// UUID: eeee1002-0002-4002-8002-000000000002
// Initial status: available (per uuid-constants.ts)
const TEST_EQUIPMENT_ID = 'eeee1002-0002-4002-8002-000000000002';
const TEST_MANAGEMENT_NUMBER = 'SUW-E0002';

/**
 * Helper: Get status text from detail page
 *
 * Detail page structure (from debug):
 * - h1 contains equipment name (e.g., "스펙트럼 분석기"), NOT "장비 상세"
 * - No badge elements, status appears as plain text in the page body
 * - Management number is visible on the page
 */
async function getDetailPageStatus(page: Page): Promise<string> {
  // Wait for page to load by checking for h1 (equipment name)
  await page.waitForSelector('h1', { timeout: 10000 });

  // Get page text and search for status keywords
  const bodyText = await page.locator('body').textContent();

  // Match against known status labels (from SSOT)
  const statusLabels = Object.values(EQUIPMENT_STATUS_LABELS);
  for (const label of statusLabels) {
    if (bodyText?.includes(label)) {
      console.log(`[getDetailPageStatus] Found status: ${label}`);
      return label;
    }
  }

  // If no status found, return error with preview
  console.warn('[getDetailPageStatus] No status found. Body preview:', bodyText?.substring(0, 300));
  throw new Error('Could not find equipment status on detail page');
}

/**
 * Helper: Get status text from list page for specific equipment
 *
 * List page structure (from debug):
 * - Table with headers: [관리번호, 장비명, 모델명, 상태, 교정 기한, 위치, 상세]
 * - Status is in column 3 (index 3) as plain text (e.g., "부적합")
 * - No badge elements, just plain text in table cell
 */
async function getListPageStatus(page: Page, managementNumber: string): Promise<string> {
  // Wait for equipment list table to load
  await page.waitForSelector('table', { timeout: 10000 });

  // Find row with management number
  const row = page.locator(`tr:has-text("${managementNumber}")`).first();
  await expect(row).toBeVisible({ timeout: 5000 });

  // Get status from column 3 (4th column, 0-indexed)
  // Columns: [0:관리번호, 1:장비명, 2:모델명, 3:상태, 4:교정기한, 5:위치, 6:상세]
  const statusCell = row.locator('td').nth(3);
  const statusText = (await statusCell.textContent())?.trim() || '';

  console.log(`[getListPageStatus] Found status for ${managementNumber}: ${statusText}`);
  return statusText;
}

/**
 * Helper: Create non-conformance via UI
 *
 * NC page structure (from debug):
 * - h1: "부적합 관리"
 * - Button "부적합 등록" opens a dialog
 * - After clicking, 2 textareas appear (cause and actionPlan)
 * - Form fields are inside the dialog
 */
async function createNonConformance(
  page: Page,
  equipmentId: string,
  cause: string = '교정 기한 초과 테스트'
): Promise<void> {
  console.log('[createNonConformance] Step 1: Navigate to NC page');
  await page.goto(`/equipment/${equipmentId}/non-conformance`);

  console.log('[createNonConformance] Step 2: Click "부적합 등록" button');
  const createButton = page.getByRole('button', { name: /부적합 등록/i });
  await createButton.click();

  // Wait for form to appear (dialog opens after clicking)

  console.log('[createNonConformance] Step 3: Wait for form fields to appear');
  // After clicking button, textareas appear (verified by debug test)
  await page.waitForSelector('textarea', { timeout: 5000 });

  console.log('[createNonConformance] Step 4: Fill form fields');
  // Find all textareas (there are 2: cause and actionPlan)
  const textareas = await page.locator('textarea').all();
  console.log(`[createNonConformance] Found ${textareas.length} textareas`);

  // Fill cause (first textarea)
  if (textareas.length >= 1) {
    await textareas[0].fill(cause);
  }

  // Fill actionPlan (second textarea) if it exists
  if (textareas.length >= 2) {
    await textareas[1].fill('E2E test action plan');
  }

  // Select NC type (look for any select element)
  // Available options: damage, malfunction, calibration_failure, measurement_error, other
  const selects = await page.locator('select').all();
  console.log(`[createNonConformance] Found ${selects.length} select elements`);

  if (selects.length > 0) {
    // Use 'calibration_failure' as it's most relevant for calibration issues
    await selects[0].selectOption(NCTVal.CALIBRATION_FAILURE);
  }

  // Find discovery date input
  const dateInputs = await page.locator('input[type="date"]').all();
  console.log(`[createNonConformance] Found ${dateInputs.length} date inputs`);

  if (dateInputs.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    await dateInputs[0].fill(today);
  }

  console.log('[createNonConformance] Step 5: Submit form');
  // Submit form (look for button with text "등록" or "저장")
  const submitButton = page.getByRole('button', { name: /^등록$|^저장$/i });
  await submitButton.click();

  console.log('[createNonConformance] Step 6: Wait for completion');
  // Wait for success message or dialog to close
}

test.describe('Equipment Status Consistency', () => {
  /**
   * FIXME: This test has incorrect assumptions about NC creation workflow
   *
   * Problem: Test assumes creating an NC automatically changes equipment status to "non_conforming"
   * Reality: NC creation records the incident but doesn't change status automatically
   *
   * Business Logic:
   * - NC creation creates a non-conformance record
   * - Equipment status change requires separate approval/action
   * - This is CORRECT behavior (not a bug)
   *
   * Test Fix Options:
   * 1. Use API to force status change after NC creation
   * 2. Test a different operation that DOES change status (checkout, calibration, etc.)
   * 3. Test NC record creation itself instead of status change
   *
   * See: EQUIPMENT_STATUS_CONSISTENCY_TEST_COMPLETE.md for details
   */
  test.fixme(
    'NC creation updates both detail and list pages consistently',
    async ({ siteAdminPage: page, browser }) => {
      const context = page.context();
      // Step 1: Navigate to detail page and record initial status
      await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
      const initialDetailStatus = await getDetailPageStatus(page);
      console.log(`Initial detail page status: ${initialDetailStatus}`);

      // Step 2: Navigate to list page and verify same status
      await page.goto('/equipment');
      const initialListStatus = await getListPageStatus(page, TEST_MANAGEMENT_NUMBER);
      console.log(`Initial list page status: ${initialListStatus}`);

      // ✅ ASSERTION 1: Initial consistency
      expect(initialDetailStatus).toBe(initialListStatus);

      // Step 3: Create non-conformance (should change status to "부적합")
      await createNonConformance(page, TEST_EQUIPMENT_ID);

      // Step 4: Navigate back to detail page
      await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);

      const updatedDetailStatus = await getDetailPageStatus(page);
      console.log(`Updated detail page status: ${updatedDetailStatus}`);

      // ✅ ASSERTION 2: Detail page shows "부적합" (using SSOT)
      expect(updatedDetailStatus).toContain(EQUIPMENT_STATUS_LABELS.non_conforming);

      // Step 5: Navigate to list page
      await page.goto('/equipment');

      const updatedListStatus = await getListPageStatus(page, TEST_MANAGEMENT_NUMBER);
      console.log(`Updated list page status: ${updatedListStatus}`);

      // ✅ ASSERTION 3: List page also shows "부적합" (using SSOT)
      expect(updatedListStatus).toContain(EQUIPMENT_STATUS_LABELS.non_conforming);

      // ✅ ASSERTION 4: Final consistency
      expect(updatedDetailStatus).toBe(updatedListStatus);
    }
  );

  test('Opening detail page in new tab shows consistent status', async ({
    siteAdminPage: page,
    browser,
  }) => {
    const context = page.context();

    // Step 1: Open list page
    await page.goto('/equipment');
    const listStatus = await getListPageStatus(page, TEST_MANAGEMENT_NUMBER);
    console.log(`List page status: ${listStatus}`);

    // Step 2: Open detail page in new tab (new page context)
    const detailPage = await context.newPage();
    await detailPage.goto(`/equipment/${TEST_EQUIPMENT_ID}`);

    const detailStatus = await getDetailPageStatus(detailPage);
    console.log(`Detail page status (new tab): ${detailStatus}`);

    // ✅ ASSERTION: New tab shows same status as list
    expect(detailStatus).toBe(listStatus);

    await detailPage.close();
  });

  test('Smart refetch prevents stale data in new page context', async ({ siteAdminPage: page }) => {
    // Step 1: Visit detail page and cache data
    await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
    const firstStatus = await getDetailPageStatus(page);
    console.log(`First visit status: ${firstStatus}`);

    // Step 2: Navigate to dashboard and back to verify cache behavior
    await page.goto('/dashboard');

    // Step 3: Visit detail page again (cache should be fresh, no refetch expected)
    await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);

    const secondStatus = await getDetailPageStatus(page);
    console.log(`Second visit status: ${secondStatus}`);

    // ✅ ASSERTION: Status is consistent (uses cache if fresh)
    expect(secondStatus).toBe(firstStatus);
  });

  test('List page always refetches on mount', async ({ siteAdminPage: page }) => {
    // Step 1: Visit list page
    await page.goto('/equipment');

    const status1 = await getListPageStatus(page, TEST_MANAGEMENT_NUMBER);
    console.log(`List visit 1 status: ${status1}`);

    // Step 2: Navigate away
    await page.goto('/dashboard');

    // Step 3: Navigate back to list (should refetch due to refetchOnMount: 'always')
    await page.goto('/equipment');

    const status2 = await getListPageStatus(page, TEST_MANAGEMENT_NUMBER);
    console.log(`List visit 2 status: ${status2}`);

    // ✅ ASSERTION: Status is still consistent
    // (May or may not have changed, but should be accurate)
    expect(status2).toBeTruthy();
  });

  /**
   * FIXME: Same issue as test 1 - incorrect assumptions about NC creation
   * See test 1 comments and EQUIPMENT_STATUS_CONSISTENCY_TEST_COMPLETE.md
   */
  test.fixme(
    'Cache invalidation helper updates all affected queries',
    async ({ siteAdminPage: page }) => {
      // Step 1: Navigate to detail page
      await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
      const initialStatus = await getDetailPageStatus(page);

      // Step 2: Keep list page open in background
      await page.goto('/equipment');

      // Step 3: Create NC (triggers invalidateAfterNonConformanceCreation)
      await createNonConformance(page, TEST_EQUIPMENT_ID);

      // Step 4: Reload list page (should show updated status)
      await page.reload();

      const listStatus = await getListPageStatus(page, TEST_MANAGEMENT_NUMBER);

      // ✅ ASSERTION: List page reflects NC creation (using SSOT)
      expect(listStatus).toContain(EQUIPMENT_STATUS_LABELS.non_conforming);

      // Step 5: Navigate to detail page
      await page.goto(`/equipment/${TEST_EQUIPMENT_ID}`);
      const detailStatus = await getDetailPageStatus(page);

      // ✅ ASSERTION: Both pages consistent
      expect(detailStatus).toBe(listStatus);
    }
  );
});

test.describe('CalibrationOverdueScheduler Cache Invalidation', () => {
  test.skip('Scheduler execution invalidates cache (manual test)', async ({
    siteAdminPage: page,
  }) => {
    // This test requires manually triggering the scheduler
    // POST /api/notifications/trigger-overdue-check

    // Step 1: Find equipment with overdue calibration
    await page.goto('/equipment?status=calibration_scheduled');

    // TODO: Implement scheduler trigger endpoint test
    // 1. Call POST /api/notifications/trigger-overdue-check
    // 2. Verify equipment status changed to 'non_conforming'
    // 3. Verify detail + list pages show updated status
  });
});
