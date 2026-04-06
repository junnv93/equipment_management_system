import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from '../equipment.controller';
import { EquipmentService } from '../equipment.service';
import { EquipmentApprovalService } from '../services/equipment-approval.service';
import { EquipmentAttachmentService } from '../services/equipment-attachment.service';
import { DocumentService } from '../../../common/file-upload/document.service';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { EquipmentQueryDto } from '../dto/equipment-query.dto';
// 표준 상태값은 schemas 패키지에서 import
import { EquipmentStatus } from '@equipment-management/schemas';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { InternalApiKeyGuard } from '../../../common/guards/internal-api-key.guard';
import { AuthenticatedRequest } from '../../../types/common.types';

// 테스트용 mock request 타입 (AuthenticatedRequest의 부분 구현)
type MockRequest = Partial<AuthenticatedRequest> & {
  user: { roles: string[]; userId: string; site?: string };
};

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let equipmentService: EquipmentService;

  const mockEquipment = {
    id: 'test-uuid',
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
    teamName: null,
    managerId: null,
    purchaseYear: null,
    price: null,
    supplier: null,
    contactInfo: null,
    firmwareVersion: null,
    manualLocation: null,
    accessories: null,
    technicalManager: null,
    status: 'available' as EquipmentStatus, // 표준 상태값: 사용 가능
    isActive: true,
    isShared: false, // 공용장비 여부
    site: 'suwon', // 사이트 정보
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    summary: { available: 1 },
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
          provide: EquipmentApprovalService,
          useValue: {
            createEquipmentRequest: jest.fn(),
            findPendingRequests: jest.fn(),
            findRequestByUuid: jest.fn(),
            approveRequest: jest.fn(),
            rejectRequest: jest.fn(),
            getRequestHistory: jest.fn(),
          },
        },
        {
          provide: EquipmentAttachmentService,
          useValue: {
            createAttachment: jest.fn(),
            findByEquipmentId: jest.fn(),
            findByRequestId: jest.fn(),
            deleteAttachment: jest.fn(),
          },
        },
        {
          provide: DocumentService,
          useValue: {
            getDocumentsByEquipment: jest.fn(),
            createDocument: jest.fn(),
            deleteDocument: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(InternalApiKeyGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

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
    let approvalService: EquipmentApprovalService;

    beforeEach(() => {
      approvalService = controller['approvalService'];
    });

    it('should create a new equipment (admin direct approval)', async () => {
      // Arrange
      const createEquipmentDto: CreateEquipmentDto = {
        name: '새 장비',
        managementNumber: 'EQP-NEW-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon',
        approvalStatus: 'approved', // 관리자 직접 승인
        initialLocation: '수원 창고',
      };

      jest.spyOn(equipmentService, 'create').mockResolvedValue(mockEquipment);

      // Act - admin user로 직접 승인
      const mockReq = { user: { roles: ['lab_manager'], userId: 'admin-uuid' } } as MockRequest;
      const result = await controller.create(
        createEquipmentDto,
        undefined,
        mockReq as AuthenticatedRequest
      );

      // Assert
      expect(result).toEqual(mockEquipment);
      expect(equipmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...createEquipmentDto, approvalStatus: 'approved' }),
        'admin-uuid'
      );
    });

    it('should create equipment request for non-admin user', async () => {
      // Arrange
      const createEquipmentDto: CreateEquipmentDto = {
        name: '새 장비',
        managementNumber: 'EQP-NEW-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon',
        initialLocation: '수원 창고',
      };

      const mockRequest = {
        id: 'request-uuid',
        requestType: 'create',
        requestedBy: 'user-uuid',
        approvalStatus: 'pending_approval',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(approvalService, 'createEquipmentRequest').mockResolvedValue(mockRequest as any);

      // Act - 일반 사용자로 승인 요청 생성
      const mockReq = { user: { roles: ['test_engineer'], userId: 'user-uuid' } } as MockRequest;
      const result = await controller.create(
        createEquipmentDto,
        undefined,
        mockReq as AuthenticatedRequest
      );

      // Assert
      expect(result).toEqual({
        message: '장비 등록 요청이 생성되었습니다.',
        requestUuid: 'request-uuid',
        request: mockRequest,
      });
      expect(approvalService.createEquipmentRequest).toHaveBeenCalledWith(
        createEquipmentDto,
        'user-uuid',
        []
      );
    });

    it('should throw BadRequestException when management number is duplicate (admin)', async () => {
      // Arrange
      const createEquipmentDto: CreateEquipmentDto = {
        name: '중복 장비',
        managementNumber: 'EQP-DUP-001',
        status: 'available' as EquipmentStatus,
        site: 'suwon',
        approvalStatus: 'approved',
        initialLocation: '수원 창고',
      };

      jest
        .spyOn(equipmentService, 'create')
        .mockRejectedValue(
          new BadRequestException('관리번호 EQP-DUP-001은(는) 이미 사용 중입니다.')
        );

      // Act & Assert - admin user
      const mockReq = { user: { roles: ['lab_manager'], userId: 'admin-uuid' } } as MockRequest;
      await expect(
        controller.create(createEquipmentDto, undefined, mockReq as AuthenticatedRequest)
      ).rejects.toThrow(BadRequestException);
      expect(equipmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...createEquipmentDto, approvalStatus: 'approved' }),
        'admin-uuid'
      );
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

      // Act — SiteScopeInterceptor가 site 주입을 담당 (단위 테스트에서는 통합 생략)
      const result = await controller.findAll(query);

      // Assert
      expect(result).toEqual(mockEquipmentList);
      expect(equipmentService.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter equipment by status', async () => {
      // Arrange
      const query: EquipmentQueryDto = {
        page: 1,
        pageSize: 20,
        status: 'spare' as EquipmentStatus,
      };

      jest.spyOn(equipmentService, 'findAll').mockResolvedValue(mockEquipmentList);

      // Act — SiteScopeInterceptor가 site 주입을 담당 (단위 테스트에서는 통합 생략)
      const result = await controller.findAll(query);

      // Assert
      expect(result).toEqual(mockEquipmentList);
      expect(equipmentService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return an equipment by ID', async () => {
      // Arrange
      const id = '1';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = { user: { site: 'suwon', roles: ['technical_manager'] } } as any;

      jest.spyOn(equipmentService, 'findOne').mockResolvedValue(mockEquipment);

      // Act
      const result = await controller.findOne(id, mockReq);

      // Assert
      expect(result).toEqual(mockEquipment);
      expect(equipmentService.findOne).toHaveBeenCalledWith(id, true);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      const id = '999';

      jest
        .spyOn(equipmentService, 'findOne')
        .mockRejectedValue(new NotFoundException('장비를 찾을 수 없습니다.'));

      // Act & Assert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = { user: { site: 'suwon', roles: ['technical_manager'] } } as any;
      await expect(controller.findOne(id, mockReq)).rejects.toThrow(NotFoundException);
      expect(equipmentService.findOne).toHaveBeenCalledWith(id, true);
    });
  });

  describe('update', () => {
    it('should update an equipment (admin direct approval)', async () => {
      // Arrange
      const uuid = 'test-uuid';
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const updateEquipmentDto = {
        name: '업데이트된 장비명',
        location: '새로운 위치',
        approvalStatus: 'approved',
      } as any;

      const updatedEquipment = {
        ...mockEquipment,
        ...updateEquipmentDto,
      } as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // 공용장비 체크를 위한 findOne mock
      jest.spyOn(equipmentService, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentService, 'update').mockResolvedValue(updatedEquipment);

      // Act - admin user로 직접 승인 (site 필수: enforceSiteAccess 검증)
      const mockReq = {
        user: { roles: ['lab_manager'], userId: 'admin-uuid', site: 'suwon' },
      } as MockRequest;
      const result = await controller.update(
        uuid,
        updateEquipmentDto,
        undefined,
        mockReq as AuthenticatedRequest
      );

      // Assert
      expect(result).toEqual(updatedEquipment);
      expect(equipmentService.findOne).toHaveBeenCalledWith(uuid);
      expect(equipmentService.update).toHaveBeenCalledWith(uuid, updateEquipmentDto, 'admin-uuid');
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      const uuid = '999';
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const updateEquipmentDto = {
        name: '업데이트된 장비명',
      } as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */

      // findOne에서 먼저 NotFoundException 발생
      jest
        .spyOn(equipmentService, 'findOne')
        .mockRejectedValue(new NotFoundException('장비를 찾을 수 없습니다.'));

      // Act & Assert
      const mockReq = { user: { roles: ['lab_manager'], userId: 'admin-uuid' } } as MockRequest;
      await expect(
        controller.update(uuid, updateEquipmentDto, undefined, mockReq as AuthenticatedRequest)
      ).rejects.toThrow(NotFoundException);
      expect(equipmentService.findOne).toHaveBeenCalledWith(uuid);
    });
  });

  describe('remove', () => {
    it('should remove an equipment (admin direct delete)', async () => {
      // Arrange
      const uuid = 'test-uuid';

      // 공용장비 체크를 위한 findOne mock
      jest.spyOn(equipmentService, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentService, 'remove').mockResolvedValue(mockEquipment);

      // Act - admin user로 직접 삭제 (site 필수: enforceSiteAccess 검증)
      const mockReq = {
        user: { roles: ['lab_manager'], userId: 'admin-uuid', site: 'suwon' },
      } as MockRequest;
      const result = await controller.remove(uuid, undefined, mockReq as AuthenticatedRequest);

      // Assert
      expect(result).toEqual({ message: '장비가 삭제되었습니다.' });
      expect(equipmentService.findOne).toHaveBeenCalledWith(uuid);
      expect(equipmentService.remove).toHaveBeenCalledWith(uuid, 1);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      // Arrange
      const uuid = '999';

      // findOne에서 먼저 NotFoundException 발생
      jest
        .spyOn(equipmentService, 'findOne')
        .mockRejectedValue(new NotFoundException('장비를 찾을 수 없습니다.'));

      // Act & Assert
      const mockReq = { user: { roles: ['lab_manager'], userId: 'admin-uuid' } } as MockRequest;
      await expect(
        controller.remove(uuid, undefined, mockReq as AuthenticatedRequest)
      ).rejects.toThrow(NotFoundException);
      expect(equipmentService.findOne).toHaveBeenCalledWith(uuid);
    });
  });
});
