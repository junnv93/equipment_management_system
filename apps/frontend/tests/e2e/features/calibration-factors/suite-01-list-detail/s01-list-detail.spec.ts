/**
 * Suite 01: 보정계수 목록 및 상세 페이지 테스트
 *
 * C-1: 목록 조회, 필터링, 대장(registry), 장비별 이력, 타입별 표시
 *
 * 시드 데이터: 12개 보정계수
 * - antenna_gain (4): approved 3, pending 1
 * - cable_loss (3): approved 2, rejected 1
 * - path_loss (2): approved 1, pending 1
 * - amplifier_gain (2): approved 2
 * - other (1): approved 1
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BASE_URLS, TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import { getBackendToken } from '../../calibration/helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const FACTORS_API = `${BACKEND_URL}/api/calibration-factors`;

test.describe('C-1: 보정계수 목록/상세 API 테스트', () => {
  test.describe('목록 조회', () => {
    test('보정계수 전체 목록 조회 — 구조 확인', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;

      // 목록 응답 구조 확인
      const items = Array.isArray(data) ? data : (data.items ?? []);
      expect(items.length).toBeGreaterThanOrEqual(1);

      // 첫 번째 항목 필드 확인
      const first = items[0];
      expect(first).toHaveProperty('factorType');
      expect(first).toHaveProperty('factorName');
      expect(first).toHaveProperty('factorValue');
      expect(first).toHaveProperty('unit');
      expect(first).toHaveProperty('approvalStatus');
    });

    test('보정계수 타입별 필터링 — antenna_gain', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(`${FACTORS_API}?factorType=antenna_gain`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;
      const items = Array.isArray(data) ? data : (data.items ?? []);

      // antenna_gain 타입만 반환
      for (const item of items) {
        expect(item.factorType).toBe('antenna_gain');
      }
    });
  });

  test.describe('보정계수 대장 (registry)', () => {
    test('보정계수 대장 API — 장비별 현재 적용 중인 값 조회', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(`${FACTORS_API}/registry`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;

      // 대장 응답 구조 확인
      expect(data).toBeDefined();
    });
  });

  test.describe('장비별 보정계수 이력', () => {
    test('특정 장비의 보정계수 이력 조회 API 정상 응답', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      // EMC Receiver (available, Suwon FCC) — cable_loss 시드 데이터 있음
      const equipmentId = TEST_EQUIPMENT_IDS.EMC_RECEIVER_SUW_E;

      const response = await request.get(`${FACTORS_API}/equipment/${equipmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API 정상 응답 확인 (200)
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;

      // 배열 또는 객체 형태의 응답
      expect(data).toBeDefined();
    });
  });

  test.describe('보정계수 상세 조회', () => {
    test('승인 대기 보정계수 목록 조회', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;
      const items = Array.isArray(data) ? data : (data.items ?? []);

      // pending 상태인 것만 반환
      for (const item of items) {
        expect(item.approvalStatus).toBe('pending');
      }
    });
  });

  test.describe('보정계수 필드 구조', () => {
    test('parameters (jsonb) 필드 구조 확인', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;
      const items = Array.isArray(data) ? data : (data.items ?? []);

      // parameters 필드가 jsonb 객체인 항목 확인
      const withParams = items.find(
        (item: Record<string, unknown>) => item.parameters && typeof item.parameters === 'object'
      );
      if (withParams) {
        expect(typeof withParams.parameters).toBe('object');
      }
    });

    test('effectiveDate / expiryDate 유효 기간 필드 확인', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;
      const items = Array.isArray(data) ? data : (data.items ?? []);

      if (items.length > 0) {
        const first = items[0];
        expect(first).toHaveProperty('effectiveDate');
        // expiryDate는 선택적
      }
    });
  });
});
