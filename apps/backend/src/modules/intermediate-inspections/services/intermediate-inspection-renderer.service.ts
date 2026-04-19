import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  QP18_CLASSIFICATION_LABELS,
  INSPECTION_JUDGMENT_LABELS,
} from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { DocxTemplate } from '../../reports/docx-template.util';
import { insertDocxSignature, renderResultSections } from '../../reports/docx-xml-helper';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import {
  FORM_NUMBER,
  HEADER_CELLS,
  ITEMS_SECTION,
  MEASURE_EQUIPMENT_SECTION,
  SIGN_OFF_CELLS,
  TABLE_INDEX,
} from './intermediate-inspection.layout';
import type { IntermediateInspectionExportData } from './intermediate-inspection-export-data.service';

/**
 * UL-QP-18-03 중간점검표 DOCX 렌더러.
 *
 * IntermediateInspectionExportData(집계 결과)를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 셀 좌표/빈 행 수/결재란 cellIdx는 전부 `intermediate-inspection.layout.ts` SSOT 참조.
 *
 * 렌더링 단계:
 * 1. T0 R0~R3: 장비 정보 헤더 (분류/관리팀/관리번호/위치/장비명/모델명/점검주기/교정유효기간)
 * 2. T0 R6+: 점검 항목 데이터 (5열 — 번호/점검항목/기준/결과/판정)
 * 3. 항목별 첨부 사진 → appendSection
 * 4. T1 R2+: 측정 장비 List (4열)
 * 5. T2 R0~R2: 결재 + 점검일/점검자/특기사항
 * 6. 결재란 서명 이미지 (담당/검토/승인)
 * 7. 페이지 나누기 + ■ 측정 결과 자동 생성 (data.items SSOT — DB 섹션과 중복 방지)
 * 8. renderResultSections(data.resultSections, skipPageBreak) — 보충 섹션(환경/특이사항 등)
 */
@Injectable()
export class IntermediateInspectionRendererService {
  private readonly logger = new Logger(IntermediateInspectionRendererService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider
  ) {}

  async render(data: IntermediateInspectionExportData, templateBuf: Buffer): Promise<Buffer> {
    const doc = new DocxTemplate(templateBuf, FORM_NUMBER);

    // --- T0: 헤더 + 점검 항목 ---
    this.injectHeader(doc, data);
    this.injectItems(doc, data);

    // --- T1: 측정 장비 List ---
    this.injectMeasureEquipment(doc, data);

    // --- T2: 결재 + 점검일/점검자/특기사항 ---
    this.injectSignOff(doc, data);
    await this.injectSignatures(doc, data);

    // 템플릿 예시 텍스트 제거 — appendSection 호출 전 반드시 먼저 실행
    // (이후 insertBeforeSectPr 기반 삽입이 해당 영역을 덮어쓰지 않도록)
    doc.removeTemplateExampleTextAndInsertPageBreak();

    // 동적 콘텐츠 삽입 (제거 이후)
    await this.appendItemPhotos(doc, data);
    // 2페이지: ■ 측정 결과 (items SSOT 자동 생성) + 보충 섹션 (DB)
    this.injectItemsSummary(doc, data);
    await renderResultSections(doc, data.resultSections, this.storage, { skipPageBreak: true });

    return doc.toBuffer();
  }

  /** T0 R0~R3: 장비 정보 헤더 주입. */
  private injectHeader(doc: DocxTemplate, data: IntermediateInspectionExportData): void {
    const { header } = data;
    const classificationLabel = QP18_CLASSIFICATION_LABELS[header.classification];
    const ti = TABLE_INDEX.HEADER;

    doc.setCellValue(
      ti,
      HEADER_CELLS.classification.row,
      HEADER_CELLS.classification.col,
      classificationLabel
    );
    doc.setCellValue(ti, HEADER_CELLS.teamName.row, HEADER_CELLS.teamName.col, header.teamName);
    doc.setCellValue(
      ti,
      HEADER_CELLS.managementNumber.row,
      HEADER_CELLS.managementNumber.col,
      header.managementNumber
    );
    doc.setCellValue(ti, HEADER_CELLS.location.row, HEADER_CELLS.location.col, header.location);
    doc.setCellValue(
      ti,
      HEADER_CELLS.equipmentName.row,
      HEADER_CELLS.equipmentName.col,
      header.equipmentName
    );
    doc.setCellValue(ti, HEADER_CELLS.modelName.row, HEADER_CELLS.modelName.col, header.modelName);
    doc.setCellValue(
      ti,
      HEADER_CELLS.inspectionCycle.row,
      HEADER_CELLS.inspectionCycle.col,
      header.inspectionCycle
    );
    doc.setCellValue(
      ti,
      HEADER_CELLS.validityPeriod.row,
      HEADER_CELLS.validityPeriod.col,
      header.validityPeriod
    );
  }

