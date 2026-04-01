import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataMigrationService } from '../services/data-migration.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import {
  createMockCacheService,
  createMockCacheInvalidationHelper,
  createMockFileUploadService,
  createMockEquipmentHistoryService,
  createMockExcelParserService,
  createMockMigrationValidatorService,
} from '../../../common/testing/mock-providers';
import { EquipmentHistoryService } from '../../equipment/services/equipment-history.service';
import { ExcelParserService } from '../services/excel-parser.service';
import { MigrationValidatorService } from '../services/migration-validator.service';
import { HistoryValidatorService } from '../services/history-validator.service';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import type { MulterFile } from '../../../types/common.types';
import type { MigrationSession } from '../types/data-migration.types';

const createSelectChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'returning',
    'update',
    'set',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.limit.mockResolvedValue(finalValue);
  chain.returning.mockResolvedValue(finalValue);
  chain.orderBy.mockResolvedValue(finalValue);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

const MOCK_USER_ID = 'user-uuid-1';
const MOCK_SESSION_ID = 'session-uuid-1';

const MOCK_VALID_ROW = {
  rowNumber: 2,
  status: 'valid' as const,
  data: {
    managementNumber: 'SUW-E0001',
    name: '오실로스코프',
    site: 'SUW',
  },
  errors: [],
  warnings: [],
  managementNumber: 'SUW-E0001',
};

function makeMockFile(name = 'test.xlsx'): MulterFile {
  return {
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('mock-excel'),
    size: 1024,
  } as MulterFile;
}

