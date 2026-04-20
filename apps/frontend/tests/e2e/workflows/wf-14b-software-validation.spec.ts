/**
 * WF-14b: 소프트웨어 유효성 확인 (UL-QP-18-09) ★P2
 *
 * 방법 1: 공급자 시연 — TE 양식 작성 → TM 확인 → QM 등록
 * 방법 2: UL 자체 시험 — TE 시험 실시 → TM 승인 → QM 등록
 * 보안 게이트: 자기승인 차단(ISO 17025 §6.2.2) + 이중승인 차단
 * 재검증 흐름: rejected → revise → draft 복귀
 * DOCX 검증: T6 제어기능 3행 export XML 검증
 *
 * @see docs/workflows/critical-workflows.md WF-14b
 * @see docs/procedure/절차서/시험소프트웨어유효성확인.md
 */

import PizZip from 'pizzip';
import { test, expect } from '../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../shared/constants/shared-test-data';
import {
  createTestSoftware,
  createSoftwareValidation,
  submitSoftwareValidation,
  approveSoftwareValidation,
  qualityApproveSoftwareValidation,
  rejectSoftwareValidation,
  reviseSoftwareValidation,
  extractId,
  extractVersion,
  clearBackendCache,
  cleanupSharedPool,
  apiGet,
  apiPatch,
} from './helpers/workflow-helpers';
import { getBackendToken } from '../shared/helpers/api-helpers';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

