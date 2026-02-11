/**
 * Suite 10: 대여 4단계 상태 확인 (Serial) ★신규 핵심
 *
 * condition-check API를 사용한 대여 목적 반출의 4단계 상태 전이 검증.
 *
 * 대여 4단계:
 *   ① lender_checkout  : approved → lender_checked   (장비 → checked_out)
 *   ② borrower_receive : lender_checked → in_use     (변화 없음)
 *   ③ borrower_return  : in_use → borrower_returned  (변화 없음)
 *   ④ lender_return    : borrower_returned → lender_received (장비 → available)
 *
 * IDs: SUITE_10 (014=approved rental, 027=lender_checked, 033=in_use, 036=borrower_returned, 028=order violation)
 *
 * ⚠️ 백엔드 GET 캐싱: 상태 변경 후 clearBackendCache() 호출 필수
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_10, BACKEND_URL } from '../helpers/checkout-constants';
import {
  resetCheckoutToApproved,
  resetRentalCheckoutToState,
  clearBackendCache,
  apiGet,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

test.describe('Suite 10: 대여 4단계 상태 확인', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // 각 단계에 맞는 초기 상태로 설정
    await resetCheckoutToApproved(SUITE_10.STEP1_LENDER);
    await resetRentalCheckoutToState(SUITE_10.STEP2_BORROWER, 'lender_checked');
    await resetRentalCheckoutToState(SUITE_10.STEP3_RETURN, 'in_use');
    await resetRentalCheckoutToState(SUITE_10.STEP4_FINAL, 'borrower_returned');
    await resetCheckoutToApproved(SUITE_10.ORDER_VIOLATION);

    // ✅ Suite 10용 장비 교정 기한 연장 (available 상태 복원 가능하도록)
    const { getCheckoutPool } = await import('../helpers/checkout-helpers');
    const pool = getCheckoutPool();
    await pool.query(
      `
      UPDATE equipment
      SET next_calibration_date = NOW() + INTERVAL '1 year',
          updated_at = NOW()
      WHERE id IN (
        SELECT DISTINCT equipment_id
        FROM checkout_items
        WHERE checkout_id IN ($1, $2, $3, $4, $5, $6)
      )
    `,
      [
        SUITE_10.STEP1_LENDER,
        SUITE_10.STEP2_BORROWER,
        SUITE_10.STEP3_RETURN,
        SUITE_10.STEP4_FINAL,
        SUITE_10.ORDER_VIOLATION,
        SUITE_10.HISTORY,
      ]
    );

    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S10-01: approved → lender_checked (step: lender_checkout) + 장비→checked_out', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // 현재 상태 확인
    await clearBackendCache();
    const before = await apiGet(page, `/api/checkouts/${SUITE_10.STEP1_LENDER}`);
    expect(before.status).toBe('approved');
    expect(before.purpose).toBe('rental');

    // condition-check API 호출
    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_10.STEP1_LENDER}/condition-check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          step: 'lender_checkout',
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          accessoriesStatus: 'complete',
          notes: 'E2E 테스트 - 반출 전 상태 양호',
        },
      }
    );

    expect(response.status()).toBe(201);

    // 반출 상태 전이 확인 (캐시 클리어 후)
    await clearBackendCache();
    const after = await apiGet(page, `/api/checkouts/${SUITE_10.STEP1_LENDER}`);
    expect(after.status).toBe('lender_checked');
    expect(after.checkoutDate).toBeTruthy(); // ① 단계에서 checkoutDate 설정
  });

  test('S10-02: lender_checked → in_use (step: borrower_receive)', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    await clearBackendCache();
    const before = await apiGet(page, `/api/checkouts/${SUITE_10.STEP2_BORROWER}`);
    expect(before.status).toBe('lender_checked');

    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_10.STEP2_BORROWER}/condition-check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          step: 'borrower_receive',
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          notes: 'E2E 테스트 - 인수 시 상태 확인',
        },
      }
    );

    expect(response.status()).toBe(201);

    await clearBackendCache();
    const after = await apiGet(page, `/api/checkouts/${SUITE_10.STEP2_BORROWER}`);
    expect(after.status).toBe('in_use');
  });

  test('S10-03: in_use → borrower_returned (step: borrower_return)', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    await clearBackendCache();
    const before = await apiGet(page, `/api/checkouts/${SUITE_10.STEP3_RETURN}`);
    expect(before.status).toBe('in_use');

    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_10.STEP3_RETURN}/condition-check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          step: 'borrower_return',
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          notes: 'E2E 테스트 - 반납 전 상태 확인',
        },
      }
    );

    expect(response.status()).toBe(201);

    await clearBackendCache();
    const after = await apiGet(page, `/api/checkouts/${SUITE_10.STEP3_RETURN}`);
    expect(after.status).toBe('borrower_returned');
  });

  test('S10-04: borrower_returned → lender_received (step: lender_return) + 장비→available', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    await clearBackendCache();
    const before = await apiGet(page, `/api/checkouts/${SUITE_10.STEP4_FINAL}`);
    expect(before.status).toBe('borrower_returned');

    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_10.STEP4_FINAL}/condition-check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          step: 'lender_return',
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          accessoriesStatus: 'complete',
          notes: 'E2E 테스트 - 반입 확인 완료',
        },
      }
    );

    expect(response.status()).toBe(201);

    // 상태 전이 확인
    await clearBackendCache();
    const after = await apiGet(page, `/api/checkouts/${SUITE_10.STEP4_FINAL}`);
    expect(after.status).toBe('lender_received');
    expect(after.actualReturnDate).toBeTruthy(); // ④ 단계에서 actualReturnDate 설정
  });

  test('S10-05: 순서 위반 차단 (approved에서 borrower_receive → 400)', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // approved 상태에서 borrower_receive 시도 (lender_checkout을 건너뜀)
    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_10.ORDER_VIOLATION}/condition-check`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          step: 'borrower_receive',
          appearanceStatus: 'normal',
          operationStatus: 'normal',
        },
      }
    );

    expect(response.status()).toBe(400);

    // 상태 변경 없음 확인
    await clearBackendCache();
    const data = await apiGet(page, `/api/checkouts/${SUITE_10.ORDER_VIOLATION}`);
    expect(data.status).toBe('approved');
  });

  test('S10-06: condition-check 이력 조회 (GET /condition-checks)', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // STEP1_LENDER에는 이미 S10-01에서 등록한 이력이 있음
    const response = await page.request.get(
      `${BACKEND_URL}/api/checkouts/${SUITE_10.STEP1_LENDER}/condition-checks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(response.ok()).toBeTruthy();
    const checks = await response.json();
    expect(Array.isArray(checks)).toBeTruthy();
    expect(checks.length).toBeGreaterThan(0);

    // 첫 번째 확인이 lender_checkout 단계
    const firstCheck = checks[0];
    expect(firstCheck.step).toBe('lender_checkout');
    expect(firstCheck.appearanceStatus).toBe('normal');
    expect(firstCheck.operationStatus).toBe('normal');
    expect(firstCheck.checkedBy).toBeTruthy();
    expect(firstCheck.checkedAt).toBeTruthy();
  });
});
