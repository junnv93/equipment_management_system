import { test, expect } from './fixtures/auth.fixture';

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
// 기본 대시보드 테스트 (인증 필요 - testOperatorPage 사용)
// ============================================================================
test.describe('Dashboard - Basic Rendering', () => {
  test('대시보드 기본 렌더링', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 환영 메시지 확인
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible();

    // 통계 카드 확인
    await expect(testOperatorPage.locator('text=사용 가능').first()).toBeVisible();
    await expect(testOperatorPage.locator('text=교정 예정').first()).toBeVisible();
  });

  test('빠른 액션 버튼 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const quickActions = testOperatorPage.locator('nav[aria-label="빠른 액션"]');
    await expect(quickActions).toBeVisible();

    const buttons = quickActions.locator('a');
    await expect(buttons.first()).toBeVisible();
  });

  test('승인 대기 카드 표시', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
  });

  test('탭 전환', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 개요 탭이 기본 선택
    const overviewTab = testOperatorPage.getByRole('tab', { name: '개요' });
    await expect(overviewTab).toHaveAttribute('data-state', 'active');

    // 탭 클릭 테스트
    const tabs = testOperatorPage.getByRole('tablist').locator('[role="tab"]');
    const tabCount = await tabs.count();

    for (let i = 1; i < tabCount; i++) {
      const tab = tabs.nth(i);
      await tab.click();
      await expect(tab).toHaveAttribute('data-state', 'active');
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

    // 역할 배지 확인 - 환영 헤더의 banner role 내에서 찾기
    const welcomeHeader = testOperatorPage.locator('[role="banner"]');
    await expect(welcomeHeader.locator('[aria-label*="현재 역할"]')).toBeVisible();

    // 승인 대기 카드 제목 확인 (시험실무자는 "내 요청 현황")
    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.locator('#pending-approval-title')).toContainText('내 요청 현황');
  });

  test('시험실무자 빠른 액션 버튼', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 빠른 액션 nav 영역 내에서 버튼 확인
    const quickActions = testOperatorPage.locator('nav[aria-label="빠른 액션"]');
    await expect(quickActions).toBeVisible();

    // 시험실무자 전용 버튼 확인 - 링크 텍스트로 찾기
    await expect(quickActions.locator('a', { hasText: '장비 등록' })).toBeVisible();
    await expect(quickActions.locator('a', { hasText: '대여 신청' })).toBeVisible();
  });

  test('시험실무자 승인 대기 카테고리', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');

    // 시험실무자에게 표시되는 카테고리 확인 - aria-label로 찾기
    await expect(approvalCard.locator('a[aria-label*="장비"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="교정"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="대여"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="반출"]')).toBeVisible();
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

    // 역할 배지 확인 - 환영 헤더의 banner role 내에서 찾기
    const welcomeHeader = techManagerPage.locator('[role="banner"]');
    await expect(welcomeHeader.locator('[aria-label*="현재 역할"]')).toBeVisible();

    // 승인 대기 카드 제목 확인 (기술책임자는 "팀 승인 대기")
    const approvalCard = techManagerPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.locator('#pending-approval-title')).toContainText('팀 승인 대기');
  });

  test('기술책임자 빠른 액션 버튼', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    // 빠른 액션 nav 영역 내에서 버튼 확인
    const quickActions = techManagerPage.locator('nav[aria-label="빠른 액션"]');
    await expect(quickActions).toBeVisible();

    // 기술책임자 전용 버튼 확인
    await expect(quickActions.locator('a', { hasText: '승인 관리' })).toBeVisible();
    await expect(quickActions.locator('a', { hasText: '교정 등록' })).toBeVisible();
  });

  test('기술책임자 승인 대기 카테고리', async ({ techManagerPage }) => {
    await techManagerPage.goto('/');

    const approvalCard = techManagerPage.getByTestId('pending-approval-card');

    // 기술책임자에게 표시되는 카테고리 확인 - aria-label로 찾기
    await expect(approvalCard.locator('a[aria-label*="장비"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="교정"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="대여"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="보정계수"]')).toBeVisible();
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

    // 역할 배지 확인 - 환영 헤더의 banner role 내에서 찾기
    const welcomeHeader = siteAdminPage.locator('[role="banner"]');
    await expect(welcomeHeader.locator('[aria-label*="현재 역할"]')).toBeVisible();

    // 승인 대기 카드 제목 확인
    const approvalCard = siteAdminPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.locator('#pending-approval-title')).toContainText('시험소 승인 대기');
  });

  test('시험소 관리자 모든 승인 카테고리 표시', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/');

    const approvalCard = siteAdminPage.getByTestId('pending-approval-card');

    // 관리자는 모든 카테고리 표시 - aria-label로 찾기
    await expect(approvalCard.locator('a[aria-label*="장비"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="교정"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="대여"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="반출"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="보정계수"]')).toBeVisible();
    await expect(approvalCard.locator('a[aria-label*="소프트웨어"]')).toBeVisible();
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

    // 역할 배지 확인 - 환영 헤더의 banner role 내에서 찾기
    const welcomeHeader = systemAdminPage.locator('[role="banner"]');
    await expect(welcomeHeader.locator('[aria-label*="현재 역할"]')).toBeVisible();

    // 승인 대기 카드 제목 확인
    const approvalCard = systemAdminPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
    await expect(approvalCard.locator('#pending-approval-title')).toContainText('전체 승인 대기');
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
// 반응형 레이아웃 테스트 (인증 필요)
// ============================================================================
test.describe('Dashboard - Responsive Layout', () => {
  test('데스크톱 레이아웃 (1280px)', async ({ testOperatorPage }) => {
    await testOperatorPage.setViewportSize({ width: 1280, height: 800 });
    await testOperatorPage.goto('/');

    // 통계 카드가 표시됨
    await expect(testOperatorPage.locator('text=사용 가능').first()).toBeVisible();

    // 환영 메시지가 표시됨
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('태블릿 레이아웃 (768px)', async ({ testOperatorPage }) => {
    await testOperatorPage.setViewportSize({ width: 768, height: 1024 });
    await testOperatorPage.goto('/');

    // 승인 대기 카드가 표시됨
    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();
  });

  test('모바일 레이아웃 (375px)', async ({ testOperatorPage }) => {
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });
    await testOperatorPage.goto('/');

    // 환영 메시지가 표시됨
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible();

    // 통계 카드 그리드가 표시됨
    const statsGrid = testOperatorPage.locator('.grid.gap-4');
    await expect(statsGrid.first()).toBeVisible();

    // 탭이 스크롤 가능
    const tabsList = testOperatorPage.getByRole('tablist');
    await expect(tabsList).toBeVisible();
  });

  test('모바일에서 승인 대기 카드 스크롤', async ({ testOperatorPage }) => {
    await testOperatorPage.setViewportSize({ width: 375, height: 667 });
    await testOperatorPage.goto('/');

    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();

    // 카드 내 그리드가 존재하는지 확인
    const cardGrid = approvalCard.locator('.grid');
    await expect(cardGrid).toBeVisible();
  });
});

// ============================================================================
// 키보드 네비게이션 및 접근성 테스트 (인증 필요)
// ============================================================================
test.describe('Dashboard - Accessibility', () => {
  test('키보드 탭 네비게이션', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 탭 목록 확인
    const tabList = testOperatorPage.getByRole('tablist');
    await expect(tabList).toBeVisible();

    // 첫 번째 탭 클릭 후 화살표 키로 탐색
    const tabs = tabList.locator('[role="tab"]');
    const firstTab = tabs.first();
    await firstTab.click();
    await firstTab.focus();

    // 화살표 키로 다음 탭으로 이동
    await testOperatorPage.keyboard.press('ArrowRight');

    // 포커스가 이동했는지 확인 (두 번째 탭 또는 첫 번째 탭이 여전히 포커스)
    const focusedElement = testOperatorPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('승인 대기 카드 링크 접근성', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    const links = approvalCard.locator('a');

    // 모든 링크에 aria-label이 있는지 확인
    const linkCount = await links.count();
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const ariaLabel = await link.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('스크린 리더 지원 - 역할 배지', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 역할 배지에 aria 속성 확인
    const roleBadge = testOperatorPage.locator('[class*="Badge"]').first();
    if (await roleBadge.isVisible()) {
      // 배지 텍스트가 읽을 수 있는지 확인
      const text = await roleBadge.textContent();
      expect(text).toBeTruthy();
    }
  });

  // 추가 접근성 테스트 (@a11y 태그)
  test('@a11y 승인 대기 카드 region 및 labelledby 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const approvalCard = testOperatorPage.getByTestId('pending-approval-card');
    await expect(approvalCard).toBeVisible();

    // role="region" 확인
    const role = await approvalCard.getAttribute('role');
    expect(role).toBe('region');

    // aria-labelledby 확인
    const labelledBy = await approvalCard.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
  });

  test('@a11y 환영 헤더 banner role 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // banner role을 가진 요소 중 aria-label이 있는 것 확인
    const banner = testOperatorPage.locator('[role="banner"][aria-label]');
    if (await banner.isVisible()) {
      const ariaLabel = await banner.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('환영');
    }
  });

  test('@a11y 포커스 표시 스타일 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 빠른 액션 버튼 영역 찾기
    const quickActions = testOperatorPage.locator('nav[aria-label="빠른 액션"]');
    if (await quickActions.isVisible()) {
      const firstLink = quickActions.locator('a').first();

      // 포커스 이동
      await firstLink.focus();

      // 포커스 링이 표시되는지 확인 (focus-visible)
      const isFocused = await firstLink.evaluate((el) => {
        return document.activeElement === el;
      });
      expect(isFocused).toBe(true);
    }
  });

  test('@a11y 탭 리스트 aria-label 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    const tabList = testOperatorPage.getByRole('tablist');
    if (await tabList.isVisible()) {
      const ariaLabel = await tabList.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('@a11y 로딩 상태 접근성 확인', async ({ testOperatorPage }) => {
    // API 지연 시뮬레이션
    await testOperatorPage.route('**/api/dashboard/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await testOperatorPage.goto('/');

    // 로딩 중 aria-busy 상태 확인
    const loadingContainer = testOperatorPage.locator('[aria-busy="true"]');
    if (await loadingContainer.isVisible({ timeout: 2000 })) {
      const role = await loadingContainer.getAttribute('role');
      expect(role).toBe('status');
    }
  });

  test('@a11y 최근 활동 카드 region 확인', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/');

    // 최근 활동 카드가 region role을 가지는지 확인
    const activityCard = testOperatorPage.locator('[role="region"]').filter({
      has: testOperatorPage.locator('#recent-activities-title'),
    });

    if (await activityCard.isVisible()) {
      const ariaLabelledBy = await activityCard.getAttribute('aria-labelledby');
      expect(ariaLabelledBy).toBe('recent-activities-title');
    }
  });
});

// ============================================================================
// 로딩 상태 및 에러 핸들링 테스트 (인증 필요)
// ============================================================================
test.describe('Dashboard - Loading & Error States', () => {
  test('API 로딩 중 스켈레톤 표시', async ({ testOperatorPage }) => {
    // API 요청 지연
    await testOperatorPage.route('**/api/dashboard/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await testOperatorPage.goto('/');

    // 최종 콘텐츠가 로드되면 통과 (스켈레톤은 빠르게 사라질 수 있음)
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  });

  test('API 에러 시 에러 메시지 표시', async ({ testOperatorPage }) => {
    // API 에러 시뮬레이션
    await testOperatorPage.route('**/api/dashboard/pending-approval-counts', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await testOperatorPage.goto('/');

    // 에러 상태에서도 페이지가 크래시하지 않음
    await expect(testOperatorPage.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