describe('DataMigrationService', () => {
  let service: DataMigrationService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockCacheInvalidationHelper: ReturnType<typeof createMockCacheInvalidationHelper>;
  let mockFileUploadService: ReturnType<typeof createMockFileUploadService>;
  let mockEquipmentHistoryService: ReturnType<typeof createMockEquipmentHistoryService>;
  let mockExcelParserService: ReturnType<typeof createMockExcelParserService>;
  let mockMigrationValidatorService: ReturnType<typeof createMockMigrationValidatorService>;
  let mockHistoryValidatorService: Record<string, jest.Mock>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let chain: ReturnType<typeof createSelectChain>;

  beforeEach(async () => {
    chain = createSelectChain([]);
    mockCacheService = createMockCacheService();
    mockCacheInvalidationHelper = createMockCacheInvalidationHelper();
    mockFileUploadService = createMockFileUploadService();
    mockEquipmentHistoryService = createMockEquipmentHistoryService();
    mockExcelParserService = createMockExcelParserService();
    mockMigrationValidatorService = createMockMigrationValidatorService();

    mockHistoryValidatorService = {
      validateCalibrationBatch: jest.fn().mockReturnValue([]),
      validateRepairBatch: jest.fn().mockReturnValue([]),
      validateIncidentBatch: jest.fn().mockReturnValue([]),
    };

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          insert: jest.fn().mockReturnValue(chain),
          select: jest.fn().mockReturnValue(chain),
          update: jest.fn().mockReturnValue(chain),
        };
        return fn(tx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataMigrationService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: CacheInvalidationHelper, useValue: mockCacheInvalidationHelper },
        { provide: EquipmentHistoryService, useValue: mockEquipmentHistoryService },
        { provide: ExcelParserService, useValue: mockExcelParserService },
        { provide: MigrationValidatorService, useValue: mockMigrationValidatorService },
        { provide: HistoryValidatorService, useValue: mockHistoryValidatorService },
      ],
    }).compile();

    service = module.get<DataMigrationService>(DataMigrationService);
  });

  // ─── preview ─────────────────────────────────────────────────────────────

  describe('preview()', () => {
    it('파일을 파싱하고 sessionId를 포함한 결과를 반환한다', async () => {
      const file = makeMockFile('equipment.xlsx');
      mockExcelParserService.parseBuffer.mockResolvedValue([{ rowNumber: 2, rawData: {} }]);
      mockExcelParserService.mapRows.mockReturnValue([
        { rowNumber: 2, mappedData: { managementNumber: 'SUW-E0001' }, unmappedColumns: [] },
      ]);
      mockMigrationValidatorService.validateBatch.mockResolvedValue([MOCK_VALID_ROW]);

      const result = await service.preview(
        file,
        { autoGenerateManagementNumber: false, skipDuplicates: true },
        MOCK_USER_ID
      );

      expect(result.sessionId).toBeDefined();
      expect(result.fileName).toBe('equipment.xlsx');
      expect(result.totalRows).toBe(1);
      expect(result.validRows).toBe(1);
    });

    it('preview 결과를 캐시에 저장한다', async () => {
      const file = makeMockFile();
      mockMigrationValidatorService.validateBatch.mockResolvedValue([MOCK_VALID_ROW]);

      const result = await service.preview(
        file,
        { autoGenerateManagementNumber: false, skipDuplicates: true },
        MOCK_USER_ID
      );

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining(result.sessionId),
        expect.objectContaining({ sessionId: result.sessionId, userId: MOCK_USER_ID }),
        expect.any(Number)
      );
    });
  });

  // ─── execute ──────────────────────────────────────────────────────────────

  describe('execute()', () => {
    it('세션이 없으면 NotFoundException을 던진다', async () => {
      mockCacheService.get.mockReturnValue(null);

      await expect(
        service.execute(
          {
            sessionId: 'nonexistent-session',
            autoGenerateManagementNumber: false,
            skipDuplicates: true,
          },
          MOCK_USER_ID
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('세션 소유자가 다르면 ForbiddenException을 던진다', async () => {
      const session: MigrationSession = {
        sessionId: MOCK_SESSION_ID,
        userId: 'other-user',
        filePath: '/tmp/file.xlsx',
        originalFileName: 'file.xlsx',
        previewResult: {
          sessionId: MOCK_SESSION_ID,
          fileName: 'file.xlsx',
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicateRows: 0,
          warningRows: 0,
          unmappedColumns: [],
          rows: [MOCK_VALID_ROW],
        },
        createdAt: new Date(),
      };
      mockCacheService.get.mockReturnValue(session);

      await expect(
        service.execute(
          { sessionId: MOCK_SESSION_ID, autoGenerateManagementNumber: false, skipDuplicates: true },
          MOCK_USER_ID
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('유효 행이 없으면 createdCount=0을 반환한다', async () => {
      const session: MigrationSession = {
        sessionId: MOCK_SESSION_ID,
        userId: MOCK_USER_ID,
        filePath: '/tmp/file.xlsx',
        originalFileName: 'file.xlsx',
        previewResult: {
          sessionId: MOCK_SESSION_ID,
          fileName: 'file.xlsx',
          totalRows: 1,
          validRows: 0,
          errorRows: 1,
          duplicateRows: 0,
          warningRows: 0,
          unmappedColumns: [],
          rows: [{ ...MOCK_VALID_ROW, status: 'error' as const }],
        },
        createdAt: new Date(),
      };
      mockCacheService.get.mockReturnValue(session);
      mockMigrationValidatorService.filterValidRows.mockReturnValue([]);

      const result = await service.execute(
        { sessionId: MOCK_SESSION_ID, autoGenerateManagementNumber: false, skipDuplicates: true },
        MOCK_USER_ID
      );

      expect(result.createdCount).toBe(0);
    });

    it('성공적인 실행 후 캐시를 무효화하고 세션을 삭제한다', async () => {
      const session: MigrationSession = {
        sessionId: MOCK_SESSION_ID,
        userId: MOCK_USER_ID,
        filePath: '/tmp/file.xlsx',
        originalFileName: 'file.xlsx',
        previewResult: {
          sessionId: MOCK_SESSION_ID,
          fileName: 'file.xlsx',
          totalRows: 1,
          validRows: 1,
          errorRows: 0,
          duplicateRows: 0,
          warningRows: 0,
          unmappedColumns: [],
          rows: [MOCK_VALID_ROW],
        },
        createdAt: new Date(),
      };
      mockCacheService.get.mockReturnValue(session);
      mockMigrationValidatorService.filterValidRows.mockReturnValue([MOCK_VALID_ROW]);

      // transaction 내부 tx.insert().values().returning() → 생성된 장비 반환
      mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        const mockReturning = jest.fn().mockResolvedValue([{ id: 'new-eq-uuid' }]);
        const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
        const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
        const tx = { insert: mockInsert, select: jest.fn().mockReturnValue(chain) };
        return fn(tx);
      });

      await service.execute(
        { sessionId: MOCK_SESSION_ID, autoGenerateManagementNumber: false, skipDuplicates: true },
        MOCK_USER_ID
      );

      expect(mockCacheInvalidationHelper.invalidateEquipmentLists).toHaveBeenCalled();
      expect(mockCacheInvalidationHelper.invalidateAllDashboard).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        expect.stringContaining(MOCK_SESSION_ID)
      );
    });
  });

  // ─── getErrorReport ────────────────────────────────────────────────────────

  describe('getErrorReport()', () => {
    it('세션이 없으면 NotFoundException을 던진다', async () => {
      mockCacheService.get.mockReturnValue(null);

      // 단일시트 조회 null, 멀티시트 조회 null → NotFoundException
      mockCacheService.get.mockReturnValueOnce(null).mockReturnValueOnce(null);

      await expect(service.getErrorReport('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('단일시트 세션에서 에러 행 리포트를 생성한다', async () => {
      const errorRow = {
        ...MOCK_VALID_ROW,
        status: 'error' as const,
        errors: [{ field: 'name', message: '필수 항목', code: 'REQUIRED' }],
      };
      const session: MigrationSession = {
        sessionId: MOCK_SESSION_ID,
        userId: MOCK_USER_ID,
        filePath: '/tmp/file.xlsx',
        originalFileName: 'file.xlsx',
        previewResult: {
          sessionId: MOCK_SESSION_ID,
          fileName: 'file.xlsx',
          totalRows: 1,
          validRows: 0,
          errorRows: 1,
          duplicateRows: 0,
          warningRows: 0,
          unmappedColumns: [],
          rows: [errorRow],
        },
        createdAt: new Date(),
      };
      mockCacheService.get.mockReturnValueOnce(session);
      mockExcelParserService.generateErrorReport.mockResolvedValue(Buffer.from('report'));

      const result = await service.getErrorReport(MOCK_SESSION_ID);

      expect(result).toBeInstanceOf(Buffer);
    });
  });

  // ─── getTemplate ──────────────────────────────────────────────────────────

  describe('getTemplate()', () => {
    it('ExcelParserService.generateTemplate를 호출하여 버퍼를 반환한다', async () => {
      mockExcelParserService.generateTemplate.mockResolvedValue(Buffer.from('template'));

      const result = await service.getTemplate();

      expect(mockExcelParserService.generateTemplate).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
