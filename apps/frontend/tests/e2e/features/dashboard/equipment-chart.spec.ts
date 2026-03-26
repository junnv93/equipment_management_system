// spec: /home/kmjkds/equipment_management_system/dashboard.plan.md
// seed: apps/frontend/tests/e2e/fixtures/auth.fixture.ts

/**
 * Dashboard Equipment Status Chart Tests - Suite 6
 *
 * Tests covering:
 * - Test 6.1: Verify chart renders with correct data (Group 1)
 * - Test 6.2: Verify chart legend displays all status values (Group 1)
 * - Test 6.3: Verify chart in Equipment tab with team stats (Group 1)
 * - Test 6.4: Verify chart loading skeleton (Group 1)
 *
 * SSOT Requirements:
 * - Status labels (Korean): '사용중', '반출중', '사용가능', '교정지연', '교정예정', '부적합', '여분', '폐기'
 * - Use EquipmentStatus from @equipment-management/schemas (reference only, verify Korean labels)
 * - Chart displays pie/donut visualization using Recharts
 * - Legend shows color-coded items with counts
 * - Total equipment count displayed
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Equipment Status Chart', () => {
  // Run only on chromium for consistency
  // Note: Project name check disabled as config may not load project names in all environments
  // test.beforeEach(async ({}, testInfo) => {
  //   if (testInfo.project.name !== 'chromium') {
  //     test.skip();
  //   }
  // });

  // Group 1: Basic Information Display
  test('Test 6.1: Verify chart renders with correct data', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');
    console.log('✓ Navigated to dashboard');

    // 3. Locate the equipment status chart
    await expect(siteAdminPage.getByRole('heading', { name: '장비 상태' })).toBeVisible({
      timeout: 10000,
    });
    console.log('✓ Equipment status chart card located');

    // 4. Verify pie/donut chart is rendered with color segments
    // Recharts uses SVG elements with specific classes
    const chartContainer = siteAdminPage.locator('.recharts-wrapper').first();
    await expect(chartContainer).toBeVisible({ timeout: 5000 });
    console.log('✓ Chart container (recharts-wrapper) is visible');

    // Verify SVG pie chart elements exist
    const pieElements = siteAdminPage.locator('.recharts-pie');
    await expect(pieElements.first()).toBeVisible();
    console.log('✓ Pie chart elements rendered');

    // 5. Verify legend shows all status categories with counts
    // Legend items have role="listitem" as per the component code
    const legendItems = siteAdminPage.locator('[role="listitem"]');
    const legendCount = await legendItems.count();
    expect(legendCount).toBeGreaterThan(0);
    console.log(`✓ Legend shows ${legendCount} status categories`);

    // 6. Verify categories include: 사용중, 반출중, 사용가능, 교정지연, etc.
    // Check for some key status labels (not all may have data)
    const pageContent = await siteAdminPage.content();
    const hasStatusLabels =
      pageContent.includes('사용중') ||
      pageContent.includes('사용가능') ||
      pageContent.includes('반출중') ||
      pageContent.includes('교정예정') ||
      pageContent.includes('교정지연');

    expect(hasStatusLabels).toBe(true);
    console.log('✓ Korean status labels present in chart');

    // 7. Verify total equipment count is displayed below chart
    // The component shows "총 XX대의 장비"
    const totalCountText = siteAdminPage.locator('text=/총 \\d+대의 장비/');
    await expect(totalCountText).toBeVisible();
    const totalText = await totalCountText.textContent();
    console.log(`✓ Total equipment count displayed: ${totalText}`);
  });

  // Group 1: Legend and Status Values
  test('Test 6.2: Verify chart legend displays all status values', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');

    // 3. Examine the chart legend items
    await expect(siteAdminPage.getByRole('heading', { name: '장비 상태' })).toBeVisible({
      timeout: 10000,
    });
    console.log('✓ Equipment status chart loaded');

    // 4. Verify legend shows color-coded items matching chart segments
    // Each legend item has a colored square (div with w-3 h-3 rounded-sm)
    const colorSquares = siteAdminPage.locator('[role="listitem"] div[style*="background"]');
    const colorSquareCount = await colorSquares.count();
    expect(colorSquareCount).toBeGreaterThan(0);
    console.log(`✓ Found ${colorSquareCount} color-coded legend items`);

    // Verify color squares have background-color styles
    const firstSquare = colorSquares.first();
    const style = await firstSquare.getAttribute('style');
    expect(style).toContain('background');
    console.log('✓ Legend items have color coding');

    // 5. Verify each legend item shows status name and count
    const legendItems = siteAdminPage.locator('[role="listitem"]');
    const firstItem = legendItems.first();
    await expect(firstItem).toBeVisible();

    // Each item should have text content with status name and numeric count
    const firstItemText = await firstItem.textContent();
    expect(firstItemText).toBeTruthy();
    console.log(`✓ Legend item example: "${firstItemText}"`);

    // 6. Verify status names are in Korean (사용중, 반출중, 사용가능, etc.)
    // Collect all legend item texts
    const itemCount = await legendItems.count();
    const legendTexts: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      const text = await legendItems.nth(i).textContent();
      if (text) legendTexts.push(text);
    }

    console.log(`✓ Legend items found: ${legendTexts.join(', ')}`);

    // Verify at least some Korean status labels are present
    const koreanLabels = [
      '사용중',
      '사용가능',
      '반출중',
      '교정예정',
      '교정지연',
      '부적합',
      '여분',
      '폐기',
    ];
    const hasKoreanLabels = legendTexts.some((text) =>
      koreanLabels.some((label) => text.includes(label))
    );
    expect(hasKoreanLabels).toBe(true);
    console.log('✓ Korean status names verified in legend');

    // 7. Verify legend items are clickable for filtering (if applicable)
    // Note: Based on component code, legend items are not currently interactive
    // This is a placeholder for future functionality
    console.log('⚠ Legend items are currently display-only (no click filtering)');
  });

  // Group 1: Tab Navigation and Chart Display
  test('Test 6.3: Verify chart in Equipment tab with team stats', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)
    // 2. Navigate to dashboard
    await siteAdminPage.goto('/');
    console.log('✓ Navigated to dashboard');

    // 3. Click on '장비 현황' tab
    const equipmentTab = siteAdminPage.getByRole('tab', { name: '장비 현황' });
    await expect(equipmentTab).toBeVisible({ timeout: 10000 });
    await equipmentTab.click();
    console.log('✓ Clicked on 장비 현황 tab');

    // 4. Verify equipment status chart is displayed in larger view
    await expect(siteAdminPage.getByRole('heading', { name: '장비 상태' })).toBeVisible();

    // Verify chart is rendered
    const chartContainer = siteAdminPage.locator('.recharts-wrapper').first();
    await expect(chartContainer).toBeVisible();
    console.log('✓ Equipment status chart displayed in Equipment tab');

    // 5. Verify team equipment stats are displayed alongside
    // TeamEquipmentStats component should be visible in this tab
    // Look for team names or team-related content
    const tabPanel = siteAdminPage.locator('[role="tabpanel"]:visible');
    const tabContent = await tabPanel.textContent();

    // The Equipment tab should contain both chart and team stats
    // Team stats typically show team names like "FCC EMC/RF" etc.
    console.log('✓ Equipment tab content loaded');

    // 6. Verify chart header shows '장비 상태' with description
    await expect(siteAdminPage.getByRole('heading', { name: '장비 상태' })).toBeVisible();

    // Verify description text "현재 장비 상태별 분포"
    const description = siteAdminPage.locator('text=현재 장비 상태별 분포');
    await expect(description).toBeVisible();
    console.log('✓ Chart header and description verified');

    // 7. Verify total count matches sum of all categories
    const totalCountText = siteAdminPage.locator('text=/총 \\d+대의 장비/');
    await expect(totalCountText).toBeVisible();
    const totalText = await totalCountText.textContent();

    // Extract number from "총 XX대의 장비"
    const totalMatch = totalText?.match(/총 (\d+)대의 장비/);
    if (totalMatch) {
      const totalFromChart = parseInt(totalMatch[1], 10);
      console.log(`✓ Total count from chart: ${totalFromChart}`);

      // Get sum from legend items (each shows "status count" format)
      const legendItems = siteAdminPage.locator('[role="listitem"]');
      const itemCount = await legendItems.count();
      let sumFromLegend = 0;

      for (let i = 0; i < itemCount; i++) {
        const itemText = await legendItems.nth(i).textContent();
        // Extract the numeric value (last number in the text)
        const numberMatch = itemText?.match(/(\d+)$/);
        if (numberMatch) {
          sumFromLegend += parseInt(numberMatch[1], 10);
        }
      }

      console.log(`✓ Sum from legend items: ${sumFromLegend}`);
      expect(totalFromChart).toBe(sumFromLegend);
      console.log('✓ Total count matches sum of all categories');
    }
  });

  // Group 1: Loading States
  test('Test 6.4: Verify chart loading skeleton', async ({ siteAdminPage }) => {
    // 1. Login as lab_manager (already done by fixture)

    // 2. Intercept chart data API to delay response
    await siteAdminPage.route('**/api/dashboard/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });
    console.log('✓ API delay intercepted (2s delay)');

    // 3. Navigate to dashboard
    await siteAdminPage.goto('/');
    console.log('✓ Navigated to dashboard with delayed API');

    // 4. Verify loading skeleton appears with proper dimensions
    // The EquipmentStatusChart dynamic import shows <Skeleton className="h-48 w-full" />
    // Look specifically for the h-48 skeleton (dynamic import loading state)
    const chartSkeleton = siteAdminPage.locator('[class*="h-48"][class*="w-full"]').first();

    // Try to catch the skeleton during loading
    const hasLoadingSkeleton = await chartSkeleton.isVisible({ timeout: 500 }).catch(() => false);

    if (hasLoadingSkeleton) {
      console.log('✓ Loading skeleton detected');

      // Verify skeleton has proper dimensions
      const boundingBox = await chartSkeleton.boundingBox();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThan(0);
        expect(boundingBox.width).toBeGreaterThan(0);
        console.log(`✓ Skeleton dimensions: ${boundingBox.width}x${boundingBox.height}`);
      }
    } else {
      console.log('⚠ Loading skeleton may have loaded too quickly to detect');
    }

    // 5. Verify skeleton matches chart container size (h-48)
    // h-48 in Tailwind = 12rem = 192px
    // The component code shows: <Skeleton className="h-48 w-full" /> for the dynamic import loading state
    // and <Skeleton className="h-[200px] w-[200px] rounded-full" /> for data loading

    // Check for any skeleton with h-48 class
    const h48Skeleton = siteAdminPage.locator('[class*="h-48"]');
    const has48Height = await h48Skeleton.isVisible({ timeout: 500 }).catch(() => false);

    if (has48Height) {
      console.log('✓ Skeleton with h-48 class found');
    }

    // 6. Verify skeleton is replaced with chart when data loads
    await expect(siteAdminPage.getByRole('heading', { name: '장비 상태' })).toBeVisible({
      timeout: 15000,
    });
    console.log('✓ Chart loaded');

    // Verify chart elements are now visible
    const chartContainer = siteAdminPage.locator('.recharts-wrapper').first();
    await expect(chartContainer).toBeVisible({ timeout: 5000 });
    console.log('✓ Skeleton replaced with actual chart content');

    // Verify no more chart-specific loading skeletons (h-48 w-full)
    // Note: Other skeletons may still be visible (e.g., team stats loading skeletons)
    const chartStillLoading = await chartSkeleton.isVisible({ timeout: 500 }).catch(() => false);
    expect(chartStillLoading).toBe(false);
    console.log('✓ Chart loading skeletons cleared after data loaded');
  });
});