  /** T0 Row N+: 점검 항목 5열 주입. */
  private injectItems(doc: DocxTemplate, data: IntermediateInspectionExportData): void {
    const itemData = data.items.map((item) => [
      String(item.itemNumber),
      item.checkItem,
      item.checkCriteria,
      item.resultText,
      item.judgment ? INSPECTION_JUDGMENT_LABELS[item.judgment] : '-',
    ]);
    doc.setDataRows(
      ITEMS_SECTION.tableIndex,
      ITEMS_SECTION.startRow,
      itemData,
      ITEMS_SECTION.emptyRows
    );

    // 멀티라인 결과는 setCellMultilineText로 덮어쓰기
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (item.rawMultilineResult) {
        doc.setCellMultilineText(
          ITEMS_SECTION.tableIndex,
          ITEMS_SECTION.startRow + i,
          ITEMS_SECTION.resultColumnIndex,
          item.rawMultilineResult
        );
      }
    }
  }

  /** 항목별 첨부 사진을 별도 "첨부 사진" 섹션으로 append. */
  private async appendItemPhotos(
    doc: DocxTemplate,
    data: IntermediateInspectionExportData
  ): Promise<void> {
    if (data.itemPhotos.length === 0) return;

    const photosByItem = new Map<string, typeof data.itemPhotos>();
    for (const photo of data.itemPhotos) {
      const existing = photosByItem.get(photo.inspectionItemId) ?? [];
      existing.push(photo);
      photosByItem.set(photo.inspectionItemId, existing);
    }

    for (const item of data.items) {
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

  /** T1 Row N+: 측정 장비 List 4열 주입. */
  private injectMeasureEquipment(doc: DocxTemplate, data: IntermediateInspectionExportData): void {
    const meData = data.measureEquipment.map((me, idx) => [
      String(idx + 1),
      me.managementNumber,
      me.equipmentName,
      me.calibrationDate,
    ]);
    doc.setDataRows(
      MEASURE_EQUIPMENT_SECTION.tableIndex,
      MEASURE_EQUIPMENT_SECTION.startRow,
      meData,
      MEASURE_EQUIPMENT_SECTION.emptyRows
    );
  }

  /** T2 R0~R2: 점검일/점검자/특기사항 텍스트 셀 주입. */
  private injectSignOff(doc: DocxTemplate, data: IntermediateInspectionExportData): void {
    const ti = TABLE_INDEX.SIGN_OFF;
    doc.setCellValue(
      ti,
      SIGN_OFF_CELLS.inspectionDate.row,
      SIGN_OFF_CELLS.inspectionDate.col,
      formatDate(data.inspectionDate)
    );
    doc.setCellValue(
      ti,
      SIGN_OFF_CELLS.inspectorName.row,
      SIGN_OFF_CELLS.inspectorName.col,
      data.inspector.name
    );
    doc.setCellValue(ti, SIGN_OFF_CELLS.remarks.row, SIGN_OFF_CELLS.remarks.col, data.remarks);
  }

  /** T2 R1 C4/C5/C6: 담당/검토/승인 서명 이미지 삽입. */
  private async injectSignatures(
    doc: DocxTemplate,
    data: IntermediateInspectionExportData
  ): Promise<void> {
    const ti = TABLE_INDEX.SIGN_OFF;
    // 담당(C4) / 검토(C5) = inspector, 승인(C6) = approver
    await insertDocxSignature(
      doc,
      ti,
      SIGN_OFF_CELLS.chargeSig.row,
      SIGN_OFF_CELLS.chargeSig.col,
      data.inspector.signaturePath,
      data.inspector.name,
      this.storage
    );
    await insertDocxSignature(
      doc,
      ti,
      SIGN_OFF_CELLS.reviewSig.row,
      SIGN_OFF_CELLS.reviewSig.col,
      data.inspector.signaturePath,
      data.inspector.name,
      this.storage
    );
    await insertDocxSignature(
      doc,
      ti,
      SIGN_OFF_CELLS.approveSig.row,
      SIGN_OFF_CELLS.approveSig.col,
      data.approver.signaturePath,
      data.approver.name,
      this.storage
    );
  }

  /**
   * 2페이지 시작: 페이지 나누기 후 ■ 측정 결과 자동 생성.
   * data.items(SSOT)를 직접 읽어 항목별 결과를 나열 — inspection_result_sections에 중복 저장 불필요.
   */
  private injectItemsSummary(doc: DocxTemplate, data: IntermediateInspectionExportData): void {
    if (data.items.length === 0) return;

    const { check: checkNumId } = doc.bulletNumIds;

    doc.appendParagraph('측정 결과', { bold: true, numId: checkNumId });

    for (const item of data.items) {
      const judgmentLabel = item.judgment ? INSPECTION_JUDGMENT_LABELS[item.judgment] : '-';
      doc.appendParagraph(
        `${item.itemNumber}. ${item.checkItem}: ${item.resultText} (${judgmentLabel})`
      );

      if (item.rawMultilineResult) {
        for (const line of item.rawMultilineResult.split('\n')) {
          if (line.trim()) doc.appendParagraph(`    ${line.trim()}`);
        }
      }
    }
  }
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
}
