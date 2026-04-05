import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { equipmentSelfInspections } from '@equipment-management/db/schema/equipment-self-inspections';
import { eq, desc, and } from 'drizzle-orm';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { FORM_RETENTION_PERIODS } from './retention.service';

interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

interface UserScope {
  site: string;
  teamId?: string;
}

/**
 * 공식 양식 템플릿 기반 내보내기 서비스
 *
 * UL-QP-18-01 ~ UL-QP-18-11 양식을 docx/xlsx로 내보냅니다.
 */
@Injectable()
export class FormTemplateExportService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async exportForm(
    formNumber: string,
    params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const exporters: Record<
      string,
      (params: Record<string, string>, scope?: UserScope) => Promise<ExportResult>
    > = {
      'UL-QP-18-01': (p, s) => this.exportEquipmentRegistry(p, s),
      'UL-QP-18-02': (p) => this.exportHistoryCard(p),
      'UL-QP-18-03': (p) => this.exportIntermediateInspection(p),
      'UL-QP-18-04': (p) => this.exportCalibrationCertificate(p),
      'UL-QP-18-05': (p, s) => this.exportSelfInspection(p, s),
      'UL-QP-18-06': (p) => this.exportCalibrationPlan(p),
      'UL-QP-18-07': (p) => this.exportSoftwareRegistry(p),
      'UL-QP-18-08': (p) => this.exportCableRegistry(p),
      'UL-QP-18-09': (p) => this.exportSoftwareValidation(p),
      'UL-QP-18-10': (p) => this.exportCheckoutRecord(p),
      'UL-QP-18-11': (p) => this.exportNonConformanceReport(p),
    };

    const exporter = exporters[formNumber];
    if (!exporter) {
      throw new BadRequestException({
        code: 'INVALID_FORM_NUMBER',
        message: `Invalid form number: ${formNumber}. Valid range: UL-QP-18-01 ~ UL-QP-18-11`,
      });
    }

    return exporter(params, scope);
  }

  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }

  // UL-QP-18-01: 시험설비 관리 대장
  private async exportEquipmentRegistry(
    params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const conditions = scope ? [eq(equipment.site, scope.site)] : [];
    const rows = await this.db
      .select()
      .from(equipment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipment.managementNumber)
      .limit(500);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('시험설비 관리 대장');

    sheet.columns = [
      { header: '관리번호', key: 'managementNumber', width: 15 },
      { header: '장비명', key: 'name', width: 25 },
      { header: '모델명', key: 'modelName', width: 20 },
      { header: '제조사', key: 'manufacturer', width: 15 },
      { header: '일련번호', key: 'serialNumber', width: 15 },
      { header: '상태', key: 'status', width: 12 },
      { header: '설치장소', key: 'location', width: 15 },
      { header: '사이트', key: 'site', width: 10 },
    ];

    rows.forEach((row) => {
      sheet.addRow({
        managementNumber: row.managementNumber,
        name: row.name,
        modelName: row.modelName ?? '-',
        manufacturer: row.manufacturer ?? '-',
        serialNumber: row.serialNumber ?? '-',
        status: row.status,
        location: row.location ?? '-',
        site: row.site,
      });
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `UL-QP-18-01_시험설비관리대장_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }

  // UL-QP-18-02: 이력카드 — 개별 장비 이력카드는 GET /equipment/:uuid/history-card (docx) 사용
  private async exportHistoryCard(_params: Record<string, string>): Promise<ExportResult> {
    throw new BadRequestException({
      code: 'USE_DEDICATED_ENDPOINT',
      message:
        'UL-QP-18-02 이력카드는 GET /api/equipment/:uuid/history-card 엔드포인트를 사용하세요.',
    });
  }

  // UL-QP-18-03 ~ UL-QP-18-11: 나머지 양식은 동일한 xlsx 패턴으로 제공
  // 실제 양식별 데이터 조회는 해당 모듈의 서비스를 호출해야 하므로,
  // 여기서는 기본 메타데이터 + 보존연한 정보가 포함된 xlsx를 생성합니다.

  private async exportIntermediateInspection(
    _params: Record<string, string>
  ): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-03', '중간점검표');
  }

  private async exportCalibrationCertificate(
    _params: Record<string, string>
  ): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-04', '교정성적서');
  }

  private async exportSelfInspection(
    params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const equipmentId = params.equipmentId;
    if (!equipmentId) {
      return this.createFormPlaceholder('UL-QP-18-05', '자체점검표');
    }

    // 사이트 필터링: 요청된 장비가 사용자 사이트에 속하는지 확인
    if (scope) {
      const [eqRow] = await this.db
        .select({ site: equipment.site })
        .from(equipment)
        .where(and(eq(equipment.id, equipmentId), eq(equipment.site, scope.site)))
        .limit(1);
      if (!eqRow) {
        throw new NotFoundException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: 'Equipment not found or not accessible from your site.',
        });
      }
    }

    const rows = await this.db
      .select()
      .from(equipmentSelfInspections)
      .where(eq(equipmentSelfInspections.equipmentId, equipmentId))
      .orderBy(desc(equipmentSelfInspections.inspectionDate))
      .limit(100);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('자체점검표');

    sheet.columns = [
      { header: '점검일', key: 'date', width: 15 },
      { header: '외관', key: 'appearance', width: 10 },
      { header: '기능', key: 'functionality', width: 10 },
      { header: '안전', key: 'safety', width: 10 },
      { header: '교정상태', key: 'calibrationStatus', width: 12 },
      { header: '전체결과', key: 'overallResult', width: 10 },
      { header: '비고', key: 'remarks', width: 25 },
      { header: '상태', key: 'status', width: 10 },
    ];

    rows.forEach((row) => {
      sheet.addRow({
        date: this.formatDate(row.inspectionDate),
        appearance: row.appearance,
        functionality: row.functionality,
        safety: row.safety,
        calibrationStatus: row.calibrationStatus,
        overallResult: row.overallResult,
        remarks: row.remarks ?? '-',
        status: row.status,
      });
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `UL-QP-18-05_자체점검표_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }

  private async exportCalibrationPlan(_params: Record<string, string>): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-06', '교정계획서');
  }

  private async exportSoftwareRegistry(_params: Record<string, string>): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-07', '시험용소프트웨어관리대장');
  }

  private async exportCableRegistry(_params: Record<string, string>): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-08', '케이블관리대장');
  }

  private async exportSoftwareValidation(_params: Record<string, string>): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-09', '소프트웨어유효성확인');
  }

  private async exportCheckoutRecord(_params: Record<string, string>): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-10', '반출반입기록');
  }

  private async exportNonConformanceReport(_params: Record<string, string>): Promise<ExportResult> {
    return this.createFormPlaceholder('UL-QP-18-11', '부적합보고서');
  }

  private async createFormPlaceholder(formNumber: string, formName: string): Promise<ExportResult> {
    const retention = FORM_RETENTION_PERIODS[formNumber];
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(formName);

    sheet.columns = [
      { header: '항목', key: 'item', width: 20 },
      { header: '값', key: 'value', width: 40 },
    ];

    sheet.addRow({ item: '양식번호', value: formNumber });
    sheet.addRow({ item: '양식명', value: formName });
    sheet.addRow({ item: '보존연한', value: retention?.label ?? '미지정' });
    sheet.addRow({
      item: '생성일',
      value: new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE }),
    });

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `${formNumber}_${formName}_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }
}
