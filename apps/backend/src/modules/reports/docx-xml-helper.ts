import { InternalServerErrorException, Logger } from '@nestjs/common';
import type PizZip from 'pizzip';
import type { InspectionResultSection } from '@equipment-management/db/schema/inspection-result-sections';
import type { DocxTemplate } from './docx-template.util';
import type { IStorageProvider } from '../../common/storage/storage.interface';

/**
 * 공통 로거 — 이 파일의 공유 헬퍼(insertDocxSignature 등) 내부 경고 출력용.
 *
 * 양식별 렌더러 서비스가 자체 `Logger`를 쓰는 것과 달리, 헬퍼 함수는
 * 단일 모듈 논리 이름으로 로그를 남겨 운영자가 grep 가능하도록 한다.
 */
const helperLogger = new Logger('DocxXmlHelper');

/**
 * DOCX XML 조작 범용 유틸리티.
 *
 * OOXML의 `word/document.xml`을 정규식/문자열 단위로 편집하는 로직을 모아둔다.
 * 양식별 서비스(history-card-renderer 등)가 이 유틸을 사용하여 셀 주입·이미지 삽입·섹션 채우기를 수행.
 *
 * **모든 함수는 순수 함수 (또는 XmlOperationResult 반환)** — 에러는 `FormRenderError` 구조화 예외로 throw.
 *
 * @see apps/backend/src/modules/equipment/services/history-card-renderer.service.ts — 주요 사용처
 */

/**
 * 양식 렌더링 중 발생한 구조화 예외.
 *
 * NestJS `InternalServerErrorException`을 상속하여 HTTP 500 + payload에 `code`/`formLabel`/`context` 포함.
 * 양식 개정 시 깨진 매칭을 운영자가 즉시 식별할 수 있도록 에러 메시지에 label + 위치 정보 포함.
 */
export class FormRenderError extends InternalServerErrorException {
  constructor(formLabel: string, context: string, details: string) {
    super({
      code: 'FORM_TEMPLATE_RENDER_FAILED',
      formLabel,
      context,
      message: `[${formLabel}] ${context}: ${details}`,
    });
  }
}

/**
 * XML 특수 문자 이스케이프.
 */
export function escapeXml(v: unknown): string {
  return String(v ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * `<w:r>` 런(run) XML을 생성한다.
 *
 * @param value 사용자 값 (자동 이스케이프)
 * @param rPrXml 런 속성 XML (폰트/사이즈 등 — 호출자가 양식별로 제공)
 */
export function buildRunXml(value: string, rPrXml: string): string {
  return `<w:r>${rPrXml}<w:t>${escapeXml(value)}</w:t></w:r>`;
}

/**
 * 라벨 fragment를 포함하는 행의 N번째 빈 셀에 텍스트 런을 주입한다.
 *
 * 빈 셀 = `<w:r>` 런이 없는 `<w:tc>` 셀. `</w:p>` 앞에 새 런을 삽입.
 *
 * @throws FormRenderError 라벨 매칭 실패 or 빈 셀 부족 시
 */
export function injectTextIntoLabeledCell(
  xml: string,
  labelFragment: string,
  value: string,
  emptyCellIndex: number,
  rPrXml: string,
  formLabel: string
): string {
  const rowRegex = /<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowXml = rowMatch[0];
    const rowText = rowXml.replace(/<[^>]+>/g, '');
    if (!rowText.includes(labelFragment)) continue;

    const cellRegex = /<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g;
    let cellMatch: RegExpExecArray | null;
    let emptyCount = 0;
    while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
      const cellXml = cellMatch[0];
      if (!/<w:r\b/.test(cellXml)) {
        if (emptyCount === emptyCellIndex) {
          const runXml = buildRunXml(value, rPrXml);
          const newCellXml = cellXml.replace('</w:p>', runXml + '</w:p>');
          const newRowXml = rowXml.replace(cellXml, newCellXml);
          return xml.replace(rowXml, newRowXml);
        }
        emptyCount++;
      }
    }
    throw new FormRenderError(
      formLabel,
      `라벨 '${labelFragment}' 빈 셀[${emptyCellIndex}] 주입 실패`,
      `행에서 빈 셀 ${emptyCount}개 발견 — 양식 셀 구조가 변경되었을 수 있습니다.`
    );
  }
  throw new FormRenderError(
    formLabel,
    `라벨 '${labelFragment}' 매칭 실패`,
    '양식의 라벨 텍스트가 변경되었을 수 있습니다.'
  );
}

/**
 * 라벨 fragment 행의 첫 빈 셀에 임의 XML(보통 drawing)을 주입한다.
 *
 * 주로 서명 이미지 삽입용. 매칭 실패 시 입력 xml 그대로 반환 (graceful fallback).
 */
