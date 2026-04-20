import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { FormTemplateService } from '../../reports/form-template.service';
import {
  loadWorksheetByName,
  captureRowStyles,
  writeDataRow,
  clearTrailingRows,
} from '../../reports/xlsx-helper';
import * as Layout from '../calibration-plan.layout';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import { SITE_LABELS } from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { toExcelLoadableBuffer } from '../../../common/utils';
import type { CalibrationPlanDetail, CalibrationPlanItemDetail } from '../calibration-plans.types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const SITE_LABEL_MAP: Record<string, string> = SITE_LABELS;

export interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * 교정계획서 XLSX 렌더링 서비스.
 *
 * xlsx-helper 4개 함수를 사용하여 equipment-registry 패턴과 통일:
 * loadWorksheetByName → captureRowStyles → writeDataRow × N → clearTrailingRows
 */
@Injectable()
export class CalibrationPlanRendererService {
  constructor(private readonly formTemplateService: FormTemplateService) {}

  async render(plan: CalibrationPlanDetail): Promise<ExportResult> {
    const items = plan.items ?? [];
    const siteLabel = SITE_LABEL_MAP[plan.siteId] ?? plan.siteId;

    const templateBuffer = await this.formTemplateService.getTemplateBuffer(Layout.FORM_NUMBER);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));

    const sheet = loadWorksheetByName(workbook, Layout.SHEET_NAMES, Layout.FORM_NUMBER, {
      fallbackToFirst: true,
    });

    // Row 1 제목 업데이트
    sheet.getRow(1).getCell(1).value = `${plan.year}년 ${siteLabel} 연간 교정 계획서`;

    // 첫 데이터 행 스타일 참조 (템플릿 보존용)
    const styles = captureRowStyles(sheet, Layout.DATA_START_ROW, Layout.COLUMN_COUNT);

    items.forEach((item: CalibrationPlanItemDetail, idx: number) => {
      const values: (string | number | null)[] = [
        item.sequenceNumber,
        item.equipment?.managementNumber ?? '-',
        item.equipment?.name ?? '-',
        this.formatDate(item.snapshotValidityDate),
        item.snapshotCalibrationCycle != null ? String(item.snapshotCalibrationCycle) : '-',
        item.snapshotCalibrationAgency ?? '-',
        this.formatDate(item.plannedCalibrationDate),
        item.plannedCalibrationAgency ?? '-',
        item.confirmedBy ? 'O' : '-',
        item.actualCalibrationDate
          ? this.formatDate(item.actualCalibrationDate)
          : (item.notes ?? '-'),
      ];
      writeDataRow(sheet, Layout.DATA_START_ROW + idx, values, styles);
    });

    clearTrailingRows(
      sheet,
      Layout.DATA_START_ROW + items.length,
      sheet.rowCount,
      Layout.COLUMN_COUNT
    );

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return { buffer, mimeType: XLSX_MIME, filename: this.buildFilename(plan, siteLabel) };
  }

  private buildFilename(plan: CalibrationPlanDetail, siteLabel: string): string {
    const entry = FORM_CATALOG['UL-QP-19-01'];
    const date = new Date().toISOString().split('T')[0];
    const name = entry.name.replace(/\s+/g, '');
    return `${entry.formNumber}_${name}_${plan.year}_${siteLabel}_${date}.xlsx`;
  }

  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }
}
