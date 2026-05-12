/**
 * SH-2: 승인 철회 5분 윈도우 (RevocationWindowCountdown) e2e
 *
 * UI 컴포넌트 통합 — `CheckoutDetailClient` 안의 `RevocationWindowCountdown`이
 * 승인 후 5분 윈도우 동안 enabled, 만료 후 disabled+tooltip 사유 swap, 사유 dialog
 * 입력 후 revoke API 호출이 backend 정합인지 확인.
 *
 * - `page.clock.install({ time })` + `page.clock.fastForward('05:01')` 으로 5분 + 1초 가속.
 *   실제 5분 대기 회피 — backend `REVOCATION_WINDOW_EXPIRED` 시간 검증은 backend unit spec
 *   (`checkouts.service.spec.ts`) 가 SSOT.
 * - 시나리오:
 *   1. TE 반출 신청 → TM 승인 → TM이 detail 페이지 진입
 *   2. RevocationWindowCountdown 노출 (data-testid="revocation-window")
 *   3. clock.fastForward(0:01) → countdown active 상태에서 사유 dialog open + submit
 *   4. backend approve 다시 → clock.fastForward(5:01) → 버튼 disabled + tooltip 사유 swap
 *
 * @see apps/frontend/components/checkouts/RevocationWindowCountdown.tsx
 * @see apps/frontend/hooks/use-revocation-window.ts
 * @see apps/backend/src/modules/checkouts/checkouts.service.ts — revokeApproval()
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiGet,
  createCheckout,
  approveCheckout,
  resetEquipmentForWorkflow,
  cleanupSharedPool,
  clearBackendCache,
} from '../workflows/helpers/workflow-helpers';
import {
  CheckoutPurposeValues as CPVal,
  CheckoutStatusValues as CSVal,
} from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import {
  APPROVAL_REVOCATION_WINDOW_MS,
  VALIDATION_RULES,
} from '@equipment-management/shared-constants';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.RBAC_SIGNAL_GEN_SUW_E;

test.describe('SH-2: 승인 철회 5분 윈도우 (RevocationWindowCountdown)', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE 반출 신청 → TM 승인 (revocation 윈도우 활성화 준비)', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    const body = await createCheckout(
      tePage,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'SH-2: revocation window 검증'
    );
    const data = body?.data ?? body;
    checkoutId = data.id;
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await approveCheckout(tmPage, checkoutId);
    await clearBackendCache();
  });

  test('Step 2: TM detail 페이지 — RevocationWindowCountdown 노출 (5분 윈도우 active)', async ({
    techManagerPage: page,
  }) => {
    // 결정적 fake clock: 페이지 진입 직전 install — 페이지 내 useEffect setInterval 도 가속 대상
    const baseTime = new Date();
    await page.clock.install({ time: baseTime });

    await page.goto(`/checkouts/${checkoutId}`);

    // approverId === currentUserId 가드를 통과해야 노출됨 (TM이 본인 승인 직후)
    const window_ = page.getByTestId('revocation-window');
    await expect(window_).toBeVisible({ timeout: 15000 });

    // 윈도우 내부 timer (role="timer") 가 존재
    const timer = window_.locator('[role="timer"]');
    await expect(timer).toBeAttached();

    // 1초 가속 — countdown 진행 (만료되지 않음)
    await page.clock.fastForward(1000);
    const button = window_.getByRole('button');
    await expect(button).toBeEnabled();
    await expect(button).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('Step 3: dialog open + 사유 입력 + submit → status PENDING 전환 (deep-test)', async ({
    techManagerPage: page,
  }) => {
    await page.goto(`/checkouts/${checkoutId}`);
    const window_ = page.getByTestId('revocation-window');
    await expect(window_).toBeVisible({ timeout: 15000 });

    // 버튼 클릭 → 사유 dialog open
    await window_.getByRole('button').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // min length(REVOCATION_REASON_MIN_LENGTH) 미만 — submit 비활성
    const textarea = dialog.locator('textarea');
    const submitBtn = dialog.getByRole('button').last();
    await textarea.fill('짧음');
    await expect(submitBtn).toBeDisabled();

    // 충분한 사유 입력 → submit 활성
    const validReason = 'E2E SH-2 revocation deep-test 사유 검증';
    expect(validReason.length).toBeGreaterThanOrEqual(
      VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH
    );
    await textarea.fill(validReason);
    await expect(submitBtn).toBeEnabled();

    // submit → backend POST /revoke-approval → status PENDING 전환
    await submitBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // backend 정합 확인 — 응답으로 status 검증
    const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, 'technical_manager');
    expect(detailResp.ok()).toBeTruthy();
    const body = (await detailResp.json()) as {
      data?: { status?: string };
      status?: string;
    };
    const status = body.data?.status ?? body.status;
    expect(status).toBe(CSVal.PENDING);
  });

  test('Step 4: 5분 + 1초 가속 → 버튼 disabled + aria-disabled=true (사유 swap)', async ({
    techManagerPage: page,
    testOperatorPage: tePage,
  }) => {
    // 직전 step에서 status가 PENDING으로 되돌아갔으므로 새 시나리오 준비 — 재승인
    const body = await createCheckout(
      tePage,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'SH-2 step4 만료 검증'
    );
    const data = body?.data ?? body;
    const newCheckoutId = data.id;
    await clearBackendCache();
    await approveCheckout(page, newCheckoutId);
    await clearBackendCache();

    const baseTime = new Date();
    await page.clock.install({ time: baseTime });

    await page.goto(`/checkouts/${newCheckoutId}`);
    const window_ = page.getByTestId('revocation-window');
    await expect(window_).toBeVisible({ timeout: 15000 });

    // 5분 윈도우 + 1초 가속 — 만료 transition
    await page.clock.fastForward(APPROVAL_REVOCATION_WINDOW_MS + 1000);

    const button = window_.getByRole('button');
    // aria-disabled / disabled 둘 다 만료 swap 후 true
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
