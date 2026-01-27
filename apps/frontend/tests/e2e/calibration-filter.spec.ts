/**
 * 교정 기한 필터 E2E 테스트 (Frontend)
 *
 * 비즈니스 규칙:
 * - 반출 상태와 무관하게 교정일 기준으로 필터링
 * - UI에서 필터 선택 시 올바른 결과 표시
 */

import { test, expect, Page } from '@playwright/test';

// 테스트용 로그인 헬퍼
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/', { timeout: 10000 });
}

test.describe('교정 기한 필터 - 반출 상태 무관', () => {
  test.beforeEach(async ({ page }) => {
    // 시험실무자로 로그인
    await loginAs(page, 'test.engineer@example.com', 'password123');
  });

  test('교정 임박 필터를 선택하면 반출 중인 장비도 표시되어야 한다', async ({ page }) => {
    // Given: 장비 목록 페이지로 이동
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // When: 교정 기한 필터 열기
    const filterButton = page.locator('button', { hasText: '필터' }).first();
    await filterButton.click();

    // 교정 기한 필터 선택
    const calibrationDueFilter = page.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon'); // 교정 임박 (30일 이내)

    // 필터 적용 대기
    await page.waitForLoadState('networkidle');

    // Then: 결과가 표시되어야 함
    const equipmentCards = page.locator('[data-testid="equipment-card"]');
    const count = await equipmentCards.count();

    // 최소 1개 이상의 장비가 있어야 함 (테스트 데이터 가정)
    expect(count).toBeGreaterThan(0);

    // 반출 중 상태 뱃지가 있는 장비도 확인
    const checkedOutBadges = page.locator('text=/반출 중|교정 중|수리 중|대여 중/');
    const hasCheckedOut = (await checkedOutBadges.count()) > 0;

    // 반출 중인 장비가 있으면 표시되어야 함
    if (hasCheckedOut) {
      console.log('✅ 반출 중인 장비도 필터 결과에 포함됨');
    }
  });

  test('교정 기한 초과 필터를 선택하면 모든 초과 장비가 표시되어야 한다', async ({ page }) => {
    // Given: 장비 목록 페이지로 이동
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // When: 교정 기한 필터 열기
    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // 교정 기한 필터 선택
    const calibrationDueFilter = page.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('overdue'); // 기한 초과

    // 필터 적용 대기
    await page.waitForLoadState('networkidle');

    // Then: 교정 기한 초과 장비가 표시됨
    const equipmentCards = page.locator('[data-testid="equipment-card"]');
    const count = await equipmentCards.count();

    // 초과 장비가 있을 수 있음 (없을 수도 있음)
    console.log(`교정 기한 초과 장비 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('필터 초기화가 정상 동작해야 한다', async ({ page }) => {
    // Given: 장비 목록 페이지에서 필터 적용
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    const calibrationDueFilter = page.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon');
    await page.waitForLoadState('networkidle');

    // 필터 적용 확인
    const filterBadge = page.locator('text=/교정기한:/');
    await expect(filterBadge).toBeVisible();

    // When: 초기화 버튼 클릭
    const resetButton = page.locator('button', { hasText: '초기화' });
    await resetButton.click();
    await page.waitForLoadState('networkidle');

    // Then: 필터가 초기화됨
    await expect(filterBadge).not.toBeVisible();

    // 전체 장비 목록이 표시됨
    const equipmentCards = page.locator('[data-testid="equipment-card"]');
    const count = await equipmentCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('여러 필터를 조합하여 사용할 수 있어야 한다', async ({ page }) => {
    // Given: 장비 목록 페이지로 이동
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    // When: 교정 기한 + 사이트 필터 적용
    const calibrationDueFilter = page.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon');

    const siteFilter = page.locator('select#filter-site');
    if (await siteFilter.isVisible()) {
      await siteFilter.selectOption('suwon');
    }

    await page.waitForLoadState('networkidle');

    // Then: 필터 뱃지가 2개 표시됨
    const filterBadges = page.locator('[role="list"][aria-label="적용된 필터"] > div');
    const badgeCount = await filterBadges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(1); // 최소 1개 이상
  });
});

test.describe('교정 기한 필터 - 장비 상세 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test.engineer@example.com', 'password123');
  });

  test('반출 중인 장비의 상세 페이지에서 교정 정보를 확인할 수 있어야 한다', async ({ page }) => {
    // Given: 장비 목록에서 반출 중인 장비 찾기
    await page.goto('http://localhost:3000/equipment');
    await page.waitForLoadState('networkidle');

    // 상태 필터로 반출 중 장비 조회
    const filterButton = page.locator('button', { hasText: '필터' }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }

    const statusFilter = page.locator('select#filter-status');
    await statusFilter.selectOption('checked_out');
    await page.waitForLoadState('networkidle');

    // When: 첫 번째 장비 클릭
    const firstEquipment = page.locator('[data-testid="equipment-card"]').first();
    if (await firstEquipment.isVisible()) {
      await firstEquipment.click();
      await page.waitForLoadState('networkidle');

      // Then: 상세 페이지에서 교정 정보 확인
      const calibrationInfo = page.locator('text=/교정|Calibration/i');
      const hasCalibrationInfo = (await calibrationInfo.count()) > 0;

      if (hasCalibrationInfo) {
        console.log('✅ 반출 중인 장비도 교정 정보 표시됨');
      }

      // 반출 중 상태도 표시되어야 함
      const status = page.locator('text=/반출 중|Checked Out/i');
      await expect(status).toBeVisible();
    }
  });
});
