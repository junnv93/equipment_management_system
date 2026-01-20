import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NonConformancesService } from '../non-conformances.service';
import { NonConformanceStatus } from '../dto/non-conformance-query.dto';

describe('NonConformancesService', () => {
  let service: NonConformancesService;

  // Mock DB connection
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NonConformancesService,
        {
          provide: 'DRIZZLE_INSTANCE',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<NonConformancesService>(NonConformancesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      discoveredBy: 'test-user-uuid',
      cause: '테스트 부적합 원인',
      actionPlan: '테스트 조치 계획',
    };

    it('should create a new non-conformance', async () => {
      const mockNonConformance = {
        id: 'nc-uuid',
        ...createDto,
        status: NonConformanceStatus.OPEN,
        createdAt: new Date(),
      };

      // Mock equipment lookup
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([mockEquipment]);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const tx = {
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([mockNonConformance]),
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        };
        return callback(tx);
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.equipmentId).toBe(createDto.equipmentId);
      expect(result.status).toBe(NonConformanceStatus.OPEN);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when equipment is already non-conforming', async () => {
      const nonConformingEquipment = {
        ...mockEquipment,
        status: 'non_conforming',
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([nonConformingEquipment]);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of non-conformances', async () => {
      const mockItems = [
        { id: 'nc-1', status: 'open', equipmentId: 'eq-1' },
        { id: 'nc-2', status: 'open', equipmentId: 'eq-2' },
      ];

      // Mock count query
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce(mockItems);

      // Mock paginated query
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.limit.mockReturnThis();
      mockDb.offset.mockResolvedValueOnce(mockItems);

      const result = await service.findAll({});

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.totalItems).toBe(2);
    });

    it('should filter by equipmentId', async () => {
      const equipmentId = 'eq-1';
      const mockItems = [{ id: 'nc-1', status: 'open', equipmentId }];

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce(mockItems);
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.limit.mockReturnThis();
      mockDb.offset.mockResolvedValueOnce(mockItems);

      const result = await service.findAll({ equipmentId });

      expect(result.items.every((item: any) => item.equipmentId === equipmentId)).toBe(true);
    });

    it('should filter by status', async () => {
      const status = 'open';
      const mockItems = [{ id: 'nc-1', status, equipmentId: 'eq-1' }];

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce(mockItems);
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.orderBy.mockReturnThis();
      mockDb.limit.mockReturnThis();
      mockDb.offset.mockResolvedValueOnce(mockItems);

      const result = await service.findAll({ status });

      expect(result.items.every((item: any) => item.status === status)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a non-conformance by id', async () => {
      const mockNonConformance = {
        id: 'nc-uuid',
        status: 'open',
        equipmentId: 'eq-uuid',
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([mockNonConformance]);

      const result = await service.findOne('nc-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('nc-uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([]);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('isEquipmentNonConforming', () => {
    it('should return true when open non-conformance exists', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.limit.mockResolvedValueOnce([{ id: 'nc-1', status: 'open' }]);

      const result = await service.isEquipmentNonConforming('eq-uuid');

      expect(result).toBe(true);
    });

    it('should return false when no open non-conformance exists', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockReturnThis();
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
    };

    it('should update non-conformance', async () => {
      const updateDto = {
        analysisContent: '원인 분석 내용',
        status: 'analyzing' as const,
      };

      // Mock findOne
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([mockNonConformance]);

      // Mock update
      mockDb.update.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.where.mockReturnThis();
      mockDb.returning.mockResolvedValueOnce([{ ...mockNonConformance, ...updateDto }]);

      const result = await service.update('nc-uuid', updateDto);

      expect(result).toBeDefined();
      expect(result.analysisContent).toBe(updateDto.analysisContent);
    });

    it('should throw BadRequestException when updating closed non-conformance', async () => {
      const closedNonConformance = {
        ...mockNonConformance,
        status: NonConformanceStatus.CLOSED,
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([closedNonConformance]);

      await expect(service.update('nc-uuid', { analysisContent: 'test' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('close', () => {
    it('should close a corrected non-conformance', async () => {
      const mockNonConformance = {
        id: 'nc-uuid',
        status: NonConformanceStatus.CORRECTED,
        equipmentId: 'eq-uuid',
      };

      const closeDto = {
        closedBy: 'closer-uuid',
        closureNotes: '종료 메모',
      };

      // Mock findOne
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([mockNonConformance]);

      // Mock transaction
      mockDb.transaction.mockImplementation(async (callback) => {
        const tx = {
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest
            .fn()
            .mockResolvedValue([{ ...mockNonConformance, status: NonConformanceStatus.CLOSED }]),
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([]), // No other open non-conformances
        };
        return callback(tx);
      });

      const result = await service.close('nc-uuid', closeDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(NonConformanceStatus.CLOSED);
    });

    it('should throw BadRequestException when closing already closed non-conformance', async () => {
      const closedNonConformance = {
        id: 'nc-uuid',
        status: NonConformanceStatus.CLOSED,
        equipmentId: 'eq-uuid',
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([closedNonConformance]);

      await expect(service.close('nc-uuid', { closedBy: 'closer-uuid' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when closing non-corrected non-conformance', async () => {
      const openNonConformance = {
        id: 'nc-uuid',
        status: NonConformanceStatus.OPEN,
        equipmentId: 'eq-uuid',
      };

      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([openNonConformance]);

      await expect(service.close('nc-uuid', { closedBy: 'closer-uuid' })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a non-conformance', async () => {
      const mockNonConformance = {
        id: 'nc-uuid',
        status: 'open',
        equipmentId: 'eq-uuid',
      };

      // Mock findOne
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([mockNonConformance]);

      // Mock update (soft delete)
      mockDb.update.mockReturnThis();
      mockDb.set.mockReturnThis();
      mockDb.where.mockResolvedValueOnce(undefined);

      const result = await service.remove('nc-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('nc-uuid');
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when removing non-existent', async () => {
      mockDb.select.mockReturnThis();
      mockDb.from.mockReturnThis();
      mockDb.where.mockResolvedValueOnce([]);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
