/**
 * Suite 06: 반입 처리 (Serial)
 *
 * checked_out → returned 상태 전이 + 검사 항목 필수 확인
 *
 * ⚠️ 백엔드 GET 캐싱: 상태 변경 후 clearBackendCache() 호출 필수
 *
 * IDs: SUITE_06 (019=cal, 020=repair, 021=cal missing check, 015=rejected wrong status)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_06, BACKEND_URL } from '../helpers/checkout-constants';
import {
  resetCheckoutToCheckedOut,
  clearBackendCache,
  apiGet,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

test.describe('Suite 06: 반입 처리', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetCheckoutToCheckedOut(SUITE_06.CALIBRATION);
    await resetCheckoutToCheckedOut(SUITE_06.REPAIR);
    await resetCheckoutToCheckedOut(SUITE_06.MISSING_CHECK);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test('S06-01: 교정 반입: calibrationChecked+workingStatusChecked → returned', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_06.CALIBRATION}/return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          calibrationChecked: true,
          workingStatusChecked: true,
          inspectionNotes: '교정 완료, 정상 작동 확인',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('returned');
    expect(data.calibrationChecked).toBe(true);
    expect(data.workingStatusChecked).toBe(true);
    expect(data.actualReturnDate).toBeTruthy();
  });

  test('S06-02: 수리 반입: repairChecked+workingStatusChecked → returned', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_06.REPAIR}/return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          repairChecked: true,
          workingStatusChecked: true,
          inspectionNotes: '수리 완료, 정상 작동 확인',
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('returned');
    expect(data.repairChecked).toBe(true);
    expect(data.workingStatusChecked).toBe(true);
  });

  test('S06-03: 교정 확인 미체크 → API 400 (필수 검사 강제)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // calibrationChecked 누락 (교정 목적)
    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_06.MISSING_CHECK}/return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          calibrationChecked: false, // 교정 목적인데 false
          workingStatusChecked: true,
        },
      }
    );

    expect(response.status()).toBe(400);

    // 상태 변경 안됨 확인 (캐시 클리어 후)
    await clearBackendCache();
    const checkData = await apiGet(page, `/api/checkouts/${SUITE_06.MISSING_CHECK}`);
    expect(checkData.status).toBe('checked_out');
  });

  test('S06-04: rejected 상태 반입 차단 (API 400)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // rejected 상태에서 반입 시도
    const response = await page.request.post(
      `${BACKEND_URL}/api/checkouts/${SUITE_06.WRONG_STATUS}/return`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          calibrationChecked: true,
          workingStatusChecked: true,
        },
      }
    );

    expect(response.status()).toBe(400);
  });
});
