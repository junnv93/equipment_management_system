import PizZip from 'pizzip';
import { DocxTemplate } from '../docx-template.util';

/**
 * 최소 docx 구조를 가진 테스트용 Buffer 생성
 */
function createTestDocxBuffer(documentXml: string): Buffer {
  const zip = new PizZip();
  zip.file('word/document.xml', documentXml);
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>'
  );
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '</Types>'
  );
  return Buffer.from(zip.generate({ type: 'nodebuffer' }));
}

/** 간단한 1x1 테이블 docx XML */
const SIMPLE_TABLE_XML =
  '<w:document>' +
  '<w:body>' +
  '<w:tbl>' +
  '<w:tr><w:tc><w:p><w:r><w:t>Hello</w:t></w:r></w:p></w:tc></w:tr>' +
  '</w:tbl>' +
  '</w:body>' +
  '</w:document>';

/** 2x3 테이블 (2행 3열) */
const TWO_ROW_TABLE_XML =
  '<w:document>' +
  '<w:body>' +
  '<w:tbl>' +
  '<w:tr><w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>C1</w:t></w:r></w:p></w:tc></w:tr>' +
  '<w:tr><w:tc><w:p><w:r><w:t>A2</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B2</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>C2</w:t></w:r></w:p></w:tc></w:tr>' +
  '</w:tbl>' +
  '</w:body>' +
  '</w:document>';

