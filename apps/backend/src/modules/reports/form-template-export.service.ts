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
import { insertDocxSignature } from './docx-xml-helper';
import { FormTemplateService } from './form-template.service';
import { equipment } from '@equipment-management/db/schema/equipment';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import { conditionChecks } from '@equipment-management/db/schema/condition-checks';
import { testSoftware } from '@equipment-management/db/schema/test-software';
import { cables, cableLossDataPoints } from '@equipment-management/db/schema/cables';
import { softwareValidations } from '@equipment-management/db/schema/software-validations';
import { users } from '@equipment-management/db/schema/users';
import { teams } from '@equipment-management/db/schema/teams';
import { eq, and, inArray, or, sql, type SQL, asc } from 'drizzle-orm';
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
  SOFTWARE_AVAILABILITY_LABELS,
  type SoftwareAvailability,
  type TestField,
  type Site,
  type CableConnectorType,
  type CableStatus,
  CableStatusValues,
} from '@equipment-management/schemas';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../common/storage/storage.interface';
import { IntermediateInspectionExportDataService } from '../intermediate-inspections/services/intermediate-inspection-export-data.service';
import { IntermediateInspectionRendererService } from '../intermediate-inspections/services/intermediate-inspection-renderer.service';
import { SelfInspectionExportDataService } from '../self-inspections/services/self-inspection-export-data.service';
import { SelfInspectionRendererService } from '../self-inspections/services/self-inspection-renderer.service';
import { EquipmentRegistryDataService } from './services/equipment-registry-data.service';
import { EquipmentRegistryRendererService } from './services/equipment-registry-renderer.service';
import { FORM_NUMBER as INTERMEDIATE_FORM_NUMBER } from '../intermediate-inspections/services/intermediate-inspection.layout';
import { FORM_NUMBER as SELF_FORM_NUMBER } from '../self-inspections/services/self-inspection.layout';
import { FORM_NUMBER as REGISTRY_FORM_NUMBER } from './layouts/equipment-registry.layout';
import { likeContains, safeIlike } from '../../common/utils/like-escape';

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
    private readonly formTemplateService: FormTemplateService,
    private readonly intermediateDataService: IntermediateInspectionExportDataService,
    private readonly intermediateRenderer: IntermediateInspectionRendererService,
    private readonly selfInspectionDataService: SelfInspectionExportDataService,
    private readonly selfInspectionRenderer: SelfInspectionRendererService,
    private readonly equipmentRegistryData: EquipmentRegistryDataService,
    private readonly equipmentRegistryRenderer: EquipmentRegistryRendererService
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
  // UL-QP-18-01: 시험설비 관리 대장 (dispatcher — 구현은 services/equipment-registry-*.ts)
  // ============================================================================

  private async exportEquipmentRegistry(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-01'];
    const data = await this.equipmentRegistryData.getData(params, filter);
    const templateBuffer = await this.formTemplateService.getTemplateBuffer(REGISTRY_FORM_NUMBER);
    const buffer = await this.equipmentRegistryRenderer.render(data, templateBuffer);
    return {
      buffer,
      mimeType: XLSX_MIME,
      filename: this.makeRegistryFilename(entry, filter, data.teamName),
    };
  }

  private makeRegistryFilename(
    entry: { formNumber: string; name: string },
    filter: EnforcedScope,
    teamName?: string
  ): string {
    const date = new Date().toISOString().split('T')[0];
    const parts: string[] = [entry.formNumber, entry.name];
    if (filter.site) parts.push(filter.site);
    if (teamName) parts.push(teamName.replace(/[\/\\:*?"<>|]/g, '-'));
    parts.push(date);
    return `${parts.join('_')}.xlsx`;
  }

  // ============================================================================
  // UL-QP-18-03: 중간점검표 (dispatcher — 구현은 intermediate-inspections/services/*)
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
    const data = await this.intermediateDataService.getData(inspectionId, filter);
    const templateBuf = await this.formTemplateService.getTemplateBuffer(INTERMEDIATE_FORM_NUMBER);
    const buffer = await this.intermediateRenderer.render(data, templateBuf);
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${data.managementNumber}_${data.equipmentName}.docx`,
    };
  }

  // ============================================================================
  // UL-QP-18-05: 자체점검표 (dispatcher — 구현은 self-inspections/services/*)
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
    const data = await this.selfInspectionDataService.getData(
      equipmentId,
      params.inspectionId,
      filter
    );
    const templateBuf = await this.formTemplateService.getTemplateBuffer(SELF_FORM_NUMBER);
    const buffer = await this.selfInspectionRenderer.render(data, templateBuf);
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${data.managementNumber}_${data.equipmentName}.docx`,
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
    await insertDocxSignature(
      doc,
      0,
      1,
      1,
      requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      1,
      2,
      approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    // Row 25: 작성/승인 결재란 (반입 시점)
    await insertDocxSignature(
      doc,
      0,
      25,
      1,
      requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      25,
      2,
      approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    const buffer = doc.toBuffer();
    return {
      buffer,
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}.docx`,
    };
  }

  // 공유 헬퍼(insertDocxSignature/renderResultSections)는
  // docx-xml-helper.ts로 이관됨. exportCheckout/exportRentalImportAsCheckoutForm/
  // exportEquipmentImport는 상단 import의 `insertDocxSignature`를 직접 사용한다.

  // ============================================================================
  // UL-QP-18-07: 시험용 소프트웨어 관리대장 (DOCX — 10열 단일 테이블)
  // ============================================================================

  private async exportSoftwareRegistry(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG['UL-QP-18-07'];

    // testSoftware는 site 단위 리소스 — teamId 스코프로 경계를 설정할 방법이 없음
    if (filter.teamId) {
      throw new ForbiddenException({
        code: 'SCOPE_RESOURCE_MISMATCH',
        message:
          '팀 스코프 사용자는 소프트웨어 관리대장 리포트를 조회할 수 없습니다 (site 단위 리소스).',
      });
    }

    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(eq(testSoftware.site, filter.site));
    }

    if (params.testField) {
      conditions.push(eq(testSoftware.testField, params.testField as TestField));
    }
    if (params.availability) {
      conditions.push(eq(testSoftware.availability, params.availability as SoftwareAvailability));
    }

    // 제작사 필터
    if (params.manufacturer) {
      conditions.push(eq(testSoftware.manufacturer, params.manufacturer));
    }

    // 검색어 필터 (관리번호, SW명, 제작사 ILIKE)
    if (params.search) {
      const pattern = likeContains(params.search);
      conditions.push(
        or(
          safeIlike(testSoftware.managementNumber, pattern),
          safeIlike(testSoftware.name, pattern),
          safeIlike(testSoftware.manufacturer, pattern)
        )!
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

    // 관련 사용자 정보 일괄 조회 — 단일 inArray 쿼리로 N+1 제거
    type ResolvedUser = { name: string; signaturePath: string | null };
    const userIdSet = [
      ...new Set(
        [
          record.receivedBy,
          record.performedBy,
          record.technicalApproverId,
          record.qualityApproverId,
        ].filter((id): id is string => id !== null)
      ),
    ];
    const userMap = new Map<string, ResolvedUser>();
    if (userIdSet.length > 0) {
      const userRows = await this.db
        .select({ id: users.id, name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(inArray(users.id, userIdSet));
      for (const u of userRows) {
        userMap.set(u.id, { name: u.name, signaturePath: u.signaturePath });
      }
    }

    const receiver = record.receivedBy ? (userMap.get(record.receivedBy) ?? null) : null;
    const performer = record.performedBy ? (userMap.get(record.performedBy) ?? null) : null;
    const techApprover = record.technicalApproverId
      ? (userMap.get(record.technicalApproverId) ?? null)
      : null;
    const qualityApprover = record.qualityApproverId
      ? (userMap.get(record.qualityApproverId) ?? null)
      : null;

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

      // T8: 승인란 — R0=Date, R1=Performer, R2=TechApprover(col 1)+QualityApprover(col 0)
      doc.setCellValue(8, 0, 1, this.formatDate(record.testDate));
      doc.setCellValue(8, 1, 1, performer?.name ?? '-');
      await insertDocxSignature(
        doc,
        8,
        2,
        0,
        qualityApprover?.signaturePath ?? null,
        qualityApprover?.name ?? '-',
        this.storage
      );
      await insertDocxSignature(
        doc,
        8,
        2,
        1,
        techApprover?.signaturePath ?? null,
        techApprover?.name ?? '-',
        this.storage
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
      conditions.push(eq(cables.site, filter.site as Site));
    }
    if (params.connectorType) {
      conditions.push(eq(cables.connectorType, params.connectorType as CableConnectorType));
    }
    if (params.status) {
      conditions.push(eq(cables.status, params.status as CableStatus));
    } else {
      // 기본: active 케이블만
      conditions.push(eq(cables.status, CableStatusValues.ACTIVE));
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

    // 신청자/승인자 병렬 조회
    const [[requester], [approver]] = await Promise.all([
      this.db
        .select({ name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(eq(users.id, imp.requesterId))
        .limit(1),
      imp.approverId
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, imp.approverId))
            .limit(1)
        : Promise.resolve([null] as [null]),
    ]);

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
    await insertDocxSignature(
      doc,
      0,
      1,
      1,
      requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      1,
      2,
      approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

    // Row 25: 작성/승인 결재란 (반입 시점)
    await insertDocxSignature(
      doc,
      0,
      25,
      1,
      requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      25,
      2,
      approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

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

    // 신청자/승인자 병렬 조회 (신청자=반납자 동일 가정 — 스키마에 별도 반납자 없음)
    const [[requester], [approver]] = await Promise.all([
      this.db
        .select({ name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(eq(users.id, imp.requesterId))
        .limit(1),
      imp.approverId
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, imp.approverId))
            .limit(1)
        : Promise.resolve([null] as [null]),
    ]);

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
    await insertDocxSignature(
      doc,
      0,
      1,
      1,
      requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      1,
      2,
      approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

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
    await insertDocxSignature(
      doc,
      0,
      15,
      1,
      requester?.signaturePath ?? null,
      '(서명)',
      this.storage
    );
    await insertDocxSignature(
      doc,
      0,
      15,
      2,
      approver?.signaturePath ?? null,
      '(서명)',
      this.storage
    );

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
