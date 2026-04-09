/**
 * Suite 27: Equipment Import Auto Checkout Tracking
 *
 * **WF-13 과의 관계**: WF-13 은 happy path (create → approve → receive → initiate-return
 *   → auto-checkout lifecycle → returned) 를 full cycle 로 검증한다. Suite-27 은 WF-13 이
 *   빠뜨린 **targeted assertions** 를 보강한다:
 *     (a) `returnCheckoutId` 링크 무결성 + destination=vendorName 검증
 *     (b) 최종 `equipment.status === inactive` gate
 *     (c) 권한 실패 (quality_manager → 403)
 *     (d) 상태 불일치 (pending → 400 IMPORT_ONLY_RECEIVED_CAN_RETURN)
 *     (e) CAS version conflict (stale version → 409 VersionConflict)
 *
 * 백엔드 앵커:
 *   - initiateReturn: `equipment-imports.service.ts:574`
 *   - auto-checkout 생성: `equipment-imports.service.ts:650`
 *   - returnCheckoutId 링크: `equipment-imports.service.ts:694`
 *   - onReturnCompleted (import → returned + equipment → inactive): `equipment-imports.service.ts:760`
 *
 * 실행: chromium project 전용 (firefox/webkit host lib 이슈 — 18+ 선례)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
  EquipmentImportStatusValues as EISVal,
} from '@equipment-management/schemas';
import {
  getBackendToken,
  createPendingEquipmentImport,
  createReceivedRentalImport,
  requestImportReturn,
  getImportSnapshot,
  approveCheckoutAsUser,
  apiStartCheckout,
  apiReturnCheckout,
  apiApproveReturn,
  getCheckoutSnapshot,
  getEquipmentStatus,
  clearBackendCache,
  cleanupCheckoutPool,
  getCheckoutPool,
} from '../helpers/checkout-helpers';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';

test.describe('Suite 27: Equipment Import Auto Checkout Tracking', () => {
  test.describe.configure({ mode: 'serial' });

  const createdImportIds: string[] = [];

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Backend integration — chromium project only');
  });

  test.afterAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    // Best-effort cleanup: mark any created import as canceled directly in DB
    // (상태에 따라 cancel 불가할 수 있으므로 ignore 처리)
    const pool = getCheckoutPool();
    for (const id of createdImportIds) {
      await pool
        .query(
          `UPDATE equipment_imports SET status = 'canceled', updated_at = NOW() WHERE id = $1`,
          [id]
        )
        .catch(() => {
          /* ignore */
        });
    }
    await clearBackendCache();
    await cleanupCheckoutPool();
  });

  test('S27-01: received → return_requested 성공 시 purpose=return_to_vendor 자동 Checkout 생성', async ({
    techManagerPage: page,
  }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    const received = await createReceivedRentalImport(page, teToken);
    createdImportIds.push(received.importId);

    const resp = await requestImportReturn(page, received.importId, received.version);
    expect(resp.ok()).toBeTruthy();
    await clearBackendCache();

    const snapshot = await getImportSnapshot(page, received.importId);
    expect(snapshot.status).toBe(EISVal.RETURN_REQUESTED);
    expect(snapshot.returnCheckoutId).not.toBeNull();

    const autoCheckout = await getCheckoutSnapshot(
      page,
      teToken,
      snapshot.returnCheckoutId as string
    );
    expect(autoCheckout.status).toBe(CSVal.PENDING);

    // purpose + destination 검증 — raw GET 으로 필드 접근
    const tmToken = await getBackendToken(page, 'technical_manager');
    const detailResp = await page.request.get(
      `${BASE_URLS.BACKEND}/api/checkouts/${snapshot.returnCheckoutId}`,
      { headers: { Authorization: `Bearer ${tmToken}` } }
    );
    expect(detailResp.ok()).toBeTruthy();
    const detail = (await detailResp.json()) as { purpose?: string; destination?: string };
    expect(detail.purpose).toBe(CPVal.RETURN_TO_VENDOR);
    expect(detail.destination).toBe(received.vendorName);
  });

  test('S27-02: import.returnCheckoutId 링크 + equipment → AVAILABLE', async ({
    techManagerPage: page,
  }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    const received = await createReceivedRentalImport(page, teToken);
    createdImportIds.push(received.importId);

    const resp = await requestImportReturn(page, received.importId, received.version);
    expect(resp.ok()).toBeTruthy();
    await clearBackendCache();

    const snapshot = await getImportSnapshot(page, received.importId);
    expect(snapshot.returnCheckoutId).toBeTruthy();
    // `equipment-imports.service.ts:626-630` — receive 직후 장비는 reserved,
    // initiate-return 이후 AVAILABLE 로 전이
    expect(await getEquipmentStatus(page, teToken, received.equipmentId)).toBe(ESVal.AVAILABLE);
  });

  test('S27-03 + S27-04: auto-checkout full lifecycle → import=returned, equipment=inactive', async ({
    techManagerPage: page,
  }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    const tmToken = await getBackendToken(page, 'technical_manager');
    const received = await createReceivedRentalImport(page, teToken);
    createdImportIds.push(received.importId);

    // initiate-return → auto checkout
    const resp = await requestImportReturn(page, received.importId, received.version);
    expect(resp.ok()).toBeTruthy();
    await clearBackendCache();

    const afterInitiate = await getImportSnapshot(page, received.importId);
    const checkoutId = afterInitiate.returnCheckoutId as string;
    expect(checkoutId).toBeTruthy();

    // Drive auto-checkout: approve → start → return → approve-return
    const approveSnap = await getCheckoutSnapshot(page, tmToken, checkoutId);
    const approveResp = await approveCheckoutAsUser(page, tmToken, checkoutId, approveSnap.version);
    expect(approveResp.ok()).toBeTruthy();
    await clearBackendCache();

    const startResult = await apiStartCheckout(page, checkoutId, 'technical_manager');
    expect(startResult.response.ok()).toBeTruthy();
    await clearBackendCache();

    // return_to_vendor purpose — workingStatusChecked only (CAL/REPAIR 필드는 불필요)
    const returnResult = await apiReturnCheckout(
      page,
      checkoutId,
      { workingStatusChecked: true },
      'technical_manager'
    );
    expect(returnResult.response.ok()).toBeTruthy();
    await clearBackendCache();

    const approveReturnResult = await apiApproveReturn(page, checkoutId, 'technical_manager');
    expect(approveReturnResult.response.ok()).toBeTruthy();
    await clearBackendCache();

    // S27-03: import.status === returned
    const finalImport = await getImportSnapshot(page, received.importId);
    expect(finalImport.status).toBe(EISVal.RETURNED);

    // S27-04: equipment.status === inactive (`equipment-imports.service.ts:819`)
    expect(await getEquipmentStatus(page, tmToken, received.equipmentId)).toBe(ESVal.INACTIVE);
  });

  test('S27-05: 권한 실패 — quality_manager 의 initiate-return → 403', async ({
    techManagerPage: page,
  }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    const received = await createReceivedRentalImport(page, teToken);
    createdImportIds.push(received.importId);

    // quality_manager 는 CREATE_CHECKOUT 권한 없음 — `equipment-imports.controller.ts:189`
    const resp = await requestImportReturn(
      page,
      received.importId,
      received.version,
      'quality_manager'
    );
    expect(resp.status()).toBe(403);
  });

  test('S27-06: 상태 불일치 — pending 상태에서 initiate-return → 400 IMPORT_ONLY_RECEIVED_CAN_RETURN', async ({
    techManagerPage: page,
  }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    // approve/receive 없이 pending 상태 그대로
    const { id, version } = await createPendingEquipmentImport(page, teToken);
    createdImportIds.push(id);

    const resp = await requestImportReturn(page, id, version);
    expect(resp.status()).toBe(400);
    const body = (await resp.json()) as { code?: string };
    expect(body.code).toBe('IMPORT_ONLY_RECEIVED_CAN_RETURN');
  });

  test('S27-07: stale version → 409 ErrorCode.VersionConflict', async ({
    techManagerPage: page,
  }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    const received = await createReceivedRentalImport(page, teToken);
    createdImportIds.push(received.importId);

    // 1회차: 성공
    const first = await requestImportReturn(page, received.importId, received.version);
    expect(first.ok()).toBeTruthy();
    await clearBackendCache();

    // 2회차: 동일 stale version 재전송 → CasPrecondition 원자화 적용으로
    // 409(VERSION_CONFLICT) 결정적 반환. status=RECEIVED precondition 이
    // updateWithVersion WHERE 절에 병합되어 findOne 선검사 윈도우 없음.
    const second = await requestImportReturn(page, received.importId, received.version);
    expect(second.status()).toBe(409);
  });

  test('S27-08: auto-checkout cancel → import 롤백', async ({ techManagerPage: page }) => {
    const teToken = await getBackendToken(page, 'test_engineer');
    const received = await createReceivedRentalImport(page, teToken);
    createdImportIds.push(received.importId);

    // 1. 반납 요청: import → return_requested + auto-checkout 생성
    const returnResp = await requestImportReturn(page, received.importId, received.version);
    expect(returnResp.ok()).toBeTruthy();
    const returnBody = (await returnResp.json()) as { returnCheckoutId?: string; version: number };
    await clearBackendCache();

    // 2. import 가 return_requested 인지 확인
    const snapshot1 = await getImportSnapshot(page, received.importId);
    expect(snapshot1.status).toBe(EISVal.RETURN_REQUESTED);

    // 3. auto-checkout 을 찾아서 cancel
    const checkoutId = returnBody.returnCheckoutId ?? snapshot1.returnCheckoutId;
    expect(checkoutId).toBeTruthy();

    const checkoutSnap = await getCheckoutSnapshot(page, checkoutId!);
    expect(checkoutSnap.status).toBe(CSVal.PENDING);

    // TM 토큰으로 checkout cancel API 호출
    const tmToken = await getBackendToken(page, 'technical_manager');
    const cancelResp = await page.request.patch(
      `${BASE_URLS.BACKEND}/api/checkouts/${checkoutId}/cancel`,
      {
        headers: { Authorization: `Bearer ${tmToken}` },
        data: { version: checkoutSnap.version },
      }
    );
    expect(cancelResp.ok()).toBeTruthy();
    await clearBackendCache();

    // 4. import 가 received 로 롤백되었는지 확인
    const snapshot2 = await getImportSnapshot(page, received.importId);
    expect(snapshot2.status).toBe(EISVal.RECEIVED);
    expect(snapshot2.returnCheckoutId).toBeNull();
  });
});
