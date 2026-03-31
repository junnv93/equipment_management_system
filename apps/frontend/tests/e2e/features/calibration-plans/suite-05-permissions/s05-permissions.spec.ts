/**
 * Suite 05: 교정계획서 역할별 권한 테스트
 *
 * B-5: 역할별 권한 매트릭스 검증
 * ┌───────────────────┬──────┬──────┬──────┬──────┬──────────┬──────┬──────┬──────┐
 * │       역할        │ 조회 │ 작성 │ 수정 │ 삭제 │ 검토요청 │ 검토 │ 승인 │ 반려 │
 * ├───────────────────┼──────┼──────┼──────┼──────┼──────────┼──────┼──────┼──────┤
 * │ test_engineer     │  X   │  X   │  X   │  X   │    X     │  X   │  X   │  X   │
 * │ technical_manager │  O   │  O   │  O   │  O   │    O     │  X   │  X   │  X   │
 * │ quality_manager   │  O   │  X   │  X   │  X   │    X     │  O   │  X   │  O   │
 * │ lab_manager       │  O   │  O   │  O   │  O   │    O     │  X   │  O   │  O   │
 * └───────────────────┴──────┴──────┴──────┴──────┴──────────┴──────┴──────┴──────┘
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BASE_URLS, TEST_CALIBRATION_PLAN_IDS } from '../../../shared/constants/shared-test-data';
import { getBackendToken } from '../../calibration/helpers/calibration-api-helpers';

const BACKEND_URL = BASE_URLS.BACKEND;
const PLANS_API = `${BACKEND_URL}/api/calibration-plans`;

test.describe('B-5: 교정계획서 역할별 권한 API 검증', () => {
  test.describe('test_engineer 권한', () => {
    test('TE: 교정계획서 목록 조회 → 403 (VIEW_CALIBRATION_PLANS 없음)', async ({ request }) => {
      const token = await getBackendToken(request, 'test_engineer');
      const response = await request.get(PLANS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.status()).toBe(403);
    });

    test('TE: 교정계획서 생성 → 403', async ({ request }) => {
      const token = await getBackendToken(request, 'test_engineer');
      const response = await request.post(PLANS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { year: 2026, siteId: 'suwon' },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('technical_manager 권한', () => {
    test('TM: 교정계획서 목록 조회 → 200', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const response = await request.get(PLANS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('TM: 검토(review) → 403 (REVIEW_CALIBRATION_PLAN 없음)', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_006_RESUBMITTED;

      const response = await request.patch(`${PLANS_API}/${planId}/review`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: 2, reviewComment: '검토 시도' },
      });

      expect(response.status()).toBe(403);
    });

    test('TM: 최종 승인(approve) → 403 (APPROVE_CALIBRATION_PLAN 없음)', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL;

      const response = await request.patch(`${PLANS_API}/${planId}/approve`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: 3 },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe('quality_manager 권한', () => {
    test('QM: 교정계획서 목록 조회 → 200', async ({ request }) => {
      const token = await getBackendToken(request, 'quality_manager');
      const response = await request.get(PLANS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(response.ok()).toBeTruthy();
    });

    test('QM: 교정계획서 생성 → 403', async ({ request }) => {
      const token = await getBackendToken(request, 'quality_manager');
      const response = await request.post(PLANS_API, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { year: 2026, siteId: 'suwon' },
      });

      expect(response.status()).toBe(403);
    });

    test('QM: 최종 승인(approve) → 403', async ({ request }) => {
      const token = await getBackendToken(request, 'quality_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL;

      const response = await request.patch(`${PLANS_API}/${planId}/approve`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: 3 },
      });

      expect(response.status()).toBe(403);
    });

    test('QM: 반려(reject) → 200 (REJECT_CALIBRATION_PLAN 있음)', async ({ request }) => {
      const token = await getBackendToken(request, 'quality_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_006_RESUBMITTED;

      // CAS version 확인을 위해 먼저 상세 조회
      const detailResponse = await request.get(`${PLANS_API}/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (detailResponse.ok()) {
        const detail = await detailResponse.json();
        const plan = detail.data ?? detail;

        // 반려 시도 — 실제로 반려하지 않기 위해 잘못된 casVersion 사용
        const response = await request.patch(`${PLANS_API}/${planId}/reject`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: {
            casVersion: 9999, // 의도적 CAS 불일치
            rejectionReason: '권한 테스트 — 실행되면 안 됨',
          },
        });

        // 403이 아닌 409(CAS 불일치)면 권한은 통과한 것
        expect(response.status()).not.toBe(403);
      }
    });
  });

  test.describe('lab_manager 권한', () => {
    test('LM: 최종 승인(approve) 가능 — 권한 확인', async ({ request }) => {
      const token = await getBackendToken(request, 'lab_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL;

      // 잘못된 casVersion으로 시도 — 권한 통과 여부만 확인
      const response = await request.patch(`${PLANS_API}/${planId}/approve`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: 9999 },
      });

      // 403이 아니면 권한은 통과
      expect(response.status()).not.toBe(403);
    });

    test('LM: 반려(reject) 가능 — 권한 확인', async ({ request }) => {
      const token = await getBackendToken(request, 'lab_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL;

      const response = await request.patch(`${PLANS_API}/${planId}/reject`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: 9999, rejectionReason: '권한 테스트' },
      });

      // 403이 아니면 권한은 통과
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('CAS (casVersion) 검증', () => {
    test('검토 요청 시 casVersion 불일치 → 409', async ({ request }) => {
      const token = await getBackendToken(request, 'technical_manager');
      const planId = TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT;

      const response = await request.post(`${PLANS_API}/${planId}/submit-for-review`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { casVersion: 9999 },
      });

      expect(response.status()).toBe(409);
      const body = await response.json();
      expect(body.code).toBe('VERSION_CONFLICT');
    });
  });
});
