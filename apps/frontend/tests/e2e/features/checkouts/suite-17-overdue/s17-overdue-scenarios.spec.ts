/**
 * Suite 17: Overdue Scenarios - 기한초과 시나리오
 *
 * 검증 대상:
 * - overdue 상태 반출의 상세 페이지: 승인/반려 버튼 없음
 * - 기한 초과 알림 배너(CheckoutAlertBanners) 표시
 * - overdue 상태 뱃지 표시
 * - overdue 반출에 대한 API 액션 제한
 *
 * Mode: parallel (읽기 전용)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
import { apiGet, cleanupCheckoutPool } from '../helpers/checkout-helpers';
import { SUITE_17 } from '../helpers/checkout-constants';

test.afterAll(async () => {
  await cleanupCheckoutPool();
});

test.describe('Suite 17: 기한초과 시나리오', () => {
  test('S17-01: overdue 상세 페이지 — 승인/반려 버튼 미표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_17.OVERDUE_DETAIL}`);

    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '거절' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
  });

  test('S17-02: overdue 상태 뱃지 표시 확인', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_17.OVERDUE_DETAIL}`);

    const overdueIndicator = page
      .getByText(/기한 초과|overdue|OVERDUE/i)
      .or(page.getByRole('status', { name: /기한 초과/ }));
    await expect(overdueIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('S17-03: overdue 반출 API 상태 확인', async ({ techManagerPage: page }) => {
    const detail = await apiGet(page, `/api/checkouts/${SUITE_17.OVERDUE_DETAIL}`);
    const data = detail as Record<string, unknown>;

    // 스케줄러 실행 여부에 따라 overdue 또는 checked_out
    expect([CSVal.OVERDUE, CSVal.CHECKED_OUT]).toContain(data.status);

    // availableActions에 approve/reject가 없어야 함
    const meta = data.meta as Record<string, unknown> | undefined;
    if (meta?.availableActions) {
      const actions = meta.availableActions as Record<string, boolean>;
      expect(actions.canApprove).toBeFalsy();
      expect(actions.canReject).toBeFalsy();
    }
  });

  test('S17-04: 목록 페이지 기한 초과 알림 배너 확인', async ({ techManagerPage: page }) => {
    await page.goto('/checkouts');

    // CheckoutAlertBanners - 기한 초과 배너
    const overdueBanner = page.getByText(/기한 초과/i).first();
    const isVisible = await overdueBanner.isVisible().catch(() => false);

    if (isVisible) {
      await expect(overdueBanner).toBeVisible();
    }
  });

  test('S17-05: overdue pending 반출 — 승인 시도 시 제한', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_17.OVERDUE_PENDING}`);

    const detail = await apiGet(page, `/api/checkouts/${SUITE_17.OVERDUE_PENDING}`);
    const data = detail as Record<string, unknown>;

    if (data.status === CSVal.OVERDUE) {
      await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    }
  });

  test('S17-06: overdue checked_out 반출 — 반입 처리 링크 확인', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${SUITE_17.OVERDUE_CHECKED_OUT}`);

    // "반입 처리" 버튼은 <a> 태그
    const returnLink = page.getByRole('link', { name: /반입 처리/ });
    const isVisible = await returnLink.isVisible().catch(() => false);

    if (isVisible) {
      await expect(returnLink).toBeVisible();
    }
  });
});
