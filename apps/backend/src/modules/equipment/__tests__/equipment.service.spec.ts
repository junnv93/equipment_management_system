import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from '../equipment.service';
import { DrizzleModule } from '../../../database/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../../../common/cache/cache.module';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { EquipmentQueryDto } from '../dto/equipment-query.dto';
// 표준 상태값은 schemas 패키지에서 import
import { EquipmentStatusEnum, EquipmentStatus } from '@equipment-management/schemas';
import * as crypto from 'crypto';

// 랜덤 문자열 생성 헬퍼 함수
const generateRandomString = (length = 8) => {
  return crypto.randomBytes(length).toString('hex');
};

describe('EquipmentService', () => {
  let service: EquipmentService;
  let moduleRef: TestingModule;
  const testEquipments: any[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        DrizzleModule,
        CacheModule,
      ],
      providers: [EquipmentService],
    }).compile();

    service = moduleRef.get<EquipmentService>(EquipmentService);
  });

  afterAll(async () => {
    // 테스트 완료 후 생성된 테스트 장비 정리
    for (const equipment of testEquipments) {
      try {
        await service.remove(equipment.id.toString());
      } catch (error) {
        console.log(`Error cleaning up test equipment ${equipment.id}: ${error.message}`);
      }
    }
    await moduleRef.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new equipment with valid data', async () => {
      const createEquipmentDto: CreateEquipmentDto = {
        name: `테스트 장비 ${generateRandomString()}`,
        managementNumber: `EQP-TEST-${generateRandomString()}`,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
      } as CreateEquipmentDto;

      const result = await service.create(createEquipmentDto);
      testEquipments.push(result); // 정리를 위해 추가

      expect(result).toBeDefined();
      expect(result.name).toBe(createEquipmentDto.name);
      expect(result.managementNumber).toBe(createEquipmentDto.managementNumber);
      expect(result.status).toBe(createEquipmentDto.status);
    });

    it('should throw an error when creating equipment with duplicate management number', async () => {
      const managementNumber = `EQP-DUP-${generateRandomString()}`;
      const createEquipmentDto: CreateEquipmentDto = {
        name: '중복 테스트 장비 1',
        managementNumber,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
      };

      const firstEquipment = await service.create(createEquipmentDto);
      testEquipments.push(firstEquipment);

      // 동일한 관리번호로 다시 생성 시도
      await expect(
        service.create({
          ...createEquipmentDto,
          name: '중복 테스트 장비 2',
        })
      ).rejects.toThrow();
    });

    it('should calculate nextCalibrationDate when lastCalibrationDate and calibrationCycle are provided', async () => {
      const lastCalibrationDate = new Date('2023-01-15');
      const calibrationCycle = 12; // 12개월
      const createEquipmentDto = {
        name: `교정 테스트 장비 ${generateRandomString()}`,
        managementNumber: `EQP-CAL-${generateRandomString()}`,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
        lastCalibrationDate: lastCalibrationDate.toISOString(),
        calibrationCycle,
      } as any;

      const result = await service.create(createEquipmentDto);
      testEquipments.push(result);

      expect(result).toBeDefined();
      expect(result.nextCalibrationDate).toBeDefined();

      // 다음 교정일이 올바르게 계산되었는지 확인
      const expectedNextDate = new Date(lastCalibrationDate);
      expectedNextDate.setMonth(expectedNextDate.getMonth() + calibrationCycle);

      const actualNextDate = new Date(result.nextCalibrationDate!);
      expect(actualNextDate.getFullYear()).toBe(expectedNextDate.getFullYear());
      expect(actualNextDate.getMonth()).toBe(expectedNextDate.getMonth());
    });
  });

  describe('findAll', () => {
    it('should return a list of equipment', async () => {
      // 기본 쿼리로 장비 목록 검색
      const query: EquipmentQueryDto = {
        page: 1,
        pageSize: 10,
      };

      const result = await service.findAll(query);

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.totalItems).toBeDefined();
      expect(result.meta.currentPage).toBe(query.page);
      expect(result.meta.itemsPerPage).toBe(query.pageSize);
    });

    it('should filter equipment by search term', async () => {
      // 고유한 검색어를 포함하는 장비 생성
      const uniqueString = generateRandomString();
      const createEquipmentDto: CreateEquipmentDto = {
        name: `고유 장비 ${uniqueString}`,
        managementNumber: `EQP-SEARCH-${generateRandomString()}`,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
      };

      const createdEquipment = await service.create(createEquipmentDto);
      testEquipments.push(createdEquipment);

      // 고유 문자열로 검색
      const query: EquipmentQueryDto = {
        page: 1,
        pageSize: 10,
        search: uniqueString,
      };

      const result = await service.findAll(query);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.some((eq) => eq.id === createdEquipment.id)).toBe(true);
    });

    it('should filter equipment by status', async () => {
      // 특정 상태의 장비 생성
      const createEquipmentDto: CreateEquipmentDto = {
        name: `상태 필터 테스트 ${generateRandomString()}`,
        managementNumber: `EQP-STATUS-${generateRandomString()}`,
        status: 'in_use' as EquipmentStatus, // 표준 상태값: 사용 중
      } as CreateEquipmentDto;

      const createdEquipment = await service.create(createEquipmentDto);
      testEquipments.push(createdEquipment);

      // 상태로 필터링
      const query: EquipmentQueryDto = {
        page: 1,
        pageSize: 10,
        status: 'in_use' as EquipmentStatus, // 표준 상태값: 사용 중
      };

      const result = await service.findAll(query);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.every((eq) => eq.status === 'in_use')).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return an equipment by ID', async () => {
      // 테스트 장비 생성
      const createEquipmentDto: CreateEquipmentDto = {
        name: `조회 테스트 장비 ${generateRandomString()}`,
        managementNumber: `EQP-FIND-${generateRandomString()}`,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
      };

      const createdEquipment = await service.create(createEquipmentDto);
      testEquipments.push(createdEquipment);

      // ID로 장비 조회
      const foundEquipment = await service.findOne(createdEquipment.id.toString());

      expect(foundEquipment).toBeDefined();
      expect(foundEquipment.id).toBe(createdEquipment.id);
      expect(foundEquipment.name).toBe(createEquipmentDto.name);
      expect(foundEquipment.managementNumber).toBe(createEquipmentDto.managementNumber);
    });

    it('should throw an error for non-existent equipment', async () => {
      // 존재하지 않는 ID로 조회
      const nonExistentId = '999999';

      await expect(service.findOne(nonExistentId)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update an equipment with valid data', async () => {
      // 테스트 장비 생성
      const createEquipmentDto: CreateEquipmentDto = {
        name: `업데이트 테스트 장비 ${generateRandomString()}`,
        managementNumber: `EQP-UPDATE-${generateRandomString()}`,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
      } as CreateEquipmentDto;

      const createdEquipment = await service.create(createEquipmentDto);
      testEquipments.push(createdEquipment);

      // 장비 정보 업데이트
      const updateEquipmentDto = {
        name: '업데이트된 장비명',
        location: '새로운 위치',
        status: 'in_use' as EquipmentStatus, // 표준 상태값: 사용 중
      } as any;

      const updatedEquipment = await service.update(
        createdEquipment.id.toString(),
        updateEquipmentDto
      );

      expect(updatedEquipment).toBeDefined();
      expect(updatedEquipment.id).toBe(createdEquipment.id);
      if (updateEquipmentDto.name) {
        expect(updatedEquipment.name).toBe(updateEquipmentDto.name);
      }
      if (updateEquipmentDto.location) {
        expect(updatedEquipment.location).toBe(updateEquipmentDto.location);
      }
      if (updateEquipmentDto.status) {
        expect(updatedEquipment.status).toBe(updateEquipmentDto.status);
      }
      expect(updatedEquipment.managementNumber).toBe(createdEquipment.managementNumber); // 관리번호는 변경되지 않아야 함
    });
  });

  describe('remove', () => {
    it('should remove an equipment by ID', async () => {
      // 테스트 장비 생성
      const createEquipmentDto: CreateEquipmentDto = {
        name: `삭제 테스트 장비 ${generateRandomString()}`,
        managementNumber: `EQP-REMOVE-${generateRandomString()}`,
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
      };

      const createdEquipment = await service.create(createEquipmentDto);

      // 장비 삭제
      await service.remove(createdEquipment.id.toString());

      // 삭제된 장비를 조회하면 오류가 발생해야 함
      await expect(service.findOne(createdEquipment.id.toString())).rejects.toThrow();
    });
  });
});
