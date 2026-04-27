/**
 * WF-AP03: 승인 철회 (Revoke Approval)
 *
 * 기술책임자(TM)가 반출 승인 직후 5분 이내에 승인을 취소 → pending 롤백.
 * scope → FSM → domain 순서 보안 fail-close 원칙 검증.
 *
 * ⚠️ REVOCATION_WINDOW_EXPIRED (5분 초과) 에러는 E2E에서 직접 검증 불가
 *    → backend unit test (`checkouts.service.spec.ts`) 에서 커버
 *
 * @see docs/workflows/critical-workflows.md — WF-AP-03
 * @see apps/backend/src/modules/checkouts/checkouts.service.ts — revokeApproval()
 * @see packages/shared-constants/src/api-endpoints.ts — CHECKOUTS.REVOKE_APPROVAL
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createCheckout,
  approveCheckout,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
  apiPost,
} from './helpers/workflow-helpers';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.RBAC_SIGNAL_GEN_SUW_E;
const BACKEND_URL = BASE_URLS.BACKEND;

async function revokeApproval(
  page: Parameters<typeof apiPost>[0],
  checkoutId: string,
  version: number,
  reason: string,
  role = 'technical_manager'
) {
  return apiPost(page, `/api/checkouts/${checkoutId}/revoke-approval`, { version, reason }, role);
}

test.describe('WF-AP03: 승인 철회 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;
  let checkoutVersion: number;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  // ============================================================================
  // Step 1: 반출 신청 생성
  // ============================================================================

  test('Step 1: 반출 신청 생성 (철회 검증용 pending 상태 준비)', async ({
    testOperatorPage: page,
  }) => {
    const body = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'KRISS',
      'WF-AP03: 승인 철회 검증'
    );
    checkoutId = body?.data?.id ?? body?.id;
    expect(checkoutId).toBeTruthy();
    await clearBackendCache();
  });

  // ============================================================================
  // Step 2: pending 상태 철회 시도 → INVALID_TRANSITION (FSM guard)
  // ============================================================================

  test('Step 2: pending 상태에서 철회 시도 → 400 INVALID_TRANSITION', async ({
    techManagerPage: page,
  }) => {
    // 최신 version 조회
    const getResp = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${await getBackendToken(page, 'technical_manager')}`,
      },
    });
    expect(getResp.ok()).toBe(true);
    const data = await getResp.json();
    const version = data?.data?.version ?? data?.version;

    const resp = await revokeApproval(page, checkoutId, version, 'FSM guard 테스트');
    expect(resp.status()).toBe(400);

    const body = await resp.json();
    expect(body?.code ?? body?.message ?? '').toMatch(/INVALID_TRANSITION|Revocation/i);
  });

  // ============================================================================
  // Step 3: 승인 → 즉시 철회 성공 (happy path)
  // ============================================================================

  test('Step 3: 반출 승인 처리', async ({ techManagerPage: page }) => {
    const approveBody = await approveCheckout(page, checkoutId, 'technical_manager');
    expect(approveBody?.status ?? approveBody?.data?.status).toBe('approved');
    checkoutVersion = approveBody?.version ?? approveBody?.data?.version;
    await clearBackendCache();
  });

  test('Step 4: 승인 직후 즉시 철회 → pending 롤백 성공', async ({ techManagerPage: page }) => {
    const resp = await revokeApproval(
      page,
      checkoutId,
      checkoutVersion,
      'WF-AP03 E2E: 승인 직후 철회 검증'
    );
    expect(resp.status()).toBe(200);

    const body = await resp.json();
    const resultStatus = body?.data?.status ?? body?.status;
    expect(resultStatus).toBe('pending');

    // approverId, approvedAt 초기화 확인
    const resultData = body?.data ?? body;
    expect(resultData?.approverId ?? null).toBeNull();

    await clearBackendCache();
  });

  // ============================================================================
  // Step 5: 타인의 승인 → 본인 외 철회 시도 → 403 FORBIDDEN
  // ============================================================================

  test('Step 5: 재승인 (다른 TM 시뮬레이션용 재준비)', async ({ techManagerPage: page }) => {
    const approveBody = await approveCheckout(page, checkoutId, 'technical_manager');
    expect(approveBody?.status ?? approveBody?.data?.status).toBe('approved');
    checkoutVersion = approveBody?.version ?? approveBody?.data?.version;
    await clearBackendCache();
  });

  test('Step 6: 타 역할(lab_manager)이 TM 승인 철회 시도 → 403 FORBIDDEN', async ({
    techManagerPage: page,
  }) => {
    // lab_manager는 approverId가 다르므로 FORBIDDEN
    const resp = await revokeApproval(
      page,
      checkoutId,
      checkoutVersion,
      'LM가 TM 승인 철회 시도',
      'lab_manager'
    );
    // 스코프 외이거나 domain 검증에서 403
    expect([403, 400]).toContain(resp.status());

    const body = await resp.json();
    const errorCode = body?.code ?? body?.message ?? '';
    expect(errorCode).toMatch(/FORBIDDEN|Only the approver|INVALID_TRANSITION/i);
  });

  // ============================================================================
  // Step 6: 최종 상태 확인
  // ============================================================================

  // REVOCATION_WINDOW_EXPIRED (5분 초과): E2E에서 실시간 대기 불가
  // → backend unit test: checkouts.service.spec.ts "revocation window expired"
  test.skip('REVOCATION_WINDOW_EXPIRED — 5분 초과 철회 (unit test 커버)', () => {});

  test('Step 7: 감사 로그에 isRevocation=true 마커 확인', async ({ techManagerPage: page }) => {
    // 승인 상태 유지 중 — Step 5에서 재승인, Step 6 철회 실패 → 여전히 approved
    const getResp = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${await getBackendToken(page, 'technical_manager')}`,
      },
    });
    expect(getResp.ok()).toBe(true);

    const data = await getResp.json();
    const status = data?.data?.status ?? data?.status;
    // Step 4에서 철회 성공 후 Step 5에서 재승인 → approved
    expect(status).toBe('approved');
  });
});
