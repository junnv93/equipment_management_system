/**
 * WF-14b: 소프트웨어 유효성 확인 (UL-QP-18-09) ★P2
 *
 * 방법 1: 공급자 시연 — TE 양식 작성 → TM 확인 → QM 등록
 * 방법 2: UL 자체 시험 — TE 시험 실시 → TM 승인 → QM 등록
 *
 * @see docs/workflows/critical-workflows.md WF-14b
 * @see docs/procedure/시험소프트웨어유효성확인.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createTestSoftware,
  createSoftwareValidation,
  submitSoftwareValidation,
  approveSoftwareValidation,
  qualityApproveSoftwareValidation,
  rejectSoftwareValidation,
  extractId,
  clearBackendCache,
  cleanupSharedPool,
  apiGet,
} from './helpers/workflow-helpers';

test.describe('WF-14b: 소프트웨어 유효성 확인', () => {
  test.describe.configure({ mode: 'serial' });

  let softwareId: string;

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  // 공통 전제: 시험용 소프트웨어 등록
  test('전제: 시험용 소프트웨어 등록', async ({ testOperatorPage: page }) => {
    const body = await createTestSoftware(page, {
      name: 'WF-14b 유효성 대상 소프트웨어',
      softwareVersion: '2.0.0',
      testField: 'RED',
      manufacturer: 'Newtons4th Ltd',
      requiresValidation: true,
    });
    softwareId = extractId(body);
    expect(softwareId).toBeTruthy();
  });

  // ====================================================================
  // 방법 1: 공급자 시연 (vendor)
  // ====================================================================

  test.describe('방법 1: 공급자 시연', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 1: TE가 공급자 시연 양식 작성 (draft)', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(page, softwareId, 'vendor', {
        vendorName: 'Newtons4th Ltd',
        vendorSummary: 'IECSoft v2.6-U 업데이트: 최신 standard 대응',
        softwareVersion: '2_6-U',
      });
      validationId = extractId(body);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(validationId).toBeTruthy();
      expect(data.status).toBe('draft');
      expect(data.validationType).toBe('vendor');
    });

    test('Step 2: TE가 양식 제출', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await submitSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('submitted');
    });

    test('Step 3: TM이 기술책임자 승인', async ({ techManagerPage: page }) => {
      await clearBackendCache();
      const body = await approveSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.technicalApproverId).toBeTruthy();
      expect(data.technicalApprovedAt).toBeTruthy();
    });

    test('Step 4: QM이 품질책임자 등록', async ({ qualityManagerPage: page }) => {
      await clearBackendCache();
      const body = await qualityApproveSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('quality_approved');
      expect(data.qualityApproverId).toBeTruthy();
      expect(data.qualityApprovedAt).toBeTruthy();
    });
  });

  // ====================================================================
  // 방법 2: UL 자체 시험 (self)
  // ====================================================================

  test.describe('방법 2: UL 자체 시험', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 1: TE가 자체 시험 양식 작성 (draft)', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(page, softwareId, 'self', {
        referenceDocuments: 'IEC 62209-1528:2020',
        operatingUnitDescription: 'SAR 측정 시스템',
        softwareComponents: 'DASY8 Module SAR v16.2',
        hardwareComponents: 'EX3DV4 프로브, CDA-5 로봇',
        acquisitionFunctions: [
          {
            functionName: 'SAR 측정 데이터 획득',
            independentMethod: '수동 프로브 스캔 비교',
            acceptanceCriteria: '차이 < 5%',
          },
        ],
        processingFunctions: [
          {
            functionName: 'SAR 값 계산',
            independentMethod: '수동 계산 비교',
            acceptanceCriteria: '차이 < 3%',
          },
        ],
        controlFunctions: [
          {
            controlledFunction: '로봇 이동 제어',
            expectedFunction: 'XYZ 좌표 이동',
            observedFunction: '정상 이동 확인',
            independentMethod: '물리적 위치 확인',
            acceptanceCriteria: '오차 < 1mm',
          },
        ],
        softwareVersion: '16.2.2.1588',
      });
      validationId = extractId(body);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(validationId).toBeTruthy();
      expect(data.status).toBe('draft');
      expect(data.validationType).toBe('self');
    });

    test('Step 2: TE가 양식 제출', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await submitSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('submitted');
    });

    test('Step 3: TM이 기술책임자 승인', async ({ techManagerPage: page }) => {
      await clearBackendCache();
      const body = await approveSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.technicalApproverId).toBeTruthy();
    });

    test('Step 4: QM이 품질책임자 등록 완료', async ({ qualityManagerPage: page }) => {
      await clearBackendCache();
      const body = await qualityApproveSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('quality_approved');
    });
  });

  // ====================================================================
  // 반려 경로
  // ====================================================================

  test.describe('반려 → 재제출 경로', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 1: TE가 양식 작성 + 제출', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(page, softwareId, 'vendor', {
        vendorName: 'Test Vendor (반려 테스트)',
        vendorSummary: '반려 테스트용 양식',
        softwareVersion: '1.0.0-rc1',
      });
      validationId = extractId(body);
      await submitSoftwareValidation(page, validationId);
    });

    test('Step 2: TM이 반려', async ({ techManagerPage: page }) => {
      await clearBackendCache();
      const body = await rejectSoftwareValidation(
        page,
        validationId,
        '공급자 정보가 부족합니다. 보완 후 재제출 요청'
      );
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('rejected');
      expect(data.rejectionReason).toContain('공급자 정보가 부족');
    });

    test('Step 3: 반려 상태 확인', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const resp = await apiGet(page, `/api/software-validations/${validationId}`, 'test_engineer');
      const body = await resp.json();
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('rejected');
    });
  });
});
