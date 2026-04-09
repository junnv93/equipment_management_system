/**
 * Suite 23: Cross-Site / Cross-Team RBAC for RENTAL Approval
 *
 * 검증 대상: checkouts.service.ts:1358-1365 의 `approverTeamId !== checkout.lenderTeamId` 가드.
 * - 대여(RENTAL)는 장비 소속(lender) 팀의 기술책임자만 승인/반려 가능.
 * - 다른 사이트/다른 팀 TM은 403.
 * - 비(非)RENTAL(CALIBRATION)은 lenderTeamId 체크를 우회 (회귀 방지).
 * - 권한 실패 후 올바른 lender TM은 정상 승인 가능해야 한다 (상태 오염 없음).
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  EquipmentStatusValues as ESVal,
  SiteEnum,
} from '@equipment-management/schemas';
import {
  TEST_EQUIPMENT_IDS,
  TEST_TEAM_IDS,
  TEST_USER_EMAILS,
} from '../../../shared/constants/shared-test-data';
import {
  getBackendToken,
  getBackendTokenByEmail,
  createPendingRentalCheckout,
  createPendingCalibrationCheckout,
  approveCheckoutAsUser,
  rejectCheckoutAsUser,
  cancelCheckoutAsUser,
  getCheckoutSnapshot,
  getEquipmentStatus,
  resetEquipmentToAvailable,
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

// 전용 장비 — FCC EMC/RF 팀(Suwon) 소유.
// RENTAL 은 requester 팀 ≠ lender 팀이어야 하므로 RENTAL 케이스의 requester 는
// 의도적으로 General EMC TE 로 잡는다. CAL 회귀 케이스(S23-05)만 자기팀(FCC) TE 사용.
const RBAC_EQUIP = TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E;

test.describe('Suite 23: Cross-Site / Cross-Team RBAC', () => {
  test.describe.configure({ mode: 'serial' });
  // 백엔드 통합 테스트 (브라우저 무관) — 다중 project 병렬 시 공용 장비 충돌
  // (CHECKOUT_EQUIPMENT_ALREADY_ACTIVE) 방지를 위해 chromium 에서만 실행.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Backend integration — chromium project only');
  });

  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(RBAC_EQUIP);
    await resetEquipmentToAvailable(RBAC_EQUIP);
    await clearBackendCache();
  });

  // 각 테스트 종료 시 장비 복구 — 이전 테스트의 APPROVED checkout 이 남아
  // 후속 테스트의 create 호출을 CHECKOUT_EQUIPMENT_ALREADY_ACTIVE 로 차단하는 것을 방지.
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(RBAC_EQUIP);
    await resetEquipmentToAvailable(RBAC_EQUIP);
    await clearBackendCache();
  });

  test.afterAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(RBAC_EQUIP);
    await resetEquipmentToAvailable(RBAC_EQUIP);
    await clearBackendCache();
    await cleanupCheckoutPool();
  });

  test('S23-01: lender 팀 TM 승인 → 200', async ({ techManagerPage: page }) => {
    // RENTAL: requester 팀(General EMC) ≠ lender 팀(FCC EMC/RF)
    const requesterToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TEST_ENGINEER_SUWON_GENERAL_EMC
    );
    const { id, version } = await createPendingRentalCheckout(page, requesterToken, {
      equipmentId: RBAC_EQUIP,
      lenderTeamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
      lenderSiteId: SiteEnum.enum.suwon,
    });

    const lenderTmToken = await getBackendToken(page, 'technical_manager');
    const response = await approveCheckoutAsUser(page, lenderTmToken, id, version);
    expect(response.status()).toBe(200);

    const snapshot = await getCheckoutSnapshot(page, lenderTmToken, id);
    expect(snapshot.status).toBe(CSVal.APPROVED);
    expect(snapshot.version).toBe(version + 1);

    // Cleanup — cancel not allowed on APPROVED; leave to afterAll reset.
  });

  test('S23-02: 다른 팀 TM(같은 사이트) 승인 → 403, 상태 미오염', async ({
    techManagerPage: page,
  }) => {
    const requesterToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TEST_ENGINEER_SUWON_GENERAL_EMC
    );
    const { id, version } = await createPendingRentalCheckout(page, requesterToken, {
      equipmentId: RBAC_EQUIP,
      lenderTeamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
      lenderSiteId: SiteEnum.enum.suwon,
    });

    const otherTeamSameSiteToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TECHNICAL_MANAGER_SUWON_GENERAL_EMC
    );
    const response = await approveCheckoutAsUser(page, otherTeamSameSiteToken, id, version);
    expect(response.status()).toBe(403);

    const lenderTmToken = await getBackendToken(page, 'technical_manager');
    const snapshot = await getCheckoutSnapshot(page, lenderTmToken, id);
    expect(snapshot.status).toBe(CSVal.PENDING);
    expect(snapshot.version).toBe(version);
    expect(await getEquipmentStatus(page, lenderTmToken, RBAC_EQUIP)).toBe(ESVal.AVAILABLE);

    // RENTAL scope 검사는 lender 팀 기준이므로 cancel 은 lender TM 토큰으로 수행.
    const cancelResp = await cancelCheckoutAsUser(page, lenderTmToken, id, snapshot.version);
    expect(cancelResp.ok()).toBeTruthy();
  });

  test('S23-03: 다른 사이트 TM(Uiwang) 승인 → 403', async ({ techManagerPage: page }) => {
    const requesterToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TEST_ENGINEER_SUWON_GENERAL_EMC
    );
    const { id, version } = await createPendingRentalCheckout(page, requesterToken, {
      equipmentId: RBAC_EQUIP,
      lenderTeamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
      lenderSiteId: SiteEnum.enum.suwon,
    });

    const otherSiteToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TECHNICAL_MANAGER_UIWANG
    );
    const response = await approveCheckoutAsUser(page, otherSiteToken, id, version);
    expect(response.status()).toBe(403);

    const lenderTmToken = await getBackendToken(page, 'technical_manager');
    const snapshot = await getCheckoutSnapshot(page, lenderTmToken, id);
    expect(snapshot.status).toBe(CSVal.PENDING);

    // RENTAL scope 검사는 lender 팀 기준이므로 cancel 은 lender TM 토큰으로 수행.
    const cancelResp = await cancelCheckoutAsUser(page, lenderTmToken, id, snapshot.version);
    expect(cancelResp.ok()).toBeTruthy();
  });

  test('S23-04: 다른 팀 TM 반려 → 403', async ({ techManagerPage: page }) => {
    const requesterToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TEST_ENGINEER_SUWON_GENERAL_EMC
    );
    const { id, version } = await createPendingRentalCheckout(page, requesterToken, {
      equipmentId: RBAC_EQUIP,
      lenderTeamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
      lenderSiteId: SiteEnum.enum.suwon,
    });

    const otherTeamToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TECHNICAL_MANAGER_SUWON_GENERAL_EMC
    );
    const response = await rejectCheckoutAsUser(
      page,
      otherTeamToken,
      id,
      version,
      'cross-team reject should be blocked'
    );
    expect(response.status()).toBe(403);

    const lenderTmToken = await getBackendToken(page, 'technical_manager');
    const snapshot = await getCheckoutSnapshot(page, lenderTmToken, id);
    expect(snapshot.status).toBe(CSVal.PENDING);

    // RENTAL scope 검사는 lender 팀 기준이므로 cancel 은 lender TM 토큰으로 수행.
    const cancelResp = await cancelCheckoutAsUser(page, lenderTmToken, id, snapshot.version);
    expect(cancelResp.ok()).toBeTruthy();
  });

  test('S23-05: CALIBRATION 은 lenderTeamId 체크 우회 (회귀 방지)', async ({
    techManagerPage: page,
  }) => {
    const requesterToken = await getBackendToken(page, 'test_engineer');
    const { id, version } = await createPendingCalibrationCheckout(page, requesterToken, {
      equipmentId: RBAC_EQUIP,
    });

    // lender 팀 TM(=자기 팀 TM)이 승인 가능해야 함. CALIBRATION 은 lenderTeamId 없음.
    const lenderTmToken = await getBackendToken(page, 'technical_manager');
    const response = await approveCheckoutAsUser(page, lenderTmToken, id, version);
    expect(response.status()).toBe(200);

    const snapshot = await getCheckoutSnapshot(page, lenderTmToken, id);
    expect(snapshot.status).toBe(CSVal.APPROVED);
  });

  test('S23-06: 권한 실패 후 올바른 lender TM 승인 정상 (상태 오염 없음)', async ({
    techManagerPage: page,
  }) => {
    const requesterToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TEST_ENGINEER_SUWON_GENERAL_EMC
    );
    const { id, version } = await createPendingRentalCheckout(page, requesterToken, {
      equipmentId: RBAC_EQUIP,
      lenderTeamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
      lenderSiteId: SiteEnum.enum.suwon,
    });

    // 1) Wrong team → 403
    const wrongToken = await getBackendTokenByEmail(
      page,
      TEST_USER_EMAILS.TECHNICAL_MANAGER_SUWON_GENERAL_EMC
    );
    const wrongResp = await approveCheckoutAsUser(page, wrongToken, id, version);
    expect(wrongResp.status()).toBe(403);

    // 2) Correct lender TM → 200, version +1
    const lenderTmToken = await getBackendToken(page, 'technical_manager');
    const okResp = await approveCheckoutAsUser(page, lenderTmToken, id, version);
    expect(okResp.status()).toBe(200);

    const snapshot = await getCheckoutSnapshot(page, lenderTmToken, id);
    expect(snapshot.status).toBe(CSVal.APPROVED);
    expect(snapshot.version).toBe(version + 1);
  });
});
