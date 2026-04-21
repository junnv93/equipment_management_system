import { Injectable, InternalServerErrorException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { toExcelLoadableBuffer } from '../../../common/utils/excel-buffer';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import {
  FORM_NUMBER,
  SHEET_NAMES,
  LIST_SHEET_HEADERS,
  LIST_SHEET_COLUMN_WIDTHS,
  LIST_DATA_START_ROW,
  DETAIL_SHEET,
  EXCEL_SHEET_NAME_MAX,
  EXCEL_SHEET_NAME_INVALID_CHARS_RE,
} from './cable-path-loss.layout';
import type { CablePathLossExportData } from './cable-path-loss-export-data.service';

/**
 * UL-QP-18-08 Cable and Path Loss 관리대장 XLSX 렌더러.
 *
 * CablePathLossExportData를 받아 ExcelJS로 다중 시트 XLSX 버퍼를 반환.
 * 시트명/열 구조/열 너비는 `cable-path-loss.layout.ts` SSOT 참조.
 * DB 호출 없음 — 순수 렌더링 담당.
 */
@Injectable()
export class CablePathLossRendererService {
  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }

  async render(data: CablePathLossExportData, templateBuffer: Buffer): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));

    this.renderListSheet(workbook, data);
    this.renderDetailSheets(workbook, data);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private renderListSheet(workbook: ExcelJS.Workbook, data: CablePathLossExportData): void {
    const listSheet = workbook.getWorksheet(SHEET_NAMES.list);
    if (!listSheet) {
      throw new InternalServerErrorException(
        `[${FORM_NUMBER}] 워크시트 '${SHEET_NAMES.list}' 없음. 양식의 시트명이 변경되었을 수 있습니다.`
      );
    }

    const headerRow = listSheet.getRow(1);
    LIST_SHEET_HEADERS.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.commit();

    data.cables.forEach((cable, idx) => {
      const row = listSheet.getRow(LIST_DATA_START_ROW + idx);
      const freqRange = this.buildFreqRangeLabel(cable.frequencyRangeMin, cable.frequencyRangeMax);

      const values: (string | number)[] = [
        idx + 1,
        cable.managementNumber,
        cable.length ?? '-',
        cable.connectorType ?? '-',
        freqRange,
        cable.serialNumber ?? 'N/A',
        cable.location ?? '-',
      ];

      values.forEach((val, c) => {
        const cell = row.getCell(c + 1);
        cell.value = val;
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      row.commit();
    });

    listSheet.columns = LIST_SHEET_COLUMN_WIDTHS.map((width) => ({ width }));
  }

  private renderDetailSheets(workbook: ExcelJS.Workbook, data: CablePathLossExportData): void {
    for (const cable of data.cables) {
      const measurement = data.measurementsByCableId.get(cable.id);
      if (!measurement || measurement.dataPoints.length === 0) continue;

      const sheetName = cable.managementNumber
        .replace(EXCEL_SHEET_NAME_INVALID_CHARS_RE, '_')
        .slice(0, EXCEL_SHEET_NAME_MAX);
      const dataSheet = workbook.addWorksheet(sheetName);

      const infoRow = dataSheet.getRow(DETAIL_SHEET.infoRow);
      infoRow.getCell(DETAIL_SHEET.freqCol).value = `Cable: ${cable.managementNumber}`;
      infoRow.getCell(DETAIL_SHEET.freqCol).font = { bold: true };

      const dateRow = dataSheet.getRow(DETAIL_SHEET.dateRow);
      dateRow.getCell(DETAIL_SHEET.freqCol).value =
        `Measured: ${this.formatDate(measurement.measurementDate)}`;

      const headerRow = dataSheet.getRow(DETAIL_SHEET.headerRow);
      headerRow.getCell(DETAIL_SHEET.freqCol).value = `Freq(MHz)`;
      headerRow.getCell(DETAIL_SHEET.lossCol).value = `Data(dB)`;
      [DETAIL_SHEET.freqCol, DETAIL_SHEET.lossCol].forEach((c) => {
        headerRow.getCell(c).font = { bold: true };
        headerRow.getCell(c).border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      headerRow.commit();

      measurement.dataPoints.forEach((dp, dpIdx) => {
        const dpRow = dataSheet.getRow(DETAIL_SHEET.dataStartRow + dpIdx);
        dpRow.getCell(DETAIL_SHEET.freqCol).value = dp.frequencyMhz;
        dpRow.getCell(DETAIL_SHEET.lossCol).value = Number(dp.lossDb);
        [DETAIL_SHEET.freqCol, DETAIL_SHEET.lossCol].forEach((c) => {
          dpRow.getCell(c).border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
          dpRow.getCell(c).numFmt =
            c === DETAIL_SHEET.freqCol ? DETAIL_SHEET.freqNumFmt : DETAIL_SHEET.lossNumFmt;
        });
        dpRow.commit();
      });

      dataSheet.columns = DETAIL_SHEET.columnWidths.map((width) => ({ width }));
    }
  }

  private buildFreqRangeLabel(min: number | null, max: number | null): string {
    if (min != null && max != null) return `${min} MHz to ${max} MHz`;
    if (min != null) return `${min} MHz+`;
    if (max != null) return `to ${max} MHz`;
    return 'N/A';
  }
}
