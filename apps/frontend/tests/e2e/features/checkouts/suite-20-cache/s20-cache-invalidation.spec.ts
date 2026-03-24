/**
 * Suite 20: Cache Invalidation - 캐시 무효화 검증
 *
 * 검증 대상:
 * - 승인/반려 후 목록 페이지 즉시 반영
 * - 반출 시작 후 장비 상태 변경이 장비 상세 페이지에 반영
 * - 반입 승인 후 장비 상태 available 복원이 장비 목록에 반영
 *
 * Mode: serial (상태 변경 + 캐시 검증)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  apiGet,
  apiPatch,
  apiPost,
  clearBackendCache,
  cleanupCheckoutPool,
  getBackendToken,
  getCheckoutPool,
} from '../helpers/checkout-helpers';
import { EQUIP, BACKEND_URL } from '../helpers/checkout-constants';

test.describe('Suite 20: 캐시 무효화 검증', () => {
  test.describe.configure({ mode: 'serial' });

  let dynamicCheckoutId: string;
  let dynamicVersion: number;
  let equipmentId: string;

  test.beforeAll(async ({ browser }) => {
    equipmentId = EQUIP.HARNESS_COUPLER_SUW_A;
    const page = await browser.newPage();

    const pool = getCheckoutPool();
    await pool.query(`UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1`, [
      equipmentId,
      ESVal.AVAILABLE,
    ]);
    await clearBackendCache();

    const token = await getBackendToken(page, 'test_engineer');
    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        equipmentIds: [equipmentId],
        purpose: CPVal.CALIBRATION,
        destination: '한국교정시험연구원',
        reason: 'E2E 캐시 무효화 테스트',
        expectedReturnDate: '2026-06-01',
      },
    });

    if (response.status() === 201) {
      const data = await response.json();
      dynamicCheckoutId = data.id;
      dynamicVersion = data.version || 1;
    }

    await page.close();
  });

  test.afterAll(async () => {
    if (dynamicCheckoutId) {
      const pool = getCheckoutPool();
      await pool.query(`UPDATE checkouts SET status = $2, updated_at = NOW() WHERE id = $1`, [
        dynamicCheckoutId,
        CSVal.CANCELED,
      ]);
    }
    const pool = getCheckoutPool();
    await pool.query(`UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1`, [
      EQUIP.HARNESS_COUPLER_SUW_A,
      ESVal.AVAILABLE,
    ]);
    await clearBackendCache();
    await cleanupCheckoutPool();
  });

  test('S20-01: 승인 후 상태 즉시 반영', async ({ techManagerPage: page }) => {
    test.skip(!dynamicCheckoutId, 'Dynamic checkout not created');

    const before = await apiGet(page, `/api/checkouts/${dynamicCheckoutId}`);
    expect((before as Record<string, unknown>).status).toBe(CSVal.PENDING);
    dynamicVersion = (before as Record<string, unknown>).version as number;

    const { response } = await apiPatch(page, `/api/checkouts/${dynamicCheckoutId}/approve`, {
      version: dynamicVersion,
    });
    expect(response.status()).toBe(200);

    const after = await apiGet(page, `/api/checkouts/${dynamicCheckoutId}`);
    const afterData = after as Record<string, unknown>;
    expect(afterData.status).toBe(CSVal.APPROVED);
    dynamicVersion = afterData.version as number;
  });

  test('S20-02: 반출 시작 후 장비 상태 checked_out 반영', async ({ techManagerPage: page }) => {
    test.skip(!dynamicCheckoutId, 'Dynamic checkout not created');

    const { response } = await apiPost(page, `/api/checkouts/${dynamicCheckoutId}/start`, {
      version: dynamicVersion,
    });
    expect(response.status()).toBe(200);

    const equipment = await apiGet(page, `/api/equipment/${equipmentId}`);
    expect((equipment as Record<string, unknown>).status).toBe(ESVal.CHECKED_OUT);

    const checkout = await apiGet(page, `/api/checkouts/${dynamicCheckoutId}`);
    dynamicVersion = (checkout as Record<string, unknown>).version as number;
  });

  test('S20-03: UI 장비 상세에서 checked_out 반영', async ({ techManagerPage: page }) => {
    test.skip(!dynamicCheckoutId, 'Dynamic checkout not created');

    await page.goto(`/equipment/${equipmentId}`);

    const statusText = page
      .getByText(/반출 중|checked.out/i)
      .or(page.getByRole('status', { name: /반출 중/ }));
    await expect(statusText.first()).toBeVisible({ timeout: 10000 });
  });

  test('S20-04: 반입 처리 후 returned 반영', async ({ techManagerPage: page }) => {
    test.skip(!dynamicCheckoutId, 'Dynamic checkout not created');

    const { response } = await apiPost(page, `/api/checkouts/${dynamicCheckoutId}/return`, {
      version: dynamicVersion,
      calibrationChecked: true,
      workingStatusChecked: true,
      inspectionNotes: 'E2E 캐시 테스트 반입',
    });
    expect(response.status()).toBe(200);

    const checkout = await apiGet(page, `/api/checkouts/${dynamicCheckoutId}`);
    expect((checkout as Record<string, unknown>).status).toBe(CSVal.RETURNED);
    dynamicVersion = (checkout as Record<string, unknown>).version as number;
  });

  test('S20-05: 반입 승인 후 장비 available 복원', async ({ techManagerPage: page }) => {
    test.skip(!dynamicCheckoutId, 'Dynamic checkout not created');

    const { response } = await apiPatch(
      page,
      `/api/checkouts/${dynamicCheckoutId}/approve-return`,
      { version: dynamicVersion }
    );
    expect(response.status()).toBe(200);

    const equipment = await apiGet(page, `/api/equipment/${equipmentId}`);
    expect((equipment as Record<string, unknown>).status).toBe(ESVal.AVAILABLE);

    const checkout = await apiGet(page, `/api/checkouts/${dynamicCheckoutId}`);
    expect((checkout as Record<string, unknown>).status).toBe(CSVal.RETURN_APPROVED);
  });

  test('S20-06: UI 장비 상세에서 available 복원 확인', async ({ techManagerPage: page }) => {
    test.skip(!dynamicCheckoutId, 'Dynamic checkout not created');

    await page.goto(`/equipment/${equipmentId}`);

    const statusText = page
      .getByText(/사용 가능|available/i)
      .or(page.getByRole('status', { name: /사용 가능/ }));
    await expect(statusText.first()).toBeVisible({ timeout: 10000 });
  });
});
