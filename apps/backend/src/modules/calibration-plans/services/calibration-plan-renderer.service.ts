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

    // Row 1 제목 업데이트 — rich text 덮어쓰기 후 폰트 명시 복원
    const titleCell = sheet.getRow(1).getCell(1);
    titleCell.value = `${plan.year}년 ${siteLabel} 연간 교정 계획서`;
    titleCell.font = { bold: true, size: 18, name: '맑은 고딕', charset: 129 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 첫 데이터 행 스타일 참조 (템플릿 보존용)
    const styles = captureRowStyles(sheet, Layout.DATA_START_ROW, Layout.COLUMN_COUNT);

    items.forEach((item: CalibrationPlanItemDetail, idx: number) => {
      const rowIdx = Layout.DATA_START_ROW + idx;
      const confirmedSignature = item.confirmedBy ? (plan.authorName ?? '-') : '-';
      const values: (string | number | null)[] = [
        item.sequenceNumber,
        item.equipment?.managementNumber ?? '-',
        item.equipment?.name ?? '-',
        this.formatDate(item.snapshotValidityDate),
        item.snapshotCalibrationCycle != null ? String(item.snapshotCalibrationCycle) : '-',
        item.snapshotCalibrationAgency ?? '-',
        this.formatDate(item.plannedCalibrationDate),
        item.plannedCalibrationAgency ?? '-',
        confirmedSignature,
        item.actualCalibrationDate
          ? this.formatDotDate(item.actualCalibrationDate)
          : (item.notes ?? '-'),
      ];
      writeDataRow(sheet, rowIdx, values, styles);

      // 확인란(I열=9)에 shrink-to-fit 적용 — 셀 너비(7.6)보다 긴 이름 대응
      if (item.confirmedBy) {
        const iCell = sheet.getRow(rowIdx).getCell(9);
        iCell.alignment = { horizontal: 'center', vertical: 'middle', shrinkToFit: true };
      }
    });

    // DATA_END_ROW를 상한으로 — Row 34+ 서명란(작성/검토/승인) 보호
    clearTrailingRows(
      sheet,
      Layout.DATA_START_ROW + items.length,
      Layout.DATA_END_ROW,
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

  /**
   * 비고란 교정일자 형식: "2026.02.21" (YYYY.MM.DD, 제로패딩).
   *
   * UL-QP-19-01 양식 관례를 따르며, DEFAULT_TIMEZONE 기준으로 날짜를 계산하여
   * UTC/로컬 오프셋에 의한 날짜 오차를 방지.
   */
  private formatDotDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
    // ko-KR 출력 예: "2026. 02. 21." → 공백/마지막 점 제거 → "2026.02.21"
    return parts.replace(/\s+/g, '').replace(/\.$/, '');
  }
}
