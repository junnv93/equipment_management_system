/**
 * WF-34: rental 2-step 승인 워크플로우 — Phase 10 E2E 통합 검증
 *
 * 시나리오 (6개 직렬):
 *   T1  차용팀 TE가 rental 반출 신청 → PENDING
 *   T2  차용팀 TM이 borrower-approve → BORROWER_APPROVED
 *   T4  차용팀 TM이 lender /approve 시도 → 403 (cross-site scope 실패)
 *   T3  대출팀 TM(techManagerPage)이 /approve → APPROVED
 *   T5  동일 사이트 타 팀 TM이 borrower-approve 시도 → 403 CHECKOUT_BORROWER_TEAM_ONLY
 *   T6  calibration 반출에 borrower-approve 시도 → 400 CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY
 *
 * 역할 배치:
 *   차용팀(borrower): uiwang-general-rf (다른 사이트)
 *     TE  — BORROWER_TE_EMAIL  (신청자)
 *     TM  — BORROWER_TM_EMAIL  (1차 승인권자)
 *   대출팀(lender): suwon-fcc-emc-rf (장비 소속팀)
 *     TM  — techManagerPage  (2차 최종 승인자)
 *   동일사이트 타팀 TM (T5): SUWON_SAR_TM_EMAIL — suwon-sar (scope는 통과, teamId 불일치)
 *   장비:
 *     T1~T4: SPECTRUM_ANALYZER_SUW_E (suwon-fcc 소속, rental 가능)
 *     T5:    SAR_PROBE_SUW_S (suwon-sar 소속, rental 가능)
 *     T6:    NETWORK_ANALYZER_SUW_E (suwon-fcc 소속, calibration 반출)
 *
 * 인증 전략: `getBackendTokenByEmail` — storageState 없이 임의 사용자 토큰 취득.
 *   tokenCache에 'email:' 네임스페이스로 role 키와 충돌 없이 저장.
 *
 * @see docs/workflows/critical-workflows.md WF-34
 * @see apps/backend/src/modules/checkouts/checkouts.service.ts borrowerApprove()
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import {
  createCheckout,
  approveCheckout,
  extractId,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
  borrowerApproveCheckout,
} from './helpers/workflow-helpers';
import { getBackendTokenByEmail } from '../shared/helpers/api-helpers';
import {
  TEST_EQUIPMENT_IDS,
  TEST_USER_EMAILS,
  BASE_URLS,
} from '../shared/constants/shared-test-data';

// ============================================================================
// 테스트 상수
// ============================================================================

const BACKEND_URL = BASE_URLS.BACKEND;

/** 차용팀(uiwang-general-rf) TE — rental 반출 신청자 */
const BORROWER_TE_EMAIL = TEST_USER_EMAILS.TEST_ENGINEER_UIWANG;
/** 차용팀(uiwang-general-rf) TM — borrower-approve 권한자 */
const BORROWER_TM_EMAIL = TEST_USER_EMAILS.TECHNICAL_MANAGER_UIWANG;
/** 동일 사이트(suwon) 타 팀(suwon-sar) TM — scope 통과, teamId 불일치로 BORROWER_TEAM_ONLY 유발 */
const SUWON_SAR_TM_EMAIL = TEST_USER_EMAILS.TECHNICAL_MANAGER_SUWON_SAR;

/** T1~T4 공용 장비: suwon-fcc 소속 rental 가능 장비 */
const LENDER_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;
/** T5 장비: suwon-sar 소속 rental 가능 장비 */
const T5_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SAR_PROBE_SUW_S;
/** T6 장비: suwon-fcc 소속 calibration 반출용 장비 */
const T6_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E;

// ============================================================================
// 헬퍼
// ============================================================================

/** 반출 상세에서 status 필드 추출 */
function extractStatus(body: Record<string, unknown>): string {
  const data = (body.data ?? body) as Record<string, unknown>;
  return data.status as string;
}

/** 반출 상세에서 errorCode 추출 (오류 응답) */
function extractErrorCode(body: Record<string, unknown>): string {
  const error = (body.error ?? body) as Record<string, unknown>;
  return (error.code ?? body.code) as string;
}

/**
 * token 직접 주입 방식으로 /approve (lender 승인) 호출
 * negative test에서도 쓸 수 있도록 상태 검증 없이 APIResponse 반환
 */
