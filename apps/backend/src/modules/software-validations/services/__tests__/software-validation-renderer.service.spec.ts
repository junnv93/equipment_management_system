import PizZip from 'pizzip';
import {
  FUNCTION_ITEM_ROWS,
  FUNCTION_ITEM_DATA_COL,
  CONTROL_DATA_START_ROW,
  CONTROL_MAX_ROWS,
  CONTROL_COLS,
} from '../software-validation.layout';
import type { IStorageProvider } from '../../../../common/storage/storage.interface';
import { SoftwareValidationRendererService } from '../software-validation-renderer.service';
import type { FormTemplateService } from '../../../reports/form-template.service';
import type { SoftwareValidationExportData } from '../software-validation-export-data.service';

// ── DOCX 픽스처 헬퍼 ─────────────────────────────────────────────────────────

function makeCell(cols: number): string {
  return Array.from({ length: cols }, () => '<w:tc><w:p><w:r><w:t></w:t></w:r></w:p></w:tc>').join(
    ''
  );
}

function makeRow(cols: number): string {
  return `<w:tr>${makeCell(cols)}</w:tr>`;
}

function makeTable(rows: number, cols: number): string {
  return `<w:tbl>${Array.from({ length: rows }, () => makeRow(cols)).join('')}</w:tbl>`;
}

/**
 * UL-QP-18-09 최소 DOCX 픽스처.
 * T0~T8 총 9개 테이블을 SSOT 레이아웃에 맞게 생성.
 * 셀 행/열 수는 layout.ts 상수에서 도출 (리터럴 금지).
 */
function createFixtureBuffer(): Buffer {
  const documentXml =
    `<w:document><w:body>` +
    makeTable(3, 2) + // T0 VENDOR_BASIC: 3행2열
    makeTable(1, 2) + // T1 VENDOR_CONTENT: 1행2열
    makeTable(3, 2) + // T2 VENDOR_RECEIPT: 3행2열
    makeTable(7, 2) + // T3 SELF_BASIC: 7행2열
    makeTable(FUNCTION_ITEM_ROWS.acceptanceCriteria + 1, 2) + // T4 ACQUISITION: name/method/criteria 행 수
    makeTable(FUNCTION_ITEM_ROWS.acceptanceCriteria + 1, 2) + // T5 PROCESSING
    makeTable(CONTROL_DATA_START_ROW + CONTROL_MAX_ROWS, Object.keys(CONTROL_COLS).length) + // T6 CONTROL
    makeTable(1, 2) + // T7 ACCEPTANCE
    makeTable(3, 2) + // T8 SIGN_OFF: testDate/performer/approvers
    `</w:body></w:document>`;

  const zip = new PizZip();
  zip.file('word/document.xml', documentXml);
  return Buffer.from(zip.generate({ type: 'nodebuffer' }));
}

// ── 공유 테스트 데이터 ─────────────────────────────────────────────────────────

const VENDOR_DATA: SoftwareValidationExportData = {
  validationType: 'vendor',
  status: 'quality_approved',
  softwareName: 'IECSoft',
  softwareVersion: '2.6-U',
  testDate: null,
  infoDate: new Date('2026-01-15'),
  softwareAuthor: null,
  vendorName: 'Newtons4th Ltd',
  vendorSummary: 'Standard update',
  receivedDate: new Date('2026-01-20'),
  attachmentNote: 'Scanned document',
  receiver: { name: 'Kim Minsu', signaturePath: null },
  referenceDocuments: null,
  operatingUnitDescription: null,
  softwareComponents: null,
  hardwareComponents: null,
  acquisitionFunctions: [],
  processingFunctions: [],
  controlFunctions: [],
  performer: null,
  techApprover: null,
  qualityApprover: null,
};

