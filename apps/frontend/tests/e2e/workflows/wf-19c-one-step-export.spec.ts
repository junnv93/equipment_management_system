/**
 * WF-19c (1-step): 중간점검 생성 시 임베디드 resultSections → Export 검증
 *
 * 41차 harness Batch A 에서 도입된 1-step 생성 경로:
 * `POST /api/calibration/:uuid/intermediate-inspections` 단일 호출로 inspection +
 * items + resultSections 를 동시에 저장할 수 있다. 기존 `wf-19c-intermediate-inspection-result-sections.spec.ts`
 * 는 Step 1 (inspection) → Step 2a-d (result sections) 2-step 경로만 회귀 검증.
 *
 * 본 spec 은:
 *   1. 1-step 생성 → `GET /result-sections` 에 섹션이 즉시 조회되는지
 *   2. Export (QP-18-03) DOCX 에 items + resultSections 내용이 모두 포함되는지
 *   3. 기존 2-step spec 과 **독립 실행** — 같은 fixture 재사용 없음 (isolation).
 *
 * @see apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts#create
 * @see packages/schemas/src/enums/inspection-result-section.ts
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createIntermediateInspection,
  extractId,
  resetIntermediateInspections,
  clearBackendCache,
  apiGet,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_CALIBRATION_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';
import PizZip from 'pizzip';

const WF_CALIBRATION_ID = TEST_CALIBRATION_IDS.CALIB_001;
const BACKEND_URL = BASE_URLS.BACKEND;
const today = new Date().toISOString().split('T')[0];
const ROLE = 'test_engineer';

test.describe('WF-19c 1-step: 임베디드 resultSections → Export', () => {
  test.describe.configure({ mode: 'serial' });

  let inspectionId: string;

  test.beforeAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
  });

  test.afterAll(async () => {
    await resetIntermediateInspections(WF_CALIBRATION_ID);
    await cleanupSharedPool();
  });

  test('Step 1: 단일 POST 로 inspection + items + resultSections 생성', async ({
    testOperatorPage: page,
  }) => {
    const body = await createIntermediateInspection(page, WF_CALIBRATION_ID, {
      inspectionDate: today,
      classification: 'calibrated',
      inspectionCycle: '6개월',
      calibrationValidityPeriod: '1년',
      overallResult: 'pass',
      remarks: 'WF-19c 1-step: 임베디드 섹션 E2E',
      items: [
        {
          itemNumber: 1,
          checkItem: '외관 검사',
          checkCriteria: '손상/마모 없음',
          checkResult: '정상',
          judgment: 'pass',
        },
        {
          itemNumber: 2,
          checkItem: 'RF 출력 검사',
          checkCriteria: 'CW Level ±1 dB',
          checkResult: '편차 0.3 dB',
          judgment: 'pass',
        },
      ],
      // 41차 harness A2 이후 지원되는 임베디드 경로
      resultSections: [
        {
          sortOrder: 0,
          sectionType: 'title',
          title: 'WF-19c 1-step Measurement Summary',
        },
        {
          sortOrder: 1,
          sectionType: 'data_table',
          title: 'Output Gain 주요 포인트',
          tableData: {
            headers: ['Freq (GHz)', 'Gain (dB)', 'Spec'],
            rows: [
              ['1.0', '44.12', '45 ± 2.5'],
              ['10.0', '45.08', '45 ± 2.5'],
              ['18.0', '46.73', '45 ± 2.5'],
            ],
          },
        },
        {
          sortOrder: 2,
          sectionType: 'text',
          title: '측정 조건',
          content: 'Ambient 23℃ / RH 45% — Sweep 1-18 GHz / Step 1 GHz',
        },
      ],
    });
    inspectionId = extractId(body);
    expect(inspectionId).toBeTruthy();
  });

  test('Step 2: GET /result-sections 가 3개 섹션을 sortOrder 순으로 반환', async ({
    testOperatorPage: page,
  }) => {
    const resp = await apiGet(
      page,
      `/api/intermediate-inspections/${inspectionId}/result-sections`,
      ROLE
    );
    expect(resp.status()).toBe(200);
    const sections = (await resp.json()) as Array<{
      sortOrder: number;
      sectionType: string;
      title: string | null;
    }>;
    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({ sortOrder: 0, sectionType: 'title' });
    expect(sections[1]).toMatchObject({ sortOrder: 1, sectionType: 'data_table' });
    expect(sections[2]).toMatchObject({ sortOrder: 2, sectionType: 'text' });
  });

  test('Step 3: Export QP-18-03 DOCX 에 items + sections 모두 포함', async ({
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
    expect(docxBuffer.length).toBeGreaterThan(1000);

    const zip = new PizZip(docxBuffer);
    const docXml = zip.file('word/document.xml')?.asText();
    expect(docXml).toBeTruthy();

    // 점검 항목 (items) 렌더링 회귀
    expect(docXml).toContain('외관 검사');
    expect(docXml).toContain('RF 출력 검사');
    expect(docXml).toContain('편차 0.3 dB');

    // 임베디드 resultSections 렌더링 (Batch A1 1-step 경로 검증)
    expect(docXml).toContain('WF-19c 1-step Measurement Summary');
    expect(docXml).toContain('Freq (GHz)');
    expect(docXml).toContain('Gain (dB)');
    expect(docXml).toContain('44.12');
    expect(docXml).toContain('46.73');
    expect(docXml).toContain('Ambient 23℃');
  });
});
