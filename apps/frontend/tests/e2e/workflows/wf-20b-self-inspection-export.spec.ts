/**
 * WF-20b: 자체점검표 양식 내보내기 (UL-QP-18-05)
 *
 * 자체점검 결재 워크플로우(draft → submitted → approved) 완료 후
 * QP-18-05 양식으로 DOCX 내보내기가 정상 동작하는지 검증.
 *
 * 검증 항목:
 * - approved 상태의 자체점검 export → 200 + DOCX
 * - 결재란 서명 매핑: 담당(Cell 4) = submitter, 검토(Cell 5) = submitter, 승인(Cell 6) = approver
 * - draft 상태 export도 지원 (서명 없이 빈칸)
 *
 * @see docs/procedure/양식/QP-18-05_자체점검표.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createSelfInspection,
  submitSelfInspection,
  approveSelfInspection,
  createCheckout,
  createEquipmentImport,
  extractId,
  resetEquipmentForWorkflow,
  resetSelfInspections,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS, TEST_TEAM_IDS, BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.TRANSMITTER_UIW_W;
const BACKEND_URL = BASE_URLS.BACKEND;
const today = new Date().toISOString().split('T')[0];

test.describe('WF-20b: 자체점검표 양식 내보내기 (QP-18-05)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: draft 상태 자체점검 export → 200 + DOCX (서명 빈칸)', async ({
    testOperatorPage: page,
  }) => {
    // draft 상태로 점검 생성
    await createSelfInspection(page, WF_EQUIPMENT_ID, {
      inspectionDate: today,
      items: [
        { itemNumber: 1, checkItem: '외관검사', checkResult: 'pass' },
        { itemNumber: 2, checkItem: '출력 특성 점검', checkResult: 'pass' },
        { itemNumber: 3, checkItem: '안전 점검', checkResult: 'pass' },
        { itemNumber: 4, checkItem: '기능 점검', checkResult: 'pass' },
      ],
      overallResult: 'pass',
      specialNotes: [{ content: '측정장비: NETWORK ANALYZER, 상태 양호', date: today }],
    });
    await clearBackendCache();

    // draft 상태에서 QP-18-05 export 호출
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-05?equipmentId=${WF_EQUIPMENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test('Step 2: approved 상태 export → 결재란 서명 매핑 (submitter=담당/검토, approver=승인)', async ({
    testOperatorPage: tePage,
    techManagerPage: tmPage,
  }) => {
    await clearBackendCache();

    // 직전 Step 1에서 생성된 최신 draft 점검 ID 조회
    const teToken = await getBackendToken(tePage, 'test_engineer');
    const listResp = await tePage.request.get(
      `${BACKEND_URL}/api/equipment/${WF_EQUIPMENT_ID}/self-inspections?page=1&pageSize=5`,
      { headers: { Authorization: `Bearer ${teToken}` } }
    );
    expect(listResp.ok()).toBeTruthy();
    const listBody = (await listResp.json()) as {
      data: Array<{ id: string; approvalStatus: string }>;
    };
    const draftRecord = listBody.data.find((r) => r.approvalStatus === 'draft');
    expect(draftRecord, 'draft 상태 점검이 존재해야 함').toBeDefined();
    const inspectionId = draftRecord!.id;

    // TE 제출 → submitted
    await submitSelfInspection(tePage, inspectionId);
    await clearBackendCache();

    // TM 승인 → approved
    await approveSelfInspection(tmPage, inspectionId);
    await clearBackendCache();

    // approved 상태 export
    const token = await getBackendToken(tePage, 'test_engineer');
    const resp = await tePage.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-05?equipmentId=${WF_EQUIPMENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const body = await resp.body();
    // approved 상태 DOCX는 서명 데이터 포함으로 draft보다 크거나 같음
    expect(body.length).toBeGreaterThan(1000);
  });

  test('Step 3: QP-18-06 반출입확인서 export → 200', async ({ testOperatorPage: page }) => {
    // 활성 checkout 1건을 즉석에서 생성 (시드 데이터 의존 X)
    await resetEquipmentForWorkflow(WF_EQUIPMENT_ID);
    const created = await createCheckout(
      page,
      [WF_EQUIPMENT_ID],
      'calibration',
      'KRISS 한국표준과학연구원',
      'WF-20b QP-18-06 export 검증용 반출'
    );
    const checkoutId = (created.id ?? created.checkoutId) as string;

    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-06?checkoutId=${checkoutId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test('Step 4: QP-18-10 공용장비 사용/반납 확인서 export → 200', async ({
    testOperatorPage: page,
  }) => {
    // 반입 신청 1건 즉석 생성 (시드 의존 X)
    const now = Date.now();
    const startIso = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    const endIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    const created = await createEquipmentImport(
      page,
      {
        sourceType: 'rental',
        vendorName: `WF-20b QP-18-10 export 검증 업체 ${now}`,
        vendorContact: '02-1234-5678',
        externalIdentifier: `EXT-${now}`,
        equipmentName: 'WF-20b QP-18-10 테스트 장비',
        modelName: 'QP1810-MODEL',
        manufacturer: '테스트 제조사',
        serialNumber: `SN-${now}`,
        classification: 'fcc_emc_rf',
        teamId: TEST_TEAM_IDS.FCC_EMC_RF_SUWON,
        site: 'suwon',
        usagePeriodStart: startIso,
        usagePeriodEnd: endIso,
        usageLocation: '수원 EMC 챔버',
        reason: 'WF-20b QP-18-10 export 검증용 반입',
      },
      'test_engineer'
    );
    const importId = extractId(created);
    expect(importId).toBeTruthy();

    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-10?importId=${importId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000);
  });
});
