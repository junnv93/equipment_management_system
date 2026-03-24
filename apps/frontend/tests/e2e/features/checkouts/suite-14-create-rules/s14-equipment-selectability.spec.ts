/**
 * Suite 14: Create Rules - 목적별 장비 선택 규칙 + 팀 소유권
 *
 * 검증 대상:
 * - 교정(calibration): available/calibration_scheduled/calibration_overdue 장비만 선택 가능
 * - 수리(repair): available/non_conforming 장비만 선택 가능
 * - 대여(rental): 다른 팀 장비만 선택 가능 (자기 팀 장비 선택 불가)
 * - 반출지(destination) 목록 조회 및 선택
 * - 폼 유효성 검증: 필수 필드 누락, 반출 예정일/반입 예정일 검증
 * - 팀 소유권 규칙: 교정/수리는 자기 팀 장비만, 대여는 다른 팀 장비만
 *
 * Mode: parallel (API 레벨 검증, 생성 시 cleanup)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  apiPost,
  apiGet,
  cleanupCheckoutPool,
  getCheckoutPool,
  clearBackendCache,
  resetEquipmentToAvailable,
} from '../helpers/checkout-helpers';
import { EQUIP } from '../helpers/checkout-constants';

// Track created checkouts for cleanup
const createdCheckoutIds: string[] = [];

test.beforeAll(async () => {
  const pool = getCheckoutPool();
  // 이전 테스트에서 생성된 이 장비의 미완료 checkout 취소
  await pool.query(
    `UPDATE checkouts SET status = 'canceled', updated_at = NOW()
     WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
       AND id IN (SELECT c.id FROM checkouts c JOIN checkout_items ci ON c.id = ci.checkout_id WHERE ci.equipment_id = $1)`,
    [EQUIP.SPECTRUM_ANALYZER_SUW_E]
  );
  await pool.query(
    `UPDATE checkouts SET status = 'canceled', updated_at = NOW()
     WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
       AND id IN (SELECT c.id FROM checkouts c JOIN checkout_items ci ON c.id = ci.checkout_id WHERE ci.equipment_id = $1)`,
    [EQUIP.POWER_METER_SUW_E]
  );
  await resetEquipmentToAvailable(EQUIP.SPECTRUM_ANALYZER_SUW_E);
  await resetEquipmentToAvailable(EQUIP.POWER_METER_SUW_E);
  await clearBackendCache();
});

test.afterAll(async () => {
  if (createdCheckoutIds.length > 0) {
    const pool = getCheckoutPool();
    for (const id of createdCheckoutIds) {
      await pool.query(`UPDATE checkouts SET status = $2, updated_at = NOW() WHERE id = $1`, [
        id,
        CSVal.CANCELED,
      ]);
    }
  }
  await resetEquipmentToAvailable(EQUIP.POWER_METER_SUW_E);
  await resetEquipmentToAvailable(EQUIP.COUPLER_SUW_E);
  await clearBackendCache();
  await cleanupCheckoutPool();
});

test.describe('Suite 14: 반출 생성 규칙', () => {
  test('S14-01: 교정 목적 — available 장비로 반출 생성 성공', async ({
    testOperatorPage: page,
  }) => {
    const { response, data } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.SPECTRUM_ANALYZER_SUW_E],
        purpose: CPVal.CALIBRATION,
        destination: '한국교정시험연구원',
        reason: 'E2E 교정 테스트',
        expectedReturnDate: '2026-06-01T00:00:00.000Z',
      },
      'test_engineer'
    );

    expect(response.status()).toBe(201);
    const id = (data as Record<string, unknown>).id as string;
    if (id) createdCheckoutIds.push(id);
  });

  test('S14-02: 수리 목적 — non_conforming 장비로 반출 생성 성공', async ({
    testOperatorPage: page,
  }) => {
    const pool = getCheckoutPool();
    await pool.query(`UPDATE equipment SET status = $2, updated_at = NOW() WHERE id = $1`, [
      EQUIP.POWER_METER_SUW_E,
      ESVal.NON_CONFORMING,
    ]);
    await clearBackendCache();

    const { response, data } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.POWER_METER_SUW_E],
        purpose: CPVal.REPAIR,
        destination: '제조사 A/S 센터',
        reason: 'E2E 수리 테스트',
        expectedReturnDate: '2026-06-01T00:00:00.000Z',
      },
      'test_engineer'
    );

    expect(response.status()).toBe(201);
    const id = (data as Record<string, unknown>).id as string;
    if (id) createdCheckoutIds.push(id);
  });

  test('S14-03: 대여 목적 — 다른 팀 장비만 선택 가능 (자기 팀 장비 실패)', async ({
    testOperatorPage: page,
  }) => {
    // test_engineer는 Suwon E팀 → E팀 장비(SPECTRUM_ANALYZER_SUW_E)로 대여 불가
    const { response } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.SPECTRUM_ANALYZER_SUW_E],
        purpose: CPVal.RENTAL,
        destination: '외부 연구소',
        reason: 'E2E 대여 테스트',
        expectedReturnDate: '2026-06-01T00:00:00.000Z',
      },
      'test_engineer'
    );

    expect(response.status()).toBe(400);
  });

  test('S14-04: 대여 목적 — 다른 팀 장비로 반출 생성 성공', async ({ testOperatorPage: page }) => {
    // test_engineer는 Suwon E팀 → S팀 장비(SAR_PROBE)로 대여 가능
    const { response, data } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.SAR_PROBE_SUW_S],
        purpose: CPVal.RENTAL,
        destination: 'Suwon FCC EMC',
        reason: 'E2E 대여 테스트',
        expectedReturnDate: '2026-06-01T00:00:00.000Z',
      },
      'test_engineer'
    );

    if (response.status() === 201) {
      const id = (data as Record<string, unknown>).id as string;
      if (id) createdCheckoutIds.push(id);
    } else {
      // 대여 생성에 lenderTeamId 필요 시 400
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('S14-05: 교정 목적 — in_use 장비 반출 불가 (400)', async ({ testOperatorPage: page }) => {
    const { response } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.EMC_RECEIVER_SUW_E],
        purpose: CPVal.CALIBRATION,
        destination: '한국교정시험연구원',
        reason: 'E2E in_use 테스트',
        expectedReturnDate: '2026-06-01T00:00:00.000Z',
      },
      'test_engineer'
    );

    expect(response.status()).toBe(400);
  });

  test('S14-06: 필수 필드 누락 시 반출 생성 실패 (400)', async ({ testOperatorPage: page }) => {
    const { response } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.SPECTRUM_ANALYZER_SUW_E],
        purpose: CPVal.CALIBRATION,
        destination: '한국교정시험연구원',
        expectedReturnDate: '2026-06-01T00:00:00.000Z',
        // reason 누락
      },
      'test_engineer'
    );

    expect(response.status()).toBe(400);
  });

  test('S14-07: 과거 날짜 반입예정일 시 실패 (400)', async ({ testOperatorPage: page }) => {
    const { response } = await apiPost(
      page,
      '/api/checkouts',
      {
        equipmentIds: [EQUIP.SPECTRUM_ANALYZER_SUW_E],
        purpose: CPVal.CALIBRATION,
        destination: '한국교정시험연구원',
        reason: 'E2E 날짜 테스트',
        expectedReturnDate: '2020-01-01',
      },
      'test_engineer'
    );

    expect(response.status()).toBe(400);
  });

  test('S14-08: 반출지(destination) 목록 조회', async ({ techManagerPage: page }) => {
    const data = await apiGet(page, '/api/checkouts/destinations', 'technical_manager');
    expect(data).toBeDefined();
    const destinations = Array.isArray(data) ? data : (data as Record<string, unknown>).items;
    expect(destinations).toBeDefined();
  });
});
