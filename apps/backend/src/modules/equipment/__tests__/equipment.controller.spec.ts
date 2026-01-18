import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from '../equipment.controller';
import { EquipmentService } from '../equipment.service';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { EquipmentQueryDto } from '../dto/equipment-query.dto';
// 표준 상태값은 schemas 패키지에서 import
import { EquipmentStatusEnum, EquipmentStatus } from '@equipment-management/schemas';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../guards/permissions.guard';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let equipmentService: EquipmentService;

  const mockEquipment = {
    id: 1,
    uuid: 'test-uuid',
    name: '테스트 장비',
    managementNumber: 'EQP-TEST-001',
    assetNumber: null,
    modelName: null,
    manufacturer: null,
    serialNumber: null,
    description: null,
    location: '테스트 위치',
    calibrationCycle: null,
    lastCalibrationDate: null,
    nextCalibrationDate: null,
    calibrationAgency: null,
    needsIntermediateCheck: false,
    calibrationMethod: null,
    teamId: null,
    managerId: null,
    purchaseDate: null,
    price: null,
    supplier: null,
    contactInfo: null,
    softwareVersion: null,
    firmwareVersion: null,
    manualLocation: null,
    accessories: null,
    mainFeatures: null,
    technicalManager: null,
    status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const mockEquipmentList = {
    items: [mockEquipment],
    meta: {
      totalItems: 1,
      itemCount: 1,
      itemsPerPage: 20,
      totalPages: 1,
      currentPage: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true),
          },
        },
        {
          provide: PermissionsGuard,
          useValue: {
            canActivate: jest.fn().mockImplementation(() => true),
          },
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    equipmentService = module.get<EquipmentService>(EquipmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new equipment', async () => {
      // Arrange
      const createEquipmentDto: CreateEquipmentDto = {
        name: '새 장비',
        managementNumber: 'EQP-NEW-001',
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
        site: 'suwon', // ✅ 사이트별 권한 관리: 필수 필드
      };

      jest.spyOn(equipmentService, 'create').mockResolvedValue(mockEquipment);

      // Act
      const result = await controller.create(createEquipmentDto);

      // Assert
      expect(result).toEqual(mockEquipment);
      expect(equipmentService.create).toHaveBeenCalledWith(createEquipmentDto);
    });

    it('should throw BadRequestException when management number is duplicate', async () => {
      // Arrange
      const createEquipmentDto: CreateEquipmentDto = {
        name: '중복 장비',
        managementNumber: 'EQP-DUP-001',
        status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
        site: 'suwon', // ✅ 사이트별 권한 관리: 필수 필드
      };

      jest
        .spyOn(equipmentService, 'create')
        .mockRejectedValue(
          new BadRequestException('관리번호 EQP-DUP-001은(는) 이미 사용 중입니다.')
        );

      // Act & Assert
      await expect(controller.create(createEquipmentDto)).rejects.toThrow(BadRequestException);
      expect(equipmentService.create).toHaveBeenCalledWith(createEquipmentDto);
    });
  });

  describe('findAll', () => {
    it('should return a list of equipment', async () => {
      // Arrange
      const query: EquipmentQueryDto = {
        page: 1,
        pageSize: 20,
      };

      jest.spyOn(equipmentService, 'findAll').mockResolvedValue(mockEquipmentList);

      // Act
      const mockReq = { user: { site: undefined, roles: [] } } as any;
      const result = await controller.findAll(query, mockReq);

      // Assert
      expect(result).toEqual(mockEquipmentList);
      expect(equipmentService.findAll).toHaveBeenCalledWith(query, undefined);
    });

    it('should filter equipment by status', async () => {
      // Arrange
      const query: EquipmentQueryDto = {
        page: 1,
        pageSize: 20,
        status: 'in_use' as EquipmentStatus, // 표준 상태값: 사용 중
      };

      jest.spyOn(equipmentService, 'findAll').mockResolvedValue(mockEquipmentList);

      // Act
      const result = await controller.findAll(query, {
        user: { site: undefined, roles: [] },
      } as any);

      // Assert
      expect(result).toEqual(mockEquipmentList);
      expect(equipmentService.findAll).toHaveBeenCalledWith(query, undefined);
    });
  });

  describe('findOne', () => {
    it('should return an equipment by ID', async () => {
      // Arrange
      const id = '1';
      const mockReq = { user: { site: 'suwon', roles: ['technical_manager'] } } as any;

      jest.spyOn(equipmentService, 'findOne').mockResolvedValue(mockEquipment);

      // Act
      const result = await controller.findOne(id, mockReq);

      // Assert
      expect(result).toEqual(mockEquipment);
      expect(equipmentService.findOne).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      const id = '999';

      jest
        .spyOn(equipmentService, 'findOne')
        .mockRejectedValue(new NotFoundException('장비를 찾을 수 없습니다.'));

      // Act & Assert
      const mockReq = { user: { site: 'suwon', roles: ['technical_manager'] } } as any;
      await expect(controller.findOne(id, mockReq)).rejects.toThrow(NotFoundException);
      expect(equipmentService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update an equipment', async () => {
      // Arrange
      const id = '1';
      const updateEquipmentDto = {
        name: '업데이트된 장비명',
        location: '새로운 위치',
      } as any;

      const updatedEquipment = {
        ...mockEquipment,
        ...updateEquipmentDto,
      } as any;

      jest.spyOn(equipmentService, 'update').mockResolvedValue(updatedEquipment);

      // Act
      const result = await controller.update(id, updateEquipmentDto);

      // Assert
      expect(result).toEqual(updatedEquipment);
      expect(equipmentService.update).toHaveBeenCalledWith(id, updateEquipmentDto);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      const id = '999';
      const updateEquipmentDto = {
        name: '업데이트된 장비명',
      } as any;

      jest
        .spyOn(equipmentService, 'update')
        .mockRejectedValue(new NotFoundException('장비를 찾을 수 없습니다.'));

      // Act & Assert
      await expect(controller.update(id, updateEquipmentDto)).rejects.toThrow(NotFoundException);
      expect(equipmentService.update).toHaveBeenCalledWith(id, updateEquipmentDto);
    });
  });

  describe('remove', () => {
    it('should remove an equipment', async () => {
      // Arrange
      const id = '1';

      jest.spyOn(equipmentService, 'remove').mockResolvedValue(undefined);

      // Act
      await controller.remove(id);

      // Assert
      expect(equipmentService.remove).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      const id = '999';

      jest
        .spyOn(equipmentService, 'remove')
        .mockRejectedValue(new NotFoundException('장비를 찾을 수 없습니다.'));

      // Act & Assert
      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(equipmentService.remove).toHaveBeenCalledWith(id);
    });
  });
});