const SELF_BASE: SoftwareValidationExportData = {
  validationType: 'self',
  status: 'quality_approved',
  softwareName: 'DASY8',
  softwareVersion: '16.2',
  testDate: new Date('2026-02-10'),
  infoDate: null,
  softwareAuthor: 'SPEAG',
  vendorName: null,
  vendorSummary: null,
  receivedDate: null,
  attachmentNote: null,
  receiver: null,
  referenceDocuments: 'IEC 62209',
  operatingUnitDescription: 'SAR system',
  softwareComponents: 'DASY8 Module',
  hardwareComponents: 'EX3DV4',
  acquisitionFunctions: [],
  processingFunctions: [],
  controlFunctions: [],
  performer: { name: 'Lee Jisu', signaturePath: null },
  techApprover: { name: 'Park TM', signaturePath: null },
  qualityApprover: { name: 'Choi QM', signaturePath: null },
};

// ── 결과 버퍼 파싱 헬퍼 ────────────────────────────────────────────────────────

function extractDocXml(buffer: Buffer): string {
  const zip = new PizZip(buffer);
  return zip.file('word/document.xml')?.asText() ?? '';
}

// ── 테스트 ─────────────────────────────────────────────────────────────────────

describe('SoftwareValidationRendererService', () => {
  let service: SoftwareValidationRendererService;
  let storageMock: jest.Mocked<IStorageProvider>;
  let formTemplateServiceMock: jest.Mocked<Pick<FormTemplateService, 'getTemplateBuffer'>>;
  let fixtureBuffer: Buffer;

  beforeEach(() => {
    fixtureBuffer = createFixtureBuffer();
    storageMock = {
      upload: jest.fn(),
      download: jest.fn(),
      delete: jest.fn(),
      getPresignedUrl: jest.fn(),
      listFiles: jest.fn(),
    } as unknown as jest.Mocked<IStorageProvider>;

    formTemplateServiceMock = {
      getTemplateBuffer: jest.fn().mockResolvedValue(fixtureBuffer),
    };

    service = new SoftwareValidationRendererService(
      storageMock,
      formTemplateServiceMock as unknown as FormTemplateService
    );
  });

  // ── 1. Vendor smoke ───────────────────────────────────────────────────────────

  it('vendor render: 정상 완료 (에러 없음)', async () => {
    const result = await service.render(VENDOR_DATA);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  });

  // ── 2. Vendor T0 셀 좌표 매핑 ─────────────────────────────────────────────────

  it('vendor: vendorName이 T0 첫 번째 데이터 셀에 기록됨', async () => {
    const result = await service.render({ ...VENDOR_DATA, vendorName: 'TEST_VENDOR_NAME' });
    const xml = extractDocXml(result.buffer);
    expect(xml).toContain('TEST_VENDOR_NAME');
  });

  // ── 3. Self T4 획득기능 셀 좌표 매핑 ───────────────────────────────────────────

  it('self: acquisitionFunctions name → T4 FUNCTION_ITEM_ROWS.name 행에 기록됨', async () => {
    const data: SoftwareValidationExportData = {
      ...SELF_BASE,
      acquisitionFunctions: [
        { name: 'ACQ_NAME_TOKEN', independentMethod: 'method', acceptanceCriteria: 'criteria' },
      ],
    };
    const result = await service.render(data);
    const xml = extractDocXml(result.buffer);
    expect(xml).toContain('ACQ_NAME_TOKEN');
  });

  it('self: acquisitionFunctions independentMethod → T4 FUNCTION_ITEM_ROWS.independentMethod 행에 기록됨', async () => {
    const data: SoftwareValidationExportData = {
      ...SELF_BASE,
      acquisitionFunctions: [
        {
          name: 'ACQ_NAME',
          independentMethod: 'INDEPENDENT_METHOD_TOKEN',
          acceptanceCriteria: 'criteria',
        },
      ],
    };
    const result = await service.render(data);
    const xml = extractDocXml(result.buffer);
    expect(xml).toContain('INDEPENDENT_METHOD_TOKEN');
    // FUNCTION_ITEM_DATA_COL = 1 (col 0은 라벨)
    expect(FUNCTION_ITEM_DATA_COL).toBe(1);
  });

  // ── 4. Self T6 CONTROL_MAX_ROWS 슬라이싱 검증 ──────────────────────────────────

  it('self T6: CONTROL_MAX_ROWS(3)개 초과 항목은 슬라이싱 (4번째 항목 미기록)', async () => {
    const controlFunctions = [
      {
        equipmentFunction: 'CTRL_1',
        expectedFunction: 'EXP_1',
        observedFunction: 'OBS_1',
        acceptanceCriteria: 'AC_1',
        independentMethod: 'IM_1',
      },
      {
        equipmentFunction: 'CTRL_2',
        expectedFunction: 'EXP_2',
        observedFunction: 'OBS_2',
        acceptanceCriteria: 'AC_2',
        independentMethod: 'IM_2',
      },
      {
        equipmentFunction: 'CTRL_3',
        expectedFunction: 'EXP_3',
        observedFunction: 'OBS_3',
        acceptanceCriteria: 'AC_3',
        independentMethod: 'IM_3',
      },
      {
        equipmentFunction: 'CTRL_4_OVERFLOW',
        expectedFunction: 'EXP_4',
        observedFunction: 'OBS_4',
        acceptanceCriteria: 'AC_4',
        independentMethod: 'IM_4',
      },
    ];
    expect(controlFunctions.length).toBeGreaterThan(CONTROL_MAX_ROWS);
    const data: SoftwareValidationExportData = { ...SELF_BASE, controlFunctions };
    const result = await service.render(data);
    const xml = extractDocXml(result.buffer);
    // 1-3번째 항목은 기록됨
    expect(xml).toContain('CTRL_1');
    expect(xml).toContain('CTRL_3');
    // 4번째(CONTROL_MAX_ROWS 초과) 항목은 기록되지 않아야 함
    expect(xml).not.toContain('CTRL_4_OVERFLOW');
  });

  it('self T6: CONTROL_DATA_START_ROW 상수가 데이터 행 시작 위치(1)임', () => {
    // T6 R0=헤더, R1~R3=데이터 — SSOT 상수 검증
    expect(CONTROL_DATA_START_ROW).toBe(1);
    expect(CONTROL_MAX_ROWS).toBe(3);
  });

  // ── 5. 빈 배열 가드 ──────────────────────────────────────────────────────────

  it('self: acquisitionFunctions=[] 이면 에러 없이 처리됨', async () => {
    const data: SoftwareValidationExportData = {
      ...SELF_BASE,
      acquisitionFunctions: [],
      processingFunctions: [],
      controlFunctions: [],
    };
    await expect(service.render(data)).resolves.toBeDefined();
  });

  // ── 6. Storage 미호출 (signaturePath=null) ───────────────────────────────────

  it('self: signaturePath=null 이면 storage.download 미호출', async () => {
    const data: SoftwareValidationExportData = {
      ...SELF_BASE,
      techApprover: { name: 'TM', signaturePath: null },
      qualityApprover: { name: 'QM', signaturePath: null },
    };
    await service.render(data);
    expect(storageMock.download).not.toHaveBeenCalled();
  });

  // ── 7. Storage 호출 (signaturePath 존재) ─────────────────────────────────────

  it('self: signaturePath가 있으면 storage.download 호출됨', async () => {
    storageMock.download = jest.fn().mockResolvedValue(Buffer.from('fake-png'));
    const data: SoftwareValidationExportData = {
      ...SELF_BASE,
      qualityApprover: { name: 'QM', signaturePath: 'signatures/qm.png' },
      techApprover: { name: 'TM', signaturePath: null },
    };
    await service.render(data);
    expect(storageMock.download).toHaveBeenCalledWith('signatures/qm.png');
  });
});
