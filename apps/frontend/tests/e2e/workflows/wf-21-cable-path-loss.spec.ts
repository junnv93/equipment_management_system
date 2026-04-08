/**
 * WF-21: 케이블 Path Loss 관리 (UL-QP-18-08)
 *
 * 케이블 등록 → Path Loss 측정 추가 → QP-18-08 양식 XLSX 내보내기까지의
 * 워크플로우를 API 라운드트립으로 검증한다.
 *
 * UI 클릭 시나리오는 후속 spec에서 분리. 본 spec은 백엔드 일관성과 export
 * 회귀 방지에 집중한다 (WF-19b/WF-20b 패턴).
 *
 * @see docs/workflows/critical-workflows.md WF-21
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiGet,
  apiPost,
  extractId,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const today = new Date().toISOString().split('T')[0];

// 관리번호 형식: ELLLX-NNN (UL-QP-18-08 도메인 규칙)
// 다중 실행 격리: 시각 기반 3자리 suffix
const managementNumber = `ELLLX-${String(Date.now() % 1000).padStart(3, '0')}`;

let createdCableId = '';

test.describe('WF-21: 케이블 Path Loss 관리 (QP-18-08)', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('Step 1: 케이블 등록 → 201 + id 반환', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      '/api/cables',
      {
        managementNumber,
        length: '2.0',
        connectorType: 'N',
        frequencyRangeMin: 30,
        frequencyRangeMax: 6000,
        serialNumber: `SN-WF21-${Date.now()}`,
        location: '수원 EMC 챔버',
        site: 'suwon',
      },
      'test_engineer'
    );

    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(300);
    const body = (await resp.json()) as Record<string, unknown>;
    createdCableId = extractId(body);
    expect(createdCableId).toBeTruthy();
  });

  test('Step 2: Path Loss 측정 추가 (4 dataPoints) → 201', async ({ testOperatorPage: page }) => {
    expect(createdCableId).toBeTruthy();

    const resp = await apiPost(
      page,
      `/api/cables/${createdCableId}/measurements`,
      {
        measurementDate: today,
        notes: 'WF-21 e2e: Path Loss 측정 더미 데이터',
        dataPoints: [
          { frequencyMhz: 30, lossDb: '0.5' },
          { frequencyMhz: 1000, lossDb: '1.0' },
          { frequencyMhz: 3000, lossDb: '1.5' },
          { frequencyMhz: 6000, lossDb: '2.0' },
        ],
      },
      'test_engineer'
    );

    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(300);
  });

  test('Step 3: 케이블 상세 조회 → 측정 데이터 반영 확인', async ({ testOperatorPage: page }) => {
    expect(createdCableId).toBeTruthy();
    await clearBackendCache();

    // 측정 목록 직접 조회 — 경로 손실 데이터 포인트가 저장되었는지 확인
    const measResp = await apiGet(
      page,
      `/api/cables/${createdCableId}/measurements`,
      'test_engineer'
    );
    expect(measResp.status()).toBe(200);
    const measBody = (await measResp.json()) as Record<string, unknown>;
    const data = (measBody.data ?? measBody) as unknown;
    const list = Array.isArray(data) ? data : [];
    expect(list.length).toBeGreaterThanOrEqual(1);

    // 케이블 상세에서 lastMeasurementDate 가 갱신되었는지 확인
    const detailResp = await apiGet(page, `/api/cables/${createdCableId}`, 'test_engineer');
    expect(detailResp.status()).toBe(200);
    const detailBody = (await detailResp.json()) as Record<string, unknown>;
    const cable = (detailBody.data ?? detailBody) as Record<string, unknown>;
    expect(cable.lastMeasurementDate).toBeTruthy();
  });

  test('Step 4: QP-18-08 XLSX export → 200 + spreadsheetml.sheet', async ({
    testOperatorPage: page,
  }) => {
    expect(createdCableId).toBeTruthy();
    await clearBackendCache();

    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-08?site=suwon`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain('spreadsheetml.sheet');

    const body = await resp.body();
    // XLSX 는 최소 수 KB
    expect(body.length).toBeGreaterThan(1000);

    // XLSX (zip) 매직 바이트: 'PK\x03\x04'
    expect(body[0]).toBe(0x50);
    expect(body[1]).toBe(0x4b);
  });
});
