import { Injectable, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { RawExcelRow, MappedRow } from '../types/data-migration.types';
import {
  COLUMN_ALIAS_INDEX,
  EQUIPMENT_COLUMN_MAPPING,
} from '../constants/equipment-column-mapping';

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
   * xlsx 버퍼를 파싱하여 원시 행 배열 반환
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
    return rawRows.map((raw) => this.mapSingleRow(raw));
  }

  /**
   * 단일 행 매핑 (header alias → dbField + transform)
   */
  private mapSingleRow(raw: RawExcelRow): MappedRow {
    const mappedData: Record<string, unknown> = {};
    const unmappedColumns: string[] = [];
    const recognizedHeaders = new Set<string>();

    for (const [header, rawValue] of Object.entries(raw.rawData)) {
      const key = header.toLowerCase().trim();
      const entry = COLUMN_ALIAS_INDEX.get(key);

      if (!entry) {
        unmappedColumns.push(header);
        continue;
      }

      recognizedHeaders.add(entry.dbField);
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
   * 입력 템플릿 Excel 생성
   * 한국어 헤더 + 예시 행 + 데이터 유효성 검사 드롭다운
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Equipment Management System';

    const sheet = workbook.addWorksheet('장비 등록', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // 컬럼 정의
    const columns = EQUIPMENT_COLUMN_MAPPING.map((entry) => ({
      header: `${entry.aliases[0]}${entry.required ? ' *' : ''}`,
      key: entry.dbField,
      width: 22,
    }));

    sheet.columns = columns;

    // 헤더 스타일
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell, colIdx) => {
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
    headerRow.height = 28;

    // 예시 행
    sheet.addRow({
      name: '네트워크 분석기',
      site: 'suwon',
      initialLocation: '수원랩 A동 102호',
      managementNumber: 'SUW-E0001',
      modelName: 'N5247A',
      manufacturer: 'Keysight',
      serialNumber: 'MY12345678',
      calibrationMethod: 'external_calibration',
      calibrationRequired: 'required',
      calibrationCycle: '12',
      lastCalibrationDate: '2024-01-15',
      calibrationAgency: 'HCT',
      purchaseYear: '2020',
    });

    // 참고 시트 추가
    const refSheet = workbook.addWorksheet('참고값');
    refSheet.addRow(['필드명', '허용값']);
    refSheet.addRow(['사이트(site)', 'suwon | uiwang | pyeongtaek']);
    refSheet.addRow([
      '관리방법(calibrationMethod)',
      'external_calibration | self_inspection | not_applicable',
    ]);
    refSheet.addRow(['교정필요(calibrationRequired)', 'required | not_required']);
    refSheet.addRow(['날짜 형식', 'YYYY-MM-DD 또는 YYYY.MM.DD']);
    refSheet.getColumn(1).width = 30;
    refSheet.getColumn(2).width = 60;

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
