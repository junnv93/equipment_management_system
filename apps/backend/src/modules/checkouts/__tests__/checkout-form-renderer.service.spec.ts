import PizZip from 'pizzip';
import { CheckoutFormRendererService } from '../services/checkout-form-renderer.service';
import { MERGED_TEXT_COL, ROWS } from '../services/checkout-form.layout';
import type { CheckoutFormExportData } from '../services/checkout-form-export-data.service';
import type { IStorageProvider } from '../../../common/storage/storage.interface';

// ── DOCX fixture ─────────────────────────────────────────────────────────────

function makeRow(colCount: number): string {
  return (
    '<w:tr>' +
    Array.from({ length: colCount }, () => '<w:tc><w:p><w:r><w:t>x</w:t></w:r></w:p></w:tc>').join(
      ''
    ) +
    '</w:tr>'
  );
}

function makeTable(rowCount: number, colCount: number): string {
  return (
    '<w:tbl>' + Array.from({ length: rowCount }, () => makeRow(colCount)).join('') + '</w:tbl>'
  );
}

/**
 * UL-QP-18-06 레이아웃에 맞는 최소 DOCX Buffer.
 * 단일 테이블: 26행(R0~R25) × 7열(C0~C6).
 * ITEM_COLS.conditionAfter = 6, SIGN_OFF_COLS.approver = 2, MERGED_TEXT_COL = 0.
 */
function createCheckoutFormDocx(): Buffer {
  const tablesXml = makeTable(26, 7); // T0
  const documentXml = `<w:document><w:body>${tablesXml}</w:body></w:document>`;

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

// ── MinimalData factory ───────────────────────────────────────────────────────

function makeMinimalData(overrides: Partial<CheckoutFormExportData> = {}): CheckoutFormExportData {
  return {
    destination: '수원 RF팀',
    phoneNumber: '031-000-0000',
    address: '경기도 수원시',
    reason: '외부 교정',
    checkoutDate: new Date('2026-04-01'),
    actualReturnDate: new Date('2026-04-10'),
    inspectionNotes: null,
    items: [],
    conditionCheckout: null,
    conditionReturn: null,
    requester: { name: '홍길동', signaturePath: null },
    approver: { name: '김철수', signaturePath: null },
    ...overrides,
  };
}

// ── Mock Storage ──────────────────────────────────────────────────────────────

const mockStorage: IStorageProvider = {
  ensureContainer: jest.fn(),
  upload: jest.fn(),
  download: jest.fn().mockResolvedValue(Buffer.from([])),
  delete: jest.fn(),
  supportsPresignedUrl: jest.fn().mockReturnValue(false),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CheckoutFormRendererService', () => {
  let service: CheckoutFormRendererService;
  let templateBuf: Buffer;

  beforeAll(() => {
    service = new CheckoutFormRendererService(mockStorage);
    templateBuf = createCheckoutFormDocx();
  });

  it('최소 데이터로 render()를 호출하면 Buffer를 반환한다', async () => {
    const result = await service.render(makeMinimalData(), templateBuf);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('MERGED_TEXT_COL 상수는 0이다 — 병합 셀은 열 인덱스 0', () => {
    expect(MERGED_TEXT_COL).toBe(0);
  });

  it('반출 확인 문장(checkoutConfirmText)이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData({
      requester: { name: '테스트반출자', signaturePath: null },
      checkoutDate: new Date('2026-04-01'),
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('아래 목록과 같이 측정장비를 반출하였음을 확인합니다.');
    expect(xml).toContain('테스트반출자');
  });

  it('반입 확인 문장(returnConfirmText)이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData({
      requester: { name: '테스트반입자', signaturePath: null },
      actualReturnDate: new Date('2026-04-10'),
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('상기 목록과 같이 측정장비를 이상없이 반입하였음을 확인합니다.');
    expect(xml).toContain('테스트반입자');
  });

  it('ROWS.checkoutConfirmText = 5, ROWS.returnConfirmText = 24 — SSOT 레이아웃 일치', () => {
    expect(ROWS.checkoutConfirmText).toBe(5);
    expect(ROWS.returnConfirmText).toBe(24);
  });
});
