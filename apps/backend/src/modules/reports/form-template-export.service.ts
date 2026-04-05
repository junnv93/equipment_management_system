import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { AppDatabase } from '@equipment-management/db';
import { equipment } from '@equipment-management/db/schema/equipment';
import { equipmentSelfInspections } from '@equipment-management/db/schema/equipment-self-inspections';
import { eq, desc, and } from 'drizzle-orm';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  FORM_CATALOG,
  isFormImplemented,
  isFormDedicatedEndpoint,
} from '@equipment-management/shared-constants';

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
 * UL-QP-18-01 ~ UL-QP-18-11 양식을 xlsx로 내보냅니다.
 * 구현되지 않은 양식은 501 Not Implemented를 반환합니다.
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
    const catalogEntry = FORM_CATALOG[formNumber as keyof typeof FORM_CATALOG];

    if (!catalogEntry) {
      throw new BadRequestException({
        code: 'INVALID_FORM_NUMBER',
        message: `Invalid form number: ${formNumber}. Valid range: UL-QP-18-01 ~ UL-QP-18-11`,
      });
    }

    if (isFormDedicatedEndpoint(formNumber)) {
      throw new BadRequestException({
        code: 'USE_DEDICATED_ENDPOINT',
        message: `${formNumber} ${catalogEntry.name}은(는) 전용 엔드포인트를 사용하세요. (예: GET /api/equipment/:uuid/history-card)`,
      });
    }

    if (!isFormImplemented(formNumber)) {
      throw new NotImplementedException({
        code: 'FORM_NOT_IMPLEMENTED',
        message: `${formNumber} ${catalogEntry.name} 내보내기는 아직 구현되지 않았습니다.`,
      });
    }

    const exporters: Record<
      string,
      (params: Record<string, string>, scope?: UserScope) => Promise<ExportResult>
    > = {
      'UL-QP-18-01': (p, s) => this.exportEquipmentRegistry(p, s),
      'UL-QP-18-05': (p, s) => this.exportSelfInspection(p, s),
    };

    return exporters[formNumber](params, scope);
  }

  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }

  // UL-QP-18-01: 시험설비 관리 대장
  private async exportEquipmentRegistry(
    _params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-01'];
    const conditions = scope ? [eq(equipment.site, scope.site)] : [];
    const rows = await this.db
      .select()
      .from(equipment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipment.managementNumber)
      .limit(500);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(entry.name);

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
      filename: `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }

  // UL-QP-18-05: 자체점검표
  private async exportSelfInspection(
    params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-05'];
    const equipmentId = params.equipmentId;
    if (!equipmentId) {
      throw new BadRequestException({
        code: 'MISSING_EQUIPMENT_ID',
        message: 'equipmentId query parameter is required for self-inspection export.',
      });
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
    const sheet = workbook.addWorksheet(entry.name);

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
      filename: `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
  }
}
