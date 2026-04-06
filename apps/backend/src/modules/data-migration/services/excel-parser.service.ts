import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { RawExcelRow, MappedRow } from '../types/data-migration.types';
import {
  COLUMN_ALIAS_INDEX,
  EQUIPMENT_COLUMN_MAPPING,
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
import { detectSheetType, type MigrationSheetType } from '../constants/sheet-config';

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
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException({
        code: 'MIGRATION_EMPTY_FILE',
        message: '파일에 시트가 없습니다.',
      });
    }

    const rowCount = sheet.rowCount;
    if (rowCount < 2) {
      throw new BadRequestException({
        code: 'MIGRATION_NO_DATA_ROWS',
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
        code: 'MIGRATION_NO_HEADERS',
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
    return rawRows.map((raw) => this.mapSingleRow(raw, COLUMN_ALIAS_INDEX));
  }

  /**
   * 멀티시트 파싱 — 모든 시트를 타입별로 감지하여 반환
   */
  async parseMultiSheetBuffer(buffer: Buffer): Promise<ParsedSheet[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const results: ParsedSheet[] = [];

    workbook.eachSheet((sheet) => {
      const sheetType = detectSheetType(sheet.name);
      if (sheetType === null) return; // 인식 불가 시트 스킵 (참고값, 설명 시트 등)
      const aliasIndex = this.getAliasIndexForType(sheetType);

      if (sheet.rowCount < 2) return; // 빈 시트 스킵

      const { rows, unmappedColumns } = this.parseSheet(sheet, aliasIndex);
      if (rows.length === 0) return; // 데이터 없는 시트 스킵

      results.push({ sheetType, sheetName: sheet.name, rows, unmappedColumns });
    });

    if (results.length === 0) {
      throw new BadRequestException({
        code: 'MIGRATION_EMPTY_FILE',
        message: '데이터가 있는 시트가 없습니다.',
      });
    }

    return results;
  }

  private getAliasIndexForType(type: MigrationSheetType): Map<string, ColumnMappingEntry> {
    switch (type) {
      case 'calibration':
        return CALIBRATION_ALIAS_INDEX;
      case 'repair':
        return REPAIR_ALIAS_INDEX;
      case 'incident':
        return INCIDENT_ALIAS_INDEX;
      default:
        return COLUMN_ALIAS_INDEX;
    }
  }

  /**
   * 시트 → rows + unmappedColumns 파싱 (내부 공통 로직)
   */
  private parseSheet(
    sheet: ExcelJS.Worksheet,
    aliasIndex: Map<string, ColumnMappingEntry>
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

      const mapped = this.mapSingleRow({ rowNumber: dataRowNumber, rawData }, aliasIndex);
      mapped.unmappedColumns.forEach((col) => globalUnmapped.add(col));
      rows.push(mapped);
    });

    return { rows, unmappedColumns: Array.from(globalUnmapped) };
  }

  /**
   * 단일 행 매핑 (header alias → dbField + transform)
   */
  private mapSingleRow(raw: RawExcelRow, aliasIndex: Map<string, ColumnMappingEntry>): MappedRow {
    const mappedData: Record<string, unknown> = {};
    const unmappedColumns: string[] = [];

    for (const [header, rawValue] of Object.entries(raw.rawData)) {
      const key = header.toLowerCase().trim();
      const entry = aliasIndex.get(key);

      if (!entry) {
        unmappedColumns.push(header);
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

    const sheet = workbook.addWorksheet('에러 리포트', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // 헤더 정의
    const dataColumns = EQUIPMENT_COLUMN_MAPPING.map((entry) => entry.aliases[0]);
    const allHeaders = ['행번호', '처리결과', '에러 상세', '관리번호', ...dataColumns];

    sheet.columns = allHeaders.map((header, idx) => ({
      header,
      key: String(idx),
      width: idx < 4 ? 15 : 20,
    }));

    // 헤더 스타일
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 28;

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
      if (row.status === 'error') {
        sheetRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        });
      } else if (row.status === 'duplicate') {
        sheetRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF9C3' } };
        });
      }

      sheetRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
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
    const equipSheet = workbook.addWorksheet('장비 등록', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    const equipColumns = EQUIPMENT_COLUMN_MAPPING.map((entry) => ({
      header: `${entry.aliases[0]}${entry.required ? ' *' : ''}`,
      key: entry.dbField,
      width: 22,
    }));

    equipSheet.columns = equipColumns;

    const equipHeaderRow = equipSheet.getRow(1);
    equipHeaderRow.eachCell((cell, colIdx) => {
      const entry = EQUIPMENT_COLUMN_MAPPING[colIdx - 1];
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: entry?.required ? 'FF1D4ED8' : 'FF2563EB' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    equipHeaderRow.height = 28;

    equipSheet.addRow({
      name: '네트워크 분석기',
      site: 'suwon',
      initialLocation: '수원랩 A동 102호',
      managementNumber: 'SUW-E0001',
      modelName: 'N5247A',
      manufacturer: 'Keysight',
      serialNumber: 'MY12345678',
      managementMethod: 'external_calibration',
      calibrationRequired: 'required',
      calibrationCycle: '12',
      lastCalibrationDate: '2024-01-15',
      calibrationAgency: 'HCT',
      purchaseYear: '2020',
    });

    // ── 교정 이력 시트 ──────────────────────────────────────────────────────────
    const calSheet = workbook.addWorksheet('교정 이력', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });
    calSheet.columns = [
      { header: '관리번호 *', key: 'managementNumber', width: 20 },
      { header: '교정일 *', key: 'calibrationDate', width: 18 },
      { header: '교정기관', key: 'agencyName', width: 20 },
      { header: '성적서번호', key: 'certificateNumber', width: 20 },
      { header: '교정결과', key: 'result', width: 20 },
      { header: '교정비용', key: 'cost', width: 15 },
      { header: '비고', key: 'notes', width: 30 },
    ];
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
      cost: '500000',
      notes: '정기 교정',
    });

    // ── 수리 이력 시트 ──────────────────────────────────────────────────────────
    const repairSheet = workbook.addWorksheet('수리 이력', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });
    repairSheet.columns = [
      { header: '관리번호 *', key: 'managementNumber', width: 20 },
      { header: '수리일 *', key: 'repairDate', width: 18 },
      { header: '수리내용 *', key: 'repairDescription', width: 40 },
      { header: '수리결과(완료/부분/실패)', key: 'repairResult', width: 25 },
      { header: '비고', key: 'notes', width: 30 },
    ];
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
    const incidentSheet = workbook.addWorksheet('사고 이력', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });
    incidentSheet.columns = [
      { header: '관리번호 *', key: 'managementNumber', width: 20 },
      { header: '발생일 *', key: 'occurredAt', width: 18 },
      { header: '사고유형(손상/오작동/변경/수리) *', key: 'incidentType', width: 35 },
      { header: '내용 *', key: 'content', width: 50 },
    ];
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

    // ── 참고값 시트 ──────────────────────────────────────────────────────────
    const refSheet = workbook.addWorksheet('참고값');
    refSheet.addRow(['필드명', '허용값']);
    refSheet.addRow(['사이트(site)', 'suwon | uiwang | pyeongtaek']);
    refSheet.addRow([
      '관리방법(managementMethod)',
      'external_calibration | self_inspection | not_applicable',
    ]);
    refSheet.addRow(['교정필요(calibrationRequired)', 'required | not_required']);
    refSheet.addRow(['수리결과(repairResult)', 'completed(완료) | partial(부분) | failed(실패)']);
    refSheet.addRow([
      '사고유형(incidentType)',
      'damage(손상) | malfunction(오작동) | change(변경) | repair(수리)',
    ]);
    refSheet.addRow(['날짜 형식', 'YYYY-MM-DD 또는 YYYY.MM.DD']);
    refSheet.getColumn(1).width = 35;
    refSheet.getColumn(2).width = 70;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private applyHeaderStyle(sheet: ExcelJS.Worksheet, requiredFlags: boolean[]): void {
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colIdx) => {
      const isRequired = requiredFlags[colIdx - 1] ?? false;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isRequired ? 'FF1D4ED8' : 'FF2563EB' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 28;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      valid: '성공',
      error: '오류',
      duplicate: '중복',
      warning: '경고',
    };
    return labels[status] ?? status;
  }
}
