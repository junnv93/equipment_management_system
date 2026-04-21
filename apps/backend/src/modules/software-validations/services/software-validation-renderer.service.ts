import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  FORM_CATALOG,
} from '@equipment-management/shared-constants';
import { DocxTemplate } from '../../../common/docx/docx-template.util';
import { insertDocxSignature } from '../../../common/docx/docx-xml-helpers';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import { FormTemplateService } from '../../reports/form-template.service';
import {
  FORM_NUMBER,
  TABLE_INDEX,
  VENDOR_BASIC_CELLS,
  VENDOR_CONTENT_CELLS,
  VENDOR_RECEIPT_CELLS,
  SELF_BASIC_CELLS,
  FUNCTION_ITEM_DATA_COL,
  FUNCTION_ITEM_ROWS,
  CONTROL_DATA_START_ROW,
  CONTROL_MAX_ROWS,
  CONTROL_COLS,
  SIGN_OFF_CELLS,
} from './software-validation.layout';
import type { SoftwareValidationExportData } from './software-validation-export-data.service';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface SoftwareValidationExportResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

/**
 * UL-QP-18-09 시험 소프트웨어 유효성확인 DOCX 렌더러.
 *
 * SoftwareValidationExportData(집계 결과)를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 셀 좌표는 `software-validation.layout.ts` SSOT 참조. DB inject 금지.
 */
