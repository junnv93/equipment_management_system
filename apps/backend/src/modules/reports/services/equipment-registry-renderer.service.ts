import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  EQUIPMENT_AVAILABILITY_LABELS,
  INTERMEDIATE_CHECK_YESNO_LABELS,
  MANAGEMENT_METHOD_LABELS,
} from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { toExcelLoadableBuffer } from '../../../common/utils';
import {
  captureRowStyles,
  clearTrailingRows,
  loadWorksheetByName,
  writeDataRow,
} from '../xlsx-helper';
import {
  COLUMN_COUNT,
  COLUMNS,
  DATA_START_ROW,
  FORM_NUMBER,
  SHEET_NAMES,
  TITLE_ALL_SUFFIX,
  TITLE_PREFIX,
  UPDATE_DATE_CELL,
} from '../layouts/equipment-registry.layout';
import type {
  EquipmentRegistryData,
  EquipmentRegistryRow,
} from './equipment-registry-data.service';

/**
 * UL-QP-18-01 시험설비 관리대장 XLSX 렌더러.
 *
 * EquipmentRegistryData(집계 결과)를 받아 원본 템플릿에 주입한 XLSX 버퍼를 반환.
 * 시트명/제목/컬럼 구조/라벨은 전부 layout 상수 + SSOT 라벨 경유.
 *
 * 렌더링 단계:
 * 1. Row 1: 제목(+ 전체 접미사) + 최종 업데이트 일자
 * 2. Row 2: 컬럼 헤더 (유지 — 템플릿 원본)
 * 3. Row 3+: 데이터 주입 (layout COLUMNS 순서대로)
 * 4. 남은 템플릿 샘플 행 → clearTrailingRows
 */
@Injectable()
export class EquipmentRegistryRendererService {
  async render(data: EquipmentRegistryData, templateBuffer: Buffer): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));
    const sheet = loadWorksheetByName(workbook, SHEET_NAMES, FORM_NUMBER);

    // Row 1: 제목 — 팀 필터 시 "[팀명] 시험설비 관리대장", 전체 시 "(전체) 시험설비 관리대장"
    const headerCell = sheet.getRow(1).getCell(1);
    const titlePrefix = data.teamName ?? TITLE_ALL_SUFFIX;
    headerCell.value = `${titlePrefix} ${TITLE_PREFIX}`;

    // Row 1: 기존 템플릿 날짜 셀을 content-search로 찾아 갱신
    // UPDATE_DATE_CELL.col 하드코딩 대신 "최종 업데이트 일자" 텍스트가 있는 셀을 탐색
    const row1 = sheet.getRow(1);
    const dateStr = new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
    let dateUpdated = false;
    for (let c = 2; c <= COLUMN_COUNT; c++) {
      const cell = row1.getCell(c);
      const val = cell.value;
      if (typeof val === 'string' && val.includes('최종 업데이트 일자')) {
        cell.value = `최종 업데이트 일자 : ${dateStr}`;
        dateUpdated = true;
        break;
      }
    }
    if (!dateUpdated) {
      // fallback: layout 상수 위치 (템플릿 셀 미탐지 시)
      sheet.getRow(UPDATE_DATE_CELL.row).getCell(UPDATE_DATE_CELL.col).value =
        `최종 업데이트 일자 : ${dateStr}`;
    }

    // 템플릿 원본 Row 3의 스타일 추출 (데이터 행 서식 참조)
    const cellStyles = captureRowStyles(sheet, DATA_START_ROW, COLUMN_COUNT);

    // DB 데이터를 Row 3부터 덮어쓰기
    data.rows.forEach((row, idx) => {
      const rowIdx = DATA_START_ROW + idx;
      const values = COLUMNS.map((col) => this.getCellValue(row, col.key));
      writeDataRow(sheet, rowIdx, values, cellStyles);
    });

    // 남은 템플릿 샘플 행 제거 (DB 데이터 수 < 템플릿 sample 수)
    const templateDataEnd = sheet.rowCount;
    if (templateDataEnd >= DATA_START_ROW + data.rows.length) {
      clearTrailingRows(sheet, DATA_START_ROW + data.rows.length, templateDataEnd, COLUMN_COUNT);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * layout.ts의 COLUMNS[].key → equipment row 값 매핑.
   *
   * 각 key는 layout 상수이며 여기서 SSOT 라벨 변환을 적용. 하드코딩 라벨 금지.
   */
  private getCellValue(
    row: EquipmentRegistryRow,
    key: (typeof COLUMNS)[number]['key']
  ): string | number | null {
    switch (key) {
      case 'managementNumber':
        return row.managementNumber;
      case 'assetNumber':
        return row.assetNumber ?? 'N/A';
      case 'name':
        return row.name;
      case 'managementMethod': {
        const mm = row.managementMethod as keyof typeof MANAGEMENT_METHOD_LABELS | null | undefined;
        return mm && mm in MANAGEMENT_METHOD_LABELS ? MANAGEMENT_METHOD_LABELS[mm] : 'N/A';
      }
      case 'lastCalibrationDate':
        return formatDateOrNA(row.lastCalibrationDate);
      case 'calibrationAgency':
        return row.calibrationAgency ?? 'N/A';
      case 'calibrationCycle':
        return row.calibrationCycle ?? 'N/A';
      case 'nextCalibrationDate':
        return formatDateOrNA(row.nextCalibrationDate);
      case 'manufacturer':
        return row.manufacturer ?? '-';
      case 'purchaseYear':
        return row.purchaseYear ?? '-';
      case 'modelName':
        return row.modelName ?? '-';
      case 'serialNumber':
        return row.serialNumber ?? '-';
      case 'description':
        return row.description ?? '-';
      case 'location':
        return row.location ?? '-';
      case 'needsIntermediateCheck':
        return INTERMEDIATE_CHECK_YESNO_LABELS[row.needsIntermediateCheck ? 'true' : 'false'];
      case 'availability':
        return EQUIPMENT_AVAILABILITY_LABELS[row.status] ?? EQUIPMENT_AVAILABILITY_LABELS.available;
    }
  }
}

function formatDateOrNA(d: Date | null | undefined): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
}
