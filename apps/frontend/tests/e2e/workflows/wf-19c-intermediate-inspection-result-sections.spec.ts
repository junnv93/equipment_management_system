/**
 * WF-19c: 중간점검 결과 섹션 동적 콘텐츠 E2E
 *
 * 결과 섹션 CRUD → Export → DOCX 내 동적 테이블/텍스트 포함 검증.
 * RF 장비 측정 데이터 테이블과 텍스트 블록이 문서에 정상 렌더링되는지 확인.
 *
 * @see docs/procedure/양식/QP-18-03_중간점검표.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  apiPost,
  apiGet,
  apiPatch,
  apiDelete,
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
const ROLE = 'test_engineer';

test.describe('WF-19c: 중간점검 결과 섹션 + Export 검증', () => {
  test.describe.configure({ mode: 'serial' });

  let inspectionId: string;
  let sectionTitleId: string;
  let sectionTableId: string;
  let sectionTextId: string;

  test.beforeAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  // ========================================================================
  // Step 1: 중간점검 생성
  // ========================================================================

  test('Step 1: 중간점검 생성 (RF 장비 — PRE-AMPLIFIER)', async ({ testOperatorPage: page }) => {
    const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
      inspectionDate: today,
      classification: 'calibrated',
      inspectionCycle: '6개월',
      calibrationValidityPeriod: '1년',
      overallResult: 'pass',
      remarks: 'WF-19c: 결과 섹션 E2E',
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
          checkCriteria: '제조사 선언 오차범위 이내 (45 ± 2.5 dB)',
          checkResult: 'Min: 43.63 dB, Max: 46.73 dB',
          judgment: 'pass',
        },
      ],
    });
    inspectionId = extractId(body);
    expect(inspectionId).toBeTruthy();
  });

  // ========================================================================
  // Step 2: 결과 섹션 CRUD
  // ========================================================================

  test('Step 2a: 제목 섹션 추가', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      { sortOrder: 0, sectionType: 'title', title: '측정 결과 (RF Output Characteristics)' },
      ROLE
    );
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    sectionTitleId = body.id;
    expect(sectionTitleId).toBeTruthy();
    expect(body.sectionType).toBe('title');
  });

  test('Step 2b: 데이터 테이블 섹션 추가 (28행 RF 측정 데이터)', async ({
    testOperatorPage: page,
  }) => {
    const headers = ['Frequency (GHz)', 'Gain (dB)', 'Specification', 'Pass/Fail'];
    const rows = [
      ['1.0', '44.12', '45 ± 2.5', 'Pass'],
      ['2.0', '44.35', '45 ± 2.5', 'Pass'],
      ['4.0', '44.89', '45 ± 2.5', 'Pass'],
      ['6.0', '45.01', '45 ± 2.5', 'Pass'],
      ['8.0', '45.23', '45 ± 2.5', 'Pass'],
      ['10.0', '45.67', '45 ± 2.5', 'Pass'],
      ['12.0', '46.01', '45 ± 2.5', 'Pass'],
      ['14.0', '46.22', '45 ± 2.5', 'Pass'],
      ['16.0', '46.55', '45 ± 2.5', 'Pass'],
      ['18.0', '46.73', '45 ± 2.5', 'Pass'],
    ];

    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 1,
        sectionType: 'data_table',
        title: 'Gain vs Frequency (1-18 GHz)',
        tableData: { headers, rows },
      },
      ROLE
    );
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    sectionTableId = body.id;
    expect(body.sectionType).toBe('data_table');
    expect(body.tableData).toEqual({ headers, rows });
  });

  test('Step 2c: 텍스트 섹션 추가 (분석 결과)', async ({ testOperatorPage: page }) => {
    const resp = await apiPost(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      {
        sortOrder: 2,
        sectionType: 'text',
        title: '분석 결과',
        content:
          '1-18 GHz 대역에서 Gain 범위 44.12~46.73 dB로 제조사 선언 오차범위(45 ± 2.5 dB) 이내입니다.',
      },
      ROLE
    );
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    sectionTextId = body.id;
    expect(body.sectionType).toBe('text');
  });

  test('Step 2d: 결과 섹션 목록 조회 → sortOrder 순', async ({ testOperatorPage: page }) => {
    const resp = await apiGet(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      ROLE
    );
    expect(resp.status()).toBe(200);
    const sections = await resp.json();
    expect(sections).toHaveLength(3);
    expect(sections[0].sectionType).toBe('title');
    expect(sections[1].sectionType).toBe('data_table');
    expect(sections[2].sectionType).toBe('text');
    // sortOrder 순서 검증
    expect(sections[0].sortOrder).toBe(0);
    expect(sections[1].sortOrder).toBe(1);
    expect(sections[2].sortOrder).toBe(2);
  });

  test('Step 2e: 섹션 수정 (제목 변경)', async ({ testOperatorPage: page }) => {
    const resp = await apiPatch(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections/${sectionTitleId}`,
      { title: '측정 결과 (RF Output Gain)' },
      ROLE
    );
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.title).toBe('측정 결과 (RF Output Gain)');
  });

  // ========================================================================
  // Step 3: Export 후 DOCX 내용 검증
  // ========================================================================

  test('Step 3: QP-18-03 Export → DOCX 내 동적 테이블/텍스트 확인', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const token = await getBackendToken(page, ROLE);
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    // DOCX를 PizZip으로 열어 document.xml 추출
    const docxBuffer = await resp.body();
    expect(docxBuffer.length).toBeGreaterThan(1000);

    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml')?.asText();
    expect(docXml).toBeTruthy();

    // 동적 결과 섹션 콘텐츠가 DOCX에 포함되어 있는지 확인
    // (1) 제목 섹션
    expect(docXml).toContain('RF Output Gain');

    // (2) 데이터 테이블 헤더
    expect(docXml).toContain('Frequency (GHz)');
    expect(docXml).toContain('Gain (dB)');

    // (3) 데이터 테이블 데이터 행 (일부)
    expect(docXml).toContain('44.12');
    expect(docXml).toContain('46.73');

    // (4) 텍스트 섹션 콘텐츠
    expect(docXml).toContain('1-18 GHz');

    // (5) 기존 양식 콘텐츠도 존재 (회귀 확인)
    expect(docXml).toContain('이상 없음'); // 점검 항목 결과
    expect(docXml).toContain('출력 특성 점검'); // 점검 항목명
  });

  // ========================================================================
  // Step 4: 섹션 삭제 후 Export → 동적 영역 없이 기존 양식만 출력
  // ========================================================================

  test('Step 4a: 결과 섹션 전체 삭제', async ({ testOperatorPage: page }) => {
    for (const sectionId of [sectionTitleId, sectionTableId, sectionTextId]) {
      const resp = await apiDelete(
        page,
        `/api/intermediate-inspections/${inspectionId}/result-sections/${sectionId}`,
        ROLE
      );
      expect(resp.status()).toBe(200);
    }

    // 빈 목록 확인
    const listResp = await apiGet(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      ROLE
    );
    expect(listResp.status()).toBe(200);
    const sections = await listResp.json();
    expect(sections).toHaveLength(0);
  });

  test('Step 4b: 빈 섹션 Export → 기존 T0~T2만 포함 (회귀 없음)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const token = await getBackendToken(page, ROLE);
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-03?inspectionId=${inspectionId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    const docxBuffer = await resp.body();
    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml')?.asText();

    // 동적 콘텐츠가 없어야 함
    expect(docXml).not.toContain('RF Output Gain');
    expect(docXml).not.toContain('Frequency (GHz)');

    // 기존 양식 콘텐츠는 여전히 존재
    expect(docXml).toContain('이상 없음');
    expect(docXml).toContain('출력 특성 점검');
  });
});
