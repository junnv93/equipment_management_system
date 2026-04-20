import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
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
  /**
   * templateBuffer는 호출자(CalibrationPlansExportService)가 주입.
   * renderer는 Buffer → Excel 변환만 담당.
   */
  async render(plan: CalibrationPlanDetail, templateBuffer: Buffer): Promise<ExportResult> {
    const items = plan.items ?? [];
    const siteLabel = SITE_LABEL_MAP[plan.siteId] ?? plan.siteId;

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

    // 항목 수가 템플릿 행 수(27)를 초과하면 서명란 바로 앞에 빈 행을 삽입하여 서명란을 아래로 밀어낸다.
    const extraRows = Math.max(0, items.length - Layout.TEMPLATE_DATA_ROW_COUNT);
    if (extraRows > 0) {
      sheet.spliceRows(Layout.DATA_END_ROW + 1, 0, ...Array<unknown[]>(extraRows).fill([]));
      for (let r = Layout.DATA_END_ROW + 1; r <= Layout.DATA_END_ROW + extraRows; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= Layout.COLUMN_COUNT; c++) {
          Object.assign(row.getCell(c).style, styles[c - 1]);
        }
        row.commit();
      }
    }

    items.forEach((item: CalibrationPlanItemDetail, idx: number) => {
      const rowIdx = Layout.DATA_START_ROW + idx;
      // confirmedBy: 각 항목의 확인자(plan 작성자와 별개). UL-QP-19-01 §4: 항목별 확인 서명.
      const confirmedSignature = item.confirmedBy ? (item.confirmedByName ?? '-') : '-';
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

      // 확인란에 shrink-to-fit 적용 — 셀 너비보다 긴 이름 대응
      if (item.confirmedBy) {
        const confirmedCell = sheet.getRow(rowIdx).getCell(Layout.CONFIRMED_COL);
        confirmedCell.alignment = { horizontal: 'center', vertical: 'middle', shrinkToFit: true };
      }
    });

    // 미사용 템플릿 행 제거 (항목 수 < 27인 경우에만 유효)
    if (items.length < Layout.TEMPLATE_DATA_ROW_COUNT) {
      clearTrailingRows(
        sheet,
        Layout.DATA_START_ROW + items.length,
        Layout.DATA_END_ROW,
        Layout.COLUMN_COUNT
      );
    }

    this.renderSignatureSection(sheet, plan, extraRows);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    return { buffer, mimeType: XLSX_MIME, filename: this.buildFilename(plan, siteLabel) };
  }

  /**
   * 작성/검토/승인 서명란에 이름과 날짜를 주입한다.
   *
   * @param rowOffset 항목 수 초과로 삽입된 추가 행 수 — 서명란 행 번호에 더해진다.
   */
  private renderSignatureSection(
    sheet: ExcelJS.Worksheet,
    plan: CalibrationPlanDetail,
    rowOffset = 0
  ): void {
    const nameRow = sheet.getRow(Layout.SIGNATURE_NAME_ROW + rowOffset);
    const { author, reviewer, approver } = Layout.SIGNATURE_COLS;

    const setName = (col: number, name: string | null | undefined): void => {
      const cell = nameRow.getCell(col);
      cell.value = name ?? '-';
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    };

    setName(author, plan.authorName);
    setName(reviewer, plan.reviewedByName);
    setName(approver, plan.approvedByName);
    nameRow.commit();

    const dateRow = sheet.getRow(Layout.SIGNATURE_DATE_ROW + rowOffset);
    dateRow.getCell(author).value = this.formatSlashDate(plan.createdAt);
    dateRow.getCell(reviewer).value = this.formatSlashDate(plan.reviewedAt ?? null);
    dateRow.getCell(approver).value = this.formatSlashDate(plan.approvedAt ?? null);
    dateRow.commit();
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
   * 서명란 날짜 형식: "2026 / 04 / 20" — 템플릿 "/        /" 슬래시 관례를 따름.
   *
   * null/undefined이면 "/        /" 원본 플레이스홀더를 반환하여 빈 서명란처럼 보이게 함.
   */
  private formatSlashDate(d: Date | string | null | undefined): string {
    if (!d) return '/        /';
    const date = typeof d === 'string' ? new Date(d) : d;
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value ?? '';
    const m = parts.find((p) => p.type === 'month')?.value ?? '';
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    return `${y} / ${m} / ${day}`;
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
