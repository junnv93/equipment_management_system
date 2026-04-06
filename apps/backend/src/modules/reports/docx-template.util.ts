import PizZip from 'pizzip';

/**
 * docx 템플릿 조작 유틸리티
 *
 * Buffer를 받아 테이블 셀 값만 교체하는 순수 유틸리티.
 * 서식(폰트, 테두리, 셀 병합)은 원본 그대로 유지.
 *
 * XML 구조: <w:tbl> → <w:tr ...>(<w:trPr/>)(<w:tc>...</w:tc>)+</w:tr> → ...
 */
export class DocxTemplate {
  private zip: PizZip;
  private documentXml: string;
  private imageCounter = 0; // rId/docPr 충돌 방지용 인스턴스 카운터
  private nextRIdNum: number; // 기존 relationship max ID + 1

  constructor(content: Buffer) {
    this.zip = new PizZip(content);
    this.documentXml = this.zip.file('word/document.xml')!.asText();

    // 기존 relationship에서 최대 rId 번호 추출
    const rels = this.zip.file('word/_rels/document.xml.rels')?.asText() ?? '';
    const ids = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
    this.nextRIdNum = ids.length > 0 ? Math.max(...ids) + 1 : 100;
  }

  /**
   * 테이블 → 행 → 셀의 텍스트를 교체
   */
  setCellValue(tableIndex: number, rowIndex: number, cellIndex: number, value: string): void {
    const tables = this.parseTables();
    if (tableIndex >= tables.length) return;

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) return;

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) return;

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
    if (tableIndex >= tables.length) return;

    const rows = this.parseRows(tables[tableIndex]);
    if (templateRowIndex >= rows.length) return;

    const templateRow = rows[templateRowIndex];

    // 데이터 행 생성 — 각 행마다 템플릿 복제 후 셀 값 교체
    const newRows: string[] = [];
    for (const data of dataRows) {
      const cells = this.parseCells(templateRow);
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
    if (tableIndex >= tables.length) return;

    const rows = this.parseRows(tables[tableIndex]);
    if (rowIndex >= rows.length) return;

    const cells = this.parseCells(rows[rowIndex]);
    if (cellIndex >= cells.length) return;

    cells[cellIndex] = this.replaceCellWithImage(cells[cellIndex], imageXml);
    rows[rowIndex] = this.rebuildRow(rows[rowIndex], cells);
    tables[tableIndex] = this.rebuildTable(tables[tableIndex], rows);
    this.documentXml = this.rebuildDocument(tables);
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

    // 첫 번째 rPr 보존
    const rPrMatch = cellXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
    const rPr = rPrMatch ? rPrMatch[0] : '';

    // 셀 시작 태그 유지
    const startTag = cellXml.match(/^<w:tc[\s>][^>]*>/)?.[0] ?? '<w:tc>';

    return `${startTag}${tcPr}<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${this.escapeXml(newText)}</w:t></w:r></w:p></w:tc>`;
  }

  private replaceCellWithImage(cellXml: string, imageXml: string): string {
    const tcPrMatch = cellXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : '';
    const pPrMatch = cellXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/);
    const pPr = pPrMatch ? pPrMatch[0] : '';
    const startTag = cellXml.match(/^<w:tc[\s>][^>]*>/)?.[0] ?? '<w:tc>';

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
