/**
 * 대시보드 종합 E2E 테스트 — 시나리오 4, 5: AlertBanner + KpiStatusGrid
 *
 * 시나리오 4: AlertBanner severity 판단, 인라인/pill 표시, pill 클릭 네비게이션
 * 시나리오 5: 4개 KPI 카드, Hero 가동률 프로그레스 바, 부적합 빨간 테두리, 카드 클릭 이동
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

// ── AlertBanner 목 데이터 헬퍼 ───────────────────────────────────────────────

function makeAggregateResponse(overrides: {
  calibration_overdue?: number;
  non_conforming?: number;
  overdue_checkouts?: number;
  upcoming_calibrations?: number;
}) {
  const {
    calibration_overdue = 0,
    non_conforming = 0,
    overdue_checkouts = 0,
    upcoming_calibrations = 0,
  } = overrides;
  return {
    data: {
      summary: {
        totalEquipment: 10,
        availableEquipment: 8,
        activeCheckouts: 2,
        upcomingCalibrations: upcoming_calibrations,
      },
      equipmentByTeam: [],
      overdueCalibrations: { items: [], hasMore: false },
      upcomingCalibrations: {
        items: Array.from({ length: upcoming_calibrations }, (_, i) => ({
          id: `cal-${i}`,
          equipmentId: `eq-${i}`,
          equipmentName: `장비 ${i}`,
          dueDate: new Date().toISOString(),
          daysUntilDue: 3,
        })),
        hasMore: false,
      },
      overdueCheckouts: {
        items: Array.from({ length: overdue_checkouts }, (_, i) => ({
          id: `co-${i}`,
          checkoutItemId: `ci-${i}`,
          equipmentId: `eq-${i}`,
          userId: 'u1',
          expectedReturnDate: new Date().toISOString(),
          daysOverdue: 2,
          startDate: new Date().toISOString(),
          status: 'overdue',
        })),
        hasMore: false,
      },
      equipmentStatusStats: {
        calibration_overdue,
        non_conforming,
        available: 8,
        checked_out: 2,
      },
      recentActivities: [],
      upcomingCheckoutReturns: { items: [], hasMore: false },
    },
  };
}

test.describe('시나리오 4: AlertBanner', () => {
  test('TC-12: AlertBanner 렌더링 — 이상 없음 or 조치 필요 표시', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // AlertBanner는 role="status" (이상없음) 또는 role="alert" (조치필요) — 둘 다 aria-label="긴급 조치 요약"
    const allClearBanner = page.locator('[role="status"][aria-label="긴급 조치 요약"]');
    const alertBanner = page.locator('[role="alert"][aria-label="긴급 조치 요약"]');

    const isAllClear = await allClearBanner.isVisible().catch(() => false);
    const isAlert = await alertBanner.isVisible().catch(() => false);

    // 둘 중 하나는 반드시 표시
    expect(isAllClear || isAlert).toBe(true);

    if (isAllClear) {
      await expect(allClearBanner.getByText('조치 필요 항목이 없습니다')).toBeVisible();
    }

    if (isAlert) {
      // 원형 카운트 배지 + 요약 텍스트
      await expect(alertBanner.getByText('즉시 조치가 필요한 항목이 있습니다')).toBeVisible();

      // pill 칩 중 하나 이상 표시 (부적합/교정 초과/반출 초과)
      const pills = alertBanner.locator('a');
      const pillCount = await pills.count();
      expect(pillCount).toBeGreaterThan(0);
    }
  });

  test('TC-13: AlertBanner pill 클릭 시 해당 목록 페이지 이동', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const banner = page.locator('[aria-label="긴급 조치 요약"]');
    await expect(banner).toBeVisible({ timeout: 10000 });

    // alert 상태일 때만 pill 클릭 테스트 (데이터 의존)
    const alertBanner = page.locator('[role="alert"][aria-label="긴급 조치 요약"]');
    const isAlert = await alertBanner.isVisible().catch(() => false);

    if (isAlert) {
      const firstPill = alertBanner.locator('a').first();
      const href = await firstPill.getAttribute('href');
      expect(href).toBeTruthy();

      await firstPill.click();
      // equipment 또는 checkouts 목록 페이지로 이동
      await expect(page).toHaveURL(/\/(equipment|checkouts)/);
    }
  });
});

test.describe('시나리오 4B: AlertBanner — stacked + info 모드 (API 모킹)', () => {
  test('TC-18: totalCount ≥ 10 → stacked 모드(role="region") 렌더', async ({
    siteAdminPage: page,
  }) => {
    // API 응답을 가로채 calibration_overdue=6, non_conforming=5 주입 → totalCount=11
    await page.route('**/api/dashboard/aggregate**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeAggregateResponse({ calibration_overdue: 6, non_conforming: 5 })),
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // stacked 모드: role="region" + aria-label
    const stackedBanner = page.locator('[role="region"][aria-label="긴급 조치 요약"]');
    await expect(stackedBanner).toBeVisible({ timeout: 5000 });

    // critical + warning row 둘 다 존재
    await expect(stackedBanner.getByText(/즉시 조치|치명적/i).first()).toBeVisible();
  });

  test('TC-19: overdue=0, upcoming>0 → info severity(role="status") 렌더', async ({
    siteAdminPage: page,
  }) => {
    // API 응답: 모든 overdue=0, upcomingCalibrations=5
    await page.route('**/api/dashboard/aggregate**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makeAggregateResponse({
            calibration_overdue: 0,
            non_conforming: 0,
            upcoming_calibrations: 5,
          })
        ),
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // info severity는 role="status" (ARIA polite — 긴급 인터럽트 불필요)
    const infoBanner = page.locator('[role="status"][aria-label="긴급 조치 요약"]');
    await expect(infoBanner).toBeVisible({ timeout: 5000 });
  });
});

