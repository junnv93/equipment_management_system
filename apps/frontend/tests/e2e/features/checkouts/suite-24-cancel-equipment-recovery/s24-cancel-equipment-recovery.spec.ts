/**
 * Suite 24: Cancel vs Equipment Status Recovery
 *
 * 도메인 규칙 (checkouts.service.ts:2161):
 *   `checkouts.service.cancel` 은 status === PENDING 만 허용 (그 외 400).
 *   따라서 "APPROVED/CHECKED_OUT cancel → 복구" 가설은 도메인 레벨에서 성립하지 않음.
 *
 * 본 스위트는 실제 도메인 규칙을 고정하고 회귀를 방지한다:
 *   - PENDING cancel 은 성공하고, equipment 상태는 변화 없음 (원래 AVAILABLE 유지)
 *   - APPROVED cancel 은 400 (비즈니스 로직) 이고 equipment 상태 변화 없음
 *   - stale version cancel 은 409 (CAS) 이고 equipment 상태 변화 없음
 *   - cancel 후 동일 장비로 새 checkout 생성 가능 (stuck 방지)
 *
 * CHECKED_OUT cancel "복구" 케이스는 도메인 규칙상 미지원 → test.fixme.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import {
  getBackendToken,
  createPendingCalibrationCheckout,
  approveCheckoutAsUser,
  cancelCheckoutAsUser,
  getCheckoutSnapshot,
  getEquipmentStatus,
  resetEquipmentToAvailable,
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

// FCC EMC/RF 팀 장비 (test_engineer 자기 팀 → CAL 허용).
// race-condition.spec.ts / s23 / s25 와 겹치지 않도록 EMC_RECEIVER_SUW_E 선택.
const EQUIP = TEST_EQUIPMENT_IDS.EMC_RECEIVER_SUW_E;

test.describe('Suite 24: Cancel vs Equipment Status Recovery', () => {
  test.describe.configure({ mode: 'serial' });
  // 백엔드 통합 테스트 (브라우저 무관) — 다중 project 병렬 시 공용 장비 충돌 방지를
  // 위해 chromium 에서만 실행.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Backend integration — chromium project only');
  });

  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(EQUIP);
    await resetEquipmentToAvailable(EQUIP);
    await clearBackendCache();
  });

  // 각 테스트 종료 시 장비 복구 — APPROVED 잔존물이 후속 create 를
  // CHECKOUT_EQUIPMENT_ALREADY_ACTIVE 로 차단하지 못하게 한다.
  test.afterEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(EQUIP);
    await resetEquipmentToAvailable(EQUIP);
    await clearBackendCache();
  });

  test.afterAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(EQUIP);
    await resetEquipmentToAvailable(EQUIP);
    await clearBackendCache();
    await cleanupCheckoutPool();
  });

  test('S24-01: PENDING cancel → equipment AVAILABLE 유지', async ({ techManagerPage: page }) => {
    // test_engineer 에게는 CANCEL_CHECKOUT 권한이 없어 technical_manager 로 수행.
    const token = await getBackendToken(page, 'technical_manager');
    const { id, version } = await createPendingCalibrationCheckout(page, token, {
      equipmentId: EQUIP,
    });
    expect(await getEquipmentStatus(page, token, EQUIP)).toBe(ESVal.AVAILABLE);

    const cancelResp = await cancelCheckoutAsUser(page, token, id, version);
    expect(cancelResp.ok()).toBeTruthy();

    const snapshot = await getCheckoutSnapshot(page, token, id);
    expect(snapshot.status).toBe(CSVal.CANCELED);
    expect(snapshot.version).toBe(version + 1);
    expect(await getEquipmentStatus(page, token, EQUIP)).toBe(ESVal.AVAILABLE);
  });

  test('S24-02: APPROVED cancel → 400, 상태 변화 없음', async ({ techManagerPage: page }) => {
    const tmToken = await getBackendToken(page, 'technical_manager');
    const { id, version } = await createPendingCalibrationCheckout(page, tmToken, {
      equipmentId: EQUIP,
    });

    const approveResp = await approveCheckoutAsUser(page, tmToken, id, version);
    expect(approveResp.ok()).toBeTruthy();
    await clearBackendCache();

    const postApprove = await getCheckoutSnapshot(page, tmToken, id);
    expect(postApprove.status).toBe(CSVal.APPROVED);

    const cancelResp = await cancelCheckoutAsUser(page, tmToken, id, postApprove.version);
    expect(cancelResp.status()).toBe(400);

    const after = await getCheckoutSnapshot(page, tmToken, id);
    expect(after.status).toBe(CSVal.APPROVED);
    expect(after.version).toBe(postApprove.version);
    expect(await getEquipmentStatus(page, tmToken, EQUIP)).toBe(ESVal.AVAILABLE);
  });

  test('S24-03: CHECKED_OUT cancel → 복구 (도메인 규칙상 미지원)', async () => {
    test.fixme(
      true,
      'checkouts.service.cancel 은 PENDING 만 허용 — CHECKED_OUT 취소 경로는 ' +
        '현재 도메인에 존재하지 않음. 설계 변경 시 재활성화.'
    );
  });

  test('S24-04: cancel 후 동일 장비 새 checkout 생성 가능', async ({ techManagerPage: page }) => {
    // test_engineer 에게는 CANCEL_CHECKOUT 권한이 없어 technical_manager 로 수행.
    const token = await getBackendToken(page, 'technical_manager');
    const first = await createPendingCalibrationCheckout(page, token, { equipmentId: EQUIP });
    const cancelResp = await cancelCheckoutAsUser(page, token, first.id, first.version);
    expect(cancelResp.ok()).toBeTruthy();
    await clearBackendCache();

    const second = await createPendingCalibrationCheckout(page, token, { equipmentId: EQUIP });
    expect(second.id).not.toBe(first.id);

    const secondSnapshot = await getCheckoutSnapshot(page, token, second.id);
    expect(secondSnapshot.status).toBe(CSVal.PENDING);

    const cleanupResp = await cancelCheckoutAsUser(page, token, second.id, second.version);
    expect(cleanupResp.ok()).toBeTruthy();
  });

  test('S24-05: stale version cancel → 409, 상태 변화 없음', async ({ techManagerPage: page }) => {
    // test_engineer 에게는 CANCEL_CHECKOUT 권한이 없어 technical_manager 로 수행.
    const token = await getBackendToken(page, 'technical_manager');
    const { id, version } = await createPendingCalibrationCheckout(page, token, {
      equipmentId: EQUIP,
    });

    const staleResp = await cancelCheckoutAsUser(page, token, id, version + 5);
    expect(staleResp.status()).toBe(409);

    const after = await getCheckoutSnapshot(page, token, id);
    expect(after.status).toBe(CSVal.PENDING);
    expect(after.version).toBe(version);
    expect(await getEquipmentStatus(page, token, EQUIP)).toBe(ESVal.AVAILABLE);

    const cleanupResp = await cancelCheckoutAsUser(page, token, id, after.version);
    expect(cleanupResp.ok()).toBeTruthy();
  });

  test('S24-06: cancel 성공 → status=CANCELED, version +1', async ({ techManagerPage: page }) => {
    // test_engineer 에게는 CANCEL_CHECKOUT 권한이 없어 technical_manager 로 수행.
    const token = await getBackendToken(page, 'technical_manager');
    const { id, version } = await createPendingCalibrationCheckout(page, token, {
      equipmentId: EQUIP,
    });

    const cancelResp = await cancelCheckoutAsUser(page, token, id, version);
    expect(cancelResp.ok()).toBeTruthy();

    const snapshot = await getCheckoutSnapshot(page, token, id);
    expect(snapshot.status).toBe(CSVal.CANCELED);
    expect(snapshot.version).toBe(version + 1);
  });

  test('S24-07: 동일 장비 복수 PENDING 부분 취소 (도메인 규칙상 N/A)', async () => {
    test.fixme(
      true,
      '한 장비는 active checkout 1개만 허용 (CHECKOUT_EQUIPMENT_ALREADY_ACTIVE). ' +
        '복수 PENDING 시나리오는 구성 불가.'
    );
  });
});
