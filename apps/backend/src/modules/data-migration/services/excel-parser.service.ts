import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { toExcelLoadableBuffer } from '../../../common/utils';
import type { RawExcelRow, MappedRow } from '../types/data-migration.types';
import {
  COLUMN_ALIAS_INDEX,
  EQUIPMENT_COLUMN_MAPPING,
  DEPRECATED_ALIAS_BY_SHEET,
  getTemplateHeader,
  type ColumnMappingEntry,
} from '../constants/equipment-column-mapping';
import {
  CALIBRATION_ALIAS_INDEX,
  CALIBRATION_COLUMN_MAPPING,
} from '../constants/calibration-column-mapping';
import { REPAIR_ALIAS_INDEX, REPAIR_COLUMN_MAPPING } from '../constants/repair-column-mapping';
import {
  INCIDENT_ALIAS_INDEX,
  INCIDENT_COLUMN_MAPPING,
} from '../constants/incident-column-mapping';
import { CABLE_ALIAS_INDEX, CABLE_COLUMN_MAPPING } from '../constants/cable-column-mapping';
import {
  TEST_SOFTWARE_ALIAS_INDEX,
  TEST_SOFTWARE_COLUMN_MAPPING,
} from '../constants/test-software-column-mapping';
import {
  CALIBRATION_FACTOR_ALIAS_INDEX,
  CALIBRATION_FACTOR_COLUMN_MAPPING,
} from '../constants/calibration-factor-column-mapping';
import {
  NON_CONFORMANCE_ALIAS_INDEX,
  NON_CONFORMANCE_COLUMN_MAPPING,
} from '../constants/non-conformance-column-mapping';
import { detectSheetType, type MigrationSheetType } from '../constants/sheet-config';
import { MigrationErrorCode } from '@equipment-management/shared-constants';
import {
  EXCEL_COLORS,
  EXCEL_PAGE_SETUP,
  EXCEL_HEADER_ROW_HEIGHT,
} from '../constants/excel-styling';
import {
  EXCEL_SHEET_NAMES,
  REPORT_META_HEADERS,
  SUMMARY_LABELS,
  REFERENCE_LABELS,
  STATUS_LABELS,
} from '../constants/excel-labels';
import {
  SiteEnum,
  ManagementMethodEnum,
  CalibrationRequiredEnum,
  REPAIR_RESULT_VALUES,
  INCIDENT_TYPE_VALUES,
  CABLE_CONNECTOR_TYPE_VALUES,
  TEST_FIELD_VALUES,
  CALIBRATION_FACTOR_TYPE_VALUES,
  NON_CONFORMANCE_TYPE_VALUES,
  RESOLUTION_TYPE_VALUES,
  MIGRATION_ROW_STATUS,
  SITE_LABELS,
  MANAGEMENT_METHOD_LABELS,
  CALIBRATION_REQUIRED_LABELS,
  REPAIR_RESULT_LABELS,
  INCIDENT_TYPE_LABELS,
  CALIBRATION_FACTOR_TYPE_LABELS,
  NON_CONFORMANCE_TYPE_LABELS,
  RESOLUTION_TYPE_LABELS,
  TEST_FIELD_LABELS,
} from '@equipment-management/schemas';

/** SSOT enum + 라벨 → "value(한국어)" 형식 */
function formatEnumWithLabels<T extends string>(
  values: readonly T[],
  labels: Partial<Record<T, string>>
): string {
  return values.map((v) => (labels[v] ? `${v}(${labels[v]})` : v)).join(' | ');
}

export interface ParsedSheet {
  sheetType: MigrationSheetType;
  sheetName: string;
  rows: MappedRow[];
  unmappedColumns: string[];
}

/**
 * Excel 파일 파싱 서비스
 *
 * 역할: .xlsx 버퍼 → RawExcelRow[] → MappedRow[] 변환
 * - ExcelJS를 사용하여 첫 번째 시트의 데이터를 읽음
 * - 헤더 행(1행)을 기준으로 컬럼 alias 매핑 수행
 * - 날짜/숫자 타입 변환은 컬럼 매핑의 transform 함수가 담당
 */
