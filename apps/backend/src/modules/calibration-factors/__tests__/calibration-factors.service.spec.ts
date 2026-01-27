import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CalibrationFactorsService } from '../calibration-factors.service';
import {
  CalibrationFactorTypeValues,
  CalibrationFactorApprovalStatusValues,
} from '@equipment-management/schemas';

// Backward compatibility aliases
const CalibrationFactorType = CalibrationFactorTypeValues;
const CalibrationFactorApprovalStatus = CalibrationFactorApprovalStatusValues;

describe('CalibrationFactorsService', () => {
  let service: CalibrationFactorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalibrationFactorsService],
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
    it('should create a new calibration factor with pending status', () => {
      const createDto = {
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        factorType: CalibrationFactorType.ANTENNA_GAIN,
        factorName: '테스트 안테나 이득',
        factorValue: 12.5,
        unit: 'dBi',
        effectiveDate: '2024-01-15',
        requestedBy: '550e8400-e29b-41d4-a716-446655440002',
      };

      const result = service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.equipmentId).toBe(createDto.equipmentId);
      expect(result.factorType).toBe(createDto.factorType);
      expect(result.factorName).toBe(createDto.factorName);
      expect(result.factorValue).toBe(createDto.factorValue);
      expect(result.unit).toBe(createDto.unit);
      expect(result.approvalStatus).toBe(CalibrationFactorApprovalStatus.PENDING);
      expect(result.requestedBy).toBe(createDto.requestedBy);
      expect(result.approvedBy).toBeNull();
    });

    it('should create a calibration factor with optional parameters', () => {
      const createDto = {
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        calibrationId: '550e8400-e29b-41d4-a716-446655440003',
        factorType: CalibrationFactorType.CABLE_LOSS,
        factorName: '10m 케이블 손실',
        factorValue: 2.3,
        unit: 'dB',
        effectiveDate: '2024-02-01',
        expiryDate: '2025-02-01',
        parameters: { length: '10m', frequency: '1GHz' },
        requestedBy: '550e8400-e29b-41d4-a716-446655440002',
      };

      const result = service.create(createDto);

      expect(result.calibrationId).toBe(createDto.calibrationId);
      expect(result.expiryDate).toBe(createDto.expiryDate);
      expect(result.parameters).toEqual(createDto.parameters);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of calibration factors', async () => {
      const result = await service.findAll({});

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.meta).toBeDefined();
      expect(result.meta.totalItems).toBeGreaterThanOrEqual(0);
      expect(result.meta.currentPage).toBe(1);
    });

    it('should filter by equipmentId', async () => {
      const equipmentId = '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p';
      const result = await service.findAll({ equipmentId });

      result.items.forEach((factor) => {
        expect(factor.equipmentId).toBe(equipmentId);
      });
    });

    it('should filter by approvalStatus', async () => {
      const approvalStatus = CalibrationFactorApprovalStatus.APPROVED;
      const result = await service.findAll({ approvalStatus });

      result.items.forEach((factor) => {
        expect(factor.approvalStatus).toBe(approvalStatus);
      });
    });

    it('should filter by factorType', async () => {
      const factorType = CalibrationFactorType.ANTENNA_GAIN;
      const result = await service.findAll({ factorType });

      result.items.forEach((factor) => {
        expect(factor.factorType).toBe(factorType);
      });
    });

    it('should search by factorName', async () => {
      const search = '안테나';
      const result = await service.findAll({ search });

      result.items.forEach((factor) => {
        expect(factor.factorName.toLowerCase()).toContain(search.toLowerCase());
      });
    });

    it('should paginate results', async () => {
      const result = await service.findAll({ page: 1, pageSize: 1 });

      expect(result.meta.itemsPerPage).toBe(1);
      expect(result.items.length).toBeLessThanOrEqual(1);
    });
  });

  describe('findOne', () => {
    it('should return a calibration factor by id', async () => {
      // 먼저 새로운 factor를 생성
      const created = service.create({
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        factorType: CalibrationFactorType.PATH_LOSS,
        factorName: 'findOne 테스트',
        factorValue: 5.0,
        unit: 'dB',
        effectiveDate: '2024-01-01',
        requestedBy: '550e8400-e29b-41d4-a716-446655440002',
      });

      const result = await service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.factorName).toBe('findOne 테스트');
    });

    it('should throw NotFoundException when factor not found', async () => {
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEquipment', () => {
    it('should return current factors for equipment', async () => {
      const equipmentId = '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p';
      const result = await service.findByEquipment(equipmentId);

      expect(result).toBeDefined();
      expect(result.equipmentId).toBe(equipmentId);
      expect(result.factors).toBeDefined();
      expect(Array.isArray(result.factors)).toBe(true);
      expect(result.count).toBe(result.factors.length);
    });
  });

  describe('getRegistry', () => {
    it('should return registry of all equipment factors', async () => {
      const result = await service.getRegistry();

      expect(result).toBeDefined();
      expect(result.registry).toBeDefined();
      expect(Array.isArray(result.registry)).toBe(true);
      expect(result.totalEquipments).toBeGreaterThanOrEqual(0);
      expect(result.totalFactors).toBeGreaterThanOrEqual(0);
      expect(result.generatedAt).toBeDefined();
    });
  });

  describe('findPendingApprovals', () => {
    it('should return only pending calibration factors', async () => {
      const result = await service.findPendingApprovals();

      result.items.forEach((factor) => {
        expect(factor.approvalStatus).toBe(CalibrationFactorApprovalStatus.PENDING);
      });
    });
  });

  describe('approve', () => {
    it('should approve a pending calibration factor', async () => {
      // 먼저 pending factor 생성
      const created = service.create({
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        factorType: CalibrationFactorType.AMPLIFIER_GAIN,
        factorName: '승인 테스트',
        factorValue: 20.0,
        unit: 'dB',
        effectiveDate: '2024-01-01',
        requestedBy: '550e8400-e29b-41d4-a716-446655440002',
      });

      const approveDto = {
        approverId: '550e8400-e29b-41d4-a716-446655440003',
        approverComment: '검토 완료, 승인합니다.',
      };

      const result = await service.approve(created.id, approveDto);

      expect(result.approvalStatus).toBe(CalibrationFactorApprovalStatus.APPROVED);
      expect(result.approvedBy).toBe(approveDto.approverId);
      expect(result.approverComment).toBe(approveDto.approverComment);
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw BadRequestException when approving non-pending factor', async () => {
      // 이미 승인된 factor 찾기
      const allFactors = await service.findAll({
        approvalStatus: CalibrationFactorApprovalStatus.APPROVED,
      });

      if (allFactors.items.length > 0) {
        const approvedFactor = allFactors.items[0];

        await expect(
          service.approve(approvedFactor.id, {
            approverId: '550e8400-e29b-41d4-a716-446655440003',
            approverComment: '중복 승인 시도',
          })
        ).rejects.toThrow(BadRequestException);
      }
    });
  });

  describe('reject', () => {
    it('should reject a pending calibration factor', async () => {
      // 먼저 pending factor 생성
      const created = service.create({
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        factorType: CalibrationFactorType.OTHER,
        factorName: '반려 테스트',
        factorValue: 1.0,
        unit: 'dB',
        effectiveDate: '2024-01-01',
        requestedBy: '550e8400-e29b-41d4-a716-446655440002',
      });

      const rejectDto = {
        approverId: '550e8400-e29b-41d4-a716-446655440003',
        rejectionReason: '값이 기준 범위를 벗어났습니다.',
      };

      const result = await service.reject(created.id, rejectDto);

      expect(result.approvalStatus).toBe(CalibrationFactorApprovalStatus.REJECTED);
      expect(result.approvedBy).toBe(rejectDto.approverId);
      expect(result.approverComment).toBe(rejectDto.rejectionReason);
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw BadRequestException when rejecting non-pending factor', async () => {
      // 이미 승인된 factor 찾기
      const allFactors = await service.findAll({
        approvalStatus: CalibrationFactorApprovalStatus.APPROVED,
      });

      if (allFactors.items.length > 0) {
        const approvedFactor = allFactors.items[0];

        await expect(
          service.reject(approvedFactor.id, {
            approverId: '550e8400-e29b-41d4-a716-446655440003',
            rejectionReason: '반려 시도',
          })
        ).rejects.toThrow(BadRequestException);
      }
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete a calibration factor', async () => {
      // 먼저 factor 생성
      const created = service.create({
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        factorType: CalibrationFactorType.CABLE_LOSS,
        factorName: '삭제 테스트',
        factorValue: 3.0,
        unit: 'dB',
        effectiveDate: '2024-01-01',
        requestedBy: '550e8400-e29b-41d4-a716-446655440002',
      });

      const result = await service.remove(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.deleted).toBe(true);

      // 삭제 후 조회 시 NotFoundException 발생해야 함
      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when removing non-existent factor', async () => {
      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
