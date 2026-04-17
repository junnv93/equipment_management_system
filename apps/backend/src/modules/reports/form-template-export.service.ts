import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  NotImplementedException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import ExcelJS from 'exceljs';
import { toExcelLoadableBuffer } from '../../common/utils';
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
import { inspectionDocumentItems } from '@equipment-management/db/schema/inspection-document-items';
import { inspectionResultSections } from '@equipment-management/db/schema/inspection-result-sections';
import { documents } from '@equipment-management/db/schema/documents';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import { conditionChecks } from '@equipment-management/db/schema/condition-checks';
import { testSoftware } from '@equipment-management/db/schema/test-software';
import { cables, cableLossDataPoints } from '@equipment-management/db/schema/cables';
import { softwareValidations } from '@equipment-management/db/schema/software-validations';
import { users } from '@equipment-management/db/schema/users';
import { teams } from '@equipment-management/db/schema/teams';
import { eq, ne, desc, and, inArray, sql, type SQL, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  EXPORT_QUERY_LIMITS,
  FORM_CATALOG,
  isFormImplemented,
  isFormDedicatedEndpoint,
} from '@equipment-management/shared-constants';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import {
  CLASSIFICATION_TO_CODE,
  EQUIPMENT_AVAILABILITY_LABELS,
  INSPECTION_JUDGMENT_LABELS,
  INTERMEDIATE_CHECK_YESNO_LABELS,
  MANAGEMENT_METHOD_LABELS,
  QP18_CLASSIFICATION_LABELS,
  SELF_INSPECTION_RESULT_LABELS,
  SOFTWARE_AVAILABILITY_LABELS,
  type Classification,
  type SoftwareAvailability,
  type InspectionType,
} from '@equipment-management/schemas';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../common/storage/storage.interface';

