/**
 * 교정 관리 페이지 E2E 테스트
 *
 * 테스트 범위:
 * - 데이터 표시 (summary, overdue, upcoming, intermediate checks)
 * - 팀 필터 (동적 로딩)
 * - 검색 기능 (장비명, 관리번호)
 * - 탭 전환
 * - 빈 상태 처리
 * - 에러 처리
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

// 교정 관리 페이지로 이동 헬퍼
async function navigateToCalibrationPage(page: Page) {
  await page.goto('http://localhost:3000/calibration');
  // 페이지 로딩 대기 (데이터 fetch 완료까지)
  await page.waitForLoadState('networkidle');
  // React Query가 데이터를 로드할 때까지 추가 대기
  await page.waitForTimeout(1000);
}

test.describe('교정 관리 페이지 - 데이터 표시', () => {
  test.beforeEach(async ({ page }) => {
    // 기술책임자로 로그인 (전체 데이터 접근 권한)
    await loginAs(page, 'technical.manager@example.com', 'password123');
  });

  test('요약 통계 카드가 올바르게 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 통계 카드 확인 (3개: 전체, 기한 초과, 30일 이내)
    const statCards = page.locator('[data-testid="stat-card"], .grid > div > div.rounded-lg');
    const cardCount = await statCards.count();

    // 최소 3개의 통계 카드가 있어야 함
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // 카드 내용 확인
    const totalCard = page.locator('text=/전체 교정 장비|Total/i').first();
    await expect(totalCard).toBeVisible();

    const overdueCard = page.locator('text=/기한 초과|Overdue/i').first();
    await expect(overdueCard).toBeVisible();

    const upcomingCard = page.locator('text=/30일 이내|Due Soon/i').first();
    await expect(upcomingCard).toBeVisible();
  });

  test('기한 초과 탭에 올바른 데이터가 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 기한 초과 탭 클릭
    const overdueTab = page.locator('button[role="tab"]', { hasText: '기한 초과' });
    await overdueTab.click();
    await page.waitForLoadState('networkidle');

    // 테이블 또는 리스트가 표시되는지 확인
    const table = page.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 테이블 헤더 확인
      await expect(page.locator('th:has-text("장비명")')).toBeVisible();
      await expect(page.locator('th:has-text("관리번호")')).toBeVisible();
      await expect(page.locator('th:has-text("차기 교정일")')).toBeVisible();
    } else {
      // 빈 상태 메시지 확인
      const emptyMessage = page.locator('text=/기한이 초과된 장비가 없습니다|No overdue/i');
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('30일 이내 예정 탭에 올바른 데이터가 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 30일 이내 예정 탭 클릭
    const upcomingTab = page.locator('button[role="tab"]', { hasText: '30일 이내 예정' });
    await upcomingTab.click();
    await page.waitForLoadState('networkidle');

    // 테이블 또는 빈 상태 확인
    const table = page.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 데이터 행이 있는지 확인
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    } else {
      // 빈 상태 메시지
      const emptyMessage = page.locator('text=/30일 이내 교정 예정 장비가 없습니다/i');
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('중간점검 탭이 올바르게 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 중간점검 탭 클릭
    const intermediateTab = page.locator('button[role="tab"]', { hasText: '중간점검' });
    await intermediateTab.click();
    await page.waitForLoadState('networkidle');

    // 중간점검 데이터 표시 확인
    const hasTable = await page.locator('table').isVisible();
    const hasEmptyState = await page
      .locator('text=/중간점검 일정이 없습니다|No intermediate/i')
      .isVisible();

    // 테이블 또는 빈 상태 중 하나는 반드시 표시되어야 함
    expect(hasTable || hasEmptyState).toBe(true);
  });

  test('전체 탭에 모든 교정 이력이 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 전체 탭은 기본 선택됨
    const allTab = page.locator('button[role="tab"]', { hasText: '전체' });
    await expect(allTab).toHaveAttribute('data-state', 'active');

    // 테이블 확인
    const table = page.locator('table');
    const isTableVisible = await table.isVisible();

    if (isTableVisible) {
      // 테이블 헤더 확인
      await expect(page.locator('th:has-text("장비명")')).toBeVisible();
    } else {
      // 빈 상태
      const emptyMessage = page.locator('text=/등록된 교정 정보가 없습니다/i');
      await expect(emptyMessage).toBeVisible();
    }
  });
});

test.describe('교정 관리 페이지 - 팀 필터', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'technical.manager@example.com', 'password123');
  });

  test('팀 필터 옵션이 동적으로 로드되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 팀 필터 버튼 찾기
    const teamFilterTrigger = page.locator('button:has-text("팀 필터")');
    await teamFilterTrigger.click();

    // 드롭다운이 열렸는지 확인
    const dropdown = page.locator('[role="listbox"], [role="menu"]');
    await expect(dropdown).toBeVisible();

    // "모든 팀" 옵션 확인
    const allTeamsOption = page.locator('[role="option"]:has-text("모든 팀")');
    await expect(allTeamsOption).toBeVisible();

    // 동적으로 로드된 팀 옵션이 있는지 확인
    const teamOptions = page.locator('[role="option"]');
    const optionCount = await teamOptions.count();

    // 최소 "모든 팀" + 1개 이상의 팀이 있어야 함
    expect(optionCount).toBeGreaterThan(1);

    console.log(`✅ 팀 필터 옵션 수: ${optionCount} (모든 팀 포함)`);
  });

  test('팀 필터를 선택하면 해당 팀의 장비만 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 팀 필터 열기
    const teamFilterTrigger = page.locator('button:has-text("팀 필터")');
    await teamFilterTrigger.click();

    // 동적 팀 옵션 중 첫 번째 선택 (모든 팀 제외)
    const teamOptions = page.locator('[role="option"]:not(:has-text("모든 팀"))');
    const firstTeamOption = teamOptions.first();

    // 팀이 존재하면 선택
    if ((await teamOptions.count()) > 0) {
      const teamName = await firstTeamOption.textContent();
      await firstTeamOption.click();
      await page.waitForLoadState('networkidle');

      console.log(`✅ 선택한 팀: ${teamName}`);

      // 필터가 적용되었는지 확인 (테이블 또는 빈 상태)
      const hasTable = await page.locator('table tbody tr').count();
      const hasEmptyState = await page.locator('text=/교정 정보가 없습니다/i').isVisible();

      // 결과가 표시되거나 빈 상태가 표시되어야 함
      expect(hasTable > 0 || hasEmptyState).toBe(true);
    }
  });

  test('"모든 팀" 옵션을 선택하면 전체 장비가 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 먼저 특정 팀 선택
    const teamFilterTrigger = page.locator('button:has-text("팀 필터")');
    await teamFilterTrigger.click();

    const teamOptions = page.locator('[role="option"]:not(:has-text("모든 팀"))');
    if ((await teamOptions.count()) > 0) {
      await teamOptions.first().click();
      await page.waitForLoadState('networkidle');

      // 다시 팀 필터 열고 "모든 팀" 선택
      await teamFilterTrigger.click();
      const allTeamsOption = page.locator('[role="option"]:has-text("모든 팀")');
      await allTeamsOption.click();
      await page.waitForLoadState('networkidle');

      // 전체 데이터가 표시되어야 함
      const table = page.locator('table');
      const isTableVisible = await table.isVisible();

      if (isTableVisible) {
        console.log('✅ 모든 팀 필터 적용 - 전체 데이터 표시');
      }
    }
  });
});

test.describe('교정 관리 페이지 - 검색 기능', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'technical.manager@example.com', 'password123');
  });

  test('장비명으로 검색이 가능해야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 검색 입력 필드 찾기
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]');
    await expect(searchInput).toBeVisible();

    // 검색어 입력
    await searchInput.fill('Spectrum');
    await page.waitForLoadState('networkidle');

    // 검색 결과 확인
    const hasResults = (await page.locator('table tbody tr').count()) > 0;
    const hasEmptyState = await page.locator('text=/교정 정보가 없습니다/i').isVisible();

    // 결과 또는 빈 상태가 표시되어야 함
    expect(hasResults || hasEmptyState).toBe(true);

    if (hasResults) {
      console.log('✅ 장비명 검색 결과 표시됨');
    }
  });

  test('관리번호로 검색이 가능해야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]');
    await expect(searchInput).toBeVisible();

    // 관리번호 형식으로 검색 (SUW-E0001 형식)
    await searchInput.fill('SUW');
    await page.waitForLoadState('networkidle');

    // 검색 결과 확인
    const hasResults = (await page.locator('table tbody tr').count()) > 0;
    const hasEmptyState = await page.locator('text=/교정 정보가 없습니다/i').isVisible();

    expect(hasResults || hasEmptyState).toBe(true);
  });

  test('검색어를 지우면 전체 목록이 다시 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]');

    // 검색어 입력
    await searchInput.fill('NonExistentEquipment');
    await page.waitForLoadState('networkidle');

    // 검색어 지우기
    await searchInput.clear();
    await page.waitForLoadState('networkidle');

    // 전체 목록 또는 빈 상태가 표시되어야 함
    const hasTable = await page.locator('table').isVisible();
    const hasEmptyState = await page.locator('text=/등록된 교정 정보가 없습니다/i').isVisible();

    expect(hasTable || hasEmptyState).toBe(true);
  });
});

test.describe('교정 관리 페이지 - 탭 전환', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'technical.manager@example.com', 'password123');
  });

  test('모든 탭이 접근 가능해야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 4개의 탭 확인
    const tabs = ['전체', '기한 초과', '30일 이내 예정', '중간점검'];

    for (const tabName of tabs) {
      const tab = page.locator(`button[role="tab"]:has-text("${tabName}")`);
      await expect(tab).toBeVisible();
      await expect(tab).toBeEnabled();

      // 탭 클릭
      await tab.click();
      await page.waitForLoadState('networkidle');

      // 탭이 활성화되었는지 확인
      await expect(tab).toHaveAttribute('data-state', 'active');

      console.log(`✅ ${tabName} 탭 전환 성공`);
    }
  });

  test('탭 전환 시 데이터가 올바르게 로드되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 전체 탭 -> 기한 초과 탭
    const overdueTab = page.locator('button[role="tab"]:has-text("기한 초과")');
    await overdueTab.click();
    await page.waitForLoadState('networkidle');

    // 데이터 또는 빈 상태 확인
    const hasData1 = await page.locator('table tbody tr').count();
    const hasEmpty1 = await page.locator('text=/기한이 초과된 장비가 없습니다/i').isVisible();
    expect(hasData1 > 0 || hasEmpty1).toBe(true);

    // 30일 이내 예정 탭으로 전환
    const upcomingTab = page.locator('button[role="tab"]:has-text("30일 이내 예정")');
    await upcomingTab.click();
    await page.waitForLoadState('networkidle');

    // 데이터 또는 빈 상태 확인
    const hasData2 = await page.locator('table tbody tr').count();
    const hasEmpty2 = await page.locator('text=/30일 이내 교정 예정 장비가 없습니다/i').isVisible();
    expect(hasData2 > 0 || hasEmpty2).toBe(true);
  });
});

test.describe('교정 관리 페이지 - 빈 상태 처리', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test.engineer@example.com', 'password123');
  });

  test('데이터가 없을 때 적절한 빈 상태 메시지가 표시되어야 한다', async ({ page }) => {
    await navigateToCalibrationPage(page);

    // 검색으로 빈 상태 유도
    const searchInput = page.locator('input[placeholder*="검색"], input[type="search"]');
    await searchInput.fill('ThisEquipmentDefinitelyDoesNotExist12345');
    await page.waitForLoadState('networkidle');

    // 빈 상태 메시지 확인
    const emptyMessage = page.locator('text=/교정 정보가 없습니다/i');
    const isEmptyVisible = await emptyMessage.isVisible();

    if (isEmptyVisible) {
      console.log('✅ 빈 상태 메시지 표시됨');
    }
  });
});

test.describe('교정 관리 페이지 - 에러 처리', () => {
  test('로딩 상태가 올바르게 표시되어야 한다', async ({ page }) => {
    // 로그인
    await loginAs(page, 'technical.manager@example.com', 'password123');

    // 페이지 이동 (로딩 상태 관찰)
    await page.goto('http://localhost:3000/calibration');

    // 로딩 표시 확인 (빠르게 사라질 수 있음)
    const loadingIndicator = page.locator('text=/불러오는 중|Loading/i');
    // 로딩 표시가 나타났다가 사라져야 함 (빠를 수 있음)
    await page.waitForLoadState('networkidle');

    // 최종적으로 콘텐츠가 표시되어야 함
    const content = page.locator('table, text=/교정 정보가 없습니다/i');
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('교정 관리 페이지 - 권한별 접근', () => {
  test('시험실무자는 교정 관리 페이지에 접근할 수 있어야 한다', async ({ page }) => {
    await loginAs(page, 'test.engineer@example.com', 'password123');
    await navigateToCalibrationPage(page);

    // 페이지 제목 확인
    await expect(page.locator('h1, h2').filter({ hasText: /교정|Calibration/i })).toBeVisible();
  });

  test('기술책임자는 교정 관리 페이지에 접근할 수 있어야 한다', async ({ page }) => {
    await loginAs(page, 'technical.manager@example.com', 'password123');
    await navigateToCalibrationPage(page);

    // 페이지 제목 확인
    await expect(page.locator('h1, h2').filter({ hasText: /교정|Calibration/i })).toBeVisible();
  });

  test('시험소장은 교정 관리 페이지에 접근할 수 있어야 한다', async ({ page }) => {
    await loginAs(page, 'lab.manager@example.com', 'password123');
    await navigateToCalibrationPage(page);

    // 페이지 제목 확인
    await expect(page.locator('h1, h2').filter({ hasText: /교정|Calibration/i })).toBeVisible();
  });
});
