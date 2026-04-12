import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { NonConformancesService } from '../non-conformances.service';
import { NonConformanceStatus } from '../dto/non-conformance-query.dto';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../notifications/events/notification-events';

describe('NonConformancesService', () => {
  let service: NonConformancesService;

  // beforeEach에서 매 테스트마다 fresh 생성 (checkouts.service.spec.ts와 동일 패턴)
  const chainMethods = [
    'select',
    'from',
    'where',
    'limit',
    'offset',
    'orderBy',
    'insert',
    'update',
    'values',
    'set',
    'returning',
    'leftJoin',
    'innerJoin',
  ];

  let chain: Record<string, jest.Mock>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  let mockCacheInvalidationHelper: Record<string, jest.Mock>;
  let mockCacheService: Record<string, jest.Mock>;
  let mockEventEmitter: Record<string, jest.Mock>;

  beforeEach(async () => {
    // 매 테스트마다 새로운 chain 객체 생성
    chain = {} as Record<string, jest.Mock>;
    for (const m of chainMethods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    // chain은 thenable: await 시 빈 배열 반환
    (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
      resolve([])
    );

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      from: chain.from,
      where: chain.where,
      limit: chain.limit,
      offset: chain.offset,
      orderBy: chain.orderBy,
      values: chain.values,
      set: chain.set,
      returning: chain.returning,
      transaction: jest.fn(),
      query: {
        nonConformances: {
          findFirst: jest.fn(),
        },
      },
    };

    mockCacheInvalidationHelper = {
      invalidateAfterNonConformanceCreation: jest.fn().mockResolvedValue(undefined),
      invalidateAfterNonConformanceStatusChange: jest.fn().mockResolvedValue(undefined),
      invalidateAfterEquipmentUpdate: jest.fn().mockResolvedValue(undefined),
    };

    mockEventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn().mockResolvedValue([]),
      on: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn().mockReturnValue(undefined),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      deleteByPrefix: jest.fn(),
      getOrSet: jest
        .fn()
        .mockImplementation((_key: string, factory: () => Promise<unknown>) => factory()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonConformancesService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: CacheInvalidationHelper, useValue: mockCacheInvalidationHelper },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<NonConformancesService>(NonConformancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockEquipment = {
      id: 1,
      uuid: 'test-equipment-uuid',
      status: 'available',
    };

    const createDto = {
      equipmentId: 'test-equipment-uuid',
      discoveryDate: '2024-01-15',
      cause: '테스트 부적합 원인',
      ncType: 'damage' as const,
      actionPlan: '테스트 조치 계획',
    };
    const discoveredBy = 'test-user-uuid';

    it('should create a new non-conformance', async () => {
      const mockNonConformance = {
        id: 'nc-uuid',
        ...createDto,
        status: NonConformanceStatus.OPEN,
        createdAt: new Date(),
      };

      // Mock equipment lookup: select().from().where().limit()
      mockDb.limit.mockResolvedValueOnce([mockEquipment]);

      // Mock transaction — 내부 Drizzle 메서드 체인 재현
      mockDb.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        // select().from().where().limit() → [equipment]
        const selectChain = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ ...mockEquipment, version: 1 }]),
        };
        // update().set().where().returning() → [equipment] (CAS 장비 상태 변경)
        const updateChain = {
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([{ id: mockEquipment.id }]),
        };
        // insert().values().returning() → [nc]
        const insertChain = {
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockNonConformance]),
        };
        const tx = {
          select: jest.fn().mockReturnValue(selectChain),
          update: jest.fn().mockReturnValue(updateChain),
          insert: jest.fn().mockReturnValue(insertChain),
        };
        return callback(tx);
      });

      const result = await service.create(createDto, discoveredBy);

      expect(result).toBeDefined();
      expect(result.equipmentId).toBe(createDto.equipmentId);
      expect(result.status).toBe(NonConformanceStatus.OPEN);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      mockDb.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const selectChain = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]),
        };
        const tx = { select: jest.fn().mockReturnValue(selectChain) };
        return callback(tx);
      });

      await expect(service.create(createDto, discoveredBy)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when equipment is already non-conforming', async () => {
      mockDb.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const selectChain = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ ...mockEquipment, status: 'non_conforming' }]),
        };
        const tx = { select: jest.fn().mockReturnValue(selectChain) };
        return callback(tx);
      });

      await expect(service.create(createDto, discoveredBy)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a non-conformance by id', async () => {
      const mockNonConformance = {
        id: 'nc-uuid',
        status: 'open',
        equipmentId: 'eq-uuid',
      };

      // findOne uses db.query.nonConformances.findFirst()
      mockDb.query.nonConformances.findFirst.mockResolvedValueOnce(mockNonConformance);

      const result = await service.findOne('nc-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('nc-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      mockDb.query.nonConformances.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isEquipmentNonConforming', () => {
    it('should return true when open non-conformance exists', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'nc-1', status: 'open' }]);

      const result = await service.isEquipmentNonConforming('eq-uuid');
      expect(result).toBe(true);
    });

    it('should return false when no open non-conformance exists', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await service.isEquipmentNonConforming('eq-uuid');
      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    const mockNonConformance = {
      id: 'nc-uuid',
      status: 'open',
      equipmentId: 'eq-uuid',
      version: 1,
    };

    it('should update non-conformance via updateWithVersion', async () => {
      const updateDto = {
        version: 1,
        correctionContent: '시정 조치 내용',
        status: 'corrected' as const,
      };

      // Mock findOne via cache → factory → DB
      mockCacheService.getOrSet.mockResolvedValueOnce(mockNonConformance);

      // Mock updateWithVersion: update().set().where().returning()
      const updatedNc = { ...mockNonConformance, ...updateDto, version: 2 };
      mockDb.returning.mockResolvedValueOnce([updatedNc]);

      const result = await service.update('nc-uuid', updateDto);

      expect(result).toBeDefined();
      expect(result.correctionContent).toBe(updateDto.correctionContent);
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when updating closed non-conformance', async () => {
      const closedNc = { ...mockNonConformance, status: NonConformanceStatus.CLOSED };

      // Mock findOne returns closed NC
      mockCacheService.getOrSet.mockResolvedValueOnce(closedNc);

      await expect(
        service.update('nc-uuid', { version: 1, correctionContent: 'test' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      // Mock findOne
      mockCacheService.getOrSet.mockResolvedValueOnce(mockNonConformance);

      // Mock updateWithVersion: 0 rows affected
      mockDb.returning.mockResolvedValueOnce([]);
      // Mock existence check (entity exists but version mismatch)
      mockDb.limit.mockResolvedValueOnce([{ id: 'nc-uuid', version: 2 }]);

      await expect(service.update('nc-uuid', { version: 1, status: 'corrected' })).rejects.toThrow(
        ConflictException
      );
      // Stale cache should be deleted
      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close a corrected non-conformance', async () => {
      const correctedNc = {
        id: 'nc-uuid',
        status: NonConformanceStatus.CORRECTED,
        equipmentId: 'eq-uuid',
        ncType: 'calibration_overdue',
        calibrationId: 'cal-uuid',
      };
      const closeDto = { closureNotes: '종료 메모', version: 1 };

      // Mock findOne via cache
      mockCacheService.getOrSet.mockResolvedValueOnce(correctedNc);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
        const txWhere = jest.fn();
        // First where: CAS update returning → success (NC status update)
        txWhere.mockReturnValueOnce({
          returning: jest
            .fn()
            .mockResolvedValue([
              { ...correctedNc, status: NonConformanceStatus.CLOSED, version: 2 },
            ]),
        });
        // Second where: otherOpenNCs query → .limit(1)
        txWhere.mockReturnValueOnce({
          limit: jest.fn().mockResolvedValue([]),
        });
        // Third where: equipment version lookup → .limit(1)
        txWhere.mockReturnValueOnce({
          limit: jest
            .fn()
            .mockResolvedValue([{ id: 'eq-uuid', version: 1, status: 'non_conforming' }]),
        });
        // Fourth where: equipment CAS update → .returning()
        txWhere.mockReturnValueOnce({
          returning: jest.fn().mockResolvedValue([{ id: 'eq-uuid' }]),
        });

        const tx = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: txWhere,
        };
        return callback(tx);
      });

      const result = await service.close('nc-uuid', closeDto, 'closer-uuid');

      expect(result).toBeDefined();
      expect(result.status).toBe(NonConformanceStatus.CLOSED);
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when closing already closed', async () => {
      const closedNc = {
        id: 'nc-uuid',
        status: NonConformanceStatus.CLOSED,
        equipmentId: 'eq-uuid',
      };

      mockCacheService.getOrSet.mockResolvedValueOnce(closedNc);

      await expect(service.close('nc-uuid', { version: 1 }, 'closer-uuid')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when closing non-corrected', async () => {
      const openNc = {
        id: 'nc-uuid',
        status: NonConformanceStatus.OPEN,
        equipmentId: 'eq-uuid',
      };

      mockCacheService.getOrSet.mockResolvedValueOnce(openNc);

      await expect(service.close('nc-uuid', { version: 1 }, 'closer-uuid')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('rejectCorrection', () => {
    it('should reject correction and revert to open', async () => {
      const correctedNc = {
        id: 'nc-uuid',
        status: NonConformanceStatus.CORRECTED,
        equipmentId: 'eq-uuid',
        version: 1,
      };
      const dto = { version: 1, rejectionReason: '재검토 필요' };

      // Mock findOne
      mockCacheService.getOrSet.mockResolvedValueOnce(correctedNc);

      // Mock updateWithVersion success
      const updatedNc = { ...correctedNc, status: NonConformanceStatus.OPEN, version: 2 };
      mockDb.returning.mockResolvedValueOnce([updatedNc]);

      const result = await service.rejectCorrection('nc-uuid', dto, 'rejector-uuid');

      expect(result.status).toBe(NonConformanceStatus.OPEN);
      expect(mockCacheService.delete).toHaveBeenCalled();
      // cross-entity 캐시 무효화는 NC_CORRECTION_REJECTED 이벤트 → CacheEventListener가 처리
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED,
        expect.objectContaining({ ncId: 'nc-uuid', equipmentId: 'eq-uuid' })
      );
    });

    it('should throw BadRequestException when rejecting closed NC', async () => {
      const closedNc = {
        id: 'nc-uuid',
        status: NonConformanceStatus.CLOSED,
        equipmentId: 'eq-uuid',
      };

      mockCacheService.getOrSet.mockResolvedValueOnce(closedNc);

      await expect(
        service.rejectCorrection('nc-uuid', { version: 1, rejectionReason: 'test' }, 'user')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a non-conformance', async () => {
      const mockNc = { id: 'nc-uuid', status: 'open', equipmentId: 'eq-uuid', version: 1 };

      // Mock findOne (via getOrSet → db.query.nonConformances.findFirst)
      mockDb.query.nonConformances.findFirst.mockResolvedValueOnce(mockNc);
      // Mock updateWithVersion returning (CAS 성공)
      mockDb.returning.mockResolvedValueOnce([{ ...mockNc, version: 2, deletedAt: new Date() }]);

      const result = await service.remove('nc-uuid', 1);

      expect(result).toEqual({ id: 'nc-uuid', deleted: true });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing non-existent', async () => {
      // Mock findOne → not found
      mockDb.query.nonConformances.findFirst.mockResolvedValueOnce(null);

      await expect(service.remove('non-existent', 1)).rejects.toThrow(NotFoundException);
    });
  });
});
