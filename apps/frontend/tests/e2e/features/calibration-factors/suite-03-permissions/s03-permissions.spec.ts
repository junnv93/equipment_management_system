/**
 * Suite 03: 보정계수 역할별 권한 테스트
 *
 * C-3: 역할별 권한 매트릭스 검증
 * ┌───────────────────┬──────┬───────────┬───────────┬──────┐
 * │       역할        │ 조회 │ 변경 요청 │ 승인/반려 │ 삭제 │
 * ├───────────────────┼──────┼───────────┼───────────┼──────┤
 * │ test_engineer     │  O   │     O     │     X     │  X   │
 * │ technical_manager │  O   │     O     │     O     │  O   │
 * │ quality_manager   │  O   │     X     │     X     │  X   │
 * │ lab_manager       │  O   │     O     │     O     │  O   │
 * └───────────────────┴──────┴───────────┴───────────┴──────┘
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BASE_URLS, TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import { getBackendToken } from '../../calibration/helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const FACTORS_API = `${BACKEND_URL}/api/calibration-factors`;

test.describe('C-3: 보정계수 역할별 권한', () => {
  test.describe('조회 권한 (모든 역할)', () => {
    for (const role of [
      'test_engineer',
      'technical_manager',
      'quality_manager',
      'lab_manager',
    ] as const) {
      test(`${role}: 보정계수 목록 조회 → 200`, async ({ request }) => {
        const token = await getBackendToken(request, role);
        const response = await request.get(FACTORS_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        expect(response.ok()).toBeTruthy();
      });
    }
  });

  test.describe('변경 요청 권한', () => {
    test('TE: 보정계수 변경 요청 → 201 (CREATE_CALIBRATION_FACTOR 있음)', async ({ request }) => {
      const token = await getBackendToken(request, 'test_engineer');
      const response = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SAR_PROBE_SUW_S,
          factorType: 'other',
          factorName: 'TE 권한 테스트',
          factorValue: 0.1,
          unit: 'dB',
          effectiveDate: '2026-04-01',
        },
      });

      expect(response.status()).toBe(201);
    });

    test('QM: 보정계수 변경 요청 → 403 (CREATE_CALIBRATION_FACTOR 없음)', async ({ request }) => {
      const token = await getBackendToken(request, 'quality_manager');
      const response = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SAR_PROBE_SUW_S,
          factorType: 'other',
          factorName: 'QM 권한 테스트',
          factorValue: 0.1,
          unit: 'dB',
          effectiveDate: '2026-04-01',
        },
      });

      expect(response.status()).toBe(403);
    });

    test('LM: 보정계수 변경 요청 → 201', async ({ request }) => {
      const token = await getBackendToken(request, 'lab_manager');
      const response = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
          factorType: 'cable_loss',
          factorName: 'LM 권한 테스트',
          factorValue: 0.2,
          unit: 'dB',
          effectiveDate: '2026-04-01',
        },
      });

      expect(response.status()).toBe(201);
    });
  });

  test.describe('승인/반려 권한', () => {
    test('TE: 보정계수 승인 → 403', async ({ request }) => {
      const tmToken = await getBackendToken(request, 'technical_manager');

      // pending 항목 조회
      const pendingResponse = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${tmToken}` },
      });

      if (pendingResponse.ok()) {
        const body = await pendingResponse.json();
        const items = body.data?.items ?? body.items ?? body.data ?? [];
        const pendingItems = Array.isArray(items) ? items : [];

        if (pendingItems.length > 0) {
          const factor = pendingItems[0];

          // TE로 승인 시도
          const teToken = await getBackendToken(request, 'test_engineer');
          const response = await request.patch(`${FACTORS_API}/${factor.id}/approve`, {
            headers: { Authorization: `Bearer ${teToken}`, 'Content-Type': 'application/json' },
            data: { version: factor.version, approverComment: 'TE 승인 시도' },
          });

          expect(response.status()).toBe(403);
        }
      }
    });

    test('QM: 보정계수 승인 → 403', async ({ request }) => {
      const tmToken = await getBackendToken(request, 'technical_manager');

      const pendingResponse = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${tmToken}` },
      });

      if (pendingResponse.ok()) {
        const body = await pendingResponse.json();
        const items = body.data?.items ?? body.items ?? body.data ?? [];
        const pendingItems = Array.isArray(items) ? items : [];

        if (pendingItems.length > 0) {
          const factor = pendingItems[0];

          const qmToken = await getBackendToken(request, 'quality_manager');
          const response = await request.patch(`${FACTORS_API}/${factor.id}/approve`, {
            headers: { Authorization: `Bearer ${qmToken}`, 'Content-Type': 'application/json' },
            data: { version: factor.version, approverComment: 'QM 승인 시도' },
          });

          expect(response.status()).toBe(403);
        }
      }
    });
  });

  test.describe('삭제 권한', () => {
    test('TE: 보정계수 삭제 → 403', async ({ request }) => {
      // 테스트용 보정계수 생성
      const teToken = await getBackendToken(request, 'test_engineer');
      const createResponse = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${teToken}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E,
          factorType: 'other',
          factorName: 'TE 삭제 권한 테스트',
          factorValue: 0.1,
          unit: 'dB',
          effectiveDate: '2026-04-01',
        },
      });

      if (createResponse.ok()) {
        const created = await createResponse.json();
        const factor = created.data ?? created;

        // TE로 삭제 시도
        const deleteResponse = await request.delete(`${FACTORS_API}/${factor.id}`, {
          headers: { Authorization: `Bearer ${teToken}`, 'Content-Type': 'application/json' },
          data: { version: factor.version },
        });

        expect(deleteResponse.status()).toBe(403);
      }
    });

    test('QM: 보정계수 삭제 → 403', async ({ request }) => {
      // pending 항목 사용
      const tmToken = await getBackendToken(request, 'technical_manager');
      const pendingResponse = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${tmToken}` },
      });

      if (pendingResponse.ok()) {
        const body = await pendingResponse.json();
        const items = body.data?.items ?? body.items ?? body.data ?? [];
        const pendingItems = Array.isArray(items) ? items : [];

        if (pendingItems.length > 0) {
          const factor = pendingItems[0];

          const qmToken = await getBackendToken(request, 'quality_manager');
          const deleteResponse = await request.delete(`${FACTORS_API}/${factor.id}`, {
            headers: { Authorization: `Bearer ${qmToken}`, 'Content-Type': 'application/json' },
            data: { version: factor.version },
          });

          expect(deleteResponse.status()).toBe(403);
        }
      }
    });
  });

  test.describe('승인 대기 목록 접근 권한', () => {
    test('TM: 승인 대기 목록 조회 → 200', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('TE: 승인 대기 목록 조회 → 403 (VIEW_CALIBRATION_FACTOR_REQUESTS 없음)', async ({
      request,
    }) => {
      const token = await getBackendToken(request, 'test_engineer');
      const response = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status()).toBe(403);
    });
  });
});
