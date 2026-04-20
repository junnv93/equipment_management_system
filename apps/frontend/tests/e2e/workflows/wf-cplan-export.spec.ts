/**
 * WF-CPLAN-EXPORT: UL-QP-19-01 연간 교정계획서 Export (M8/M9)
 *
 * MUST 조건:
 * - M8: approved plan export → 200 + xlsx MIME + Row 1 제목 셀 검증
 * - M9: draft plan export → 400 + NON_EXPORTABLE_PLAN_STATUS
 *
 * 사용 플랜:
 * - CPLAN_004 (approved, 2025, suwon, FCC_EMC_RF)
 * - CPLAN_001 (draft, 2026, suwon, FCC_EMC_RF)
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { BASE_URLS, TEST_CALIBRATION_PLAN_IDS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';
import ExcelJS from 'exceljs';

const BACKEND_URL = BASE_URLS.BACKEND;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const exportUrl = (uuid: string) => `${BACKEND_URL}/api/calibration-plans/${uuid}/export`;

test.describe('WF-CPLAN-EXPORT: 연간 교정계획서 UL-QP-19-01 내보내기', () => {
  test.describe.configure({ mode: 'serial' });

  // ============================================================================
  // M8: approved plan → 200 + xlsx + 셀 내용 검증
  // ============================================================================

  test('M8-Step1: approved 계획서 export → 200 + xlsx Content-Type', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const resp = await page.request.get(exportUrl(TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED), {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(XLSX_MIME);

    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  test('M8-Step2: xlsx buffer → Row 1 제목 셀 = "2025년 수원 연간 교정 계획서"', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const resp = await page.request.get(exportUrl(TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED), {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);

    const rawBody = await resp.body();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(rawBody));

    const sheet = wb.getWorksheet('연간 교정계획서') ?? wb.getWorksheet('교정계획서');
    expect(sheet, '연간 교정계획서 시트가 존재해야 함').toBeDefined();

    const titleCell = sheet!.getRow(1).getCell(1).value;
    expect(String(titleCell)).toContain('2025');
    expect(String(titleCell)).toContain('수원');
    expect(String(titleCell)).toContain('연간 교정 계획서');
  });

  test('M8-Step3: Content-Disposition에 파일명 포함 (UL-QP-19-01)', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const resp = await page.request.get(exportUrl(TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED), {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);

    const disposition = resp.headers()['content-disposition'] ?? '';
    // RFC 5987 인코딩 또는 filename= 포함 확인
    expect(disposition).toMatch(/filename/i);
    // UL-QP-19-01 formNumber가 파일명에 포함되어야 함
    const decodedDisp = decodeURIComponent(disposition);
    expect(decodedDisp).toContain('UL-QP-19-01');
  });

  // ============================================================================
  // M9: non-approved plan → 400 + NON_EXPORTABLE_PLAN_STATUS
  // ============================================================================

  test('M9-Step1: draft 계획서 export → 400 + NON_EXPORTABLE_PLAN_STATUS', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const resp = await page.request.get(exportUrl(TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT), {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body?.code ?? body?.response?.code).toBe('NON_EXPORTABLE_PLAN_STATUS');
  });

  test('M9-Step2: pending_approval 계획서 export → 400 + NON_EXPORTABLE_PLAN_STATUS', async ({
    techManagerPage: page,
  }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const resp = await page.request.get(
      exportUrl(TEST_CALIBRATION_PLAN_IDS.CPLAN_007_PENDING_APPROVAL),
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body?.code ?? body?.response?.code).toBe('NON_EXPORTABLE_PLAN_STATUS');
  });

  // ============================================================================
  // M9-Step3: test_engineer도 EXPORT_REPORTS 보유 → 200 허용 확인
  // ============================================================================

  test('M9-Step3: test_engineer(EXPORT_REPORTS 보유) → approved plan export 200 허용', async ({
    testOperatorPage: page,
  }) => {
    // role-permissions.ts 기준: test_engineer는 Permission.EXPORT_REPORTS 포함
    // → approved plan export는 200이어야 함 (권한 정책 회귀 감지)
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(exportUrl(TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED), {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(XLSX_MIME);
  });
});
