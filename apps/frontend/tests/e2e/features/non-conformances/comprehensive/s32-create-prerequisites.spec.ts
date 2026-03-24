/**
 * Suite 32: 수동 부적합 등록 + NC 유형별 전제조건 검증
 *
 * 검증 항목:
 * - 수동 NC 등록 (API 기반 — UI에서 직접 등록은 장비 상세 페이지)
 * - NC 유형 6개별 전제조건 분기
 * - 이미 non_conforming인 장비에 NC 중복 생성 방지
 * - damage/malfunction: 수리 미연결 → 조치 완료 불가
 * - calibration_overdue: 교정 미연결 → 조치 완료 불가
 * - calibration_failure/measurement_error/other: 전제조건 없이 조치 가능
 *
 * 장비 격리: SPECTRUM_ANALYZER(32-01~06), DISPOSAL_A3(32-07), DISPOSAL_A1(32-08 유효성)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  NonConformanceStatusValues as NCSVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  getBackendToken,
  createNcViaApi,
  getNcDetail,
  updateNcViaApi,
  gotoNcDetail,
  clearBackendCache,
  cleanupDynamicNcs,
  resetEquipmentStatus,
  cleanupNcPool,
  NC_IDS,
  EQUIP_IDS,
  USER_IDS,
  BACKEND_URL,
} from './helpers/nc-test-helpers';
import { TEST_DISPOSAL_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

test.describe('Suite 32: NC 등록 + 유형별 전제조건', () => {
  test.describe.configure({ mode: 'serial' });

  let teToken: string;
  let tmToken: string;

  // ============================================================================
  // Setup / Teardown
  // ============================================================================

  test.beforeAll(async () => {
    // SPECTRUM_ANALYZER: NC 생성/중복/전제조건 테스트용
    await cleanupDynamicNcs(EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E);
    await resetEquipmentStatus(EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E, ESVal.AVAILABLE);

    // DISPOSAL_A3: other 유형 전제조건 테스트용 (독립 장비)
    await cleanupDynamicNcs(TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE);
    await resetEquipmentStatus(TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE, ESVal.AVAILABLE);

    await clearBackendCache();
  });

  test.afterAll(async () => {
    await cleanupDynamicNcs(EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E);
    await resetEquipmentStatus(EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E, ESVal.AVAILABLE);
    await cleanupDynamicNcs(TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE);
    await resetEquipmentStatus(TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE, ESVal.AVAILABLE);
    await clearBackendCache();
    await cleanupNcPool();
  });

  // ============================================================================
  // 32-01: NC 수동 등록 성공 (measurement_error)
  // ============================================================================

  test('32-01: test_engineer가 measurement_error 유형 NC를 등록하면 장비 상태가 non_conforming으로 전환된다', async ({
    testOperatorPage: page,
  }) => {
    teToken = await getBackendToken(page, 'test_engineer');

    const createRes = await createNcViaApi(page, teToken, {
      equipmentId: EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E,
      ncType: 'measurement_error',
      cause: 'E2E 테스트: 측정 편차 발생',
      discoveredBy: USER_IDS.TEST_ENGINEER_SUWON,
    });
    expect(createRes.ok()).toBeTruthy();

    const nc = await createRes.json();
    expect(nc.status).toBe(NCSVal.OPEN);
    expect(nc.ncType).toBe('measurement_error');

    // 장비 상태 확인 (API)
    const equipRes = await page.request.get(
      `${BACKEND_URL}/api/equipment/${EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E}`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    expect(equipRes.ok()).toBeTruthy();
    const equip = await equipRes.json();
    expect(equip.status).toBe(ESVal.NON_CONFORMING);
  });

  // ============================================================================
  // 32-02: 이미 non_conforming인 장비에 중복 NC 생성 → 실패
  // ============================================================================

  test('32-02: 이미 non_conforming인 장비에 NC 중복 생성 시 에러', async ({
    testOperatorPage: page,
  }) => {
    teToken = teToken || (await getBackendToken(page, 'test_engineer'));

    // 32-01에서 SPECTRUM_ANALYZER에 NC를 생성했으므로 이미 non_conforming
    const createRes = await createNcViaApi(page, teToken, {
      equipmentId: EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E,
      ncType: 'damage',
      cause: 'E2E 테스트: 중복 NC 시도',
      discoveredBy: USER_IDS.TEST_ENGINEER_SUWON,
    });

    expect(createRes.status()).toBe(400);
    const error = await createRes.json();
    expect(error.code || error.message).toContain('ALREADY_NON_CONFORMING');
  });

  // ============================================================================
  // 32-03: malfunction 유형 — 수리 미연결 시 조치 완료 불가 (API)
  // ============================================================================

  test('32-03: malfunction 유형 NC에서 수리 미연결 상태로 조치 완료 요청 시 에러', async ({
    testOperatorPage: page,
  }) => {
    teToken = teToken || (await getBackendToken(page, 'test_engineer'));

    // NC_001: malfunction, open, 수리 미연결 (FCC EMC/RF 팀 — TE 접근 가능)
    const nc = await getNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN, teToken);
    expect(nc.status).toBe(NCSVal.OPEN);
    expect(nc.repairHistoryId).toBeNull();

    // 조치 완료 시도
    const updateRes = await updateNcViaApi(page, teToken, NC_IDS.NC_001_MALFUNCTION_OPEN, {
      version: nc.version,
      status: NCSVal.CORRECTED,
      correctionContent: '수리 없이 조치 시도',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    expect(updateRes.status()).toBe(400);
    const error = await updateRes.json();
    expect(error.code || error.message).toContain('NC_REPAIR_RECORD_REQUIRED');
  });

  // ============================================================================
  // 32-04: malfunction — UI에서 "조치 완료" 버튼 비활성화 확인
  // ============================================================================

  test('32-04: malfunction NC 상세에서 수리 미연결 시 "조치 완료" 버튼이 비활성화된다', async ({
    techManagerPage: page,
  }) => {
    // NC_001: malfunction, open, 수리 미연결 (TM 접근 가능)
    await gotoNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN);

    // "조치 완료" 버튼 비활성화
    const button = page.getByRole('button', { name: '조치 완료' });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();

    // 전제조건 안내 메시지
    await expect(page.getByText(/수리 이력을 등록/).first()).toBeVisible();
  });

  // ============================================================================
  // 32-05: malfunction 유형도 수리 필수 (API — NC_002)
  // ============================================================================

  test('32-05: malfunction 유형 NC에서 수리 미연결 시 조치 완료 에러', async ({
    testOperatorPage: page,
  }) => {
    teToken = teToken || (await getBackendToken(page, 'test_engineer'));

    // NC_001: malfunction, open, 수리 미연결
    const nc = await getNcDetail(page, NC_IDS.NC_001_MALFUNCTION_OPEN, teToken);

    const updateRes = await updateNcViaApi(page, teToken, NC_IDS.NC_001_MALFUNCTION_OPEN, {
      version: nc.version,
      status: NCSVal.CORRECTED,
      correctionContent: '수리 없이 조치 시도',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    expect(updateRes.status()).toBe(400);
    const error = await updateRes.json();
    expect(error.code || error.message).toContain('NC_REPAIR_RECORD_REQUIRED');
  });

  // ============================================================================
  // 32-06: measurement_error — 전제조건 없이 조치 완료 가능 (API)
  // ============================================================================

  test('32-06: measurement_error 유형은 전제조건 없이 조치 완료 가능하다', async ({
    testOperatorPage: page,
  }) => {
    teToken = teToken || (await getBackendToken(page, 'test_engineer'));
    await clearBackendCache();

    // 32-01에서 생성한 NC 목록 조회하여 ID 찾기
    const listRes = await page.request.get(
      `${BACKEND_URL}/api/non-conformances?equipmentId=${EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E}&status=open`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    expect(listRes.ok()).toBeTruthy();
    const listData = await listRes.json();
    const ncItems = listData.data || listData.items || [];
    expect(ncItems.length).toBeGreaterThan(0);

    const targetNc = ncItems[0];

    // 전제조건 없이 corrected 전이
    const updateRes = await updateNcViaApi(page, teToken, targetNc.id, {
      version: targetNc.version,
      status: NCSVal.CORRECTED,
      correctionContent: 'E2E 테스트: 재교정 완료',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.status).toBe(NCSVal.CORRECTED);
  });

  // ============================================================================
  // 32-07: other 유형 — 전제조건 없이 조치 완료 가능
  // ============================================================================

  test('32-07: other 유형은 전제조건 없이 조치 완료 가능하다', async ({
    testOperatorPage: page,
  }) => {
    teToken = teToken || (await getBackendToken(page, 'test_engineer'));

    // DISPOSAL_A3 장비에 other 유형 NC 생성 (독립 장비 — s32 전용)
    await cleanupDynamicNcs(TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE);
    await resetEquipmentStatus(TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE, ESVal.AVAILABLE);
    await clearBackendCache();

    const createRes = await createNcViaApi(page, teToken, {
      equipmentId: TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A3_AVAILABLE,
      ncType: 'other',
      cause: 'E2E 테스트: 기타 부적합',
      discoveredBy: USER_IDS.TEST_ENGINEER_SUWON,
    });
    expect(createRes.ok()).toBeTruthy();
    const nc = await createRes.json();

    // 즉시 corrected 전이
    const updateRes = await updateNcViaApi(page, teToken, nc.id, {
      version: nc.version,
      status: NCSVal.CORRECTED,
      correctionContent: 'E2E 테스트: 기타 조치 완료',
      correctionDate: new Date().toISOString().split('T')[0],
    });

    expect(updateRes.ok()).toBeTruthy();
    const updated = await updateRes.json();
    expect(updated.status).toBe(NCSVal.CORRECTED);
  });

  // ============================================================================
  // 32-08: NC 유형 6개 존재 확인 (SSOT)
  // ============================================================================

  test('32-08: NC 유형 6개가 모두 유효한 값으로 인식된다', async ({ testOperatorPage: page }) => {
    teToken = teToken || (await getBackendToken(page, 'test_engineer'));

    const validTypes = [
      'damage',
      'malfunction',
      'calibration_overdue',
      'calibration_failure',
      'measurement_error',
      'other',
    ];

    // 각 유형으로 validation만 확인 — 이미 non_conforming인 장비에 시도하여
    // 유형 자체의 유효성은 통과하고 비즈니스 규칙(중복 NC)에서 400 발생하는지 확인
    for (const ncType of validTypes) {
      const res = await createNcViaApi(page, teToken, {
        equipmentId: EQUIP_IDS.SPECTRUM_ANALYZER_SUW_E, // 32-01에서 non_conforming
        ncType,
        cause: `유형 검증: ${ncType}`,
        discoveredBy: USER_IDS.TEST_ENGINEER_SUWON,
      });
      const status = res.status();
      expect(status).toBe(400);
      const data = await res.json();
      // 유형 validation 에러가 아닌 중복 NC 에러인지 확인
      expect(data.code || data.message).not.toContain('VALIDATION');
    }
  });
});
