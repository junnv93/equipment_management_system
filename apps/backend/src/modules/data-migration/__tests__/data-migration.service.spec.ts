import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
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
import { FkResolutionService } from '../services/fk-resolution.service';

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
      validateCableBatch: jest.fn().mockReturnValue([]),
      validateTestSoftwareBatch: jest.fn().mockReturnValue([]),
      validateCalibrationFactorBatch: jest.fn().mockReturnValue([]),
      validateNonConformanceBatch: jest.fn().mockReturnValue([]),
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
        {
          provide: FkResolutionService,
          useValue: { resolveEquipmentFks: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get<DataMigrationService>(DataMigrationService);
  });

  // ─── getErrorReport ────────────────────────────────────────────────────────

  describe('getErrorReport()', () => {
    it('세션이 없으면 NotFoundException을 던진다', async () => {
      mockCacheService.get.mockReturnValue(null);

      await expect(service.getErrorReport('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('세션 소유자가 아니면 ForbiddenException을 던진다', async () => {
      mockCacheService.get.mockReturnValue({ userId: 'owner-id', sheets: [] });

      await expect(service.getErrorReport('session-1', 'other-user')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ─── executeMultiSheet — stale EXECUTING 판정 ─────────────────────────────

  describe('executeMultiSheet() — stale EXECUTING 판정', () => {
    const makeExecutingSession = (executionStartedAt: Date) => ({
      sessionId: 'sess-1',
      fileName: 'test.xlsx',
      uploadedAt: new Date(),
      userId: 'user-1',
      status: 'executing' as const,
      executionStartedAt,
      filePath: undefined,
      fkResolutions: undefined,
      testSoftwareFkResolutions: undefined,
      fkResolutionSummary: undefined,
      sheets: [],
    });

    it('EXECUTING 상태가 10분 초과(stale)이면 FAILED 전환 후 재시도 가능', async () => {
      // 11분 전에 EXECUTING 시작
      const staleDate = new Date(Date.now() - 11 * 60 * 1000);
      const session = makeExecutingSession(staleDate);

      mockCacheService.get.mockReturnValue(session);
      // executeMultiSheet 진입 후 실제 실행 로직은 세션 상태로만 검증하므로
      // NotFoundException이 아닌 다른 예외가 나오면 stale 분기 통과 의미
      // (세션 소유권/상태 체크 후 실제 DB 실행까지는 가지 않아도 됨)
      await expect(
        service.executeMultiSheet({ sessionId: 'sess-1' }, 'user-1')
      ).rejects.not.toThrow(ConflictException);

      // stale 판정 후 캐시 업데이트 호출 확인 (FAILED 전환)
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('sess-1'),
        expect.objectContaining({ status: 'failed' }),
        expect.any(Number)
      );
    });

    it('EXECUTING 상태가 10분 이내(non-stale)이면 ConflictException', async () => {
      // 1분 전에 EXECUTING 시작
      const recentDate = new Date(Date.now() - 60 * 1000);
      const session = makeExecutingSession(recentDate);

      mockCacheService.get.mockReturnValue(session);

      await expect(service.executeMultiSheet({ sessionId: 'sess-1' }, 'user-1')).rejects.toThrow(
        ConflictException
      );
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
