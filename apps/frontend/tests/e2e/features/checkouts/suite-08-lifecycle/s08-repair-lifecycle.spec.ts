/**
 * Suite 08: 수리 반출 전체 라이프사이클 (Serial) ★P0 CRITICAL
 *
 * 교정과 동일한 5단계이지만 repairChecked 필수
 *
 * ⚠️ 백엔드 캐싱: 매 단계 사이에 clearBackendCache() 호출 필수.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BACKEND_URL, EQUIP, USERS } from '../helpers/checkout-constants';
import {
  getBackendToken,
  cleanupCheckoutPool,
  resetEquipmentToAvailable,
  clearBackendCache,
} from '../helpers/checkout-helpers';

test.describe('Suite 08: 수리 반출 전체 라이프사이클', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  const testEquipmentId = EQUIP.SIGNAL_GEN_SUW_E;

  test.beforeAll(async () => {
    await resetEquipmentToAvailable(testEquipmentId);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await resetEquipmentToAvailable(testEquipmentId);
    await cleanupCheckoutPool();
  });

  test('S08-R01: 수리 반출 신청 → pending', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [testEquipmentId],
        purpose: 'repair',
        destination: '키사이트 서비스센터',
        reason: 'E2E 수리 라이프사이클 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    checkoutId = data.id;
    expect(data.status).toBe('pending');
    expect(data.purpose).toBe('repair');
  });

  test('S08-R02: 수리 반출 승인 → approved', async ({ techManagerPage: page }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/approve`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {},
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('approved');
  });

  test('S08-R03: 수리 반출 시작 → checked_out + equipment=checked_out', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/start`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {},
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('checked_out');

    await clearBackendCache();
    const equipResponse = await page.request.get(
      `${BACKEND_URL}/api/equipment/${testEquipmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const equipData = await equipResponse.json();
    expect(equipData.status).toBe('checked_out');
  });

  test('S08-R04: 수리 반입 처리 → returned (repairChecked 필수)', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    const token = await getBackendToken(page, 'technical_manager');

    // repairChecked 없이 시도 → 400
    const failResponse = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          repairChecked: false,
          workingStatusChecked: true,
        },
      }
    );
    expect(failResponse.status()).toBe(400);

    // 올바르게 반입
    const response = await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/return`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        repairChecked: true,
        workingStatusChecked: true,
        inspectionNotes: '수리 완료 - 부품 교체, 정상 작동 확인',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('returned');
    expect(data.repairChecked).toBe(true);
  });

  test('S08-R05: 수리 반입 최종 승인 → return_approved + equipment=available', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/approve-return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {},
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('return_approved');

    await clearBackendCache();
    const equipResponse = await page.request.get(
      `${BACKEND_URL}/api/equipment/${testEquipmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const equipData = await equipResponse.json();
    expect(equipData.status).toBe('available');
  });
});
