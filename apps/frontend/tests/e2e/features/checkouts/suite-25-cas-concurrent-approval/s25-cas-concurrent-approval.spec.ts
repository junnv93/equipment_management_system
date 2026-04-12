/**
 * Suite 25: CAS Concurrent Approval (Checkout + Equipment Import)
 *
 * checkouts.service.ts 와 equipment-imports.service.ts 의 `updateWithVersion` CAS 보장:
 *   - Promise.allSettled 로 동시 두 건 approve → 정확히 1 success / 1 409
 *   - 409 body: { code: 'VERSION_CONFLICT', currentVersion, expectedVersion }
 *   - 최종 DB version = initial + 1 (정확히 1회)
 *
 * race-condition.spec.ts (P0-RACE-01/02) 가 CAS 기본을 이미 커버하므로
 * 본 스위트는 "서로 다른 역할" 경합과 Equipment Import 도메인을 추가 검증한다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal, ErrorCode } from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS, BASE_URLS } from '../../../shared/constants/shared-test-data';
import {
  getBackendToken,
  createPendingCalibrationCheckout,
  approveCheckoutAsUser,
  getCheckoutSnapshot,
  createPendingEquipmentImport,
  resetEquipmentToAvailable,
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  cleanupCheckoutPool,
  getCheckoutPool,
} from '../helpers/checkout-helpers';

// ErrorCode.VersionConflict 는 packages/schemas/errors.ts 의 SSOT.
// 백엔드 VersionedBaseService 와 프론트엔드/E2E 헬퍼가 모두 이 값을 참조한다.
const VERSION_CONFLICT_CODE = ErrorCode.VersionConflict;

// equipment_imports.status 는 CheckoutStatus 와 enum 자체는 다르지만 'canceled' 리터럴을 공유.
// @see apps/backend/src/modules/equipment-imports 의 status enum
const IMPORT_STATUS_CANCELED = CSVal.CANCELED;

// FCC EMC/RF 팀 장비 (test_engineer 자기 팀 → CAL 허용).
// 전용 장비 — 병렬 실행 시 다른 suite와 충돌 방지 (test data partitioning).
const EQUIP = TEST_EQUIPMENT_IDS.CAS_ANALYZER_SUW_E;

test.describe('Suite 25: CAS Concurrent Approval', () => {
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

  // APPROVED 잔존물이 후속 create 를 차단하지 못하게 각 테스트 후 장비 복구.
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

  test('S25-01: TM + LM 동시 approve → 1 success / 1 409', async ({ techManagerPage: page }) => {
    const requesterToken = await getBackendToken(page, 'test_engineer');
    const { id, version } = await createPendingCalibrationCheckout(page, requesterToken, {
      equipmentId: EQUIP,
    });

    const tmToken = await getBackendToken(page, 'technical_manager');
    const lmToken = await getBackendToken(page, 'lab_manager');

    const [r1, r2] = await Promise.allSettled([
      approveCheckoutAsUser(page, tmToken, id, version),
      approveCheckoutAsUser(page, lmToken, id, version),
    ]);

    const fulfilled = [r1, r2].filter(
      (r): r is PromiseFulfilledResult<import('@playwright/test').APIResponse> =>
        r.status === 'fulfilled'
    );
    expect(fulfilled).toHaveLength(2);

    const ok = fulfilled.filter((r) => r.value.ok());
    const conflict = fulfilled.filter((r) => r.value.status() === 409);
    expect(ok).toHaveLength(1);
    expect(conflict).toHaveLength(1);

    // S25-02: 409 body 스키마 검증
    const conflictBody = await conflict[0].value.json();
    expect(conflictBody).toMatchObject({
      code: VERSION_CONFLICT_CODE,
      currentVersion: version + 1,
      expectedVersion: version,
    });

    // S25-03: 최종 version = initial + 1 (정확히 1회)
    const snapshot = await getCheckoutSnapshot(page, tmToken, id);
    expect(snapshot.status).toBe(CSVal.APPROVED);
    expect(snapshot.version).toBe(version + 1);
  });

  test('S25-06: 순차 approve 2회 경계 (2번째 409)', async ({ techManagerPage: page }) => {
    const requesterToken = await getBackendToken(page, 'test_engineer');
    const { id, version } = await createPendingCalibrationCheckout(page, requesterToken, {
      equipmentId: EQUIP,
    });

    const tmToken = await getBackendToken(page, 'technical_manager');
    const first = await approveCheckoutAsUser(page, tmToken, id, version);
    expect(first.ok()).toBeTruthy();

    // 동일 (stale) version 으로 2번째 approve → 409 또는 400 (이미 APPROVED).
    // CAS 규약상 409 가 우선되나, 상태 검사가 앞설 수도 있어 둘 다 허용 + 최종 상태만 고정.
    const second = await approveCheckoutAsUser(page, tmToken, id, version);
    expect([400, 409]).toContain(second.status());

    const snapshot = await getCheckoutSnapshot(page, tmToken, id);
    expect(snapshot.status).toBe(CSVal.APPROVED);
    expect(snapshot.version).toBe(version + 1);
  });
});

test.describe('Suite 25 (Equipment Import): CAS Concurrent Approval', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Backend integration — chromium project only');
  });

  const createdImportIds: string[] = [];

  test.afterAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    if (createdImportIds.length > 0) {
      const pool = getCheckoutPool();
      for (const id of createdImportIds) {
        await pool
          .query(`UPDATE equipment_imports SET status = $2, updated_at = NOW() WHERE id = $1`, [
            id,
            IMPORT_STATUS_CANCELED,
          ])
          .catch(() => {
            /* ignore */
          });
      }
    }
    await cleanupCheckoutPool();
  });

  test('S25-04: Equipment Import 동시 approve → 1 success / 1 409', async ({
    techManagerPage: page,
  }) => {
    const requesterToken = await getBackendToken(page, 'technical_manager');
    const { id, version } = await createPendingEquipmentImport(page, requesterToken);
    createdImportIds.push(id);

    const tmToken = requesterToken;
    const lmToken = await getBackendToken(page, 'lab_manager');

    const approveUrl = (importId: string) =>
      `${BASE_URLS.BACKEND}/api/equipment-imports/${importId}/approve`;

    const [r1, r2] = await Promise.allSettled([
      page.request.patch(approveUrl(id), {
        headers: { Authorization: `Bearer ${tmToken}`, 'Content-Type': 'application/json' },
        data: { version },
      }),
      page.request.patch(approveUrl(id), {
        headers: { Authorization: `Bearer ${lmToken}`, 'Content-Type': 'application/json' },
        data: { version },
      }),
    ]);

    const fulfilled = [r1, r2].filter(
      (r): r is PromiseFulfilledResult<import('@playwright/test').APIResponse> =>
        r.status === 'fulfilled'
    );
    expect(fulfilled).toHaveLength(2);

    const ok = fulfilled.filter((r) => r.value.ok());
    // equipment_imports.approve 는 updateWithVersion WHERE 절에 status=PENDING
    // precondition 을 병합하므로, 동시 요청 중 후행자는 결정적으로 409(VERSION_CONFLICT)
    // 를 받는다. (CasPrecondition 병합 전에는 400/409 비결정적 — 2026-04-09 수정)
    const loser = fulfilled.filter((r) => !r.value.ok());
    expect(ok).toHaveLength(1);
    expect(loser).toHaveLength(1);
    expect(loser[0].value.status()).toBe(409);

    const loserBody = await loser[0].value.json();
    expect(loserBody).toMatchObject({
      code: VERSION_CONFLICT_CODE,
      currentVersion: version + 1,
      expectedVersion: version,
    });
  });
});

test.describe('Suite 25 (UI): CAS Concurrent Approval — UI auto-retry', () => {
  test('S25-05: UI 후행자 toast/dialog 확인', async () => {
    test.fixme(
      true,
      'UI auto-retry (version conflict toast/dialog) 는 현재 미구현 — ' +
        'race-condition.spec.ts P2-UI-01/02 과 동일한 조건으로 묶여 있음. Phase 3 에서 활성화.'
    );
  });
});
