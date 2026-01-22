import { test, expect } from './fixtures/auth.fixture';
import { test as baseTest, expect as baseExpect } from '@playwright/test';

/**
 * UI-1: 역할별 대시보드 페이지 E2E 테스트
 *
 * 테스트 대상:
 * - 역할별 대시보드 렌더링
 * - 승인 대기 카드 및 클릭 동작
 * - 빠른 액션 버튼
 * - 반응형 레이아웃
 * - 최근 활동 목록
 */

// ============================================================================
// 기본 대시보드 테스트 (인증 없이)
// ============================================================================
baseTest.describe('Dashboard - Basic Rendering', () => {
  baseTest.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  baseTest('대시보드 기본 렌더링', async ({ page }) => {
    // 환영 메시지 확인
    await baseExpect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 통계 카드 확인
    await baseExpect(page.getByText('사용 가능')).toBeVisible();
    await baseExpect(page.getByText('교정 예정')).toBeVisible();
  });

  baseTest('빠른 액션 버튼 표시', async ({ page }) => {
    const quickActions = page.locator('nav[aria-label="빠른 액션"]');
    await baseExpect(quickActions).toBeVisible();

    const buttons = quickActions.locator('a');
    await baseExpect(buttons.first()).toBeVisible();
  });

  baseTest('승인 대기 카드 표시', async ({ page }) => {
    const approvalCard = page.getByTestId('pending-approval-card');
    await baseExpect(approvalCard).toBeVisible();
  });

  baseTest('탭 전환', async ({ page }) => {
    // 개요 탭이 기본 선택
    const overviewTab = page.getByRole('tab', { name: '개요' });
    await baseExpect(overviewTab).toHaveAttribute('data-state', 'active');

    // 탭 클릭 테스트
    const tabs = page.getByRole('tablist').locator('[role="tab"]');
    const tabCount = await tabs.count();

    for (let i = 1; i < tabCount; i++) {
      const tab = tabs.nth(i);
      await tab.click();
      await baseExpect(tab).toHaveAttribute('data-state', 'active');
    }
  });
});

// ============================================================================
// 시험실무자(test_engineer) 대시보드 테스트
// ============================================================================
test.describe('Dashboard - 시험실무자', () => {
  test('시험실무자 대시보드 렌더링', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 환영 메시지 확인
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible();

    // 역할 배지 확인
    await expect(testOperatorPage.getByText('시험실무자')).toBeVisible();

    // 승인 대기 카드 제목 확인 (시험실무자는 "내 요청 현황")
    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.getByText('내 요청 현황')).toBeVisible();
  });

  test('시험실무자 빠른 액션 버튼', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 시험실무자 전용 버튼 확인
    await expect(testOperatorPage.getByRole('link', { name: /장비 등록/i })).toBeVisible();
    await expect(testOperatorPage.getByRole('link', { name: /대여 신청/i })).toBeVisible();
  });

  test('시험실무자 승인 대기 카테고리', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');

    // 시험실무자에게 표시되는 카테고리 확인
    await expect(approvalCard.getByText('장비')).toBeVisible();
    await expect(approvalCard.getByText('교정')).toBeVisible();
    await expect(approvalCard.getByText('대여')).toBeVisible();
    await expect(approvalCard.getByText('반출')).toBeVisible();
  });

  test('시험실무자 탭 목록', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 시험실무자 전용 탭 확인
    await expect(testOperatorPage.getByRole('tab', { name: '개요' })).toBeVisible();
    await expect(testOperatorPage.getByRole('tab', { name: '내 장비' })).toBeVisible();
    await expect(testOperatorPage.getByRole('tab', { name: '교정' })).toBeVisible();
  });

  test('시험실무자 최근 활동 - 본인 활동만 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 최근 활동 카드 확인
    const activityCard = testOperatorPage.locator('[class*="Card"]').filter({
      hasText: '내 최근 활동',
    });

    // 카드가 존재하면 확인
    if (await activityCard.isVisible()) {
      await expect(activityCard.getByText('본인의 최근 7일간 활동 기록입니다')).toBeVisible();
    }
  });
});

