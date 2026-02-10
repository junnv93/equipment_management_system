/**
 * Suite 09: 반출 취소 (Serial)
 *
 * pending → canceled, approved 이후 취소 불가 검증
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BACKEND_URL, EQUIP } from '../helpers/checkout-constants';
import {
  getBackendToken,
  cleanupCheckoutPool,
  resetEquipmentToAvailable,
  clearBackendCache,
} from '../helpers/checkout-helpers';

test.describe('Suite 09: 반출 취소', () => {
  test.describe.configure({ mode: 'serial' });

  let pendingCheckoutId: string;
  let approvedCheckoutId: string;

  test.beforeAll(async () => {
    // 장비 상태가 스케줄러에 의해 변경되었을 수 있으므로 리셋
    await resetEquipmentToAvailable(EQUIP.NETWORK_ANALYZER_SUW_E);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S09-01: pending 반출 취소 → status=canceled', async ({ testOperatorPage: page }) => {
    // 먼저 반출 생성
    const token = await getBackendToken(page, 'test_engineer');

    const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.NETWORK_ANALYZER_SUW_E],
        purpose: 'calibration',
        destination: '교정 기관',
        reason: 'E2E 취소 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    pendingCheckoutId = createData.id;
    expect(createData.status).toBe('pending');

    // 취소
    const cancelResponse = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${pendingCheckoutId}/cancel`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(cancelResponse.ok()).toBeTruthy();
    const cancelData = await cancelResponse.json();
    expect(cancelData.status).toBe('canceled');
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
        purpose: 'repair',
        destination: '서비스센터',
        reason: 'E2E 취소 불가 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(createResponse.status()).toBe(201);
    approvedCheckoutId = (await createResponse.json()).id;

    // 승인
    const managerToken = await getBackendToken(page, 'technical_manager');
    const approveResponse = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${approvedCheckoutId}/approve`,
      {
        headers: {
          Authorization: `Bearer ${managerToken}`,
          'Content-Type': 'application/json',
        },
        data: {},
      }
    );
    expect(approveResponse.ok()).toBeTruthy();

    // 취소 시도 → 400
    const cancelResponse = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${approvedCheckoutId}/cancel`,
      {
        headers: { Authorization: `Bearer ${engineerToken}` },
      }
    );

    expect(cancelResponse.status()).toBe(400);
  });
});
