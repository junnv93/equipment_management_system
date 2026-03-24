/**
 * Suite 02: 보정계수 변경 요청 → 승인 (1-step) 테스트
 *
 * C-2: pending → approved, pending → rejected
 * - test_engineer/technical_manager 변경 요청
 * - technical_manager 승인/반려
 * - parameters (jsonb) 다중 파라미터
 * - effectiveDate, expiryDate 유효 기간
 * - 소프트 삭제 (deletedAt)
 */

import { test, expect } from '@playwright/test';
import { BASE_URLS, TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';
import {
  getBackendToken,
  approveCalibrationFactor,
  rejectCalibrationFactor,
} from '../../calibration/helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const FACTORS_API = `${BACKEND_URL}/api/calibration-factors`;

test.describe('C-2: 보정계수 변경 요청 → 승인 워크플로우', () => {
  test.describe('변경 요청 생성', () => {
    test('TE: 보정계수 변경 요청 생성 → pending 상태', async ({ request }) => {
      const token = await getBackendToken(request, 'test_engineer');

      const response = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
          factorType: 'cable_loss',
          factorName: 'E2E 테스트 케이블 손실',
          factorValue: 0.35,
          unit: 'dB',
          parameters: {
            cableType: 'RG-58',
            length: '5m',
            frequency: '1GHz',
          },
          effectiveDate: '2026-04-01',
          expiryDate: '2027-04-01',
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;

      expect(data.approvalStatus).toBe('pending');
      expect(data.factorType).toBe('cable_loss');
      expect(data.factorName).toBe('E2E 테스트 케이블 손실');

      // 생성된 ID 저장 (후속 테스트에서 사용)
      test.info().annotations.push({
        type: 'created_factor_id',
        description: data.id,
      });
    });

    test('TM: 보정계수 변경 요청 생성 → pending 상태', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');

      const response = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E,
          factorType: 'amplifier_gain',
          factorName: 'E2E 테스트 증폭기 이득',
          factorValue: 30.5,
          unit: 'dB',
          parameters: {
            frequency: '2GHz',
            inputLevel: '-20dBm',
          },
          effectiveDate: '2026-04-01',
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const data = body.data ?? body;
      expect(data.approvalStatus).toBe('pending');
    });
  });

  test.describe('승인 워크플로우', () => {
    test('TM: pending 보정계수 승인 → approved', async ({ request }) => {
      // 먼저 새 pending 보정계수 생성
      const teToken = await getBackendToken(request, 'test_engineer');
      const createResponse = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${teToken}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
          factorType: 'other',
          factorName: 'E2E 승인 테스트 보정계수',
          factorValue: 5.0,
          unit: 'dB',
          effectiveDate: '2026-05-01',
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const created = await createResponse.json();
      const factor = created.data ?? created;
      expect(factor.approvalStatus).toBe('pending');

      // TM으로 승인
      const result = await approveCalibrationFactor(
        request,
        factor.id,
        factor.version,
        'E2E 테스트 승인'
      );

      expect(result.ok).toBeTruthy();
      const data = result.data.data ?? result.data;
      expect(data.approvalStatus).toBe('approved');
    });
  });

  test.describe('반려 워크플로우', () => {
    test('TM: pending 보정계수 반려 → rejected', async ({ request }) => {
      // 새로운 pending 보정계수 생성
      const teToken = await getBackendToken(request, 'test_engineer');
      const createResponse = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${teToken}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E,
          factorType: 'path_loss',
          factorName: 'E2E 반려 테스트 경로 손실',
          factorValue: -12.5,
          unit: 'dB',
          parameters: { distance: '5m' },
          effectiveDate: '2026-04-01',
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const created = await createResponse.json();
      const factor = created.data ?? created;

      const result = await rejectCalibrationFactor(
        request,
        factor.id,
        factor.version,
        '측정값 재검증 필요'
      );

      expect(result.ok).toBeTruthy();
      const data = result.data.data ?? result.data;
      expect(data.approvalStatus).toBe('rejected');
    });
  });

  test.describe('CAS 검증', () => {
    test('보정계수 승인 시 version 불일치 → 409', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');

      // pending 항목 조회
      const pendingResponse = await request.get(`${FACTORS_API}/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (pendingResponse.ok()) {
        const pendingBody = await pendingResponse.json();
        const items = pendingBody.data?.items ?? pendingBody.items ?? pendingBody.data ?? [];
        const pendingItems = Array.isArray(items) ? items : [];

        if (pendingItems.length > 0) {
          const factor = pendingItems[0];

          // 잘못된 version으로 승인 시도
          const response = await request.patch(`${FACTORS_API}/${factor.id}/approve`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: { version: 9999, approverComment: 'CAS 테스트' },
          });

          expect(response.status()).toBe(409);
          const body = await response.json();
          expect(body.code).toBe('VERSION_CONFLICT');
        }
      }
    });
  });

  test.describe('소프트 삭제', () => {
    test('TM: 보정계수 삭제 → deletedAt 설정 (영구 보관)', async ({ request }) => {
      // 새 보정계수 생성 후 삭제
      const teToken = await getBackendToken(request, 'test_engineer');
      const createResponse = await request.post(FACTORS_API, {
        headers: { Authorization: `Bearer ${teToken}`, 'Content-Type': 'application/json' },
        data: {
          equipmentId: TEST_EQUIPMENT_IDS.HARNESS_COUPLER_SUW_A,
          factorType: 'other',
          factorName: 'E2E 삭제 테스트',
          factorValue: 1.0,
          unit: 'dB',
          effectiveDate: '2026-04-01',
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const created = await createResponse.json();
      const factor = created.data ?? created;

      const tmToken = await getBackendToken(request, 'technical_manager');
      // DELETE는 query param으로 version 전달 (body 아님)
      const deleteResponse = await request.delete(
        `${FACTORS_API}/${factor.id}?version=${factor.version}`,
        { headers: { Authorization: `Bearer ${tmToken}` } }
      );

      // 삭제 성공
      expect(deleteResponse.ok()).toBeTruthy();

      // 삭제 후 상세 조회 시 404
      const detailResponse = await request.get(`${FACTORS_API}/${factor.id}`, {
        headers: { Authorization: `Bearer ${tmToken}` },
      });
      expect(detailResponse.status()).toBe(404);
    });
  });
});
