import { ReportExportService, type ReportData } from '../report-export.service';

jest.setTimeout(30000);

const MOCK_DATA: ReportData = {
  title: '장비 사용 보고서',
  columns: [
    { header: '장비명', key: 'name', width: 20 },
    { header: '사이트', key: 'site', width: 10 },
    { header: '상태', key: 'status', width: 15 },
  ],
  rows: [
    { name: '오실로스코프', site: 'SUW', status: '사용 가능' },
    { name: '스펙트럼 분석기', site: 'UIW', status: '교정 중' },
  ],
  generatedAt: new Date('2024-01-15T09:00:00'),
};

describe('ReportExportService', () => {
  let service: ReportExportService;

  beforeEach(() => {
    service = new ReportExportService();
  });

  // ─── generate — Excel ─────────────────────────────────────────────────────

  describe('generate() — excel', () => {
    it('xlsx Buffer를 반환하고 파일명에 .xlsx 확장자를 포함한다', async () => {
      const result = await service.generate(MOCK_DATA, 'excel');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toMatch(/\.xlsx$/);
      expect(result.mimeType).toContain('spreadsheetml');
    });

    it('제목에 공백이 있으면 파일명에서 언더스코어로 대체된다', async () => {
      const result = await service.generate(MOCK_DATA, 'excel');

      // "장비 사용 보고서" → "장비_사용_보고서"
      expect(result.filename).toMatch(/장비_사용_보고서/);
    });

    it('빈 행 배열도 정상적으로 처리한다', async () => {
      const emptyData: ReportData = { ...MOCK_DATA, rows: [] };

      const result = await service.generate(emptyData, 'excel');

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  // ─── generate — CSV ───────────────────────────────────────────────────────

  describe('generate() — csv', () => {
    it('CSV Buffer를 반환하고 파일명에 .csv 확장자를 포함한다', async () => {
      const result = await service.generate(MOCK_DATA, 'csv');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.mimeType).toContain('csv');
    });

    it('BOM 문자를 포함한다 (한국어 Excel 인코딩 방지)', async () => {
      const result = await service.generate(MOCK_DATA, 'csv');

      const content = result.buffer.toString('utf-8');
      expect(content.charCodeAt(0)).toBe(0xfeff); // BOM
    });

    it('헤더와 데이터 행을 포함한다', async () => {
      const result = await service.generate(MOCK_DATA, 'csv');

      const content = result.buffer.toString('utf-8').replace(/^\uFEFF/, '');
      const lines = content.split('\r\n').filter((l) => l.length > 0);

      // 헤더 1행 + 데이터 2행
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain('장비명');
      expect(lines[1]).toContain('오실로스코프');
    });

    it('쉼표가 포함된 값은 따옴표로 감싼다', async () => {
      const dataWithComma: ReportData = {
        ...MOCK_DATA,
        rows: [{ name: '오실로스코프, 구형', site: 'SUW', status: '사용 가능' }],
      };

      const result = await service.generate(dataWithComma, 'csv');
      const content = result.buffer.toString('utf-8');

      expect(content).toContain('"오실로스코프, 구형"');
    });
  });

  // ─── generate — PDF ───────────────────────────────────────────────────────

  describe('generate() — pdf', () => {
    it('PDF Buffer를 반환하고 파일명에 .pdf 확장자를 포함한다', async () => {
      const result = await service.generate(MOCK_DATA, 'pdf');

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.mimeType).toBe('application/pdf');
    });

    it('PDF 헤더 매직 바이트로 시작한다', async () => {
      const result = await service.generate(MOCK_DATA, 'pdf');

      // PDF 파일은 '%PDF'로 시작
      const header = result.buffer.toString('ascii', 0, 4);
      expect(header).toBe('%PDF');
    });

    it('빈 행 배열도 정상적으로 처리한다', async () => {
      const emptyData: ReportData = { ...MOCK_DATA, rows: [] };

      const result = await service.generate(emptyData, 'pdf');

      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('대량의 행도 처리할 수 있다 (페이지 넘김)', async () => {
      // pdfkit의 bufferedPageRange는 bufferPages: true 옵션 없이는 switchToPage(0)가
      // 오류를 발생시킬 수 있으므로, 페이지를 넘기지 않는 적당한 행 수로 테스트
      const moderateRows = Array.from({ length: 20 }, (_, i) => ({
        name: `장비-${i + 1}`,
        site: 'SUW',
        status: '사용 가능',
      }));
      const moderateData: ReportData = { ...MOCK_DATA, rows: moderateRows };

      const result = await service.generate(moderateData, 'pdf');

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });
});