export function injectXmlIntoLabeledCell(
  xml: string,
  labelFragment: string,
  contentXml: string
): string {
  const rowRegex = /<w:tr\b[^>]*>[\s\S]*?<\/w:tr>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowText = rowMatch[0].replace(/<[^>]+>/g, '');
    if (!rowText.includes(labelFragment)) continue;
    const cellRegex = /<w:tc\b[^>]*>[\s\S]*?<\/w:tc>/g;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
      if (!/<w:r\b/.test(cellMatch[0])) {
        const newCell = cellMatch[0].replace('</w:p>', contentXml + '</w:p>');
        const newRow = rowMatch[0].replace(cellMatch[0], newCell);
        return xml.replace(rowMatch[0], newRow);
      }
    }
    break;
  }
  return xml;
}

/**
 * 문자열 치환 — 매칭 실패 시 FormRenderError throw.
 */
export function assertReplace(
  xml: string,
  pattern: string,
  replacement: string,
  context: string,
  formLabel: string
): string {
  const result = xml.replace(pattern, replacement);
  if (result === xml) {
    throw new FormRenderError(
      formLabel,
      `'${context}' 패턴 매칭 실패`,
      `패턴 '${pattern}' 양식이 변경되었을 수 있습니다.`
    );
  }
  return result;
}

/**
 * 정규식 치환 — 매칭 실패 시 FormRenderError throw.
 */
export function assertReplaceRegex(
  xml: string,
  pattern: RegExp,
  replacement: string,
  context: string,
  formLabel: string
): string {
  const result = xml.replace(pattern, replacement);
  if (result === xml) {
    throw new FormRenderError(
      formLabel,
      `'${context}' 정규식 매칭 실패`,
      '양식이 변경되었을 수 있습니다.'
    );
  }
  return result;
}

/**
 * 섹션 제목 아래의 빈 행 N개에 데이터를 채운다.
 *
 * 기존 양식의 셀 너비/테두리 서식을 보존하기 위해 **행 추가는 하지 않고** 미리 생성된 빈 행에 런만 주입.
 * 데이터가 빈 행 수보다 많으면 뒤쪽 데이터는 drop, 적으면 남는 빈 행은 그대로 유지.
 *
 * @param sectionMarker 섹션 제목 텍스트 (고유 식별자)
 * @param dataRows 행 데이터 배열 (각 원소는 셀 값 배열)
 * @param headerSkip 섹션 제목행 + 컬럼 헤더행을 건너뛸 수 (보통 2)
 * @param emptyRowCount 템플릿에 있는 빈 행 수
 * @param rPrXml 런 속성 XML
 * @throws FormRenderError 섹션 제목 매칭 실패 or 헤더 행 수 부족 시
 */
export function fillSectionEmptyRows(
  xml: string,
  sectionMarker: string,
  dataRows: readonly string[][],
  headerSkip: number,
  emptyRowCount: number,
  rPrXml: string,
  formLabel: string
): string {
  const sectionPos = xml.indexOf(sectionMarker);
  if (sectionPos === -1) {
    throw new FormRenderError(
      formLabel,
      `섹션 '${sectionMarker}' 매칭 실패`,
      '양식의 섹션 제목이 변경되었을 수 있습니다.'
    );
  }

  let pos = sectionPos;
  for (let i = 0; i < headerSkip; i++) {
    pos = xml.indexOf('</w:tr>', pos);
    if (pos === -1) {
      throw new FormRenderError(
        formLabel,
        `섹션 '${sectionMarker}' 헤더 행 구조 불일치`,
        `${headerSkip}개 행 필요, ${i}개만 발견`
      );
    }
    pos += '</w:tr>'.length;
  }

  let currentXml = xml;
  for (let rowIdx = 0; rowIdx < emptyRowCount; rowIdx++) {
    const trStart = currentXml.indexOf('<w:tr', pos);
    if (trStart === -1) break;
    const trEnd = currentXml.indexOf('</w:tr>', trStart) + '</w:tr>'.length;
    const rowXml = currentXml.substring(trStart, trEnd);

    if (rowIdx < dataRows.length) {
      const cellData = dataRows[rowIdx];
      let cellIdx = 0;
      const filledRow = rowXml.replace(
        /<w:tc\b([^>]*)>([\s\S]*?)<\/w:tc>/g,
        (match, attrs: string, content: string) => {
          if (/<w:r\b/.test(content) || cellIdx >= cellData.length) return match;
          const value = cellData[cellIdx++];
          const runXml = buildRunXml(value, rPrXml);
          const newContent = content.replace('</w:p>', runXml + '</w:p>');
          return `<w:tc${attrs}>${newContent}</w:tc>`;
        }
      );
      currentXml = currentXml.substring(0, trStart) + filledRow + currentXml.substring(trEnd);
      pos = trStart + filledRow.length;
    } else {
      pos = trEnd;
    }
  }
  return currentXml;
}

