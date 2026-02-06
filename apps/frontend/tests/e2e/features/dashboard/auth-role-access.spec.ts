/**
 * Dashboard Test Plan - Suite 1: Authentication and Role-based Access
 *
 * spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
 * seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts
 *
 * This test suite validates authentication flows and role-based access controls
 * for the Equipment Management System dashboard.
 *
 * Test Coverage:
 * - Group 1: Login flows for all roles (test_engineer, technical_manager, lab_manager)
 * - Group 2: Role-specific tab visibility and permissions
 * - Group 7: Session persistence and unauthorized access handling
 *
 * SSOT Compliance:
 * - Uses auth.fixture.ts for authenticated contexts
 * - Role values from @equipment-management/schemas
 * - Korean UI labels for tabs and badges
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';
import { test as baseTest } from '@playwright/test';
import { Page } from '@playwright/test';

test.describe('Authentication and Role-based Access', () => {
  // Run tests only on chromium for consistent results
  // Temporarily disabled to debug tests
  // test.beforeEach(async ({}, testInfo) => {
  //   if (testInfo.project.name !== 'chromium') {
  //     test.skip();
  //   }
  // });

  test.describe('Group 1: test_engineer Authentication', () => {
    baseTest('1.1 Login as test_engineer and verify dashboard access', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
      // 1. Navigate to http://localhost:3000/login
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      // 2. Enter email 'user@example.com' in the email field
      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('user@example.com');

      // 3. Enter password 'user123' in the password field
      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.fill('user123');

      // 4. Click the login button
      const loginButton = page.getByRole('button', { name: /로그인/i });
      await loginButton.click();

      // 5. Wait for navigation to dashboard
      await page.waitForURL(`${baseURL}/`);
      await page.waitForLoadState('load');

      // Expected: User is redirected to dashboard (URL should be '/')
      expect(page.url()).toBe(`${baseURL}/`);

      // Expected: Welcome header displays greeting with user name
      // The header contains dynamic greeting text (e.g., "좋은 아침입니다, 사용자님")
      const welcomeHeader = page.locator('h1').filter({ hasText: /님$/ });
      await expect(welcomeHeader).toBeVisible({ timeout: 10000 });

      // Expected: Role badge shows '시험실무자'
      // Use more specific selector to avoid strict mode violation
      const roleBadge = page.locator('[aria-label*="현재 역할"]', { hasText: '시험실무자' });
      await expect(roleBadge).toBeVisible();

      // Expected: Tabs show: 개요, 내 장비, 교정 (3 tabs only)
      const tabsList = page.getByRole('tablist');
      await expect(tabsList).toBeVisible();

      const tab1 = page.getByRole('tab', { name: '개요' });
      const tab2 = page.getByRole('tab', { name: '내 장비' });
      const tab3 = page.getByRole('tab', { name: '교정' });

      await expect(tab1).toBeVisible();
      await expect(tab2).toBeVisible();
      await expect(tab3).toBeVisible();

      // Verify only 3 tabs exist
      const allTabs = page.getByRole('tab');
      await expect(allTabs).toHaveCount(3);

      // Verify tabs that should NOT be visible
      const approvalTab = page.getByRole('tab', { name: '승인 관리' });
      const equipmentStatusTab = page.getByRole('tab', { name: '장비 현황' });
      const rentalTab = page.getByRole('tab', { name: '대여/반출' });

      await expect(approvalTab).not.toBeVisible();
      await expect(equipmentStatusTab).not.toBeVisible();
      await expect(rentalTab).not.toBeVisible();
    });
  });

  test.describe('Group 1: technical_manager Authentication', () => {
    baseTest('1.2 Login as technical_manager and verify role-specific tabs', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
      // 1. Navigate to http://localhost:3000/login
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      // 2. Enter email 'manager@example.com' in the email field
      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('manager@example.com');

      // 3. Enter password 'manager123' in the password field
      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.fill('manager123');

      // 4. Click the login button
      const loginButton = page.getByRole('button', { name: /로그인/i });
      await loginButton.click();

      // 5. Wait for navigation to dashboard
      await page.waitForURL(`${baseURL}/`);
      await page.waitForLoadState('load');

      // Expected: User is redirected to dashboard
      expect(page.url()).toBe(`${baseURL}/`);

      // Expected: Role badge shows '기술책임자'
      // Use more specific selector to avoid strict mode violation
      const roleBadge = page.locator('[aria-label*="현재 역할"]', { hasText: '기술책임자' });
      await expect(roleBadge).toBeVisible({ timeout: 10000 });

      // Expected: Tabs show: 개요, 팀 장비, 교정, 승인 관리 (4 tabs)
      const tab1 = page.getByRole('tab', { name: '개요' });
      const tab2 = page.getByRole('tab', { name: '팀 장비' });
      const tab3 = page.getByRole('tab', { name: '교정' });
      const tab4 = page.getByRole('tab', { name: '승인 관리' });

      await expect(tab1).toBeVisible();
      await expect(tab2).toBeVisible();
      await expect(tab3).toBeVisible();
      await expect(tab4).toBeVisible();

      // Verify exactly 4 tabs exist
      const allTabs = page.getByRole('tab');
      await expect(allTabs).toHaveCount(4);

      // Expected: Quick actions include: 승인 관리, 교정 등록, 장비 등록
      // Quick actions are in a nav element with aria-label="빠른 액션"
      const quickActionsNav = page.locator('nav[aria-label="빠른 액션"]');
      await expect(quickActionsNav).toBeVisible({ timeout: 5000 });

      // Verify specific buttons within the quick actions
      const approvalAction = quickActionsNav.getByRole('link', { name: /승인 관리/ });
      const calibrationAction = quickActionsNav.getByRole('link', { name: /교정 등록/ });
      const equipmentAction = quickActionsNav.getByRole('link', { name: /장비 등록/ });

      await expect(approvalAction).toBeVisible();
      await expect(calibrationAction).toBeVisible();
      await expect(equipmentAction).toBeVisible();
    });
  });

  test.describe('Group 1: lab_manager Authentication', () => {
    baseTest('1.3 Login as lab_manager and verify full access tabs', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
      // 1. Navigate to http://localhost:3000/login
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');

      // 2. Enter email 'admin@example.com' in the email field
      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('admin@example.com');

      // 3. Enter password 'admin123' in the password field
      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.fill('admin123');

      // 4. Click the login button
      const loginButton = page.getByRole('button', { name: /로그인/i });
      await loginButton.click();

      // 5. Wait for navigation to dashboard
      await page.waitForURL(`${baseURL}/`);
      await page.waitForLoadState('load');

      // Expected: User is redirected to dashboard
      expect(page.url()).toBe(`${baseURL}/`);

      // Expected: Role badge shows '시험소 관리자'
      // Use more specific selector to avoid strict mode violation
      const roleBadge = page.locator('[aria-label*="현재 역할"]', { hasText: '시험소 관리자' });
      await expect(roleBadge).toBeVisible({ timeout: 10000 });

      // Expected: Tabs show: 개요, 장비 현황, 교정, 대여/반출 (4 tabs)
      const tab1 = page.getByRole('tab', { name: '개요' });
      const tab2 = page.getByRole('tab', { name: '장비 현황' });
      const tab3 = page.getByRole('tab', { name: '교정' });
      const tab4 = page.getByRole('tab', { name: '대여/반출' });

      await expect(tab1).toBeVisible();
      await expect(tab2).toBeVisible();
      await expect(tab3).toBeVisible();
      await expect(tab4).toBeVisible();

      // Verify exactly 4 tabs exist
      const allTabs = page.getByRole('tab');
      await expect(allTabs).toHaveCount(4);

      // Expected: Quick actions include: 승인 관리, 사용자 관리, 시스템 설정
      // Quick actions are in a nav element with aria-label="빠른 액션"
      const quickActionsNav = page.locator('nav[aria-label="빠른 액션"]');
      await expect(quickActionsNav).toBeVisible({ timeout: 5000 });

      // Verify specific buttons within the quick actions
      const approvalAction = quickActionsNav.getByRole('link', { name: /승인 관리/ });
      const userManagementAction = quickActionsNav.getByRole('link', { name: /사용자 관리/ });
      const settingsAction = quickActionsNav.getByRole('link', { name: /시스템 설정|설정/ });

      await expect(approvalAction).toBeVisible();
      await expect(userManagementAction).toBeVisible();
      await expect(settingsAction).toBeVisible();
    });
  });

  test.describe('Group 7: Unauthorized Access and Session Management', () => {
    baseTest('1.4 Verify unauthorized access redirects to login', async ({ page }) => {
      const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

      // 1. Clear all cookies and session data
      await page.context().clearCookies();

      // 2. Navigate directly to http://localhost:3000/ without authentication
      await page.goto(`${baseURL}/`);

      // Wait for potential redirect
      await page.waitForLoadState('load');

      // Expected: User is redirected to login page
      expect(page.url()).toContain('/login');

      // Verify login page is displayed
      // The login page has a main element with aria-label "로그인"
      const loginMain = page.locator('main[aria-label="로그인"]');
      await expect(loginMain).toBeVisible({ timeout: 10000 });

      // Also verify the "Welcome back" heading is visible
      const welcomeHeading = page.getByRole('heading', { name: 'Welcome back' });
      await expect(welcomeHeading).toBeVisible();
    });

    test('1.5 Session persistence after page refresh', async ({ siteAdminPage }) => {
      // Note: siteAdminPage fixture already handles login as lab_manager

      // 1. Login as lab_manager (already done by fixture)
      // 2. Navigate to dashboard
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // Verify initial login state - use more specific selector to avoid strict mode violation
      const roleBadgeInitial = siteAdminPage.locator('[aria-label*="현재 역할"]', {
        hasText: '시험소 관리자',
      });
      await expect(roleBadgeInitial).toBeVisible({ timeout: 10000 });

      // Get session cookie before refresh
      const cookiesBefore = await siteAdminPage.context().cookies();
      const sessionCookieBefore = cookiesBefore.find((c) => c.name.includes('next-auth'));
      expect(sessionCookieBefore).toBeDefined();

      // 3. Refresh the page
      await siteAdminPage.reload();

      // 4. Wait for dashboard to load
      await siteAdminPage.waitForLoadState('load');

      // Expected: User remains logged in after refresh
      expect(siteAdminPage.url()).toContain('/');
      expect(siteAdminPage.url()).not.toContain('/login');

      // Expected: Dashboard content loads correctly - use more specific selector
      const roleBadgeAfter = siteAdminPage.locator('[aria-label*="현재 역할"]', {
        hasText: '시험소 관리자',
      });
      await expect(roleBadgeAfter).toBeVisible({ timeout: 10000 });

      // Verify tabs are still visible
      const tabsList = siteAdminPage.getByRole('tablist');
      await expect(tabsList).toBeVisible();

      // Expected: Session cookie is maintained
      const cookiesAfter = await siteAdminPage.context().cookies();
      const sessionCookieAfter = cookiesAfter.find((c) => c.name.includes('next-auth'));
      expect(sessionCookieAfter).toBeDefined();
      expect(sessionCookieAfter?.value).toBeTruthy();
    });
  });

  test.describe('Group 2: Role-based Tab Visibility (using fixtures)', () => {
    test('Test engineer sees only 3 tabs', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/');
      await testOperatorPage.waitForLoadState('load');

      // Verify role badge - use more specific selector to avoid strict mode violation
      const roleBadge = testOperatorPage.locator('[aria-label*="현재 역할"]', {
        hasText: '시험실무자',
      });
      await expect(roleBadge).toBeVisible({ timeout: 10000 });

      // Verify tab count
      const allTabs = testOperatorPage.getByRole('tab');
      await expect(allTabs).toHaveCount(3);

      // Verify specific tabs
      await expect(testOperatorPage.getByRole('tab', { name: '개요' })).toBeVisible();
      await expect(testOperatorPage.getByRole('tab', { name: '내 장비' })).toBeVisible();
      await expect(testOperatorPage.getByRole('tab', { name: '교정' })).toBeVisible();
    });

    test('Technical manager sees 4 tabs including approval management', async ({
      techManagerPage,
    }) => {
      await techManagerPage.goto('/');
      await techManagerPage.waitForLoadState('load');

      // Verify role badge - use more specific selector to avoid strict mode violation
      const roleBadge = techManagerPage.locator('[aria-label*="현재 역할"]', {
        hasText: '기술책임자',
      });
      await expect(roleBadge).toBeVisible({ timeout: 10000 });

      // Verify tab count
      const allTabs = techManagerPage.getByRole('tab');
      await expect(allTabs).toHaveCount(4);

      // Verify specific tabs
      await expect(techManagerPage.getByRole('tab', { name: '개요' })).toBeVisible();
      await expect(techManagerPage.getByRole('tab', { name: '팀 장비' })).toBeVisible();
      await expect(techManagerPage.getByRole('tab', { name: '교정' })).toBeVisible();
      await expect(techManagerPage.getByRole('tab', { name: '승인 관리' })).toBeVisible();
    });

    test('Lab manager sees 4 tabs with equipment status and rental', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // Verify role badge - use more specific selector to avoid strict mode violation
      const roleBadge = siteAdminPage.locator('[aria-label*="현재 역할"]', {
        hasText: '시험소 관리자',
      });
      await expect(roleBadge).toBeVisible({ timeout: 10000 });

      // Verify tab count
      const allTabs = siteAdminPage.getByRole('tab');
      await expect(allTabs).toHaveCount(4);

      // Verify specific tabs
      await expect(siteAdminPage.getByRole('tab', { name: '개요' })).toBeVisible();
      await expect(siteAdminPage.getByRole('tab', { name: '장비 현황' })).toBeVisible();
      await expect(siteAdminPage.getByRole('tab', { name: '교정' })).toBeVisible();
      await expect(siteAdminPage.getByRole('tab', { name: '대여/반출' })).toBeVisible();
    });
  });

  test.describe('Group 7: Accessibility - Role Badge Labels', () => {
    test('Role badges use correct Korean labels', async ({
      testOperatorPage,
      techManagerPage,
      siteAdminPage,
    }) => {
      // Test engineer role badge - use more specific selector to avoid strict mode violation
      await testOperatorPage.goto('/');
      await testOperatorPage.waitForLoadState('load');
      const engineerBadge = testOperatorPage.locator('[aria-label*="현재 역할"]', {
        hasText: '시험실무자',
      });
      await expect(engineerBadge).toBeVisible();

      // Technical manager role badge - use more specific selector to avoid strict mode violation
      await techManagerPage.goto('/');
      await techManagerPage.waitForLoadState('load');
      const managerBadge = techManagerPage.locator('[aria-label*="현재 역할"]', {
        hasText: '기술책임자',
      });
      await expect(managerBadge).toBeVisible();

      // Lab manager role badge - use more specific selector to avoid strict mode violation
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');
      const adminBadge = siteAdminPage.locator('[aria-label*="현재 역할"]', {
        hasText: '시험소 관리자',
      });
      await expect(adminBadge).toBeVisible();
    });
  });
});