@Injectable()
export class ExcelParserService {
  /**
   * xlsx 버퍼를 파싱하여 원시 행 배열 반환 (하위 호환 — 첫 번째 시트만)
   */
  async parseBuffer(buffer: Buffer): Promise<RawExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(buffer));

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException({
        code: MigrationErrorCode.EMPTY_FILE,
        message: '파일에 시트가 없습니다.',
      });
    }

    const rowCount = sheet.rowCount;
    if (rowCount < 2) {
      throw new BadRequestException({
        code: MigrationErrorCode.NO_DATA_ROWS,
        message: '데이터 행이 없습니다. 헤더 행 포함 최소 2행이 필요합니다.',
      });
    }

    // 헤더 행(1행)에서 컬럼 인덱스 → 헤더명 매핑 구성
    const headerRow = sheet.getRow(1);
    const columnIndexToHeader: Map<number, string> = new Map();

    headerRow.eachCell((cell, colNumber) => {
      const header = cell.text?.trim();
      if (header) {
        columnIndexToHeader.set(colNumber, header);
      }
    });

    if (columnIndexToHeader.size === 0) {
      throw new BadRequestException({
        code: MigrationErrorCode.NO_HEADERS,
        message: '헤더 행(1행)이 비어 있습니다.',
      });
    }

    const rows: RawExcelRow[] = [];
    let dataRowNumber = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 스킵

      // 행이 완전히 비어있으면 스킵
      const hasData = Array.from(columnIndexToHeader.keys()).some((colIdx) => {
        const cell = row.getCell(colIdx);
        return cell.value !== null && cell.value !== undefined && cell.value !== '';
      });
      if (!hasData) return;

      dataRowNumber++;
      const rawData: Record<string, unknown> = {};

      columnIndexToHeader.forEach((header, colIdx) => {
        const cell = row.getCell(colIdx);
        rawData[header] = this.extractCellValue(cell);
      });

      rows.push({ rowNumber: dataRowNumber, rawData });
    });

    return rows;
  }

  /**
   * 원시 행 배열을 DB 필드명으로 매핑
   */
  mapRows(rawRows: RawExcelRow[]): MappedRow[] {
    const deprecatedAliases = DEPRECATED_ALIAS_BY_SHEET['equipment'] ?? new Set<string>();
    return rawRows.map((raw) => this.mapSingleRow(raw, COLUMN_ALIAS_INDEX, deprecatedAliases));
  }

  /**
   * 멀티시트 파싱 — 모든 시트를 타입별로 감지하여 반환
   */
  async parseMultiSheetBuffer(buffer: Buffer): Promise<ParsedSheet[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(buffer));

    const results: ParsedSheet[] = [];

    workbook.eachSheet((sheet) => {
      const sheetType = detectSheetType(sheet.name);
      if (sheetType === null) return; // 인식 불가 시트 스킵 (참고값, 설명 시트 등)
      const aliasIndex = this.getAliasIndexForType(sheetType);
      const deprecatedAliases = DEPRECATED_ALIAS_BY_SHEET[sheetType] ?? new Set<string>();

      if (sheet.rowCount < 2) return; // 빈 시트 스킵

      const { rows, unmappedColumns } = this.parseSheet(sheet, aliasIndex, deprecatedAliases);
      if (rows.length === 0) return; // 데이터 없는 시트 스킵

      results.push({ sheetType, sheetName: sheet.name, rows, unmappedColumns });
    });

    if (results.length === 0) {
      throw new BadRequestException({
        code: MigrationErrorCode.EMPTY_FILE,
        message: '데이터가 있는 시트가 없습니다.',
      });
    }

    return results;
  }

  private getAliasIndexForType(type: MigrationSheetType): Map<string, ColumnMappingEntry> {
    switch (type) {
      case 'equipment':
        return COLUMN_ALIAS_INDEX;
      case 'calibration':
        return CALIBRATION_ALIAS_INDEX;
      case 'repair':
        return REPAIR_ALIAS_INDEX;
      case 'incident':
        return INCIDENT_ALIAS_INDEX;
      case 'cable':
        return CABLE_ALIAS_INDEX;
      case 'test_software':
        return TEST_SOFTWARE_ALIAS_INDEX;
      case 'calibration_factor':
        return CALIBRATION_FACTOR_ALIAS_INDEX;
      case 'non_conformance':
        return NON_CONFORMANCE_ALIAS_INDEX;
      default: {
        const _exhaustive: never = type;
        throw new Error(`Unknown sheet type: ${_exhaustive}`);
      }
    }
  }

  /**
   * 시트 → rows + unmappedColumns 파싱 (내부 공통 로직)
   */
  private parseSheet(
    sheet: ExcelJS.Worksheet,
    aliasIndex: Map<string, ColumnMappingEntry>,
    deprecatedAliases: Set<string>
  ): { rows: MappedRow[]; unmappedColumns: string[] } {
    const headerRow = sheet.getRow(1);
    const columnIndexToHeader: Map<number, string> = new Map();

    headerRow.eachCell((cell, colNumber) => {
      const header = cell.text?.trim();
      if (header) {
        columnIndexToHeader.set(colNumber, header);
      }
    });

    if (columnIndexToHeader.size === 0) {
      return { rows: [], unmappedColumns: [] };
    }

    const rows: MappedRow[] = [];
    const globalUnmapped = new Set<string>();
    let dataRowNumber = 0;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const hasData = Array.from(columnIndexToHeader.keys()).some((colIdx) => {
        const cell = row.getCell(colIdx);
        return cell.value !== null && cell.value !== undefined && cell.value !== '';
      });
      if (!hasData) return;

      dataRowNumber++;
      const rawData: Record<string, unknown> = {};

      columnIndexToHeader.forEach((header, colIdx) => {
        const cell = row.getCell(colIdx);
        rawData[header] = this.extractCellValue(cell);
      });

      const mapped = this.mapSingleRow(
        { rowNumber: dataRowNumber, rawData },
        aliasIndex,
        deprecatedAliases
      );
      mapped.unmappedColumns.forEach((col) => globalUnmapped.add(col));
      rows.push(mapped);
    });

    return { rows, unmappedColumns: Array.from(globalUnmapped) };
  }

  /**
   * 단일 행 매핑 (header alias → dbField + transform)
   *
   * @param deprecatedAliases 해당 시트의 deprecated alias Set (크로스시트 오염 방지)
   */
  private mapSingleRow(
    raw: RawExcelRow,
    aliasIndex: Map<string, ColumnMappingEntry>,
    deprecatedAliases: Set<string>
  ): MappedRow {
    const mappedData: Record<string, unknown> = {};
    const unmappedColumns: string[] = [];

    for (const [header, rawValue] of Object.entries(raw.rawData)) {
      const key = header.toLowerCase().trim();
      const entry = aliasIndex.get(key);

      if (!entry) {
        // 해당 시트의 폐기된 컬럼만 경고 없이 무시 (크로스시트 오염 방지)
        if (!deprecatedAliases.has(key)) {
          unmappedColumns.push(header);
        }
        continue;
      }

      const transformed = entry.transform ? entry.transform(rawValue) : rawValue;
      if (transformed !== undefined && transformed !== null && transformed !== '') {
        mappedData[entry.dbField] = transformed;
      }
    }

    return { rowNumber: raw.rowNumber, mappedData, unmappedColumns };
  }

  /**
   * ExcelJS 셀값을 JS 값으로 추출
   * - 날짜: JS Date 반환 (ExcelJS가 date-formatted cell을 자동 변환)
   * - 수식: 계산된 결과값 반환
   * - 숫자/문자열: 그대로 반환
   */
  private extractCellValue(cell: ExcelJS.Cell): unknown {
    const { value } = cell;

    if (value === null || value === undefined) return undefined;

    // 수식 셀: 계산 결과 반환
    if (typeof value === 'object' && 'result' in value) {
      return (value as { result: unknown }).result;
    }

    // Date 객체: 그대로 반환
    if (value instanceof Date) return value;

    // 숫자/문자열/불리언: 그대로 반환
    return value;
  }

  /**
   * 에러 리포트용 Excel 생성
   * 원본 데이터 + 상태/에러 컬럼 추가, 에러 행은 빨간 배경
   */
  async generateErrorReport(
    rows: Array<{
      rowNumber: number;
      status: string;
      managementNumber?: string;
      errors: Array<{ field: string; message: string }>;
      data: Record<string, unknown>;
    }>
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Equipment Management System';

    // ── 요약 시트 ──────────────────────────────────────────────────────────────
    const summarySheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.SUMMARY, {
      pageSetup: EXCEL_PAGE_SETUP,
    });

    const validCount = rows.filter((r) => r.status === MIGRATION_ROW_STATUS.VALID).length;
    const warningCount = rows.filter((r) => r.status === MIGRATION_ROW_STATUS.WARNING).length;
    const errorCount = rows.filter((r) => r.status === MIGRATION_ROW_STATUS.ERROR).length;
    const duplicateCount = rows.filter((r) => r.status === MIGRATION_ROW_STATUS.DUPLICATE).length;

    summarySheet.columns = [
      { header: SUMMARY_LABELS.ITEM, key: 'label', width: 25 },
      { header: SUMMARY_LABELS.COUNT, key: 'count', width: 15 },
    ];

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: EXCEL_COLORS.WHITE } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_COLORS.NAVY_HEADER },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    summarySheet.addRow({ label: SUMMARY_LABELS.TOTAL, count: rows.length });
    summarySheet.addRow({ label: SUMMARY_LABELS.SUCCESS, count: validCount });
    summarySheet.addRow({ label: SUMMARY_LABELS.WARNING, count: warningCount });
    summarySheet.addRow({ label: SUMMARY_LABELS.ERROR, count: errorCount });
    summarySheet.addRow({ label: SUMMARY_LABELS.DUPLICATE, count: duplicateCount });

    // ── 상세 결과 시트 ────────────────────────────────────────────────────────
    const sheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.MIGRATION_RESULT, {
      pageSetup: EXCEL_PAGE_SETUP,
    });

    // 헤더 정의
    const dataColumns = EQUIPMENT_COLUMN_MAPPING.map((entry) => entry.aliases[0]);
    const allHeaders = [
      REPORT_META_HEADERS.ROW_NUMBER,
      REPORT_META_HEADERS.RESULT,
      REPORT_META_HEADERS.ERROR_DETAIL,
      REPORT_META_HEADERS.MANAGEMENT_NUMBER,
      ...dataColumns,
    ];

    sheet.columns = allHeaders.map((header, idx) => ({
      header,
      key: String(idx),
      width: idx < 4 ? 15 : 20,
    }));

    // 헤더 스타일
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: EXCEL_COLORS.WHITE } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: EXCEL_COLORS.NAVY_HEADER },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = EXCEL_HEADER_ROW_HEIGHT;

    // 데이터 행
    for (const row of rows) {
      const statusLabel = this.getStatusLabel(row.status);
      const errorDetail = row.errors.map((e) => `[${e.field}] ${e.message}`).join('\n');
      const dataValues = EQUIPMENT_COLUMN_MAPPING.map((entry) => row.data[entry.dbField] ?? '');

      const sheetRow = sheet.addRow([
        row.rowNumber,
        statusLabel,
        errorDetail,
        row.managementNumber ?? '',
        ...dataValues,
      ]);

      // 에러 행: 연한 빨간 배경
      if (row.status === MIGRATION_ROW_STATUS.ERROR) {
        sheetRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: EXCEL_COLORS.ERROR_FILL },
          };
        });
      } else if (row.status === MIGRATION_ROW_STATUS.DUPLICATE) {
        sheetRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: EXCEL_COLORS.DUPLICATE_FILL },
          };
        });
      }

      sheetRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
          left: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
          bottom: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
          right: { style: 'thin', color: { argb: EXCEL_COLORS.BORDER } },
        };
        cell.alignment = { vertical: 'top', wrapText: true };
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 입력 템플릿 Excel 생성 (4개 시트: 장비/교정/수리/사고)
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Equipment Management System';

    // ── 장비 등록 시트 ──────────────────────────────────────────────────────────
    const equipSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.EQUIPMENT, {
      pageSetup: EXCEL_PAGE_SETUP,
    });

    const equipColumns = EQUIPMENT_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));

    equipSheet.columns = equipColumns;

    const equipHeaderRow = equipSheet.getRow(1);
    equipHeaderRow.eachCell((cell, colIdx) => {
      const entry = EQUIPMENT_COLUMN_MAPPING[colIdx - 1];
      cell.font = { bold: true, color: { argb: EXCEL_COLORS.WHITE } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: entry?.required ? EXCEL_COLORS.REQUIRED_HEADER : EXCEL_COLORS.OPTIONAL_HEADER,
        },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    equipHeaderRow.height = EXCEL_HEADER_ROW_HEIGHT;

    equipSheet.addRow({
      site: 'suwon',
      managementNumber: 'SUW-E0001',
      name: '네트워크 분석기',
      managementMethod: 'external_calibration',
      lastCalibrationDate: '2024-01-15',
      calibrationAgency: 'HCT',
      calibrationCycle: '12',
      manufacturer: 'Keysight',
      purchaseYear: '2020',
      modelName: 'N5247A',
      serialNumber: 'MY12345678',
      initialLocation: '수원랩 A동 102호',
      supplier: 'Keysight Korea',
    });

    // ── 교정 이력 시트 ──────────────────────────────────────────────────────────
    const calSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.CALIBRATION, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    calSheet.columns = CALIBRATION_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      calSheet,
      CALIBRATION_COLUMN_MAPPING.map((e) => !!e.required)
    );
    calSheet.addRow({
      managementNumber: 'SUW-E0001',
      calibrationDate: '2024-01-15',
      agencyName: 'HCT',
      certificateNumber: 'HCT-2024-001',
      result: '합격',
      notes: '정기 교정',
    });

    // ── 수리 이력 시트 ──────────────────────────────────────────────────────────
    const repairSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.REPAIR, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    repairSheet.columns = REPAIR_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      repairSheet,
      REPAIR_COLUMN_MAPPING.map((e) => !!e.required)
    );
    repairSheet.addRow({
      managementNumber: 'SUW-E0001',
      repairDate: '2024-03-20',
      repairDescription: '전원 공급 장치 교체',
      repairResult: '완료',
      notes: '부품 교체 완료',
    });

    // ── 사고 이력 시트 ──────────────────────────────────────────────────────────
    const incidentSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.INCIDENT, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    incidentSheet.columns = INCIDENT_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      incidentSheet,
      INCIDENT_COLUMN_MAPPING.map((e) => !!e.required)
    );
    incidentSheet.addRow({
      managementNumber: 'SUW-E0001',
      occurredAt: '2024-02-10',
      incidentType: '손상',
      content: '운반 중 케이블 손상',
    });

    // ── 케이블 시트 ──────────────────────────────────────────────────────────────
    const cableSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.CABLE, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    cableSheet.columns = CABLE_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      cableSheet,
      CABLE_COLUMN_MAPPING.map((e) => !!e.required)
    );
    cableSheet.addRow({
      managementNumber: 'CBL-001',
      length: '0.50',
      connectorType: 'N',
      frequencyRangeMin: '0',
      frequencyRangeMax: '18000',
      serialNumber: 'SN-CBL-001',
      location: '수원랩 A동',
      site: 'suwon',
    });

    // ── 시험용 소프트웨어 시트 ─────────────────────────────────────────────────
    const swSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.TEST_SOFTWARE, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    swSheet.columns = TEST_SOFTWARE_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      swSheet,
      TEST_SOFTWARE_COLUMN_MAPPING.map((e) => !!e.required)
    );
    swSheet.addRow({
      managementNumber: 'P0001',
      name: 'EUT Monitor',
      testField: 'emc',
      softwareVersion: '2.1.0',
      manufacturer: 'Keysight',
      site: 'suwon',
    });

    // ── 교정 인자 시트 ─────────────────────────────────────────────────────────
    const cfSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.CALIBRATION_FACTOR, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    cfSheet.columns = CALIBRATION_FACTOR_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      cfSheet,
      CALIBRATION_FACTOR_COLUMN_MAPPING.map((e) => !!e.required)
    );
    cfSheet.addRow({
      managementNumber: 'SUW-E0001',
      factorType: 'antenna_factor',
      factorName: 'AF 30MHz',
      factorValue: '25.3',
      unit: 'dB/m',
      effectiveDate: '2024-01-15',
    });

    // ── 부적합 시트 ────────────────────────────────────────────────────────────
    const ncSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.NON_CONFORMANCE, {
      pageSetup: EXCEL_PAGE_SETUP,
    });
    ncSheet.columns = NON_CONFORMANCE_COLUMN_MAPPING.map((entry) => ({
      header: getTemplateHeader(entry),
      key: entry.dbField,
      width: 22,
    }));
    this.applyHeaderStyle(
      ncSheet,
      NON_CONFORMANCE_COLUMN_MAPPING.map((e) => !!e.required)
    );
    ncSheet.addRow({
      managementNumber: 'SUW-E0001',
      discoveryDate: '2024-03-01',
      ncType: 'equipment_damage',
      cause: '교정 결과 기준 초과',
      actionPlan: '재교정 실시',
    });

    // ── 참고값 시트 (SSOT: enum + 라벨 맵 기반 이중언어 동적 생성) ──────────
    const refSheet = workbook.addWorksheet(EXCEL_SHEET_NAMES.REFERENCE);
    refSheet.addRow([REFERENCE_LABELS.FIELD_NAME, REFERENCE_LABELS.ALLOWED_VALUES]);
    refSheet.addRow([REFERENCE_LABELS.SITE, formatEnumWithLabels(SiteEnum.options, SITE_LABELS)]);
    refSheet.addRow([
      REFERENCE_LABELS.MANAGEMENT_METHOD,
      formatEnumWithLabels(ManagementMethodEnum.options, MANAGEMENT_METHOD_LABELS),
    ]);
    refSheet.addRow([
      REFERENCE_LABELS.CALIBRATION_REQUIRED,
      formatEnumWithLabels(CalibrationRequiredEnum.options, CALIBRATION_REQUIRED_LABELS),
    ]);
    refSheet.addRow([
      REFERENCE_LABELS.REPAIR_RESULT,
      formatEnumWithLabels(REPAIR_RESULT_VALUES, REPAIR_RESULT_LABELS),
    ]);
    refSheet.addRow([
      REFERENCE_LABELS.INCIDENT_TYPE,
      formatEnumWithLabels(INCIDENT_TYPE_VALUES, INCIDENT_TYPE_LABELS),
    ]);
    refSheet.addRow([REFERENCE_LABELS.CONNECTOR_TYPE, CABLE_CONNECTOR_TYPE_VALUES.join(' | ')]);
    refSheet.addRow([
      REFERENCE_LABELS.TEST_FIELD,
      formatEnumWithLabels(TEST_FIELD_VALUES, TEST_FIELD_LABELS),
    ]);
    refSheet.addRow([
      REFERENCE_LABELS.FACTOR_TYPE,
      formatEnumWithLabels(CALIBRATION_FACTOR_TYPE_VALUES, CALIBRATION_FACTOR_TYPE_LABELS),
    ]);
    refSheet.addRow([
      REFERENCE_LABELS.NC_TYPE,
      formatEnumWithLabels(NON_CONFORMANCE_TYPE_VALUES, NON_CONFORMANCE_TYPE_LABELS),
    ]);
    refSheet.addRow([
      REFERENCE_LABELS.RESOLUTION_TYPE,
      formatEnumWithLabels(RESOLUTION_TYPE_VALUES, RESOLUTION_TYPE_LABELS),
    ]);
    refSheet.addRow([REFERENCE_LABELS.DATE_FORMAT, REFERENCE_LABELS.DATE_FORMAT_VALUE]);
    refSheet.getColumn(1).width = 35;
    refSheet.getColumn(2).width = 80;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private applyHeaderStyle(sheet: ExcelJS.Worksheet, requiredFlags: boolean[]): void {
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colIdx) => {
      const isRequired = requiredFlags[colIdx - 1] ?? false;
      cell.font = { bold: true, color: { argb: EXCEL_COLORS.WHITE } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isRequired ? EXCEL_COLORS.REQUIRED_HEADER : EXCEL_COLORS.OPTIONAL_HEADER },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = EXCEL_HEADER_ROW_HEIGHT;
  }

  private getStatusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }
}
