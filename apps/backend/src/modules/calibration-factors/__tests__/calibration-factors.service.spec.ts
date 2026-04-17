import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CalibrationFactorsService } from '../calibration-factors.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import {
  CalibrationFactorTypeValues,
  CalibrationFactorApprovalStatusValues,
} from '@equipment-management/schemas';

const CalibrationFactorType = CalibrationFactorTypeValues;
const CalibrationFactorApprovalStatus = CalibrationFactorApprovalStatusValues;

const MOCK_FACTOR = {
  id: 'cf-uuid-001',
  equipmentId: 'eq-uuid-001',
  calibrationId: null,
  factorType: 'antenna_gain',
  factorName: '3GHz 안테나 이득',
  factorValue: '12.500000', // DB decimal → string
  unit: 'dBi',
  parameters: { frequency: '3GHz' },
  effectiveDate: '2024-01-15',
  expiryDate: '2025-01-15',
  approvalStatus: 'pending',
  requestedBy: 'user-uuid-001',
  approvedBy: null,
  requestedAt: new Date('2024-01-10'),
  approvedAt: null,
  approverComment: null,
  version: 1,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  deletedAt: null,
};

/** DB 메서드 체인 mock 빌더 */
const createChain = (resolvedValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['from', 'where', 'orderBy', 'limit', 'offset', 'set', 'values', 'returning'];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.offset.mockResolvedValue(resolvedValue);
  chain.returning.mockResolvedValue(resolvedValue);
  // count 쿼리의 terminal은 where → thenable 처리
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
    resolve(resolvedValue);
  return chain;
};

