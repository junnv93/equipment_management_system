/**
 * Suite 21: 반출 프로세스 연속성 (Serial) ★P0 CRITICAL
 *
 * "코드가 아닌 사용자 시나리오"에서 출발한 테스트.
 * 개별 상태 전이 테스트(Suite 03~09)가 통과해도 이 테스트들은 별도로 검증해야 함.
 *
 * 검증 시나리오:
 * 1. test_engineer가 신청 후 본인 목록에서 "대기 중"으로 확인 가능한가
 * 2. 반려 후 동일 장비를 재신청 가능한가 (rejected는 ALREADY_ACTIVE를 차단하지 않아야 함)
 * 3. 이미 진행 중인 장비를 UI에서 중복 신청 시 명확한 오류 메시지가 표시되는가
 *
 * 사용 장비: SPECTRUM_ANALYZER_SUW_E (스펙트럼 분석기, SUW-E0001)
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
} from '../helpers/checkout-helpers';

test.describe('Suite 21: 반출 프로세스 연속성', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  let secondCheckoutId: string;
  const testEquipmentId = EQUIP.SPECTRUM_ANALYZER_SUW_E;

  test.beforeAll(async () => {
    await cancelAllActiveCheckoutsForEquipment(testEquipmentId);
    await resetEquipmentToAvailable(testEquipmentId);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cancelAllActiveCheckoutsForEquipment(testEquipmentId);
    await resetEquipmentToAvailable(testEquipmentId);
    await cleanupCheckoutPool();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 시나리오 1: 신청 후 본인 목록 확인
  // ──────────────────────────────────────────────────────────────────────────

  test('S21-01: test_engineer가 신청 → 본인 목록에서 "대기 중"으로 즉시 확인 가능', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [testEquipmentId],
        purpose: CPVal.CALIBRATION,
        destination: 'KRISS 한국표준과학연구원 (S21)',
        reason: 'E2E 프로세스 연속성 테스트 - 신청 후 목록 확인',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    checkoutId = data.id;
    expect(data.status).toBe(CSVal.PENDING);

    // 신청 후 목록 페이지에서 즉시 "대기 중"으로 확인 가능해야 함
    await page.goto('/checkouts?status=pending');
    await expect(page.getByText('KRISS 한국표준과학연구원 (S21)', { exact: false })).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 시나리오 2: 반려 후 동일 장비 재신청 가능
  // ──────────────────────────────────────────────────────────────────────────

  test('S21-02: technical_manager가 반려 → test_engineer가 동일 장비 재신청 성공', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    // 기술책임자가 반려 처리
    const token = await getBackendToken(page, 'technical_manager');
    const getResp = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { version } = await getResp.json();

    const rejectResp = await page.request.patch(
      `${BACKEND_URL}/api/checkouts/${checkoutId}/reject`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { version, reason: 'E2E 테스트 반려 - 재신청 가능 여부 확인' },
      }
    );
    expect(rejectResp.ok()).toBeTruthy();
    const rejectBody = await rejectResp.json();
    expect(rejectBody.status).toBe(CSVal.REJECTED);
  });

  test('S21-03: 반려된 장비를 즉시 재신청 → 201 성공 (ALREADY_ACTIVE 차단 안됨)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const token = await getBackendToken(page, 'test_engineer');

    // 반려 후 동일 장비로 새 반출 신청 — blocked되면 안 됨
    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [testEquipmentId],
        purpose: CPVal.CALIBRATION,
        destination: 'KRISS 한국표준과학연구원 (S21 재신청)',
        reason: 'E2E 프로세스 연속성 테스트 - 반려 후 재신청',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    secondCheckoutId = data.id;
    expect(data.status).toBe(CSVal.PENDING);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 시나리오 3: 진행 중인 장비 중복 신청 시 UI 오류 메시지 확인
  // ──────────────────────────────────────────────────────────────────────────

  test('S21-04: 이미 대기 중인 장비를 UI로 중복 신청 → "반출 신청 실패" 토스트', async ({
    testOperatorPage: page,
  }) => {
    expect(secondCheckoutId).toBeTruthy();
    await clearBackendCache();

    // secondCheckoutId (S21-03에서 생성)가 pending 상태 → 동일 장비 중복 신청 시도
    await page.goto('/checkouts/create');
    await expect(page.getByRole('heading', { name: '장비 반출 신청', level: 1 })).toBeVisible();

    // 장비 목록에서 스펙트럼 분석기(여전히 available 상태) 클릭해서 선택
    // data-testid로 테이블 행 특정 (텍스트 직접 클릭 시 다른 링크로 이동할 수 있으므로)
    const equipmentRow = page.locator(`[data-testid="equipment-${testEquipmentId}"]`);
    await expect(equipmentRow).toBeVisible();
    await equipmentRow.click();

    // 필수 필드 입력
    await page.getByLabel('반출 장소').fill('중복 신청 테스트');
    await page.getByLabel('반출 사유').fill('중복 신청 오류 확인용 E2E 테스트');

    // 신청 버튼 클릭 → 백엔드가 CHECKOUT_EQUIPMENT_ALREADY_ACTIVE(400) 반환
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/checkouts') && resp.request().method() === 'POST'
    );
    await page.getByRole('button', { name: '신청' }).click();
    const createResp = await responsePromise;

    expect(createResp.status()).toBe(400);
    const body = await createResp.json();
    expect(body.code).toBe('CHECKOUT_EQUIPMENT_ALREADY_ACTIVE');

    // UI에서 "반출 신청 실패" 토스트가 표시되어야 함
    await expect(page.getByRole('status').filter({ hasText: '반출 신청 실패' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '이미 반출 진행 중' })).toBeVisible();
  });
});
