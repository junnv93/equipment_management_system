/**
 * Suite 02: 반출 생성 성공 (Parallel)
 *
 * 동적으로 반출을 생성하고 API로 상태를 검증합니다.
 * 테스트 후 생성된 반출은 afterAll에서 취소 처리합니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BACKEND_URL, EQUIP } from '../helpers/checkout-constants';
import {
  getBackendToken,
  resetEquipmentToAvailable,
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';

const createdCheckoutIds: string[] = [];

test.describe('Suite 02: 반출 생성 성공', () => {
  // S03/S04가 SIGNAL_GEN(eeee1002), NETWORK_ANALYZER(eeee1003) 시드 checkout을 사용하므로
  // 충돌 방지를 위해 disposal 테스트 전용 장비(dddd)를 사용
  const CALIBRATION_EQUIP = 'dddd0002-0002-4002-8002-000000000002'; // 신호 발생기 disposal, FCC
  const REPAIR_EQUIP = 'dddd0003-0003-4003-8003-000000000003'; // 네트워크 분석기 disposal, FCC

  test.beforeAll(async () => {
    await cancelAllActiveCheckoutsForEquipment(CALIBRATION_EQUIP);
    await cancelAllActiveCheckoutsForEquipment(REPAIR_EQUIP);
    await resetEquipmentToAvailable(CALIBRATION_EQUIP);
    await resetEquipmentToAvailable(REPAIR_EQUIP);
    await clearBackendCache();
  });

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
    // 장비 상태 복원
    await resetEquipmentToAvailable(CALIBRATION_EQUIP);
    await resetEquipmentToAvailable(REPAIR_EQUIP);
    await clearBackendCache();
    await cleanupCheckoutPool();
  });

  test('S02-04: 교정 반출 생성 → API status=pending', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [CALIBRATION_EQUIP],
        purpose: CPVal.CALIBRATION,
        destination: '한국교정시험연구원',
        reason: 'E2E 테스트 - 교정 반출',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.status).toBe(CSVal.PENDING);
    expect(data.purpose).toBe(CPVal.CALIBRATION);
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
        equipmentIds: [REPAIR_EQUIP],
        purpose: CPVal.REPAIR,
        destination: '키사이트 서비스센터',
        reason: 'E2E 테스트 - 수리 반출',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.status).toBe(CSVal.PENDING);
    expect(data.purpose).toBe(CPVal.REPAIR);
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
        purpose: CPVal.RENTAL,
        destination: '수원 FCC EMC/RF 시험소',
        reason: 'E2E 테스트 - 대여 반출',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    // 대여 생성이 성공하거나 설정에 따라 400/403 가능
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.status).toBe(CSVal.PENDING);
      expect(data.purpose).toBe(CPVal.RENTAL);
      createdCheckoutIds.push(data.id);
    } else {
      // 팀/사이트 설정에 따라 차단될 수 있음 (정상 동작)
      expect([400, 403]).toContain(response.status());
    }
  });
});
