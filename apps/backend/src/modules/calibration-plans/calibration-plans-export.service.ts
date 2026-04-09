import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { CalibrationPlansService } from './calibration-plans.service';
import { FormTemplateService } from '../reports/form-template.service';
import { SITE_LABELS } from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { toExcelLoadableBuffer } from '../../common/utils';
import type { CalibrationPlanDetail, CalibrationPlanItemDetail } from './calibration-plans.types';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ✅ SSOT: packages/schemas에서 임포트 — Record<string, string>로 확장하여 동적 인덱싱 허용
const SITE_LABEL_MAP: Record<string, string> = SITE_LABELS;

interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * 교정계획서 Excel 내보내기 서비스
 *
 * UL-QP-19-01 양식 템플릿을 스토리지에서 로드하여
 * 교정계획서 데이터를 채워 xlsx로 반환합니다.
 */
@Injectable()
export class CalibrationPlansExportService {
  constructor(
    private readonly calibrationPlansService: CalibrationPlansService,
    private readonly formTemplateService: FormTemplateService
  ) {}

  async exportExcel(uuid: string): Promise<ExportResult> {
    const plan: CalibrationPlanDetail = await this.calibrationPlansService.findOne(uuid);
    const items = plan.items || [];

    // 스토리지에서 템플릿 로드
    const templateBuffer = await this.formTemplateService.getTemplateBuffer('UL-QP-19-01');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));
    const sheet =
      workbook.getWorksheet('연간 교정계획서') ||
      workbook.getWorksheet('교정계획서') ||
      workbook.worksheets[0];

    // Row 1~3: 병합 제목 (A1:J3) — 연도/사이트 정보 업데이트
    const headerCell = sheet.getRow(1).getCell(1);
    const siteLabel = SITE_LABEL_MAP[plan.siteId] || plan.siteId;
    headerCell.value = `${plan.year}년 ${siteLabel} 연간 교정 계획서`;

    // Row 4~5: 컬럼 헤더 (템플릿 보존)
    // Row 6+: 데이터 행
    const DATA_START_ROW = 6;

    // 기존 데이터 행의 스타일 참조용 (Row 3 — 템플릿 원본 스타일)
    const styleRef = sheet.getRow(DATA_START_ROW);
    const COL_COUNT = 10; // 순번~비고
    const cellStyles: Partial<ExcelJS.Style>[] = [];
    for (let c = 1; c <= COL_COUNT; c++) {
      cellStyles.push({ ...styleRef.getCell(c).style });
    }

    // DB 데이터를 Row 6부터 덮어쓰기
    items.forEach((item: CalibrationPlanItemDetail, idx: number) => {
      const r = DATA_START_ROW + idx;
      const excelRow = sheet.getRow(r);
      const values: (string | number)[] = [
        item.sequenceNumber, // 순번
        item.equipment?.managementNumber || '-', // 관리번호
        item.equipment?.name || '-', // 장비명
        this.formatDate(item.snapshotValidityDate), // 현황 - 유효일자
        item.snapshotCalibrationCycle ? `${item.snapshotCalibrationCycle}` : '-', // 현황 - 교정주기
        item.snapshotCalibrationAgency || '-', // 현황 - 교정기관
        this.formatDate(item.plannedCalibrationDate), // 계획 - 교정일자
        item.plannedCalibrationAgency || '-', // 계획 - 교정기관
        item.confirmedBy ? 'O' : '-', // 계획 - 확인
        item.actualCalibrationDate
          ? this.formatDate(item.actualCalibrationDate)
          : item.notes || '-', // 비고
      ];

      values.forEach((val, c) => {
        const cell = excelRow.getCell(c + 1);
        cell.value = val;
        if (cellStyles[c]) {
          Object.assign(cell.style, cellStyles[c]);
        }
      });

      excelRow.commit();
    });

    // 남은 기존 템플릿 행 비우기 (DB 데이터보다 템플릿 행이 더 많은 경우)
    const templateDataEnd = sheet.rowCount;
    for (let r = DATA_START_ROW + items.length; r <= templateDataEnd; r++) {
      const excelRow = sheet.getRow(r);
      for (let c = 1; c <= COL_COUNT; c++) {
        excelRow.getCell(c).value = null;
      }
      excelRow.commit();
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const filename = `UL-QP-19-01_연간교정계획서_${plan.year}_${siteLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;

    return { buffer, mimeType: XLSX_MIME, filename };
  }

  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }
}
