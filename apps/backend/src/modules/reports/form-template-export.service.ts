import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  Logger,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { AppDatabase } from '@equipment-management/db';
import { DocxTemplate } from './docx-template.util';
import { FormTemplateService } from './form-template.service';
import { equipment } from '@equipment-management/db/schema/equipment';
import {
  equipmentSelfInspections,
  selfInspectionItems,
} from '@equipment-management/db/schema/equipment-self-inspections';
import {
  intermediateInspections,
  intermediateInspectionItems,
  intermediateInspectionEquipment,
} from '@equipment-management/db/schema/intermediate-inspections';
import { users } from '@equipment-management/db/schema/users';
import { teams } from '@equipment-management/db/schema/teams';
import { eq, desc, and, notInArray, sql, type SQL } from 'drizzle-orm';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  FORM_CATALOG,
  isFormImplemented,
  isFormDedicatedEndpoint,
} from '@equipment-management/shared-constants';
import {
  CLASSIFICATION_TO_CODE,
  type Classification,
  type EquipmentStatus,
} from '@equipment-management/schemas';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../common/storage/storage.interface';

interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

interface UserScope {
  site: string;
  teamId?: string;
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * 공식 양식 템플릿 기반 내보내기 서비스
 *
 * UL-QP-18-01 ~ UL-QP-18-11 양식을 xlsx로 내보냅니다.
 * 구현되지 않은 양식은 501 Not Implemented를 반환합니다.
 */
@Injectable()
export class FormTemplateExportService {
  private readonly logger = new Logger(FormTemplateExportService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    private readonly formTemplateService: FormTemplateService
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
      'UL-QP-18-03': (p, s) => this.exportIntermediateInspection(p, s),
      'UL-QP-18-05': (p, s) => this.exportSelfInspection(p, s),
    };

    const exporter = exporters[formNumber];
    if (!exporter) {
      throw new NotImplementedException({
        code: 'FORM_NOT_IMPLEMENTED',
        message: `${formNumber} exporter is registered as implemented but has no handler.`,
      });
    }
    return exporter(params, scope);
  }

  // ============================================================================
  // 공통 유틸리티
  // ============================================================================

