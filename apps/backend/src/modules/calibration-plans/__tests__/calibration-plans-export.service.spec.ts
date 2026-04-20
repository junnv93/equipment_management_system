import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { CalibrationPlansExportService } from '../calibration-plans-export.service';
import { CalibrationPlanExportDataService } from '../services/calibration-plan-export-data.service';
import { CalibrationPlanRendererService } from '../services/calibration-plan-renderer.service';
import type { CalibrationPlanDetail } from '../calibration-plans.types';
import { FormTemplateService } from '../../reports/form-template.service';
import { CalibrationPlansService } from '../calibration-plans.service';
import * as Layout from '../calibration-plan.layout';
import { toExcelLoadableBuffer } from '../../../common/utils';

// ── 최소 유효 xlsx 템플릿 생성 ────────────────────────────────────────────

async function buildTemplateBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet(Layout.SHEET_NAMES[0]);

  // Row 1: 제목 (병합 제목 시뮬레이션)
  sheet.getRow(1).getCell(1).value = '템플릿 제목';

  // Row 4~5: 컬럼 헤더
  for (let c = 1; c <= Layout.COLUMN_COUNT; c++) {
    sheet.getRow(4).getCell(c).value = `헤더${c}`;
    sheet.getRow(5).getCell(c).value = `헤더${c}-서브`;
  }

  // Row 6: 샘플 데이터 행 (스타일 참조용 — clearTrailingRows 대상)
  for (let c = 1; c <= Layout.COLUMN_COUNT; c++) {
    sheet.getRow(6).getCell(c).value = `샘플${c}`;
  }
  sheet.getRow(6).commit();

  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab);
}

// ── Mock 헬퍼 ────────────────────────────────────────────────────────────

const buildMockPlan = (overrides: Record<string, unknown> = {}) => ({
  id: 'plan-uuid-1',
  year: 2025,
  siteId: 'suwon',
  teamId: 'team-uuid-1',
  status: 'approved',
  casVersion: 4,
  version: 1,
  isLatestVersion: true,
  createdBy: 'user-uuid-1',
  submittedAt: new Date('2025-01-10'),
  reviewedBy: 'user-uuid-2',
  reviewedAt: new Date('2025-01-12'),
  reviewComment: null,
  approvedBy: 'user-uuid-3',
  approvedAt: new Date('2025-01-15'),
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  rejectionStage: null,
  parentPlanId: null,
  authorName: '수원 기술책임자',
  teamName: 'FCC EMC/RF 수원',
  approvedByName: '수원 시험소장',
  reviewedByName: '수원 품질책임자',
  rejectedByName: null,
  createdAt: new Date('2025-01-05'),
  updatedAt: new Date('2025-01-15'),
  items: [
    {
      id: 'item-uuid-1',
      planId: 'plan-uuid-1',
      equipmentId: 'equip-uuid-1',
      sequenceNumber: 1,
      snapshotManagementNumber: 'SUW-E-001',
      snapshotValidityDate: new Date('2025-09-01'),
      snapshotCalibrationCycle: 12,
      snapshotCalibrationAgency: 'HCT',
      plannedCalibrationDate: new Date('2025-09-01'),
      plannedCalibrationAgency: 'HCT',
      actualCalibrationDate: null,
      confirmedBy: null,
      confirmedAt: null,
      notes: '연간 교정 예정',
      createdAt: new Date('2025-01-05'),
      updatedAt: new Date('2025-01-05'),
      actualCalibrationId: null,
      equipment: { managementNumber: 'SUW-E-001', name: '스펙트럼 분석기' },
    },
  ],
  ...overrides,
});

// ── 테스트 ────────────────────────────────────────────────────────────────

describe('CalibrationPlanExportDataService — 상태 가드 (M3)', () => {
  let exportDataService: CalibrationPlanExportDataService;
  let mockCalibrationPlansService: { findOne: jest.Mock };

  beforeEach(async () => {
    mockCalibrationPlansService = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CalibrationPlanExportDataService,
        { provide: CalibrationPlansService, useValue: mockCalibrationPlansService },
      ],
    }).compile();

    exportDataService = module.get(CalibrationPlanExportDataService);
  });

  it('approved 상태 → 플랜 반환', async () => {
    const plan = buildMockPlan({ status: 'approved' });
    mockCalibrationPlansService.findOne.mockResolvedValue(plan);

    const result = await exportDataService.fetchForExport('plan-uuid-1');
    expect(result.status).toBe('approved');
  });

  it.each(['draft', 'pending_review', 'pending_approval', 'rejected'])(
    '%s 상태 → BadRequestException(NON_EXPORTABLE_PLAN_STATUS)',
    async (status) => {
      mockCalibrationPlansService.findOne.mockResolvedValue(buildMockPlan({ status }));

      await expect(exportDataService.fetchForExport('plan-uuid-1')).rejects.toThrow(
        BadRequestException
      );
      await expect(exportDataService.fetchForExport('plan-uuid-1')).rejects.toMatchObject({
        response: { code: 'NON_EXPORTABLE_PLAN_STATUS' },
      });
    }
  );
});

