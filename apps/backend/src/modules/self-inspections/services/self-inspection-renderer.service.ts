import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  QP18_CLASSIFICATION_LABELS,
  SELF_INSPECTION_RESULT_LABELS,
} from '@equipment-management/schemas';
import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '@equipment-management/shared-constants';
import { DocxTemplate } from '../../reports/docx-template.util';
import { insertDocxSignature, renderResultSections } from '../../reports/docx-xml-helper';
import { STORAGE_PROVIDER, type IStorageProvider } from '../../../common/storage/storage.interface';
import {
  FORM_NUMBER,
  HEADER_CELLS,
  ITEMS_SECTION,
  SIGN_OFF_CELLS,
  SPECIAL_NOTES_SECTION,
  TABLE_INDEX,
} from './self-inspection.layout';
import type { SelfInspectionExportData } from './self-inspection-export-data.service';

/**
 * UL-QP-18-05 자체점검표 DOCX 렌더러.
 *
 * SelfInspectionExportData(집계 결과)를 받아 원본 템플릿에 주입한 DOCX 버퍼를 반환.
 * 셀 좌표/빈 행 수/결재란 cellIdx는 전부 `self-inspection.layout.ts` SSOT 참조.
 *
 * 렌더링 단계:
 * 1. T0 R0~R3: 장비 정보 헤더 (분류/관리팀/관리번호/위치/장비명/모델명/점검주기/교정유효기간)
 * 2. T0 R6+: 점검 항목 데이터 (3열 — 번호/점검항목/점검결과)
 * 3. 항목별 첨부 사진 → appendSection
 * 4. T1 R1+: 기타 특기사항 (3열 — 번호/내용/일자)
 * 5. T2 R0~R2: 결재 + 점검일/점검자/특기사항
 * 6. 결재란 서명 이미지 (담당=submitter, 검토=submitter, 승인=approver)
 * 7. renderResultSections(data.resultSections) — DB 접근 없음, 선조회 데이터 주입
 */
@Injectable()
export class SelfInspectionRendererService {
  private readonly logger = new Logger(SelfInspectionRendererService.name);

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider
  ) {}

  async render(data: SelfInspectionExportData, templateBuf: Buffer): Promise<Buffer> {
    const doc = new DocxTemplate(templateBuf, FORM_NUMBER);

    // --- T0: 헤더 + 점검 항목 ---
    this.injectHeader(doc, data);
    this.injectItems(doc, data);

    // --- T1: 기타 특기사항 ---
    this.injectSpecialNotes(doc, data);

    // --- T2: 결재 + 점검일/점검자/특기사항 ---
    this.injectSignOff(doc, data);
    await this.injectSignatures(doc, data);

    // 템플릿 예시 텍스트 제거 — appendSection 호출 전 반드시 먼저 실행
    doc.removeTemplateExampleTextAndInsertPageBreak();

    // 동적 콘텐츠 삽입 (제거 이후)
    await this.appendItemPhotos(doc, data);
    // skipPageBreak: true — 위에서 이미 removeTemplateExampleText 호출함
    await renderResultSections(doc, data.resultSections, this.storage, { skipPageBreak: true });

    return doc.toBuffer();
  }

  /** T0 R0~R3: 장비 정보 헤더 주입. */
  private injectHeader(doc: DocxTemplate, data: SelfInspectionExportData): void {
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

  /** T0 Row N+: 점검 항목 3열 주입. detailed 있으면 그대로, 없으면 라벨. */
  private injectItems(doc: DocxTemplate, data: SelfInspectionExportData): void {
    const itemData = data.items.map((item) => [
      String(item.itemNumber),
      item.checkItem,
      item.detailedResult ? item.detailedResult : SELF_INSPECTION_RESULT_LABELS[item.checkResult],
    ]);
    doc.setDataRows(
      ITEMS_SECTION.tableIndex,
      ITEMS_SECTION.startRow,
      itemData,
      ITEMS_SECTION.emptyRows
    );

    // detailedResult 멀티라인 → setCellMultilineText로 덮어쓰기
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (item.detailedResult && item.detailedResult.includes('\n')) {
        doc.setCellMultilineText(
          ITEMS_SECTION.tableIndex,
          ITEMS_SECTION.startRow + i,
          ITEMS_SECTION.resultColumnIndex,
          item.detailedResult
        );
      }
    }
  }

  /** 항목별 첨부 사진을 별도 "첨부 사진" 섹션으로 append. */
  private async appendItemPhotos(doc: DocxTemplate, data: SelfInspectionExportData): Promise<void> {
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

  /** T1 Row N+: 기타 특기사항 3열 주입. */
  private injectSpecialNotes(doc: DocxTemplate, data: SelfInspectionExportData): void {
    const noteData = data.specialNotes.map((note) => [note.number, note.content, note.date]);
    doc.setDataRows(
      SPECIAL_NOTES_SECTION.tableIndex,
      SPECIAL_NOTES_SECTION.startRow,
      noteData,
      SPECIAL_NOTES_SECTION.emptyRows
    );
  }

  /** T2 R0~R2: 점검일/점검자/특기사항 텍스트 셀 주입. */
  private injectSignOff(doc: DocxTemplate, data: SelfInspectionExportData): void {
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

  /** T2 R1 C4/C5/C6: 담당=submitter, 검토=submitter, 승인=approver 서명. */
  private async injectSignatures(doc: DocxTemplate, data: SelfInspectionExportData): Promise<void> {
    const ti = TABLE_INDEX.SIGN_OFF;
    await insertDocxSignature(
      doc,
      ti,
      SIGN_OFF_CELLS.chargeSig.row,
      SIGN_OFF_CELLS.chargeSig.col,
      data.submitter.signaturePath,
      data.submitter.name,
      this.storage
    );
    await insertDocxSignature(
      doc,
      ti,
      SIGN_OFF_CELLS.reviewSig.row,
      SIGN_OFF_CELLS.reviewSig.col,
      data.submitter.signaturePath,
      data.submitter.name,
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
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(DEFAULT_LOCALE, { timeZone: DEFAULT_TIMEZONE });
}