  private formatDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }

  private makeFilename(entry: { formNumber: string; name: string }): string {
    return `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
  }

  // ============================================================================
  // UL-QP-18-01: 시험설비 관리 대장
  // ============================================================================

  /** QP-18-01 enum → 한국어 변환 */
  private static readonly CALIBRATION_METHOD_LABELS: Record<string, string> = {
    external_calibration: '외부교정',
    self_inspection: '자체점검',
    not_applicable: '비대상',
  };

  /** 장비 상태 → QP-18-01 가용여부 (3가지) */
  private static readonly STATUS_TO_AVAILABILITY: Record<string, string> = {
    available: '사용',
    checked_out: '사용',
    calibration_scheduled: '사용',
    calibration_overdue: '사용',
    non_conforming: '고장',
    spare: '여분',
    retired: '불용',
    pending_disposal: '불용',
    disposed: '불용',
    temporary: '사용',
    inactive: '여분',
  };

  private async exportEquipmentRegistry(
    params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-01'];
    const conditions: SQL<unknown>[] = [];

    // 사이트 필터: params 우선, 없으면 scope
    const siteFilter = params.site || scope?.site;
    if (siteFilter) {
      conditions.push(eq(equipment.site, siteFilter));
    }

    // URL 필터 조건 반영 (장비 목록 페이지와 동일)
    if (params.teamId) {
      conditions.push(eq(equipment.teamId, params.teamId));
    }
    if (params.status) {
      conditions.push(sql`${equipment.status} = ${params.status}`);
    }
    if (params.calibrationMethod) {
      conditions.push(eq(equipment.calibrationMethod, params.calibrationMethod));
    }
    if (params.classification && params.classification in CLASSIFICATION_TO_CODE) {
      const code = CLASSIFICATION_TO_CODE[params.classification as Classification];
      conditions.push(eq(equipment.classificationCode, code));
    }
    if (params.manufacturer) {
      conditions.push(eq(equipment.manufacturer, params.manufacturer));
    }
    if (params.location) {
      conditions.push(eq(equipment.location, params.location));
    }
    if (params.isShared === 'true') {
      conditions.push(eq(equipment.isShared, true));
    } else if (params.isShared === 'false') {
      conditions.push(eq(equipment.isShared, false));
    }

    // 활성 장비만 (isActive = true)
    conditions.push(eq(equipment.isActive, true));

    // 퇴역/폐기 장비 숨기기
    if (params.showRetired !== 'true') {
      conditions.push(notInArray(equipment.status, ['retired', 'disposed'] as EquipmentStatus[]));
    }

    const rows = await this.db
      .select()
      .from(equipment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipment.managementNumber)
      .limit(1000);

    const formatDate = (d: Date | null | undefined): string => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
    };

    // 템플릿 파일 로드 (양식 서식 보존) — 스토리지 기반
    const templateBuffer = await this.formTemplateService.getTemplateBuffer('UL-QP-18-01');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);
    const sheet =
      workbook.getWorksheet('시험설비 관리대장') ||
      workbook.getWorksheet('시험설비 관리 대장') ||
      workbook.worksheets[0];

    // Row 1: 헤더 업데이트 (팀명 + 날짜)
    const headerCell = sheet.getRow(1).getCell(1);
    const teamLabel = params.teamId ? '' : '(전체)';
    headerCell.value = `${teamLabel} 시험설비 관리대장`;
    const dateCell = sheet.getRow(1).getCell(14);
    if (dateCell) {
      dateCell.value = `최종 업데이트 일자 : ${new Date().toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE })}`;
    }

    // Row 1: 팀명+날짜 헤더, Row 2: 컬럼 헤더 (템플릿 보존)
    // Row 3+: 기존 데이터를 DB 데이터로 덮어쓰기
    const DATA_START_ROW = 3;

    // 기존 데이터 행의 스타일 참조용 (Row 3 — 템플릿 원본 스타일)
    const styleRef = sheet.getRow(DATA_START_ROW);
    const cellStyles: Partial<ExcelJS.Style>[] = [];
    for (let c = 1; c <= 16; c++) {
      cellStyles.push({ ...styleRef.getCell(c).style });
    }

    // DB 데이터를 Row 3부터 덮어쓰기
    rows.forEach((row, idx) => {
      const r = DATA_START_ROW + idx;
      const excelRow = sheet.getRow(r);
      const values: (string | number)[] = [
        row.managementNumber,
        row.assetNumber ?? 'N/A',
        row.name,
        FormTemplateExportService.CALIBRATION_METHOD_LABELS[row.calibrationMethod ?? ''] ?? 'N/A',
        formatDate(row.lastCalibrationDate),
        row.calibrationAgency ?? 'N/A',
        row.calibrationCycle ?? 'N/A',
        formatDate(row.nextCalibrationDate),
        row.manufacturer ?? '-',
        row.purchaseYear ?? '-',
        row.modelName ?? '-',
        row.serialNumber ?? '-',
        row.description ?? '-',
        row.location ?? '-',
        row.needsIntermediateCheck ? 'O' : 'X',
        FormTemplateExportService.STATUS_TO_AVAILABILITY[row.status] ?? '사용',
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
    for (let r = DATA_START_ROW + rows.length; r <= templateDataEnd; r++) {
      const excelRow = sheet.getRow(r);
      for (let c = 1; c <= 16; c++) {
        excelRow.getCell(c).value = null;
      }
      excelRow.commit();
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, mimeType: XLSX_MIME, filename: this.makeFilename(entry) };
  }

  // ============================================================================
  // UL-QP-18-03: 중간점검표
  // ============================================================================

  private async exportIntermediateInspection(
    params: Record<string, string>,
    scope?: UserScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-03'];
    const inspectionId = params.inspectionId;
    if (!inspectionId) {
      throw new BadRequestException({
        code: 'MISSING_INSPECTION_ID',
        message: 'inspectionId query parameter is required for intermediate inspection export.',
      });
    }

    // 점검 기록 + 장비 정보 조회
    const [inspection] = await this.db
      .select({
        id: intermediateInspections.id,
        inspectionDate: intermediateInspections.inspectionDate,
        classification: intermediateInspections.classification,
        inspectionCycle: intermediateInspections.inspectionCycle,
        calibrationValidityPeriod: intermediateInspections.calibrationValidityPeriod,
        overallResult: intermediateInspections.overallResult,
        remarks: intermediateInspections.remarks,
        approvalStatus: intermediateInspections.approvalStatus,
        approvedAt: intermediateInspections.approvedAt,
        // 장비 정보
        equipmentName: equipment.name,
        equipmentModel: equipment.modelName,
        managementNumber: equipment.managementNumber,
        equipmentLocation: equipment.location,
        equipmentSite: equipment.site,
        // 점검자
        inspectorId: intermediateInspections.inspectorId,
        approvedById: intermediateInspections.approvedBy,
      })
      .from(intermediateInspections)
      .innerJoin(equipment, eq(intermediateInspections.equipmentId, equipment.id))
      .where(eq(intermediateInspections.id, inspectionId))
      .limit(1);

    if (!inspection) {
      throw new NotFoundException({
        code: 'INSPECTION_NOT_FOUND',
        message: `Intermediate inspection ${inspectionId} not found.`,
      });
    }

    // 사이트 필터링
    if (scope && inspection.equipmentSite !== scope.site) {
      throw new NotFoundException({
        code: 'INSPECTION_NOT_FOUND',
        message: 'Inspection not accessible from your site.',
      });
    }

    // 팀 정보 조회
    const [teamRow] = await this.db
      .select({ teamName: teams.name })
      .from(equipment)
      .innerJoin(teams, eq(equipment.teamId, teams.id))
      .where(eq(equipment.managementNumber, inspection.managementNumber!))
      .limit(1);

    // 점검자, 승인자 정보 조회
    const [inspector] = inspection.inspectorId
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, inspection.inspectorId))
          .limit(1)
      : [null];

    const [approver] = inspection.approvedById
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, inspection.approvedById))
          .limit(1)
      : [null];

    // 점검 항목
    const items = await this.db
      .select()
      .from(intermediateInspectionItems)
      .where(eq(intermediateInspectionItems.inspectionId, inspectionId))
      .orderBy(intermediateInspectionItems.itemNumber);

    // 측정 장비 목록
    const measureEquipment = await this.db
      .select({
        managementNumber: equipment.managementNumber,
        equipmentName: equipment.name,
        calibrationDate: intermediateInspectionEquipment.calibrationDate,
      })
      .from(intermediateInspectionEquipment)
      .innerJoin(equipment, eq(intermediateInspectionEquipment.equipmentId, equipment.id))
      .where(eq(intermediateInspectionEquipment.inspectionId, inspectionId));

    // docx 템플릿 로드 — 스토리지 기반
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-03');
    const doc = new DocxTemplate(templateBuf);
    const classificationLabel =
      inspection.classification === 'calibrated' ? '교정기기' : '비교정기기';

    // --- Table 0: 장비 정보 헤더 + 점검 항목 ---
    // Row 0~3: 장비 정보 (값만 교체 — 셀[1], 셀[3])
    doc.setCellValue(0, 0, 1, classificationLabel);
    doc.setCellValue(0, 0, 3, teamRow?.teamName ?? '-');
    doc.setCellValue(0, 1, 1, inspection.managementNumber ?? '-');
    doc.setCellValue(0, 1, 3, inspection.equipmentLocation ?? '-');
    doc.setCellValue(0, 2, 1, inspection.equipmentName ?? '-');
    doc.setCellValue(0, 2, 3, inspection.equipmentModel ?? '-');
    doc.setCellValue(0, 3, 1, inspection.inspectionCycle ?? '-');
    doc.setCellValue(0, 3, 3, inspection.calibrationValidityPeriod ?? '-');
    // Row 4: 구분행 (유지)
    // Row 5: 헤더행 (유지)
    // Row 6~: 데이터 행 — 템플릿 Row[6]을 복제, Row[7~10] 빈 행 제거
    const itemData = items.map((item) => [
      String(item.itemNumber),
      item.checkItem,
      item.checkCriteria ?? '-',
      item.checkResult ?? '-',
      item.judgment === 'pass' ? '합격' : item.judgment === 'fail' ? '불합격' : '-',
    ]);
    doc.setDataRows(0, 6, itemData, 4); // 템플릿에 빈 행 4개 (Row 7~10)

    // --- Table 1: 측정 장비 List ---
    // Row 0: 타이틀 (유지), Row 1: 헤더 (유지)
    // Row 2~: 데이터 행 — 템플릿 Row[2]를 복제, Row[3~5] 빈 행 제거
    const meData = measureEquipment.map((me, idx) => [
      String(idx + 1),
      me.managementNumber ?? '-',
      me.equipmentName ?? '-',
      this.formatDate(me.calibrationDate),
    ]);
    doc.setDataRows(1, 2, meData, 3); // 빈 행 3개 (Row 3~5)

    // --- Table 2: 점검 결과 및 결재 ---
    // Row 0: [1]=점검일, [4]=담당서명, [5]=검토서명, [6]=승인서명
    doc.setCellValue(2, 0, 1, this.formatDate(inspection.inspectionDate));
    // Row 1: [1]=점검자
    doc.setCellValue(2, 1, 1, inspector?.name ?? '-');
    // Row 2: [1]=특이사항
    doc.setCellValue(2, 2, 1, inspection.remarks ?? '-');

    // 결재란 서명 이미지 삽입 (담당/검토 = 점검자, 승인 = 기술책임자)
    await this.insertDocxSignature(
      doc,
      2,
      0,
      4,
      inspector?.signaturePath ?? null,
      inspector?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      0,
      5,
      inspector?.signaturePath ?? null,
      inspector?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      0,
      6,
      approver?.signaturePath ?? null,
      approver?.name ?? '-'
    );

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-05: 자체점검표
  // ============================================================================

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

    // 장비 정보 조회 (헤더용)
    const [eqRow] = await this.db
      .select({
        id: equipment.id,
        name: equipment.name,
        modelName: equipment.modelName,
        managementNumber: equipment.managementNumber,
        location: equipment.location,
        site: equipment.site,
        calibrationRequired: equipment.calibrationRequired,
        teamId: equipment.teamId,
      })
      .from(equipment)
      .where(
        scope
          ? and(eq(equipment.id, equipmentId), eq(equipment.site, scope.site))
          : eq(equipment.id, equipmentId)
      )
      .limit(1);

    if (!eqRow) {
      throw new NotFoundException({
        code: 'EQUIPMENT_NOT_FOUND',
        message: 'Equipment not found or not accessible from your site.',
      });
    }

    // 팀 정보
    const [teamRow] = eqRow.teamId
      ? await this.db
          .select({ teamName: teams.name })
          .from(teams)
          .where(eq(teams.id, eqRow.teamId))
          .limit(1)
      : [null];

    // 대상 점검 기록: inspectionId가 있으면 해당 건(+장비 소속 검증), 없으면 최근 1건
    const inspectionId = params.inspectionId;
    const [record] = inspectionId
      ? await this.db
          .select()
          .from(equipmentSelfInspections)
          .where(
            and(
              eq(equipmentSelfInspections.id, inspectionId),
              eq(equipmentSelfInspections.equipmentId, equipmentId) // 사이트 우회 방지
            )
          )
          .limit(1)
      : await this.db
          .select()
          .from(equipmentSelfInspections)
          .where(eq(equipmentSelfInspections.equipmentId, equipmentId))
          .orderBy(desc(equipmentSelfInspections.inspectionDate))
          .limit(1);

    if (!record) {
      throw new NotFoundException({
        code: 'SELF_INSPECTION_NOT_FOUND',
        message: 'No self-inspection records found for this equipment.',
      });
    }

    // 점검자/확인자 정보
    const [inspector] = await this.db
      .select({ name: users.name, signaturePath: users.signatureImagePath })
      .from(users)
      .where(eq(users.id, record.inspectorId))
      .limit(1);

    const [confirmer] = record.confirmedBy
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, record.confirmedBy))
          .limit(1)
      : [null];

    // 점검 항목 (자식 테이블)
    const items = await this.db
      .select()
      .from(selfInspectionItems)
      .where(eq(selfInspectionItems.inspectionId, record.id))
      .orderBy(selfInspectionItems.itemNumber);

    // docx 템플릿 로드 — 스토리지 기반
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-05');
    const doc = new DocxTemplate(templateBuf);
    const classificationLabel =
      eqRow.calibrationRequired === 'required' ? '교정기기' : '비교정기기';

    // --- Table 0: 장비 정보 헤더 + 점검 항목 ---
    doc.setCellValue(0, 0, 1, classificationLabel);
    doc.setCellValue(0, 0, 3, teamRow?.teamName ?? '-');
    doc.setCellValue(0, 1, 1, eqRow.managementNumber ?? '-');
    doc.setCellValue(0, 1, 3, eqRow.location ?? '-');
    doc.setCellValue(0, 2, 1, eqRow.name ?? '-');
    doc.setCellValue(0, 2, 3, eqRow.modelName ?? '-');
    doc.setCellValue(0, 3, 1, `${record.inspectionCycle}개월`);
    doc.setCellValue(0, 3, 3, classificationLabel === '비교정기기' ? 'N/A' : '-');
    // Row 4: 구분행, Row 5: 헤더행 (유지)
    // Row 6+: 데이터 행 — 유연 항목 or 레거시 fallback
    const resultLabel = (r: string) =>
      r === 'pass' ? '이상 없음' : r === 'fail' ? '부적합' : 'N/A';

    let itemData: string[][];
    if (items.length > 0) {
      itemData = items.map((item) => [
        String(item.itemNumber),
        item.checkItem,
        resultLabel(item.checkResult),
      ]);
    } else {
      // 기존 고정 컬럼 fallback
      itemData = [
        ['1', '외관검사', resultLabel(record.appearance)],
        ['2', '기능 점검', resultLabel(record.functionality)],
        ['3', '안전 점검', resultLabel(record.safety)],
        ['4', '교정 상태 점검', resultLabel(record.calibrationStatus)],
      ];
    }
    doc.setDataRows(0, 6, itemData, 6); // 템플릿에 빈 행 6개 (Row 7~12)

    // --- Table 1: 기타 특기사항 (조치내용) ---
    // Row 0: 타이틀 (유지)
    // Row 1~: 데이터 행 — 템플릿 Row[1]을 복제, Row[2~3] 빈 행 제거
    // JSONB 런타임 안전 파싱 (레거시 데이터 shape 불일치 방어)
    const rawNotes = record.specialNotes;
    const specialNotes = Array.isArray(rawNotes)
      ? (rawNotes as { content?: string; date?: string | null }[]).filter(
          (n) => typeof n?.content === 'string'
        )
      : null;
    const noteData =
      specialNotes && specialNotes.length > 0
        ? specialNotes.map((note, idx) => [String(idx + 1), note.content ?? '-', note.date ?? '-'])
        : record.remarks
          ? [['1', record.remarks, '-']]
          : [['', '-', '-']];
    doc.setDataRows(1, 1, noteData, 2); // 빈 행 2개 (Row 2~3)

    // --- Table 2: 점검 결과 및 결재 ---
    doc.setCellValue(2, 0, 1, this.formatDate(record.inspectionDate));
    doc.setCellValue(2, 1, 1, inspector?.name ?? '-');
    doc.setCellValue(2, 2, 1, record.remarks ?? '-');

    // 결재란 서명 (담당/검토 = 점검자, 승인 = 기술책임자)
    await this.insertDocxSignature(
      doc,
      2,
      0,
      4,
      inspector?.signaturePath ?? null,
      inspector?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      0,
      5,
      inspector?.signaturePath ?? null,
      inspector?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      0,
      6,
      confirmer?.signaturePath ?? null,
      confirmer?.name ?? '-'
    );

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.docx`,
    };
  }

  // ============================================================================
  // docx 서명 삽입 헬퍼
  // ============================================================================

  private async insertDocxSignature(
    doc: DocxTemplate,
    tableIndex: number,
    rowIndex: number,
    cellIndex: number,
    signaturePath: string | null,
    fallbackName: string
  ): Promise<void> {
    if (!signaturePath) {
      doc.setCellValue(tableIndex, rowIndex, cellIndex, fallbackName);
      return;
    }
    try {
      const imageBuffer = await this.storage.download(signaturePath);
      const ext = signaturePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      doc.setSignatureImage(tableIndex, rowIndex, cellIndex, imageBuffer, ext);
    } catch {
      this.logger.warn(`Failed to load signature: ${signaturePath}, using name fallback`);
      doc.setCellValue(tableIndex, rowIndex, cellIndex, fallbackName);
    }
  }
}
