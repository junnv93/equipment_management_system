import PizZip from 'pizzip';
import {
  INSPECTION_JUDGMENT_LABELS,
  QP18_CLASSIFICATION_LABELS,
} from '@equipment-management/schemas';
import type { IStorageProvider } from '../../../common/storage/storage.interface';
import { IntermediateInspectionRendererService } from './intermediate-inspection-renderer.service';
import type { IntermediateInspectionExportData } from './intermediate-inspection-export-data.service';

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
 * 중간점검표(UL-QP-18-03) 레이아웃에 맞는 최소 DOCX Buffer 생성.
 *  T0(HEADER): 11행×5열 — 헤더(R0~R5) + 빈행 4개(R6~R9) + 여유 1행
 *  T1(MEASURE_EQUIPMENT): 6행×4열 — 타이틀+헤더(R0~R1) + 빈행 3개(R2~R4) + 여유 1행
 *  T2(SIGN_OFF): 3행×7열 — SIGN_OFF_CELLS max col=6
 */
function createIntermediateInspectionDocx(): Buffer {
  const tablesXml =
    makeTable(11, 5) + // T0
    makeTable(6, 4) + // T1
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
  overrides: Partial<IntermediateInspectionExportData> = {}
): IntermediateInspectionExportData {
  return {
    inspectionId: 'test-id',
    managementNumber: 'EQ-TEST-001',
    equipmentName: '오실로스코프',
    inspectionDate: null,
    remarks: '',
    header: {
      classification: 'calibrated',
      teamName: '수원 FCC팀',
      managementNumber: 'EQ-TEST-001',
      location: '수원 EMC 챔버',
      equipmentName: '오실로스코프',
      modelName: 'DS1054Z',
      inspectionCycle: '6개월',
      validityPeriod: '2025-12-31',
    },
    items: [],
    measureEquipment: [],
    itemPhotos: [],
    inspector: { name: '홍길동', signaturePath: null },
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

describe('IntermediateInspectionRendererService', () => {
  let service: IntermediateInspectionRendererService;
  let templateBuf: Buffer;

  beforeAll(() => {
    service = new IntermediateInspectionRendererService(mockStorage);
    templateBuf = createIntermediateInspectionDocx();
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

  it('header.classification "calibrated" → QP18_CLASSIFICATION_LABELS 라벨이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData();
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(QP18_CLASSIFICATION_LABELS['calibrated']);
  });

  // ── SSOT 라벨 — INSPECTION_JUDGMENT_LABELS ───────────────────────────────

  it('item.judgment "pass" → INSPECTION_JUDGMENT_LABELS "합격" 경유 출력 XML에 포함', async () => {
    const data = makeMinimalData({
      items: [
        {
          id: 'item-pass',
          itemNumber: 1,
          checkItem: '외관 검사',
          checkCriteria: '손상 없음',
          resultText: '정상',
          judgment: 'pass',
          rawMultilineResult: null,
        },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(INSPECTION_JUDGMENT_LABELS['pass']);
  });

  it('item.judgment "fail" → INSPECTION_JUDGMENT_LABELS "불합격" 경유 출력 XML에 포함', async () => {
    const data = makeMinimalData({
      items: [
        {
          id: 'item-fail',
          itemNumber: 1,
          checkItem: '기능 검사',
          checkCriteria: '정상 동작',
          resultText: '불량',
          judgment: 'fail',
          rawMultilineResult: null,
        },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(INSPECTION_JUDGMENT_LABELS['fail']);
  });

  // ── 빈 행 처리 ────────────────────────────────────────────────────────────

  it('items 배열이 비어 있어도 에러 없이 완료된다', async () => {
    await expect(
      service.render(makeMinimalData({ items: [] }), templateBuf)
    ).resolves.toBeDefined();
  });

  it('measureEquipment 배열이 비어 있어도 에러 없이 완료된다', async () => {
    await expect(
      service.render(makeMinimalData({ measureEquipment: [] }), templateBuf)
    ).resolves.toBeDefined();
  });

  it('itemPhotos 배열이 비어 있으면 storage.download를 호출하지 않는다', async () => {
    jest.clearAllMocks();
    await service.render(makeMinimalData({ itemPhotos: [] }), templateBuf);
    expect(mockStorage.download).not.toHaveBeenCalled();
  });
});
