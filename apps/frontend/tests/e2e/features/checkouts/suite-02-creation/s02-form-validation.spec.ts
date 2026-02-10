/**
 * Suite 02: 반출 생성 폼 검증 (Parallel)
 *
 * 폼 유효성 검증을 테스트합니다. 실제 데이터 생성은 s02-create-success에서 수행.
 *
 * ⚠️ calibration/repair 목적의 반출은 non_conforming 장비도 허용됨.
 *    차단되는 상태: in_use, checked_out 등
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BACKEND_URL, EQUIP } from '../helpers/checkout-constants';
import { getBackendToken } from '../helpers/checkout-helpers';

test.describe('Suite 02: 반출 생성 폼 검증', () => {
  test('S02-01: 필수 필드 미입력 시 제출 불가', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/create');
    await page.waitForLoadState('networkidle');

    // 아무것도 입력하지 않으면 신청 버튼이 disabled 상태여야 함
    const submitButton = page.getByRole('button', { name: /신청/ });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    // 페이지가 여전히 create 페이지에 있어야 함
    expect(page.url()).toContain('/checkouts/create');
  });

  test('S02-02: 과거 날짜 → API 400', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    // 과거 날짜로 API 직접 호출
    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.SPECTRUM_ANALYZER_SUW_E],
        purpose: 'calibration',
        destination: '한국교정시험연구원',
        reason: '정기 교정',
        expectedReturnDate: '2020-01-01T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(400);
  });

  test('S02-03: 사용중 장비 반출 차단 (API 400)', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    // in_use 상태 장비로 반출 신청 시도 (calibration/repair에서 in_use는 허용되지 않음)
    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [EQUIP.EMC_RECEIVER_SUW_E], // in_use status
        purpose: 'calibration',
        destination: '한국교정시험연구원',
        reason: '교정 시도',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(response.status()).toBe(400);
  });
});
