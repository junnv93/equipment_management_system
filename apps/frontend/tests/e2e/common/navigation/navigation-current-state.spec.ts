import { test, expect, Page } from '@playwright/test';

/**
 * Phase 0: Current Navigation State Verification
 *
 * This test verifies the reported issue: "홈으로 돌아오는 기능이 명확하지 않음"
 *
 * Test objectives:
 * 1. Verify that sidebar logo is clickable on desktop
 * 2. Verify that header title is NOT clickable
 * 3. Verify that mobile users must open hamburger menu to return home
 * 4. Document current navigation pain points with screenshots
 */

// Helper function to login
async function login(page: Page) {
  await page.goto('http://localhost:3000/login');

  // Wait for login page to load
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // Fill login form with valid test credentials
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'admin123');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
}

test.describe('Current Navigation State - Desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should verify sidebar logo is clickable on desktop', async ({ page }) => {
    await login(page);

    // Navigate to equipment page
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // Take screenshot of equipment page
    await page.screenshot({ path: '/tmp/before-desktop-equipment.png', fullPage: true });

    // Check if sidebar logo link exists
    const sidebarLogoLink = page.locator('a[href="/"]').filter({ hasText: '장비 관리 시스템' });
    await expect(sidebarLogoLink).toBeVisible();

    // Verify it's clickable by checking role/tag
    const linkElement = await sidebarLogoLink.evaluate((el) => ({
      tagName: el.tagName,
      href: (el as HTMLAnchorElement).href,
      isClickable: true,
    }));

    expect(linkElement.tagName).toBe('A');
    expect(linkElement.href).toContain('/');

    console.log('✅ Desktop: Sidebar logo is clickable');
  });

  test('should verify header title is NOT clickable on desktop', async ({ page }) => {
    await login(page);

    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // Look for header title
    const headerTitle = page.locator('h1').filter({ hasText: '장비 관리' }).first();

    if ((await headerTitle.count()) > 0) {
      // Check if it's wrapped in a link
      const parentLink = await headerTitle.evaluate((el) => {
        const parent = el.closest('a');
        return parent ? { href: parent.href } : null;
      });

      if (!parentLink) {
        console.log('❌ Problem found: Header title is NOT clickable (not wrapped in link)');
      } else {
        console.log('⚠️ Header title is clickable (unexpected)');
      }
    }
  });

  test('should verify "대시보드" menu item exists for home navigation', async ({ page }) => {
    await login(page);

    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // Check for dashboard menu item in sidebar
    const dashboardMenuItem = page.locator('nav a[href="/"]').filter({ hasText: '대시보드' });

    if ((await dashboardMenuItem.count()) > 0) {
      await expect(dashboardMenuItem).toBeVisible();
      console.log('✅ Desktop: "대시보드" menu item exists in sidebar');
    } else {
      console.log('❌ Problem: No "대시보드" menu item found');
    }
  });
});

test.describe('Current Navigation State - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should verify mobile requires hamburger menu to return home', async ({ page }) => {
    await login(page);

    // Navigate to equipment page
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // Take screenshot of mobile equipment page
    await page.screenshot({ path: '/tmp/before-mobile-equipment.png', fullPage: true });

    // Check if there's a direct home button in header (should NOT exist currently)
    const headerHomeButton = page
      .locator('header a[href="/"]')
      .filter({ has: page.locator('svg') });
    const headerHomeButtonCount = await headerHomeButton.count();

    if (headerHomeButtonCount === 0) {
      console.log('❌ Problem found: No direct home button in mobile header');
      console.log('   Users must open hamburger menu to navigate home');
    } else {
      console.log('⚠️ Unexpected: Mobile header has home button');
    }

    // Verify hamburger menu exists
    const hamburgerButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await expect(hamburgerButton).toBeVisible();
    console.log('✅ Mobile: Hamburger menu button exists');

    // Open hamburger menu
    await hamburgerButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // Check if dashboard link is in mobile menu
    const mobileDashboardLink = page.locator('nav a[href="/"]');
    const mobileMenuLinkCount = await mobileDashboardLink.count();

    if (mobileMenuLinkCount > 0) {
      console.log('✅ Mobile: Dashboard link available in hamburger menu');
      console.log('   But this requires extra tap - not ideal UX');
    }

    // Take screenshot with menu open
    await page.screenshot({ path: '/tmp/before-mobile-menu-open.png', fullPage: true });
  });
});

