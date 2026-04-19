import ExcelJS from 'exceljs';
import {
  EQUIPMENT_AVAILABILITY_LABELS,
  INTERMEDIATE_CHECK_YESNO_LABELS,
  MANAGEMENT_METHOD_LABELS,
} from '@equipment-management/schemas';
import { toExcelLoadableBuffer } from '../../../common/utils/excel-buffer';
import { EquipmentRegistryRendererService } from './equipment-registry-renderer.service';
import type {
  EquipmentRegistryData,
  EquipmentRegistryRow,
} from './equipment-registry-data.service';
import { COLUMN_COUNT, DATA_START_ROW, SHEET_NAMES } from '../layouts/equipment-registry.layout';

async function makeTemplateBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(SHEET_NAMES[0]);

  // Row 1: title + 최종 업데이트 일자 셀
  sheet.getRow(1).getCell(1).value = '시험설비 관리대장';
  sheet.getRow(1).getCell(2).value = '최종 업데이트 일자 : 2000-01-01';

  // Row 2: header row (kept as-is by renderer)
  for (let c = 1; c <= COLUMN_COUNT; c++) {
    sheet.getRow(2).getCell(c).value = `header-${c}`;
  }

  // Row 3 (DATA_START_ROW): sample data row — renderer captures styles here
  for (let c = 1; c <= COLUMN_COUNT; c++) {
    sheet.getRow(DATA_START_ROW).getCell(c).value = `sample-${c}`;
  }

  const raw = await wb.xlsx.writeBuffer();
  return Buffer.from(raw as ArrayBuffer);
}

function makeRow(partial: Partial<EquipmentRegistryRow> = {}): EquipmentRegistryRow {
  return {
    managementNumber: 'EQ-001',
    assetNumber: null,
    name: '오실로스코프',
    managementMethod: 'external_calibration',
    lastCalibrationDate: null,
    calibrationAgency: null,
    calibrationCycle: null,
    nextCalibrationDate: null,
    manufacturer: null,
    purchaseYear: null,
    modelName: null,
    serialNumber: null,
    description: null,
    location: null,
    needsIntermediateCheck: false,
    status: 'available',
    ...partial,
  };
}

