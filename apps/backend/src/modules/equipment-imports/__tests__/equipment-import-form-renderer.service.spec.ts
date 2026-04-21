import PizZip from 'pizzip';
import { EquipmentImportFormRendererService } from '../services/equipment-import-form-renderer.service';
import { MERGED_TEXT_COL, ROWS } from '../services/equipment-import-form.layout';
import type { EquipmentImportFormExportData } from '../services/equipment-import-form-export-data.service';
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
 * UL-QP-18-10 레이아웃에 맞는 최소 DOCX Buffer.
 * 단일 테이블: 25행(R0~R24) × 7열(C0~C6).
 * ITEM_COLS.conditionAfter = 6, MERGED_TEXT_COL = 0.
 */
function createEquipmentImportFormDocx(): Buffer {
  const tablesXml = makeTable(25, 7); // T0
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

function makeMinimalData(
  overrides: Partial<EquipmentImportFormExportData> = {}
): EquipmentImportFormExportData {
  return {
    teamName: '수원 RF팀',
    ownerDepartment: '구매팀',
    usageLocation: '수원 RF 챔버',
    usagePeriodStart: new Date('2026-04-01'),
    usagePeriodEnd: new Date('2026-04-10'),
    reason: '성능 테스트',
    equipmentName: '오실로스코프',
    modelName: 'DSO-1234',
    quantityOut: 1,
    quantityReturned: 1,
    managementLabel: 'EQ-001',
    receivingAppearance: 'normal',
    returnedAppearance: 'normal',
    returnedAbnormality: 'none',
    returnedAbnormalDetails: null,
    receivedAt: new Date('2026-04-10'),
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

describe('EquipmentImportFormRendererService', () => {
  let service: EquipmentImportFormRendererService;
  let templateBuf: Buffer;

  beforeAll(() => {
    service = new EquipmentImportFormRendererService(mockStorage);
    templateBuf = createEquipmentImportFormDocx();
  });

  it('최소 데이터로 render()를 호출하면 Buffer를 반환한다', async () => {
    const result = await service.render(makeMinimalData(), templateBuf);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('MERGED_TEXT_COL 상수는 0이다 — 병합 셀은 열 인덱스 0', () => {
    expect(MERGED_TEXT_COL).toBe(0);
  });

  it('사용 확인 문장(usageConfirmText)이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData({
      requester: { name: '테스트사용자', signaturePath: null },
      usagePeriodStart: new Date('2026-04-01'),
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('아래 목록과 같이 공용장비 사용(반출)을 확인합니다.');
    expect(xml).toContain('테스트사용자');
  });

  it('반납 확인 문장(returnConfirmText)이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData({
      requester: { name: '테스트반납자', signaturePath: null },
      receivedAt: new Date('2026-04-10'),
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('상기 목록과 같이 공용 장비를 이상없이 반납하였음을 확인합니다.');
    expect(xml).toContain('테스트반납자');
  });

  it('ROWS.usageConfirmText = 5, ROWS.returnConfirmText = 24 — SSOT 레이아웃 일치', () => {
    expect(ROWS.usageConfirmText).toBe(5);
    expect(ROWS.returnConfirmText).toBe(24);
  });
});