interface ExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
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

  /**
   * 양식 템플릿 기반 내보내기 진입점.
   *
   * ## 스코프 강제 지점 (SiteScopeInterceptor 가 단일 SSOT)
   * 호출 시점에 `filter` 는 이미 `SiteScopeInterceptor` (failLoud 모드) 가
   * `enforceScope()` 를 통과시킨 값이다. 따라서 본 service 는:
   * - cross-border 검증 / 정책 분기를 더 이상 알지 못함
   * - `ResolvedDataScope` 를 받지 않음
   * - `filter.site` / `filter.teamId` 만 SQL WHERE 에 바인딩
   *
   * cross-site / none 거부는 인터셉터에서 ForbiddenException 으로 처리되고,
   * AuditInterceptor 가 `access_denied` 로 자동 기록한다.
   */
  async exportForm(
    formNumber: string,
    params: Record<string, string>,
    filter: EnforcedScope
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
      (params: Record<string, string>, filter: EnforcedScope) => Promise<ExportResult>
    > = {
      'UL-QP-18-01': (p, f) => this.exportEquipmentRegistry(p, f),
      'UL-QP-18-03': (p, f) => this.exportIntermediateInspection(p, f),
      'UL-QP-18-05': (p, f) => this.exportSelfInspection(p, f),
      'UL-QP-18-06': (p, f) =>
        p.importId ? this.exportRentalImportAsCheckoutForm(p, f) : this.exportCheckout(p, f),
      'UL-QP-18-07': (p, f) => this.exportSoftwareRegistry(p, f),
      'UL-QP-18-08': (p, f) => this.exportCablePathLoss(p, f),
      'UL-QP-18-09': (p, f) => this.exportSoftwareValidation(p, f),
      'UL-QP-18-10': (p, f) => this.exportEquipmentImport(p, f),
    };

    const exporter = exporters[formNumber];
    if (!exporter) {
      throw new NotImplementedException({
        code: 'FORM_NOT_IMPLEMENTED',
        message: `${formNumber} exporter is registered as implemented but has no handler.`,
      });
    }
    return exporter(params, filter);
  }

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
  // 라벨은 @equipment-management/schemas SSOT 사용:
  // - MANAGEMENT_METHOD_LABELS — 관리방법 한국어
  // - EQUIPMENT_AVAILABILITY_LABELS — 장비 상태 → 가용여부 (사용/고장/여분/불용)
  // - INTERMEDIATE_CHECK_YESNO_LABELS — 중간점검 대상 O/X

  private async exportEquipmentRegistry(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-01'];
    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(eq(equipment.site, filter.site));
    }
    if (filter.teamId) {
      conditions.push(eq(equipment.teamId, filter.teamId));
    }
    if (params.status) {
      conditions.push(sql`${equipment.status} = ${params.status}`);
    }
    if (params.managementMethod) {
      conditions.push(eq(equipment.managementMethod, params.managementMethod));
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

    // 폐기 장비 숨기기
    if (params.showRetired !== 'true') {
      conditions.push(ne(equipment.status, 'disposed'));
    }

    const rows = await this.db
      .select()
      .from(equipment)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(equipment.managementNumber)
      .limit(EXPORT_QUERY_LIMITS.FULL_EXPORT);

    const formatDate = (d: Date | null | undefined): string => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
    };

    // 템플릿 파일 로드 (양식 서식 보존) — 스토리지 기반
    const templateBuffer = await this.formTemplateService.getTemplateBuffer('UL-QP-18-01');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));
    const sheet =
      workbook.getWorksheet('시험설비 관리대장') || workbook.getWorksheet('시험설비 관리 대장');
    if (!sheet) {
      throw new InternalServerErrorException(
        `[UL-QP-18-01] 워크시트 '시험설비 관리대장' 없음. 양식의 시트명이 변경되었을 수 있습니다.`
      );
    }

    // Row 1: 헤더 업데이트 (팀명 + 날짜)
    const headerCell = sheet.getRow(1).getCell(1);
    const teamLabel = filter.teamId ? '' : '(전체)';
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
      const mm = row.managementMethod as keyof typeof MANAGEMENT_METHOD_LABELS | null | undefined;
      const values: (string | number)[] = [
        row.managementNumber,
        row.assetNumber ?? 'N/A',
        row.name,
        mm && mm in MANAGEMENT_METHOD_LABELS ? MANAGEMENT_METHOD_LABELS[mm] : 'N/A',
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
        INTERMEDIATE_CHECK_YESNO_LABELS[row.needsIntermediateCheck ? 'true' : 'false'],
        EQUIPMENT_AVAILABILITY_LABELS[row.status] ?? '사용',
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
    filter: EnforcedScope
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
        equipmentTeamId: equipment.teamId,
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

    // 스코프 경계 강제 (site 또는 team) — 경계 밖은 존재 은닉(404)
    if (filter.site && inspection.equipmentSite !== filter.site) {
      throw new NotFoundException({
        code: 'INSPECTION_NOT_FOUND',
        message: 'Inspection not accessible from your site.',
      });
    }
    if (filter.teamId && inspection.equipmentTeamId !== filter.teamId) {
      throw new NotFoundException({
        code: 'INSPECTION_NOT_FOUND',
        message: 'Inspection not accessible from your team.',
      });
    }

    // 팀 정보 조회
    const [teamRow] = await this.db
      .select({ teamName: teams.name })
      .from(equipment)
      .innerJoin(teams, eq(equipment.teamId, teams.id))
      .where(eq(equipment.managementNumber, inspection.managementNumber!))
      .limit(1);

    // 점검자, 승인자, 점검 항목, 측정 장비 — 독립 쿼리 병렬 실행
    const [[inspector], [approver], items, measureEquipment] = await Promise.all([
      inspection.inspectorId
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, inspection.inspectorId))
            .limit(1)
        : Promise.resolve([null] as [null]),
      inspection.approvedById
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, inspection.approvedById))
            .limit(1)
        : Promise.resolve([null] as [null]),
      this.db
        .select()
        .from(intermediateInspectionItems)
        .where(eq(intermediateInspectionItems.inspectionId, inspectionId))
        .orderBy(intermediateInspectionItems.itemNumber),
      this.db
        .select({
          managementNumber: equipment.managementNumber,
          equipmentName: equipment.name,
          calibrationDate: intermediateInspectionEquipment.calibrationDate,
        })
        .from(intermediateInspectionEquipment)
        .innerJoin(equipment, eq(intermediateInspectionEquipment.equipmentId, equipment.id))
        .where(eq(intermediateInspectionEquipment.inspectionId, inspectionId)),
    ]);

    // docx 템플릿 로드 — 스토리지 기반
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-03');
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-03');
    // 분류 snapshot → SSOT 라벨. null/missing 시 '비교정기기' default (비파괴 fallback).
    const classificationLabel =
      QP18_CLASSIFICATION_LABELS[inspection.classification ?? 'non_calibrated'];

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
      (item.detailedResult ?? item.checkResult) || '-',
      item.judgment ? INSPECTION_JUDGMENT_LABELS[item.judgment] : '-',
    ]);
    doc.setDataRows(0, 6, itemData, 4); // 템플릿에 빈 행 4개 (Row 7~10)

    // detailedResult가 멀티라인인 항목은 setCellMultilineText로 덮어쓰기
    // setDataRows 후 행 인덱스: 헤더 6행(0~5) + 데이터 행 순서
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const resultText = item.detailedResult ?? item.checkResult;
      if (resultText && resultText.includes('\n')) {
        doc.setCellMultilineText(0, 6 + i, 3, resultText);
      }
    }

    // 항목별 첨부 사진 조회 + 별도 섹션으로 추가
    const itemPhotos = await this.db
      .select({
        inspectionItemId: inspectionDocumentItems.inspectionItemId,
        sortOrder: inspectionDocumentItems.sortOrder,
        filePath: documents.filePath,
        mimeType: documents.mimeType,
        originalFileName: documents.originalFileName,
      })
      .from(inspectionDocumentItems)
      .innerJoin(documents, eq(inspectionDocumentItems.documentId, documents.id))
      .where(
        and(
          inArray(
            inspectionDocumentItems.inspectionItemId,
            items.map((it) => it.id)
          ),
          eq(inspectionDocumentItems.inspectionItemType, 'intermediate'),
          eq(documents.status, 'active')
        )
      )
      .orderBy(inspectionDocumentItems.inspectionItemId, inspectionDocumentItems.sortOrder);

    // 사진이 있는 항목만 별도 "첨부 사진" 섹션으로 추가
    if (itemPhotos.length > 0) {
      const photosByItem = new Map<string, typeof itemPhotos>();
      for (const photo of itemPhotos) {
        const existing = photosByItem.get(photo.inspectionItemId) ?? [];
        existing.push(photo);
        photosByItem.set(photo.inspectionItemId, existing);
      }

      for (const item of items) {
        const photos = photosByItem.get(item.id);
        if (!photos || photos.length === 0) continue;

        const blocks: Array<
          | { type: 'text'; value: string }
          | {
              type: 'image';
              buffer: Buffer;
              ext: 'png' | 'jpeg';
              widthCm?: number;
              heightCm?: number;
            }
        > = [];

        for (const photo of photos) {
          try {
            const imgBuffer = await this.storage.download(photo.filePath);
            const ext = photo.mimeType === 'image/png' ? ('png' as const) : ('jpeg' as const);
            blocks.push({ type: 'image', buffer: imgBuffer, ext, widthCm: 12, heightCm: 9 });
          } catch {
            this.logger.warn(`Failed to load inspection photo: ${photo.filePath}`);
            blocks.push({ type: 'text', value: `[사진 로드 실패: ${photo.originalFileName}]` });
          }
        }

        doc.appendSection(`${item.itemNumber}. ${item.checkItem} — 첨부 사진`, blocks);
      }
    }

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
    // Row 0: [1]=점검일, [4]=담당(텍스트), [5]=검토(텍스트), [6]=승인(텍스트)
    doc.setCellValue(2, 0, 1, this.formatDate(inspection.inspectionDate));
    // Row 1: [1]=점검자, [4]=담당서명, [5]=검토서명, [6]=승인서명
    doc.setCellValue(2, 1, 1, inspector?.name ?? '-');
    // Row 2: [1]=특이사항
    doc.setCellValue(2, 2, 1, inspection.remarks ?? '-');

    // 결재란 서명 이미지 삽입 — Row 1 (담당/검토/승인 텍스트 아래 행)
    // Row 0의 담당/검토/승인 텍스트는 유지하고, 바로 아래 Row 1에 서명 삽입
    await this.insertDocxSignature(
      doc,
      2,
      1,
      4,
      inspector?.signaturePath ?? null,
      inspector?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      1,
      5,
      inspector?.signaturePath ?? null,
      inspector?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      1,
      6,
      approver?.signaturePath ?? null,
      approver?.name ?? '-'
    );

    // 동적 결과 섹션 렌더링 (장비 유형별 가변 측정 결과)
    // 내부에서 섹션 유무 판단 후 템플릿 예시 텍스트 제거 + 페이지 나누기 처리
    await this.renderResultSections(doc, inspectionId, 'intermediate');

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${inspection.managementNumber}_${inspection.equipmentName}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-05: 자체점검표
  // ============================================================================

  private async exportSelfInspection(
    params: Record<string, string>,
    filter: EnforcedScope
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
        (() => {
          // 스코프 경계를 WHERE 조건에 직접 적용 — 경계 밖은 단순히 "없는 것"으로 은닉
          const conditions: SQL<unknown>[] = [eq(equipment.id, equipmentId)];
          if (filter.site) conditions.push(eq(equipment.site, filter.site));
          if (filter.teamId) conditions.push(eq(equipment.teamId, filter.teamId));
          return and(...conditions);
        })()
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

    // submitter = 담당+검토(동일인), approver = 승인 (QP-18-05 결재 구조)
    const [submitter] = record.submittedBy
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, record.submittedBy))
          .limit(1)
      : [null];
    const [approver] = record.approvedBy
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, record.approvedBy))
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
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-05');
    // 분류/교정유효기간: snapshot(record) 우선, 없으면 장비 마스터 fallback.
    // snapshot은 기록 시점 값 보존(drift 방지) — 2026-04-17 Phase 1 마이그레이션 추가.
    const classification =
      record.classification ??
      (eqRow.calibrationRequired === 'required' ? 'calibrated' : 'non_calibrated');
    const classificationLabel = QP18_CLASSIFICATION_LABELS[classification];
    const validityPeriodLabel = record.calibrationValidityPeriod ?? '-';

    // --- Table 0: 장비 정보 헤더 + 점검 항목 ---
    doc.setCellValue(0, 0, 1, classificationLabel);
    doc.setCellValue(0, 0, 3, teamRow?.teamName ?? '-');
    doc.setCellValue(0, 1, 1, eqRow.managementNumber ?? '-');
    doc.setCellValue(0, 1, 3, eqRow.location ?? '-');
    doc.setCellValue(0, 2, 1, eqRow.name ?? '-');
    doc.setCellValue(0, 2, 3, eqRow.modelName ?? '-');
    doc.setCellValue(0, 3, 1, `${record.inspectionCycle}개월`);
    doc.setCellValue(0, 3, 3, validityPeriodLabel);
    // Row 4: 구분행, Row 5: 헤더행 (유지)
    // Row 6+: 데이터 행 — 유연 항목 or 레거시 fallback
    const resultLabel = (r: string): string =>
      r === 'pass' || r === 'fail' || r === 'na'
        ? SELF_INSPECTION_RESULT_LABELS[r as keyof typeof SELF_INSPECTION_RESULT_LABELS]
        : SELF_INSPECTION_RESULT_LABELS.na;

    let itemData: string[][];
    if (items.length > 0) {
      itemData = items.map((item) => [
        String(item.itemNumber),
        item.checkItem,
        item.detailedResult ? item.detailedResult : resultLabel(item.checkResult),
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

    // detailedResult가 멀티라인인 항목은 setCellMultilineText로 덮어쓰기
    if (items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.detailedResult && item.detailedResult.includes('\n')) {
          doc.setCellMultilineText(0, 6 + i, 2, item.detailedResult);
        }
      }
    }

    // 항목별 첨부 사진 조회 + 별도 섹션으로 추가
    if (items.length > 0) {
      const selfItemPhotos = await this.db
        .select({
          inspectionItemId: inspectionDocumentItems.inspectionItemId,
          sortOrder: inspectionDocumentItems.sortOrder,
          filePath: documents.filePath,
          mimeType: documents.mimeType,
          originalFileName: documents.originalFileName,
        })
        .from(inspectionDocumentItems)
        .innerJoin(documents, eq(inspectionDocumentItems.documentId, documents.id))
        .where(
          and(
            inArray(
              inspectionDocumentItems.inspectionItemId,
              items.map((it) => it.id)
            ),
            eq(inspectionDocumentItems.inspectionItemType, 'self'),
            eq(documents.status, 'active')
          )
        )
        .orderBy(inspectionDocumentItems.inspectionItemId, inspectionDocumentItems.sortOrder);

      if (selfItemPhotos.length > 0) {
        const photosByItem = new Map<string, typeof selfItemPhotos>();
        for (const photo of selfItemPhotos) {
          const existing = photosByItem.get(photo.inspectionItemId) ?? [];
          existing.push(photo);
          photosByItem.set(photo.inspectionItemId, existing);
        }

        for (const item of items) {
          const photos = photosByItem.get(item.id);
          if (!photos || photos.length === 0) continue;

          const blocks: Array<
            | { type: 'text'; value: string }
            | {
                type: 'image';
                buffer: Buffer;
                ext: 'png' | 'jpeg';
                widthCm?: number;
                heightCm?: number;
              }
          > = [];

          for (const photo of photos) {
            try {
              const imgBuffer = await this.storage.download(photo.filePath);
              const ext = photo.mimeType === 'image/png' ? ('png' as const) : ('jpeg' as const);
              blocks.push({ type: 'image', buffer: imgBuffer, ext, widthCm: 12, heightCm: 9 });
            } catch {
              this.logger.warn(`Failed to load inspection photo: ${photo.filePath}`);
              blocks.push({ type: 'text', value: `[사진 로드 실패: ${photo.originalFileName}]` });
            }
          }

          doc.appendSection(`${item.itemNumber}. ${item.checkItem} — 첨부 사진`, blocks);
        }
      }
    }

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

    // 결재란 서명 (QP-18-05): 담당(Cell4)=submitter, 검토(Cell5)=submitter, 승인(Cell6)=approver
    await this.insertDocxSignature(
      doc,
      2,
      1,
      4,
      submitter?.signaturePath ?? null,
      submitter?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      1,
      5,
      submitter?.signaturePath ?? null,
      submitter?.name ?? '-'
    );
    await this.insertDocxSignature(
      doc,
      2,
      1,
      6,
      approver?.signaturePath ?? null,
      approver?.name ?? '-'
    );

    // 동적 결과 섹션 렌더링 (장비 유형별 가변 측정 결과)
    await this.renderResultSections(doc, record.id, 'self');

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${eqRow.managementNumber}_${eqRow.name}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-06: 장비 반·출입 확인서
  // ============================================================================

  private formatQp1806Date(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y} . ${m} . ${day} .`;
  }

  private async exportCheckout(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-06'];
    const checkoutId = params.checkoutId;
    if (!checkoutId) {
      throw new BadRequestException({
        code: 'MISSING_CHECKOUT_ID',
        message: 'checkoutId query parameter is required for checkout export.',
      });
    }

    const [checkout] = await this.db
      .select()
      .from(checkouts)
      .where(eq(checkouts.id, checkoutId))
      .limit(1);

    if (!checkout) {
      throw new NotFoundException({
        code: 'CHECKOUT_NOT_FOUND',
        message: 'Checkout not found.',
      });
    }

    // 반출 장비 목록 + 장비 정보 (단일 JOIN, sequenceNumber 정렬)
    const items = await this.db
      .select({
        sequenceNumber: checkoutItems.sequenceNumber,
        quantity: checkoutItems.quantity,
        conditionBefore: checkoutItems.conditionBefore,
        conditionAfter: checkoutItems.conditionAfter,
        equipmentName: equipment.name,
        equipmentModel: equipment.modelName,
        equipmentManagementNumber: equipment.managementNumber,
        equipmentSite: equipment.site,
        equipmentTeamId: equipment.teamId,
      })
      .from(checkoutItems)
      .innerJoin(equipment, eq(checkoutItems.equipmentId, equipment.id))
      .where(eq(checkoutItems.checkoutId, checkoutId))
      .orderBy(asc(checkoutItems.sequenceNumber));

    // 스코프 경계 강제 — 어느 항목 하나라도 경계 밖이면 전체 차단
    if (filter.site && items.some((it) => it.equipmentSite !== filter.site)) {
      throw new NotFoundException({
        code: 'CHECKOUT_NOT_FOUND',
        message: 'Checkout not found or not accessible from your site.',
      });
    }
    if (filter.teamId && items.some((it) => it.equipmentTeamId !== filter.teamId)) {
      throw new NotFoundException({
        code: 'CHECKOUT_NOT_FOUND',
        message: 'Checkout not found or not accessible from your team.',
      });
    }

    // 상태 확인 기록, 작성자(신청자), 승인자 — 독립 쿼리 병렬 실행
    const [condChecks, [requester], [approver]] = await Promise.all([
      this.db.select().from(conditionChecks).where(eq(conditionChecks.checkoutId, checkoutId)),
      this.db
        .select({ name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(eq(users.id, checkout.requesterId))
        .limit(1),
      checkout.approverId
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, checkout.approverId))
            .limit(1)
        : Promise.resolve([null] as [null]),
    ]);

    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-06');
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-06');

    // Row 2: 반출지 / 전화번호
    doc.setCellValue(0, 2, 1, checkout.destination ?? '-');
    doc.setCellValue(0, 2, 3, checkout.phoneNumber ?? '-');
    // Row 3: 반출주소
    doc.setCellValue(0, 3, 1, checkout.address ?? '-');
    // Row 4: 반출사유
    doc.setCellValue(0, 4, 1, checkout.reason ?? '-');

    // Row 5: 반출 확인 문장 + 날짜
    const checkoutDateStr = this.formatQp1806Date(checkout.checkoutDate);
    doc.setCellValue(
      0,
      5,
      0,
      `아래 목록과 같이 측정장비를 반출하였음을 확인합니다.    ${checkoutDateStr}    반출자 : ${requester?.name ?? '-'}`
    );

    // Row 9~22: 장비 목록 14행 (순번 1~14)
    const conditionFallback = (step: 'lender_checkout' | 'lender_return'): string => {
      const c = condChecks.find((cc) => cc.step === step);
      if (!c) return '-';
      return `${c.appearanceStatus}/${c.operationStatus}`;
    };
    for (let i = 0; i < 14; i++) {
      const rowIdx = 9 + i;
      const item = items.find((it) => it.sequenceNumber === i + 1);
      if (!item) {
        doc.setCellValue(0, rowIdx, 1, '-');
        doc.setCellValue(0, rowIdx, 2, '-');
        doc.setCellValue(0, rowIdx, 3, '-');
        doc.setCellValue(0, rowIdx, 4, '-');
        doc.setCellValue(0, rowIdx, 5, '-');
        doc.setCellValue(0, rowIdx, 6, '-');
        continue;
      }
      doc.setCellValue(0, rowIdx, 1, item.equipmentName ?? '-');
      doc.setCellValue(0, rowIdx, 2, item.equipmentModel ?? '-');
      doc.setCellValue(0, rowIdx, 3, String(item.quantity));
      doc.setCellValue(0, rowIdx, 4, item.equipmentManagementNumber ?? '-');
      doc.setCellValue(0, rowIdx, 5, item.conditionBefore ?? conditionFallback('lender_checkout'));
      doc.setCellValue(0, rowIdx, 6, item.conditionAfter ?? conditionFallback('lender_return'));
    }

    // Row 23: 특기사항
    doc.setCellValue(0, 23, 1, checkout.inspectionNotes ?? '-');

    // Row 24: 반입 확인 문장 + 날짜
    const returnDateStr = this.formatQp1806Date(checkout.actualReturnDate);
    doc.setCellValue(
      0,
      24,
      0,
      `상기 목록과 같이 측정장비를 이상없이 반입하였음을 확인합니다.    ${returnDateStr}    반입자 : ${requester?.name ?? '-'}`
    );

    // Row 1: 작성/승인 결재란 (반출 시점)
    await this.insertDocxSignature(doc, 0, 1, 1, requester?.signaturePath ?? null, '(서명)');
    await this.insertDocxSignature(doc, 0, 1, 2, approver?.signaturePath ?? null, '(서명)');

    // Row 25: 작성/승인 결재란 (반입 시점)
    await this.insertDocxSignature(doc, 0, 25, 1, requester?.signaturePath ?? null, '(서명)');
    await this.insertDocxSignature(doc, 0, 25, 2, approver?.signaturePath ?? null, '(서명)');

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}.docx`,
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

  // ============================================================================
  // 동적 결과 섹션 렌더링 (중간점검/자체점검 공통)
  // ============================================================================

  private async renderResultSections(
    doc: DocxTemplate,
    inspectionId: string,
    inspectionType: InspectionType
  ): Promise<void> {
    const sections = await this.db
      .select()
      .from(inspectionResultSections)
      .where(
        and(
          eq(inspectionResultSections.inspectionId, inspectionId),
          eq(inspectionResultSections.inspectionType, inspectionType)
        )
      )
      .orderBy(asc(inspectionResultSections.sortOrder));

    if (sections.length === 0) return;

    // 결과 섹션이 있을 때만: 템플릿 예시 텍스트 제거 + 2페이지 시작 페이지 나누기
    doc.removeTemplateExampleTextAndInsertPageBreak();

    /**
     * N+1 제거: photo/rich_table 섹션에서 참조되는 모든 documentId 를 선수집한 뒤
     * 1회 batch SELECT + Promise.allSettled 로 병렬 다운로드한다.
     * 기존 loadDocumentImage 를 섹션/셀마다 직렬 호출하던 경로를 대체.
     */
    const documentIdSet = new Set<string>();
    for (const section of sections) {
      if (section.sectionType === 'photo' && section.documentId) {
        documentIdSet.add(section.documentId);
      } else if (section.sectionType === 'rich_table') {
        const rd = section.richTableData as {
          headers: string[];
          rows: Array<
            Array<
              | { type: 'text'; value: string }
              | { type: 'image'; documentId: string; widthCm?: number; heightCm?: number }
            >
          >;
        } | null;
        if (rd) {
          for (const row of rd.rows) {
            for (const cell of row) {
              if (cell.type === 'image') documentIdSet.add(cell.documentId);
            }
          }
        }
      }
    }

    const imageCache = await this.loadDocumentImagesBatch(Array.from(documentIdSet));

    // 템플릿의 numbering 매핑 (글머리 기호 스타일)
    const { heading: headingNumId } = doc.bulletNumIds;

    for (const section of sections) {
      switch (section.sectionType) {
        case 'title':
          doc.appendParagraph(section.title ?? '', {
            bold: true,
            fontSize: 12,
            numId: headingNumId,
          });
          break;
        case 'text': {
          if (section.title) {
            doc.appendParagraph(section.title, { bold: true, numId: headingNumId });
          }
          // 멀티라인: 각 행을 별도 단락으로. ※/■는 그냥 문자 — numbering 변환하지 않음.
          const lines = (section.content ?? '').split('\n');
          for (const line of lines) {
            doc.appendParagraph(line.trim());
          }
          break;
        }
        case 'data_table': {
          const td = section.tableData as { headers: string[]; rows: string[][] } | null;
          if (td) {
            if (section.title) {
              doc.appendParagraph(section.title, { bold: true, numId: headingNumId });
            }
            doc.appendTable(td.headers, td.rows);
          }
          break;
        }
        case 'photo': {
          if (section.title) {
            doc.appendParagraph(section.title, { bold: true, numId: headingNumId });
          }
          if (section.documentId) {
            const imageResult = imageCache.get(section.documentId);
            if (imageResult) {
              doc.appendImage(
                imageResult.buffer,
                imageResult.ext,
                Number(section.imageWidthCm) || 12,
                Number(section.imageHeightCm) || 9
              );
            }
          }
          break;
        }
        case 'rich_table': {
          const rd = section.richTableData as {
            headers: string[];
            rows: Array<
              Array<
                | { type: 'text'; value: string }
                | { type: 'image'; documentId: string; widthCm?: number; heightCm?: number }
              >
            >;
          } | null;
          if (rd) {
            if (section.title) {
              doc.appendParagraph(section.title, { bold: true, numId: headingNumId });
            }
            const resolvedRows = rd.rows.map((row) =>
              row.map((cell) => {
                if (cell.type === 'text') return cell;
                const img = imageCache.get(cell.documentId);
                if (!img) return { type: 'text' as const, value: '[image not found]' };
                return {
                  type: 'image' as const,
                  buffer: img.buffer,
                  ext: img.ext,
                  widthCm: cell.widthCm,
                  heightCm: cell.heightCm,
                };
              })
            );
            doc.appendRichTable(rd.headers, resolvedRows);
          }
          break;
        }
      }
    }
  }

  /**
   * 여러 documentId 에 대한 이미지를 1회 SELECT + 병렬 다운로드로 로드한다.
   * 개별 다운로드 실패는 Map 에서 누락 — 렌더 단계가 `[image not found]` 로 fallback.
   */
  private async loadDocumentImagesBatch(
    documentIds: string[]
  ): Promise<Map<string, { buffer: Buffer; ext: 'png' | 'jpeg' }>> {
    const result = new Map<string, { buffer: Buffer; ext: 'png' | 'jpeg' }>();
    if (documentIds.length === 0) return result;

    const rows = await this.db
      .select({
        id: documents.id,
        filePath: documents.filePath,
        mimeType: documents.mimeType,
      })
      .from(documents)
      .where(inArray(documents.id, documentIds));

    const downloads = await Promise.allSettled(
      rows.map(async (row) => {
        const buffer = await this.storage.download(row.filePath);
        const ext = row.mimeType === 'image/png' ? ('png' as const) : ('jpeg' as const);
        return { id: row.id, buffer, ext };
      })
    );

    for (const outcome of downloads) {
      if (outcome.status === 'fulfilled') {
        result.set(outcome.value.id, { buffer: outcome.value.buffer, ext: outcome.value.ext });
      } else {
        this.logger.warn(`Failed to batch-load document image: ${String(outcome.reason)}`);
      }
    }
    return result;
  }

  // ============================================================================
  // UL-QP-18-07: 시험용 소프트웨어 관리대장 (DOCX — 10열 단일 테이블)
  // ============================================================================

  private async exportSoftwareRegistry(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-07'];
    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(eq(testSoftware.site, filter.site));
    }

    // 시험분야 필터 (varchar.$type<TestField> — raw string 비교)
    if (params.testField) {
      conditions.push(sql`${testSoftware.testField} = ${params.testField}`);
    }

    // 가용 여부 필터 (varchar.$type<SoftwareAvailability> — raw string 비교)
    if (params.availability) {
      conditions.push(sql`${testSoftware.availability} = ${params.availability}`);
    }

    // 제작사 필터
    if (params.manufacturer) {
      conditions.push(eq(testSoftware.manufacturer, params.manufacturer));
    }

    // 검색어 필터 (관리번호, SW명, 제작사 ILIKE)
    if (params.search) {
      const term = `%${params.search}%`;
      conditions.push(
        sql`(${testSoftware.managementNumber} ILIKE ${term} OR ${testSoftware.name} ILIKE ${term} OR ${testSoftware.manufacturer} ILIKE ${term})`
      );
    }

    // 담당자(정/부) JOIN — alias로 분리
    const primaryManager = alias(users, 'primaryManager');
    const secondaryManager = alias(users, 'secondaryManager');

    const rows = await this.db
      .select({
        managementNumber: testSoftware.managementNumber,
        name: testSoftware.name,
        softwareVersion: testSoftware.softwareVersion,
        testField: testSoftware.testField,
        primaryManagerName: primaryManager.name,
        secondaryManagerName: secondaryManager.name,
        installedAt: testSoftware.installedAt,
        manufacturer: testSoftware.manufacturer,
        location: testSoftware.location,
        availability: testSoftware.availability,
        requiresValidation: testSoftware.requiresValidation,
      })
      .from(testSoftware)
      .leftJoin(primaryManager, eq(testSoftware.primaryManagerId, primaryManager.id))
      .leftJoin(secondaryManager, eq(testSoftware.secondaryManagerId, secondaryManager.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(testSoftware.managementNumber))
      .limit(EXPORT_QUERY_LIMITS.FULL_EXPORT);

    // DOCX 템플릿 로드 — T0: 10열 테이블 (R0=헤더, R1~R21=빈 데이터행)
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-07');
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-07');

    // T0 R0 = 헤더행 (보존), R1 = 템플�� 데이터행 (복제 기준)
    // 10열: 관리번호, SW명, 버전, 시험분야, 담당자(정.부), 설치일자, 제작사, 위치, 가용여부, 유효성확인대상
    const dataRows = rows.map((row) => {
      // 담당자(정,부) — 양식은 1열에 "정,부" 합쳐 표기
      const managerDisplay = [row.primaryManagerName, row.secondaryManagerName]
        .filter(Boolean)
        .join(',');
      // requiresValidation=true → 'X'(대상), false → 'O'(미대상)
      const validationLabel = row.requiresValidation ? 'X' : 'O';

      return [
        row.managementNumber,
        row.name,
        row.softwareVersion ?? '-',
        row.testField,
        managerDisplay || '-',
        this.formatDate(row.installedAt),
        row.manufacturer ?? '-',
        row.location ?? '-',
        SOFTWARE_AVAILABILITY_LABELS[row.availability as SoftwareAvailability] ?? row.availability,
        validationLabel,
      ];
    });

    // R1을 템플릿 행으로 복제, R2~R21(빈 행 20개)을 제거
    doc.setDataRows(0, 1, dataRows, 20);

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-09: 시험 소프트웨어의 유효성확인
  // ============================================================================

  private async exportSoftwareValidation(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-09'];
    const validationId = params.validationId;
    if (!validationId) {
      throw new BadRequestException({
        code: 'MISSING_VALIDATION_ID',
        message: 'validationId query parameter is required for software validation export.',
      });
    }

    // 유효성 확인 기록 + 대상 소프트웨어 정보 조회
    const [record] = await this.db
      .select({
        id: softwareValidations.id,
        validationType: softwareValidations.validationType,
        status: softwareValidations.status,
        softwareVersion: softwareValidations.softwareVersion,
        testDate: softwareValidations.testDate,
        infoDate: softwareValidations.infoDate,
        softwareAuthor: softwareValidations.softwareAuthor,
        // 방법 1: 공급자 시연
        vendorName: softwareValidations.vendorName,
        vendorSummary: softwareValidations.vendorSummary,
        receivedBy: softwareValidations.receivedBy,
        receivedDate: softwareValidations.receivedDate,
        attachmentNote: softwareValidations.attachmentNote,
        // 방법 2: 자체 시험
        referenceDocuments: softwareValidations.referenceDocuments,
        operatingUnitDescription: softwareValidations.operatingUnitDescription,
        softwareComponents: softwareValidations.softwareComponents,
        hardwareComponents: softwareValidations.hardwareComponents,
        acquisitionFunctions: softwareValidations.acquisitionFunctions,
        processingFunctions: softwareValidations.processingFunctions,
        controlFunctions: softwareValidations.controlFunctions,
        performedBy: softwareValidations.performedBy,
        // 승인
        submittedBy: softwareValidations.submittedBy,
        technicalApproverId: softwareValidations.technicalApproverId,
        qualityApproverId: softwareValidations.qualityApproverId,
        // 소프트웨어 정보
        softwareName: testSoftware.name,
        softwareSite: testSoftware.site,
      })
      .from(softwareValidations)
      .innerJoin(testSoftware, eq(softwareValidations.testSoftwareId, testSoftware.id))
      .where(eq(softwareValidations.id, validationId))
      .limit(1);

    if (!record) {
      throw new NotFoundException({
        code: 'VALIDATION_NOT_FOUND',
        message: `Software validation ${validationId} not found.`,
      });
    }

    // Software validation은 site 단위 리소스(testSoftware에 teamId 없음).
    // Team 스코프로는 경계를 결정할 방법이 없으므로 명시적 403.
    if (filter.teamId) {
      throw new ForbiddenException({
        code: 'SCOPE_RESOURCE_MISMATCH',
        message:
          '팀 스코프 사용자는 소프트웨어 유효성 확인 리포트를 조회할 수 없습니다 (site 단위 리소스).',
      });
    }
    if (filter.site && record.softwareSite !== filter.site) {
      throw new NotFoundException({
        code: 'VALIDATION_NOT_FOUND',
        message: 'Validation not accessible from your site.',
      });
    }

    // 관련 사용자 정보 일괄 조회 (receivedBy, performedBy, technicalApprover, qualityApprover)
    const resolveUser = async (
      userId: string | null
    ): Promise<{ name: string; signaturePath: string | null } | null> => {
      if (!userId) return null;
      const [u] = await this.db
        .select({ name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return u ?? null;
    };

    const [receiver, performer, techApprover] = await Promise.all([
      resolveUser(record.receivedBy),
      resolveUser(record.performedBy),
      resolveUser(record.technicalApproverId),
    ]);

    // docx 템플릿 로드
    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-09');
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-09');

    // ── DOCX 구조 (9개 테이블) ──
    // T0~T2: 방법1 (공급자 시연)
    //   T0: 기본정보 (3행2열) — R0: Vendor, R1: SW Name, R2: Version/Date
    //   T1: 검증내용 (5행2열) — R0: infoDate+Summary, R1~R4: 상세
    //   T2: 수령정보 (3행2열) — R0: Receiver, R1: Date, R2: Attachments
    // T3~T8: 방법2 (자체 시험)
    //   T3: 기본정보 (7행2열) — R0: Name, R1: Author, R2: Version, R3: References, R4: Operating, R5: SW, R6: HW
    //   T4: 획득기능 (3행2열) — R0: Name, R1: Means, R2: Criteria
    //   T5: 프로세싱기능 (3행2열) — R0: Name, R1: Means, R2: Criteria
    //   T6: 제어기능 (4행4열) — R0: Header, R1~R3: Data
    //   T7: 수락기준 (1행2열) — R0: Criteria
    //   T8: 승인란 (3행2열) — R0: Date, R1: Performer, R2: Authorizer

    if (record.validationType === 'vendor') {
      // ── 방법 1: 공급자 시연 (T0~T2) ──
      // T0: 기본 정보
      doc.setCellValue(0, 0, 1, record.vendorName ?? '-');
      doc.setCellValue(0, 1, 1, `${record.softwareName} ${record.softwareVersion ?? ''}`);
      doc.setCellValue(
        0,
        2,
        1,
        `${record.softwareVersion ?? '-'} / ${this.formatDate(record.infoDate)}`
      );

      // T1: 검증 내용 — R0 col1: infoDate, R0 col1도 Summary와 같은 행
      doc.setCellValue(1, 0, 0, this.formatDate(record.infoDate));
      doc.setCellValue(1, 0, 1, record.vendorSummary ?? '-');

      // T2: 수령 정보
      doc.setCellValue(2, 0, 1, receiver?.name ?? '-');
      doc.setCellValue(2, 1, 1, this.formatDate(record.receivedDate));
      doc.setCellValue(2, 2, 1, record.attachmentNote ?? '-');
    } else {
      // ── 방법 2: UL 자체 유효성확인 시험 (T3~T8) ──
      // T3: 기본 정보 (7행)
      doc.setCellValue(3, 0, 1, `${record.softwareName} ${record.softwareVersion ?? ''}`);
      doc.setCellValue(3, 1, 1, record.softwareAuthor ?? '-');
      doc.setCellValue(3, 2, 1, record.softwareVersion ?? '-');
      doc.setCellValue(3, 3, 1, record.referenceDocuments ?? '-');
      doc.setCellValue(3, 4, 1, record.operatingUnitDescription ?? '-');
      doc.setCellValue(3, 5, 1, record.softwareComponents ?? '-');
      doc.setCellValue(3, 6, 1, record.hardwareComponents ?? '-');

      // T4: 획득 기능 (Acquisition) — R0=헤더 유지, 각 행 cell[1]에 값
      const acqFunctions = this.parseJsonbFunctionArray(record.acquisitionFunctions);
      if (acqFunctions.length > 0) {
        const acq = acqFunctions[0];
        doc.setCellValue(4, 0, 1, acq.name);
        doc.setCellValue(4, 1, 1, acq.criteria);
        doc.setCellValue(4, 2, 1, acq.result);
      }

      // T5: 프로세싱 기능 (Processing)
      const procFunctions = this.parseJsonbFunctionArray(record.processingFunctions);
      if (procFunctions.length > 0) {
        const proc = procFunctions[0];
        doc.setCellValue(5, 0, 1, proc.name);
        doc.setCellValue(5, 1, 1, proc.criteria);
        doc.setCellValue(5, 2, 1, proc.result);
      }

      // T6: 제어 기능 (Control) — 4행4열, R0=헤더, R1~R3=데이터
      const ctrlFunctions = this.parseJsonbFunctionArray(record.controlFunctions);
      if (ctrlFunctions.length > 0) {
        const ctrl = ctrlFunctions[0];
        doc.setCellValue(6, 1, 0, ctrl.name);
        doc.setCellValue(6, 1, 1, ctrl.criteria);
        doc.setCellValue(6, 1, 2, ctrl.result);
      }

      // T7: 수락 기준
      // (보통 비어있거나 템플릿 유지)

      // T8: 승인란
      doc.setCellValue(8, 0, 1, this.formatDate(record.testDate));
      doc.setCellValue(8, 1, 1, performer?.name ?? '-');
      await this.insertDocxSignature(
        doc,
        8,
        2,
        1,
        techApprover?.signaturePath ?? null,
        techApprover?.name ?? '-'
      );
    }

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${record.validationType}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-08: Cable and Path Loss 관리대장
  // ============================================================================

  /**
   * 케이블 목록(시트1) + 개별 케이블 Path Loss 데이터(시트2~N) Excel 내보내기
   *
   * 시트 구조:
   *  - "RF Conducted": 케이블 목록 (No, 관리번호, Length, TYPE, 주파수범위, S/N, 위치)
   *  - 관리번호별 시트: Freq(MHz), Data(dB) 테이블
   */
  private async exportCablePathLoss(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-08'];
    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(sql`${cables.site} = ${filter.site}`);
    }
    if (params.connectorType) {
      conditions.push(sql`${cables.connectorType} = ${params.connectorType}`);
    }
    if (params.status) {
      conditions.push(sql`${cables.status} = ${params.status}`);
    } else {
      // 기본: active 케이블만
      conditions.push(eq(cables.status, 'active'));
    }

    const cableRows = await this.db
      .select()
      .from(cables)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(cables.managementNumber)
      .limit(EXPORT_QUERY_LIMITS.SECTION_EXPORT);

    // 템플릿 로드 — 실패 시 명시적 에러
    const templateBuffer = await this.formTemplateService.getTemplateBuffer('UL-QP-18-08');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(toExcelLoadableBuffer(templateBuffer));

    // ── 시트 1: RF Conducted (목록) ──
    const listSheet = workbook.getWorksheet('RF Conducted');
    if (!listSheet) {
      throw new InternalServerErrorException(
        `[UL-QP-18-08] 워크시트 'RF Conducted' 없음. 양식의 시트명이 변경되었을 수 있습니다.`
      );
    }

    const LIST_HEADERS = [
      'No',
      '관리번호',
      'Length (M)',
      'TYPE',
      '사용 주파수 범위',
      'S/N',
      '위치',
    ];
    const headerRow = listSheet.getRow(1);
    LIST_HEADERS.forEach((h, i) => {
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

    cableRows.forEach((cable, idx) => {
      const row = listSheet.getRow(idx + 2);
      const freqRange =
        cable.frequencyRangeMin != null && cable.frequencyRangeMax != null
          ? `${cable.frequencyRangeMin} MHz to ${cable.frequencyRangeMax} MHz`
          : cable.frequencyRangeMin != null
            ? `${cable.frequencyRangeMin} MHz+`
            : cable.frequencyRangeMax != null
              ? `to ${cable.frequencyRangeMax} MHz`
              : 'N/A';

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

    // 열 너비 설정
    listSheet.columns = [
      { width: 5 },
      { width: 14 },
      { width: 12 },
      { width: 8 },
      { width: 24 },
      { width: 14 },
      { width: 18 },
    ];

    // ── 시트 2~N: 개별 케이블 Path Loss (Batch 쿼리 — N+1 방지) ──
    const cableIds = cableRows.map((c) => c.id);

    if (cableIds.length > 0) {
      // 1) 각 케이블의 최신 측정을 DISTINCT ON으로 한 번에 조회
      const latestMeasurements = await this.db.execute<{
        id: string;
        cable_id: string;
        measurement_date: Date;
      }>(sql`
        SELECT DISTINCT ON (cable_id) id, cable_id, measurement_date
        FROM cable_loss_measurements
        WHERE cable_id IN (${sql.join(
          cableIds.map((id) => sql`${id}`),
          sql`, `
        )})
        ORDER BY cable_id, measurement_date DESC
      `);

      const measurementByCableId = new Map<string, { id: string; measurementDate: Date }>();
      for (const row of latestMeasurements.rows) {
        measurementByCableId.set(row.cable_id, {
          id: row.id,
          measurementDate: row.measurement_date,
        });
      }

      // 2) 최신 측정 ID들의 데이터 포인트를 IN 절로 한 번에 조회
      const measurementIds = [...measurementByCableId.values()].map((m) => m.id);

      const allDataPoints =
        measurementIds.length > 0
          ? await this.db
              .select()
              .from(cableLossDataPoints)
              .where(inArray(cableLossDataPoints.measurementId, measurementIds))
              .orderBy(
                asc(cableLossDataPoints.measurementId),
                asc(cableLossDataPoints.frequencyMhz)
              )
          : [];

      // 3) measurementId → dataPoints[] 그룹핑
      const dpByMeasurementId = new Map<string, typeof allDataPoints>();
      for (const dp of allDataPoints) {
        const arr = dpByMeasurementId.get(dp.measurementId) ?? [];
        arr.push(dp);
        dpByMeasurementId.set(dp.measurementId, arr);
      }

      // 4) 시트 생성
      for (const cable of cableRows) {
        const measurement = measurementByCableId.get(cable.id);
        if (!measurement) continue;

        const dataPoints = dpByMeasurementId.get(measurement.id) ?? [];
        if (dataPoints.length === 0) continue;

        // 시트명: 관리번호 (Excel 시트명 31자 제한, 특수문자 제거)
        const sheetName = cable.managementNumber.replace(/[:\\/?*[\]]/g, '_').slice(0, 31);
        const dataSheet = workbook.addWorksheet(sheetName);

        // 헤더 행: 케이블 정보
        const infoRow = dataSheet.getRow(1);
        infoRow.getCell(1).value = `Cable: ${cable.managementNumber}`;
        infoRow.getCell(1).font = { bold: true };
        const dateRow = dataSheet.getRow(2);
        dateRow.getCell(1).value = `Measured: ${this.formatDate(measurement.measurementDate)}`;

        // 데이터 헤더
        const dpHeaderRow = dataSheet.getRow(4);
        dpHeaderRow.getCell(1).value = 'Freq(MHz)';
        dpHeaderRow.getCell(2).value = 'Data(dB)';
        dpHeaderRow.getCell(1).font = { bold: true };
        dpHeaderRow.getCell(2).font = { bold: true };
        [1, 2].forEach((c) => {
          dpHeaderRow.getCell(c).border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
        dpHeaderRow.commit();

        // 데이터 포인트
        dataPoints.forEach((dp, dpIdx) => {
          const dpRow = dataSheet.getRow(5 + dpIdx);
          dpRow.getCell(1).value = dp.frequencyMhz;
          dpRow.getCell(2).value = Number(dp.lossDb);
          [1, 2].forEach((c) => {
            dpRow.getCell(c).border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' },
            };
            dpRow.getCell(c).numFmt = c === 1 ? '#,##0' : '0.000';
          });
          dpRow.commit();
        });

        dataSheet.columns = [{ width: 14 }, { width: 14 }];
      }
    }

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { buffer, mimeType: XLSX_MIME, filename: this.makeFilename(entry) };
  }

  /**
   * JSONB 기능 검증 배열 안전 파싱
   * DB의 acquisitionFunctions/processingFunctions/controlFunctions 컬럼은
   * JSONB 타입이며 [{name, criteria, result}] 형태를 기대합니다.
   */
  private parseJsonbFunctionArray(
    raw: unknown
  ): { name: string; criteria: string; result: string }[] {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (item: unknown): item is { name: string; criteria: string; result: string } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).name === 'string'
        )
        .map((item) => ({
          name: item.name,
          criteria: item.criteria ?? '-',
          result: item.result ?? '-',
        }));
    } catch {
      return [];
    }
  }

  // ============================================================================
  // UL-QP-18-06 (rental import): 렌탈 반입 → 장비 반·출입 확인서 매핑
  // 렌탈 장비는 QP-18-10(공용) 이 아니라 QP-18-06(반출입) 양식을 사용한다.
  // 반출 = 업체에서 장비 출고(수령), 반입 = 업체로 장비 반납(반환)
  // ============================================================================

  private async exportRentalImportAsCheckoutForm(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-06'];
    const importId = params.importId;
    if (!importId) {
      throw new BadRequestException({
        code: 'MISSING_IMPORT_ID',
        message: 'importId query parameter is required for rental import export.',
      });
    }

    const [imp] = await this.db
      .select()
      .from(equipmentImports)
      .where(eq(equipmentImports.id, importId))
      .limit(1);

    if (!imp) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found.',
      });
    }

    if (imp.sourceType !== 'rental') {
      throw new BadRequestException({
        code: 'INVALID_SOURCE_TYPE',
        message:
          'QP-18-06 form is only for rental imports. Use QP-18-10 for internal shared equipment.',
      });
    }

    // 스코프 경계 강제
    if (filter.site && imp.site !== filter.site) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found or not accessible from your site.',
      });
    }
    if (filter.teamId && imp.teamId !== filter.teamId) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found or not accessible from your team.',
      });
    }

    // 신청자 조회
    const [requester] = await this.db
      .select({ name: users.name, signaturePath: users.signatureImagePath })
      .from(users)
      .where(eq(users.id, imp.requesterId))
      .limit(1);

    // 승인자 조회
    const [approver] = imp.approverId
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, imp.approverId))
          .limit(1)
      : [null];

    // 반납 checkout 에서 반납 완료 날짜 조회 (있으면)
    let returnDate: Date | null = null;
    if (imp.returnCheckoutId) {
      const [returnCheckout] = await this.db
        .select({ actualReturnDate: checkouts.actualReturnDate })
        .from(checkouts)
        .where(eq(checkouts.id, imp.returnCheckoutId))
        .limit(1);
      returnDate = returnCheckout?.actualReturnDate ?? null;
    }

    // 상태확인 jsonb 파싱
    const receivingCondition = (imp.receivingCondition ?? {}) as {
      appearance?: string;
      operation?: string;
    };
    const returnedCondition = (imp.returnedCondition ?? {}) as {
      appearance?: string;
      abnormality?: string;
    };

    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-06');
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-06');

    // Row 2: 반출지(=업체명) / 전화번호(=업체연락처)
    doc.setCellValue(0, 2, 1, imp.vendorName ?? '-');
    doc.setCellValue(0, 2, 3, imp.vendorContact ?? '-');
    // Row 3: 반출주소 (렌탈 반입에는 별도 주소 필드 없음)
    doc.setCellValue(0, 3, 1, '-');
    // Row 4: 반출사유
    doc.setCellValue(0, 4, 1, imp.reason ?? '-');

    // Row 5: 반출 확인 문장 + 날짜 (=수령일)
    const checkoutDateStr = this.formatQp1806Date(imp.receivedAt);
    doc.setCellValue(
      0,
      5,
      0,
      `아래 목록과 같이 측정장비를 반출하였음을 확인합니다.    ${checkoutDateStr}    반출자 : ${requester?.name ?? '-'}`
    );

    // Row 9~22: 장비 목록 14행 (렌탈 반입은 단일 장비 → 1번 행만)
    // 상태확인: 모든 항목이 정상이면 "양호", 하나라도 이상이면 "이상 있음"
    const condBefore =
      receivingCondition.appearance === 'normal' && receivingCondition.operation === 'normal'
        ? '양호'
        : receivingCondition.appearance
          ? '이상 있음'
          : '-';
    const condAfter =
      returnedCondition.appearance === 'normal' && returnedCondition.abnormality === 'none'
        ? '양호'
        : returnedCondition.appearance
          ? '이상 있음'
          : '-';
    const managementLabel = imp.externalIdentifier ?? imp.serialNumber ?? '-';

    for (let i = 0; i < 14; i++) {
      const rowIdx = 9 + i;
      if (i === 0) {
        doc.setCellValue(0, rowIdx, 1, imp.equipmentName ?? '-');
        doc.setCellValue(0, rowIdx, 2, imp.modelName ?? '-');
        doc.setCellValue(0, rowIdx, 3, imp.quantityOut != null ? String(imp.quantityOut) : '-');
        doc.setCellValue(0, rowIdx, 4, managementLabel);
        doc.setCellValue(0, rowIdx, 5, condBefore);
        doc.setCellValue(0, rowIdx, 6, condAfter);
      } else {
        doc.setCellValue(0, rowIdx, 1, '-');
        doc.setCellValue(0, rowIdx, 2, '-');
        doc.setCellValue(0, rowIdx, 3, '-');
        doc.setCellValue(0, rowIdx, 4, '-');
        doc.setCellValue(0, rowIdx, 5, '-');
        doc.setCellValue(0, rowIdx, 6, '-');
      }
    }

    // Row 23: 특기사항
    doc.setCellValue(0, 23, 1, imp.returnedAbnormalDetails ?? '-');

    // Row 24: 반입 확인 문장 + 날짜 (=반납 완료일)
    const returnDateStr = this.formatQp1806Date(returnDate);
    doc.setCellValue(
      0,
      24,
      0,
      `상기 목록과 같이 측정장비를 이상없이 반입하였음을 확인합니다.    ${returnDateStr}    반입자 : ${requester?.name ?? '-'}`
    );

    // Row 1: 작성/승인 결재란 (반출 시점)
    await this.insertDocxSignature(doc, 0, 1, 1, requester?.signaturePath ?? null, '(서명)');
    await this.insertDocxSignature(doc, 0, 1, 2, approver?.signaturePath ?? null, '(서명)');

    // Row 25: 작성/승인 결재란 (반입 시점)
    await this.insertDocxSignature(doc, 0, 25, 1, requester?.signaturePath ?? null, '(서명)');
    await this.insertDocxSignature(doc, 0, 25, 2, approver?.signaturePath ?? null, '(서명)');

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-10: 공용 장비 사용/반납 확인서 (DOCX — 단일 테이블 25행, Part1+Part2)
  // ============================================================================

  private async exportEquipmentImport(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-10'];
    const importId = params.importId;
    if (!importId) {
      throw new BadRequestException({
        code: 'MISSING_IMPORT_ID',
        message: 'importId query parameter is required for equipment import export.',
      });
    }

    const [imp] = await this.db
      .select()
      .from(equipmentImports)
      .where(eq(equipmentImports.id, importId))
      .limit(1);

    if (!imp) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found.',
      });
    }

    // 렌탈 반입은 QP-18-06 사용 — QP-18-10은 공용장비(internal_shared) 전용
    if (imp.sourceType === 'rental') {
      throw new BadRequestException({
        code: 'INVALID_SOURCE_TYPE',
        message:
          'Rental imports must use QP-18-06 (장비반출입확인서). QP-18-10 is for internal shared equipment only.',
      });
    }

    // 스코프 경계 강제
    if (filter.site && imp.site !== filter.site) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found or not accessible from your site.',
      });
    }
    if (filter.teamId && imp.teamId !== filter.teamId) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found or not accessible from your team.',
      });
    }

    // 신청자 (사용자=신청자=반납자 동일 가정 — 스키마에 별도 반납자 없음)
    const [requester] = await this.db
      .select({ name: users.name, signaturePath: users.signatureImagePath })
      .from(users)
      .where(eq(users.id, imp.requesterId))
      .limit(1);

    // 승인자 (nullable)
    const [approver] = imp.approverId
      ? await this.db
          .select({ name: users.name, signaturePath: users.signatureImagePath })
          .from(users)
          .where(eq(users.id, imp.approverId))
          .limit(1)
      : [null];

    // 사용 부서 (teams JOIN)
    const [team] = await this.db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, imp.teamId))
      .limit(1);

    // 사용 출처 식별: internal_shared 전용 (rental은 위 가드에서 차단됨)
    const sourceLabel = imp.ownerDepartment ?? '-';

    // 관리번호: rental은 externalIdentifier, internal_shared는 serialNumber 우선
    const managementLabel = imp.externalIdentifier ?? imp.serialNumber ?? '-';

    // 반납 상태 jsonb 파싱
    const returnedCondition = (imp.returnedCondition ?? {}) as {
      appearance?: string;
      abnormality?: string;
      notes?: string;
    };
    const receivingCondition = (imp.receivingCondition ?? {}) as {
      appearance?: string;
      operation?: string;
      accessories?: string;
      notes?: string;
    };

    // jsonb enum → 한국어
    const ko = (v: string | undefined): string =>
      ({ normal: '정상', abnormal: '이상', none: '없음', complete: '완비', incomplete: '불완전' })[
        v ?? ''
      ] ??
      (v || '-');

    const templateBuf = await this.formTemplateService.getTemplateBuffer('UL-QP-18-10');
    const doc = new DocxTemplate(templateBuf, 'UL-QP-18-10');

    // ============== Part 1: 사용 확인서 (R0~R13) ==============

    // R1: 결재란 (작성=requester, 승인=approver) — Part1
    await this.insertDocxSignature(doc, 0, 1, 1, requester?.signaturePath ?? null, '(서명)');
    await this.insertDocxSignature(doc, 0, 1, 2, approver?.signaturePath ?? null, '(서명)');

    // R2: 사용부서 / 사용자
    doc.setCellValue(0, 2, 1, team?.name ?? sourceLabel);
    doc.setCellValue(0, 2, 3, requester?.name ?? '-');

    // R3: 사용장소 / 사용기간
    doc.setCellValue(0, 3, 1, imp.usageLocation ?? '-');
    const usageStart = this.formatQp1806Date(imp.usagePeriodStart);
    const usageEnd = this.formatQp1806Date(imp.usagePeriodEnd);
    doc.setCellValue(0, 3, 3, `${usageStart} ~ ${usageEnd}`);

    // R4: 사용목적
    doc.setCellValue(0, 4, 1, imp.reason ?? '-');

    // R5: 사용 확인 문장 + 날짜
    const checkoutDateStr = this.formatQp1806Date(imp.usagePeriodStart);
    doc.setCellValue(
      0,
      5,
      0,
      `아래 목록과 같이 공용장비 사용(반출)을 확인합니다.    ${checkoutDateStr}    사용자 : ${requester?.name ?? '-'}`
    );

    // R9~R13: Part1 장비 데이터 행 5개 (단일 import → 1번 행에만 데이터, 2~5번은 '-')
    for (let i = 0; i < 5; i++) {
      const rowIdx = 9 + i;
      if (i === 0) {
        doc.setCellValue(0, rowIdx, 1, imp.equipmentName ?? '-');
        doc.setCellValue(0, rowIdx, 2, imp.modelName ?? '-');
        doc.setCellValue(0, rowIdx, 3, imp.quantityOut != null ? String(imp.quantityOut) : '-');
        doc.setCellValue(0, rowIdx, 4, managementLabel);
        doc.setCellValue(0, rowIdx, 5, ko(receivingCondition.appearance));
        doc.setCellValue(0, rowIdx, 6, '-');
      } else {
        doc.setCellValue(0, rowIdx, 1, '-');
        doc.setCellValue(0, rowIdx, 2, '-');
        doc.setCellValue(0, rowIdx, 3, '-');
        doc.setCellValue(0, rowIdx, 4, '-');
        doc.setCellValue(0, rowIdx, 5, '-');
        doc.setCellValue(0, rowIdx, 6, '-');
      }
    }

    // ============== Part 2: 반납 확인서 (R14~R24) ==============

    // R15: 결재란 — Part2
    await this.insertDocxSignature(doc, 0, 15, 1, requester?.signaturePath ?? null, '(서명)');
    await this.insertDocxSignature(doc, 0, 15, 2, approver?.signaturePath ?? null, '(서명)');

    // R18~R22: Part2 반납 데이터 행 5개
    for (let i = 0; i < 5; i++) {
      const rowIdx = 18 + i;
      if (i === 0) {
        doc.setCellValue(0, rowIdx, 1, imp.equipmentName ?? '-');
        doc.setCellValue(0, rowIdx, 2, imp.modelName ?? '-');
        doc.setCellValue(
          0,
          rowIdx,
          3,
          imp.quantityReturned != null ? String(imp.quantityReturned) : '-'
        );
        doc.setCellValue(0, rowIdx, 4, managementLabel);
        doc.setCellValue(0, rowIdx, 5, ko(returnedCondition.appearance));
        doc.setCellValue(0, rowIdx, 6, ko(returnedCondition.abnormality));
      } else {
        doc.setCellValue(0, rowIdx, 1, '-');
        doc.setCellValue(0, rowIdx, 2, '-');
        doc.setCellValue(0, rowIdx, 3, '-');
        doc.setCellValue(0, rowIdx, 4, '-');
        doc.setCellValue(0, rowIdx, 5, '-');
        doc.setCellValue(0, rowIdx, 6, '-');
      }
    }

    // R23: 특기사항 (이상 발생 시 상세)
    doc.setCellValue(0, 23, 1, imp.returnedAbnormalDetails ?? '-');

    // R24: 반납 확인 문장 + 날짜
    const returnDateStr = this.formatQp1806Date(imp.receivedAt);
    doc.setCellValue(
      0,
      24,
      0,
      `상기 목록과 같이 공용 장비를 이상없이 반납하였음을 확인합니다.    ${returnDateStr}    반납자 : ${requester?.name ?? '-'}`
    );

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}.docx`,
    };
  }
}
