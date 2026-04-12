/**
 * WF-19e: 중간점검 — 전체 섹션 타입 + 사진 + 3단계 승인 + DOCX Export 검증
 *
 * 모든 결과 섹션 타입(title, data_table, text, photo, rich_table)을
 * 포함한 중간점검을 생성하고, 3단계 승인 후 DOCX로 내보내어
 * 각 섹션이 문서에 정상 포함되는지 검증.
 *
 * 생성된 DOCX는 tests/e2e/output/ 에 저장되어 수동 확인 가능.
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiPost,
  apiGet,
  createIntermediateInspection,
  extractId,
  resetIntermediateInspections,
  submitIntermediateInspection,
  reviewIntermediateInspection,
  approveIntermediateInspection,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';
import PizZip from 'pizzip';
import * as fs from 'fs';
import * as path from 'path';

const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_001;
const BACKEND_URL = BASE_URLS.BACKEND;
const today = new Date().toISOString().split('T')[0];
const ROLE_TE = 'test_engineer';
const ROLE_TM = 'technical_manager';
const ROLE_LM = 'lab_manager';

// Output directory for generated DOCX
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

test.describe('WF-19e: 전체 섹션 타입 + 사진 + DOCX Export', () => {
  test.describe.configure({ mode: 'serial' });

  let inspectionId: string;
  let photoDocumentId: string;
  let richTableDocId1: string;
  let richTableDocId2: string;

  test.beforeAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  // ========================================================================
  // Step 1: 중간점검 생성 (기본 점검항목 3개)
  // ========================================================================

  test('Step 1: 중간점검 생성 (점검항목 3개 — 외관/전기/출력)', async ({
    testOperatorPage: page,
  }) => {
    const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
      inspectionDate: today,
      classification: 'calibrated',
      inspectionCycle: '6개월',
      calibrationValidityPeriod: '1년',
      overallResult: 'pass',
      remarks: 'WF-19e: 전체 섹션 타입 + 사진 통합 테스트',
      items: [
        {
          itemNumber: 1,
          checkItem: '외관 점검',
          checkCriteria: '파손, 변형, 부식 여부 확인',
          checkResult: '이상 없음',
          judgment: 'pass',
        },
        {
          itemNumber: 2,
          checkItem: '전기 안전 점검',
          checkCriteria: '접지 저항 < 0.1Ω',
          checkResult: '0.05Ω (합격)\n접지선 상태 양호\n절연저항 500MΩ 이상',
          judgment: 'pass',
        },
        {
          itemNumber: 3,
          checkItem: '출력 특성 점검',
          checkCriteria: '제조사 사양 범위 이내 (±2.5 dB)',
          checkResult: 'Min: 43.8 dB, Max: 46.5 dB',
          judgment: 'pass',
        },
      ],
    });
    inspectionId = extractId(body);
    expect(inspectionId).toBeTruthy();
  });

  // ========================================================================
  // Step 2: 사진 업로드 (photo 섹션 + rich_table 셀용)
  // ========================================================================

  test('Step 2a: 사진 업로드 — photo 섹션용 (red)', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, ROLE_TE);
    const imgPath = path.join(
      __dirname,
      '..',
      'shared',
      'fixtures',
      'images',
      'test-photo-red.png'
    );
    const imgBuffer = fs.readFileSync(imgPath);

    const resp = await page.request.post(`${BACKEND_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'test-photo-red.png', mimeType: 'image/png', buffer: imgBuffer },
        documentType: 'report',
        intermediateInspectionId: inspectionId,
      },
    });
    if (resp.status() !== 201) {
      const errBody = await resp.text();
      throw new Error(`Document upload failed: ${resp.status()} — ${errBody}`);
    }
    const body = await resp.json();
    photoDocumentId = body.document.id;
    expect(photoDocumentId).toBeTruthy();
  });

  test('Step 2b: 사진 업로드 — rich_table 셀용 (blue)', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, ROLE_TE);
    const imgPath = path.join(
      __dirname,
      '..',
      'shared',
      'fixtures',
      'images',
      'test-photo-blue.png'
    );
    const imgBuffer = fs.readFileSync(imgPath);

    const resp = await page.request.post(`${BACKEND_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'test-photo-blue.png', mimeType: 'image/png', buffer: imgBuffer },
        documentType: 'report',
        intermediateInspectionId: inspectionId,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    richTableDocId1 = body.document.id;
  });

  test('Step 2c: 사진 업로드 — rich_table 셀용 (green)', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, ROLE_TE);
    const imgPath = path.join(
      __dirname,
      '..',
      'shared',
      'fixtures',
      'images',
      'test-photo-green.png'
    );
    const imgBuffer = fs.readFileSync(imgPath);

    const resp = await page.request.post(`${BACKEND_URL}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'test-photo-green.png', mimeType: 'image/png', buffer: imgBuffer },
        documentType: 'report',
        intermediateInspectionId: inspectionId,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    richTableDocId2 = body.document.id;
  });

  // ========================================================================
  // Step 3: 결과 섹션 5가지 타입 모두 추가
  // ========================================================================

  test('Step 3a: title 섹션 추가', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 0,
        sectionType: 'title',
        title: '측정 결과 상세 (RF Pre-Amplifier Gain Test)',
      },
      ROLE_TE
    );
    expect(resp.status()).toBe(201);
  });

  test('Step 3b: data_table 섹션 추가 (10행 측정 데이터)', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 1,
        sectionType: 'data_table',
        title: 'Gain vs Frequency (1-18 GHz)',
        tableData: {
          headers: ['Frequency (GHz)', 'Gain (dB)', 'Spec Min', 'Spec Max', 'Result'],
          rows: [
            ['1.0', '44.12', '42.5', '47.5', 'PASS'],
            ['2.0', '44.35', '42.5', '47.5', 'PASS'],
            ['4.0', '44.89', '42.5', '47.5', 'PASS'],
            ['6.0', '45.01', '42.5', '47.5', 'PASS'],
            ['8.0', '45.23', '42.5', '47.5', 'PASS'],
            ['10.0', '45.67', '42.5', '47.5', 'PASS'],
            ['12.0', '46.01', '42.5', '47.5', 'PASS'],
            ['14.0', '46.22', '42.5', '47.5', 'PASS'],
            ['16.0', '46.55', '42.5', '47.5', 'PASS'],
            ['18.0', '46.73', '42.5', '47.5', 'PASS'],
          ],
        },
      },
      ROLE_TE
    );
    expect(resp.status()).toBe(201);
  });

  test('Step 3c: text 섹션 추가 (분석 코멘트)', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 2,
        sectionType: 'text',
        title: '분석 결과 및 소견',
        content:
          '1-18 GHz 전 대역에서 Gain 범위 44.12~46.73 dB로 제조사 사양(45 ± 2.5 dB) 이내.\n' +
          '고주파 대역(12-18 GHz)에서 약간의 상승 경향이 관찰되나 규격 범위 내에 있어 문제 없음.\n' +
          '다음 점검 시 고주파 대역 추이를 재확인할 것을 권장.',
      },
      ROLE_TE
    );
    expect(resp.status()).toBe(201);
  });

  test('Step 3d: photo 섹션 추가 (측정 셋업 사진)', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 3,
        sectionType: 'photo',
        title: '측정 셋업 사진',
        documentId: photoDocumentId,
        imageWidthCm: 14,
        imageHeightCm: 10,
      },
      ROLE_TE
    );
    expect(resp.status()).toBe(201);
  });

  test('Step 3e: rich_table 섹션 추가 (텍스트+이미지 혼합 테이블)', async ({
    testOperatorPage: page,
  }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 4,
        sectionType: 'rich_table',
        title: '주파수별 스펙트럼 캡처',
        richTableData: {
          headers: ['주파수 대역', '스펙트럼 캡처', '판정'],
          rows: [
            [
              { type: 'text', value: '1-6 GHz (저대역)' },
              { type: 'image', documentId: richTableDocId1, widthCm: 6, heightCm: 4 },
              { type: 'text', value: '합격' },
            ],
            [
              { type: 'text', value: '6-18 GHz (고대역)' },
              { type: 'image', documentId: richTableDocId2, widthCm: 6, heightCm: 4 },
              { type: 'text', value: '합격' },
            ],
          ],
        },
      },
      ROLE_TE
    );
    expect(resp.status()).toBe(201);
  });

  test('Step 3f: 결과 섹션 전체 목록 검증 (5개)', async ({ testOperatorPage: page }) => {
    const resp = await apiGet(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      ROLE_TE
    );
    expect(resp.status()).toBe(200);
    const sections = await resp.json();
    expect(sections).toHaveLength(5);

    const types = sections.map((s: { sectionType: string }) => s.sectionType);
    expect(types).toEqual(['title', 'data_table', 'text', 'photo', 'rich_table']);
  });

  // ========================================================================
  // Step 4: 3단계 승인 (submit → review → approve)
  // ========================================================================

  test('Step 4a: 제출 (TE → TM)', async ({ testOperatorPage: page }) => {
    await submitIntermediateInspection(page, inspectionId, ROLE_TE);
  });

  test('Step 4b: 검토 (TM)', async ({ testOperatorPage: page }) => {
    await reviewIntermediateInspection(page, inspectionId, ROLE_TM);
  });

  test('Step 4c: 승인 (LM)', async ({ testOperatorPage: page }) => {
    await approveIntermediateInspection(page, inspectionId, ROLE_LM);
  });

  test('Step 4d: 승인 상태 확인', async ({ testOperatorPage: page }) => {
    const resp = await apiGet(page, `/api/intermediate-inspections/${inspectionId}`, ROLE_TE);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.approvalStatus).toBe('approved');
  });

  // ========================================================================
  // Step 5: DOCX Export + 내용 검증 + 파일 저장
  // ========================================================================

  test('Step 5: DOCX Export → 전체 섹션 포함 검증 + 파일 저장', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const token = await getBackendToken(page, ROLE_TE);
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    const docxBuffer = await resp.body();
    expect(docxBuffer.length).toBeGreaterThan(1000);

    // === DOCX 파일 저장 (수동 확인용) ===
    const outputPath = path.join(OUTPUT_DIR, `WF-19e_중간점검_전체섹션_${today}.docx`);
    fs.writeFileSync(outputPath, docxBuffer);

    // === PizZip으로 document.xml 파싱 → 콘텐츠 검증 ===
    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml')?.asText();
    expect(docXml).toBeTruthy();

    // (1) 기본 점검표 콘텐츠
    expect(docXml).toContain('외관 점검');
    expect(docXml).toContain('전기 안전 점검');
    expect(docXml).toContain('출력 특성 점검');
    expect(docXml).toContain('접지 저항');
    expect(docXml).toContain('WF-19e');

    // (2) title 섹션
    expect(docXml).toContain('RF Pre-Amplifier Gain Test');

    // (3) data_table 섹션 — 헤더 + 데이터
    expect(docXml).toContain('Frequency (GHz)');
    expect(docXml).toContain('Gain (dB)');
    expect(docXml).toContain('44.12'); // 첫 행
    expect(docXml).toContain('46.73'); // 마지막 행

    // (4) text 섹션
    expect(docXml).toContain('분석 결과 및 소견');
    expect(docXml).toContain('고주파 대역');

    // (5) photo 섹션 — 제목 확인 (이미지는 바이너리라 XML에서 relationship으로 참조)
    expect(docXml).toContain('측정 셋업 사진');

    // (6) rich_table 섹션 — 제목 + 텍스트 셀
    expect(docXml).toContain('주파수별 스펙트럼 캡처');
    expect(docXml).toContain('1-6 GHz');
    expect(docXml).toContain('6-18 GHz');
    expect(docXml).toContain('합격');

    // (7) 이미지 관계 확인 (photo + rich_table 이미지가 포함되었는지)
    const relsXml = zip.file('word/_rels/document.xml.rels')?.asText();
    if (relsXml) {
      // 이미지 관계가 1개 이상 존재해야 함
      const imageRelCount = (relsXml.match(/image/gi) || []).length;
      expect(imageRelCount).toBeGreaterThanOrEqual(1);
    }

    // 결과 출력
    // eslint-disable-next-line no-console
    console.log(`\n✅ DOCX saved: ${outputPath}`);
    // eslint-disable-next-line no-console
    console.log(`   Size: ${(docxBuffer.length / 1024).toFixed(1)} KB`);
  });
});
