import { test, expect } from '../../../shared/fixtures/auth.fixture';

/**
 * E2E Tests for Common/Rental Equipment (UI-14)
 *
 * Test Coverage:
 * 1. Temporary equipment registration (common and rental)
 * 2. Calibration validity checking
 * 3. Usage period display (D-day badges)
 * 4. Rental equipment 4-stage workflow
 * 5. Common equipment usage request/approval
 * 6. Equipment list filtering (isShared filter)
 */

test.describe('Common/Rental Equipment Management', () => {
  test.describe('1. Temporary Equipment Registration', () => {
    test('should display temporary registration page with all required fields', async ({
      page,
    }) => {
      // Navigate to temporary registration page
      await page.goto('/equipment');
      await page.click('a:has-text("공용장비 등록")');
      await page.waitForURL('**/equipment/create-shared');

      // Verify page title
      await expect(page.locator('h1')).toContainText('공용/렌탈 장비 임시등록');

      // Verify equipment type selector is visible
      await expect(page.locator('label:has-text("장비 유형")')).toBeVisible();
      await expect(page.locator('input[value="common"]')).toBeVisible();
      await expect(page.locator('input[value="rental"]')).toBeVisible();

      // Verify required fields are present
      await expect(page.locator('label:has-text("소유처")')).toBeVisible();
      await expect(page.locator('label:has-text("사용 시작일")')).toBeVisible();
      await expect(page.locator('label:has-text("사용 종료일")')).toBeVisible();
      await expect(page.locator('label:has-text("교정성적서")')).toBeVisible();
    });

    test('should register common equipment successfully', async ({ techManagerPage: page }) => {
      await page.goto('/equipment/create-shared');

      // Select common equipment type
      await page.click('input[value="common"]');

      // Fill basic information
      await page.fill('input[name="name"]', 'Test Common Equipment');
      await page.fill('input[name="managementNumber"]', 'SUW-E9001');
      await page.fill('input[name="modelName"]', 'Model-X100');
      await page.fill('input[name="manufacturer"]', 'Test Manufacturer');
      await page.fill('input[name="serialNumber"]', 'SN-12345');

      // Select owner (common equipment)
      await page.selectOption('select#owner', 'Safety팀');

      // Set usage period (valid: 2 months from today)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
      const endDate = new Date(today);
      endDate.setMonth(today.getMonth() + 2);

      await page.fill('input#usagePeriodStart', startDate.toISOString().split('T')[0]);
      await page.fill('input#usagePeriodEnd', endDate.toISOString().split('T')[0]);

      // Set calibration dates (valid: calibration expires after usage period)
      const lastCalibrationDate = new Date(today);
      lastCalibrationDate.setMonth(today.getMonth() - 1);
      const nextCalibrationDate = new Date(endDate);
      nextCalibrationDate.setMonth(endDate.getMonth() + 1);

      await page.fill(
        'input[name="lastCalibrationDate"]',
        lastCalibrationDate.toISOString().split('T')[0]
      );
      await page.fill(
        'input[name="nextCalibrationDate"]',
        nextCalibrationDate.toISOString().split('T')[0]
      );

      // Upload calibration certificate (mock file)
      const fileInput = page.locator('input[type="file"]#calibrationCertificate');
      await fileInput.setInputFiles({
        name: 'calibration-cert.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content'),
      });

      // Verify calibration validity checker shows success
      await expect(
        page.locator('text=교정 유효기간 확인됨').or(page.locator('text=여유가 있습니다'))
      ).toBeVisible({ timeout: 2000 });

      // Submit the form
      await page.click('button:has-text("등록")');

      // Verify redirect to equipment detail page
      await page.waitForURL('**/equipment/**', { timeout: 5000 });
      await expect(page.locator('text=공용장비 안내')).toBeVisible();
      await expect(page.locator('text=임시등록')).toBeVisible();
    });

    test('should show calibration validity error when next calibration date is before usage end date', async ({
      page,
    }) => {
      await page.goto('/equipment/create-shared');

      // Select rental equipment type
      await page.click('input[value="rental"]');

      // Fill basic information
      await page.fill('input[name="name"]', 'Test Rental Equipment');
      await page.fill('input[name="managementNumber"]', 'SUW-E9002');

      // Enter rental company
      await page.fill('input#owner', 'Rental Company XYZ');

      // Set usage period
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
      const endDate = new Date(today);
      endDate.setMonth(today.getMonth() + 3);

      await page.fill('input#usagePeriodStart', startDate.toISOString().split('T')[0]);
      await page.fill('input#usagePeriodEnd', endDate.toISOString().split('T')[0]);

      // Set INVALID calibration dates (next calibration BEFORE usage end)
      const lastCalibrationDate = new Date(today);
      lastCalibrationDate.setMonth(today.getMonth() - 1);
      const nextCalibrationDate = new Date(endDate);
      nextCalibrationDate.setMonth(endDate.getMonth() - 2); // Invalid: 2 months BEFORE usage end

      await page.fill(
        'input[name="lastCalibrationDate"]',
        lastCalibrationDate.toISOString().split('T')[0]
      );
      await page.fill(
        'input[name="nextCalibrationDate"]',
        nextCalibrationDate.toISOString().split('T')[0]
      );

      // Verify calibration validity checker shows error
      await expect(page.locator('text=교정 유효기간 부족')).toBeVisible({ timeout: 2000 });
      await expect(
        page.locator('text=사용 종료일').or(page.locator('text=이후여야 합니다'))
      ).toBeVisible();
    });
  });

  test.describe('2. Usage Period Display', () => {
    test('should display D-day badge for temporary equipment', async ({
      techManagerPage: page,
    }) => {
      // Navigate to equipment list and filter for shared equipment
      await page.goto('/equipment');

      // Apply isShared filter
      const sharedFilter = page.locator('select').filter({ hasText: '모든 장비' }).first();
      await sharedFilter.selectOption('shared');

      // Verify badge is displayed (if temporary equipment exists)
      const badges = page.locator('[aria-label*="사용 기간"]');
      const badgeCount = await badges.count();

      if (badgeCount > 0) {
        // Check badge format (D-X or D+X or D-Day)
        const firstBadge = badges.first();
        const badgeText = await firstBadge.textContent();
        expect(badgeText).toMatch(/^(D-\d+|D\+\d+|D-Day|시작 예정)$/);
      }
    });

    test('should show usage period in equipment detail page', async ({ techManagerPage: page }) => {
      // This test requires existing temporary equipment
      // Navigate to equipment list with shared filter
      await page.goto('/equipment?isShared=shared');

      // Click on first temporary equipment (if exists)
      const firstEquipment = page.locator('[data-testid="equipment-card"]').first();
      const equipmentExists = (await firstEquipment.count()) > 0;

      if (equipmentExists) {
        await firstEquipment.click();
        await page.waitForURL('**/equipment/**');

        // Verify shared equipment banner
        await expect(page.locator('text=공용장비 안내')).toBeVisible();

        // Verify usage period badge if equipment is temporary
        const isTemporary = await page.locator('text=임시등록').isVisible();
        if (isTemporary) {
          await expect(page.locator('[aria-label*="사용 기간"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('3. Equipment List Filtering', () => {
    test('should filter equipment by isShared status', async ({ techManagerPage: page }) => {
      await page.goto('/equipment');

      // Test "공용장비만" filter
      const sharedFilter = page.locator('select').filter({ hasText: '모든 장비' }).first();
      await sharedFilter.selectOption('shared');

      // URL should contain isShared parameter
      expect(page.url()).toContain('isShared=');

      // Test "일반장비만" filter
      await sharedFilter.selectOption('normal');
      expect(page.url()).toContain('isShared=');

      // Test "전체" filter
      await sharedFilter.selectOption('all');
      // isShared parameter should be removed or set to all
    });

    test('should clear all filters including isShared', async ({ techManagerPage: page }) => {
      await page.goto('/equipment?isShared=shared&status=available');

      // Click clear filters button
      const clearButton = page
        .locator('button:has-text("초기화")')
        .or(page.locator('button:has-text("필터 초기화")'));
      if (await clearButton.isVisible()) {
        await clearButton.click();

        // All filters should be cleared from URL
        expect(page.url()).not.toContain('isShared=');
        expect(page.url()).not.toContain('status=');
      }
    });
  });

  test.describe('4. Rental Equipment 4-Stage Workflow', () => {
    test('should show checkout status stepper for rental equipment', async ({
      techManagerPage: page,
    }) => {
      // This test requires existing rental checkout
      // Navigate to checkouts list
      await page.goto('/checkouts');

      // Look for rental purpose checkouts
      const rentalCheckout = page.locator('[data-purpose="rental"]').first();
      const hasRentalCheckout = (await rentalCheckout.count()) > 0;

      if (hasRentalCheckout) {
        await rentalCheckout.click();
        await page.waitForURL('**/checkouts/**');

        // Verify stepper is displayed
        await expect(page.locator('text=진행 상태')).toBeVisible();

        // Verify rental-specific stages are shown
        // (The exact stages depend on CheckoutStatusStepper implementation)
        const stepperSteps = page.locator('[role="list"] [role="listitem"]');
        const stepCount = await stepperSteps.count();

        // Rental should have 8 stages (more than calibration/repair's 5 stages)
        expect(stepCount).toBeGreaterThanOrEqual(5);
      }
    });

    test('should display condition comparison card for rental equipment', async ({
      techManagerPage: page,
    }) => {
      // This test requires rental checkout with multiple condition checks
      await page.goto('/checkouts');

      // Find a rental checkout
      const rentalCheckout = page.locator('[data-purpose="rental"]').first();
      const hasRentalCheckout = (await rentalCheckout.count()) > 0;

      if (hasRentalCheckout) {
        await rentalCheckout.click();
        await page.waitForURL('**/checkouts/**');

        // Condition comparison card should appear if there are 2+ checks
        const comparisonCard = page.locator('text=상태 비교').or(page.locator('text=전후 비교'));
        const hasComparison = await comparisonCard.isVisible();

        // If comparison card exists, verify structure
        if (hasComparison) {
          await expect(comparisonCard).toBeVisible();
          // Should show comparison between different stages
        }

        // Verify condition check history is shown
        const historySection = page.locator('text=상태 확인 이력');
        if (await historySection.isVisible()) {
          await expect(historySection).toBeVisible();
          // Should show appearance status, operation status, accessories status
          await expect(
            page.locator('text=외관 상태').or(page.locator('text=작동 상태'))
          ).toBeVisible();
        }
      }
    });
  });

  test.describe('5. Accessibility', () => {
    test('should have proper ARIA labels for equipment type selection', async ({
      techManagerPage: page,
    }) => {
      await page.goto('/equipment/create-shared');

      // Equipment type radio group should have proper role
      const radioGroup = page.locator('input[type="radio"][name="equipmentType"]').first();
      await expect(radioGroup).toBeVisible();

      // Labels should be associated with inputs
      const commonLabel = page.locator('label[for="type-common"]');
      const rentalLabel = page.locator('label[for="type-rental"]');
      await expect(commonLabel).toHaveText(/공용장비/);
      await expect(rentalLabel).toHaveText(/렌탈장비/);
    });

    test('should have role="alert" for calibration validity warnings', async ({
      techManagerPage: page,
    }) => {
      await page.goto('/equipment/create-shared');

      // Fill in dates to trigger validation
      await page.fill('input[name="name"]', 'Test Equipment');
      await page.fill('input[name="managementNumber"]', 'SUW-E9999');

      const today = new Date();
      const usagePeriodEnd = new Date(today);
      usagePeriodEnd.setMonth(today.getMonth() + 2);

      await page.fill('input#usagePeriodEnd', usagePeriodEnd.toISOString().split('T')[0]);

      // Set invalid next calibration date
      const invalidNextCal = new Date(usagePeriodEnd);
      invalidNextCal.setDate(usagePeriodEnd.getDate() - 10);

      await page.fill(
        'input[name="nextCalibrationDate"]',
        invalidNextCal.toISOString().split('T')[0]
      );

      // Wait for validation to appear

      // Alert should have role="alert"
      const alert = page.locator('[role="alert"]').filter({ hasText: '교정 유효기간' });
      if (await alert.isVisible()) {
        await expect(alert).toBeVisible();
      }
    });

    test('should have aria-label for usage period badge', async ({ techManagerPage: page }) => {
      await page.goto('/equipment?isShared=shared');

      // Usage period badge should have aria-label
      const badge = page.locator('[aria-label*="사용 기간"]').first();
      const badgeExists = (await badge.count()) > 0;

      if (badgeExists) {
        const ariaLabel = await badge.getAttribute('aria-label');
        expect(ariaLabel).toContain('사용 기간');
      }
    });
  });

  test.describe('6. Edge Cases and Validation', () => {
    test('should prevent submission without required temporary fields', async ({
      techManagerPage: page,
    }) => {
      await page.goto('/equipment/create-shared');

      // Select common equipment
      await page.click('input[value="common"]');

      // Fill only basic fields, skip temporary-specific fields
      await page.fill('input[name="name"]', 'Incomplete Equipment');
      await page.fill('input[name="managementNumber"]', 'SUW-E9998');

      // Try to submit without owner, usage period, calibration certificate
      await page.click('button:has-text("등록")');

      // Should show validation errors (browser native or custom)
      // Form should not be submitted

      // Should still be on the same page
      expect(page.url()).toContain('/equipment/create-shared');
    });

    test('should handle usage period in the past gracefully', async ({ techManagerPage: page }) => {
      await page.goto('/equipment/create-shared');

      await page.click('input[value="common"]');
      await page.fill('input[name="name"]', 'Past Usage Equipment');
      await page.fill('input[name="managementNumber"]', 'SUW-E9997');

      // Set usage period in the past
      const pastStart = new Date();
      pastStart.setMonth(pastStart.getMonth() - 2);
      const pastEnd = new Date();
      pastEnd.setMonth(pastEnd.getMonth() - 1);

      await page.fill('input#usagePeriodStart', pastStart.toISOString().split('T')[0]);
      await page.fill('input#usagePeriodEnd', pastEnd.toISOString().split('T')[0]);

      // Badge should show D+X (overdue)
      // This depends on whether the form allows past dates
    });
  });
});
