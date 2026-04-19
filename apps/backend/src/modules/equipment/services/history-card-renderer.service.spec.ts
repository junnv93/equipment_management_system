import PizZip from 'pizzip';
import { CHECKBOX_PATTERNS, APPROVAL_DATE_PLACEHOLDER } from './history-card.layout';
import type { IStorageProvider } from '../../../common/storage/storage.interface';
import { HistoryCardRendererService } from './history-card-renderer.service';
import type { HistoryCardData, HistoryCardEquipmentInfo } from './history-card-data.service';
import type { TimelineEntry } from './equipment-timeline.types';

// ── DOCX 픽스처 헬퍼 ─────────────────────────────────────────────────────────

/** 라벨 텍스트 + N개 빈 셀 */
function makeLabeledRow(label: string, emptyCells: number): string {
  const labelCell = `<w:tc><w:p><w:r><w:t>${label}</w:t></w:r></w:p></w:tc>`;
  const empty = Array.from({ length: emptyCells }, () => '<w:tc><w:p></w:p></w:tc>').join('');
  return `<w:tr>${labelCell}${empty}</w:tr>`;
}

/** 섹션: 제목행 + (headerSkip-1)개 헤더행 + emptyRows개 빈 데이터행 */
function makeSection(title: string, headerSkip: number, emptyRows: number, cols: number): string {
  const titleRow = `<w:tr><w:tc><w:p><w:r><w:t>${title}</w:t></w:r></w:p></w:tc></w:tr>`;
  const headerRows = Array.from(
    { length: headerSkip - 1 },
    () => '<w:tr><w:tc><w:p><w:r><w:t>헤더</w:t></w:r></w:p></w:tc></w:tr>'
  ).join('');
  const dataRows = Array.from(
    { length: emptyRows },
    () => `<w:tr>${Array.from({ length: cols }, () => '<w:tc><w:p></w:p></w:tc>').join('')}</w:tr>`
  ).join('');
  return titleRow + headerRows + dataRows;
}

/**
 * UL-QP-18-02 이력카드 최소 DOCX 픽스처.
 *
 * 모든 CELL_LABELS, CHECKBOX_PATTERNS, APPROVAL_DATE_PLACEHOLDER,
 * MANUAL_LOCATION_REGEX, SECTIONS, EQUIPMENT_PHOTO_ANCHOR을 포함한다.
 */
