/**
 * Suite 26: Shared Equipment Workflow (공용장비 전용 워크플로우)
 *
 * 핵심 발견 (Planner 조사):
 *   `checkouts.service.ts` 에는 `isShared` 분기가 **0개**. 공용장비는 표준 체크아웃
 *   파이프라인을 그대로 탄다. 따라서 본 스위트는 "공용장비 전용 워크플로우" 가
 *   아닌 **characterization + regression lock** 이다:
 *
 *   1) 목록 필터 정확성 (`equipment.service.ts:230` 의 isShared=true 필터)
 *   2) 공용장비 표준 생명주기 (PENDING→APPROVED→CHECKED_OUT→RETURNED→RETURN_APPROVED)
 *   3) PENDING 거절 시 equipment.status 불변 (공용 풀 "no-hold" 불변식)
 *   4) 거절 후 동일 장비 즉시 재체크아웃 가능 (stuck 방지)
 *   5) 크로스사이트 목록 스코프 (Uiwang 공용장비가 Suwon scope 에서 제외)
 *   6) overdue 자동 전이 — 스케줄러 HTTP 트리거 없음 → test.fixme
 *
 * 실행: chromium project 전용 (firefox/webkit host lib 이슈 — 18+ 선례)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import {
  getBackendToken,
  createPendingSharedCheckout,
  listSharedEquipment,
  approveCheckoutAsUser,
  rejectCheckoutAsUser,
  apiStartCheckout,
  apiReturnCheckout,
  apiApproveReturn,
  getCheckoutSnapshot,
  getEquipmentStatus,
  resetEquipmentToAvailable,
  cancelAllActiveCheckoutsForEquipment,
  clearBackendCache,
  cleanupCheckoutPool,
} from '../helpers/checkout-helpers';

// 공용장비 (isShared=true) 풀 — shared-test-data.ts SSOT.
// 전용 공용장비 — 병렬 실행 시 다른 suite와 충돌 방지 (test data partitioning).
// SHARED_ANALYZER_SUW_E (eeee100c): FCC_EMC_RF_SUWON, suwon, is_shared=true, available — S26 전용
// RECEIVER_UIW_W (eeee5001): Uiwang site, is_shared=true — cross-site filter 케이스 (read-only)
const PRIMARY_SHARED = TEST_EQUIPMENT_IDS.SHARED_ANALYZER_SUW_E;
const UIWANG_SHARED_REF = TEST_EQUIPMENT_IDS.RECEIVER_UIW_W;
// 비공용 reference — S26-01 negative assertion 용
const NON_SHARED = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('Suite 26: Shared Equipment Workflow', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Backend integration — chromium project only');
  });

  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(PRIMARY_SHARED);
    await resetEquipmentToAvailable(PRIMARY_SHARED);
    await clearBackendCache();
  });

  test.afterEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(PRIMARY_SHARED);
    await resetEquipmentToAvailable(PRIMARY_SHARED);
    await clearBackendCache();
  });

  test.afterAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    await cancelAllActiveCheckoutsForEquipment(PRIMARY_SHARED);
    await resetEquipmentToAvailable(PRIMARY_SHARED);
    await clearBackendCache();
    await cleanupCheckoutPool();
  });

  test('S26-01: GET /equipment?isShared=true 는 공용장비만 반환한다', async ({
    techManagerPage: page,
  }) => {
    // technical_manager 는 suwon 소속 — 사이트 스코프 인터셉터가 uiwang 장비를
    // 자동 필터하므로 suwon 공용 장비만 보인다. 전역 cross-site 확인은 S26-05 가 담당.
    const token = await getBackendToken(page, 'technical_manager');
    const items = await listSharedEquipment(page, token);

    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.every((e) => e.isShared === true)).toBe(true);

    const ids = new Set(items.map((e) => e.id));
    expect(ids.has(PRIMARY_SHARED)).toBe(true);
    // Negative assertion: 비공용 장비는 filter 결과에서 제외
    expect(ids.has(NON_SHARED)).toBe(false);
  });

  test('S26-02: 공용장비 전체 생명주기 PENDING → APPROVED → CHECKED_OUT → RETURNED → RETURN_APPROVED', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // Pre: equipment AVAILABLE
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);

    // 1. Create (PENDING) — equipment 는 여전히 AVAILABLE (hold 없음)
    const { id, version } = await createPendingSharedCheckout(page, token, {
      equipmentId: PRIMARY_SHARED,
    });
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);

    // 2. Approve (APPROVED) — equipment 여전히 AVAILABLE (suite-24 에서도 확인됨)
    const approveResp = await approveCheckoutAsUser(page, token, id, version);
    expect(approveResp.ok()).toBeTruthy();
    await clearBackendCache();
    const afterApprove = await getCheckoutSnapshot(page, token, id);
    expect(afterApprove.status).toBe(CSVal.APPROVED);
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);

    // 3. Start (CHECKED_OUT) — equipment → CHECKED_OUT 전이 (`checkouts.service.ts:1541`)
    const startResult = await apiStartCheckout(page, id, 'technical_manager');
    expect(startResult.response.ok()).toBeTruthy();
    await clearBackendCache();
    const afterStart = await getCheckoutSnapshot(page, token, id);
    expect(afterStart.status).toBe(CSVal.CHECKED_OUT);
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.CHECKED_OUT);

    // 4. Return request (RETURNED) — equipment 는 아직 CHECKED_OUT 유지
    // (최종 승인 후 해제 — `checkouts.service.ts:1697` 주석 참고)
    // CAL purpose: calibrationChecked 필수 (`checkouts.service.ts:1639`)
    const returnResult = await apiReturnCheckout(
      page,
      id,
      { workingStatusChecked: true, calibrationChecked: true },
      'technical_manager'
    );
    expect(returnResult.response.ok()).toBeTruthy();
    await clearBackendCache();
    const afterReturn = await getCheckoutSnapshot(page, token, id);
    expect(afterReturn.status).toBe(CSVal.RETURNED);
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.CHECKED_OUT);

    // 5. Approve return (RETURN_APPROVED) — equipment → AVAILABLE 복원
    // (`checkouts.service.ts:1783-1788`)
    const approveReturnResult = await apiApproveReturn(page, id, 'technical_manager');
    expect(approveReturnResult.response.ok()).toBeTruthy();
    await clearBackendCache();
    const afterApproveReturn = await getCheckoutSnapshot(page, token, id);
    expect(afterApproveReturn.status).toBe(CSVal.RETURN_APPROVED);
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);
  });

  test('S26-03: 공용장비 PENDING 거절 — equipment 상태 불변 (no-hold 불변식)', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);

    const { id, version } = await createPendingSharedCheckout(page, token, {
      equipmentId: PRIMARY_SHARED,
    });
    // PENDING 시점에도 equipment 는 AVAILABLE — `checkouts.service.ts` 는
    // PENDING 에서 equipment.status 를 건드리지 않는다.
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);

    const rejectResp = await rejectCheckoutAsUser(page, token, id, version, '불필요');
    expect(rejectResp.ok()).toBeTruthy();
    await clearBackendCache();

    const snapshot = await getCheckoutSnapshot(page, token, id);
    expect(snapshot.status).toBe(CSVal.REJECTED);
    // 핵심 불변식: reject 후에도 equipment 는 여전히 AVAILABLE
    // (`checkouts.service.ts:1415 reject()` 는 equipment.status 를 변경하지 않는다)
    expect(await getEquipmentStatus(page, token, PRIMARY_SHARED)).toBe(ESVal.AVAILABLE);
  });

  test('S26-04: 거절 후 동일 공용장비로 즉시 재체크아웃 가능', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // 첫 번째 checkout 생성 후 즉시 거절
    const first = await createPendingSharedCheckout(page, token, { equipmentId: PRIMARY_SHARED });
    const rejectResp = await rejectCheckoutAsUser(page, token, first.id, first.version, '취소');
    expect(rejectResp.ok()).toBeTruthy();
    await clearBackendCache();

    // 동일 장비로 두 번째 checkout 생성 — CHECKOUT_EQUIPMENT_ALREADY_ACTIVE 에 막히지 않아야 함
    const second = await createPendingSharedCheckout(page, token, {
      equipmentId: PRIMARY_SHARED,
    });
    expect(second.id).not.toBe(first.id);

    const secondSnapshot = await getCheckoutSnapshot(page, token, second.id);
    expect(secondSnapshot.status).toBe(CSVal.PENDING);
  });

  test('S26-05: 공용장비 cross-site 목록 스코프 — system_admin 이 site=suwon 필터 시 Uiwang 장비 제외', async ({
    siteAdminPage: page,
  }) => {
    // system_admin 은 cross-site 가시성 → 전역 공용 목록에서 uiwang 장비 포함 확인,
    // 그 다음 ?site=suwon 필터 적용 시 uiwang 장비가 제외되는지 검증.
    const token = await getBackendToken(page, 'system_admin');

    const allShared = await listSharedEquipment(page, token);
    const allIds = new Set(allShared.map((e) => e.id));
    expect(allIds.has(PRIMARY_SHARED)).toBe(true);
    expect(allIds.has(UIWANG_SHARED_REF)).toBe(true);

    const suwonShared = await listSharedEquipment(page, token, 'suwon');
    expect(suwonShared.length).toBeGreaterThan(0);
    expect(suwonShared.every((e) => e.isShared === true)).toBe(true);
    expect(suwonShared.every((e) => e.site === 'suwon')).toBe(true);

    const suwonIds = new Set(suwonShared.map((e) => e.id));
    expect(suwonIds.has(PRIMARY_SHARED)).toBe(true);
    expect(suwonIds.has(UIWANG_SHARED_REF)).toBe(false);
  });

  // 공용장비 overdue 자동 전이는 `CheckoutOverdueScheduler` (@Cron EVERY_HOUR +
  // onModuleInit) 가 처리한다. HTTP 트리거가 노출되어 있지 않아 E2E 가 test 내에서
  // 강제 실행할 수 없음 — wf-17-checkout-overdue-return 스위트에서 간접 커버.
  // @see apps/backend/src/modules/notifications/schedulers/checkout-overdue-scheduler.ts:60
  test('S26-06: 공용장비 overdue 자동 전이', async () => {
    test.fixme(
      true,
      'CheckoutOverdueScheduler 는 cron-only (HTTP 트리거 없음) — E2E 내 force-run 불가. ' +
        'wf-17-checkout-overdue-return 이 간접적으로 커버. ' +
        '설계 변경으로 admin trigger endpoint 추가 시 활성화.'
    );
  });
});
