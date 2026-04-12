import { InternalServerErrorException } from '@nestjs/common';
import PizZip from 'pizzip';

/**
 * docx 템플릿 조작 유틸리티
 *
 * Buffer를 받아 테이블 셀 값만 교체하는 순수 유틸리티.
 * 서식(폰트, 테두리, 셀 병합)은 원본 그대로 유지.
 *
 * XML 구조: <w:tbl> → <w:tr ...>(<w:trPr/>)(<w:tc>...</w:tc>)+</w:tr> → ...
 */
/**
 * 동적 콘텐츠(appendParagraph, appendTable 등)에 적용할 굴림체 폰트 rPr.
 * 원본 양식이 굴림체/굴림을 사용하므로 동적 생성 콘텐츠도 일치시킨다.
 */
const GULIM_FONT_RPR = '<w:rFonts w:ascii="굴림체" w:eastAsia="굴림체" w:hAnsi="굴림체"/>';

/**
 * 양식 템플릿의 numbering.xml에서 추출한 bullet 타입별 numId 매핑.
 * appendParagraph에서 bullet 옵션 사용 시 참조.
 */
export interface BulletNumIds {
  /** Wingdings bullet — 대제목/소제목용 (측정 결과, RF 입력 검사 등) */
  heading?: number;
  /** ※ bullet — 참고사항용 */
  note?: number;
  /** ■ bullet — 확인사항용 */
  check?: number;
}

export class DocxTemplate {
  private zip: PizZip;
  private documentXml: string;
  private imageCounter = 0; // rId/docPr 충돌 방지용 인스턴스 카운터
  private nextRIdNum: number; // 기존 relationship max ID + 1
  private formLabel: string; // 에러 메시지용 양식 식별자

  /** 템플릿의 numbering.xml에서 파싱한 bullet numId 매핑 */
  readonly bulletNumIds: BulletNumIds;

  constructor(content: Buffer, formLabel = 'unknown') {
    this.formLabel = formLabel;
    this.zip = new PizZip(content);
    const docFile = this.zip.file('word/document.xml');
    if (!docFile) {
      throw new InternalServerErrorException(
        `[${formLabel}] 템플릿 구조 오류: word/document.xml 없음`
      );
    }
    this.documentXml = docFile.asText();

    // 기존 relationship에서 최대 rId 번호 추출
    const rels = this.zip.file('word/_rels/document.xml.rels')?.asText() ?? '';
    const ids = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
    this.nextRIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 100;

    // numbering.xml에서 bullet 문자 → numId 매핑 구축
    this.bulletNumIds = this.parseBulletNumIds();
  }

