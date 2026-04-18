/**
 * WF-21: 시험설비 관리대장 XLSX 내보내기 (UL-QP-18-01)
 *
 * `GET /api/reports/export/form/UL-QP-18-01` 엔드포인트가
 * 정상 xlsx를 반환하고, SSOT 라벨(MANAGEMENT_METHOD_LABELS /
 * EQUIPMENT_AVAILABILITY_LABELS / INTERMEDIATE_CHECK_YESNO_LABELS)이
 * 셀에 올바르게 렌더링되는지 검증.
 *
 * 컬럼 매핑 (equipment-registry.layout.ts 기준 — A=1-based):
 *   D(col 4)  = 관리방법  → MANAGEMENT_METHOD_LABELS
 *   O(col 15) = 중간점검 대상 → INTERMEDIATE_CHECK_YESNO_LABELS ('O'/'X')
 *   P(col 16) = 가용 여부  → EQUIPMENT_AVAILABILITY_LABELS
 *
 * @see apps/backend/src/modules/reports/layouts/equipment-registry.layout.ts
 * @see packages/schemas/src/enums/labels.ts — MANAGEMENT_METHOD_LABELS 등
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { BASE_URLS } from '../shared/constants/shared-test-data';
import { getBackendToken } from '../shared/helpers/api-helpers';
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_URL = BASE_URLS.BACKEND;
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// ============================================================================
// SSOT 허용 값 집합 — packages/schemas/src/enums/labels.ts와 1:1 대응
// 단일 값 하드코딩 금지 — LABELS Record의 모든 가능한 값을 열거
// ============================================================================

/** MANAGEMENT_METHOD_LABELS 허용 값 */
const VALID_MANAGEMENT_METHOD_LABELS = new Set(['외부 교정', '자체 점검', '비대상']);

/** EQUIPMENT_AVAILABILITY_LABELS 허용 값 */
const VALID_AVAILABILITY_LABELS = new Set(['사용', '고장', '여분', '불용']);

/** INTERMEDIATE_CHECK_YESNO_LABELS 허용 값 */
const VALID_YESNO_LABELS = new Set(['O', 'X']);