@Injectable()
export class SoftwareValidationRendererService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
    private readonly formTemplateService: FormTemplateService
  ) {}

  async render(data: SoftwareValidationExportData): Promise<SoftwareValidationExportResult> {
    const entry = FORM_CATALOG[FORM_NUMBER];
    const templateBuf = await this.formTemplateService.getTemplateBuffer(FORM_NUMBER);
    const doc = new DocxTemplate(templateBuf, FORM_NUMBER);

    if (data.validationType === 'vendor') {
      this.renderVendor(doc, data);
    } else {
      await this.renderSelf(doc, data);
    }

    return {
      buffer: doc.toBuffer(),
      mimeType: DOCX_MIME,
      filename: `${entry.formNumber}_${entry.name}_${data.validationType}.docx`,
    };
  }

  private renderVendor(doc: DocxTemplate, data: SoftwareValidationExportData): void {
    const { VENDOR_BASIC: T0, VENDOR_CONTENT: T1, VENDOR_RECEIPT: T2 } = TABLE_INDEX;

    // T0: 기본 정보
    doc.setCellValue(
      T0,
      VENDOR_BASIC_CELLS.vendorName.row,
      VENDOR_BASIC_CELLS.vendorName.col,
      data.vendorName ?? '-'
    );
    doc.setCellValue(
      T0,
      VENDOR_BASIC_CELLS.softwareNameVersion.row,
      VENDOR_BASIC_CELLS.softwareNameVersion.col,
      `${data.softwareName} ${data.softwareVersion ?? ''}`
    );
    doc.setCellValue(
      T0,
      VENDOR_BASIC_CELLS.versionDate.row,
      VENDOR_BASIC_CELLS.versionDate.col,
      `${data.softwareVersion ?? '-'} / ${this.fmtDate(data.infoDate)}`
    );

    // T1: 검증 내용
    doc.setCellValue(
      T1,
      VENDOR_CONTENT_CELLS.infoDate.row,
      VENDOR_CONTENT_CELLS.infoDate.col,
      this.fmtDate(data.infoDate)
    );
    doc.setCellValue(
      T1,
      VENDOR_CONTENT_CELLS.summary.row,
      VENDOR_CONTENT_CELLS.summary.col,
      data.vendorSummary ?? '-'
    );

    // T2: 수령 정보
    doc.setCellValue(
      T2,
      VENDOR_RECEIPT_CELLS.receiverName.row,
      VENDOR_RECEIPT_CELLS.receiverName.col,
      data.receiver?.name ?? '-'
    );
    doc.setCellValue(
      T2,
      VENDOR_RECEIPT_CELLS.receivedDate.row,
      VENDOR_RECEIPT_CELLS.receivedDate.col,
      this.fmtDate(data.receivedDate)
    );
    doc.setCellValue(
      T2,
      VENDOR_RECEIPT_CELLS.attachmentNote.row,
      VENDOR_RECEIPT_CELLS.attachmentNote.col,
      data.attachmentNote ?? '-'
    );
  }

  private async renderSelf(doc: DocxTemplate, data: SoftwareValidationExportData): Promise<void> {
    const {
      SELF_BASIC: T3,
      ACQUISITION: T4,
      PROCESSING: T5,
      CONTROL: T6,
      SIGN_OFF: T8,
    } = TABLE_INDEX;

    // T3: 기본 정보 (7행)
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.softwareNameVersion.row,
      SELF_BASIC_CELLS.softwareNameVersion.col,
      `${data.softwareName} ${data.softwareVersion ?? ''}`
    );
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.softwareAuthor.row,
      SELF_BASIC_CELLS.softwareAuthor.col,
      data.softwareAuthor ?? '-'
    );
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.softwareVersion.row,
      SELF_BASIC_CELLS.softwareVersion.col,
      data.softwareVersion ?? '-'
    );
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.referenceDocuments.row,
      SELF_BASIC_CELLS.referenceDocuments.col,
      data.referenceDocuments ?? '-'
    );
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.operatingUnit.row,
      SELF_BASIC_CELLS.operatingUnit.col,
      data.operatingUnitDescription ?? '-'
    );
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.softwareComponents.row,
      SELF_BASIC_CELLS.softwareComponents.col,
      data.softwareComponents ?? '-'
    );
    doc.setCellValue(
      T3,
      SELF_BASIC_CELLS.hardwareComponents.row,
      SELF_BASIC_CELLS.hardwareComponents.col,
      data.hardwareComponents ?? '-'
    );

    // T4: 획득 기능 — R1=독립방법(means), R2=수락기준(criteria)
    // 절차서 QP-18-09: T4 R0=Name, R1=Means(독립 방법), R2=Criteria(수락 기준)
    if (data.acquisitionFunctions.length > 0) {
      const acq = data.acquisitionFunctions[0];
      doc.setCellValue(T4, FUNCTION_ITEM_ROWS.name, FUNCTION_ITEM_DATA_COL, acq.name);
      doc.setCellValue(
        T4,
        FUNCTION_ITEM_ROWS.independentMethod,
        FUNCTION_ITEM_DATA_COL,
        acq.independentMethod
      );
      doc.setCellValue(
        T4,
        FUNCTION_ITEM_ROWS.acceptanceCriteria,
        FUNCTION_ITEM_DATA_COL,
        acq.acceptanceCriteria
      );
    }

    // T5: 프로세싱 기능 — 동일 구조
    if (data.processingFunctions.length > 0) {
      const proc = data.processingFunctions[0];
      doc.setCellValue(T5, FUNCTION_ITEM_ROWS.name, FUNCTION_ITEM_DATA_COL, proc.name);
      doc.setCellValue(
        T5,
        FUNCTION_ITEM_ROWS.independentMethod,
        FUNCTION_ITEM_DATA_COL,
        proc.independentMethod
      );
      doc.setCellValue(
        T5,
        FUNCTION_ITEM_ROWS.acceptanceCriteria,
        FUNCTION_ITEM_DATA_COL,
        proc.acceptanceCriteria
      );
    }

    // T6: 제어 기능 — 4열: equipmentFunction/expectedFunction/observedFunction/acceptanceCriteria
    // 템플릿 R1~R3 = 최대 CONTROL_MAX_ROWS(3)개. DTO에서 max(3) 선제 차단 — [0]만 렌더하던 버그 수정.
    data.controlFunctions.slice(0, CONTROL_MAX_ROWS).forEach((ctrl, idx) => {
      const r = CONTROL_DATA_START_ROW + idx;
      doc.setCellValue(T6, r, CONTROL_COLS.equipmentFunction, ctrl.equipmentFunction);
      doc.setCellValue(T6, r, CONTROL_COLS.expectedFunction, ctrl.expectedFunction);
      doc.setCellValue(T6, r, CONTROL_COLS.observedFunction, ctrl.observedFunction);
      doc.setCellValue(T6, r, CONTROL_COLS.acceptanceCriteria, ctrl.acceptanceCriteria);
    });

    // T8: 승인란 — 서명 병렬 로딩
    doc.setCellValue(
      T8,
      SIGN_OFF_CELLS.testDate.row,
      SIGN_OFF_CELLS.testDate.col,
      this.fmtDate(data.testDate)
    );
    doc.setCellValue(
      T8,
      SIGN_OFF_CELLS.performerName.row,
      SIGN_OFF_CELLS.performerName.col,
      data.performer?.name ?? '-'
    );
    await Promise.all([
      insertDocxSignature(
        doc,
        T8,
        SIGN_OFF_CELLS.qualityApproverSig.row,
        SIGN_OFF_CELLS.qualityApproverSig.col,
        data.qualityApprover?.signaturePath ?? null,
        data.qualityApprover?.name ?? '-',
        this.storage
      ),
      insertDocxSignature(
        doc,
        T8,
        SIGN_OFF_CELLS.techApproverSig.row,
        SIGN_OFF_CELLS.techApproverSig.col,
        data.techApprover?.signaturePath ?? null,
        data.techApprover?.name ?? '-',
        this.storage
      ),
    ]);
  }

  private fmtDate(d: Date | string | null | undefined): string {
    if (!d) return '-';
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
  }
}