describe('EquipmentRegistryRendererService', () => {
  let service: EquipmentRegistryRendererService;
  let templateBuf: Buffer;

  beforeAll(async () => {
    service = new EquipmentRegistryRendererService();
    templateBuf = await makeTemplateBuffer();
  });

  // ──────────────────────────────────────────────
  // render() smoke test
  // ──────────────────────────────────────────────

  it('데이터 없이 render()를 호출해도 Buffer를 반환한다', async () => {
    const data: EquipmentRegistryData = { rows: [] };
    const result = await service.render(data, templateBuf);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────
  // SSOT 라벨 — MANAGEMENT_METHOD_LABELS
  // ──────────────────────────────────────────────

  it.each([
    ['external_calibration', MANAGEMENT_METHOD_LABELS.external_calibration],
    ['self_inspection', MANAGEMENT_METHOD_LABELS.self_inspection],
    ['not_applicable', MANAGEMENT_METHOD_LABELS.not_applicable],
  ] as const)(
    'managementMethod=%s → MANAGEMENT_METHOD_LABELS "%s" 경유',
    async (method, expected) => {
      const data: EquipmentRegistryData = {
        rows: [makeRow({ managementMethod: method })],
      };
      const outBuf = await service.render(data, templateBuf);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(toExcelLoadableBuffer(outBuf));
      const sheet = wb.worksheets[0];
      // managementMethod는 COLUMNS 순서상 col 4 (1-based) — layout COLUMNS에서 index 3
      const rowValues = sheet.getRow(DATA_START_ROW).values as (string | undefined)[];
      expect(rowValues.join(' ')).toContain(expected);
    }
  );

  // ──────────────────────────────────────────────
  // SSOT 라벨 — INTERMEDIATE_CHECK_YESNO_LABELS
  // ──────────────────────────────────────────────

  it('needsIntermediateCheck=true → INTERMEDIATE_CHECK_YESNO_LABELS["true"] = "O"', async () => {
    const data: EquipmentRegistryData = {
      rows: [makeRow({ needsIntermediateCheck: true })],
    };
    const outBuf = await service.render(data, templateBuf);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(outBuf));
    const sheet = wb.worksheets[0];
    const rowValues = sheet.getRow(DATA_START_ROW).values as (string | undefined)[];
    expect(rowValues.join(' ')).toContain(INTERMEDIATE_CHECK_YESNO_LABELS['true']);
  });

  it('needsIntermediateCheck=false → INTERMEDIATE_CHECK_YESNO_LABELS["false"] = "X"', async () => {
    const data: EquipmentRegistryData = {
      rows: [makeRow({ needsIntermediateCheck: false })],
    };
    const outBuf = await service.render(data, templateBuf);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(outBuf));
    const sheet = wb.worksheets[0];
    const rowValues = sheet.getRow(DATA_START_ROW).values as (string | undefined)[];
    expect(rowValues.join(' ')).toContain(INTERMEDIATE_CHECK_YESNO_LABELS['false']);
  });

  // ──────────────────────────────────────────────
  // SSOT 라벨 — EQUIPMENT_AVAILABILITY_LABELS
  // ──────────────────────────────────────────────

  it.each([
    ['available', EQUIPMENT_AVAILABILITY_LABELS.available],
    ['non_conforming', EQUIPMENT_AVAILABILITY_LABELS.non_conforming],
    ['spare', EQUIPMENT_AVAILABILITY_LABELS.spare],
  ] as const)('status=%s → EQUIPMENT_AVAILABILITY_LABELS "%s" 경유', async (status, expected) => {
    const data: EquipmentRegistryData = { rows: [makeRow({ status })] };
    const outBuf = await service.render(data, templateBuf);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(outBuf));
    const sheet = wb.worksheets[0];
    const rowValues = sheet.getRow(DATA_START_ROW).values as (string | undefined)[];
    expect(rowValues.join(' ')).toContain(expected);
  });

  // ──────────────────────────────────────────────
  // 날짜 null → 'N/A'
  // ──────────────────────────────────────────────

  it('lastCalibrationDate=null → "N/A" 표시', async () => {
    const data: EquipmentRegistryData = {
      rows: [makeRow({ lastCalibrationDate: null })],
    };
    const outBuf = await service.render(data, templateBuf);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(outBuf));
    const sheet = wb.worksheets[0];
    const rowValues = sheet.getRow(DATA_START_ROW).values as (string | undefined)[];
    expect(rowValues.join(' ')).toContain('N/A');
  });

  // ──────────────────────────────────────────────
  // 대체 시트명 fallback
  // ──────────────────────────────────────────────

  it('대체 시트명(띄어쓰기 변종) fallback으로 렌더링 성공', async () => {
    const wb2 = new ExcelJS.Workbook();
    const sheet2 = wb2.addWorksheet(SHEET_NAMES[1]); // '시험설비 관리 대장' (변종)
    for (let c = 1; c <= COLUMN_COUNT; c++) {
      sheet2.getRow(DATA_START_ROW).getCell(c).value = 'x';
    }
    const raw = await wb2.xlsx.writeBuffer();
    const buf2 = Buffer.from(raw as ArrayBuffer);
    const data: EquipmentRegistryData = { rows: [makeRow()] };
    await expect(service.render(data, buf2)).resolves.toBeInstanceOf(Buffer);
  });

  // ──────────────────────────────────────────────
  // teamName → 제목 접두사
  // ──────────────────────────────────────────────

  it('teamName 있으면 제목 Row1 Cell1에 팀명이 포함된다', async () => {
    const data: EquipmentRegistryData = { rows: [], teamName: '수원 FCC/EMC팀' };
    const outBuf = await service.render(data, templateBuf);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(outBuf));
    const sheet = wb.worksheets[0];
    const title = String(sheet.getRow(1).getCell(1).value ?? '');
    expect(title).toContain('수원 FCC/EMC팀');
  });
});
