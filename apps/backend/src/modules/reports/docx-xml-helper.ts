import { InternalServerErrorException } from '@nestjs/common';
import type PizZip from 'pizzip';

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
