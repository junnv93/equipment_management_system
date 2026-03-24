/**
 * Suite 08: 교정 반출 전체 라이프사이클 (Serial) ★P0 CRITICAL
 *
 * 5단계 상태 전이 + 2회 equipment status 변화를 API 레벨에서 검증합니다.
 *
 * Step 1: POST /checkouts (test_engineer) → pending
 * Step 2: PATCH /approve (tech_manager) → approved
 * Step 3: POST /start → checked_out, ★equipment=checked_out
 * Step 4: POST /return {calibrationChecked, workingStatusChecked} → returned
 * Step 5: PATCH /approve-return → return_approved, ★equipment=available
 *
 * ⚠️ 백엔드 캐싱: 매 단계 사이에 clearBackendCache() 호출 필수.
 *    서비스 레이어가 캐시에서 checkout을 읽어 상태 검증하므로,
 *    이전 mutation 결과가 캐시에 반영되지 않으면 "잘못된 상태" 에러 발생.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import { BACKEND_URL, EQUIP, USERS } from '../helpers/checkout-constants';
import {
  getBackendToken,
  cleanupCheckoutPool,
  resetEquipmentToAvailable,
  resetEquipmentForNewCheckout,
  clearBackendCache,
} from '../helpers/checkout-helpers';

test.describe('Suite 08: 교정 반출 전체 라이프사이클', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  const testEquipmentId = EQUIP.SPECTRUM_ANALYZER_SUW_E;

  test.beforeAll(async () => {
    await resetEquipmentForNewCheckout(testEquipmentId);

    // 교정일을 미래로 설정 (overdue 스케줄러 방지)
    const pool = require('../helpers/checkout-helpers').getCheckoutPool();
    await pool.query(
      `UPDATE equipment SET next_calibration_date = NOW() + INTERVAL '365 days' WHERE id = $1`,
      [testEquipmentId]
    );

    await clearBackendCache();
  });

  test.afterAll(async () => {
    // 장비 복원 (테스트 실패 시에도)
    await resetEquipmentToAvailable(testEquipmentId);
    await cleanupCheckoutPool();
  });

  test('S08-01: Step 1 - 교정 반출 신청 → pending', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [testEquipmentId],
        purpose: CPVal.CALIBRATION,
        destination: 'KRISS 한국표준과학연구원',
        reason: 'E2E 전체 라이프사이클 테스트 - 정기 교정',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    checkoutId = data.id;
    expect(data.status).toBe(CSVal.PENDING);
    expect(data.purpose).toBe(CPVal.CALIBRATION);
    expect(data.requesterId).toBeTruthy();
  });

  test('S08-02: Step 2 - 교정 반출 승인 → approved', async ({ techManagerPage: page }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache(); // 이전 단계 캐시 무효화

    const token = await getBackendToken(page, 'technical_manager');

    // CAS: 현재 version 조회 후 approve
    const detail = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { version } = await detail.json();

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/approve`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { version },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe(CSVal.APPROVED);
    expect(data.approverId).toBe(USERS.TECHNICAL_MANAGER_SUWON);
    expect(data.approvedAt).toBeTruthy();
  });

  test('S08-03: Step 3 - 반출 시작 → checked_out + ★equipment=checked_out', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache(); // approve 결과 반영

    const token = await getBackendToken(page, 'technical_manager');

    // ✅ Fetch current version for optimistic locking
    const getResponse = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const currentCheckout = await getResponse.json();
    const currentVersion = currentCheckout.version;

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/start`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { version: currentVersion },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe(CSVal.CHECKED_OUT);
    expect(data.checkoutDate).toBeTruthy();

    // ★ 장비 상태 검증: checked_out
    await clearBackendCache();
    const equipResponse = await page.request.get(
      `${BACKEND_URL}/api/equipment/${testEquipmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const equipData = await equipResponse.json();
    expect(equipData.status).toBe(ESVal.CHECKED_OUT);
  });

  test('S08-04: Step 4 - 반입 처리 → returned (교정 확인)', async ({ techManagerPage: page }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache(); // start 결과 반영

    const token = await getBackendToken(page, 'technical_manager');

    // ★ 사전 검증: checkout이 checked_out 상태인지 확인
    const beforeReturnResponse = await page.request.get(
      `${BACKEND_URL}/api/checkouts/${checkoutId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    expect(beforeReturnResponse.ok()).toBeTruthy();
    const beforeReturn = await beforeReturnResponse.json();
    expect(beforeReturn.status).toBe(CSVal.CHECKED_OUT); // ← 여기서 실패하면 Step 3 문제

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts/${checkoutId}/return`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        version: beforeReturn.version,
        calibrationChecked: true,
        workingStatusChecked: true,
        inspectionNotes: '교정 완료 - 성적서 발행 확인, 정상 작동',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe(CSVal.RETURNED);
    expect(data.calibrationChecked).toBe(true);
    expect(data.workingStatusChecked).toBe(true);
    expect(data.actualReturnDate).toBeTruthy();
    expect(data.returnerId).toBeTruthy();

    // ★ Equipment status는 아직 checked_out (반입 승인 전까지 유지)
    const equipCheckResponse = await page.request.get(
      `${BACKEND_URL}/api/equipment/${testEquipmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const equipCheck = await equipCheckResponse.json();
    expect(equipCheck.status).toBe(ESVal.CHECKED_OUT); // 반입 승인 전까지는 checked_out
  });

  test('S08-05: Step 5 - 반입 최종 승인 → return_approved + ★equipment=available', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache(); // return 결과 반영

    const token = await getBackendToken(page, 'technical_manager');

    // ★ 사전 검증: checkout이 returned 상태인지 확인
    const beforeApproveResponse = await page.request.get(
      `${BACKEND_URL}/api/checkouts/${checkoutId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    expect(beforeApproveResponse.ok()).toBeTruthy();
    const beforeApprove = await beforeApproveResponse.json();
    console.log('Step 5 pre-check - checkout status:', beforeApprove.status);
    expect(beforeApprove.status).toBe(CSVal.RETURNED); // ← 여기서 실패하면 Step 4 문제

    const response = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/approve-return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { version: beforeApprove.version },
      }
    );

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error('approve-return failed:', response.status(), errorBody);
    }
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe(CSVal.RETURN_APPROVED);
    expect(data.returnApprovedBy).toBeTruthy();
    expect(data.returnApprovedAt).toBeTruthy();

    // ★ 장비 상태 검증: available로 복원
    await clearBackendCache();
    const equipResponse = await page.request.get(
      `${BACKEND_URL}/api/equipment/${testEquipmentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const equipData = await equipResponse.json();
    expect(equipData.status).toBe(ESVal.AVAILABLE);
  });
});
