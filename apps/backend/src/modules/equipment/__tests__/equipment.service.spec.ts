import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from '../equipment.service';
import { EquipmentHistoryService } from '../services/equipment-history.service';
import { ConfigService } from '@nestjs/config';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { EquipmentStatus } from '@equipment-management/schemas';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  createDrizzleSelectChain,
  createDrizzleInsertWithReturningChain,
  createDrizzleUpdateWithReturningChain,
} from '../../../common/__tests__/drizzle-stub';
import {
  createMockCacheService,
  createMockCacheInvalidationHelper,
} from '../../../common/testing/mock-providers';

const DRIZZLE_INSTANCE = 'DRIZZLE_INSTANCE';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let mockDb: {
    query: { equipment: { findFirst: jest.Mock; findMany: jest.Mock } };
    insert: jest.Mock;
    update: jest.Mock;
    select: jest.Mock;
    transaction: jest.Mock;
  };
  let mockCacheService: Record<string, jest.Mock>;

  const mockEquipment = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: '테스트 장비',
    managementNumber: 'EQP-TEST-001',
    status: 'available' as EquipmentStatus,
    site: 'suwon' as const,
    location: '테스트실',
    version: 1,
    isActive: true,
    teamId: null,
    managerId: null,
    deputyManagerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();

    mockDb = {
      query: {
        equipment: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      insert: jest.fn(),
      update: jest.fn(),
      select: jest.fn(),
      // transaction: 콜백에 mockDb 자체를 tx로 전달
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: DRIZZLE_INSTANCE, useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-value') },
        },
        {
          provide: CacheInvalidationHelper,
          useValue: createMockCacheInvalidationHelper(),
        },
        {
          provide: EquipmentHistoryService,
          useValue: {
            recordLocationChange: jest.fn(),
            recordStatusChange: jest.fn(),
            recordMaintenanceEvent: jest.fn(),
            recordIncident: jest.fn(),
            createLocationHistoryInternal: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new equipment with valid data', async () => {
      // 중복 체크: 없음
      mockDb.query.equipment.findFirst.mockResolvedValue(null);
      // INSERT ... RETURNING → [created]
      mockDb.insert.mockReturnValue(createDrizzleInsertWithReturningChain([mockEquipment]));
      // initialLocation 동기화용 SELECT ... LIMIT → [synced]
      mockDb.select.mockReturnValue(createDrizzleSelectChain([mockEquipment]));

      const createDto = {
        name: '테스트 장비',
        managementNumber: 'EQP-TEST-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon' as const,
        initialLocation: '수원 창고',
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.managementNumber).toBe(createDto.managementNumber);
      expect(mockDb.query.equipment.findFirst).toHaveBeenCalled();
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
    });

    it('should throw BadRequestException when management number already exists', async () => {
      // 중복 체크: 기존 장비 존재
      mockDb.query.equipment.findFirst.mockResolvedValue(mockEquipment);

      const createDto = {
        name: '중복 장비',
        managementNumber: 'EQP-TEST-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon' as const,
        initialLocation: '수원 창고',
      };

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate nextCalibrationDate when lastCalibrationDate and calibrationCycle are provided', async () => {
      const lastCalibrationDate = new Date('2023-01-15');
      const calibrationCycle = 12;
      const expectedNextDate = new Date(lastCalibrationDate);
      expectedNextDate.setMonth(expectedNextDate.getMonth() + calibrationCycle);

      const mockEquipmentWithCalibration = {
        ...mockEquipment,
        lastCalibrationDate,
        calibrationCycle,
        nextCalibrationDate: expectedNextDate,
      };

      mockDb.query.equipment.findFirst.mockResolvedValue(null);
      // INSERT ... RETURNING (location 없으므로 SELECT 동기화 없음)
      mockDb.insert.mockReturnValue(
        createDrizzleInsertWithReturningChain([mockEquipmentWithCalibration])
      );

      const createDto = {
        name: '교정 테스트 장비',
        managementNumber: 'EQP-CAL-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon' as const,
        lastCalibrationDate: lastCalibrationDate.toISOString(),
        calibrationCycle,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await service.create(createDto as any);

      expect(result.nextCalibrationDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of equipment', async () => {
      // findAll 전체 결과를 캐시 히트로 시뮬레이션 — DB 쿼리 순서 독립
      const expectedResult = {
        items: [mockEquipment],
        meta: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        summary: {},
      };
      mockCacheService.getOrSet.mockResolvedValue(expectedResult);

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should filter equipment by status', async () => {
      const filteredResult = {
        items: [mockEquipment],
        meta: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
        summary: { available: 1 },
      };
      mockCacheService.getOrSet.mockResolvedValue(filteredResult);

      const result = await service.findAll({
        page: 1,
        pageSize: 10,
        status: 'available' as EquipmentStatus,
      });

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return an equipment by UUID', async () => {
      // getOrSet pass-through → findFirst 실행
      mockCacheService.getOrSet.mockImplementation(async (_k, factory) => factory());
      mockDb.query.equipment.findFirst.mockResolvedValue(mockEquipment);
      // managerId/deputyManagerId 없으므로 SELECT users 실행 안 됨

      const result = await service.findOne(mockEquipment.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEquipment.id);
      expect(result.name).toBe(mockEquipment.name);
    });

    it('should throw NotFoundException for non-existent equipment', async () => {
      mockCacheService.getOrSet.mockImplementation(async (_k, factory) => factory());
      mockDb.query.equipment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an equipment with valid data', async () => {
      const updatedEquipment = {
        ...mockEquipment,
        name: '업데이트된 장비명',
        location: '새로운 위치',
        version: 2,
      };

      // findOne via getOrSet pass-through → findFirst
      mockCacheService.getOrSet.mockImplementation(async (_k, factory) => factory());
      mockDb.query.equipment.findFirst.mockResolvedValue(mockEquipment);
      // updateWithVersion: UPDATE ... SET ... WHERE ... RETURNING → [updatedEquipment]
      mockDb.update.mockReturnValue(createDrizzleUpdateWithReturningChain([updatedEquipment]));
      // 위치 변경 시 re-fetch SELECT ... LIMIT → [updatedEquipment]
      mockDb.select.mockReturnValue(createDrizzleSelectChain([updatedEquipment]));

      const updateDto = {
        name: '업데이트된 장비명',
        location: '새로운 위치',
        version: 1,
      };

      const result = await service.update(mockEquipment.id, updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
      expect(result.location).toBe(updateDto.location);
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent equipment', async () => {
      // findOne via getOrSet pass-through → findFirst returns null → NotFoundException
      mockCacheService.getOrSet.mockImplementation(async (_k, factory) => factory());
      mockDb.query.equipment.findFirst.mockResolvedValue(null);

      await expect(
        service.update('non-existent-uuid', { name: '새 이름', version: 1 })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an equipment by UUID', async () => {
      const softDeletedEquipment = { ...mockEquipment, isActive: false, version: 2 };
      // version 제공 시 findOne 스킵 — updateWithVersion 직접 호출
      // UPDATE ... SET ... WHERE ... RETURNING → [softDeletedEquipment]
      mockDb.update.mockReturnValue(createDrizzleUpdateWithReturningChain([softDeletedEquipment]));

      const result = await service.remove(mockEquipment.id, 1);

      expect(result.isActive).toBe(false);
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing non-existent equipment', async () => {
      // updateWithVersion 흐름:
      // 1) UPDATE ... RETURNING → [] (CAS 실패 또는 미존재)
      // 2) SELECT ... FROM ... WHERE ... LIMIT → [] (엔티티 미존재 확인)
      // → NotFoundException
      mockDb.update.mockReturnValue(createDrizzleUpdateWithReturningChain([]));
      mockDb.select.mockReturnValue(createDrizzleSelectChain([]));

      await expect(service.remove('non-existent-uuid', 1)).rejects.toThrow(NotFoundException);
    });
  });
});