test.describe('WF-21: 시험설비 관리대장 XLSX 내보내기 (UL-QP-18-01)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
  });

  // ============================================================================
  // Step 1: 기본 export — 200 + xlsx MIME 검증
  // ============================================================================

  test('Step 1: GET UL-QP-18-01 → 200 + xlsx Content-Type', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/reports/export/form/UL-QP-18-01`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(200);
    expect(resp.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    const body = await resp.body();
    expect(body.length).toBeGreaterThan(1000);
  });

  // ============================================================================
  // Step 2: SSOT 라벨 셀 검증 (D/O/P 열)
  // ============================================================================

  test('Step 2: SSOT 라벨 회귀 — D열(관리방법) / O열(중간점검) / P열(가용여부)', async ({
    testOperatorPage: page,
  }) => {
    const token = await getBackendToken(page, 'test_engineer');
    const resp = await page.request.get(`${BACKEND_URL}/api/reports/export/form/UL-QP-18-01`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(resp.status()).toBe(200);

    const rawBody = await resp.body();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(rawBody));

    // '시험설비 관리대장' 또는 '시험설비 관리 대장' 시트 탐색
    const sheet = wb.getWorksheet('시험설비 관리대장') ?? wb.getWorksheet('시험설비 관리 대장');
    expect(sheet, '관리대장 시트가 존재해야 함').toBeDefined();

    // DATA_START_ROW = 3 (equipment-registry.layout.ts)
    // 시드 데이터에 장비가 있으므로 최소 1개 이상의 데이터 행이 존재해야 함
    const dataRowCount = (sheet!.rowCount ?? 0) - 2; // Row 1(제목) + Row 2(헤더) 제외
    expect(dataRowCount).toBeGreaterThan(0);

    // 모든 데이터 행에 대해 SSOT 라벨 값 검증
    let verifiedRows = 0;
    sheet!.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 3) return; // 헤더 행 스킵

      // D열(col 4): 관리방법 → MANAGEMENT_METHOD_LABELS 허용 값
      const dCell = row.getCell(4).value;
      if (dCell !== null && dCell !== undefined && dCell !== '') {
        expect(
          VALID_MANAGEMENT_METHOD_LABELS.has(String(dCell)),
          `Row ${rowNumber} D열 값 '${dCell}'이 MANAGEMENT_METHOD_LABELS에 없음`
        ).toBe(true);
      }

      // O열(col 15): 중간점검 대상 → INTERMEDIATE_CHECK_YESNO_LABELS ('O'/'X')
      const oCell = row.getCell(15).value;
      if (oCell !== null && oCell !== undefined && oCell !== '') {
        expect(
          VALID_YESNO_LABELS.has(String(oCell)),
          `Row ${rowNumber} O열 값 '${oCell}'이 INTERMEDIATE_CHECK_YESNO_LABELS에 없음`
        ).toBe(true);
      }

      // P열(col 16): 가용 여부 → EQUIPMENT_AVAILABILITY_LABELS
      const pCell = row.getCell(16).value;
      if (pCell !== null && pCell !== undefined && pCell !== '') {
        expect(
          VALID_AVAILABILITY_LABELS.has(String(pCell)),
          `Row ${rowNumber} P열 값 '${pCell}'이 EQUIPMENT_AVAILABILITY_LABELS에 없음`
        ).toBe(true);
      }

      verifiedRows++;
    });

    expect(verifiedRows, '최소 1개 이상의 데이터 행을 검증해야 함').toBeGreaterThan(0);

    // 수동 확인용 xlsx 저장
    const today = new Date().toISOString().split('T')[0];
    const outputPath = path.join(OUTPUT_DIR, `WF-21_시험설비관리대장_${today}.xlsx`);
    fs.writeFileSync(outputPath, rawBody);
    // eslint-disable-next-line no-console
    console.log(`\n✅ xlsx saved: ${outputPath} (${(rawBody.length / 1024).toFixed(1)} KB)`);
  });

  // ============================================================================
  // Step 3: showRetired=true → '불용' 행 포함 검증
  // ============================================================================

  test('Step 3: showRetired=true → P열에 "불용" 값 포함', async ({ testOperatorPage: page }) => {
    const token = await getBackendToken(page, 'test_engineer');

    // showRetired=false (기본) — '불용' 행 없음
    const respDefault = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(respDefault.status()).toBe(200);

    const wbDefault = new ExcelJS.Workbook();
    await wbDefault.xlsx.load(Buffer.from(await respDefault.body()));
    const sheetDefault =
      wbDefault.getWorksheet('시험설비 관리대장') ?? wbDefault.getWorksheet('시험설비 관리 대장');

    // pending_disposal 장비는 isActive=true이므로 기본 export에도 포함 → '불용'으로 렌더됨.
    // 따라서 defaultDisposedValues >= 0 (절대값 검증 불가).
    let defaultDisposedCount = 0;
    sheetDefault?.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 3) return;
      const pVal = String(row.getCell(16).value ?? '');
      if (pVal === '불용') defaultDisposedCount++;
    });

    // showRetired=true — disposed(isActive=true 오버라이드, ex: A6)가 추가로 포함됨
    const respRetired = await page.request.get(
      `${BACKEND_URL}/api/reports/export/form/UL-QP-18-01?showRetired=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(respRetired.status()).toBe(200);

    const wbRetired = new ExcelJS.Workbook();
    await wbRetired.xlsx.load(Buffer.from(await respRetired.body()));
    const sheetRetired =
      wbRetired.getWorksheet('시험설비 관리대장') ?? wbRetired.getWorksheet('시험설비 관리 대장');

    let retiredDisposedCount = 0;
    sheetRetired?.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 3) return;
      const pVal = String(row.getCell(16).value ?? '');
      if (pVal === '불용') retiredDisposedCount++;
    });
    // showRetired=true는 disposed(isActive=true) 장비를 추가로 포함하므로
    // 기본 export보다 더 많은 '불용' 행을 포함해야 함
    expect(
      retiredDisposedCount,
      'showRetired=true 시 기본 export보다 더 많은 "불용" 행이 있어야 함'
    ).toBeGreaterThan(defaultDisposedCount);
  });

  // ============================================================================
  // Step 4: 인증 없음 → 401
  // ============================================================================

  test('Step 4: Authorization 헤더 없음 → 401', async ({ testOperatorPage: page }) => {
    const resp = await page.request.get(`${BACKEND_URL}/api/reports/export/form/UL-QP-18-01`);
    expect(resp.status()).toBe(401);
  });
});
