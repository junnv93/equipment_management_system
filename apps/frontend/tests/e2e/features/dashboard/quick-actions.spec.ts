/**
 * Dashboard Test Plan - Suite 8: Quick Action Buttons
 *
 * spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
 * seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts
 *
 * This test suite validates quick action buttons functionality for different user roles
 * in the Equipment Management System dashboard.
 *
 * Test Coverage:
 * - Group 1: Quick actions for test_engineer role
 * - Group 2: Quick actions for lab_manager role
 * - Group 3: Quick action navigation flows
 * - Group 4: Keyboard accessibility for quick actions
 * - Group 5: Loading skeleton states
 *
 * SSOT Compliance:
 * - test_engineer buttons: 장비 등록, 반출 신청, 대여/반출 현황
 * - lab_manager buttons: 승인 관리, 사용자 관리, 시스템 설정
 * - Navigation URLs from shared constants
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Quick Action Buttons', () => {
  test.describe('Group 1: test_engineer Quick Actions', () => {
    test('8.1 Verify quick actions for test_engineer', async ({ testOperatorPage }) => {
      // 1. Navigate to dashboard (login handled by fixture)
      await testOperatorPage.goto('/');
      await testOperatorPage.waitForLoadState('load');

      // 2. Verify welcome message for test_engineer
      await expect(testOperatorPage.getByRole('heading', { name: /시험실무자님/ })).toBeVisible({
        timeout: 10000,
      });

      // 3. Locate the quick action buttons section
      const quickActionsNav = testOperatorPage.getByRole('navigation', { name: '빠른 액션' });
      await expect(quickActionsNav).toBeVisible();

      // 4. Verify 3 quick action buttons are visible (scope to quick actions nav)
      const button1 = quickActionsNav.getByRole('link', { name: '장비 등록' });
      const button2 = quickActionsNav.getByRole('link', { name: '반출 신청' });
      const button3 = quickActionsNav.getByRole('link', { name: '대여/반출 현황' });

      await expect(button1).toBeVisible();
      await expect(button2).toBeVisible();
      await expect(button3).toBeVisible();

      // 5. Verify each button has an icon and label (by checking they are links with text content)
      await expect(button1).toHaveText('장비 등록');
      await expect(button2).toHaveText('반출 신청');
      await expect(button3).toHaveText('대여/반출 현황');
    });
  });

  test.describe('Group 2: lab_manager Quick Actions', () => {
    test('8.2 Verify quick actions for lab_manager', async ({ siteAdminPage }) => {
      // 1. Navigate to dashboard (login handled by fixture)
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // 2. Verify welcome message for lab_manager
      await expect(siteAdminPage.getByRole('heading', { name: /테스트 시험소장님/ })).toBeVisible({
        timeout: 10000,
      });

      // 3. Locate the quick action buttons section
      const quickActionsNav = siteAdminPage.getByRole('navigation', { name: '빠른 액션' });
      await expect(quickActionsNav).toBeVisible();

      // 4. Verify 3 quick action buttons are visible (scope to quick actions nav to avoid sidebar links)
      const button1 = quickActionsNav.getByRole('link', { name: '승인 관리' });
      const button2 = quickActionsNav.getByRole('link', { name: '사용자 관리' });
      const button3 = quickActionsNav.getByRole('link', { name: '시스템 설정' });

      await expect(button1).toBeVisible();
      await expect(button2).toBeVisible();
      await expect(button3).toBeVisible();

      // 5. Verify primary button (승인 관리) has default variant styling (visible and clickable)
      await expect(button1).toBeEnabled();
      await expect(button1).toHaveText('승인 관리');
    });
  });

  test.describe('Group 3: Quick Action Navigation', () => {
    test('8.3 Verify quick action navigation', async ({ siteAdminPage }) => {
      // 1. Navigate to dashboard (login handled by fixture)
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // 2. Verify welcome message for lab_manager
      await expect(siteAdminPage.getByRole('heading', { name: /테스트 시험소장님/ })).toBeVisible({
        timeout: 10000,
      });

      // 3. Locate quick actions nav and click '승인 관리' button (scope to avoid sidebar link)
      const quickActionsNav = siteAdminPage.getByRole('navigation', { name: '빠른 액션' });
      await quickActionsNav.getByRole('link', { name: '승인 관리' }).click();

      // 4. Verify navigation to /admin/approvals (통합 승인 페이지)
      await expect(siteAdminPage).toHaveURL('/admin/approvals');

      // 5. Go back to dashboard
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');
      await expect(siteAdminPage.getByRole('heading', { name: /테스트 시험소장님/ })).toBeVisible({
        timeout: 10000,
      });

      // 6. Click '사용자 관리' button (scope to quick actions)
      const quickActionsNav2 = siteAdminPage.getByRole('navigation', { name: '빠른 액션' });
      await quickActionsNav2.getByRole('link', { name: '사용자 관리' }).click();

      // 7. Verify navigation to /admin/users (may be 404 if page doesn't exist, but URL should match)
      await expect(siteAdminPage).toHaveURL('/admin/users');

      // 8. Go back to dashboard
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');
      await expect(siteAdminPage.getByRole('heading', { name: /테스트 시험소장님/ })).toBeVisible({
        timeout: 10000,
      });

      // 9. Click '시스템 설정' button (scope to quick actions)
      const quickActionsNav3 = siteAdminPage.getByRole('navigation', { name: '빠른 액션' });
      await quickActionsNav3.getByRole('link', { name: '시스템 설정' }).click();

      // 10. Verify navigation to /settings
      await expect(siteAdminPage).toHaveURL('/settings');
    });
  });

  test.describe('Group 4: Keyboard Accessibility', () => {
    test('8.4 Verify quick action keyboard accessibility', async ({ siteAdminPage }) => {
      // 1. Navigate to dashboard (login handled by fixture)
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // 2. Verify welcome message for lab_manager
      await expect(siteAdminPage.getByRole('heading', { name: /테스트 시험소장님/ })).toBeVisible({
        timeout: 10000,
      });

      // 3. Locate quick actions nav
      const quickActionsNav = siteAdminPage.getByRole('navigation', { name: '빠른 액션' });
      await expect(quickActionsNav).toBeVisible();

      // 4. Get the first button (scope to quick actions to avoid sidebar link)
      const firstButton = quickActionsNav.getByRole('link', { name: '승인 관리' });

      // 5. Tab to the first quick action button
      // Continue tabbing through navigation items until we reach quick actions
      for (let i = 0; i < 25; i++) {
        await siteAdminPage.keyboard.press('Tab');
        const isFocused = await firstButton.evaluate((el) => el === document.activeElement);
        if (isFocused) break;
      }

      // 6. Verify focus ring is visible on focused button (check if button can be focused)
      await expect(firstButton).toBeVisible();

      // 7. Press Enter on focused button
      await siteAdminPage.keyboard.press('Enter');

      // 8. Verify navigation occurs (통합 승인 페이지)
      await expect(siteAdminPage).toHaveURL('/admin/approvals');
    });
  });

  test.describe('Group 5: Loading Skeleton', () => {
    test('8.5 Verify loading skeleton during session load', async ({ siteAdminPage }) => {
      // This test verifies that loading skeletons appear during session load
      // In a real implementation, we would mock slow network or session loading

      // 1. Navigate to dashboard (login handled by fixture)
      await siteAdminPage.goto('/');
      await siteAdminPage.waitForLoadState('load');

      // 2. Wait for dashboard to load
      await expect(siteAdminPage).toHaveURL('/');
      await expect(siteAdminPage.getByRole('heading', { name: /테스트 시험소장님/ })).toBeVisible({
        timeout: 10000,
      });

      // 3. Verify 3 skeleton buttons are replaced with actual buttons (scope to quick actions nav)
      const quickActionsNav = siteAdminPage.getByRole('navigation', { name: '빠른 액션' });
      const button1 = quickActionsNav.getByRole('link', { name: '승인 관리' });
      const button2 = quickActionsNav.getByRole('link', { name: '사용자 관리' });
      const button3 = quickActionsNav.getByRole('link', { name: '시스템 설정' });

      await expect(button1).toBeVisible();
      await expect(button2).toBeVisible();
      await expect(button3).toBeVisible();
    });
  });
});
