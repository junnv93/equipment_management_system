/**
 * Suite Next-Step: NextStepPanel FSM 렌더링 검증 (Read-Only, Parallel)
 *
 * 검증 대상:
 * - `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true` 환경에서 NextStepPanel 렌더 확인
 * - FSM 상태별 data-next-action / data-urgency / data-testid 속성 정합성
 * - 역할별 panel 가시성 및 버튼 활성/비활성 상태
 * - terminal 상태에서 role="status", 액션 버튼 미표시
 *
 * Mode: parallel (상태 변경 없음, 기존 시드 조회만)
 *
 * 사이트: Suwon (모든 픽스처가 Suwon 소속)
 *
 * Feature Flag 의존:
 *   NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 일 때만 실행 (미설정 시 skip)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CHECKOUT_001_ID, // Suwon, pending, calibration
  CHECKOUT_009_ID, // Suwon, approved, calibration
  CHECKOUT_019_ID, // Suwon, checked_out, calibration
  CHECKOUT_027_ID, // Suwon, lender_checked, rental
  CHECKOUT_042_ID, // Suwon, returned, calibration
  CHECKOUT_050_ID, // Suwon, return_approved, calibration
  CHECKOUT_059_ID, // Suwon, overdue, calibration
} from '../../../shared/constants/test-checkout-ids';

/** 플래그 미설정 환경에서 전체 스위트 skip */
const FLAG_ENABLED = process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true';

/** NextStepPanel 활성 영역 선택자 (terminal 아닌 상태) */
const panelRegion = (page: import('@playwright/test').Page) =>
  page.locator('section[role="region"][data-checkout-id]');

/** NextStepPanel terminal 영역 선택자 */
const panelStatus = (page: import('@playwright/test').Page) =>
  page.locator('section[role="status"][data-checkout-id]');

test.describe('Suite Next-Step: NextStepPanel FSM 렌더링', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!FLAG_ENABLED) {
      testInfo.skip(true, 'NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 플래그 미활성 — 스킵');
    }
  });

  // ── S1: pending → approver (기술책임자 — 버튼 활성) ─────────────────────
  test('S1: pending/calibration — 승인자(기술책임자)에게 approve 액션 표시', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-next-action', 'approve');
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_001_ID);

    // 액션 버튼 활성 확인
    const btn = panel.getByTestId('next-step-action');
    await expect(btn).toBeVisible();
    await expect(btn).not.toHaveAttribute('disabled');
    await expect(btn).not.toHaveAttribute('aria-disabled', 'true');
  });

  // ── S2: pending → requester (일반 사용자 — 버튼 비활성) ─────────────────
  test('S2: pending/calibration — 시험실무자(비승인자)는 버튼 비활성', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/checkouts/${CHECKOUT_001_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    // 패널은 표시되어야 하지만 nextAction은 동일 (approve)
    await expect(panel).toHaveAttribute('data-next-action', 'approve');

    // 시험실무자는 승인 권한 없음 → 버튼 disabled
    const btn = panel.getByTestId('next-step-action');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  // ── S3: approved → logistics (기술책임자 — start 액션) ──────────────────
  test('S3: approved/calibration — start 액션 표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${CHECKOUT_009_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-next-action', 'start');
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_009_ID);

    const btn = panel.getByTestId('next-step-action');
    await expect(btn).toBeVisible();
  });

  // ── S4: checked_out → 반입 (기술책임자 — submit_return 액션) ────────────
  test('S4: checked_out/calibration — submit_return 액션 표시', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${CHECKOUT_019_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-next-action', 'submit_return');
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_019_ID);
  });

  // ── S5: overdue — critical urgency, aria-live=assertive ─────────────────
  test('S5: overdue/calibration — data-urgency=critical + aria-live=assertive', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${CHECKOUT_059_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-urgency', 'critical');
    await expect(panel).toHaveAttribute('aria-live', 'assertive');
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_059_ID);
  });

  // ── S6: lender_checked (rental) — borrower_receive 액션 ─────────────────
  test('S6: lender_checked/rental — borrower_receive 액션 표시', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${CHECKOUT_027_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-next-action', 'borrower_receive');
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_027_ID);

    const btn = panel.getByTestId('next-step-action');
    await expect(btn).toBeVisible();
  });

  // ── S7: returned → approve_return (기술책임자) ───────────────────────────
  test('S7: returned/calibration — approve_return 액션 표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${CHECKOUT_042_ID}`);
    await page.waitForLoadState('networkidle');

    const panel = panelRegion(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-next-action', 'approve_return');
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_042_ID);
  });

  // ── S8: terminal (return_approved) — role=status, 액션 버튼 없음 ─────────
  test('S8: return_approved/calibration — terminal 패널, 액션 버튼 없음', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${CHECKOUT_050_ID}`);
    await page.waitForLoadState('networkidle');

    // terminal 패널은 role="status"
    const panel = panelStatus(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_050_ID);
    await expect(panel).toHaveAttribute('data-urgency', 'normal');
    await expect(panel).toHaveAttribute('data-next-action', 'none');

    // 액션 버튼은 존재하지 않아야 함
    await expect(page.getByTestId('next-step-action')).not.toBeVisible();

    // role="region" 패널도 없어야 함
    await expect(panelRegion(page)).not.toBeVisible();
  });
});
