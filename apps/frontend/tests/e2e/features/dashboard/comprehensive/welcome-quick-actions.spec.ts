/**
 * 대시보드 종합 E2E 테스트 — 시나리오 2, 3: WelcomeHeader + QuickActionBar
 *
 * 시나리오 2: 시간대별 인사말, 사용자 이름 + 역할 배지, 오늘 날짜
 * 시나리오 3: 역할별 QuickAction 버튼 구성 + 클릭 네비게이션
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시나리오 2: WelcomeHeader', () => {
  test('TC-05: 인사말 + 사용자 이름 + 역할 배지 + 날짜 표시', async ({ techManagerPage: page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // 인사말 키워드 중 하나 포함 (시간대에 따라 다름)
    const greetings = [
      '새벽이네요',
      '좋은 아침입니다',
      '점심 식사하셨나요',
      '좋은 오후입니다',
      '좋은 저녁입니다',
      '늦은 시간까지 수고하세요',
    ];
    const headingText = await heading.textContent();
    const hasGreeting = greetings.some((g) => headingText?.includes(g));
    expect(hasGreeting).toBe(true);

    // 사용자 이름 + "님" 접미사
    expect(headingText).toContain('님');

    // 역할 배지 — "현재 역할: 기술책임자"
    const roleBadge = page.locator('[aria-label*="현재 역할"]');
    await expect(roleBadge).toBeVisible();
    await expect(roleBadge).toContainText('기술책임자');

    // 온라인 상태
    await expect(page.getByText('온라인')).toBeVisible();

    // 오늘 날짜 (한국어 형식: YYYY년 M월 D일 요일)
    const today = new Date();
    const yearStr = `${today.getFullYear()}년`;
    await expect(page.locator('time').filter({ hasText: yearStr })).toBeVisible();
  });

  test('TC-06: 역할별 배지 표시 확인', async ({
    testOperatorPage,
    qualityManagerPage,
    siteAdminPage,
  }) => {
    // test_engineer → 시험실무자
    await testOperatorPage.goto('/');
    await expect(
      testOperatorPage.locator('[aria-label*="현재 역할"]').filter({ hasText: '시험실무자' })
    ).toBeVisible({ timeout: 10000 });

    // quality_manager → 품질책임자
    await qualityManagerPage.goto('/');
    await expect(
      qualityManagerPage.locator('[aria-label*="현재 역할"]').filter({ hasText: '품질책임자' })
    ).toBeVisible({ timeout: 10000 });

    // lab_manager → 시험소 관리자
    await siteAdminPage.goto('/');
    await expect(
      siteAdminPage.locator('[aria-label*="현재 역할"]').filter({ hasText: '시험소 관리자' })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('시나리오 3: QuickActionBar — 역할별 버튼 구성', () => {
  test('TC-07: test_engineer — 장비 등록(primary), 반출 신청(primary), 교정 등록, 장비 목록', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '빠른 액션' });
    await expect(nav).toBeVisible({ timeout: 10000 });

    await expect(nav.getByRole('link', { name: '장비 등록' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '반출 신청' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '교정 등록' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '장비 목록' })).toBeVisible();
  });

  test('TC-08: technical_manager — 승인 관리(primary), 장비 목록(primary), 대여/반출 현황, 교정 등록', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '빠른 액션' });
    await expect(nav).toBeVisible({ timeout: 10000 });

    await expect(nav.getByRole('link', { name: '승인 관리' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '장비 목록' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '대여/반출 현황' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '교정 등록' })).toBeVisible();
  });

  test('TC-09: quality_manager — 교정계획서(primary), 승인 관리(primary), 장비 목록, 대여/반출 현황', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '빠른 액션' });
    await expect(nav).toBeVisible({ timeout: 10000 });

    await expect(nav.getByRole('link', { name: '교정계획서' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '승인 관리' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '장비 목록' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '대여/반출 현황' })).toBeVisible();
  });

  test('TC-10: lab_manager — 교정계획서(primary), 승인 관리(primary), 사용자 관리, 장비 목록', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '빠른 액션' });
    await expect(nav).toBeVisible({ timeout: 10000 });

    await expect(nav.getByRole('link', { name: '교정계획서' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '승인 관리' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '사용자 관리' })).toBeVisible();
    await expect(nav.getByRole('link', { name: '장비 목록' })).toBeVisible();
  });

  test('TC-11: QuickAction 버튼 클릭 시 올바른 페이지 이동', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: '빠른 액션' });
    await expect(nav).toBeVisible({ timeout: 10000 });

    // 승인 관리 → /admin/approvals
    await nav.getByRole('link', { name: '승인 관리' }).click();
    await expect(page).toHaveURL(/\/admin\/approvals/);

    // 돌아가서 사용자 관리 → /admin/users
    await page.goto('/');
    await expect(nav).toBeVisible({ timeout: 10000 });
    await nav.getByRole('link', { name: '사용자 관리' }).click();
    await expect(page).toHaveURL(/\/admin\/users/);

    // 돌아가서 장비 목록 → /equipment
    await page.goto('/');
    await expect(nav).toBeVisible({ timeout: 10000 });
    await nav.getByRole('link', { name: '장비 목록' }).click();
    await expect(page).toHaveURL(/\/equipment/);
  });
});
