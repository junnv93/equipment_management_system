/**
 * Suite 12: 교정 반출 UI 전체 라이프사이클 (Serial) ★P0 CRITICAL
 *
 * API 레벨 라이프사이클(Suite 08)과 달리, 실제 UI를 통해 전체 플로우를 검증합니다.
 * 역할 전환: test_engineer(신청) → technical_manager(승인/반출/반입승인)
 *
 * 5단계 UI 상태 전이:
 * Step 1: POST /checkouts (API - test_engineer) → pending
 * Step 2: UI "승인" 버튼 클릭 (tech_manager) → approved
 * Step 3: UI "반출 시작" 다이얼로그 (tech_manager) → checked_out
 * Step 4: UI 반입 처리 페이지 (/return) 폼 제출 (tech_manager) → returned
 * Step 5: UI "반입 승인" 다이얼로그 (tech_manager) → return_approved
 *
 * ⚠️ 백엔드 캐싱: 매 단계 사이에 clearBackendCache() 호출 필수.
 * ⚠️ networkidle 사용 금지 — Next.js 개발 서버의 HMR 연결로 인해 타임아웃 발생.
 *    대신 page.goto() + 명시적 요소 대기를 사용.
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
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  apiGet,
} from '../helpers/checkout-helpers';

test.describe('Suite 12: 교정 반출 UI 전체 라이프사이클', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  // NETWORK_ANALYZER_SUW_E: available 상태, FCC EMC/RF 팀 소속 (test_engineer와 같은 팀)
  // Suite 08은 SPECTRUM_ANALYZER/SIGNAL_GEN을 사용하므로 격리됨
  const testEquipmentId = EQUIP.NETWORK_ANALYZER_SUW_E;

  test.beforeAll(async () => {
    const { getCheckoutPool } = require('../helpers/checkout-helpers');
    const pool = getCheckoutPool();

    // 시드 데이터 포함 모든 활성 체크아웃 취소 (CHECKOUT_EQUIPMENT_ALREADY_ACTIVE 검증 통과)
    await cancelAllActiveCheckoutsForEquipment(testEquipmentId);

    // 장비를 available 상태 + 교정일 여유 있게 설정
    await pool.query(
      `UPDATE equipment
       SET status = $2,
           next_calibration_date = NOW() + INTERVAL '365 days',
           updated_at = NOW()
       WHERE id = $1`,
      [testEquipmentId, ESVal.AVAILABLE]
    );

    await clearBackendCache();
  });

  test.afterAll(async () => {
    await resetEquipmentToAvailable(testEquipmentId);
    await cleanupCheckoutPool();
  });

  test('S12-01: test_engineer가 교정 반출 신청 → pending', async ({ testOperatorPage: page }) => {
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
        reason: 'E2E UI 라이프사이클 테스트 - 정기 교정',
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

  test('S12-02: technical_manager가 UI에서 승인 → approved', async ({ techManagerPage: page }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}`);
    await expect(page.getByText('대기 중')).toBeVisible();

    // "승인" 버튼은 다이얼로그 없이 즉시 API 호출 (PATCH /approve)
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/checkouts/${checkoutId}/approve`) &&
        resp.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: '승인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    // PATCH 응답 body 직접 검증
    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe(CSVal.APPROVED);
    expect(responseBody.approverId).toBe(USERS.TECHNICAL_MANAGER_SUWON);

    // UI 확인: "반출 시작" 버튼 표시 (optimistic update)
    await expect(page.getByRole('button', { name: '반출 시작' })).toBeVisible();

    // ★ 목록 캐시 일관성 검증: 승인 후 목록 페이지에서 "승인됨" 상태로 즉시 갱신되어야 함
    // "승인 후에도 목록이 대기 중으로 보임" 버그를 방지하는 회귀 테스트
    await page.goto('/checkouts?status=approved');
    await expect(page.getByText('KRISS 한국표준과학연구원', { exact: false })).toBeVisible();
  });

  test('S12-03: technical_manager가 반출 시작 다이얼로그 → checked_out', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}`);
    await expect(page.getByRole('button', { name: '반출 시작' })).toBeVisible();

    await page.getByRole('button', { name: '반출 시작' }).click();

    // 다이얼로그("반출 시작") 확인
    const dialog = page.getByRole('dialog', { name: '반출 시작' });
    await expect(dialog).toBeVisible();

    // API 응답 대기 + "확인" 버튼 클릭
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/start') && resp.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: '확인' }).click();
    const startResponse = await responsePromise;
    expect(startResponse.ok()).toBeTruthy();

    const responseBody = await startResponse.json();
    expect(responseBody.status).toBe(CSVal.CHECKED_OUT);
    expect(responseBody.checkoutDate).toBeTruthy();

    // 장비 상태 검증: checked_out
    await clearBackendCache();
    const equipData = await apiGet(page, `/api/equipment/${testEquipmentId}`);
    expect(equipData.status).toBe(ESVal.CHECKED_OUT);
  });

  test('S12-04: technical_manager가 반입 처리 페이지에서 검사 → returned', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    // 반입 처리 페이지로 이동
    await page.goto(`/checkouts/${checkoutId}/return`);
    await expect(page.getByLabel('작동 여부 확인')).toBeVisible();

    // 교정 목적 필수 체크항목: 교정 확인 + 작동 여부 확인
    await page.getByLabel('교정 확인').check();
    await page.getByLabel('작동 여부 확인').check();

    // 검사 비고 입력
    await page.getByLabel('검사 비고').fill('E2E 테스트 - 교정 완료, 정상 작동 확인');

    // "반입 처리" 버튼 클릭 + API 응답 대기
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/return') && resp.request().method() === 'POST'
    );
    await page.getByRole('button', { name: '반입 처리' }).click();
    const returnResponse = await responsePromise;
    expect(returnResponse.ok()).toBeTruthy();

    const responseBody = await returnResponse.json();
    expect(responseBody.status).toBe(CSVal.RETURNED);
    expect(responseBody.calibrationChecked).toBe(true);
    expect(responseBody.workingStatusChecked).toBe(true);
    expect(responseBody.actualReturnDate).toBeTruthy();

    // 상세 페이지로 리다이렉트 확인
    await page.waitForURL(`**/checkouts/${checkoutId}`);

    // 장비 상태: 반입 승인 전까지는 여전히 checked_out
    await clearBackendCache();
    const equipData = await apiGet(page, `/api/equipment/${testEquipmentId}`);
    expect(equipData.status).toBe(ESVal.CHECKED_OUT);
  });

  test('S12-05: technical_manager가 반입 승인 다이얼로그 → return_approved + 장비 available', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}`);
    await expect(page.getByRole('button', { name: '반입 승인' })).toBeVisible();

    // "반입 승인" 버튼 클릭
    await page.getByRole('button', { name: '반입 승인' }).click();

    // 다이얼로그("반입 승인") 확인
    const dialog = page.getByRole('dialog', { name: '반입 승인' });
    await expect(dialog).toBeVisible();

    // API 응답 대기 + "확인" 버튼 클릭
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/approve-return') && resp.request().method() === 'PATCH'
    );
    await dialog.getByRole('button', { name: '확인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe(CSVal.RETURN_APPROVED);
    expect(responseBody.returnApprovedBy).toBeTruthy();
    expect(responseBody.returnApprovedAt).toBeTruthy();

    // ★ 장비 상태 검증: available로 복원
    await clearBackendCache();
    const equipData = await apiGet(page, `/api/equipment/${testEquipmentId}`);
    expect(equipData.status).toBe(ESVal.AVAILABLE);
  });
});
