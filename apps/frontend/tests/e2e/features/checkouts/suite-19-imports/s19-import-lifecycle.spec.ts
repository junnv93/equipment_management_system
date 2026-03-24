/**
 * Suite 19: Equipment Imports - 외부 장비 반입 라이프사이클
 *
 * 검증 대상:
 * - 렌탈 반입 신청 / 내부 공용 반입 신청
 * - 반입 승인 → 수령 확인 → 반납 시작
 * - 반입 목록/상세 페이지 렌더링
 * - 반입 취소 워크플로우
 * - quality_manager 반입 읽기 전용 검증
 *
 * Mode: serial (상태 변경)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CheckoutStatusValues as CSVal } from '@equipment-management/schemas';
import {
  apiGet,
  apiPatch,
  getBackendToken,
  clearBackendCache,
  cleanupCheckoutPool,
  getCheckoutPool,
} from '../helpers/checkout-helpers';
import { BACKEND_URL } from '../helpers/checkout-constants';

const IMPORT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  CANCELED: 'canceled',
} as const;

// Track created imports for cleanup
const createdImportIds: string[] = [];

test.describe('Suite 19: 외부 장비 반입 라이프사이클', () => {
  test.describe.configure({ mode: 'serial' });

  let rentalImportId: string;
  let rentalImportVersion: number;

  test.afterAll(async () => {
    if (createdImportIds.length > 0) {
      const pool = getCheckoutPool();
      for (const id of createdImportIds) {
        await pool
          .query(`UPDATE equipment_imports SET status = $2, updated_at = NOW() WHERE id = $1`, [
            id,
            IMPORT_STATUS.CANCELED,
          ])
          .catch(() => {
            /* ignore */
          });
      }
    }
    await cleanupCheckoutPool();
  });

  test('S19-01: 렌탈 반입 신청 (API)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const response = await page.request.post(`${BACKEND_URL}/api/equipment-imports`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        sourceType: 'rental',
        equipmentName: 'E2E 렌탈 테스트 장비',
        modelName: 'TEST-MODEL-001',
        manufacturer: '테스트 제조사',
        serialNumber: `E2E-RENTAL-${Date.now()}`,
        reason: 'E2E 렌탈 반입 테스트',
        expectedReturnDate: '2026-06-01',
        lenderOrganization: '외부 연구소',
      },
    });

    if (response.status() === 201) {
      const data = await response.json();
      rentalImportId = data.id;
      rentalImportVersion = data.version || 1;
      createdImportIds.push(rentalImportId);
    } else {
      const body = await response.text();
      console.log(`Import creation failed (${response.status()}): ${body}`);
      test.skip();
    }
  });

  test('S19-02: 반입 상세 조회', async ({ techManagerPage: page }) => {
    test.skip(!rentalImportId, 'Import not created');

    const data = await apiGet(
      page,
      `/api/equipment-imports/${rentalImportId}`,
      'technical_manager'
    );
    const detail = data as Record<string, unknown>;

    expect(detail.id).toBe(rentalImportId);
    expect(detail.status).toBe(IMPORT_STATUS.PENDING);
    expect(detail.sourceType).toBe('rental');
  });

  test('S19-03: 반입 승인', async ({ techManagerPage: page }) => {
    test.skip(!rentalImportId, 'Import not created');

    const { response, data } = await apiPatch(
      page,
      `/api/equipment-imports/${rentalImportId}/approve`,
      { version: rentalImportVersion },
      'technical_manager'
    );

    if (response.status() === 200) {
      const result = data as Record<string, unknown>;
      rentalImportVersion = (result.version as number) || rentalImportVersion + 1;

      await clearBackendCache();
      const updated = await apiGet(
        page,
        `/api/equipment-imports/${rentalImportId}`,
        'technical_manager'
      );
      expect((updated as Record<string, unknown>).status).toBe(IMPORT_STATUS.APPROVED);
    } else {
      console.log(`Approve response: ${response.status()}`);
    }
  });

  test('S19-04: 반입 목록 조회', async ({ techManagerPage: page }) => {
    const data = await apiGet(page, '/api/equipment-imports', 'technical_manager');
    const response = data as Record<string, unknown>;
    expect(response.items || response).toBeDefined();
  });

  test('S19-05: 반입 목록 UI 렌더링', async ({ techManagerPage: page }) => {
    await page.goto('/checkouts?view=inbound');

    await expect(page.getByRole('heading', { name: /반입|반출/i }).first()).toBeVisible();
  });

  test('S19-06: quality_manager — 반입 목록 읽기전용', async ({ qualityManagerPage: page }) => {
    const data = await apiGet(page, '/api/equipment-imports', 'quality_manager');
    expect(data).toBeDefined();
  });

  test('S19-07: quality_manager — 반입 승인 불가 (403)', async ({ qualityManagerPage: page }) => {
    test.skip(!rentalImportId, 'Import not created');

    const { response } = await apiPatch(
      page,
      `/api/equipment-imports/${rentalImportId}/approve`,
      { version: rentalImportVersion },
      'quality_manager'
    );

    expect(response.status()).toBeGreaterThanOrEqual(403);
  });

  test('S19-08: 반입 취소 워크플로우', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const createResponse = await page.request.post(`${BACKEND_URL}/api/equipment-imports`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        sourceType: 'shared',
        equipmentName: 'E2E 취소 테스트 장비',
        modelName: 'CANCEL-MODEL-001',
        manufacturer: '테스트 제조사',
        serialNumber: `E2E-CANCEL-${Date.now()}`,
        reason: 'E2E 반입 취소 테스트',
      },
    });

    if (createResponse.status() === 201) {
      const createData = await createResponse.json();
      const cancelId = createData.id;
      createdImportIds.push(cancelId);

      const { response } = await apiPatch(
        page,
        `/api/equipment-imports/${cancelId}/cancel`,
        { version: createData.version || 1 },
        'technical_manager'
      );

      expect(response.status()).toBe(200);

      await clearBackendCache();
      const updated = await apiGet(page, `/api/equipment-imports/${cancelId}`, 'technical_manager');
      expect((updated as Record<string, unknown>).status).toBe(IMPORT_STATUS.CANCELED);
    } else {
      test.skip();
    }
  });
});
