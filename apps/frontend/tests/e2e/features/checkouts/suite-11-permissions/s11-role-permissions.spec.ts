/**
 * Suite 11: 역할 기반 권한 검증 (Parallel)
 *
 * 각 역할별 허용/차단되는 API 호출을 검증합니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import { BACKEND_URL, SUITE_03, USERS } from '../helpers/checkout-constants';
import { getBackendToken, apiGet } from '../helpers/checkout-helpers';

test.describe('Suite 11: 역할 기반 권한 검증', () => {
  test('S11-01: test_engineer 승인 불가 (API 403)', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    // pending 상태 checkout에 대해 승인 시도
    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_03.CALIBRATION}/approve`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {},
      }
    );

    // test_engineer는 APPROVE_CHECKOUT 권한 없음 → 403
    expect(response.status()).toBe(403);
  });

  test('S11-02: approverId 서버사이드 추출 (fake ID 무시)', async ({ techManagerPage: page }) => {
    // 이미 승인된 checkout의 approverId 확인
    // Suite 03에서 승인된 데이터가 있다면 검증
    const token = await getBackendToken(page, 'technical_manager');

    // fake approverId를 body에 넣어 승인 시도
    // 서버는 body의 approverId를 무시하고 세션에서 추출해야 함
    // (이 테스트는 이미 approved 된 데이터가 아닌 새 pending을 사용해야 하므로 API 프로빙)
    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_03.CALIBRATION}/approve`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          approverId: 'fake-0000-0000-0000-000000000099', // fake ID
        },
      }
    );

    // 이미 approved 상태면 400 (다시 승인 불가)
    // pending 상태면 200이지만 approverId는 세션에서 추출
    if (response.ok()) {
      const data = await response.json();
      // fake ID가 아닌 실제 세션 ID가 적용되어야 함
      expect(data.approverId).toBe(USERS.TECHNICAL_MANAGER_SUWON);
      expect(data.approverId).not.toBe('fake-0000-0000-0000-000000000099');
    } else {
      // 이미 approved 상태 → 400 (정상)
      expect(response.status()).toBe(400);
    }
  });

  test('S11-03: test_engineer 반려 불가 (API 403)', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${SUITE_03.CALIBRATION}/reject`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { reason: 'test engineer should not reject' },
      }
    );

    expect(response.status()).toBe(403);
  });

  test('S11-04: lab_manager 자가 승인 가능 (requesterId=approverId)', async ({
    siteAdminPage: page,
  }) => {
    const token = await getBackendToken(page, 'lab_manager');

    // lab_manager가 직접 반출 생성 후 자가 승인
    // lab_manager는 CREATE_CHECKOUT + APPROVE_CHECKOUT 모두 보유
    const createResponse = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: ['eeee3001-0001-4001-8001-000000000001'], // SAR_PROBE_SUW_S
        purpose: CPVal.CALIBRATION,
        destination: '교정기관',
        reason: 'E2E lab_manager 자가 승인 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    if (createResponse.status() === 201) {
      const createData = await createResponse.json();
      const selfCheckoutId = createData.id;
      expect(createData.requesterId).toBe(USERS.LAB_MANAGER_SUWON);

      // 자가 승인
      const approveResponse = await page.request.patch(
        `${BACKEND_URL}/api/checkouts/${selfCheckoutId}/approve`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: {},
        }
      );

      expect(approveResponse.ok()).toBeTruthy();
      const approveData = await approveResponse.json();
      expect(approveData.status).toBe(CSVal.APPROVED);
      // lab_manager의 userId가 approverId
      expect(approveData.approverId).toBe(USERS.LAB_MANAGER_SUWON);

      // 취소 (정리)
      await page.request.patch(`${BACKEND_URL}/api/checkouts/${selfCheckoutId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });
});
