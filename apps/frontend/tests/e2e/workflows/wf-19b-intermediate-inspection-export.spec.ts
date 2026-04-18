/**
 * WF-19b: 중간점검표 양식 내보내기 (UL-QP-18-03)
 *
 * 중간점검 생성 후 QP-18-03 양식으로 docx 내보내기가 정상 동작하는지 검증.
 * 장비 헤더, 점검 항목, 측정 장비 List, 결재란 데이터가 포함되는지 확인.
 *
 * @see docs/procedure/양식/QP-18-03_중간점검표.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createIntermediateInspection,
  extractId,
  resetIntermediateInspections,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';
import PizZip from 'pizzip';

const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_001;
const BACKEND_URL = BASE_URLS.BACKEND;
const today = new Date().toISOString().split('T')[0];

test.describe('WF-19b: 중간점검표 양식 내보내기 (QP-18-03)', () => {
  test.describe.configure({ mode: 'serial' });

  let inspectionId: string;

  test.beforeAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  test('Step 1: 중간점검 생성 후 QP-18-03 export → 200', async ({ testOperatorPage: tePage }) => {
    // 점검 생성
    const createBody = await createIntermediateInspection(tePage, WF_CALIBRATION_ID, {
      inspectionDate: today,
      classification: 'calibrated',
      inspectionCycle: '6개월',
      calibrationValidityPeriod: '1년',
      overallResult: 'pass',
      remarks: 'WF-19b: export 테스트용 중간점검',
      items: [
        {
          itemNumber: 1,
          checkItem: '외관 검사',
          checkCriteria: '마모 상태 확인',
          checkResult: '이상 없음',
          judgment: 'pass',
        },
        {
          itemNumber: 2,
          checkItem: '출력 특성 점검',
          checkCriteria: '제조사 선언 오차범위 이내',
          checkResult: 'Min: 43.63 dB, Max: 46.73 dB',
          judgment: 'pass',
        },
      ],
      measurementEquipment: [],
    });
    inspectionId = extractId(createBody);
    await clearBackendCache();

    // QP-18-03 export 호출
    const token = await getBackendToken(tePage, 'test_engineer');
    const resp = await tePage.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test('Step 2: 존재하지 않는 inspectionId → 404', async ({ testOperatorPage: page }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-03?inspectionId=${fakeId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(resp.status()).toBe(404);
  });

  test('Step 3: inspectionId 파라미터 누락 → 400', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/reports/export/form/UL-QP-18-03`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(400);
  });

  test('Step 4: SSOT 라벨 회귀 — DOCX XML에 INSPECTION_JUDGMENT_LABELS 값 포함', async ({
    testOperatorPage: tePage,
  }) => {
    // Step 1에서 생성한 inspectionId 재사용 (judgment: 'pass' → '합격')
    expect(inspectionId, 'Step 1에서 inspectionId가 설정되어야 함').toBeTruthy();
    await clearBackendCache();

    const token = await getBackendToken(tePage, 'test_engineer');
    const resp = await tePage.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(resp.status()).toBe(200);

    const docxBuffer = await resp.body();

    // PizZip으로 word/document.xml 파싱 → SSOT 라벨 값 검증
    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml')?.asText();
    expect(docXml, 'document.xml이 존재해야 함').toBeTruthy();

    // INSPECTION_JUDGMENT_LABELS: pass → '합격', fail → '불합격'
    // 점검 생성 시 judgment: 'pass' 2건 → 문서에 '합격' 라벨이 반드시 포함
    expect(docXml).toContain('합격');

    // 교정 유효기간 snapshot — 생성 시 calibrationValidityPeriod: '1년' 전달
    expect(docXml).toContain('1년');

    // classification snapshot — 생성 시 classification: 'calibrated'
    // 양식 헤더에는 QP18_CLASSIFICATION_LABELS → '교정기기'로 렌더
    expect(docXml).toContain('교정기기');
  });
});