async function approveCheckoutWithToken(
  page: import('@playwright/test').Page,
  checkoutId: string,
  token: string
): Promise<import('@playwright/test').APIResponse> {
  const detailResp = await page.request.get(`${BACKEND_URL}/api/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const detail = await detailResp.json();
  const data = (detail.data ?? detail) as Record<string, unknown>;
  const version = typeof data.version === 'number' ? data.version : 0;
  return page.request.patch(`${BACKEND_URL}/api/checkouts/${checkoutId}/approve`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { version },
  });
}

// ============================================================================
// T1~T4: 정상 2-step 흐름 (serial, shared checkoutId)
// ============================================================================

test.describe('WF-34: rental 2-step 승인 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  let checkoutId: string;

  test.beforeAll(async () => {
    await resetEquipmentForWorkflow(LENDER_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetEquipmentForWorkflow(LENDER_EQUIPMENT_ID);
    await resetEquipmentForWorkflow(T5_EQUIPMENT_ID);
    await resetEquipmentForWorkflow(T6_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  // --------------------------------------------------------------------------
  // T1: 차용팀 TE 신청 → PENDING
  // --------------------------------------------------------------------------

  test('T1: 차용팀 TE가 rental 반출 신청 → PENDING', async ({ testOperatorPage: page }) => {
    await clearBackendCache();

    const borrowerTeToken = await getBackendTokenByEmail(page, BORROWER_TE_EMAIL);

    // token 직접 주입으로 차용팀 TE 신청 (testOperatorPage는 suwon TE — cross-site 신청)
    const resp = await page.request.post(`${BACKEND_URL}/api/checkouts`, {
      headers: {
        Authorization: `Bearer ${borrowerTeToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        equipmentIds: [LENDER_EQUIPMENT_ID],
        purpose: CPVal.RENTAL,
        destination: 'Uiwang General RF 시험소',
        reason: 'WF-34 rental 2-step 통합 테스트',
        expectedReturnDate: '2026-12-31T00:00:00.000Z',
      },
    });

    expect(resp.status()).toBe(201);
    const body = await resp.json();
    checkoutId = extractId(body);
    expect(checkoutId).toBeTruthy();

    const status = extractStatus(body);
    expect(status).toBe(CSVal.PENDING);
  });

  // --------------------------------------------------------------------------
  // T2: 차용팀 TM borrower-approve → BORROWER_APPROVED
  // --------------------------------------------------------------------------

  test('T2: 차용팀 TM borrower-approve → BORROWER_APPROVED', async ({ techManagerPage: page }) => {
    await clearBackendCache();

    const borrowerTmToken = await getBackendTokenByEmail(page, BORROWER_TM_EMAIL);
    const resp = await borrowerApproveCheckout(page, checkoutId, borrowerTmToken);

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    const status = extractStatus(body);
    expect(status).toBe(CSVal.BORROWER_APPROVED);
  });

  // --------------------------------------------------------------------------
  // T4: 차용팀 TM이 lender /approve 시도 → 403 (cross-site scope 실패, 순서상 T2 직후)
  // --------------------------------------------------------------------------

  test('T4: 차용팀 TM이 lender /approve 시도 → 403 cross-site scope 실패', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache();

    const borrowerTmToken = await getBackendTokenByEmail(page, BORROWER_TM_EMAIL);
    const resp = await approveCheckoutWithToken(page, checkoutId, borrowerTmToken);

    // 차용팀 TM은 lender 사이트 소속이 아님 → scope 실패 403
    expect(resp.status()).toBe(403);
  });

  // --------------------------------------------------------------------------
  // T3: 대출팀 TM /approve → APPROVED (lender 2차 최종 승인)
  // --------------------------------------------------------------------------

  test('T3: 대출팀 TM /approve → APPROVED', async ({ techManagerPage: page }) => {
    await clearBackendCache();

    const body = await approveCheckout(page, checkoutId);
    const status = extractStatus(body);
    expect(status).toBe(CSVal.APPROVED);
  });

  // --------------------------------------------------------------------------
  // T5: 동일 사이트 타 팀 TM borrower-approve → 403 CHECKOUT_BORROWER_TEAM_ONLY
  // (독립 checkout, T1~T4와 무관)
  // --------------------------------------------------------------------------

  test('T5: 동일 사이트 타 팀 TM borrower-approve → 403 CHECKOUT_BORROWER_TEAM_ONLY', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    await resetEquipmentForWorkflow(T5_EQUIPMENT_ID);

    // suwon-fcc TE (testOperatorPage)가 SAR_PROBE_SUW_S로 rental 신청
    // — testOperatorPage는 suwon-fcc-emc-rf 소속 TE
    const t5Body = await createCheckout(
      page,
      [T5_EQUIPMENT_ID],
      CPVal.RENTAL,
      'FCC EMC/RF 시험소',
      'WF-34 T5 BORROWER_TEAM_ONLY 검증'
    );
    const t5CheckoutId = extractId(t5Body);
    expect(t5CheckoutId).toBeTruthy();

    await clearBackendCache();

    // suwon-sar TM: 같은 'suwon' 사이트 → scope 통과, 다른 teamId → BORROWER_TEAM_ONLY
    const suwonSarTmToken = await getBackendTokenByEmail(page, SUWON_SAR_TM_EMAIL);
    const resp = await borrowerApproveCheckout(page, t5CheckoutId, suwonSarTmToken);

    expect(resp.status()).toBe(403);
    const body = await resp.json();
    const errorCode = extractErrorCode(body);
    expect(errorCode).toBe('CHECKOUT_BORROWER_TEAM_ONLY');
  });

  // --------------------------------------------------------------------------
  // T6: calibration 반출에 borrower-approve → 400 CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY
  // (독립 checkout, purpose: calibration)
  // --------------------------------------------------------------------------

  test('T6: calibration 반출에 borrower-approve → 400 CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY', async ({
    testOperatorPage: page,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();
    await resetEquipmentForWorkflow(T6_EQUIPMENT_ID);

    // TE가 calibration 반출 신청
    const t6Body = await createCheckout(
      page,
      [T6_EQUIPMENT_ID],
      CPVal.CALIBRATION,
      'FCC EMC/RF 시험소',
      'WF-34 T6 BORROWER_APPROVE_RENTAL_ONLY 검증'
    );
    const t6CheckoutId = extractId(t6Body);
    expect(t6CheckoutId).toBeTruthy();

    await clearBackendCache();

    // borrowerApprove는 purpose 체크를 scope보다 먼저 수행 → 403/400 아니라 400으로 즉시 실패
    // lender TM(techManagerPage)이 calibration checkout에 borrower-approve 시도
    const lenderTmToken = await getBackendTokenByEmail(
      tmPage,
      TEST_USER_EMAILS.TECHNICAL_MANAGER_SUWON
    );
    const resp = await borrowerApproveCheckout(tmPage, t6CheckoutId, lenderTmToken);

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    const errorCode = extractErrorCode(body);
    expect(errorCode).toBe('CHECKOUT_BORROWER_APPROVE_RENTAL_ONLY');
  });
});
