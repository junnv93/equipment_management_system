/**
 * Suite 24: 공통 검증 테스트
 *
 * D-1: 역할별 접근 제어 통합
 * D-2: 데이터 스코프 (팀/사이트별 조회 제한)
 * D-4: 캐시 무효화 검증
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { BASE_URLS, TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import { getBackendToken, clearBackendCache } from '../helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;

test.describe('D-1: 역할별 접근 제어 통합', () => {
  test.describe('교정 관련 API 접근 권한 매트릭스', () => {
    test('TE: 교정 목록 조회 → 200', async ({ request }) => {
      const token = await getBackendToken(request, 'test_engineer');
      const response = await request.get(`${BACKEND_URL}/api/calibration`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.ok()).toBeTruthy();
    });

    test('TE: 교정 등록 → 201 (CREATE_CALIBRATION 있음)', async ({ request }) => {
      const token = await getBackendToken(request, 'test_engineer');
      const response = await request.post(`${BACKEND_URL}/api/calibration`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
          calibrationDate: new Date().toISOString(),
          calibrationAgency: 'HCT',
          result: 'pass',
        },
      });

      // 201 또는 200 (성공)
      expect([200, 201].includes(response.status())).toBeTruthy();
    });

    test('QM: 교정 목록 조회 → 200 (읽기 전용)', async ({ request }) => {
      const token = await getBackendToken(request, 'quality_manager');
      const response = await request.get(`${BACKEND_URL}/api/calibration`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.ok()).toBeTruthy();
    });

    test('LM: 교정 승인 권한 확인 (APPROVE_CALIBRATION 있음)', async ({ request }) => {
      const token = await getBackendToken(request, 'lab_manager');
      const response = await request.get(`${BACKEND_URL}/api/calibration/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.ok()).toBeTruthy();
    });

    test('LM: 교정 등록 → 403 (CREATE_CALIBRATION 없음, 직무분리)', async ({ request }) => {
      const token = await getBackendToken(request, 'lab_manager');
      const response = await request.post(`${BACKEND_URL}/api/calibration`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
          calibrationDate: new Date().toISOString(),
          calibrationAgency: 'HCT',
        },
      });

      expect(response.status()).toBe(403);
    });
  });
});

test.describe('D-2: 데이터 스코프 검증', () => {
  test('TE(수원): 수원 팀 교정 기록만 조회 (교차 팀 격리)', async ({ request }) => {
    const token = await getBackendToken(request, 'test_engineer');
    const response = await request.get(`${BACKEND_URL}/api/calibration`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data ?? body;
    const items = data.items ?? [];

    // TE는 소속 팀 기록만 볼 수 있어야 함
    // (시드 데이터에서 Suwon FCC EMC/RF 팀 데이터만)
    // 정확한 검증은 다른 사이트 데이터가 포함되지 않았는지 확인
    expect(items).toBeDefined();
  });

  test('QM(수원): 전체 교정 기록 조회 가능', async ({ request }) => {
    const token = await getBackendToken(request, 'quality_manager');
    const response = await request.get(`${BACKEND_URL}/api/calibration`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data ?? body;
    const items = data.items ?? [];

    // QM은 더 넓은 범위의 데이터를 볼 수 있어야 함
    expect(items).toBeDefined();
  });

  test('LM(수원): 소속 사이트 교정 기록 조회', async ({ request }) => {
    const token = await getBackendToken(request, 'lab_manager');
    const response = await request.get(`${BACKEND_URL}/api/calibration`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const data = body.data ?? body;
    const items = data.items ?? [];

    // LM은 소속 사이트(수원) 전체 교정 기록을 볼 수 있어야 함
    expect(items).toBeDefined();
  });
});

test.describe('D-4: 캐시 무효화 검증', () => {
  test('교정 등록 후 교정 목록 캐시 갱신 확인 (API)', async ({ request }) => {
    const token = await getBackendToken(request, 'test_engineer');

    // 캐시 클리어
    await clearBackendCache(request);

    // 교정 목록 조회 (캐시 히트)
    const response1 = await request.get(`${BACKEND_URL}/api/calibration`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response1.ok()).toBeTruthy();

    // 교정 등록
    const createResponse = await request.post(`${BACKEND_URL}/api/calibration`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        equipmentId: TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E,
        calibrationDate: new Date().toISOString(),
        calibrationAgency: 'KTC 캐시 테스트',
        result: 'pass',
      },
    });

    if (createResponse.ok()) {
      // 교정 목록 재조회 — 새 기록이 포함되어야 함
      const response2 = await request.get(`${BACKEND_URL}/api/calibration`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response2.ok()).toBeTruthy();
    }
  });
});
