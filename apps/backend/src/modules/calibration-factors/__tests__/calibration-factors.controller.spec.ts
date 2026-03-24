import { Test, TestingModule } from '@nestjs/testing';
import { CalibrationFactorsController } from '../calibration-factors.controller';
import { CalibrationFactorsService } from '../calibration-factors.service';
import { CalibrationFactorTypeValues } from '../dto/create-calibration-factor.dto';
import { CalibrationFactorApprovalStatusValues } from '../dto/calibration-factor-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { createMockPermissionsGuard } from '../../../common/testing/mock-providers';

// Backward compatibility aliases for test
const CalibrationFactorType = CalibrationFactorTypeValues;
const CalibrationFactorApprovalStatus = CalibrationFactorApprovalStatusValues;

describe('CalibrationFactorsController', () => {
  let controller: CalibrationFactorsController;
  let service: CalibrationFactorsService;

  const mockCalibrationFactorsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEquipment: jest.fn(),
    getRegistry: jest.fn(),
    findPendingApprovals: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    remove: jest.fn(),
    getFactorSiteAndTeam: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalibrationFactorsController],
      providers: [
        {
          provide: CalibrationFactorsService,
          useValue: mockCalibrationFactorsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue(createMockPermissionsGuard())
      .compile();

    controller = module.get<CalibrationFactorsController>(CalibrationFactorsController);
    service = module.get<CalibrationFactorsService>(CalibrationFactorsService);

    jest.clearAllMocks();

    // enforceFactorAccess에서 사용하는 기본 mock
    mockCalibrationFactorsService.findOne.mockResolvedValue({
      id: 'default-uuid',
      equipmentId: 'equip-uuid',
    });
    mockCalibrationFactorsService.getFactorSiteAndTeam.mockResolvedValue({
      site: 'suwon',
      teamId: 'team-uuid',
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new calibration factor', async () => {
      const requestedBy = '550e8400-e29b-41d4-a716-446655440002';
      const createDto = {
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        factorType: CalibrationFactorType.ANTENNA_GAIN,
        factorName: '3GHz 안테나 이득',
        factorValue: 12.5,
        unit: 'dBi',
        effectiveDate: '2024-01-15',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = {
        user: { userId: requestedBy, roles: ['test_engineer'], site: 'suwon', teamId: 'team-uuid' },
      } as any;

      const expectedResult = {
        id: 'new-factor-id',
        ...createDto,
        requestedBy,
        approvalStatus: 'pending',
        approvedBy: null,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCalibrationFactorsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto as never, mockReq);

      expect(service.create).toHaveBeenCalledWith(createDto, requestedBy);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of calibration factors', async () => {
      const query = { page: 1, pageSize: 20 };
      const expectedResult = {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: 20,
          totalPages: 0,
          currentPage: 1,
        },
      };

      mockCalibrationFactorsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('should filter by equipmentId', async () => {
      const query = {
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      };

      mockCalibrationFactorsService.findAll.mockResolvedValue({ items: [], meta: {} });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by approvalStatus', async () => {
      const query = {
        approvalStatus: CalibrationFactorApprovalStatus.PENDING,
      };

      mockCalibrationFactorsService.findAll.mockResolvedValue({ items: [], meta: {} });

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findPendingApprovals', () => {
    it('should return pending calibration factors', async () => {
      const expectedResult = {
        items: [
          {
            id: 'pending-factor-id',
            approvalStatus: 'pending',
          },
        ],
        meta: { totalItems: 1 },
      };

      mockCalibrationFactorsService.findPendingApprovals.mockResolvedValue(expectedResult);

      const result = await controller.findPendingApprovals({});

      expect(service.findPendingApprovals).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getRegistry', () => {
    it('should return calibration factor registry', async () => {
      const expectedResult = {
        registry: [],
        totalEquipments: 0,
        totalFactors: 0,
        generatedAt: new Date(),
      };

      mockCalibrationFactorsService.getRegistry.mockResolvedValue(expectedResult);

      const result = await controller.getRegistry({});

      expect(service.getRegistry).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByEquipment', () => {
    it('should return factors for specific equipment', async () => {
      const equipmentUuid = '550e8400-e29b-41d4-a716-446655440001';
      const expectedResult = {
        equipmentId: equipmentUuid,
        factors: [],
        count: 0,
      };

      mockCalibrationFactorsService.findByEquipment.mockResolvedValue(expectedResult);

      const result = await controller.findByEquipment(equipmentUuid);

      expect(service.findByEquipment).toHaveBeenCalledWith(equipmentUuid);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a calibration factor by uuid', async () => {
      const uuid = 'factor-uuid';
      const expectedResult = {
        id: uuid,
        factorName: 'Test Factor',
        approvalStatus: 'approved',
      };

      mockCalibrationFactorsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(uuid);

      expect(service.findOne).toHaveBeenCalledWith(uuid);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('approve', () => {
    it('should approve a pending calibration factor', async () => {
      const uuid = 'pending-factor-uuid';
      const approverId = '550e8400-e29b-41d4-a716-446655440003';
      const approveDto = {
        approverComment: '검토 완료',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = {
        user: {
          userId: approverId,
          roles: ['technical_manager'],
          site: 'suwon',
          teamId: 'team-uuid',
        },
      } as any;

      const expectedResult = {
        id: uuid,
        approvalStatus: 'approved',
        approvedBy: approverId,
        approverComment: approveDto.approverComment,
      };

      mockCalibrationFactorsService.approve.mockResolvedValue(expectedResult);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.approve(uuid, approveDto as any, mockReq);

      expect(service.approve).toHaveBeenCalledWith(uuid, { ...approveDto, approverId });
      expect(result.approvalStatus).toBe('approved');
      expect(result.approvedBy).toBe(approverId);
    });
  });

  describe('reject', () => {
    it('should reject a pending calibration factor', async () => {
      const uuid = 'pending-factor-uuid';
      const approverId = '550e8400-e29b-41d4-a716-446655440003';
      const rejectDto = {
        rejectionReason: '값이 범위를 벗어남',
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = {
        user: {
          userId: approverId,
          roles: ['technical_manager'],
          site: 'suwon',
          teamId: 'team-uuid',
        },
      } as any;

      const expectedResult = {
        id: uuid,
        approvalStatus: 'rejected',
        approvedBy: null,
        approverComment: rejectDto.rejectionReason,
      };

      mockCalibrationFactorsService.reject.mockResolvedValue(expectedResult);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await controller.reject(uuid, rejectDto as any, mockReq);

      expect(service.reject).toHaveBeenCalledWith(uuid, { ...rejectDto, approverId });
      expect(result.approvalStatus).toBe('rejected');
    });
  });

  describe('remove', () => {
    it('should soft delete a calibration factor', async () => {
      const uuid = 'factor-to-delete';
      const approverId = '550e8400-e29b-41d4-a716-446655440003';
      const expectedResult = {
        id: uuid,
        deleted: true,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReq = {
        user: {
          userId: approverId,
          roles: ['technical_manager'],
          site: 'suwon',
          teamId: 'team-uuid',
        },
      } as any;

      mockCalibrationFactorsService.remove.mockResolvedValue(expectedResult);
      mockCalibrationFactorsService.findOne.mockResolvedValue({
        id: uuid,
        equipmentId: 'equip-uuid',
      });
      mockCalibrationFactorsService.getFactorSiteAndTeam.mockResolvedValue({
        site: 'suwon',
        teamId: 'team-uuid',
      });

      const result = await controller.remove(uuid, 1, mockReq);

      expect(service.remove).toHaveBeenCalledWith(uuid, 1);
      expect(result).toEqual(expectedResult);
    });
  });
});
