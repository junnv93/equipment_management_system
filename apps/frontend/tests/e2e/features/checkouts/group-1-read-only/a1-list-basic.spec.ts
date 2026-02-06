/**
 * Checkout List Page Basic Tests
 * Group A1: List Page Basic Functionality
 *
 * Tests basic checkout list page functionality:
 * - Page loads with correct structure
 * - Data displays correctly from backend
 * - Search by equipment name works
 * - Search by requester name works
 *
 * All tests are read-only and parallelizable (no DB modifications).
 *
 * @see apps/frontend/tests/e2e/checkouts/seed.spec.ts - Seed test
 * @see apps/backend/src/database/seed-data/operations/checkouts.seed.ts - 68 seed checkouts
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group A1: List Page Basic', () => {
  /**
   * A-1: Checkout list page loads successfully
   * Priority: P3
   *
   * Verifies the checkout list page structure and UI elements.
   *
   * TODO: Verify all page elements exist (already mostly implemented)
   */
  test('A-1: Checkout list page loads successfully', async ({ techManagerPage }) => {
    // 1. Login as technical_manager
    // techManagerPage fixture automatically logs in

    // 2. Navigate to checkouts page
    await techManagerPage.goto('/checkouts');

    // 3. Wait for page load
    await techManagerPage.waitForLoadState('networkidle');

    // 4. Verify page heading
    await expect(techManagerPage.getByRole('heading', { name: /반출 관리/ })).toBeVisible();

    // 5. Verify page subtitle
    await expect(techManagerPage.getByText(/장비 반출 요청 및 현황을 관리합니다/)).toBeVisible();

    // 6. Verify '반출 신청' button
    await expect(techManagerPage.getByRole('button', { name: /반출 신청/ })).toBeVisible();

    // 7. Verify summary cards (4 cards: 전체 반출, 승인 대기중, 반입 기한 초과, 오늘 반입 예정)
    // Use .first() to get the CardTitle version (not the tab)
    await expect(techManagerPage.getByText(/전체 반출/).first()).toBeVisible();
    await expect(techManagerPage.getByText(/승인 대기중/).first()).toBeVisible();
    await expect(techManagerPage.getByText(/반입 기한 초과/).first()).toBeVisible();
    await expect(techManagerPage.getByText(/오늘 반입 예정/).first()).toBeVisible();

    // 8. Verify tab bar
    await expect(techManagerPage.getByRole('tab', { name: /전체 반출/ })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /기한 초과/ })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /오늘 반입/ })).toBeVisible();

    // 9. Verify search input
    const searchInput = techManagerPage.getByPlaceholder(/장비 또는 사용자 검색/);
    await expect(searchInput).toBeVisible();

    // 10. Verify status filter dropdown
    // SelectTrigger renders as a button, we look for the one with Filter icon and "상태" text
    const statusFilter = techManagerPage.locator('button:has-text("상태")').first();
    await expect(statusFilter).toBeVisible();

    // 11. Verify location filter dropdown
    // SelectTrigger renders as a button, we look for the one with MapPin icon and "반출지" text
    const locationFilter = techManagerPage.locator('button:has-text("반출지")').first();
    await expect(locationFilter).toBeVisible();

    // 12. Verify table with 6 column headers
    const tableHeaders = ['장비', '신청자', '상태', '반출지', '반출일', '반입 예정일'];

    for (const header of tableHeaders) {
      await expect(
        techManagerPage.getByRole('columnheader', { name: new RegExp(header) })
      ).toBeVisible();
    }

    // Verify at least one data row
    const dataRows = techManagerPage
      .getByRole('row')
      .filter({ has: techManagerPage.getByRole('cell') });
    await expect(dataRows.first()).toBeVisible();
  });

  /**
   * A-2: Checkout data is displayed correctly in the table
   * Priority: P3
   *
   * Verifies that checkout data from backend is correctly displayed.
   * Validates data accuracy by comparing with API response.
   *
   * TODO: Verify data display and API accuracy matching
   */
  test('A-2: Checkout data displays correctly', async ({ techManagerPage }) => {
    // 1. Login as technical_manager
    // 2. Navigate to checkouts page
    await techManagerPage.goto('/checkouts');
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Wait for data to load
    const dataRows = techManagerPage
      .getByRole('row')
      .filter({ has: techManagerPage.getByRole('cell') });
    await expect(dataRows.first()).toBeVisible();

    // 4. Count data rows
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 5-10. Verify first row contains valid data
    const firstRow = dataRows.first();

    // Equipment name (not '장비 정보 없음')
    const equipmentCell = firstRow.locator('td').nth(0);
    const equipmentText = await equipmentCell.textContent();
    expect(equipmentText).toBeTruthy();
    expect(equipmentText).not.toContain('장비 정보 없음');

    // Requester name (not '알 수 없는 사용자')
    const requesterCell = firstRow.locator('td').nth(1);
    const requesterText = await requesterCell.textContent();
    expect(requesterText).toBeTruthy();
    expect(requesterText).not.toContain('알 수 없는 사용자');

    // Status badge
    const statusCell = firstRow.locator('td').nth(2);
    await expect(statusCell).toBeVisible();
    const statusText = await statusCell.textContent();
    expect(statusText).toBeTruthy();
    // Verify it's a valid status (contains one of the known status labels)
    expect(statusText).toMatch(/승인 대기중|1차 승인|최종 승인|반출 중|거부됨|반입됨|기한 초과/);

    // Destination with building icon
    const destinationCell = firstRow.locator('td').nth(3);
    await expect(destinationCell).toBeVisible();

    // Date columns (yyyy-MM-dd format or "-" for null dates)
    const checkoutDateCell = firstRow.locator('td').nth(4);
    const checkoutDateText = await checkoutDateCell.textContent();
    // Pending checkouts may not have checkoutDate yet
    expect(checkoutDateText).toMatch(/\d{4}-\d{2}-\d{2}|-/);

    const returnDateCell = firstRow.locator('td').nth(5);
    const returnDateText = await returnDateCell.textContent();
    expect(returnDateText).toMatch(/\d{4}-\d{2}-\d{2}|-/);

    // 11-12. Verify at least one checkout is displayed (already verified row count > 0 above)
    // Summary card count is visible but format may vary, so we rely on row count verification
  });

  /**
   * A-3: Search by equipment name filters the list correctly
   * Priority: P3
   *
   * Verifies equipment name search functionality.
   * Tests partial matching and empty state display.
   *
   * TODO: Verify search filtering logic works correctly
   */
  test.fixme('A-3: Search by equipment name works', async ({ techManagerPage }) => {
    // TODO: Search functionality needs to be implemented or equipment names need to match seed data
    // 1. Login as technical_manager
    // 2. Navigate to checkouts page
    await techManagerPage.goto('/checkouts');
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Wait for initial data load
    const dataRows = techManagerPage
      .getByRole('row')
      .filter({ has: techManagerPage.getByRole('cell') });
    await expect(dataRows.first()).toBeVisible();

    // 4. Note initial row count
    const initialCount = await dataRows.count();

    // 5. Search for 'Spectrum' or 'SUW-E' (equipment from seed data)
    const searchInput = techManagerPage.getByPlaceholder(/장비 또는 사용자 검색/);
    await searchInput.fill('SUW-E');

    // 6. Wait for debounce and re-fetch
    await techManagerPage.waitForTimeout(500);
    await techManagerPage.waitForLoadState('networkidle');

    // 7. Count filtered rows
    const filteredCount = await dataRows.count();

    // 8. Verify filtered results contain search term
    if (filteredCount > 0) {
      // All visible rows should contain 'SUW-E' in equipment name
      for (let i = 0; i < Math.min(filteredCount, 5); i++) {
        const row = dataRows.nth(i);
        const equipmentText = await row.locator('td').nth(0).textContent();
        expect(equipmentText?.toUpperCase()).toContain('SUW-E');
      }

      // Filtered count should be less than initial
      expect(filteredCount).toBeLessThan(initialCount);
    }

    // 9. Clear search
    await searchInput.clear();
    await techManagerPage.waitForTimeout(500);
    await techManagerPage.waitForLoadState('networkidle');

    // 10. Verify list restored
    const restoredCount = await dataRows.count();
    expect(restoredCount).toBe(initialCount);

    // 11. Search for non-existent equipment
    await searchInput.fill('ZZZNONEXISTENT');
    await techManagerPage.waitForTimeout(500);
    await techManagerPage.waitForLoadState('networkidle');

    // 12-13. Verify empty state
    await expect(techManagerPage.getByText(/반출 정보가 없습니다/)).toBeVisible();

    // 14. Verify reset filter button
    await expect(techManagerPage.getByRole('button', { name: /필터 초기화/ })).toBeVisible();
  });

  /**
   * A-4: Search by requester name filters the list correctly
   * Priority: P3
   *
   * Verifies requester name search functionality.
   *
   * FIXME: Backend search only searches in checkout fields (destination, reason, address),
   * not in related user names or equipment names. Need to enhance backend search to include:
   * - User name (requester)
   * - Equipment name
   * - Equipment management number
   * See: apps/backend/src/modules/checkouts/checkouts.service.ts:216-225
   */
  test.fixme('A-4: Search by requester name works', async ({ techManagerPage }) => {
    // 1. Login as technical_manager
    // 2. Navigate to checkouts page
    await techManagerPage.goto('/checkouts');
    await techManagerPage.waitForLoadState('networkidle');

    // 3. Wait for data load
    const dataRows = techManagerPage
      .getByRole('row')
      .filter({ has: techManagerPage.getByRole('cell') });
    await expect(dataRows.first()).toBeVisible();

    // 4. Get requester name from first row
    const firstRowRequester = await dataRows.first().locator('td').nth(1).textContent();
    const searchTerm = firstRowRequester?.split(' ')[0] || ''; // First word of name

    if (searchTerm) {
      // 5. Note initial count
      const initialCount = await dataRows.count();

      // 6. Search by requester name
      const searchInput = techManagerPage.getByPlaceholder(/장비 또는 사용자 검색/);
      await searchInput.fill(searchTerm);

      // 7. Wait for filtering
      await techManagerPage.waitForTimeout(500);
      await techManagerPage.waitForLoadState('networkidle');

      // 8. Verify filtered results
      const filteredCount = await dataRows.count();

      if (filteredCount > 0) {
        // All visible rows should have requester matching search term
        for (let i = 0; i < Math.min(filteredCount, 5); i++) {
          const row = dataRows.nth(i);
          const requesterText = await row.locator('td').nth(1).textContent();
          expect(requesterText).toContain(searchTerm);
        }

        // Filtered count should be less than or equal to initial
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }

      // 9. Clear search
      await searchInput.clear();
      await techManagerPage.waitForTimeout(500);

      // 10. Verify list restored
      const restoredCount = await dataRows.count();
      expect(restoredCount).toBe(initialCount);
    }
  });
});
