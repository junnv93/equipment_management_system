import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from '../equipment.service';
import { ConfigService } from '@nestjs/config';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EquipmentStatus } from '@equipment-management/schemas';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Drizzle 인스턴스 토큰 (drizzle.module.ts에서 정의)
const DRIZZLE_INSTANCE = 'DRIZZLE_INSTANCE';

/**
 * EquipmentService 유닛 테스트
 *
 * Best Practice: 유닛 테스트에서는 외부 의존성(DB)을 모킹합니다.
 * 실제 DB 연결이 필요한 테스트는 통합 테스트(*.integration.spec.ts)로 분리합니다.
 */
describe('EquipmentService', () => {
  let service: EquipmentService;
  let mockDb: any;
  let mockCacheService: any;

  // 테스트용 mock 데이터 (id가 uuid 타입으로 변경됨)
  const mockEquipment = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: '테스트 장비',
    managementNumber: 'EQP-TEST-001',
    status: 'available' as EquipmentStatus,
    site: 'suwon' as const,
    location: '테스트실',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // DB 쿼리 모킹
    mockDb = {
      query: {
        equipment: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    // 캐시 서비스 모킹
    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((_key, factory) => factory()),
      invalidatePattern: jest.fn(),
      deleteByPattern: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: DRIZZLE_INSTANCE,
          useValue: mockDb,
        },
        {
          provide: SimpleCacheService,
          useValue: mockCacheService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
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
      // Arrange: 중복 체크에서 null 반환 (중복 없음)
      mockDb.query.equipment.findFirst.mockResolvedValue(null);
      mockDb.returning.mockResolvedValue([mockEquipment]);

      const createDto = {
        name: '테스트 장비',
        managementNumber: 'EQP-TEST-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon' as const,
      };

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(result.managementNumber).toBe(createDto.managementNumber);
      expect(mockDb.query.equipment.findFirst).toHaveBeenCalled();
      expect(mockCacheService.deleteByPattern).toHaveBeenCalled();
    });

    it('should throw BadRequestException when management number already exists', async () => {
      // Arrange: 중복 체크에서 기존 장비 반환
      mockDb.query.equipment.findFirst.mockResolvedValue(mockEquipment);

      const createDto = {
        name: '중복 장비',
        managementNumber: 'EQP-TEST-001', // 이미 존재하는 번호
        status: 'available' as EquipmentStatus,
        site: 'suwon' as const,
      };

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate nextCalibrationDate when lastCalibrationDate and calibrationCycle are provided', async () => {
      // Arrange
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
      mockDb.returning.mockResolvedValue([mockEquipmentWithCalibration]);

      const createDto = {
        name: '교정 테스트 장비',
        managementNumber: 'EQP-CAL-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon' as const,
        lastCalibrationDate: lastCalibrationDate.toISOString(),
        calibrationCycle,
      };

      // Act
      const result = await service.create(createDto as any);

      // Assert
      expect(result.nextCalibrationDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of equipment', async () => {
      // Arrange
      const mockEquipmentList = [mockEquipment, { ...mockEquipment, id: 2, uuid: 'uuid-2' }];

      // 캐시가 팩토리 함수를 실행하도록 설정
      mockCacheService.getOrSet.mockImplementation(
        async (_key: string, factory: () => Promise<any>) => {
          return await factory();
        }
      );

      // select().from().where()... 체인의 최종 결과
      mockDb.offset.mockResolvedValue(mockEquipmentList);

      // COUNT 쿼리 결과
      const mockCountResult = [{ count: 2 }];
      mockDb.where.mockResolvedValueOnce(mockCountResult);

      const query = { page: 1, pageSize: 10 };

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(mockCacheService.getOrSet).toHaveBeenCalled();
    });

    it('should filter equipment by status', async () => {
      // Arrange
      const mockFilteredList = [mockEquipment];

      mockCacheService.getOrSet.mockImplementation(
        async (_key: string, factory: () => Promise<any>) => {
          return await factory();
        }
      );
      mockDb.offset.mockResolvedValue(mockFilteredList);
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);

      const query = { page: 1, pageSize: 10, status: 'available' as EquipmentStatus };

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return an equipment by UUID', async () => {
      // Arrange
      mockDb.query.equipment.findFirst.mockResolvedValue(mockEquipment);

      // Act
      const result = await service.findOne(mockEquipment.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(mockEquipment.id);
      expect(result.name).toBe(mockEquipment.name);
    });

    it('should throw NotFoundException for non-existent equipment', async () => {
      // Arrange
      mockDb.query.equipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an equipment with valid data', async () => {
      // Arrange
      const updatedEquipment = {
        ...mockEquipment,
        name: '업데이트된 장비명',
        location: '새로운 위치',
      };

      mockDb.query.equipment.findFirst.mockResolvedValue(mockEquipment);
      mockDb.returning.mockResolvedValue([updatedEquipment]);

      const updateDto = {
        name: '업데이트된 장비명',
        location: '새로운 위치',
        version: 1, // ✅ Optimistic locking version
      };

      // Act
      const result = await service.update(mockEquipment.id, updateDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(updateDto.name);
      expect(result.location).toBe(updateDto.location);
      expect(mockCacheService.deleteByPattern).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating non-existent equipment', async () => {
      // Arrange
      mockDb.query.equipment.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update('non-existent-uuid', { name: '새 이름', version: 1 })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete an equipment by UUID', async () => {
      // Arrange: remove는 soft delete (update)를 수행
      const softDeletedEquipment = { ...mockEquipment, isActive: false };
      mockDb.returning.mockResolvedValue([softDeletedEquipment]);

      // Act
      const result = await service.remove(mockEquipment.id);

      // Assert
      expect(mockDb.update).toHaveBeenCalled();
      expect(result.isActive).toBe(false);
      expect(mockCacheService.deleteByPattern).toHaveBeenCalled();
    });

    it('should throw NotFoundException when removing non-existent equipment', async () => {
      // Arrange: returning이 빈 배열을 반환하면 NotFoundException
      mockDb.returning.mockResolvedValue([]);

      // Act & Assert
      await expect(service.remove('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