/**
 * DOCX zip에 이미지 리소스를 추가한다 (word/media/ + rels + Content_Types).
 *
 * @returns relationship ID (호출자가 drawing XML에 `r:embed=""`로 삽입)
 */
export function addImageResource(
  zip: PizZip,
  imageBuffer: Buffer,
  imageFileName: string,
  extension: 'png' | 'jpeg',
  relationshipId: string
): void {
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

  zip.file(`word/media/${imageFileName}`, imageBuffer);

  const relsPath = 'word/_rels/document.xml.rels';
  const relsFile = zip.file(relsPath);
  if (!relsFile) {
    throw new FormRenderError('DOCX', 'document.xml.rels 없음', 'zip 구조 오류');
  }
  let relsXml = relsFile.asText();
  if (!relsXml.includes(`Id="${relationshipId}"`)) {
    relsXml = relsXml.replace(
      '</Relationships>',
      `<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageFileName}"/></Relationships>`
    );
    zip.file(relsPath, relsXml);
  }

  const ctPath = '[Content_Types].xml';
  const ctFile = zip.file(ctPath);
  if (!ctFile) {
    throw new FormRenderError('DOCX', '[Content_Types].xml 없음', 'zip 구조 오류');
  }
  let ctXml = ctFile.asText();
  if (!ctXml.includes(`Extension="${extension}"`)) {
    ctXml = ctXml.replace(
      '</Types>',
      `<Default Extension="${extension}" ContentType="${contentType}"/></Types>`
    );
    zip.file(ctPath, ctXml);
  }
}

/**
 * 인라인 이미지 drawing XML을 생성한다.
 *
 * @param cxEmu 가로 크기 (EMU, 1cm = 360000)
 * @param cyEmu 세로 크기 (EMU)
 */
