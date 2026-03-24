/**
 * Suite 12: 수리 반출 UI 전체 라이프사이클 (Serial) ★P0 CRITICAL
 *
 * 교정과 동일한 5단계이지만 반입 처리 시 repairChecked가 필수.
 * 역할 전환: test_engineer(신청) → technical_manager(승인/반출/반입승인)
 *
 * ⚠️ 백엔드 캐싱: 매 단계 사이에 clearBackendCache() 호출 필수.
 * ⚠️ networkidle 사용 금지 — Next.js 개발 서버의 HMR 연결로 인해 타임아웃 발생.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import { BACKEND_URL, EQUIP } from '../helpers/checkout-constants';
import {
  getBackendToken,
  cleanupCheckoutPool,
  resetEquipmentToAvailable,
  clearBackendCache,
  apiGet,
} from '../helpers/checkout-helpers';

test.describe('Suite 12: 수리 반출 UI 전체 라이프사이클', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  // FILTER_SUW_E: spare 상태 → beforeAll에서 available로 리셋, FCC EMC/RF 팀 소속
  // Suite 08은 SPECTRUM_ANALYZER/SIGNAL_GEN을 사용하므로 격리됨
  const testEquipmentId = EQUIP.FILTER_SUW_E;

  test.beforeAll(async () => {
    await resetEquipmentToAvailable(testEquipmentId);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await resetEquipmentToAvailable(testEquipmentId);
    await cleanupCheckoutPool();
  });

  test('S12-R01: test_engineer가 수리 반출 신청 → pending', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [testEquipmentId],
        purpose: CPVal.REPAIR,
        destination: '키사이트 서비스센터',
        reason: 'E2E 수리 UI 라이프사이클 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    checkoutId = data.id;
    expect(data.status).toBe(CSVal.PENDING);
    expect(data.purpose).toBe(CPVal.REPAIR);
  });

  test('S12-R02: technical_manager가 UI에서 승인 → approved', async ({ techManagerPage: page }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}`);
    await expect(page.getByText('대기 중')).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/checkouts/${checkoutId}/approve`) &&
        resp.request().method() === 'PATCH'
    );
    await page.getByRole('button', { name: '승인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe(CSVal.APPROVED);
  });

  test('S12-R03: technical_manager가 반출 시작 → checked_out', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}`);
    await expect(page.getByRole('button', { name: '반출 시작' })).toBeVisible();

    await page.getByRole('button', { name: '반출 시작' }).click();

    const dialog = page.getByRole('dialog', { name: '반출 시작' });
    await expect(dialog).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/start') && resp.request().method() === 'POST'
    );
    await dialog.getByRole('button', { name: '확인' }).click();
    const startResponse = await responsePromise;
    expect(startResponse.ok()).toBeTruthy();

    const responseBody = await startResponse.json();
    expect(responseBody.status).toBe(CSVal.CHECKED_OUT);
  });

  test('S12-R04: 수리 반입 처리 — repairChecked 필수 + 성공', async ({ techManagerPage: page }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}/return`);
    await expect(page.getByLabel('작동 여부 확인')).toBeVisible();

    // 수리 목적 필수 체크항목: 수리 확인 + 작동 여부 확인
    await page.getByLabel('수리 확인').check();
    await page.getByLabel('작동 여부 확인').check();
    await page.getByLabel('검사 비고').fill('E2E 테스트 - 수리 완료, 부품 교체 확인');

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/return') && resp.request().method() === 'POST'
    );
    await page.getByRole('button', { name: '반입 처리' }).click();
    const returnResponse = await responsePromise;
    expect(returnResponse.ok()).toBeTruthy();

    const responseBody = await returnResponse.json();
    expect(responseBody.status).toBe(CSVal.RETURNED);
    expect(responseBody.repairChecked).toBe(true);
    expect(responseBody.workingStatusChecked).toBe(true);

    // 상세 페이지로 리다이렉트
    await page.waitForURL(`**/checkouts/${checkoutId}`);
  });

  test('S12-R05: 반입 승인 → return_approved + 장비 available 복원', async ({
    techManagerPage: page,
  }) => {
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();

    await page.goto(`/checkouts/${checkoutId}`);
    await expect(page.getByRole('button', { name: '반입 승인' })).toBeVisible();

    await page.getByRole('button', { name: '반입 승인' }).click();

    const dialog = page.getByRole('dialog', { name: '반입 승인' });
    await expect(dialog).toBeVisible();

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/approve-return') && resp.request().method() === 'PATCH'
    );
    await dialog.getByRole('button', { name: '확인' }).click();
    const approveResponse = await responsePromise;
    expect(approveResponse.ok()).toBeTruthy();

    const responseBody = await approveResponse.json();
    expect(responseBody.status).toBe(CSVal.RETURN_APPROVED);

    // 장비 상태 복원 검증
    await clearBackendCache();
    const equipData = await apiGet(page, `/api/equipment/${testEquipmentId}`);
    expect(equipData.status).toBe(ESVal.AVAILABLE);
  });
});