// ============================================================================
// 기술책임자(technical_manager) 대시보드 테스트
// ============================================================================
test.describe('Dashboard - 기술책임자', () => {
  test('기술책임자 대시보드 렌더링', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    // 환영 메시지 확인
    await expect(techManagerPage.getByRole('heading', { level: 1 })).toBeVisible();

    // 역할 배지 확인
    await expect(techManagerPage.getByText('기술책임자')).toBeVisible();

    // 승인 대기 카드 제목 확인 (기술책임자는 "팀 승인 대기")
    const approvalCard = techManagerPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.getByText('팀 승인 대기')).toBeVisible();
  });

  test('기술책임자 빠른 액션 버튼', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    // 기술책임자 전용 버튼 확인
    await expect(techManagerPage.getByRole('link', { name: /승인 관리/i })).toBeVisible();
    await expect(techManagerPage.getByRole('link', { name: /교정 등록/i })).toBeVisible();
  });

  test('기술책임자 승인 대기 카테고리', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    const approvalCard = techManagerPage.getByTestId('pending-approval-card');

    // 기술책임자에게 표시되는 카테고리 확인
    await expect(approvalCard.getByText('장비')).toBeVisible();
    await expect(approvalCard.getByText('교정')).toBeVisible();
    await expect(approvalCard.getByText('대여')).toBeVisible();
    await expect(approvalCard.getByText('보정계수')).toBeVisible();
  });

  test('기술책임자 승인 대기 클릭 시 페이지 이동', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    const approvalCard = techManagerPage.getByTestId('pending-approval-card');
    const equipmentLink = approvalCard.locator('a').filter({ hasText: '장비' });

    if (await equipmentLink.isVisible()) {
      await equipmentLink.click();
      // 승인 관리 페이지로 이동 확인
      await expect(techManagerPage).toHaveURL(/admin|approvals|equipment/);
    }
  });

  test('기술책임자 탭 목록 - 승인 관리 탭 포함', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    // 기술책임자 전용 탭 확인
    await expect(techManagerPage.getByRole('tab', { name: '개요' })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: '팀 장비' })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: '교정' })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: '승인 관리' })).toBeVisible();
  });

  test('기술책임자 최근 활동 - 팀 활동 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    const activityCard = techManagerPage.locator('[class*="Card"]').filter({
      hasText: '팀 최근 활동',
    });

    if (await activityCard.isVisible()) {
      await expect(activityCard.getByText('팀 내 최근 7일간 활동 기록입니다')).toBeVisible();
    }
  });
});

// ============================================================================
// 시험소 관리자(lab_manager) 대시보드 테스트
// ============================================================================
test.describe('Dashboard - 시험소 관리자', () => {
  test('시험소 관리자 대시보드 렌더링', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/');

    // 환영 메시지 확인
    await expect(siteAdminPage.getByRole('heading', { level: 1 })).toBeVisible();

    // 역할 배지 확인
    await expect(siteAdminPage.getByText('시험소 관리자')).toBeVisible();

    // 승인 대기 카드 제목 확인
    const approvalCard = siteAdminPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.getByText('시험소 승인 대기')).toBeVisible();
  });

  test('시험소 관리자 모든 승인 카테고리 표시', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/');

    const approvalCard = siteAdminPage.getByTestId('pending-approval-card');

    // 관리자는 모든 카테고리 표시
    await expect(approvalCard.getByText('장비')).toBeVisible();
    await expect(approvalCard.getByText('교정')).toBeVisible();
    await expect(approvalCard.getByText('대여')).toBeVisible();
    await expect(approvalCard.getByText('반출')).toBeVisible();
    await expect(approvalCard.getByText('보정계수')).toBeVisible();
    await expect(approvalCard.getByText('소프트웨어')).toBeVisible();
  });

  test('시험소 관리자 탭 목록 - 대여/반출 탭 포함', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/');

    await expect(siteAdminPage.getByRole('tab', { name: '개요' })).toBeVisible();
    await expect(siteAdminPage.getByRole('tab', { name: '장비 현황' })).toBeVisible();
    await expect(siteAdminPage.getByRole('tab', { name: '교정' })).toBeVisible();
    await expect(siteAdminPage.getByRole('tab', { name: '대여/반출' })).toBeVisible();
  });
});

// ============================================================================
// 시스템 관리자(system_admin) 대시보드 테스트
// ============================================================================
test.describe('Dashboard - 시스템 관리자', () => {
  test('시스템 관리자 대시보드 렌더링', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/');

    // 환영 메시지 확인
    await expect(systemAdminPage.getByRole('heading', { level: 1 })).toBeVisible();

    // 역할 배지 확인
    await expect(systemAdminPage.getByText('시스템 관리자')).toBeVisible();

    // 승인 대기 카드 제목 확인
    const approvalCard = systemAdminPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.getByText('전체 승인 대기')).toBeVisible();
  });

  test('시스템 관리자 최근 활동 - 전체 활동 표시', async ({ systemAdminPage }) => {
    await systemAdminPage.goto('/');

    const activityCard = systemAdminPage.locator('[class*="Card"]').filter({
      hasText: '전체 최근 활동',
    });

    if (await activityCard.isVisible()) {
      await expect(
        activityCard.getByText('전체 시스템의 최근 7일간 활동 기록입니다')
      ).toBeVisible();
    }
  });
});