export function buildInlineDrawingXml(
  relationshipId: string,
  imageName: string,
  docPrId: number,
  cxEmu: number,
  cyEmu: number
): string {
  return (
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cxEmu}" cy="${cyEmu}"/>` +
    `<wp:docPr id="${docPrId}" name="${imageName}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="${imageName}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${relationshipId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
    `<a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cxEmu}" cy="${cyEmu}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
    `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
  );
}

/**
 * 이미지 원본 비율을 유지하면서 셀 박스(cellWidth × [minHeight, maxHeight])에 맞춘 최적 치수 계산.
 *
 * 알고리즘:
 * 1. cellWidth를 기본 가로로 두고 원본 비율로 세로 계산 (naturalCy)
 * 2. naturalCy > maxHeight → 세로를 max로 고정, 가로를 비율에 맞게 축소 (세로가 긴 사진 대응)
 * 3. naturalCy < minHeight → 세로를 min으로 고정, 가로는 cellWidth 상한으로 (가로가 매우 긴 사진 대응)
 * 4. 위 둘 다 아니면 cellWidth × naturalCy (대부분의 4:3 / 16:9 사진)
 *
 * 원본이 0이거나 읽기 실패 시 기본 4:3 fallback: cellWidth × (cellWidth × 3/4).
 *
 * @param originalWidth 원본 이미지 픽셀 가로 (sharp metadata.width)
 * @param originalHeight 원본 이미지 픽셀 세로 (sharp metadata.height)
 * @param cellWidthEmu 목표 셀 가로 EMU
 * @param maxHeightEmu 세로 상한 EMU
 * @param minHeightEmu 세로 하한 EMU
 * @returns `{ cx, cy }` EMU 정수
 */
export function calculateAspectFitDimensions(
  originalWidth: number | undefined,
  originalHeight: number | undefined,
  cellWidthEmu: number,
  maxHeightEmu: number,
  minHeightEmu: number
): { cx: number; cy: number } {
  // 원본 메타데이터 없음 → 4:3 기본값
  if (!originalWidth || !originalHeight || originalWidth <= 0 || originalHeight <= 0) {
    const fallbackCy = Math.round((cellWidthEmu * 3) / 4);
    return {
      cx: cellWidthEmu,
      cy: Math.max(minHeightEmu, Math.min(maxHeightEmu, fallbackCy)),
    };
  }

  const naturalCy = Math.round(cellWidthEmu * (originalHeight / originalWidth));

  if (naturalCy > maxHeightEmu) {
    // 세로 상한 초과 → 세로 고정, 가로 축소 (원본 비율 유지)
    return {
      cx: Math.round(maxHeightEmu * (originalWidth / originalHeight)),
      cy: maxHeightEmu,
    };
  }

  if (naturalCy < minHeightEmu) {
    // 세로 하한 미만 → 세로 고정, 가로는 cellWidth 상한 (가로 매우 긴 파노라마 대응)
    const cxCandidate = Math.round(minHeightEmu * (originalWidth / originalHeight));
    return {
      cx: Math.min(cellWidthEmu, cxCandidate),
      cy: minHeightEmu,
    };
  }

  return { cx: cellWidthEmu, cy: naturalCy };
}

/**
 * YYYY/MM/DD 포맷 (Date | string | null 모두 수용).
 */
export function formatYmdSlash(d: Date | string | null | undefined): string {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * 양식 템플릿에 내장된 명시적 페이지 나누기 단락을 제거한다.
 *
 * `<w:br w:type="page"/>` 를 포함하면서 `<w:t>` 텍스트가 없는 단락만 대상으로 한다.
 * 텍스트가 함께 있는 단락(e.g. 제목 + 페이지 나누기)은 제거하지 않는다.
 * Word가 내용 길이에 따라 자동으로 페이지를 나누도록 위임한다.
 */
export function stripExplicitPageBreakParas(xml: string): string {
  return xml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, (para) => {
    if (para.includes('<w:br w:type="page"/>') && !para.includes('<w:t')) {
      return '';
    }
    return para;
  });
}

// ============================================================================
// DOCX 셀 서명 이미지 삽입 (tableIndex/rowIndex/cellIndex 좌표 기반).
//
// `DocxTemplate.setSignatureImage`(이미지) / `setCellValue`(텍스트 fallback) 두 경로를 래핑.
// 스토리지 다운로드 실패 시 이름 텍스트로 fallback (graceful degradation).
//
// 사용처:
// - intermediate-inspection-renderer.service.ts
// - self-inspection-renderer.service.ts
// - form-template-export.service.ts (UL-QP-18-06 반출확인서)
// ============================================================================

/**
 * 결재란 서명 셀(tableIdx, rowIdx, cellIdx)에 이미지 또는 이름 텍스트를 삽입.
 *
 * @param doc DocxTemplate 인스턴스
 * @param tableIdx 0-based 테이블 인덱스
 * @param rowIdx 0-based 행 인덱스
 * @param cellIdx 0-based 셀 인덱스
 * @param signaturePath 스토리지 경로 (null이면 이름만 표시)
 * @param fallbackName 이미지 로드 실패/미지정 시 표시할 텍스트 (보통 사용자 이름)
 * @param storage IStorageProvider
 */
export async function insertDocxSignature(
  doc: DocxTemplate,
  tableIdx: number,
  rowIdx: number,
  cellIdx: number,
  signaturePath: string | null,
  fallbackName: string,
  storage: IStorageProvider
): Promise<void> {
  if (!signaturePath) {
    doc.setCellValue(tableIdx, rowIdx, cellIdx, fallbackName);
    return;
  }
  try {
    const imageBuffer = await storage.download(signaturePath);
    const ext = signaturePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    doc.setSignatureImage(tableIdx, rowIdx, cellIdx, imageBuffer, ext);
  } catch {
    helperLogger.warn(`Failed to load signature: ${signaturePath}, using name fallback`);
    doc.setCellValue(tableIdx, rowIdx, cellIdx, fallbackName);
  }
}

// ============================================================================
// 동적 결과 섹션 렌더링 (중간점검/자체점검 공용).
//
// inspection_result_sections 테이블을 순회하며 DocxTemplate의 append* 메서드로 주입.
// N+1 방지를 위해 모든 사진/rich_table 이미지 documentId를 사전 수집 후 batch 다운로드.
// ============================================================================

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
 *
 * @param documentPaths Data Service가 선조회한 documentId → { filePath, mimeType } 맵
 * @param storage IStorageProvider
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
 *
 * @param doc DocxTemplate 인스턴스
 * @param prefetched Data Service가 선조회한 섹션 + document 경로 데이터
 * @param storage IStorageProvider
 */
export async function renderResultSections(
  doc: DocxTemplate,
  prefetched: InspectionResultSectionPreFetched,
  storage: IStorageProvider,
  options?: { skipPageBreak?: boolean }
): Promise<void> {
  const { sections } = prefetched;

  if (sections.length === 0) return;

  // 페이지 나누기는 호출자가 이미 삽입한 경우 건너뜀 (skipPageBreak=true)
  if (!options?.skipPageBreak) {
    doc.removeTemplateExampleTextAndInsertPageBreak();
  }

  const imageCache = await downloadSectionImages(prefetched.documentPaths, storage);

  // 섹션 제목 글머리: ■ (check) — Wingdings(heading)는 폰트 미설치 시 □로 fallback됨
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
