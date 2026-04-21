import { Injectable, BadRequestException, NotImplementedException, Logger } from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import {
  FORM_CATALOG,
  isFormImplemented,
  isFormDedicatedEndpoint,
} from '@equipment-management/shared-constants';
import type { EnforcedScope } from '../../common/scope/scope-enforcer';
import { IntermediateInspectionExportDataService } from '../intermediate-inspections/services/intermediate-inspection-export-data.service';
import { IntermediateInspectionRendererService } from '../intermediate-inspections/services/intermediate-inspection-renderer.service';
import { SelfInspectionExportDataService } from '../self-inspections/services/self-inspection-export-data.service';
import { SelfInspectionRendererService } from '../self-inspections/services/self-inspection-renderer.service';
import { EquipmentRegistryDataService } from './services/equipment-registry-data.service';
import { EquipmentRegistryRendererService } from './services/equipment-registry-renderer.service';
import { FORM_NUMBER as INTERMEDIATE_FORM_NUMBER } from '../intermediate-inspections/services/intermediate-inspection.layout';
import { FORM_NUMBER as SELF_FORM_NUMBER } from '../self-inspections/services/self-inspection.layout';
import { FORM_NUMBER as REGISTRY_FORM_NUMBER } from './layouts/equipment-registry.layout';
import { SoftwareValidationExportDataService } from '../software-validations/services/software-validation-export-data.service';
import { SoftwareValidationRendererService } from '../software-validations/services/software-validation-renderer.service';
import { TestSoftwareRegistryExportDataService } from '../test-software/services/test-software-registry-export-data.service';
import { TestSoftwareRegistryRendererService } from '../test-software/services/test-software-registry-renderer.service';
import { FORM_NUMBER as SW_REGISTRY_FORM_NUMBER } from '../test-software/services/test-software-registry.layout';
import { CheckoutFormExportDataService } from '../checkouts/services/checkout-form-export-data.service';
import { RentalImportCheckoutFormExportDataService } from '../checkouts/services/rental-import-checkout-form-export-data.service';
import { CheckoutFormRendererService } from '../checkouts/services/checkout-form-renderer.service';
import { FORM_NUMBER as CHECKOUT_FORM_NUMBER } from '../checkouts/services/checkout-form.layout';
import { CablePathLossExportDataService } from '../cables/services/cable-path-loss-export-data.service';
import { CablePathLossRendererService } from '../cables/services/cable-path-loss-renderer.service';
import { FORM_NUMBER as CABLE_FORM_NUMBER } from '../cables/services/cable-path-loss.layout';
import { EquipmentImportFormExportDataService } from '../equipment-imports/services/equipment-import-form-export-data.service';
import { EquipmentImportFormRendererService } from '../equipment-imports/services/equipment-import-form-renderer.service';
import { FORM_NUMBER as EQUIPMENT_IMPORT_FORM_NUMBER } from '../equipment-imports/services/equipment-import-form.layout';

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
    private readonly formTemplateService: FormTemplateService,
    private readonly intermediateDataService: IntermediateInspectionExportDataService,
    private readonly intermediateRenderer: IntermediateInspectionRendererService,
    private readonly selfInspectionDataService: SelfInspectionExportDataService,
    private readonly selfInspectionRenderer: SelfInspectionRendererService,
    private readonly equipmentRegistryData: EquipmentRegistryDataService,
    private readonly equipmentRegistryRenderer: EquipmentRegistryRendererService,
    private readonly swValidationData: SoftwareValidationExportDataService,
    private readonly swValidationRenderer: SoftwareValidationRendererService,
    private readonly swRegistryData: TestSoftwareRegistryExportDataService,
    private readonly swRegistryRenderer: TestSoftwareRegistryRendererService,
    private readonly checkoutFormData: CheckoutFormExportDataService,
    private readonly rentalImportFormData: RentalImportCheckoutFormExportDataService,
    private readonly checkoutFormRenderer: CheckoutFormRendererService,
    private readonly cablePathLossData: CablePathLossExportDataService,
    private readonly cablePathLossRenderer: CablePathLossRendererService,
    private readonly equipmentImportFormData: EquipmentImportFormExportDataService,
    private readonly equipmentImportFormRenderer: EquipmentImportFormRendererService
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
  // UL-QP-18-06: 장비 반·출입 확인서 (dispatcher — 구현은 checkouts/services/*)
  // ============================================================================

  private async exportCheckout(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG[CHECKOUT_FORM_NUMBER];
    const data = await this.checkoutFormData.getData(params, filter);
    const templateBuf = await this.formTemplateService.getTemplateBuffer(CHECKOUT_FORM_NUMBER);
    const buffer = await this.checkoutFormRenderer.render(data, templateBuf);
    return { buffer, mimeType: DOCX_MIME, filename: `${entry.formNumber}_${entry.name}.docx` };
  }

  // ============================================================================
  // UL-QP-18-07: 시험용 소프트웨어 관리대장 (dispatcher — 구현은 test-software/services/*)
  // ============================================================================

  private async exportSoftwareRegistry(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG[SW_REGISTRY_FORM_NUMBER];
    const data = await this.swRegistryData.getData(params, filter);
    const templateBuf = await this.formTemplateService.getTemplateBuffer(SW_REGISTRY_FORM_NUMBER);
    const buffer = this.swRegistryRenderer.render(data, templateBuf);
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
    const data = await this.swValidationData.fetchExportData(params.validationId ?? '', filter);
    return this.swValidationRenderer.render(data);
  }

  // ============================================================================
  // UL-QP-18-08: Cable and Path Loss 관리대장 (dispatcher — 구현은 cables/services/*)
  // ============================================================================

  private async exportCablePathLoss(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG[CABLE_FORM_NUMBER];
    const data = await this.cablePathLossData.getData(params, filter);
    const templateBuffer = await this.formTemplateService.getTemplateBuffer(CABLE_FORM_NUMBER);
    const buffer = await this.cablePathLossRenderer.render(data, templateBuffer);
    return {
      buffer,
      mimeType: XLSX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${new Date().toISOString().split('T')[0]}.xlsx`,
    };
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
    const entry = FORM_CATALOG[CHECKOUT_FORM_NUMBER];
    const data = await this.rentalImportFormData.getData(params, filter);
    const templateBuf = await this.formTemplateService.getTemplateBuffer(CHECKOUT_FORM_NUMBER);
    const buffer = await this.checkoutFormRenderer.render(data, templateBuf);
    return { buffer, mimeType: DOCX_MIME, filename: `${entry.formNumber}_${entry.name}.docx` };
  }

  // ============================================================================
  // UL-QP-18-10: 공용 장비 사용/반납 확인서 (DOCX — 단일 테이블 25행, Part1+Part2)
  // ============================================================================

  private async exportEquipmentImport(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<ExportResult> {
    const entry = FORM_CATALOG[EQUIPMENT_IMPORT_FORM_NUMBER];
    const data = await this.equipmentImportFormData.getData(params, filter);
    const templateBuf = await this.formTemplateService.getTemplateBuffer(
      EQUIPMENT_IMPORT_FORM_NUMBER
    );
    const buffer = await this.equipmentImportFormRenderer.render(data, templateBuf);
    return { buffer, mimeType: DOCX_MIME, filename: `${entry.formNumber}_${entry.name}.docx` };
  }
}
