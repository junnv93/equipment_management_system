import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CalibrationController } from '../calibration.controller';
import { CalibrationService } from '../calibration.service';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import { DocumentService } from '../../../common/file-upload/document.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import {
  createMockDocumentService,
  createMockFileUploadService,
  createMockPermissionsGuard,
} from '../../../common/testing/mock-providers';
import { DocumentTypeValues } from '@equipment-management/schemas';
import type { AuthenticatedRequest } from '../../../types/auth';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';
import type { MulterFile } from '../../../types/common.types';

describe('CalibrationController', () => {
  let controller: CalibrationController;
  let service: CalibrationService;

  const mockCalibrationService = {
    createWithDocuments: jest.fn(),
    createHistoricalRecord: jest.fn(),
    findAll: jest.fn(),
    findPendingApprovals: jest.fn(),
    findUpcomingIntermediateChecks: jest.fn(),
    findAllIntermediateChecks: jest.fn(),
    completeIntermediateCheck: jest.fn(),
    findByEquipment: jest.fn(),
    findDueCalibrations: jest.fn(),
    findByManager: jest.fn(),
    findScheduled: jest.fn(),
    getSummary: jest.fn(),
    getOverdueCalibrations: jest.fn(),
    getUpcomingCalibrations: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    completeCalibration: jest.fn(),
    approveCalibration: jest.fn(),
    rejectCalibration: jest.fn(),
    remove: jest.fn(),
    recordCertificateDocuments: jest.fn(),
    getEquipmentSiteAndTeam: jest.fn(),
    getCalibrationSiteAndTeam: jest.fn(),
  };

  const buildRequest = (
    overrides: Partial<AuthenticatedRequest['user']> = {}
  ): AuthenticatedRequest =>
    ({
      user: {
        userId: '550e8400-e29b-41d4-a716-446655440010',
        roles: ['test_engineer'],
        site: 'suwon',
        teamId: '550e8400-e29b-41d4-a716-446655440011',
        ...overrides,
      },
    }) as AuthenticatedRequest;

  const enforcedScope: EnforcedScope = {
    site: 'suwon',
    teamId: '550e8400-e29b-41d4-a716-446655440011',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalibrationController],
      providers: [
        { provide: CalibrationService, useValue: mockCalibrationService },
        { provide: FileUploadService, useValue: createMockFileUploadService() },
        { provide: DocumentService, useValue: createMockDocumentService() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue(createMockPermissionsGuard())
      .compile();

    controller = module.get<CalibrationController>(CalibrationController);
    service = module.get<CalibrationService>(CalibrationService);

    jest.clearAllMocks();

    mockCalibrationService.getEquipmentSiteAndTeam.mockResolvedValue(enforcedScope);
    mockCalibrationService.getCalibrationSiteAndTeam.mockResolvedValue(enforcedScope);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const equipmentId = '550e8400-e29b-41d4-a716-446655440001';
    const file = {
      originalname: 'certificate.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('certificate'),
    } as MulterFile;

    it('should enforce equipment scope and use the authenticated actor as SSOT', async () => {
      const registeredBy = '550e8400-e29b-41d4-a716-446655440010';
      const expectedResult = { calibration: { id: 'calibration-id' }, documents: [] };
      mockCalibrationService.createWithDocuments.mockResolvedValue(expectedResult);

      const result = await controller.create(
        JSON.stringify({
          equipmentId,
          calibrationDate: '2024-01-01',
          calibrationAgency: '한국교정기술원',
          registeredBy: '550e8400-e29b-41d4-a716-446655440099',
          calibrationManagerId: '550e8400-e29b-41d4-a716-446655440098',
        }),
        JSON.stringify([DocumentTypeValues.CALIBRATION_CERTIFICATE]),
        undefined,
        [file],
        buildRequest({ userId: registeredBy })
      );

      expect(service.getEquipmentSiteAndTeam).toHaveBeenCalledWith(equipmentId);
      expect(service.createWithDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          equipmentId,
          registeredBy,
          calibrationManagerId: registeredBy,
          registeredByRole: 'test_engineer',
        }),
        [file],
        [DocumentTypeValues.CALIBRATION_CERTIFICATE],
        [],
        registeredBy
      );
      expect(result).toEqual(expectedResult);
    });

    it('should reject cross-team equipment before creating calibration records', async () => {
      mockCalibrationService.getEquipmentSiteAndTeam.mockResolvedValue({
        site: 'suwon',
        teamId: '550e8400-e29b-41d4-a716-446655440012',
      });

      await expect(
        controller.create(
          JSON.stringify({
            equipmentId,
            calibrationDate: '2024-01-01',
            calibrationAgency: '한국교정기술원',
          }),
          JSON.stringify([DocumentTypeValues.CALIBRATION_CERTIFICATE]),
          undefined,
          [file],
          buildRequest()
        )
      ).rejects.toThrow(ForbiddenException);

      expect(service.createWithDocuments).not.toHaveBeenCalled();
    });
  });

  describe('createHistoricalRecord', () => {
    const equipmentId = '550e8400-e29b-41d4-a716-446655440001';

    it('should enforce equipment scope and register historical calibration with authenticated actor', async () => {
      const expectedResult = { id: 'calibration-id', equipmentId };
      mockCalibrationService.createHistoricalRecord.mockResolvedValue(expectedResult);

      const result = await controller.createHistoricalRecord(
        equipmentId,
        {
          calibrationDate: new Date('2024-01-01'),
          nextCalibrationDate: new Date('2025-01-01'),
          calibrationAgency: '한국교정기술원',
          result: 'pass',
        },
        buildRequest()
      );

      expect(service.getEquipmentSiteAndTeam).toHaveBeenCalledWith(equipmentId);
      expect(service.createHistoricalRecord).toHaveBeenCalledWith(
        equipmentId,
        expect.objectContaining({
          calibrationAgency: '한국교정기술원',
          result: 'pass',
        }),
        '550e8400-e29b-41d4-a716-446655440010',
        'test_engineer'
      );
      expect(result).toEqual(expectedResult);
    });

    it('should reject cross-team equipment before registering historical calibration', async () => {
      mockCalibrationService.getEquipmentSiteAndTeam.mockResolvedValue({
        site: 'suwon',
        teamId: '550e8400-e29b-41d4-a716-446655440012',
      });

      await expect(
        controller.createHistoricalRecord(
          equipmentId,
          {
            calibrationDate: new Date('2024-01-01'),
            calibrationAgency: '한국교정기술원',
          },
          buildRequest()
        )
      ).rejects.toThrow(ForbiddenException);

      expect(service.createHistoricalRecord).not.toHaveBeenCalled();
    });
  });

  describe('read access controls', () => {
    it('should enforce calibration scope before returning a single calibration', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440021';
      const expectedRecord = { id: uuid, equipmentId: 'equipment-id' };
      mockCalibrationService.findOne.mockResolvedValue(expectedRecord);

      const result = await controller.findOne(uuid, buildRequest());

      expect(service.getCalibrationSiteAndTeam).toHaveBeenCalledWith(uuid);
      expect(service.findOne).toHaveBeenCalledWith(uuid);
      expect(result).toEqual(expectedRecord);
    });

    it('should reject cross-site equipment before querying equipment calibrations', async () => {
      const equipmentId = '550e8400-e29b-41d4-a716-446655440001';
      mockCalibrationService.getEquipmentSiteAndTeam.mockResolvedValue({
        site: 'busan',
        teamId: enforcedScope.teamId,
      });

      await expect(controller.findByEquipment(equipmentId, buildRequest())).rejects.toThrow(
        ForbiddenException
      );

      expect(service.findByEquipment).not.toHaveBeenCalled();
    });
  });

  describe('enforced scope propagation', () => {
    it('should ignore raw pending query scope and use enforced scope only', async () => {
      const expectedResult = { items: [], meta: { totalItems: 0 } };
      mockCalibrationService.findPendingApprovals.mockResolvedValue(expectedResult);

      const result = await controller.findPendingApprovals(
        { site: 'busan', teamId: '550e8400-e29b-41d4-a716-446655440099' } as never,
        enforcedScope
      );

      expect(service.findPendingApprovals).toHaveBeenCalledWith(
        1,
        20,
        enforcedScope.site,
        enforcedScope.teamId
      );
      expect(result).toEqual(expectedResult);
    });

    it('should apply enforced scope to manager queries', async () => {
      const managerId = '550e8400-e29b-41d4-a716-446655440031';
      const expectedResult = { items: [], meta: { totalItems: 0 } };
      mockCalibrationService.findByManager.mockResolvedValue(expectedResult);

      const result = await controller.findByManager(managerId, enforcedScope);

      expect(service.findByManager).toHaveBeenCalledWith(
        managerId,
        enforcedScope.site,
        enforcedScope.teamId
      );
      expect(result).toEqual(expectedResult);
    });

    it('should apply enforced scope to scheduled queries', async () => {
      const expectedResult = { items: [], meta: { totalItems: 0 } };
      mockCalibrationService.findScheduled.mockResolvedValue(expectedResult);

      const result = await controller.findScheduled(enforcedScope, '2024-01-01', '2024-03-01');

      expect(service.findScheduled).toHaveBeenCalledWith(
        new Date('2024-01-01'),
        new Date('2024-03-01'),
        enforcedScope.site,
        enforcedScope.teamId
      );
      expect(result).toEqual(expectedResult);
    });

    it('should apply enforced scope to intermediate-check queries', async () => {
      const expectedResult: unknown[] = [];
      mockCalibrationService.findAllIntermediateChecks.mockResolvedValue(expectedResult);

      const result = await controller.findAllIntermediateChecks(
        enforcedScope,
        'pending',
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440031'
      );

      expect(service.findAllIntermediateChecks).toHaveBeenCalledWith({
        status: 'pending',
        equipmentId: '550e8400-e29b-41d4-a716-446655440001',
        managerId: '550e8400-e29b-41d4-a716-446655440031',
        site: enforcedScope.site,
        teamId: enforcedScope.teamId,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('mutation scope enforcement', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440021';

    beforeEach(() => {
      mockCalibrationService.getCalibrationSiteAndTeam.mockResolvedValue({
        site: 'busan',
        teamId: enforcedScope.teamId,
      });
    });

    it('should block update for cross-site calibration', async () => {
      await expect(controller.update(uuid, {} as never, buildRequest())).rejects.toThrow(
        ForbiddenException
      );
      expect(service.update).not.toHaveBeenCalled();
    });

    it('should block remove for cross-site calibration', async () => {
      await expect(controller.remove(uuid, 1, buildRequest())).rejects.toThrow(ForbiddenException);
      expect(service.remove).not.toHaveBeenCalled();
    });

    it('should block updateStatus for cross-site calibration', async () => {
      await expect(controller.updateStatus(uuid, {} as never, buildRequest())).rejects.toThrow(
        ForbiddenException
      );
      expect(service.updateStatus).not.toHaveBeenCalled();
    });

    it('should block completeCalibration for cross-site calibration', async () => {
      await expect(
        controller.completeCalibration(uuid, {} as never, buildRequest())
      ).rejects.toThrow(ForbiddenException);
      expect(service.completeCalibration).not.toHaveBeenCalled();
    });

    it('should block approveCalibration for cross-site calibration', async () => {
      await expect(
        controller.approveCalibration(uuid, {} as never, buildRequest())
      ).rejects.toThrow(ForbiddenException);
      expect(service.approveCalibration).not.toHaveBeenCalled();
    });

    it('should block rejectCalibration for cross-site calibration', async () => {
      await expect(controller.rejectCalibration(uuid, {} as never, buildRequest())).rejects.toThrow(
        ForbiddenException
      );
      expect(service.rejectCalibration).not.toHaveBeenCalled();
    });

    it('should block uploadDocuments for cross-site calibration', async () => {
      const file = {
        originalname: 'cert.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('x'),
      } as MulterFile;
      await expect(
        controller.uploadDocuments(
          uuid,
          [file],
          JSON.stringify([DocumentTypeValues.CALIBRATION_CERTIFICATE]),
          undefined,
          buildRequest()
        )
      ).rejects.toThrow(ForbiddenException);
      expect(service.findOne).not.toHaveBeenCalled();
    });

    it('should block completeIntermediateCheck for cross-site calibration', async () => {
      await expect(
        controller.completeIntermediateCheck(uuid, {} as never, buildRequest())
      ).rejects.toThrow(ForbiddenException);
      expect(service.completeIntermediateCheck).not.toHaveBeenCalled();
    });
  });
});