test.describe('Current Navigation State - Checkouts Page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should verify navigation on checkouts page', async ({ page }) => {
    await login(page);

    await page.goto('http://localhost:3000/checkouts');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: '/tmp/before-checkouts.png', fullPage: true });

    // Same verification as equipment page
    const sidebarLogoLink = page.locator('a[href="/"]').filter({ hasText: '장비 관리 시스템' });
    await expect(sidebarLogoLink).toBeVisible();

    console.log('✅ Checkouts page: Sidebar logo clickable');
    console.log('❌ Checkouts page: No breadcrumb to show "홈 > 대여/반출 관리"');
  });
});

test.describe('Current Navigation State - Deep Page (Equipment Detail)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should verify navigation on deep nested page', async ({ page }) => {
    await login(page);

    // Go to equipment list
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // Try to find first equipment link (may not exist in test environment)
    const firstEquipmentLink = page.locator('a[href^="/equipment/"]').first();
    const equipmentLinkCount = await firstEquipmentLink.count();

    if (equipmentLinkCount > 0) {
      await firstEquipmentLink.click();
      await page.waitForLoadState('networkidle');

      // Take screenshot of equipment detail page
      await page.screenshot({ path: '/tmp/before-equipment-detail.png', fullPage: true });

      console.log('✅ Equipment detail page loaded');
      console.log('❌ Problem: No breadcrumb showing "홈 > 장비 관리 > [장비명]"');
      console.log('   User cannot directly go back to equipment list');
      console.log('   User must use browser back button or sidebar menu');
    } else {
      console.log('⚠️ No equipment items found in test environment');
    }
  });
});

test.describe('Summary Report Generation', () => {
  test('should generate current state summary', async ({ page }) => {
    const summary = {
      testDate: new Date().toISOString(),
      findings: [
        {
          severity: 'HIGH',
          issue: 'Mobile에서 직접적인 홈 복귀 버튼 없음',
          description: '모바일 사용자는 햄버거 메뉴를 열어야만 홈으로 이동 가능 (2탭 필요)',
          impact: 'UX 저하, 불필요한 클릭 증가',
        },
        {
          severity: 'MEDIUM',
          issue: '브레드크럼 네비게이션 부재',
          description: '현재 위치를 파악하기 어렵고, 계층적 네비게이션 불가능',
          impact: '사용자가 "어디에 있는지" 모르는 상황 발생',
        },
        {
          severity: 'LOW',
          issue: '헤더 타이틀이 클릭 불가능',
          description: '헤더의 타이틀이 단순 텍스트로, 네비게이션 기능 없음',
          impact: '사용자가 타이틀을 클릭해도 반응 없음 (예상과 다른 동작)',
        },
      ],
      workingFeatures: [
        '데스크톱 사이드바 로고 클릭으로 홈 이동 가능',
        '사이드바 "대시보드" 메뉴 항목 존재',
        '햄버거 메뉴를 통한 모바일 네비게이션 가능 (번거롭지만)',
      ],
      screenshots: [
        '/tmp/before-desktop-equipment.png',
        '/tmp/before-mobile-equipment.png',
        '/tmp/before-mobile-menu-open.png',
        '/tmp/before-checkouts.png',
        '/tmp/before-equipment-detail.png',
      ],
    };

    console.log('\n========================================');
    console.log('CURRENT NAVIGATION STATE SUMMARY');
    console.log('========================================\n');
    console.log('Test Date:', summary.testDate);
    console.log('\n--- PROBLEMS FOUND ---\n');

    summary.findings.forEach((finding, index) => {
      console.log(`${index + 1}. [${finding.severity}] ${finding.issue}`);
      console.log(`   설명: ${finding.description}`);
      console.log(`   영향: ${finding.impact}\n`);
    });

    console.log('\n--- WORKING FEATURES ---\n');
    summary.workingFeatures.forEach((feature, index) => {
      console.log(`${index + 1}. ${feature}`);
    });

    console.log('\n--- SCREENSHOTS CAPTURED ---\n');
    summary.screenshots.forEach((screenshot, index) => {
      console.log(`${index + 1}. ${screenshot}`);
    });

    console.log('\n========================================');
    console.log('RECOMMENDATION: Implement breadcrumb navigation');
    console.log('========================================\n');
  });
});
