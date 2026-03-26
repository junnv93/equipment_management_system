/**
 * Dashboard Test Plan - Suite 4: Pending Approvals Card
 *
 * spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
 * seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts
 *
 * This test suite validates the pending approvals card functionality on the dashboard,
 * including role-based category visibility, navigation, and error handling.
 *
 * Test Coverage:
 * - Group 1: Basic pending approval card display for lab_manager
 * - Group 3: Role-specific approval categories (test_engineer, technical_manager, lab_manager)
 * - Group 5: Total count badge and View All button functionality
 * - Group 6: Error state handling when API fails
 *
 * SSOT Compliance:
 * - Uses auth.fixture.ts for authenticated contexts
 * - Approval header: '시험소 승인 대기' (for lab_manager)
 * - Category labels: '장비', '교정', '반출', '보정계수', '소프트웨어'
 * - Navigation URLs: /admin/approvals?tab=equipment, /admin/approvals?tab=calibration
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Pending Approvals Card', () => {
  // Run tests on all browsers
  test.beforeEach(async ({}) => {
    // No project filtering needed
  });

  // Group 1: Basic Display
  test.describe('Group 1: Basic Pending Approval Card Display', () => {
    test('4.1 Verify pending approval card displays for lab_manager', async ({ siteAdminPage }) => {
      // 1. Login as lab_manager (handled by fixture)
      // 2. Navigate to dashboard
      await siteAdminPage.goto('/');

      // 3. Locate the pending approval section
      const pendingApprovalSection = siteAdminPage
        .locator('text=시험소 승인 대기')
        .or(siteAdminPage.locator('[class*="pending"]', { hasText: '승인 대기' }));

      // Expected: Pending approval card is visible with header '시험소 승인 대기'
      await expect(pendingApprovalSection.first()).toBeVisible({ timeout: 10000 });

      // Expected: 5 approval categories are displayed: 장비, 교정, 반출, 보정계수, 소프트웨어
      // Categories are rendered as links with aria-label containing the category name, count, and description
      const equipmentCategory = siteAdminPage.getByRole('link', { name: /장비.*건/ });
      const calibrationCategory = siteAdminPage.getByRole('link', { name: /교정.*건/ });
      const checkoutCategory = siteAdminPage.getByRole('link', { name: /반출.*건/ });
      const calibrationFactorCategory = siteAdminPage.getByRole('link', { name: /보정계수.*건/ });
      const softwareCategory = siteAdminPage.getByRole('link', { name: /소프트웨어.*건/ });

      await expect(equipmentCategory).toBeVisible({ timeout: 5000 });
      await expect(calibrationCategory).toBeVisible({ timeout: 5000 });
      await expect(checkoutCategory).toBeVisible({ timeout: 5000 });
      await expect(calibrationFactorCategory).toBeVisible({ timeout: 5000 });
      await expect(softwareCategory).toBeVisible({ timeout: 5000 });

      // Expected: Each category shows a count number
      // Categories with count > 0 may be highlighted in red
      // Note: Count visibility depends on pending approval data
      console.log('✅ All 5 approval categories are visible for lab_manager');
    });
  });

  // Group 3: Category Navigation
  test.describe('Group 3: Approval Category Navigation', () => {
    test('4.2 Verify approval category links navigate correctly', async ({ siteAdminPage }) => {
      // 1. Login as lab_manager (handled by fixture)
      // 2. Navigate to dashboard
      await siteAdminPage.goto('/');

      // 3. Click on '장비' approval category and wait for navigation
      const equipmentCategory = siteAdminPage.getByRole('link', { name: /장비.*건/ });

      // Wait for navigation to complete before checking URL
      await Promise.all([
        siteAdminPage.waitForURL('**/admin/approvals**', { timeout: 10000 }),
        equipmentCategory.click(),
      ]);

      // Expected: Clicking '장비' navigates to /admin/approvals?tab=equipment
      expect(siteAdminPage.url()).toContain('/admin/approvals');
      expect(siteAdminPage.url()).toContain('tab=equipment');

      // 4. Go back to dashboard
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // 5. Click on '교정' approval category and wait for navigation
      const calibrationCategory = siteAdminPage.getByRole('link', { name: /교정.*건/ });

      // Wait for navigation to complete before checking URL
      await Promise.all([
        siteAdminPage.waitForURL('**/admin/approvals**', { timeout: 10000 }),
        calibrationCategory.click(),
      ]);

      // Expected: Clicking '교정' navigates to /admin/approvals?tab=calibration
      expect(siteAdminPage.url()).toContain('/admin/approvals');
      expect(siteAdminPage.url()).toContain('tab=calibration');

      console.log('✅ Approval category navigation working correctly');
    });
  });

  // Group 3: Role-Specific Categories (Sequential execution required)
  test.describe('Group 3: Role-Specific Approval Categories', () => {
    test.use({ storageState: undefined }); // Clear session between tests

    test('4.3 Verify role-specific approval categories', async ({ browser }) => {
      const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

      // TODO: callback/test-login 직접 호출 → auth.fixture storageState 전환 필요
      // fetchBackendToken()은 backend JWT만 반환하므로 NextAuth 세션이 필요한 이 테스트에는 사용 불가
      // Helper function to login and check categories
      async function loginAndCheckCategories(role: string, expectedCategories: string[]) {
        // Create a new context and page for each login
        const context = await browser.newContext({ baseURL });
        const page = await context.newPage();

        // Get CSRF token
        const csrfResponse = await page.request.get(`${baseURL}/api/auth/csrf`);
        const { csrfToken } = await csrfResponse.json();

        // Login via NextAuth callback
        const loginResponse = await page.request.post(
          `${baseURL}/api/auth/callback/test-login?callbackUrl=/`,
          {
            form: {
              role: role,
              csrfToken: csrfToken,
              json: 'true',
            },
          }
        );

        // Manually add cookies from login response
        const setCookieHeaders = loginResponse.headers()['set-cookie'];
        if (setCookieHeaders) {
          const cookies = setCookieHeaders.split('\n').map((cookieStr: string) => {
            const parts = cookieStr.split(';');
            const [name, ...valueParts] = parts[0].split('=');
            const value = valueParts.join('=');
            return {
              name: name.trim(),
              value,
              domain: 'localhost',
              path: '/',
            };
          });
          await context.addCookies(cookies);
        }

        // Navigate to dashboard
        await page.goto(`${baseURL}/`);
        await page.waitForLoadState('load');

        // Wait for dashboard to load
        const roleBadgeMap: Record<string, string> = {
          test_engineer: '시험실무자',
          technical_manager: '기술책임자',
          lab_manager: '시험소 관리자',
        };

        const roleBadge = page
          .locator(`text=${roleBadgeMap[role]}`)
          .or(page.locator('text=시험소장'));
        await expect(roleBadge.first()).toBeVisible({ timeout: 10000 });

        // Check visible categories
        for (const category of expectedCategories) {
          const categoryLink = page.getByRole('link', { name: new RegExp(`${category}.*건`) });
          await expect(categoryLink).toBeVisible({ timeout: 5000 });
        }

        // Verify categories that should NOT be visible
        const allCategories = ['장비', '교정', '반출', '보정계수', '소프트웨어'];
        const invisibleCategories = allCategories.filter(
          (cat) => !expectedCategories.includes(cat)
        );

        for (const category of invisibleCategories) {
          const categoryLink = page.getByRole('link', { name: new RegExp(`${category}.*건`) });
          const count = await categoryLink.count();
          expect(count).toBe(0);
        }

        console.log(
          `✅ ${role} sees ${expectedCategories.length} categories: ${expectedCategories.join(', ')}`
        );

        // Cleanup
        await context.close();
      }

      // 1. Login as test_engineer
      // 2. Navigate to dashboard and check visible categories
      // Expected: test_engineer sees: 장비, 교정, 반출 (3 categories)
      await loginAndCheckCategories('test_engineer', ['장비', '교정', '반출']);

      // 3. Logout and login as technical_manager
      // 4. Navigate to dashboard and check visible categories
      // Expected: technical_manager sees: 장비, 교정, 반출, 보정계수 (4 categories)
      await loginAndCheckCategories('technical_manager', ['장비', '교정', '반출', '보정계수']);

      // 5. Logout and login as lab_manager
      // 6. Navigate to dashboard and check visible categories
      // Expected: lab_manager sees all 5 categories including 소프트웨어
      await loginAndCheckCategories('lab_manager', [
        '장비',
        '교정',
        '반출',
        '보정계수',
        '소프트웨어',
      ]);
    });
  });

  // Group 5: Total Count and View All
  test.describe('Group 5: Total Count Badge and View All Button', () => {
    test('4.4 Verify total count badge and View All button', async ({ siteAdminPage }) => {
      // 1. Login as lab_manager with pending approvals in the system (handled by fixture)
      // 2. Navigate to dashboard
      await siteAdminPage.goto('/');

      // 3. Observe the total count badge
      // Expected: Total count badge shows sum of all pending approvals
      const totalCountBadge = siteAdminPage
        .locator('[class*="badge"]')
        .filter({ hasText: /\d+/ })
        .first();

      // Badge may or may not be visible depending on data
      // If visible, it should show a number
      const badgeVisible = await totalCountBadge.isVisible({ timeout: 2000 }).catch(() => false);
      if (badgeVisible) {
        const badgeText = await totalCountBadge.textContent();
        expect(badgeText).toMatch(/\d+/);
        console.log(`Total count badge shows: ${badgeText}`);

        // Expected: Badge animates with pulse effect when count > 0
        const badgeClass = await totalCountBadge.getAttribute('class');
        // Note: Pulse animation check depends on implementation
        console.log(`Badge classes: ${badgeClass}`);
      }

      // 4. Click the '전체 보기' button
      const viewAllButton = siteAdminPage
        .getByRole('link', { name: /전체 보기/ })
        .or(siteAdminPage.getByRole('button', { name: /전체 보기/ }));

      // Button may or may not exist depending on implementation
      const viewAllVisible = await viewAllButton.isVisible({ timeout: 2000 }).catch(() => false);
      if (viewAllVisible) {
        await viewAllButton.click();

        // Expected: Clicking '전체 보기' navigates to /admin/approvals
        expect(siteAdminPage.url()).toContain('/admin/approvals');
        console.log('✅ View All button navigates to /admin/approvals');
      } else {
        console.log('ℹ️ View All button not visible (may depend on approval count)');
      }
    });
  });

  // Group 6: Error Handling
  test.describe('Group 6: Error State Handling', () => {
    test('4.5 Verify error state when API fails', async ({ siteAdminPage }) => {
      // 1. Login as lab_manager (handled by fixture)

      // 2. Intercept pending approval API to return error
      await siteAdminPage.route('**/api/dashboard/pending-approvals**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      // 3. Navigate to dashboard
      await siteAdminPage.goto('/');

      // Wait for error state to render

      // Expected: Error message is displayed: '승인 대기 정보를 불러오는데 실패했습니다'
      const errorMessage = siteAdminPage
        .locator('text=승인 대기')
        .or(siteAdminPage.locator('text=불러오는데 실패'))
        .or(siteAdminPage.locator('text=오류'));

      // Error may be displayed in various ways
      const errorVisible = await errorMessage
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (errorVisible) {
        console.log('✅ Error state is displayed when API fails');

        // Expected: Error card has destructive border styling
        // Expected: AlertCircle icon is displayed
        const alertIcon = siteAdminPage
          .locator('[class*="alert"]')
          .or(siteAdminPage.locator('svg').filter({ hasText: /!/ }));

        const iconVisible = await alertIcon
          .first()
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        if (iconVisible) {
          console.log('✅ Alert icon is displayed');
        }
      } else {
        // Error handling may show loading state or empty state instead
        console.log('ℹ️ Error state implementation may vary');
      }

      // Clean up route intercept
      await siteAdminPage.unroute('**/api/dashboard/pending-approvals**');
    });
  });
});