describe('CalibrationFactorsService', () => {
  let service: CalibrationFactorsService;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
  };

  const requestedBy = 'user-uuid-001';

  beforeEach(async () => {
    const chain = createChain([MOCK_FACTOR]);
    const countChain = createChain([{ count: 1 }]);
    let selectCallCount = 0;

    mockDb = {
      select: jest.fn().mockImplementation(() => {
        selectCallCount++;
        return selectCallCount % 2 === 1 ? chain : countChain;
      }),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
    };

    const mockCacheService = {
      getOrSet: jest.fn().mockImplementation((_key: string, fn: () => unknown) => fn()),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      deleteByPrefix: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalibrationFactorsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        {
          provide: CacheInvalidationHelper,
          useValue: { invalidateAllDashboard: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<CalibrationFactorsService>(CalibrationFactorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new calibration factor with pending status', async () => {
      const createDto = {
        equipmentId: 'eq-uuid-001',
        factorType: CalibrationFactorType.ANTENNA_GAIN,
        factorName: '3GHz 안테나 이득',
        factorValue: 12.5,
        unit: 'dBi',
        effectiveDate: '2024-01-15',
      };

      const createdFactor = { ...MOCK_FACTOR, approvalStatus: 'pending', requestedBy };
      const returnChain = createChain([createdFactor]);
      mockDb.insert.mockReturnValue(returnChain);

      const result = await service.create(createDto as never, requestedBy);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.approvalStatus).toBe(CalibrationFactorApprovalStatus.PENDING);
      expect(result.requestedBy).toBe(requestedBy);
      expect(result.factorValue).toBe(12.5);
    });

    it('should normalize factorValue from decimal string to number', async () => {
      const returnChain = createChain([{ ...MOCK_FACTOR, factorValue: '2.300000' }]);
      mockDb.insert.mockReturnValue(returnChain);

      const result = await service.create(
        {
          equipmentId: 'eq-uuid-001',
          factorType: CalibrationFactorType.CABLE_LOSS,
          factorName: '케이블 손실',
          factorValue: 2.3,
          unit: 'dB',
          effectiveDate: '2024-02-01',
        } as never,
        requestedBy
      );

      expect(typeof result.factorValue).toBe('number');
      expect(result.factorValue).toBe(2.3);
    });
  });

  describe('findOne', () => {
    it('should return a calibration factor by id', async () => {
      const singleChain = createChain([MOCK_FACTOR]);
      mockDb.select.mockReturnValue(singleChain);

      const result = await service.findOne(MOCK_FACTOR.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(MOCK_FACTOR.id);
      expect(typeof result.factorValue).toBe('number');
      expect(result.version).toBe(1);
    });

    it('should throw NotFoundException when factor not found', async () => {
      const emptyChain = createChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list with correct meta', async () => {
      const itemsChain = createChain([MOCK_FACTOR]);
      const cntChain = createChain([{ count: 1 }]);
      let callCount = 0;
      mockDb.select.mockImplementation(() => (++callCount % 2 === 1 ? itemsChain : cntChain));

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(20);
      expect(typeof result.items[0].factorValue).toBe('number');
    });
  });

  describe('approve', () => {
    it('should approve a pending calibration factor with CAS', async () => {
      const approvedFactor = {
        ...MOCK_FACTOR,
        approvalStatus: 'approved',
        approvedBy: 'approver-uuid',
        approverComment: '검토 완료',
        approvedAt: new Date(),
        version: 2,
      };

      const findChain = createChain([MOCK_FACTOR]);
      const updateChain = createChain([approvedFactor]);
      mockDb.select.mockReturnValue(findChain);
      mockDb.update.mockReturnValue(updateChain);

      const result = await service.approve('cf-uuid-001', {
        approverId: 'approver-uuid',
        approverComment: '검토 완료',
        version: 1,
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(result.approvalStatus).toBe(CalibrationFactorApprovalStatus.APPROVED);
    });

    it('should throw BadRequestException when approving non-pending factor', async () => {
      const approvedFactor = { ...MOCK_FACTOR, approvalStatus: 'approved' };
      const findChain = createChain([approvedFactor]);
      mockDb.select.mockReturnValue(findChain);

      await expect(
        service.approve('cf-uuid-001', {
          approverId: 'approver-uuid',
          approverComment: '재승인',
          version: 1,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      // findOne → returns pending factor
      const findChain = createChain([MOCK_FACTOR]);
      // updateWithVersion → returns empty (no rows affected)
      const updateChain = createChain([]);
      // version check select → returns existing with different version
      const existingChain = createChain([{ id: MOCK_FACTOR.id, version: 2 }]);

      let selectCall = 0;
      mockDb.select.mockImplementation(() => {
        selectCall++;
        // 1st: findOne, 2nd: updateWithVersion existence check
        return selectCall === 1 ? findChain : existingChain;
      });
      mockDb.update.mockReturnValue(updateChain);

      await expect(
        service.approve('cf-uuid-001', {
          approverId: 'approver-uuid',
          approverComment: '검토 완료',
          version: 1,
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('should reject a pending calibration factor with CAS', async () => {
      const rejectedFactor = {
        ...MOCK_FACTOR,
        approvalStatus: 'rejected',
        approvedBy: 'approver-uuid',
        approverComment: '범위 초과',
        version: 2,
      };

      const findChain = createChain([MOCK_FACTOR]);
      const updateChain = createChain([rejectedFactor]);
      mockDb.select.mockReturnValue(findChain);
      mockDb.update.mockReturnValue(updateChain);

      const result = await service.reject('cf-uuid-001', {
        approverId: 'approver-uuid',
        rejectionReason: '범위 초과',
        version: 1,
      });

      expect(result.approvalStatus).toBe(CalibrationFactorApprovalStatus.REJECTED);
    });

    it('should throw BadRequestException when rejecting non-pending factor', async () => {
      const rejectedFactor = { ...MOCK_FACTOR, approvalStatus: 'rejected' };
      const findChain = createChain([rejectedFactor]);
      mockDb.select.mockReturnValue(findChain);

      await expect(
        service.reject('cf-uuid-001', {
          approverId: 'approver-uuid',
          rejectionReason: '재시도',
          version: 1,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete a calibration factor with CAS', async () => {
      const findChain = createChain([MOCK_FACTOR]);
      const updateChain = createChain([{ ...MOCK_FACTOR, deletedAt: new Date(), version: 2 }]);
      mockDb.select.mockReturnValue(findChain);
      mockDb.update.mockReturnValue(updateChain);

      const result = await service.remove('cf-uuid-001', 1);

      expect(result.id).toBe('cf-uuid-001');
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when removing non-existent factor', async () => {
      const emptyChain = createChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      await expect(service.remove('non-existent-id', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEquipment', () => {
    it('should return current active factors for equipment', async () => {
      const activeChain = createChain([MOCK_FACTOR]);
      mockDb.select.mockReturnValue(activeChain);

      const result = await service.findByEquipment('eq-uuid-001');

      expect(result.equipmentId).toBe('eq-uuid-001');
      expect(Array.isArray(result.factors)).toBe(true);
      expect(result.count).toBe(result.factors.length);
    });
  });

  describe('getRegistry', () => {
    it('should group factors by equipment', async () => {
      const registryChain = createChain([MOCK_FACTOR]);
      mockDb.select.mockReturnValue(registryChain);

      const result = await service.getRegistry();

      expect(result.registry).toBeDefined();
      expect(Array.isArray(result.registry)).toBe(true);
      expect(result.generatedAt).toBeDefined();
    });
  });
});