  /**
   * numbering.xml 파싱: abstractNum의 lvlText(bullet 문자)별로 numId를 역매핑.
   *
   * 원본 양식 구조:
   * - Wingdings bullet → heading (대제목/소제목)
   * - ※ → note (참고사항)
   * - ■ → check (확인사항)
   */
  private parseBulletNumIds(): BulletNumIds {
    const numXml = this.zip.file('word/numbering.xml')?.asText() ?? '';
    if (!numXml) return {};

    // abstractNumId → lvlText 매핑
    const abstractBullets = new Map<string, string>();
    const abstractMatches = numXml.matchAll(
      /w:abstractNumId="(\d+)"[\s\S]*?<w:lvlText w:val="([^"]*)"/g
    );
    for (const m of abstractMatches) {
      abstractBullets.set(m[1], m[2]);
    }

    // numId → abstractNumId 매핑
    const result: BulletNumIds = {};
    const numMatches = numXml.matchAll(/w:numId="(\d+)"[\s\S]*?w:abstractNumId w:val="(\d+)"/g);
    for (const m of numMatches) {
      const numId = Number(m[1]);
      const lvlText = abstractBullets.get(m[2]) ?? '';

      if (lvlText === '※' && !result.note) result.note = numId;
      else if (lvlText === '■' && !result.check) result.check = numId;
      else if (lvlText !== '※' && lvlText !== '■' && lvlText !== '' && !result.heading)
        result.heading = numId;
    }
    return result;
  }

  /**
   * 테이블 → 행 → 셀의 텍스트를 교체
   */
  setCellValue(tableIndex: number, rowIndex: number, cellIndex: number, value: string): void {
    const tables = this.parseTables();
    if (tableIndex >= tables.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellValue 실패: table[${tableIndex}] 없음 (총 ${tables.length}개)`
      );
    }

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellValue 실패: table[${tableIndex}].row[${rowIndex}] 없음 (총 ${rows.length}개)`
      );
    }

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellValue 실패: table[${tableIndex}].row[${rowIndex}].cell[${cellIndex}] 없음 (총 ${cells.length}개)`
      );
    }

    cells[cellIndex] = this.replaceCellText(cells[cellIndex], value);
    rows[rowIndex] = this.rebuildRow(rows[rowIndex], cells);
    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
  }

  /**
   * 데이터 행 설정: 템플릿의 첫 데이터 행을 복제하여 N개 행 생성
   */
  setDataRows(
    tableIndex: number,
    templateRowIndex: number,
    dataRows: string[][],
    emptyRowCount: number
  ): void {
    const tables = this.parseTables();
    if (tableIndex >= tables.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setDataRows 실패: table[${tableIndex}] 없음 (총 ${tables.length}개)`
      );
    }

    const rows = this.parseRows(tables[tableIndex]);
    if (templateRowIndex >= rows.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setDataRows 실패: table[${tableIndex}].row[${templateRowIndex}] 없음 (총 ${rows.length}개)`
      );
    }

    const templateRow = rows[templateRowIndex];

    // 데이터 행 생성 — 각 행마다 템플릿 복제 후 셀 값 교체
    const newRows: string[] = [];
    for (const data of dataRows) {
      const cells = this.parseCells(templateRow);
      if (data.length > cells.length) {
        throw new InternalServerErrorException(
          `[${this.formLabel}] setDataRows 실패: 데���터 열(${data.length}개)이 템플릿 셀(${cells.length}개)보다 많음. 양식의 열 구조가 변경되었을 수 있습니다.`
        );
      }
      data.forEach((val, ci) => {
        if (ci < cells.length) {
          cells[ci] = this.replaceCellText(cells[ci], val);
        }
      });
      newRows.push(this.rebuildRow(templateRow, cells));
    }

    // 템플릿 데이터 행 + 빈 행 제거 후 새 행 삽입
    const removeCount = 1 + emptyRowCount;
    rows.splice(templateRowIndex, removeCount, ...newRows);

    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
  }

  /**
   * 전자서명 이미지를 셀에 삽입
   */
  setSignatureImage(
    tableIndex: number,
    rowIndex: number,
    cellIndex: number,
    imageBuffer: Buffer,
    imageExt: 'png' | 'jpeg'
  ): void {
    const rId = this.addImageResource(imageBuffer, imageExt);
    const imageXml = this.buildInlineImageXml(rId);

    const tables = this.parseTables();
    if (tableIndex >= tables.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setSignatureImage 실패: table[${tableIndex}] 없음 (총 ${tables.length}개)`
      );
    }

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setSignatureImage 실패: table[${tableIndex}].row[${rowIndex}] 없음 (총 ${rows.length}개)`
      );
    }

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setSignatureImage 실패: table[${tableIndex}].row[${rowIndex}].cell[${cellIndex}] 없음 (총 ${cells.length}개)`
      );
    }

    cells[cellIndex] = this.replaceCellWithImage(cells[cellIndex], imageXml);
    rows[rowIndex] = this.rebuildRow(rows[rowIndex], cells);
    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
  }

  /**
   * 멀티라인 텍스트��� 셀에 삽입 (줄바꿈 → 여러 <w:p>)
   *
   * 일반 setCellValue는 단일 <w:t>에 모든 텍스트를 넣지만,
   * 이 메서드는 \n마다 새 <w:p>를 생성하여 Word에서 줄바꿈이 보입니다.
   */
  setCellMultilineText(
    tableIndex: number,
    rowIndex: number,
    cellIndex: number,
    text: string
  ): void {
    const tables = this.parseTables();
    if (tableIndex >= tables.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellMultilineText 실패: table[${tableIndex}] 없음 (총 ${tables.length}개)`
      );
    }

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellMultilineText 실패: table[${tableIndex}].row[${rowIndex}] 없음 (총 ${rows.length}개)`
      );
    }

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellMultilineText 실패: table[${tableIndex}].row[${rowIndex}].cell[${cellIndex}] 없음 (총 ${cells.length}개)`
      );
    }

    cells[cellIndex] = this.replaceCellWithMultilineText(cells[cellIndex], text);
    rows[rowIndex] = this.rebuildRow(rows[rowIndex], cells);
    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
  }

  /**
   * 이미지를 셀에 삽입 (크기 지정 가능)
   *
   * setSignatureImage의 일반화 버전. 서명(2.5×1.5cm) 외에
   * 측정 그래프(12×9cm) 등 다양한 크기를 지원합니다.
   */
  setCellImage(
    tableIndex: number,
    rowIndex: number,
    cellIndex: number,
    imageBuffer: Buffer,
    imageExt: 'png' | 'jpeg',
    widthCm: number,
    heightCm: number
  ): void {
    const rId = this.addImageResource(imageBuffer, imageExt);
    const cx = Math.round(widthCm * 360000);
    const cy = Math.round(heightCm * 360000);
    const imageXml = this.buildSizedInlineImageXml(rId, cx, cy);

    const tables = this.parseTables();
    if (tableIndex >= tables.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellImage 실패: table[${tableIndex}] 없음 (총 ${tables.length}개)`
      );
    }

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellImage 실패: table[${tableIndex}].row[${rowIndex}] 없음 (총 ${rows.length}개)`
      );
    }

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellImage 실패: table[${tableIndex}].row[${rowIndex}].cell[${cellIndex}] 없음 (총 ${cells.length}개)`
      );
    }

    cells[cellIndex] = this.replaceCellWithImage(cells[cellIndex], imageXml);
    rows[rowIndex] = this.rebuildRow(rows[rowIndex], cells);
    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
  }

  /**
   * 리치 콘텐츠를 셀에 삽입 (텍스트+이미지 교차 배치)
   *
   * 하나의 셀 안에 텍스트 단락과 이미지를 ���갈아 배치합니다.
   * 예: 측정 결과 텍스트 → 그래프 이미지 → 추가 설명 텍스트
   */
  setCellRichContent(
    tableIndex: number,
    rowIndex: number,
    cellIndex: number,
    blocks: Array<
      | { type: 'text'; value: string }
      | { type: 'image'; buffer: Buffer; ext: 'png' | 'jpeg'; widthCm?: number; heightCm?: number }
    >
  ): void {
    const tables = this.parseTables();
    if (tableIndex >= tables.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellRichContent 실패: table[${tableIndex}] 없음 (총 ${tables.length}개)`
      );
    }

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellRichContent 실패: table[${tableIndex}].row[${rowIndex}] 없음 (총 ${rows.length}개)`
      );
    }

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) {
      throw new InternalServerErrorException(
        `[${this.formLabel}] setCellRichContent 실패: table[${tableIndex}].row[${rowIndex}].cell[${cellIndex}] 없음 (총 ${cells.length}개)`
      );
    }

    cells[cellIndex] = this.replaceCellWithRichContent(cells[cellIndex], blocks);
    rows[rowIndex] = this.rebuildRow(rows[rowIndex], cells);
    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
  }

  /**
   * 문서 끝(테이블 바깥)에 섹션 추가
   *
   * 항목 테이블 아래에 "첨부 사진" 등의 별도 섹션을 추가할 때 사용.
   * </w:body> 앞에 제목 + 블록(텍스트/이미지)을 삽입합니다.
   */
  appendSection(
    title: string,
    blocks: Array<
      | { type: 'text'; value: string }
      | { type: 'image'; buffer: Buffer; ext: 'png' | 'jpeg'; widthCm?: number; heightCm?: number }
    >
  ): void {
    // 제목 단락 (볼드 + 굴림체)
    const titlePara = `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:rPr>${GULIM_FONT_RPR}<w:b/></w:rPr><w:t xml:space="preserve">${this.escapeXml(title)}</w:t></w:r></w:p>`;

    // 블록 변환
    const fontRPr = `<w:rPr>${GULIM_FONT_RPR}</w:rPr>`;
    const blockXmls = blocks.map((block) => {
      if (block.type === 'text') {
        return this.buildMultilineParagraphs('', fontRPr, block.value);
      }
      const rId = this.addImageResource(block.buffer, block.ext);
      const cx = Math.round((block.widthCm ?? 12) * 360000);
      const cy = Math.round((block.heightCm ?? 9) * 360000);
      const imageXml = this.buildSizedInlineImageXml(rId, cx, cy);
      return `<w:p><w:r>${imageXml}</w:r></w:p>`;
    });

    const sectionXml = titlePara + blockXmls.join('');
    this.documentXml = this.documentXml.replace('</w:body>', `${sectionXml}</w:body>`);
  }

  /**
   * 문서 끝에 단락 추가
   *
   * 동적 결과 섹션의 제목/본문 텍스트 블록을 문서 끝에 삽입합니다.
   * `<w:sectPr` 앞(없으면 `</w:body>` 앞)에 삽입하여 페이지 설정을 보존합니다.
   */
  appendParagraph(
    text: string,
    options?: {
      bold?: boolean;
      fontSize?: number;
      /** 템플릿 numbering의 numId — 글머리 기호 스타일 적용 */
      numId?: number;
      /** 이 단락 앞에 페이지 나누기 삽입 */
      pageBreakBefore?: boolean;
    }
  ): void {
    const rPrParts: string[] = [GULIM_FONT_RPR];
    if (options?.bold) rPrParts.push('<w:b/>');
    if (options?.fontSize) {
      const halfPt = options.fontSize * 2;
      rPrParts.push(`<w:sz w:val="${halfPt}"/><w:szCs w:val="${halfPt}"/>`);
    }
    const rPr = `<w:rPr>${rPrParts.join('')}</w:rPr>`;

    const pPrParts: string[] = [];
    if (options?.pageBreakBefore) pPrParts.push('<w:pageBreakBefore/>');
    if (options?.numId) {
      pPrParts.push(`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${options.numId}"/></w:numPr>`);
    }
    pPrParts.push(`<w:rPr>${GULIM_FONT_RPR}</w:rPr>`);
    const pPr = pPrParts.length > 0 ? `<w:pPr>${pPrParts.join('')}</w:pPr>` : '';

    const paraXml = `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${this.escapeXml(text)}</w:t></w:r></w:p>`;
    this.insertBeforeSectPr(paraXml);
  }

  /**
   * 문서 끝에 테이블 추가
   *
   * 동적 데이터 테이블(RF 측정 데이터, DC 전압 등)을 문서 끝에 삽입합니다.
   * 전체 너비, 단일 테두리, 헤더행 볼드 스타일을 적용합니다.
   */
  appendTable(headers: string[], rows: string[][]): void {
    const borderAttr = 'w:val="single" w:sz="4" w:space="0" w:color="000000"';
    const tblPr = `<w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top ${borderAttr}/><w:left ${borderAttr}/><w:bottom ${borderAttr}/><w:right ${borderAttr}/><w:insideH ${borderAttr}/><w:insideV ${borderAttr}/></w:tblBorders></w:tblPr>`;

    const buildCell = (val: string, bold: boolean): string => {
      const rPr = bold
        ? `<w:rPr>${GULIM_FONT_RPR}<w:b/></w:rPr>`
        : `<w:rPr>${GULIM_FONT_RPR}</w:rPr>`;
      return `<w:tc><w:p><w:r>${rPr}<w:t xml:space="preserve">${this.escapeXml(val)}</w:t></w:r></w:p></w:tc>`;
    };

    const headerRow = `<w:tr>${headers.map((h) => buildCell(h, true)).join('')}</w:tr>`;
    const dataRows = rows
      .map((row) => `<w:tr>${row.map((c) => buildCell(c, false)).join('')}</w:tr>`)
      .join('');

    const tableXml = `<w:tbl>${tblPr}${headerRow}${dataRows}</w:tbl>`;
    this.insertBeforeSectPr(tableXml);
  }

  /**
   * 문서 끝에 리치 테이블 추가 (셀 내 이미지 포함)
   *
   * E0001 OBW 패턴: Data 열에 스크린샷 이미지가 들어간 테이블.
   * 각 셀이 텍스트 또는 이미지 중 하나입니다.
   */
  appendRichTable(
    headers: string[],
    rows: Array<
      Array<
        | { type: 'text'; value: string }
        | {
            type: 'image';
            buffer: Buffer;
            ext: 'png' | 'jpeg';
            widthCm?: number;
            heightCm?: number;
          }
      >
    >
  ): void {
    const borderAttr = 'w:val="single" w:sz="4" w:space="0" w:color="000000"';
    const tblPr = `<w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top ${borderAttr}/><w:left ${borderAttr}/><w:bottom ${borderAttr}/><w:right ${borderAttr}/><w:insideH ${borderAttr}/><w:insideV ${borderAttr}/></w:tblBorders></w:tblPr>`;

    const headerRow = `<w:tr>${headers.map((h) => `<w:tc><w:p><w:r><w:rPr>${GULIM_FONT_RPR}<w:b/></w:rPr><w:t xml:space="preserve">${this.escapeXml(h)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;

    const dataRows = rows
      .map((row) => {
        const cells = row
          .map((cell) => {
            if (cell.type === 'text') {
              return `<w:tc><w:p><w:r><w:rPr>${GULIM_FONT_RPR}</w:rPr><w:t xml:space="preserve">${this.escapeXml(cell.value)}</w:t></w:r></w:p></w:tc>`;
            }
            const rId = this.addImageResource(cell.buffer, cell.ext);
            const cx = Math.round((cell.widthCm ?? 8) * 360000);
            const cy = Math.round((cell.heightCm ?? 6) * 360000);
            const imageXml = this.buildSizedInlineImageXml(rId, cx, cy);
            return `<w:tc><w:p><w:r>${imageXml}</w:r></w:p></w:tc>`;
          })
          .join('');
        return `<w:tr>${cells}</w:tr>`;
      })
      .join('');

    const tableXml = `<w:tbl>${tblPr}${headerRow}${dataRows}</w:tbl>`;
    this.insertBeforeSectPr(tableXml);
  }

  /**
   * 문서 끝에 이미지 추가
   *
   * 측정 그래프, OBW 캡처, 외관 사진 등을 문서 끝에 삽입합니다.
   * 기존 addImageResource() 및 buildSizedInlineImageXml()을 재사용합니다.
   */
  appendImage(imageBuffer: Buffer, ext: 'png' | 'jpeg', widthCm = 12, heightCm = 9): void {
    const rId = this.addImageResource(imageBuffer, ext);
    const cx = Math.round(widthCm * 360000);
    const cy = Math.round(heightCm * 360000);
    const imageXml = this.buildSizedInlineImageXml(rId, cx, cy);
    const paraXml = `<w:p><w:r>${imageXml}</w:r></w:p>`;
    this.insertBeforeSectPr(paraXml);
  }

  /**
   * 마지막 테이블 뒤의 모든 단락(템플릿 예시 텍스트)을 제거하고,
   * 그 자리에 페이지 나누기 단락을 삽입.
   *
   * 양식 템플릿에 "측정 결과", 예시 비고 등이 포함되어 있을 수 있는데,
   * 동적 결과 섹션으로 교체해야 하므로 예시 텍스트를 먼저 제거한다.
   * 이후 appendParagraph/appendTable 등으로 동적 콘텐츠가 삽입된다.
   */
  removeTemplateExampleTextAndInsertPageBreak(): void {
    // 마지막 </w:tbl> 찾기
    const lastTblEnd = this.documentXml.lastIndexOf('</w:tbl>');
    if (lastTblEnd < 0) return;
    const afterTbl = lastTblEnd + '</w:tbl>'.length;

    // sectPr 또는 </w:body> 찾기
    const sectPrIdx = this.documentXml.indexOf('<w:sectPr', afterTbl);
    const bodyEndIdx = this.documentXml.indexOf('</w:body>', afterTbl);
    const cutEnd = sectPrIdx >= 0 ? sectPrIdx : bodyEndIdx;
    if (cutEnd < 0) return;

    // 마지막 테이블 뒤 ~ sectPr 앞 사이의 모든 단락을 제거하고 페이지 나누기 삽입
    const pageBreakPara = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
    this.documentXml =
      this.documentXml.slice(0, afterTbl) + pageBreakPara + this.documentXml.slice(cutEnd);
  }

  /**
   * `<w:sectPr` 앞에 XML 삽입 (없으면 `</w:body>` 앞 fallback)
   */
  private insertBeforeSectPr(xml: string): void {
    const sectPrIdx = this.documentXml.lastIndexOf('<w:sectPr');
    if (sectPrIdx !== -1) {
      this.documentXml =
        this.documentXml.slice(0, sectPrIdx) + xml + this.documentXml.slice(sectPrIdx);
    } else {
      this.documentXml = this.documentXml.replace('</w:body>', `${xml}</w:body>`);
    }
  }

  /** 최종 docx Buffer 반환 */
  toBuffer(): Buffer {
    this.zip.file('word/document.xml', this.documentXml);
    return Buffer.from(this.zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
  }

  // ============================================================================
  // XML 파싱 — 정규식으로 전체 태그를 추출하되 원본 구조를 보존
  // ============================================================================

  /** 전체 document에서 <w:tbl>...</w:tbl> 추출 (원본 XML을 청크로 분할) */
  private parseTables(): string[] {
    const tables: string[] = [];
    const regex = /<w:tbl>[\s\S]*?<\/w:tbl>/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(this.documentXml)) !== null) {
      tables.push(match[0]);
    }
    return tables;
  }

  /** 전체 document를 수정된 tables로 재조립 */
  private rebuildDocument(tables: string[]): string {
    let idx = 0;
    return this.documentXml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, () => tables[idx++]);
  }

  /** 테이블 내의 <w:tr ...>...</w:tr> 추출 */
  private parseRows(tableXml: string): string[] {
    const rows: string[] = [];
    const regex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(tableXml)) !== null) {
      rows.push(match[0]);
    }
    return rows;
  }

  /** 테이블 XML에서 행들을 교체 */
  private rebuildTable(originalTable: string, rows: string[]): string {
    // tblPr + tblGrid (첫 <w:tr> 앞) + 새 rows로 교체
    let idx = 0;
    // 원본 테이블에서 모든 <w:tr>를 새 rows로 순차 교체
    let result = originalTable.replace(/<w:tr[\s>][\s\S]*?<\/w:tr>/g, () => {
      if (idx < rows.length) return rows[idx++];
      return ''; // 초과 행 제거
    });
    // 새로 추가된 행 (기존보다 많은 경우) — </w:tbl> 앞에 삽입
    while (idx < rows.length) {
      result = result.replace('</w:tbl>', rows[idx++] + '</w:tbl>');
    }
    return result;
  }

  /** 행 내의 <w:tc ...>...</w:tc> 추출 */
  private parseCells(rowXml: string): string[] {
    const cells: string[] = [];
    const regex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rowXml)) !== null) {
      cells.push(match[0]);
    }
    return cells;
  }

  /** 행 XML에서 셀들을 교체 — <w:tr> 태그와 <w:trPr> 보존 */
  private rebuildRow(originalRow: string, cells: string[]): string {
    let idx = 0;
    return originalRow.replace(/<w:tc[\s>][\s\S]*?<\/w:tc>/g, () => {
      if (idx < cells.length) return cells[idx++];
      return '';
    });
  }

  // ============================================================================
  // 셀 내용 교체
  // ============================================================================

  /**
   * 셀 내의 텍스트를 교체
   * tcPr(셀 속성), pPr(정렬), rPr(폰트)는 보존하고 텍스트만 교체
   */
  private replaceCellText(cellXml: string, newText: string): string {
    // tcPr 보존
    const tcPrMatch = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : '';

    // 첫 번째 pPr 보존
    const pPrMatch = cellXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : '';

    // 첫 번째 rPr 보존 — 폰트를 굴림체로 강제 교체 (템플릿 셀의 Times New Roman 등 대체)
    const rPrMatch = cellXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
    let rPr = rPrMatch ? rPrMatch[0] : '';
    rPr = DocxTemplate.forceGulimFont(rPr);

    // 셀 시작 태그만 캡처 — <w:tc> 또는 <w:tc attr="..."> (내부 자식 태그 포함 방지)
    const startTag = cellXml.match(/^<w:tc(?:\s[^>]*)?>/)?.[0] ?? '<w:tc>';

    return `${startTag}${tcPr}<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${this.escapeXml(newText)}</w:t></w:r></w:p></w:tc>`;
  }

  /**
   * 셀 내에 멀티라인 텍스트 삽입 — \n마다 별도 <w:p>
   */
  private replaceCellWithMultilineText(cellXml: string, text: string): string {
    const tcPrMatch = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : '';
    const pPrMatch = cellXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : '';
    const rPrMatch = cellXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
    let rPr = rPrMatch ? rPrMatch[0] : '';
    rPr = DocxTemplate.forceGulimFont(rPr);
    const startTag = cellXml.match(/^<w:tc(?:\s[^>]*)?>/)?.[0] ?? '<w:tc>';

    const paragraphs = this.buildMultilineParagraphs(pPr, rPr, text);
    return `${startTag}${tcPr}${paragraphs}</w:tc>`;
  }

  /**
   * 리치 콘텐츠(텍스트+이미지)를 셀에 삽입
   */
  private replaceCellWithRichContent(
    cellXml: string,
    blocks: Array<
      | { type: 'text'; value: string }
      | { type: 'image'; buffer: Buffer; ext: 'png' | 'jpeg'; widthCm?: number; heightCm?: number }
    >
  ): string {
    const tcPrMatch = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : '';
    const pPrMatch = cellXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : '';
    const rPrMatch = cellXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
    const rPr = rPrMatch ? rPrMatch[0] : '';
    const startTag = cellXml.match(/^<w:tc(?:\s[^>]*)?>/)?.[0] ?? '<w:tc>';

    const contentParts = blocks.map((block) => {
      if (block.type === 'text') {
        return this.buildMultilineParagraphs(pPr, rPr, block.value);
      }
      const rId = this.addImageResource(block.buffer, block.ext);
      const cx = Math.round((block.widthCm ?? 12) * 360000);
      const cy = Math.round((block.heightCm ?? 9) * 360000);
      const imageXml = this.buildSizedInlineImageXml(rId, cx, cy);
      return `<w:p>${pPr}<w:r>${imageXml}</w:r></w:p>`;
    });

    // 빈 블록일 경우 최소 하나의 빈 단락 필요 (Word 필수)
    const content = contentParts.length > 0 ? contentParts.join('') : `<w:p>${pPr}</w:p>`;
    return `${startTag}${tcPr}${content}</w:tc>`;
  }

  private replaceCellWithImage(cellXml: string, imageXml: string): string {
    const tcPrMatch = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : '';
    const pPrMatch = cellXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : '';
    const startTag = cellXml.match(/^<w:tc(?:\s[^>]*)?>/)?.[0] ?? '<w:tc>';

    return `${startTag}${tcPr}<w:p>${pPr}<w:r>${imageXml}</w:r></w:p></w:tc>`;
  }

  // ============================================================================
  // 이미지 리소스 관리
  // ============================================================================

  private addImageResource(imageBuffer: Buffer, ext: 'png' | 'jpeg'): string {
    this.imageCounter++;
    const imageId = `sig_${this.imageCounter}`;
    const imagePath = `word/media/${imageId}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

    this.zip.file(imagePath, imageBuffer);

    const relsPath = 'word/_rels/document.xml.rels';
    let rels = this.zip.file(relsPath)?.asText() ?? '';
    const rId = `rId${this.nextRIdNum++}`;
    const newRel = `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${imageId}.${ext}"/>`;
    rels = rels.replace('</Relationships>', `${newRel}</Relationships>`);
    this.zip.file(relsPath, rels);

    const ctPath = '[Content_Types].xml';
    let ct = this.zip.file(ctPath)?.asText() ?? '';
    if (!ct.includes(`Extension="${ext}"`)) {
      ct = ct.replace(
        '</Types>',
        `<Default Extension="${ext}" ContentType="${contentType}"/></Types>`
      );
      this.zip.file(ctPath, ct);
    }

    return rId;
  }

  /**
   * rPr 내 폰트를 굴림체로 강제 교체.
   * 기존 rFonts가 있으면 교체, 없으면 추가.
   */
  private static forceGulimFont(rPr: string): string {
    if (!rPr) return `<w:rPr>${GULIM_FONT_RPR}</w:rPr>`;
    if (rPr.includes('<w:rFonts')) {
      return rPr.replace(/<w:rFonts[^/]*\/>/g, GULIM_FONT_RPR);
    }
    return rPr.replace('<w:rPr>', `<w:rPr>${GULIM_FONT_RPR}`);
  }

  /**
   * 텍스트를 \n 기준으로 분할하여 여러 <w:p> 요소 생성
   */
  private buildMultilineParagraphs(pPr: string, rPr: string, text: string): string {
    const lines = text.split('\n');
    return lines
      .map(
        (line) =>
          `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${this.escapeXml(line)}</w:t></w:r></w:p>`
      )
      .join('');
  }

  /**
   * 크기 지정 가능한 인라인 이미지 XML 생성
   * @param cx 가로 크기 (EMU, 1cm = 360000)
   * @param cy 세로 크기 (EMU)
   */
  private buildSizedInlineImageXml(rId: string, cx: number, cy: number): string {
    const docPrId = this.imageCounter;
    return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${docPrId}" name="Image_${docPrId}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="image_${docPrId}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  }

  private buildInlineImageXml(rId: string): string {
    const cx = 900000; // 2.5cm
    const cy = 540000; // 1.5cm
    const docPrId = this.imageCounter; // 유니크 docPr id
    return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${docPrId}" name="Signature_${docPrId}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="signature.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