describe('CalibrationPlanRendererService — xlsx 렌더링 (M19)', () => {
  let rendererService: CalibrationPlanRendererService;
  let templateBuffer: Buffer;

  beforeEach(async () => {
    templateBuffer = await buildTemplateBuffer();

    const mockFormTemplateService = {
      getTemplateBuffer: jest.fn().mockResolvedValue(templateBuffer),
    };

    const module = await Test.createTestingModule({
      providers: [
        CalibrationPlanRendererService,
        { provide: FormTemplateService, useValue: mockFormTemplateService },
      ],
    }).compile();

    rendererService = module.get(CalibrationPlanRendererService);
  });

  it('approved plan → buffer + mimeType + filename 반환', async () => {
    const plan = buildMockPlan();
    const result = await rendererService.render(plan as unknown as CalibrationPlanDetail);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(result.filename).toMatch(/^UL-QP-19-01_/);
    expect(result.filename).toMatch(/\.xlsx$/);
  });

  it('파일명이 FORM_CATALOG 기반이어야 함 — 하드코딩 UL-QP-19-01_ 리터럴 없음 (M18)', async () => {
    const plan = buildMockPlan();
    const result = await rendererService.render(plan as unknown as CalibrationPlanDetail);

    // formNumber와 name(공백제거)이 파일명에 포함되어야 함
    expect(result.filename).toContain('UL-QP-19-01');
    expect(result.filename).toContain('연간교정계획서');
    expect(result.filename).toContain('2025');
    expect(result.filename).toContain('수원');
  });

  it('ExcelJS 역검증: Row 1 제목 셀 확인 (M19)', async () => {
    const plan = buildMockPlan({ year: 2025, siteId: 'suwon' });
    const result = await rendererService.render(plan as unknown as CalibrationPlanDetail);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(result.buffer));
    const sheet = wb.getWorksheet(Layout.SHEET_NAMES[0]);

    expect(sheet).toBeDefined();
    const titleCell = sheet!.getRow(1).getCell(1).value;
    expect(titleCell).toBe('2025년 수원 연간 교정 계획서');
  });

  it('ExcelJS 역검증: Row 6 데이터 셀 확인 (M19)', async () => {
    const plan = buildMockPlan();
    const result = await rendererService.render(plan as unknown as CalibrationPlanDetail);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(result.buffer));
    const sheet = wb.getWorksheet(Layout.SHEET_NAMES[0])!;

    const dataRow = sheet.getRow(Layout.DATA_START_ROW);
    expect(dataRow.getCell(1).value).toBe(1); // 순번
    expect(dataRow.getCell(2).value).toBe('SUW-E-001'); // 관리번호
    expect(dataRow.getCell(3).value).toBe('스펙트럼 분석기'); // 장비명
    // col 4: snapshotValidityDate — formatDate로 변환된 날짜 문자열 (truthy, '-' 아님)
    expect(typeof dataRow.getCell(4).value).toBe('string');
    expect(dataRow.getCell(4).value).not.toBe('-');
    expect(dataRow.getCell(10).value).toBe('연간 교정 예정'); // 비고
  });

  it('items가 0개일 때 Row 6부터 빈 셀 (clearTrailingRows 검증)', async () => {
    const plan = buildMockPlan({ items: [] });
    const result = await rendererService.render(plan as unknown as CalibrationPlanDetail);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(toExcelLoadableBuffer(result.buffer));
    const sheet = wb.getWorksheet(Layout.SHEET_NAMES[0])!;

    // 샘플 Row 6이 비워졌어야 함
    const cell = sheet.getRow(Layout.DATA_START_ROW).getCell(1).value;
    expect(cell).toBeNull();
  });
});

describe('CalibrationPlansExportService — 오케스트레이터', () => {
  let exportService: CalibrationPlansExportService;
  let mockExportDataService: { fetchForExport: jest.Mock };
  let mockRendererService: { render: jest.Mock };

  beforeEach(async () => {
    mockExportDataService = { fetchForExport: jest.fn() };
    mockRendererService = {
      render: jest.fn().mockResolvedValue({
        buffer: Buffer.from('mock'),
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'test.xlsx',
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        CalibrationPlansExportService,
        { provide: CalibrationPlanExportDataService, useValue: mockExportDataService },
        { provide: CalibrationPlanRendererService, useValue: mockRendererService },
      ],
    }).compile();

    exportService = module.get(CalibrationPlansExportService);
  });

  it('fetchForExport → render 위임 후 ExportResult 반환', async () => {
    const plan = buildMockPlan();
    mockExportDataService.fetchForExport.mockResolvedValue(plan);

    const result = await exportService.exportExcel('plan-uuid-1');

    expect(mockExportDataService.fetchForExport).toHaveBeenCalledWith('plan-uuid-1');
    expect(mockRendererService.render).toHaveBeenCalledWith(plan);
    expect(result.filename).toBe('test.xlsx');
  });

  it('fetchForExport가 BadRequestException 던지면 위로 전파', async () => {
    mockExportDataService.fetchForExport.mockRejectedValue(
      new BadRequestException({ code: 'NON_EXPORTABLE_PLAN_STATUS' })
    );

    await expect(exportService.exportExcel('plan-uuid-1')).rejects.toThrow(BadRequestException);
  });
});
