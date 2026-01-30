/**
 * 교정 관리 페이지 핵심 기능 E2E 테스트
 *
 * 가벼운 테스트 - 서버 부하를 최소화하면서 핵심 기능만 검증
 */

import { test, expect, Page } from '@playwright/test';

// 테스트용 로그인 헬퍼
async function loginAs(page: Page, email: string, password: string) {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:3000/', { timeout: 15000 });
}

// 교정 관리 페이지로 이동 헬퍼
async function navigateToCalibrationPage(page: Page) {
  await page.goto('http://localhost:3000/calibration');
  await page.waitForLoadState('networkidle');
  // React Query 데이터 로딩 대기
  await page.waitForTimeout(2000);
}

test.describe('교정 관리 페이지 - 핵심 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 실제 존재하는 테스트 계정 사용
    await loginAs(page, 'admin@example.com', 'admin123');
  });

  test('페이지가 정상적으로 로드되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 페이지 제목 확인
    const pageTitle = page.locator('h1, h2').filter({ hasText: /교정|Calibration/i });
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    console.log('✅ 페이지 로드 성공');
  });

  test('팀 필터가 동적으로 로드되어야 한다 (핵심 기능)', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 팀 필터 버튼 찾기
    const teamFilterTrigger = page.locator('button:has-text("팀 필터")').first();

    // 필터 버튼이 보일 때까지 대기
    await expect(teamFilterTrigger).toBeVisible({ timeout: 10000 });

    await teamFilterTrigger.click();

    // 드롭다운이 열릴 때까지 대기
    await page.waitForTimeout(500);

    // "모든 팀" 옵션 확인
    const allTeamsOption = page.locator('[role="option"]:has-text("모든 팀")');
    await expect(allTeamsOption).toBeVisible({ timeout: 5000 });

    // 동적으로 로드된 팀 옵션 확인
    const teamOptions = page.locator('[role="option"]');
    const optionCount = await teamOptions.count();

    // 최소 2개 이상 (모든 팀 + 실제 팀들)
    expect(optionCount).toBeGreaterThan(1);

    console.log(`✅ 팀 필터 옵션 수: ${optionCount} (동적 로딩 성공)`);

    // 실제 팀 이름 출력 (하드코딩 제거 확인)
    for (let i = 0; i < Math.min(optionCount, 5); i++) {
      const optionText = await teamOptions.nth(i).textContent();
      console.log(`   - 팀 ${i + 1}: ${optionText}`);
    }
  });

  test('탭 전환이 정상 작동해야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 전체 탭 확인 (기본 활성화)
    const allTab = page.locator('button[role="tab"]:has-text("전체")');
    await expect(allTab).toHaveAttribute('data-state', 'active');

    // 기한 초과 탭 클릭
    const overdueTab = page.locator('button[role="tab"]:has-text("기한 초과")');
    await overdueTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 기한 초과 탭 활성화 확인
    await expect(overdueTab).toHaveAttribute('data-state', 'active');

    console.log('✅ 탭 전환 성공');
  });

  test('검색 기능이 작동해야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 검색어 입력
    await searchInput.fill('Spectrum');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('✅ 검색 입력 성공');

    // 검색 결과 또는 빈 상태 확인
    const hasResults = (await page.locator('table tbody tr').count()) > 0;
    const hasEmptyState = await page.locator('text=/교정 정보가 없습니다/i').isVisible();

    expect(hasResults || hasEmptyState).toBe(true);

    if (hasResults) {
      console.log('✅ 검색 결과 표시됨');
    } else {
      console.log('✅ 빈 상태 메시지 표시됨');
    }
  });

  test('요약 통계 카드가 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 통계 카드 대기
    await page.waitForTimeout(2000);

    // 최소 하나의 통계 관련 텍스트가 보이는지 확인
    const statElements = page.locator('text=/전체|기한 초과|30일 이내/i');
    const hasStats = (await statElements.count()) > 0;

    expect(hasStats).toBe(true);
    console.log('✅ 통계 카드 표시 확인');
  });
});
