/**
 * Suite Next-Step: NextStepPanel FSM 렌더링 검증 (Serial)
 *
 * 검증 대상:
 * - `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true` 환경에서 NextStepPanel 렌더 확인
 * - FSM 상태별 data-next-action / data-urgency / data-testid 속성 정합성
 * - 역할별 panel 가시성 및 버튼 활성/비활성 상태
 * - terminal 상태에서 role="status", 액션 버튼 미표시
 *
 * Mode: serial (beforeAll 브라우저 감지에 serial 필요)
 *
 * 사이트: Suwon (모든 픽스처가 Suwon 소속)
 *
 * Feature Flag 감지 방식:
 *   process.env는 테스트 러너(Node.js) 환경 변수로, Next.js 빌드 타임에 번들된
 *   NEXT_PUBLIC_* 값을 반영하지 않는다.
 *   beforeAll에서 실제 브라우저로 페이지를 방문해 DOM에 section[data-checkout-id]가
 *   존재하는지 확인하는 방식으로 플래그 활성 여부를 판단한다.
 */

import path from 'path';
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

/** NextStepPanel 활성 영역 선택자 (terminal 아닌 상태) */
const panelRegion = (page: import('@playwright/test').Page) =>
  page.locator('section[role="region"][data-checkout-id]');

/** NextStepPanel terminal 영역 선택자 */
const panelStatus = (page: import('@playwright/test').Page) =>
  page.locator('section[role="status"][data-checkout-id]');

test.describe.configure({ mode: 'serial' });

test.describe('Suite Next-Step: NextStepPanel FSM 렌더링', () => {
  let flagEnabled = false;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(__dirname, '../../../.auth/technical-manager.json'),
    });
    const probe = await context.newPage();
    await probe.goto(`/checkouts/${CHECKOUT_050_ID}`);
    await probe.waitForLoadState('networkidle');
    flagEnabled = await probe.locator('section[data-checkout-id]').isVisible();
    await context.close();
  });

  test.beforeEach(async ({}, testInfo) => {
    if (!flagEnabled) {
      testInfo.skip(
        true,
        'NextStepPanel 미렌더 — NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 플래그 비활성'
      );
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
    await expect(panel).toHaveAttribute('data-next-action', 'approve');

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

    const panel = panelStatus(page);
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_050_ID);
    await expect(panel).toHaveAttribute('data-urgency', 'normal');
    await expect(panel).toHaveAttribute('data-next-action', 'none');

    await expect(page.getByTestId('next-step-action')).not.toBeVisible();
    await expect(panelRegion(page)).not.toBeVisible();
  });
});
