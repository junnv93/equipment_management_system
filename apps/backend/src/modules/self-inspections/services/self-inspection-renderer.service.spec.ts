import PizZip from 'pizzip';
import {
  QP18_CLASSIFICATION_LABELS,
  SELF_INSPECTION_RESULT_LABELS,
} from '@equipment-management/schemas';
import type { IStorageProvider } from '../../../common/storage/storage.interface';
import { SelfInspectionRendererService } from './self-inspection-renderer.service';
import type { SelfInspectionExportData } from './self-inspection-export-data.service';

// ── DOCX 픽스처 헬퍼 ────────────────────────────────────────────────────────

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
 * 자체점검표(UL-QP-18-05) 레이아웃에 맞는 최소 DOCX Buffer 생성.
 *  T0(HEADER): 13행×4열 — 헤더(R0~R5) + 빈행 6개(R6~R11) + 여유 1행. col 최대 3(HEADER_CELLS 기준) → 4열
 *  T1(SPECIAL_NOTES): 4행×3열 — 타이틀(R0) + 빈행 2개(R1~R2) + 여유 1행
 *  T2(SIGN_OFF): 3행×7열 — SIGN_OFF_CELLS max col=6
 */
function createSelfInspectionDocx(): Buffer {
  const tablesXml =
    makeTable(13, 4) + // T0
    makeTable(4, 3) + // T1
    makeTable(3, 7); // T2
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

// ── 최소 ExportData 팩토리 ───────────────────────────────────────────────────

function makeMinimalData(
  overrides: Partial<SelfInspectionExportData> = {}
): SelfInspectionExportData {
  return {
    recordId: 'test-record-id',
    managementNumber: 'EQ-SELF-001',
    equipmentName: '멀티미터',
    inspectionDate: null,
    remarks: '',
    header: {
      classification: 'non_calibrated',
      teamName: '수원 RF팀',
      managementNumber: 'EQ-SELF-001',
      location: '수원 RF 챔버',
      equipmentName: '멀티미터',
      modelName: 'Fluke 87V',
      inspectionCycle: '12개월',
      validityPeriod: '-',
    },
    items: [],
    specialNotes: [],
    itemPhotos: [],
    inspector: { name: '홍길동', signaturePath: null },
    submitter: { name: '홍길동', signaturePath: null },
    approver: { name: '김철수', signaturePath: null },
    resultSections: {
      sections: [],
      documentPaths: new Map(),
    },
    ...overrides,
  };
}

// ── Mock Storage ─────────────────────────────────────────────────────────────

const mockStorage: IStorageProvider = {
  ensureContainer: jest.fn(),
  upload: jest.fn(),
  download: jest.fn().mockResolvedValue(Buffer.from([])),
  delete: jest.fn(),
  supportsPresignedUrl: jest.fn().mockReturnValue(false),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SelfInspectionRendererService', () => {
  let service: SelfInspectionRendererService;
  let templateBuf: Buffer;

  beforeAll(() => {
    service = new SelfInspectionRendererService(mockStorage);
    templateBuf = createSelfInspectionDocx();
  });

  // ── smoke test ────────────────────────────────────────────────────────────

  it('최소 데이터로 render()를 호출하면 Buffer를 반환한다', async () => {
    const result = await service.render(makeMinimalData(), templateBuf);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('서명 이미지 경로 null → storage.download 미호출, 에러 없음', async () => {
    jest.clearAllMocks();
    await service.render(makeMinimalData(), templateBuf);
    expect(mockStorage.download).not.toHaveBeenCalled();
  });

  // ── SSOT 라벨 — QP18_CLASSIFICATION_LABELS ───────────────────────────────

  it('header.classification "non_calibrated" → QP18_CLASSIFICATION_LABELS 라벨이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData();
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(QP18_CLASSIFICATION_LABELS['non_calibrated']);
  });

  // ── SSOT 라벨 — SELF_INSPECTION_RESULT_LABELS ────────────────────────────

  it('item.checkResult "pass" → SELF_INSPECTION_RESULT_LABELS "이상 없음" 경유 출력 XML에 포함', async () => {
    const data = makeMinimalData({
      items: [
        {
          id: 'item-1',
          itemNumber: 1,
          checkItem: '외관 검사',
          checkResult: 'pass',
          detailedResult: null,
        },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(SELF_INSPECTION_RESULT_LABELS['pass']);
  });

  it('item.checkResult "fail" → SELF_INSPECTION_RESULT_LABELS "부적합" 경유 출력 XML에 포함', async () => {
    const data = makeMinimalData({
      items: [
        {
          id: 'item-2',
          itemNumber: 1,
          checkItem: '기능 검사',
          checkResult: 'fail',
          detailedResult: null,
        },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(SELF_INSPECTION_RESULT_LABELS['fail']);
  });

  it('item.checkResult "na" → SELF_INSPECTION_RESULT_LABELS "N/A" 경유 출력 XML에 포함', async () => {
    const data = makeMinimalData({
      items: [
        {
          id: 'item-3',
          itemNumber: 1,
          checkItem: '해당 없음',
          checkResult: 'na',
          detailedResult: null,
        },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(SELF_INSPECTION_RESULT_LABELS['na']);
  });

  // ── 빈 행 처리 ────────────────────────────────────────────────────────────

  it('specialNotes 배열이 비어 있어도 에러 없이 완료된다', async () => {
    await expect(
      service.render(makeMinimalData({ specialNotes: [] }), templateBuf)
    ).resolves.toBeDefined();
  });

  it('items 배열이 비어 있어도 에러 없이 완료된다', async () => {
    await expect(
      service.render(makeMinimalData({ items: [] }), templateBuf)
    ).resolves.toBeDefined();
  });

  it('itemPhotos 배열이 비어 있으면 storage.download를 호출하지 않는다', async () => {
    jest.clearAllMocks();
    await service.render(makeMinimalData({ itemPhotos: [] }), templateBuf);
    expect(mockStorage.download).not.toHaveBeenCalled();
  });
});
