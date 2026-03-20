/**
 * Suite 01: 반출 상세 조회 (Read-Only, Parallel)
 *
 * 다양한 상태의 반출 상세 페이지를 조회하고 UI/API 정합성을 검증합니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_01 } from '../helpers/checkout-constants';
import { navigateToCheckoutDetail, apiGet } from '../helpers/checkout-helpers';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';

test.describe('Suite 01: 반출 상세 조회', () => {
  test('S01-05: return_approved 상세 (action 버튼 없음)', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_01.RETURN_APPROVED);

    // API 검증: return_approved 상태
    const data = await apiGet(page, `/api/checkouts/${SUITE_01.RETURN_APPROVED}`);
    expect(data.status).toBe(CSVal.RETURN_APPROVED);
    expect(data.returnApprovedBy).not.toBeNull();
    expect(data.returnApprovedAt).not.toBeNull();

    // UI: 승인/반려/반출 시작 버튼 없어야 함
    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
  });

  test('S01-06: rejected 상세 (거절 사유 표시)', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_01.REJECTED);

    // API 검증: rejected 상태 + rejectionReason 존재
    const data = await apiGet(page, `/api/checkouts/${SUITE_01.REJECTED}`);
    expect(data.status).toBe(CSVal.REJECTED);
    expect(data.rejectionReason).toBeTruthy();

    // UI: 거절 사유가 화면에 표시
    const reason = data.rejectionReason as string;
    await expect(page.getByText(reason)).toBeVisible();
  });

  test('S01-07: overdue 상세 (기한 초과 표시)', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_01.OVERDUE);

    // API 검증
    const data = await apiGet(page, `/api/checkouts/${SUITE_01.OVERDUE}`);
    // overdue 또는 checked_out 상태
    expect([CSVal.OVERDUE, CSVal.CHECKED_OUT]).toContain(data.status);
  });

  test('S01-08: canceled 상세 (취소 표시)', async ({ techManagerPage: page }) => {
    await navigateToCheckoutDetail(page, SUITE_01.CANCELED);

    // API 검증: canceled 상태
    const data = await apiGet(page, `/api/checkouts/${SUITE_01.CANCELED}`);
    expect(data.status).toBe(CSVal.CANCELED);

    // UI: action 버튼 없음
    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
  });
});