const BACKEND_URL = BASE_URLS.BACKEND;

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

  // ====================================================================
  // Steps 12-13: 보안 게이트 — ISO 17025 §6.2.2 독립성 요건
  // ====================================================================

  test.describe('자기승인 차단 (Step 12)', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 12-setup: TE가 양식 작성 + 제출', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(page, softwareId, 'vendor', {
        vendorName: 'Self-Approval Test Vendor',
        vendorSummary: '자기승인 차단 검증용',
        softwareVersion: '1.0.0-sa',
      });
      validationId = extractId(body);
      await submitSoftwareValidation(page, validationId);
    });

    test('Step 12: TE(제출자)가 직접 approve 시도 → 403 SELF_APPROVAL_FORBIDDEN', async ({
      testOperatorPage: page,
    }) => {
      await clearBackendCache();
      const detail = await apiGet(
        page,
        `/api/software-validations/${validationId}`,
        'test_engineer'
      );
      const body = await detail.json();
      const version = extractVersion(body);
      const resp = await apiPatch(
        page,
        `/api/software-validations/${validationId}/approve`,
        { version, comment: '자기승인 시도' },
        'test_engineer'
      );
      expect(resp.status()).toBe(403);
      const err = await resp.json();
      const errCode = (err.error ?? err) as Record<string, unknown>;
      expect(errCode.code ?? errCode.message ?? JSON.stringify(err)).toContain(
        'SELF_APPROVAL_FORBIDDEN'
      );
    });
  });

  test.describe('이중승인 차단 (Step 13)', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 13-setup: TE 작성·제출 → TM 기술승인 완료', async ({
      testOperatorPage: tePage,
      techManagerPage: tmPage,
    }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(tePage, softwareId, 'vendor', {
        vendorName: 'Dual-Approval Test Vendor',
        vendorSummary: '이중승인 차단 검증용',
        softwareVersion: '1.0.0-da',
      });
      validationId = extractId(body);
      await submitSoftwareValidation(tePage, validationId);
      await clearBackendCache();
      await approveSoftwareValidation(tmPage, validationId);
    });

    test('Step 13: TM(기술승인자)이 quality-approve 시도 → 403 DUAL_APPROVAL_SAME_PERSON_FORBIDDEN', async ({
      techManagerPage: page,
    }) => {
      await clearBackendCache();
      const detail = await apiGet(
        page,
        `/api/software-validations/${validationId}`,
        'technical_manager'
      );
      const body = await detail.json();
      const version = extractVersion(body);
      const resp = await apiPatch(
        page,
        `/api/software-validations/${validationId}/quality-approve`,
        { version, comment: '이중승인 시도' },
        'technical_manager'
      );
      expect(resp.status()).toBe(403);
      const err = await resp.json();
      const errCode = (err.error ?? err) as Record<string, unknown>;
      expect(errCode.code ?? errCode.message ?? JSON.stringify(err)).toContain(
        'DUAL_APPROVAL_SAME_PERSON_FORBIDDEN'
      );
    });
  });

  // ====================================================================
  // Step 14: 재검증 흐름 — rejected → revise → draft 복귀
  // ====================================================================

  test.describe('재검증 흐름 (Step 14)', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 14-setup: TE 작성·제출 → TM 반려', async ({
      testOperatorPage: tePage,
      techManagerPage: tmPage,
    }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(tePage, softwareId, 'vendor', {
        vendorName: 'Revise Test Vendor',
        vendorSummary: '재검증 흐름 테스트',
        softwareVersion: '1.0.0-rv',
      });
      validationId = extractId(body);
      await submitSoftwareValidation(tePage, validationId);
      await clearBackendCache();
      await rejectSoftwareValidation(tmPage, validationId, '보완 필요 — 재검증 흐름 테스트');
    });

    test('Step 14: TE가 revise 호출 → status draft 복귀', async ({ testOperatorPage: page }) => {
      await clearBackendCache();
      const body = await reviseSoftwareValidation(page, validationId);
      const data = (body.data ?? body) as Record<string, unknown>;
      expect(data.status).toBe('draft');
      // 반려 정보 초기화 검증
      expect(data.rejectionReason).toBeNull();
      expect(data.rejectedBy).toBeNull();
    });
  });

  // ====================================================================
  // Step 15: T6 DOCX 검증 — 제어기능 3행 export XML
  // ====================================================================

  test.describe('T6 DOCX export 검증 (Step 15)', () => {
    test.describe.configure({ mode: 'serial' });

    let validationId: string;

    test('Step 15-setup: self 타입 유효성확인 전체 승인', async ({
      testOperatorPage: tePage,
      techManagerPage: tmPage,
      qualityManagerPage: qmPage,
    }) => {
      await clearBackendCache();
      const body = await createSoftwareValidation(tePage, softwareId, 'self', {
        referenceDocuments: 'IEC 62209-1528:2020',
        operatingUnitDescription: 'T6 DOCX 검증용 시스템',
        softwareComponents: 'DASY8 SAR v16.2',
        hardwareComponents: 'EX3DV4 프로브',
        acquisitionFunctions: [
          {
            functionName: 'T6 데이터 획득',
            independentMethod: '수동 스캔',
            acceptanceCriteria: '차이 < 5%',
          },
        ],
        processingFunctions: [
          {
            functionName: 'T6 데이터 처리',
            independentMethod: '수동 계산',
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
        softwareVersion: '16.2.2-t6test',
      });
      validationId = extractId(body);
      await submitSoftwareValidation(tePage, validationId);
      await clearBackendCache();
      await approveSoftwareValidation(tmPage, validationId);
      await clearBackendCache();
      await qualityApproveSoftwareValidation(qmPage, validationId);
    });

    test('Step 15: UL-QP-18-09 DOCX export → T6 제어기능 XML 검증', async ({
      testOperatorPage: page,
    }) => {
      await clearBackendCache();
      const token = await getBackendToken(page, 'test_engineer');
      const resp = await page.request.get(
        `${BACKEND_URL}/api/reports/export/form/UL-QP-18-09?validationId=${validationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      expect(resp.status()).toBe(200);

      const docxBuffer = await resp.body();
      const zip = new PizZip(docxBuffer);
      const docXml = zip.file('word/document.xml')?.asText();
      expect(docXml, 'word/document.xml이 DOCX 안에 존재해야 함').toBeTruthy();

      // T6 제어기능(controlFunctions) 첫 번째 항목 검증
      expect(docXml).toContain('로봇 이동 제어');
      expect(docXml).toContain('XYZ 좌표 이동');
      expect(docXml).toContain('정상 이동 확인');
    });
  });

  // ====================================================================
  // 재검증 배너 (ISO/IEC 17025 §6.4.13)
  // requiresValidation=true + latestValidationId=null → 배너 표시
  // quality_approve 완료 → latestValidationId 채워짐 → 배너 소멸
  // ====================================================================

  test.describe('재검증 배너 라이프사이클', () => {
    test.describe.configure({ mode: 'serial' });

    let bannerSoftwareId: string;
    let bannerValidationId: string;

    test('Step 16: requiresValidation=true + 미검증 소프트웨어 → 배너 표시', async ({
      testOperatorPage: page,
    }) => {
      const body = await createTestSoftware(page, {
        name: 'WF-14b 배너 시나리오 소프트웨어',
        softwareVersion: '3.0.0',
        testField: 'RF',
        manufacturer: 'BannerTest Ltd',
        requiresValidation: true,
      });
      bannerSoftwareId = extractId(body);
      expect(bannerSoftwareId).toBeTruthy();

      await clearBackendCache();
      await page.goto(FRONTEND_ROUTES.SOFTWARE.DETAIL(bannerSoftwareId));
      await expect(page.getByText('유효성 확인이 필요합니다')).toBeVisible({ timeout: 10000 });
    });

    test('Step 17: quality_approve 완료 → 배너 소멸', async ({
      testOperatorPage: tePage,
      techManagerPage: tmPage,
      qualityManagerPage: qmPage,
    }) => {
      const vBody = await createSoftwareValidation(tePage, bannerSoftwareId, {
        validationType: 'vendor',
        vendorName: '배너 소멸 시나리오 공급자',
        vendorSummary: '배너 소멸 검증용',
        receivedDate: new Date().toISOString().slice(0, 10),
        attachmentNote: '배너 테스트 첨부',
        softwareVersion: '3.0.0',
      });
      bannerValidationId = extractId(vBody);
      await submitSoftwareValidation(tePage, bannerValidationId);
      await clearBackendCache();
      await approveSoftwareValidation(tmPage, bannerValidationId);
      await clearBackendCache();
      await qualityApproveSoftwareValidation(qmPage, bannerValidationId);
      await clearBackendCache();

      await tePage.goto(FRONTEND_ROUTES.SOFTWARE.DETAIL(bannerSoftwareId));
      await expect(tePage.getByText('유효성 확인이 필요합니다')).toBeHidden({ timeout: 10000 });
    });
  });
});
