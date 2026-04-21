// Pure DOCX XML utilities — canonical location: src/common/docx/docx-xml-helpers.ts
// Re-exported here for backward compatibility with existing callers in the reports module.
export {
  FormRenderError,
  escapeXml,
  buildRunXml,
  injectTextIntoLabeledCell,
  injectXmlIntoLabeledCell,
  assertReplace,
  assertReplaceRegex,
  fillSectionEmptyRows,
  addImageResource,
  buildInlineDrawingXml,
  calculateAspectFitDimensions,
  formatYmdSlash,
  stripExplicitPageBreakParas,
  insertDocxSignature,
} from '../../common/docx/docx-xml-helpers';

// ============================================================================
// 동적 결과 섹션 렌더링 (중간점검/자체점검 공용).
//
// inspection_result_sections 테이블을 순회하며 DocxTemplate의 append* 메서드로 주입.
// N+1 방지를 위해 모든 사진/rich_table 이미지 documentId를 사전 수집 후 batch 다운로드.
// ============================================================================
import { Logger } from '@nestjs/common';
import type { InspectionResultSection } from '@equipment-management/db/schema/inspection-result-sections';
import type { DocxTemplate } from '../../common/docx/docx-template.util';
import type { IStorageProvider } from '../../common/storage/storage.interface';

const helperLogger = new Logger('InspectionResultRenderer');

type InspectionResultSectionImageCache = Map<string, { buffer: Buffer; ext: 'png' | 'jpeg' }>;

/**
 * Data Service가 선조회한 결과 섹션 데이터.
 *
 * Renderer는 이 객체를 renderResultSections에 전달하여 DB 접근 없이
 * 순수 template injection을 수행한다.
 */
export interface InspectionResultSectionPreFetched {
  /** inspection_result_sections 행 (sortOrder 오름차순 정렬 완료) */
  sections: InspectionResultSection[];
  /**
   * documentId → { filePath, mimeType }
   * Data Service가 documents 테이블에서 선조회.
   * 이미지 다운로드는 Renderer가 storage 경유로 수행.
   */
  documentPaths: Map<string, { filePath: string; mimeType: string }>;
}

/**
 * 사전 수집된 document 경로 맵으로 이미지를 병렬 다운로드한다.
 * 개별 다운로드 실패는 Map에서 누락 — 렌더 단계가 `[image not found]`로 fallback.
 */
async function downloadSectionImages(
  documentPaths: Map<string, { filePath: string; mimeType: string }>,
  storage: IStorageProvider
): Promise<InspectionResultSectionImageCache> {
  const result: InspectionResultSectionImageCache = new Map();
  if (documentPaths.size === 0) return result;

  const downloads = await Promise.allSettled(
    Array.from(documentPaths.entries()).map(async ([id, { filePath, mimeType }]) => {
      const buffer = await storage.download(filePath);
      const ext = mimeType === 'image/png' ? ('png' as const) : ('jpeg' as const);
      return { id, buffer, ext };
    })
  );

  for (const outcome of downloads) {
    if (outcome.status === 'fulfilled') {
      result.set(outcome.value.id, { buffer: outcome.value.buffer, ext: outcome.value.ext });
    } else {
      helperLogger.warn(`Failed to batch-load document image: ${String(outcome.reason)}`);
    }
  }
  return result;
}

type RichTableData = {
  headers: string[];
  rows: Array<
    Array<
      | { type: 'text'; value: string }
      | { type: 'image'; documentId: string; widthCm?: number; heightCm?: number }
    >
  >;
};

/**
 * Data Service가 선조회한 결과 섹션을 DocxTemplate에 순차 주입.
 *
 * 섹션이 없으면 no-op. 섹션이 있으면 템플릿 예시 텍스트 제거 + 페이지 나누기 후 렌더.
 * DB 접근 없음 — 이미지 파일 다운로드만 storage 경유로 수행.
 */
export async function renderResultSections(
  doc: DocxTemplate,
  prefetched: InspectionResultSectionPreFetched,
  storage: IStorageProvider,
  options?: { skipPageBreak?: boolean }
): Promise<void> {
  const { sections } = prefetched;

  if (sections.length === 0) return;

  if (!options?.skipPageBreak) {
    doc.removeTemplateExampleTextAndInsertPageBreak();
  }

  const imageCache = await downloadSectionImages(prefetched.documentPaths, storage);

  const { check: headingNumId } = doc.bulletNumIds;

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
        const rd = section.richTableData as RichTableData | null;
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
