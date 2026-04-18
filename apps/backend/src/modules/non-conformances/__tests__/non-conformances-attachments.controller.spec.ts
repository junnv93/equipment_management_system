import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

// enforceSiteAccess를 모듈 레벨에서 mock — site scoping은 별도 helper spec 소관.
jest.mock('../../../common/utils/enforce-site-access', () => ({
  enforceSiteAccess: jest.fn(),
}));

import { NonConformancesController } from '../non-conformances.controller';
import { NonConformancesService } from '../non-conformances.service';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { MulterFile } from '../../../types/common.types';
import type { AuthenticatedRequest } from '../../../types/auth';

/**
 * NC 전용 attachment 엔드포인트 테스트.
 *
 * 검증 목표:
 * - Controller가 NonConformancesService의 attachment 메서드로 올바르게 위임하는지
 * - 입력 유효성 검사(file 누락, 잘못된 documentType)
 * - Site scoping: findOneBasic → enforceSiteAccess 호출 순서 확인
 *
 * NOTE: document 생성/삭제 로직 및 캐시 이벤트 emit은 NonConformancesService 책임.
 * 해당 동작은 non-conformances.service.spec.ts에서 검증한다.
 */

const NC_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const DOC_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const USER_ID = '00000000-0000-0000-0000-000000000001';
const EQUIPMENT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

function makeReq(): AuthenticatedRequest {
  return {
    user: { userId: USER_ID, roles: ['test_engineer'], site: 'suwon' },
  } as unknown as AuthenticatedRequest;
}

function makeMockPhoto(): MulterFile {
  return {
    fieldname: 'file',
    originalname: 'site-photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('jpeg'),
    size: 2048,
  } as MulterFile;
}

describe('NonConformancesController (attachments)', () => {
  let controller: NonConformancesController;
  let mockNonConformancesService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockNonConformancesService = {
      findOneBasic: jest.fn().mockResolvedValue({
        equipmentSite: 'suwon',
        equipmentTeamId: 'team-1',
        equipmentId: EQUIPMENT_ID,
      }),
      listAttachments: jest.fn().mockResolvedValue([]),
      uploadAttachment: jest.fn().mockResolvedValue({
        document: { id: DOC_ID, nonConformanceId: NC_ID },
        message: '첨부가 업로드되었습니다.',
      }),
      deleteAttachment: jest.fn().mockResolvedValue({ message: '첨부가 삭제되었습니다.' }),
      getEquipmentSiteAndTeam: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      findOpenByEquipment: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      close: jest.fn(),
      rejectCorrection: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NonConformancesController],
      providers: [{ provide: NonConformancesService, useValue: mockNonConformancesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<NonConformancesController>(NonConformancesController);
  });

  describe('listAttachments()', () => {
    it('service.listAttachments에 uuid와 type을 전달하고 결과를 반환한다', async () => {
      const docs = [{ id: DOC_ID, nonConformanceId: NC_ID }];
      mockNonConformancesService.listAttachments.mockResolvedValue(docs);

      const result = await controller.listAttachments(NC_ID, makeReq());

      expect(mockNonConformancesService.findOneBasic).toHaveBeenCalledWith(NC_ID);
      expect(mockNonConformancesService.listAttachments).toHaveBeenCalledWith(NC_ID, undefined);
      expect(result).toEqual(docs);
    });

    it('잘못된 type 파라미터면 service 호출 없이 BadRequestException', async () => {
      await expect(controller.listAttachments(NC_ID, makeReq(), 'INVALID_TYPE')).rejects.toThrow(
        BadRequestException
      );
      expect(mockNonConformancesService.listAttachments).not.toHaveBeenCalled();
    });
  });

  describe('uploadAttachment()', () => {
    it('유효한 file+documentType 시 service.uploadAttachment에 equipmentId 포함해 위임', async () => {
      const result = await controller.uploadAttachment(
        NC_ID,
        makeMockPhoto(),
        'equipment_photo',
        makeReq()
      );

      expect(mockNonConformancesService.uploadAttachment).toHaveBeenCalledWith(
        NC_ID,
        expect.objectContaining({ originalname: 'site-photo.jpg' }),
        'equipment_photo',
        USER_ID,
        EQUIPMENT_ID,
        undefined
      );
      expect(result.document.id).toBe(DOC_ID);
    });

    it('file 없으면 service 호출 없이 BadRequestException', async () => {
      await expect(
        controller.uploadAttachment(
          NC_ID,
          undefined as unknown as MulterFile,
          'equipment_photo',
          makeReq()
        )
      ).rejects.toThrow(BadRequestException);
      expect(mockNonConformancesService.uploadAttachment).not.toHaveBeenCalled();
    });

    it('유효하지 않은 documentType이면 service 호출 없이 BadRequestException', async () => {
      await expect(
        controller.uploadAttachment(NC_ID, makeMockPhoto(), 'INVALID', makeReq())
      ).rejects.toThrow(BadRequestException);
      expect(mockNonConformancesService.uploadAttachment).not.toHaveBeenCalled();
    });
  });

  describe('deleteAttachment()', () => {
    it('site access 통과 후 service.deleteAttachment에 equipmentId 포함해 위임', async () => {
      const result = await controller.deleteAttachment(NC_ID, DOC_ID, makeReq());

      expect(mockNonConformancesService.findOneBasic).toHaveBeenCalledWith(NC_ID);
      expect(mockNonConformancesService.deleteAttachment).toHaveBeenCalledWith(
        NC_ID,
        DOC_ID,
        USER_ID,
        EQUIPMENT_ID
      );
      expect(result.message).toContain('삭제');
    });
  });
});
