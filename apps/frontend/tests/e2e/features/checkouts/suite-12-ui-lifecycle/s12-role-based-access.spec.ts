/**
 * Suite 12: 역할별 반출 라이프사이클 접근 권한 검증 (Parallel)
 *
 * 각 역할이 반출 상태별로 어떤 액션 버튼을 볼 수 있는지 검증합니다.
 * Read-Only 테스트이므로 병렬 실행 가능.
 *
 * 역할별 canApprove:
 * - test_engineer → ❌ (신청만 가능)
 * - quality_manager → ❌ (반출 상세 접근 불가 — 에러 페이지)
 * - technical_manager → ✅ (승인/반려/반출시작/반입승인)
 * - lab_manager (siteAdmin) → ✅ (전체 권한)
 *
 * ⚠️ networkidle 사용 금지 — 명시적 요소 대기 사용.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { SUITE_01 } from '../helpers/checkout-constants';
import {
  resetCheckoutToPending,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

import { CHECKOUT_043_ID } from '../../../shared/constants/test-checkout-ids';

// ★ pending 상태 테스트용 전용 ID (Suite 12 전용)
const PENDING_CHECKOUT_ID = CHECKOUT_043_ID;

test.describe('Suite 12: 역할별 반출 액션 권한 검증', () => {
  test.beforeAll(async () => {
    await resetCheckoutToPending(PENDING_CHECKOUT_ID);
    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupCheckoutPool();
  });

  test.describe('pending 상태에서 역할별 버튼 가시성', () => {
    test('test_engineer는 pending 상태에서 승인/반려 버튼이 보이지 않음', async ({
      testOperatorPage: page,
    }) => {
      await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
      // 반출 상세 페이지 로드 대기 (heading)
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();

      await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반려' })).not.toBeVisible();
    });

    test('quality_manager는 반출 상세 접근 가능하지만 액션 버튼 없음 (읽기 전용)', async ({
      qualityManagerPage: page,
    }) => {
      await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);

      // QM은 VIEW_CHECKOUTS 권한 보유 → 상세 페이지 접근 가능
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();

      // 하지만 승인/반려 액션은 불가 (APPROVE_CHECKOUT 미보유)
      await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반려' })).not.toBeVisible();
    });

    test('technical_manager는 pending 상태에서 승인/반려 버튼이 보임', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();

      await expect(page.getByRole('button', { name: '승인' })).toBeVisible();
      await expect(page.getByRole('button', { name: '반려' })).toBeVisible();
    });

    test('lab_manager는 pending 상태에서 승인/반려 버튼이 보임', async ({
      siteAdminPage: page,
    }) => {
      await page.goto(`/checkouts/${PENDING_CHECKOUT_ID}`);
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();

      await expect(page.getByRole('button', { name: '승인' })).toBeVisible();
      await expect(page.getByRole('button', { name: '반려' })).toBeVisible();
    });
  });

  test.describe('최종 상태에서 모든 역할 액션 버튼 없음', () => {
    test('return_approved 상태에서 technical_manager도 액션 버튼 없음', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/checkouts/${SUITE_01.RETURN_APPROVED}`);
      // 페이지 로드 대기 (heading + 진행 상태 섹션)
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '진행 상태' })).toBeVisible();

      // 모든 액션 버튼 없음 (최종 상태)
      await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반려' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반입 승인' })).not.toBeVisible();
    });

    test('rejected 상태에서 technical_manager도 액션 버튼 없음', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/checkouts/${SUITE_01.REJECTED}`);
      await expect(page.getByRole('heading', { name: '반출 상세' })).toBeVisible();
      await expect(page.getByRole('heading', { name: '반려 사유' })).toBeVisible();

      // 모든 액션 버튼 없음
      await expect(page.getByRole('button', { name: '승인' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반려' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '반출 시작' })).not.toBeVisible();
    });
  });
});
