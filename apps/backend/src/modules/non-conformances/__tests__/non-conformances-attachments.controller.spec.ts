import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// enforceSiteAccess를 모듈 레벨에서 mock — controller unit test에서 site scoping은 별도 helper spec 소관.
jest.mock('../../../common/utils/enforce-site-access', () => ({
  enforceSiteAccess: jest.fn(),
}));

import { NonConformancesController } from '../non-conformances.controller';
import { NonConformancesService } from '../non-conformances.service';
import { DocumentService } from '../../../common/file-upload/document.service';
import { createMockDocumentService } from '../../../common/testing/mock-providers';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NOTIFICATION_EVENTS } from '../../notifications/events/notification-events';
import type { MulterFile } from '../../../types/common.types';
import type { AuthenticatedRequest } from '../../../types/auth';

/**
 * NC 전용 attachment 엔드포인트 테스트.
 *
 * 검증 목표:
 * - REST 경계(`/non-conformances/:id/attachments`)가 DocumentService로 올바르게 위임되는지
 * - NC 소유권 검증(도메인 격리 — 다른 NC 소유 문서 삭제 방지)
 * - Permission guard는 mock으로 통과 — 실제 권한 매핑은 role-permissions.ts SSOT
 * - Site scoping: `findOneBasic`이 사전 체크에서 호출되는지 (실제 enforce는 별도 helper)
 */

const NC_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const DOC_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const OTHER_NC_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const USER_ID = '00000000-0000-0000-0000-000000000001';

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

const EQUIPMENT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

describe('NonConformancesController (attachments)', () => {
  let controller: NonConformancesController;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let mockNonConformancesService: Record<string, jest.Mock>;
  let mockEventEmitter: { emitAsync: jest.Mock };

  beforeEach(async () => {
    mockDocumentService = createMockDocumentService();
    mockNonConformancesService = {
      // Site scoping 사전체크에 사용. 모든 테스트는 같은 site/team을 가정.
      findOneBasic: jest.fn().mockResolvedValue({
        equipmentSite: 'suwon',
        equipmentTeamId: 'team-1',
        equipmentId: EQUIPMENT_ID,
      }),
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
    mockEventEmitter = { emitAsync: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NonConformancesController],
      providers: [
        { provide: NonConformancesService, useValue: mockNonConformancesService },
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<NonConformancesController>(NonConformancesController);
  });

  describe('listAttachments()', () => {
    it('DocumentService.findByNonConformanceId를 호출하고 결과 전달', async () => {
      mockDocumentService.findByNonConformanceId.mockResolvedValue([
        { id: DOC_ID, nonConformanceId: NC_ID },
      ]);

      const result = await controller.listAttachments(NC_ID, makeReq());

      expect(mockDocumentService.findByNonConformanceId).toHaveBeenCalledWith(NC_ID, undefined);
      expect(result).toHaveLength(1);
    });

    it('잘못된 type은 BadRequestException', async () => {
      await expect(controller.listAttachments(NC_ID, makeReq(), 'INVALID_TYPE')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('uploadAttachment()', () => {
    it('파일+documentType 유효 시 createDocument 호출 + nonConformanceId 주입', async () => {
      mockDocumentService.createDocument.mockResolvedValue({
        id: DOC_ID,
        nonConformanceId: NC_ID,
      });

      const result = await controller.uploadAttachment(
        NC_ID,
        makeMockPhoto(),
        'equipment_photo',
        makeReq()
      );

      expect(result.document.id).toBe(DOC_ID);
      expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          nonConformanceId: NC_ID,
          documentType: 'equipment_photo',
          uploadedBy: USER_ID,
        })
      );
    });

    it('업로드 성공 후 NC_ATTACHMENT_UPLOADED 이벤트를 emitAsync한다', async () => {
      mockDocumentService.createDocument.mockResolvedValue({
        id: DOC_ID,
        nonConformanceId: NC_ID,
      });

      await controller.uploadAttachment(NC_ID, makeMockPhoto(), 'equipment_photo', makeReq());

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.NC_ATTACHMENT_UPLOADED,
        expect.objectContaining({
          ncId: NC_ID,
          equipmentId: EQUIPMENT_ID,
          documentId: DOC_ID,
          actorId: USER_ID,
        })
      );
    });

    it('file 없으면 BadRequestException', async () => {
      await expect(
        controller.uploadAttachment(
          NC_ID,
          undefined as unknown as MulterFile,
          'equipment_photo',
          makeReq()
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('유효하지 않은 documentType이면 BadRequestException', async () => {
      await expect(
        controller.uploadAttachment(NC_ID, makeMockPhoto(), 'INVALID', makeReq())
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAttachment()', () => {
    it('문서 소유자가 일치하면 deleteDocument 호출', async () => {
      mockDocumentService.findByIdAnyStatus.mockResolvedValue({
        id: DOC_ID,
        nonConformanceId: NC_ID,
      });

      const result = await controller.deleteAttachment(NC_ID, DOC_ID, makeReq());

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(DOC_ID);
      expect(result.message).toContain('삭제');
    });

    it('삭제 성공 후 NC_ATTACHMENT_DELETED 이벤트를 emitAsync한다', async () => {
      mockDocumentService.findByIdAnyStatus.mockResolvedValue({
        id: DOC_ID,
        nonConformanceId: NC_ID,
      });

      await controller.deleteAttachment(NC_ID, DOC_ID, makeReq());

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        NOTIFICATION_EVENTS.NC_ATTACHMENT_DELETED,
        expect.objectContaining({
          ncId: NC_ID,
          equipmentId: EQUIPMENT_ID,
          documentId: DOC_ID,
          actorId: USER_ID,
        })
      );
    });

    it('문서 소유자가 다른 NC면 BadRequestException (도메인 격리)', async () => {
      mockDocumentService.findByIdAnyStatus.mockResolvedValue({
        id: DOC_ID,
        nonConformanceId: OTHER_NC_ID,
      });

      await expect(controller.deleteAttachment(NC_ID, DOC_ID, makeReq())).rejects.toThrow(
        BadRequestException
      );
      expect(mockDocumentService.deleteDocument).not.toHaveBeenCalled();
    });
  });
});
