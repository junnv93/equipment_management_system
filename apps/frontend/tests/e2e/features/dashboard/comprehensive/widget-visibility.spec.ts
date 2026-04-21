/**
 * 대시보드 종합 E2E 테스트 — 시나리오 1: 역할별 위젯 가시성
 *
 * DASHBOARD_ROLE_CONFIG (SSOT) 기반으로 4개 역할의 10개 위젯 표시/미표시를 검증합니다.
 *
 * | 위젯                      | TE | TM | QM | LM |
 * |---------------------------|----|----|----|----|
 * | WelcomeHeader             | O  | O  | O  | O  |
 * | QuickActionBar            | O  | O  | O  | O  |
 * | AlertBanner               | O  | O  | O  | O  |
 * | KpiStatusGrid             | O  | O  | O  | O  |
 * | PendingApprovalCard       | X  | O  | O  | O  |
 * | OverdueCheckoutsCard      | O  | O  | X  | O  |
 * | CalibrationDdayList       | O  | O  | O  | O  |
 * | TeamEquipmentDistribution | X  | O  | X  | O  |
 * | MiniCalendar              | O  | O  | O  | O  |
 * | RecentActivities          | O  | O  | O  | O  |
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시나리오 1: 역할별 위젯 가시성', () => {
  test('TC-01: test_engineer — 승인 대기 카드/팀 분포 미표시', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 공통 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();
    await expect(page.locator('[aria-label="긴급 조치 요약"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.locator('[aria-label="교정 현황 컴팩트 리스트"]')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
    await expect(page.locator('section[aria-label="최근 활동"]')).toBeVisible();

    // OverdueCheckoutsCard 표시
    await expect(page.locator('[aria-label="반출 현황 목록"]')).toBeVisible();

    // PendingApprovalCard 미표시
    await expect(page.getByTestId('pending-approval-card')).not.toBeVisible();

    // TeamEquipmentDistribution 미표시
    await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).not.toBeVisible();
  });

  test('TC-02: technical_manager — 모든 위젯 표시', async ({ techManagerPage: page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 모든 10개 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();
    await expect(page.locator('[aria-label="긴급 조치 요약"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.getByTestId('pending-approval-card')).toBeVisible();
    await expect(page.locator('[aria-label="반출 현황 목록"]')).toBeVisible();
    await expect(page.locator('[aria-label="교정 현황 컴팩트 리스트"]')).toBeVisible();
    await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
    await expect(page.locator('section[aria-label="최근 활동"]')).toBeVisible();
  });

  test('TC-03: quality_manager — 반출 현황/팀 분포 미표시', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 공통 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();
    await expect(page.locator('[aria-label="긴급 조치 요약"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.locator('[aria-label="교정 현황 컴팩트 리스트"]')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
    await expect(page.locator('section[aria-label="최근 활동"]')).toBeVisible();

    // PendingApprovalCard 표시
    await expect(page.getByTestId('pending-approval-card')).toBeVisible();

    // OverdueCheckoutsCard 미표시
    await expect(page.locator('[aria-label="반출 현황 목록"]')).not.toBeVisible();

    // TeamEquipmentDistribution 미표시
    await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).not.toBeVisible();
  });

  test('TC-04: lab_manager — 모든 위젯 표시', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 모든 10개 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();
    await expect(page.locator('[aria-label="긴급 조치 요약"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.getByTestId('pending-approval-card')).toBeVisible();
    await expect(page.locator('[aria-label="반출 현황 목록"]')).toBeVisible();
    await expect(page.locator('[aria-label="교정 현황 컴팩트 리스트"]')).toBeVisible();
    await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
    await expect(page.locator('section[aria-label="최근 활동"]')).toBeVisible();
  });

  test('TC-05: system_admin — SystemHealthCard 표시, 승인 대기 카드 미표시', async ({
    systemAdminPage: page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 공통 위젯 표시
    await expect(page.locator('[aria-label="환영 메시지 및 사용자 정보"]')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '빠른 액션' })).toBeVisible();
    await expect(page.locator('[aria-label="긴급 조치 요약"]')).toBeVisible();
    await expect(page.locator('section[aria-label="장비 현황 통계"]')).toBeVisible();
    await expect(page.locator('[aria-label="교정 현황 컴팩트 리스트"]')).toBeVisible();
    await expect(page.locator('section[aria-label="최근 활동"]')).toBeVisible();

    // SystemHealthCard 표시 (system_admin 전용 사이드바 위젯)
    await expect(page.locator('[aria-label="시스템 상태 요약"]')).toBeVisible();

    // 팀 분포 + 미니 달력 표시
    await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).toBeVisible();
    await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();

    // PendingApprovalCard 미표시 (system_admin 승인 워크플로우 없음)
    await expect(page.getByTestId('pending-approval-card')).not.toBeVisible();
  });
});