describe('DocxTemplate', () => {
  // -----------------------------------------------------------------------
  // constructor
  // -----------------------------------------------------------------------
  describe('constructor', () => {
    it('should parse a valid docx buffer', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      expect(() => new DocxTemplate(buf)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // setCellValue()
  // -----------------------------------------------------------------------
  describe('setCellValue()', () => {
    it('should replace cell text in a simple table', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      tpl.setCellValue(0, 0, 0, 'World');

      const output = tpl.toBuffer();
      const zip = new PizZip(output);
      const xml = zip.file('word/document.xml')!.asText();

      expect(xml).toContain('World');
      expect(xml).not.toContain('>Hello<');
    });

    it('should escape XML special characters', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      tpl.setCellValue(0, 0, 0, '<Test & "Quotes">');

      const output = tpl.toBuffer();
      const zip = new PizZip(output);
      const xml = zip.file('word/document.xml')!.asText();

      expect(xml).toContain('&lt;Test &amp; &quot;Quotes&quot;&gt;');
    });

    it('should throw for out-of-bounds table index', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      expect(() => tpl.setCellValue(99, 0, 0, 'value')).toThrow('table[99] 없음');
    });

    it('should throw for out-of-bounds row index', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      expect(() => tpl.setCellValue(0, 99, 0, 'value')).toThrow('row[99]');
    });

    it('should throw for out-of-bounds cell index', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      expect(() => tpl.setCellValue(0, 0, 99, 'value')).toThrow('cell[99] 없음');
    });
  });

  // -----------------------------------------------------------------------
  // setDataRows()
  // -----------------------------------------------------------------------
  describe('setDataRows()', () => {
    it('should replace template row with data rows', () => {
      const buf = createTestDocxBuffer(TWO_ROW_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      // row 1 (index 1) is template, replace with 3 data rows, 0 empty trailing rows
      tpl.setDataRows(
        0,
        1,
        [
          ['X1', 'Y1', 'Z1'],
          ['X2', 'Y2', 'Z2'],
          ['X3', 'Y3', 'Z3'],
        ],
        0
      );

      const output = tpl.toBuffer();
      const zip = new PizZip(output);
      const xml = zip.file('word/document.xml')!.asText();

      expect(xml).toContain('X1');
      expect(xml).toContain('Y2');
      expect(xml).toContain('Z3');
      // header row preserved
      expect(xml).toContain('A1');
      // original template row data removed
      expect(xml).not.toContain('>A2<');
    });

    it('should throw for out-of-bounds table index', () => {
      const buf = createTestDocxBuffer(TWO_ROW_TABLE_XML);
      const tpl = new DocxTemplate(buf);

      expect(() => tpl.setDataRows(99, 0, [['X']], 0)).toThrow('table[99] 없음');
    });
  });

  // -----------------------------------------------------------------------
  // setSignatureImage()
  // -----------------------------------------------------------------------
  describe('setSignatureImage()', () => {
    it('should insert image resource into the docx', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);
      const fakeImage = Buffer.from('PNG_DATA');

      tpl.setSignatureImage(0, 0, 0, fakeImage, 'png');

      const output = tpl.toBuffer();
      const zip = new PizZip(output);

      // Check image was added to media folder
      const imageFile = zip.file('word/media/sig_1.png');
      expect(imageFile).toBeDefined();

      // Check relationship was added
      const rels = zip.file('word/_rels/document.xml.rels')!.asText();
      expect(rels).toContain('sig_1.png');

      // Check content types updated
      const ct = zip.file('[Content_Types].xml')!.asText();
      expect(ct).toContain('Extension="png"');

      // Check document contains drawing
      const xml = zip.file('word/document.xml')!.asText();
      expect(xml).toContain('w:drawing');
    });

    it('should handle jpeg images', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);
      const fakeImage = Buffer.from('JPEG_DATA');

      tpl.setSignatureImage(0, 0, 0, fakeImage, 'jpeg');

      const output = tpl.toBuffer();
      const zip = new PizZip(output);

      const ct = zip.file('[Content_Types].xml')!.asText();
      expect(ct).toContain('Extension="jpeg"');
    });

    it('should not duplicate content type entry for same extension', () => {
      const buf = createTestDocxBuffer(TWO_ROW_TABLE_XML);
      const tpl = new DocxTemplate(buf);
      const fakeImage = Buffer.from('IMG');

      tpl.setSignatureImage(0, 0, 0, fakeImage, 'png');
      tpl.setSignatureImage(0, 1, 0, fakeImage, 'png');

      const output = tpl.toBuffer();
      const zip = new PizZip(output);
      const ct = zip.file('[Content_Types].xml')!.asText();

      const pngCount = (ct.match(/Extension="png"/g) ?? []).length;
      expect(pngCount).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // toBuffer()
  // -----------------------------------------------------------------------
  describe('toBuffer()', () => {
    it('should return a valid zip buffer', () => {
      const buf = createTestDocxBuffer(SIMPLE_TABLE_XML);
      const tpl = new DocxTemplate(buf);
      const output = tpl.toBuffer();

      expect(output).toBeInstanceOf(Buffer);
      expect(output.length).toBeGreaterThan(0);

      // Should be parseable as a zip
      expect(() => new PizZip(output)).not.toThrow();
    });
  });

  // -----------------------------------------------------------------------
  // preserving formatting
  // -----------------------------------------------------------------------
  describe('formatting preservation', () => {
    it('should preserve tcPr and pPr when replacing cell text', () => {
      const xmlWithFormatting =
        '<w:document><w:body><w:tbl>' +
        '<w:tr><w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr>' +
        '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>' +
        '<w:r><w:rPr><w:b/></w:rPr><w:t>Old</w:t></w:r></w:p></w:tc></w:tr>' +
        '</w:tbl></w:body></w:document>';

      const buf = createTestDocxBuffer(xmlWithFormatting);
      const tpl = new DocxTemplate(buf);

      tpl.setCellValue(0, 0, 0, 'New');

      const output = tpl.toBuffer();
      const zip = new PizZip(output);
      const xml = zip.file('word/document.xml')!.asText();

      // tcPr preserved
      expect(xml).toContain('<w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr>');
      // pPr preserved
      expect(xml).toContain('<w:jc w:val="center"/>');
      // rPr (bold) preserved
      expect(xml).toContain('<w:b/>');
      // New text present
      expect(xml).toContain('New');
    });
  });
});
