/**
 * Suite 09: 반출 취소 (Serial)
 *
 * pending → canceled, approved 이후 취소 불가 검증
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import { BACKEND_URL, EQUIP } from '../helpers/checkout-constants';
import {
  getBackendToken,
  cleanupCheckoutPool,
  resetEquipmentToAvailable,
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  apiCancelCheckout,
} from '../helpers/checkout-helpers';

test.describe('Suite 09: 반출 취소', () => {
  test.describe.configure({ mode: 'serial' });

  let pendingCheckoutId: string;
  let approvedCheckoutId: string;

  // S03/S04가 NETWORK_ANALYZER(eeee1003) 시드 checkout을 사용하므로 충돌 방지를 위해 disposal 전용 장비 사용
  const CANCEL_EQUIP = 'dddd0302-0302-4302-8302-000000000302'; // [Disposal D2] FCC EMC/RF, available

  test.beforeAll(async () => {
    await cancelAllActiveCheckoutsForEquipment(CANCEL_EQUIP);
    await resetEquipmentToAvailable(CANCEL_EQUIP);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    // S09-02에서 생성된 approved 반출 정리 (취소 불가 검증 후 DB에 남아있는 항목)
    await cancelAllActiveCheckoutsForEquipment(EQUIP.NETWORK_ANALYZER_SUW_E);
    await resetEquipmentToAvailable(EQUIP.NETWORK_ANALYZER_SUW_E);
    await cleanupCheckoutPool();
  });

  test('S09-01: pending 반출 취소 → status=canceled', async ({ techManagerPage: page }) => {
    // 먼저 반출 생성 (test_engineer로)
    const engineerToken = await getBackendToken(page, 'test_engineer');

    const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${engineerToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.NETWORK_ANALYZER_SUW_E],
        purpose: CPVal.CALIBRATION,
        destination: '교정 기관',
        reason: 'E2E 취소 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    pendingCheckoutId = createData.id;
    expect(createData.status).toBe(CSVal.PENDING);

    // 취소 (CAS-aware: 자동 version 조회)
    const { response: cancelResponse } = await apiCancelCheckout(page, pendingCheckoutId);
    expect(cancelResponse.ok()).toBeTruthy();
    const cancelData = await cancelResponse.json();
    expect(cancelData.status).toBe(CSVal.CANCELED);
  });

  test('S09-02: approved 이후 취소 불가 (API 400)', async ({ testOperatorPage: page }) => {
    // 반출 생성
    const engineerToken = await getBackendToken(page, 'test_engineer');

    const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${engineerToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.NETWORK_ANALYZER_SUW_E],
        purpose: CPVal.REPAIR,
        destination: '서비스센터',
        reason: 'E2E 취소 불가 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(createResponse.status()).toBe(201);
    approvedCheckoutId = (await createResponse.json()).id;

    // 승인 (CAS: version 필드 필수)
    const managerToken = await getBackendToken(page, 'technical_manager');
    const getResponse = await page.request.get(
      `${BACKEND_URL}/api/checkouts/${approvedCheckoutId}`,
      { headers: { Authorization: `Bearer ${managerToken}` } }
    );
    const { version } = await getResponse.json();

    const approveResponse = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${approvedCheckoutId}/approve`,
      {
        headers: {
          Authorization: `Bearer ${managerToken}`,
          'Content-Type': 'application/json',
        },
        data: { version },
      }
    );
    expect(approveResponse.ok()).toBeTruthy();

    // ★ Clear cache after approve to ensure cancel() reads fresh 'approved' status
    await clearBackendCache();

    // 취소 시도 (CAS-aware: version 포함) → 400 (비즈니스 로직: approved 상태 취소 불가)
    const { response: cancelResponse } = await apiCancelCheckout(
      page,
      approvedCheckoutId,
      'technical_manager'
    );
    expect(cancelResponse.status()).toBe(400);
  });
});