function createHistoryCardDocx(): Buffer {
  const infoRows = [
    makeLabeledRow('관  리', 1), // MANAGEMENT_NUMBER
    makeLabeledRow('산  번', 1), // ASSET_NUMBER
    makeLabeledRow('장    비    명', 1), // EQUIPMENT_NAME
    makeLabeledRow('부 속 품', 1), // ACCESSORIES
    makeLabeledRow('제  조', 1), // MANUFACTURER
    makeLabeledRow('제조사  연락처', 1), // MANUFACTURER_CONTACT
    makeLabeledRow('공    급    사', 1), // SUPPLIER
    makeLabeledRow('공급사  연락처', 1), // SUPPLIER_CONTACT
    makeLabeledRow('일 련', 1), // SERIAL_NUMBER
    makeLabeledRow('운  영 책임자', 1), // MANAGER
    makeLabeledRow('교  정  주  기', 3), // CALIBRATION_CYCLE(idx=0) + DEPUTY_MANAGER(idx=1)
    makeLabeledRow('최초 설치 위치', 1), // INITIAL_LOCATION
    makeLabeledRow('설 치  일', 1), // INSTALLATION_DATE
    makeLabeledRow('시험설비 이력카드', 1), // APPROVER_PANEL
    // Approval date placeholder
    `<w:tr><w:tc><w:p><w:r><w:t>${APPROVAL_DATE_PLACEHOLDER}</w:t></w:r></w:p></w:tc></w:tr>`,
    // Checkboxes
    `<w:tr><w:tc><w:p><w:r><w:t>${CHECKBOX_PATTERNS.SPEC_MATCH.template}</w:t></w:r></w:p></w:tc></w:tr>`,
    `<w:tr><w:tc><w:p><w:r><w:t>${CHECKBOX_PATTERNS.CALIBRATION_REQUIRED.template}</w:t></w:r></w:p></w:tc></w:tr>`,
    // Manual location regex target: MANUAL_LOCATION_REGEX = /(<w:t[^>]*>)\s*\)/
    '<w:tr><w:tc><w:p><w:r><w:t> )</w:t></w:r></w:p></w:tc></w:tr>',
  ].join('');

  const sectionsXml = [
    makeSection('장비 위치 변동 이력', 2, 5, 3), // LOCATION
    makeSection('장비 교정 이력', 2, 9, 3), // CALIBRATION
    makeSection('장비 유지보수 내역', 2, 8, 2), // MAINTENANCE
    makeSection('장비 손상, 오작동', 2, 8, 2), // UNIFIED_INCIDENT
  ].join('');

  // Photo anchor: "사진" 셀 + 다음 빈 셀
  const photoRow =
    '<w:tr>' +
    '<w:tc><w:p><w:r><w:t>사진</w:t></w:r></w:p></w:tc>' +
    '<w:tc><w:p></w:p></w:tc>' +
    '</w:tr>';

  const documentXml =
    `<w:document><w:body>` +
    `<w:tbl>${infoRows}</w:tbl>` +
    sectionsXml +
    `<w:tbl>${photoRow}</w:tbl>` +
    `</w:body></w:document>`;

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

// ── 최소 HistoryCardData 팩토리 ──────────────────────────────────────────────

function makeMinimalEquipment(
  overrides: Partial<HistoryCardEquipmentInfo> = {}
): HistoryCardEquipmentInfo {
  return {
    managementNumber: 'MGT-001',
    name: '스펙트럼 분석기',
    modelName: 'R&S FSV3000',
    manufacturer: 'Rohde & Schwarz',
    serialNumber: 'SN123456',
    status: 'available',
    site: 'suwon',
    location: '수원 RF 챔버',
    teamName: '수원 RF팀',
    managerName: '홍길동',
    deputyManagerName: '김철수',
    purchaseYear: '2023',
    installationDate: '2023/01/15',
    description: '',
    assetNumber: 'ASSET-001',
    accessories: '',
    manufacturerContact: '',
    supplier: '',
    supplierContact: '',
    specMatch: '일치',
    calibrationRequired: '필요',
    calibrationCycle: '12개월',
    managementMethod: '',
    manualLocation: '창고 A',
    initialLocation: '수원 RF 챔버',
    needsIntermediateCheck: '',
    approverName: '이관리',
    approvalDate: '2023/01/15',
    ...overrides,
  };
}

function makeMinimalData(overrides: Partial<HistoryCardData> = {}): HistoryCardData {
  return {
    equipment: makeMinimalEquipment(),
    calibrations: [],
    locationHistory: [],
    maintenanceHistory: [],
    timeline: [],
    approverSignaturePath: null,
    equipmentPhotoPath: null,
    generatedAt: '2026-04-19',
    ...overrides,
  };
}

// ── Mock Storage ──────────────────────────────────────────────────────────────

const mockStorage: IStorageProvider = {
  ensureContainer: jest.fn(),
  upload: jest.fn(),
  download: jest.fn().mockResolvedValue(Buffer.alloc(100)),
  delete: jest.fn(),
  supportsPresignedUrl: jest.fn().mockReturnValue(false),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HistoryCardRendererService', () => {
  let service: HistoryCardRendererService;
  let templateBuf: Buffer;

  beforeAll(() => {
    service = new HistoryCardRendererService(mockStorage);
    templateBuf = createHistoryCardDocx();
  });

  // ── smoke ──────────────────────────────────────────────────────────────────

  it('최소 데이터로 render()를 호출하면 Buffer를 반환한다', async () => {
    const result = await service.render(makeMinimalData(), templateBuf);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  // ── 서명/사진 미경로 — storage 미호출 ──────────────────────────────────────

  it('approverSignaturePath/equipmentPhotoPath null → storage.download 미호출', async () => {
    jest.clearAllMocks();
    await service.render(makeMinimalData(), templateBuf);
    expect(mockStorage.download).not.toHaveBeenCalled();
  });

  // ── 승인일 APPROVAL_DATE_PLACEHOLDER 치환 ─────────────────────────────────

  it('approvalDate 값이 출력 XML에서 APPROVAL_DATE_PLACEHOLDER를 대체한다', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ approvalDate: '2026/04/19' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('2026/04/19');
    expect(xml).not.toContain(APPROVAL_DATE_PLACEHOLDER);
  });

  // ── 체크박스 — SPEC_MATCH ────────────────────────────────────────────────

  it('specMatch="일치" → CHECKBOX_PATTERNS.SPEC_MATCH.checked_match 포함', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ specMatch: '일치' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(CHECKBOX_PATTERNS.SPEC_MATCH.checked_match);
    expect(xml).not.toContain(CHECKBOX_PATTERNS.SPEC_MATCH.template);
  });

  it('specMatch="불일치" → CHECKBOX_PATTERNS.SPEC_MATCH.checked_mismatch 포함', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ specMatch: '불일치' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(CHECKBOX_PATTERNS.SPEC_MATCH.checked_mismatch);
  });

  // ── 체크박스 — CALIBRATION_REQUIRED ─────────────────────────────────────

  it('calibrationRequired="필요" → CHECKBOX_PATTERNS.CALIBRATION_REQUIRED.checked_required 포함', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ calibrationRequired: '필요' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(CHECKBOX_PATTERNS.CALIBRATION_REQUIRED.checked_required);
    expect(xml).not.toContain(CHECKBOX_PATTERNS.CALIBRATION_REQUIRED.template);
  });

  it('calibrationRequired="불필요" → CHECKBOX_PATTERNS.CALIBRATION_REQUIRED.checked_not_required 포함', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ calibrationRequired: '불필요' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain(CHECKBOX_PATTERNS.CALIBRATION_REQUIRED.checked_not_required);
  });

  // ── 보관장소 MANUAL_LOCATION_REGEX ────────────────────────────────────────

  it('manualLocation 값이 출력 XML에 포함된다', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ manualLocation: '창고 B 3번 선반' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('창고 B 3번 선반');
  });

  // ── 이력 섹션 데이터 주입 ────────────────────────────────────────────────

  it('locationHistory 데이터가 출력 XML에 포함된다', async () => {
    const data = makeMinimalData({
      locationHistory: [
        { changedAt: '2025/01/01', previousLocation: '', newLocation: '수원 A구역', notes: '' },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('수원 A구역');
  });

  it('calibrations 데이터가 출력 XML에 포함된다', async () => {
    const data = makeMinimalData({
      calibrations: [
        {
          calibrationDate: '2025/03/01',
          nextCalibrationDate: '2026/03/01',
          status: 'approved',
          result: '합격',
          agency: 'KRISS',
          technicianId: '',
          certificateNumber: '',
        },
      ],
    });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('합격 (KRISS)');
  });

  it('timeline 데이터가 출력 XML에 포함된다', async () => {
    const entry: TimelineEntry = {
      occurredAt: new Date('2025-06-15'),
      type: 'repair_record',
      label: '수리',
      content: '전원부 교체',
      sourceTable: 'repair',
      sourceId: 'repair-001',
    };
    const data = makeMinimalData({ timeline: [entry] });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('[수리]');
    expect(xml).toContain('전원부 교체');
  });

  // ── 빈 배열 처리 — 에러 없음 ────────────────────────────────────────────

  it('모든 이력 배열이 비어 있어도 에러 없이 완료된다', async () => {
    await expect(
      service.render(
        makeMinimalData({
          calibrations: [],
          locationHistory: [],
          maintenanceHistory: [],
          timeline: [],
        }),
        templateBuf
      )
    ).resolves.toBeInstanceOf(Buffer);
  });

  // ── equipmentName 셀 주입 확인 ───────────────────────────────────────────

  it('equipment.name이 장비명 셀에 주입된다', async () => {
    const data = makeMinimalData();
    data.equipment = makeMinimalEquipment({ name: '네트워크 분석기 Pro' });
    const outBuf = await service.render(data, templateBuf);
    const xml = new PizZip(outBuf).file('word/document.xml')!.asText();
    expect(xml).toContain('네트워크 분석기 Pro');
  });
});
