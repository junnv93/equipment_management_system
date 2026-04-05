/**
 * WF-19: 중간점검표 3단계 승인 (UL-QP-18-03) ★P1
 *
 * 교정 기록 ���위의 중간점검표: draft → submitted → reviewed → approved.
 * 반려 경로: submitted 또는 reviewed → rejected.
 *
 * @see docs/workflows/critical-workflows.md WF-19
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createIntermediateInspection,
  submitIntermediateInspection,
  reviewIntermediateInspection,
  approveIntermediateInspection,
  rejectIntermediateInspection,
  extractId,
  apiGet,
  apiPatch,
  resetIntermediateInspections,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_IDS } from '../shared/constants/shared-test-data';

/** WF-19 전용 — CALIB_001 (시드 교정 기록) */
const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_001;

const today = new Date().toISOString().split('T')[0];

test.describe('WF-19: 중간점검표 3단계 승인', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  test.describe('정상 승인 흐름', () => {
    test.describe.configure({ mode: 'serial' });

    let inspectionId: string;

    test('Step 1: TE가 중간점검 생성 (draft)', async ({ testOperatorPage: page }) => {
      const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
        inspectionDate: today,
        classification: 'calibrated',
        inspectionCycle: '6 months',
        overallResult: 'pass',
        remarks: 'WF-19 정상 흐름 테스트',
        items: [
          {
            itemNumber: 1,
            checkItem: '출력 레벨 확인',
            checkCriteria: '±0.5 dB 이내',
            checkResult: '0.3 dB',
            judgment: 'pass',
          },
          {
            itemNumber: 2,
            checkItem: '주파수 정확도 확인',
            checkCriteria: '±10 Hz 이내',
            checkResult: '5 Hz',
            judgment: 'pass',
          },
        ],
      });
      inspectionId = extractId(body);

      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('draft');
    });

    test('Step 2: 상세 조회 — draft 상태 + 항목 확인', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const resp = await apiGet(
        page,
        `/api/intermediate-inspections/${inspectionId}`,
        'test_engineer'
      );
      const body = await resp.json();
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('draft');
    });

    test('Step 3: TE가 제출 → submitted', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await submitIntermediateInspection(page, inspectionId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('submitted');
    });

    test('Step 4: TM이 검토 → reviewed', async ({ techManagerPage: page }) => {
      await clearBackendCache();
      const body = await reviewIntermediateInspection(page, inspectionId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('reviewed');
    });

    test('Step 5: LM이 최종 승인 → approved', async ({ siteAdminPage: page }) => {
      await clearBackendCache();
      const body = await approveIntermediateInspection(page, inspectionId, 'lab_manager');
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('approved');
    });

    test('Step 6: 최종 상태 검증 — approvedAt/By 존재', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const resp = await apiGet(
        page,
        `/api/intermediate-inspections/${inspectionId}`,
        'test_engineer'
      );
      const body = await resp.json();
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('approved');
      expect(data.approvedBy).toBeTruthy();
      expect(data.approvedAt).toBeTruthy();
    });
  });

  test.describe('반려 흐름', () => {
    test.describe.configure({ mode: 'serial' });

    let rejInspectionId: string;

    test('Step 7: 새 점검표 생성 + 제출', async ({ testOperatorPage: page }) => {
      const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
        inspectionDate: today,
        overallResult: 'conditional',
        remarks: 'WF-19 반려 흐름 테스트',
        items: [
          {
            itemNumber: 1,
            checkItem: '반려 테스트 항목',
            checkCriteria: '기준값 ���내',
          },
        ],
      });
      rejInspectionId = extractId(body);

      await clearBackendCache();
      await submitIntermediateInspection(page, rejInspectionId);
    });

    test('Step 8: TM이 반려 → rejected', async ({ techManagerPage: page }) => {
      await clearBackendCache();
      const body = await rejectIntermediateInspection(
        page,
        rejInspectionId,
        'WF-19: 점검 항목 보완 필요 — 수락 기준 미기재'
      );
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.approvalStatus).toBe('rejected');
      expect(data.rejectionReason).toContain('보완 필요');
    });

    test('Step 9: rejected 상태에서 approve 시도 → 실패', async ({ siteAdminPage: page }) => {
      await clearBackendCache();
      const detailResp = await apiGet(
        page,
        `/api/intermediate-inspections/${rejInspectionId}`,
        'lab_manager'
      );
      const detail = await detailResp.json();
      const data = (detail.data ?? detail) as Record<string, unknown>;
      const version = data.version as number;

      const resp = await apiPatch(
        page,
        `/api/intermediate-inspections/${rejInspectionId}/approve`,
        { version },
        'lab_manager'
      );
      // rejected → approve는 400 (INVALID_STATUS_TRANSITION)
      expect(resp.status()).toBe(400);
    });
  });
});
