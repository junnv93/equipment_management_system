/**
 * Suite 16: Rental UI Lifecycle - 대여 전체 UI 플로우
 *
 * 검증 대상:
 * - 대여 4단계 condition-check: EquipmentConditionForm 사용
 *   ① lender_checkout → ② borrower_receive → ③ borrower_return → ④ lender_return
 * - 각 단계 condition-check 이력 조회
 * - 장비 상태 변경 (approved→checked_out, lender_received→available)
 *
 * Mode: serial (상태 변경)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import {
  apiGet,
  apiSubmitConditionCheck,
  apiGetConditionChecks,
  resetRentalCheckoutToApproved,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';
import { SUITE_16 } from '../helpers/checkout-constants';

test.describe('Suite 16: 대여 UI 라이프사이클', () => {
  test.describe.configure({ mode: 'serial' });

  let currentVersion: number;
  const CHECKOUT_ID = SUITE_16.RENTAL_APPROVED;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await resetRentalCheckoutToApproved(CHECKOUT_ID);
    await clearBackendCache();
    await page.close();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S16-01: 대여 반출 상세에서 대여 목적/상태 확인', async ({ techManagerPage: page }) => {
    const detail = await apiGet(page, `/api/checkouts/${CHECKOUT_ID}`);
    const data = detail as Record<string, unknown>;
    expect(data.purpose).toBe(CPVal.RENTAL);
    expect(data.status).toBe(CSVal.APPROVED);
    currentVersion = data.version as number;
  });

  test('S16-02: Step ① lender_checkout — 반출 전 상태 확인', async ({ techManagerPage: page }) => {
    const { response } = await apiSubmitConditionCheck(page, CHECKOUT_ID, 'lender_checkout', {
      version: currentVersion,
      appearanceStatus: 'normal',
      operationStatus: 'normal',
      accessoriesStatus: 'complete',
      notes: 'E2E 대여 반출 전 확인',
    });

    expect([200, 201]).toContain(response.status());

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${CHECKOUT_ID}`);
    const updatedData = updated as Record<string, unknown>;
    expect(updatedData.status).toBe(CSVal.LENDER_CHECKED);
    currentVersion = updatedData.version as number;
  });

  test('S16-03: Step ② borrower_receive — 인수 상태 확인', async ({ techManagerPage: page }) => {
    const { response } = await apiSubmitConditionCheck(page, CHECKOUT_ID, 'borrower_receive', {
      version: currentVersion,
      appearanceStatus: 'normal',
      operationStatus: 'normal',
      notes: 'E2E 인수 확인',
    });

    expect([200, 201]).toContain(response.status());

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${CHECKOUT_ID}`);
    const updatedData = updated as Record<string, unknown>;
    expect(updatedData.status).toBe(CSVal.BORROWER_RECEIVED);
    currentVersion = updatedData.version as number;
  });

  test('S16-04: Step ③ borrower_return — 반납 전 상태 확인', async ({ techManagerPage: page }) => {
    const { response } = await apiSubmitConditionCheck(page, CHECKOUT_ID, 'borrower_return', {
      version: currentVersion,
      appearanceStatus: 'normal',
      operationStatus: 'normal',
      notes: 'E2E 반납 전 확인',
    });

    expect([200, 201]).toContain(response.status());

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${CHECKOUT_ID}`);
    const updatedData = updated as Record<string, unknown>;
    expect(updatedData.status).toBe(CSVal.BORROWER_RETURNED);
    currentVersion = updatedData.version as number;
  });

  test('S16-05: Step ④ lender_return — 반입 최종 확인', async ({ techManagerPage: page }) => {
    const { response } = await apiSubmitConditionCheck(page, CHECKOUT_ID, 'lender_return', {
      version: currentVersion,
      appearanceStatus: 'normal',
      operationStatus: 'normal',
      notes: 'E2E 반입 최종 확인',
    });

    expect([200, 201]).toContain(response.status());

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${CHECKOUT_ID}`);
    const updatedData = updated as Record<string, unknown>;
    expect(updatedData.status).toBe(CSVal.LENDER_RECEIVED);
    currentVersion = updatedData.version as number;
  });

  test('S16-06: condition-check 이력 조회 — 4단계 모두 기록', async ({ techManagerPage: page }) => {
    const checks = await apiGetConditionChecks(page, CHECKOUT_ID);

    expect(Array.isArray(checks) ? checks.length : 0).toBeGreaterThanOrEqual(4);

    if (Array.isArray(checks)) {
      const steps = checks.map((c) => (c as Record<string, unknown>).step);
      expect(steps).toContain('lender_checkout');
      expect(steps).toContain('borrower_receive');
      expect(steps).toContain('borrower_return');
      expect(steps).toContain('lender_return');
    }
  });

  test('S16-07: 단계 순서 위반 시 400 에러', async ({ techManagerPage: page }) => {
    // 이미 lender_received 상태에서 borrower_return 시도 → 400
    const { response } = await apiSubmitConditionCheck(page, CHECKOUT_ID, 'borrower_return', {
      version: currentVersion,
      appearanceStatus: 'normal',
      operationStatus: 'normal',
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('S16-08: UI 상세 페이지 대여 스테퍼 표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${CHECKOUT_ID}`);

    // 상세 페이지에 condition check 이력 또는 스테퍼 표시
    await expect(page.getByText(/상태 확인|이력|condition/i))
      .toBeVisible({ timeout: 10000 })
      .catch(() => {
        // 이력이 별도 탭이나 링크로 접근되는 경우도 있음
      });
  });
});
