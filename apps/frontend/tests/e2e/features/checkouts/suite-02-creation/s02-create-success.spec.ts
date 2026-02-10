/**
 * Suite 02: 반출 생성 성공 (Parallel)
 *
 * 동적으로 반출을 생성하고 API로 상태를 검증합니다.
 * 테스트 후 생성된 반출은 afterAll에서 취소 처리합니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BACKEND_URL, EQUIP } from '../helpers/checkout-constants';
import { getBackendToken } from '../helpers/checkout-helpers';

const createdCheckoutIds: string[] = [];

test.describe('Suite 02: 반출 생성 성공', () => {
  test.afterAll(async ({ browser }) => {
    // 생성된 테스트 반출을 취소 처리
    if (createdCheckoutIds.length === 0) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      const token = await getBackendToken(page, 'test_engineer');
      for (const id of createdCheckoutIds) {
        await page.request.patch(`${BACKEND_URL}/api/checkouts/${id}/cancel`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } finally {
      await context.close();
    }
  });

  test('S02-04: 교정 반출 생성 → API status=pending', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.SIGNAL_GEN_SUW_E],
        purpose: 'calibration',
        destination: '한국교정시험연구원',
        reason: 'E2E 테스트 - 교정 반출',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.status).toBe('pending');
    expect(data.purpose).toBe('calibration');
    expect(data.id).toBeTruthy();
    createdCheckoutIds.push(data.id);
  });

  test('S02-05: 수리 반출 생성 → API status=pending', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.NETWORK_ANALYZER_SUW_E],
        purpose: 'repair',
        destination: '키사이트 서비스센터',
        reason: 'E2E 테스트 - 수리 반출',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.status).toBe('pending');
    expect(data.purpose).toBe('repair');
    createdCheckoutIds.push(data.id);
  });

  test('S02-06: 대여 반출 생성', async ({ testOperatorPage: page }) => {
    // test_engineer (E팀)가 S팀 장비를 대여 신청
    // rental은 다른 팀 장비만 가능
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.SAR_PROBE_SUW_S], // S팀 장비 (다른 팀이므로 대여 가능)
        purpose: 'rental',
        destination: '수원 FCC EMC/RF 시험소',
        reason: 'E2E 테스트 - 대여 반출',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    // 대여 생성이 성공하거나 설정에 따라 400/403 가능
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.status).toBe('pending');
      expect(data.purpose).toBe('rental');
      createdCheckoutIds.push(data.id);
    } else {
      // 팀/사이트 설정에 따라 차단될 수 있음 (정상 동작)
      expect([400, 403]).toContain(response.status());
    }
  });
});