// ============================================================================
// 반응형 레이아웃 테스트
// ============================================================================
baseTest.describe('Dashboard - Responsive Layout', () => {
  baseTest('데스크톱 레이아웃 (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // 통계 카드가 4열로 표시
    const statsGrid = page.locator('.grid.gap-4.grid-cols-2.lg\\:grid-cols-4');
    await baseExpect(statsGrid).toBeVisible();

    // 환영 메시지와 빠른 액션이 가로로 배치
    const headerSection = page.locator('.flex.flex-col.md\\:flex-row');
    await baseExpect(headerSection).toBeVisible();
  });

  baseTest('태블릿 레이아웃 (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // 승인 대기 카드가 3열로 표시
    const approvalGrid = page.locator('.grid.grid-cols-2.md\\:grid-cols-3');
    if (await approvalGrid.isVisible()) {
      await baseExpect(approvalGrid).toBeVisible();
    }
  });

  baseTest('모바일 레이아웃 (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 환영 메시지가 표시됨
    await baseExpect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 통계 카드가 2열로 표시
    const statsGrid = page.locator('.grid.gap-4.grid-cols-2');
    await baseExpect(statsGrid).toBeVisible();

    // 탭이 스크롤 가능
    const tabsList = page.getByRole('tablist');
    await baseExpect(tabsList).toBeVisible();
  });

  baseTest('모바일에서 승인 대기 카드 스크롤', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const approvalCard = page.getByTestId('pending-approval-card');
    await baseExpect(approvalCard).toBeVisible();

    // 카드 내 그리드가 존재하는지 확인
    const cardGrid = approvalCard.locator('.grid');
    await baseExpect(cardGrid).toBeVisible();
  });
});

// ============================================================================
// 키보드 네비게이션 및 접근성 테스트
// ============================================================================
baseTest.describe('Dashboard - Accessibility', () => {
  baseTest('키보드 탭 네비게이션', async ({ page }) => {
    await page.goto('/');

    // Tab 키로 포커스 이동
    await page.keyboard.press('Tab');

    // 탭 목록에서 화살표 키로 탐색
    const tabList = page.getByRole('tablist');
    if (await tabList.isVisible()) {
      await tabList.focus();
      await page.keyboard.press('ArrowRight');

      // 두 번째 탭이 활성화되었는지 확인
      const tabs = tabList.locator('[role="tab"]');
      const secondTab = tabs.nth(1);
      await baseExpect(secondTab).toBeFocused();
    }
  });

  baseTest('승인 대기 카드 링크 접근성', async ({ page }) => {
    await page.goto('/');

    const approvalCard = page.getByTestId('pending-approval-card');
    const links = approvalCard.locator('a');

    // 모든 링크에 aria-label이 있는지 확인
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      baseExpect(ariaLabel).toBeTruthy();
    }
  });

  baseTest('스크린 리더 지원 - 역할 배지', async ({ page }) => {
    await page.goto('/');

    // 역할 배지에 aria 속성 확인
    const roleBadge = page.locator('[class*="Badge"]').first();
    if (await roleBadge.isVisible()) {
      // 배지 텍스트가 읽을 수 있는지 확인
      const text = await roleBadge.textContent();
      baseExpect(text).toBeTruthy();
    }
  });
});

// ============================================================================
// 로딩 상태 및 에러 핸들링 테스트
// ============================================================================
baseTest.describe('Dashboard - Loading & Error States', () => {
  baseTest('API 로딩 중 스켈레톤 표시', async ({ page }) => {
    // API 요청 지연
    await page.route('**/api/dashboard/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/');

    // 스켈레톤 로더가 표시되거나 최종 콘텐츠가 로드됨
    await baseExpect(
      page.getByText('사용 가능').or(page.locator('.animate-pulse').first())
    ).toBeVisible({ timeout: 15000 });
  });

  baseTest('API 에러 시 에러 메시지 표시', async ({ page }) => {
    // API 에러 시뮬레이션
    await page.route('**/api/dashboard/pending-approval-counts', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');

    // 에러 상태에서도 페이지가 크래시하지 않음
    await baseExpect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