test.describe('시나리오 5: KpiStatusGrid', () => {
  test('TC-14: 4개 KPI 카드 렌더링 — Hero 카드 + 가동률 + 반출 중 + 부적합', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/');
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible({ timeout: 10000 });

    // 4개 카드 (모두 Link 요소)
    const cards = kpiSection.locator('a');
    await expect(cards).toHaveCount(4);

    // Hero 카드: "전체 장비" 또는 "내 장비" 또는 "팀 장비"
    await expect(kpiSection.getByText(/전체 장비|내 장비|팀 장비/).first()).toBeVisible();

    // "대" 단위 표시
    await expect(kpiSection.getByText('대').first()).toBeVisible();

    // 가동률 카드
    await expect(kpiSection.getByText('가동률')).toBeVisible();

    // 반출 중 카드
    await expect(kpiSection.getByText('반출 중')).toBeVisible();

    // 부적합 카드
    await expect(kpiSection.getByText('부적합')).toBeVisible();
  });

  test('TC-15: Hero 카드 — 가동률 프로그레스 바 + % 표시', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible({ timeout: 10000 });

    // 프로그레스 바: "N% 가동" 텍스트
    await expect(kpiSection.getByText(/\d+% 가동/)).toBeVisible();

    // 가동률 카드 값: "N%" 형식
    await expect(kpiSection.getByText(/^\d+%$/).first()).toBeVisible();
  });

  test('TC-16: 역할별 KPI Hero 카드 레이블 차이', async ({
    testOperatorPage,
    techManagerPage,
    siteAdminPage,
  }) => {
    // test_engineer → "내 장비"
    await testOperatorPage.goto('/');
    const teKpi = testOperatorPage.locator('section[aria-label="장비 현황 통계"]');
    await expect(teKpi).toBeVisible({ timeout: 10000 });
    await expect(teKpi.getByText('내 장비')).toBeVisible();

    // technical_manager → "팀 장비"
    await techManagerPage.goto('/');
    const tmKpi = techManagerPage.locator('section[aria-label="장비 현황 통계"]');
    await expect(tmKpi).toBeVisible({ timeout: 10000 });
    await expect(tmKpi.getByText('팀 장비')).toBeVisible();

    // lab_manager → "전체 장비"
    await siteAdminPage.goto('/');
    const lmKpi = siteAdminPage.locator('section[aria-label="장비 현황 통계"]');
    await expect(lmKpi).toBeVisible({ timeout: 10000 });
    await expect(lmKpi.getByText('전체 장비')).toBeVisible();
  });

  test('TC-17: KPI 카드 클릭 시 장비 목록 페이지 이동', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const kpiSection = page.locator('section[aria-label="장비 현황 통계"]');
    await expect(kpiSection).toBeVisible({ timeout: 10000 });

    // 첫 번째 카드(Hero) 클릭
    const heroCard = kpiSection.locator('a').first();
    const href = await heroCard.getAttribute('href');
    expect(href).toContain('/equipment');

    await heroCard.click();
    await expect(page).toHaveURL(/\/equipment/);
  });
});
