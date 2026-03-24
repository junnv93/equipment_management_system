/**
 * Suite 18: QM Read-Only + Role Permissions - 역할 권한 종합 검증
 *
 * 검증 대상:
 * - quality_manager 읽기 전용 (목록/상세 접근, 액션 API 403)
 * - test_engineer 승인/시작/반입 버튼 미표시
 * - 취소 워크플로우: approved/checked_out에서 취소 버튼 미표시
 * - 터미널 상태(return_approved, canceled)에서 액션 버튼 없음
 *
 * Mode: parallel (읽기 전용)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import {
  apiGet,
  apiPatch,
  getBackendToken,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';
import { SUITE_18, BACKEND_URL } from '../helpers/checkout-constants';

test.afterAll(async () => {
  await cleanupCheckoutPool();
});

test.describe('Suite 18: QM 읽기전용 검증', () => {
  test('S18-01: quality_manager — 반출 목록 접근 가능', async ({ qualityManagerPage: page }) => {
    const data = await apiGet(page, '/api/checkouts?direction=outbound', 'quality_manager');
    const response = data as Record<string, unknown>;
    expect(response.items).toBeDefined();
  });

  test('S18-02: quality_manager — 반출 상세 접근 가능', async ({ qualityManagerPage: page }) => {
    const data = await apiGet(
      page,
      `/api/checkouts/${SUITE_18.RETURN_APPROVED}`,
      'quality_manager'
    );
    const response = data as Record<string, unknown>;
    expect(response.id).toBe(SUITE_18.RETURN_APPROVED);
  });

  test('S18-03: quality_manager — 승인 API 403', async ({ qualityManagerPage: page }) => {
    const { response } = await apiPatch(
      page,
      `/api/checkouts/${SUITE_18.PENDING}/approve`,
      { version: 1 },
      'quality_manager'
    );

    expect(response.status()).toBe(403);
  });

  test('S18-04: quality_manager — 반출 생성 API 403', async ({ qualityManagerPage: page }) => {
    const token = await getBackendToken(page, 'quality_manager');
    const response = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        equipmentIds: ['eeee1001-0001-4001-8001-000000000001'],
        purpose: CPVal.CALIBRATION,
        destination: '테스트',
        reason: '테스트',
        expectedReturnDate: '2026-06-01',
      },
    });

    expect(response.status()).toBe(403);
  });

  test('S18-05: quality_manager — 반입 관련 페이지도 읽기전용', async ({
    qualityManagerPage: page,
  }) => {
    const data = await apiGet(page, '/api/equipment-imports', 'quality_manager');
    expect(data).toBeDefined();
  });
});

test.describe('Suite 18: test_engineer 액션 제한', () => {
  test('S18-06: test_engineer — 승인 버튼 미표시 (UI)', async ({ testOperatorPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.PENDING}`);

    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '거절' })).not.toBeVisible();
  });

  test('S18-07: test_engineer — 반출 시작 버튼 미표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.APPROVED}`);

    await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
  });

  test('S18-08: test_engineer — 반입 승인 버튼 미표시', async ({ testOperatorPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.RETURNED}`);

    await expect(page.getByRole('button', { name: '반입 승인' })).not.toBeVisible();
  });
});

test.describe('Suite 18: 취소 버튼 가시성', () => {
  test('S18-09: approved 상태에서 취소 버튼 미표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.APPROVED}`);

    await expect(page.getByRole('button', { name: '취소' })).not.toBeVisible();
  });

  test('S18-10: checked_out 상태에서 취소 버튼 미표시', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.CHECKED_OUT}`);

    await expect(page.getByRole('button', { name: '취소' })).not.toBeVisible();
  });

  test('S18-11: return_approved 상태에서 액션 버튼 없음', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.RETURN_APPROVED}`);

    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '반입 승인' })).not.toBeVisible();
  });

  test('S18-12: canceled 상태에서 액션 버튼 없음', async ({ techManagerPage: page }) => {
    await page.goto(`/checkouts/${SUITE_18.CANCELED}`);

    await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: '취소' })).not.toBeVisible();
  });
});
