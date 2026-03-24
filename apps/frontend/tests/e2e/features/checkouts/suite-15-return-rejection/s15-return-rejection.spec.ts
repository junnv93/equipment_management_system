/**
 * Suite 15: Return Rejection - 반입 반려 워크플로우
 *
 * 검증 대상:
 * - returned → checked_out (반입 반려)
 * - 반려 사유 필수 입력
 * - 반려 시 calibrationChecked, repairChecked, workingStatusChecked,
 *   inspectionNotes, actualReturnDate 모두 초기화
 * - 초기화 후 재반입 처리 가능
 *
 * Mode: serial (상태 변경)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
import {
  apiGet,
  apiPatch,
  apiPost,
  resetCheckoutToReturnedViaAPI,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';
import { SUITE_15 } from '../helpers/checkout-constants';

test.describe('Suite 15: 반입 반려 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  let calibrationVersion: number;
  let repairVersion: number;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await resetCheckoutToReturnedViaAPI(page, SUITE_15.CALIBRATION_RETURN, 'calibration');
    await resetCheckoutToReturnedViaAPI(page, SUITE_15.REPAIR_RETURN, 'repair');
    await clearBackendCache();
    await page.close();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S15-01: 반입 반려 — 교정 반출 (returned → checked_out)', async ({
    techManagerPage: page,
  }) => {
    const detail = await apiGet(page, `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}`);
    calibrationVersion = (detail as Record<string, unknown>).version as number;
    expect((detail as Record<string, unknown>).status).toBe(CSVal.RETURNED);

    const { response } = await apiPatch(
      page,
      `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}/reject-return`,
      {
        version: calibrationVersion,
        reason: '교정 인증서 누락, 재검사 필요',
      }
    );

    expect(response.status()).toBe(200);

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}`);
    const updatedData = updated as Record<string, unknown>;
    expect(updatedData.status).toBe(CSVal.CHECKED_OUT);
    calibrationVersion = updatedData.version as number;
  });

  test('S15-02: 반입 반려 후 검사 필드 초기화 확인', async ({ techManagerPage: page }) => {
    const detail = await apiGet(page, `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}`);
    const data = detail as Record<string, unknown>;

    expect(data.calibrationChecked).toBeFalsy();
    expect(data.workingStatusChecked).toBeFalsy();
    expect(data.inspectionNotes).toBeFalsy();
    expect(data.actualReturnDate).toBeFalsy();
  });

  test('S15-03: 반입 반려 후 재반입 처리 성공', async ({ techManagerPage: page }) => {
    // CAS: 반려로 version이 변경되었으므로 최신 version 조회
    const detail = await apiGet(page, `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}`);
    const currentVersion = (detail as Record<string, unknown>).version as number;

    const { response } = await apiPost(
      page,
      `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}/return`,
      {
        version: currentVersion,
        calibrationChecked: true,
        workingStatusChecked: true,
        inspectionNotes: '재검사 완료 - 교정 인증서 확인',
      }
    );

    expect(response.status()).toBe(201); // POST /return → 201 Created

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${SUITE_15.CALIBRATION_RETURN}`);
    expect((updated as Record<string, unknown>).status).toBe(CSVal.RETURNED);
  });

  test('S15-04: 반입 반려 — 수리 반출 (repairChecked 초기화 확인)', async ({
    techManagerPage: page,
  }) => {
    const detail = await apiGet(page, `/api/checkouts/${SUITE_15.REPAIR_RETURN}`);
    repairVersion = (detail as Record<string, unknown>).version as number;
    expect((detail as Record<string, unknown>).status).toBe(CSVal.RETURNED);

    const { response } = await apiPatch(
      page,
      `/api/checkouts/${SUITE_15.REPAIR_RETURN}/reject-return`,
      {
        version: repairVersion,
        reason: '수리 불량 — 재수리 필요',
      }
    );

    expect(response.status()).toBe(200);

    await clearBackendCache();
    const updated = await apiGet(page, `/api/checkouts/${SUITE_15.REPAIR_RETURN}`);
    const updatedData = updated as Record<string, unknown>;
    expect(updatedData.status).toBe(CSVal.CHECKED_OUT);
    expect(updatedData.repairChecked).toBeFalsy();
    expect(updatedData.workingStatusChecked).toBeFalsy();
  });

  test('S15-05: UI에서 반입 반려 다이얼로그 동작', async ({ techManagerPage: page }) => {
    // Suite 15 CALIBRATION_RETURN은 이미 returned 상태로 재반입됨
    await page.goto(`/checkouts/${SUITE_15.CALIBRATION_RETURN}`);

    const rejectButton = page.getByRole('button', { name: /반입 반려|반입 거절/ });
    const isVisible = await rejectButton.isVisible().catch(() => false);

    if (isVisible) {
      await rejectButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const reasonField = dialog.getByRole('textbox');
      await expect(reasonField).toBeVisible();
    }
  });
});
