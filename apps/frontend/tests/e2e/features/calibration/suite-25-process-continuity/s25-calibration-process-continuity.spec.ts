/**
 * Suite 25: 교정 프로세스 연속성 (Serial) ★P0 CRITICAL
 *
 * "코드가 아닌 사용자 시나리오"에서 출발한 테스트.
 * Suite 22(API 전용)에서 커버하지 못한 UI 레이어 검증:
 *
 * 검증 시나리오:
 * 1. test_engineer가 교정 등록 → pending_approval 상태 확인
 * 2. technical_manager가 교정 승인 → 교정 목록에서 "승인됨" 즉시 반영 (캐시 일관성)
 * 3. 승인 후 장비 상세 페이지에서 nextCalibrationDate 갱신 확인 (Suite 22 A-3 UI 버전)
 *
 * 핵심 검증:
 * - 교정 승인 후 교정 목록 캐시가 즉시 무효화되는가?
 * - 교정 승인 후 장비 상세 UI에서 "다음 교정 예정일"이 갱신되는가?
 *
 * 사용 장비: SIGNAL_GEN_SUW_E (신호 발생기, SUW-E0002) — FCC EMC/RF 팀
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BASE_URLS, TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import { getBackendToken, clearBackendCache } from '../helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const testEquipmentId = TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E;

test.describe('Suite 25: 교정 프로세스 연속성', () => {
  test.describe.configure({ mode: 'serial' });

  let calibrationId: string;
  let calibrationVersion: number;

  test.beforeAll(async ({ request }) => {
    // 기존 pending_approval 교정 기록 정리 (이전 테스트 잔류물)
    const token = await getBackendToken(request, 'technical_manager');
    const listResp = await request.get(
      `${BACKEND_URL}/api/calibration?equipmentId=${testEquipmentId}&approvalStatus=pending_approval&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (listResp.ok()) {
      const body = await listResp.json();
      const items = body.data?.items ?? body.items ?? [];
      for (const item of items) {
        await request.patch(`${BACKEND_URL}/api/calibration/${item.id}/reject`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: { version: item.version, rejectionReason: 'S25 테스트 준비: 이전 pending 정리' },
        });
      }
    }
    await clearBackendCache(request);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 시나리오 1: 교정 등록 후 pending_approval 상태 확인
  // ──────────────────────────────────────────────────────────────────────────

  test('S25-01: test_engineer가 교정 등록 → pending_approval 상태 즉시 확인', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page.request, 'test_engineer');

    const response = await page.request.post(`${BACKEND_URL}/api/calibration`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        equipmentId: testEquipmentId,
        calibrationDate: '2026-03-01T00:00:00.000Z',
        calibrationAgency: 'KRISS 한국표준과학연구원 (S25)',
        status: 'completed',
        result: 'pass',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    calibrationId = data.id;
    calibrationVersion = data.version;
    expect(data.approvalStatus).toBe('pending_approval');

    // 교정 목록 페이지에서 즉시 "승인 대기" 상태로 확인 가능해야 함
    await page.goto('/calibration?approvalStatus=pending_approval');
    await expect(page.getByText('KRISS 한국표준과학연구원 (S25)', { exact: false })).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 시나리오 2: 교정 승인 후 캐시 일관성 검증
  // ──────────────────────────────────────────────────────────────────────────

  test('S25-02: technical_manager가 교정 승인 → 교정 목록에서 즉시 "승인됨" 상태 확인', async ({
    techManagerPage: page,
  }) => {
    expect(calibrationId).toBeTruthy();
    await clearBackendCache(page.request);

    const token = await getBackendToken(page.request, 'technical_manager');

    // API로 교정 승인
    const approveResp = await page.request.patch(
      `${BACKEND_URL}/api/calibration/${calibrationId}/approve`,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { version: calibrationVersion, approverComment: 'S25 교정 승인 테스트' },
      }
    );
    expect(approveResp.ok()).toBeTruthy();
    const approved = await approveResp.json();
    expect(approved.approvalStatus).toBe('approved');

    // ★ 캐시 일관성: 교정 목록에서 즉시 "승인됨" 상태로 갱신되어야 함
    // "승인 후에도 목록이 pending으로 보임" 버그를 방지하는 회귀 테스트
    await page.goto('/calibration?approvalStatus=approved');
    await expect(page.getByText('KRISS 한국표준과학연구원 (S25)', { exact: false })).toBeVisible();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 시나리오 3: 교정 승인 후 장비 상세 UI에서 nextCalibrationDate 갱신 확인
  // ──────────────────────────────────────────────────────────────────────────

  test('S25-03: 교정 승인 후 장비 상세 페이지에서 "다음 교정 예정일" 갱신 확인', async ({
    techManagerPage: page,
  }) => {
    await clearBackendCache(page.request);

    // 승인 후 장비 상세 페이지 확인 — nextCalibrationDate 갱신 검증
    await page.goto(`/equipment/${testEquipmentId}`);
    await expect(page.getByText('다음 교정 예정일').first()).toBeVisible();

    // nextCalibrationDate가 2027년으로 갱신되었는지 확인
    // calibrationDate=2026-03-01, cycle=12개월 → nextCalibrationDate≈2027-03-01
    await expect(page.getByText('2027', { exact: false }).first()).toBeVisible();
  });
});
