import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DocumentsController } from '../documents.controller';
import { DocumentService } from '../../../common/file-upload/document.service';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import { STORAGE_PROVIDER } from '../../../common/storage/storage.interface';
import {
  createMockDocumentService,
  createMockFileUploadService,
  createMockStorageProvider,
  createMockPermissionsGuard,
} from '../../../common/testing/mock-providers';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { MulterFile } from '../../../types/common.types';
import type { AuthenticatedRequest } from '../../../types/auth';
import type { Response } from 'express';

const MOCK_USER_ID = 'user-uuid-1';
const MOCK_DOC_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const MOCK_EQUIPMENT_ID = '11111111-1111-1111-1111-111111111111';
const MOCK_CALIBRATION_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const MOCK_EQUIPMENT_ID_2 = '22222222-2222-2222-2222-222222222222';

function makeReq(userId = MOCK_USER_ID): AuthenticatedRequest {
  return { user: { userId, roles: ['test_engineer'] } } as AuthenticatedRequest;
}

function makeMockFile(): MulterFile {
  return {
    fieldname: 'file',
    originalname: 'report.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('pdf-content'),
    size: 512,
  } as MulterFile;
}

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let mockDocumentService: ReturnType<typeof createMockDocumentService>;
  let mockFileUploadService: ReturnType<typeof createMockFileUploadService>;
  let mockStorageProvider: ReturnType<typeof createMockStorageProvider>;

  beforeEach(async () => {
    mockDocumentService = createMockDocumentService();
    mockFileUploadService = createMockFileUploadService();
    mockStorageProvider = createMockStorageProvider();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: STORAGE_PROVIDER, useValue: mockStorageProvider },
        { provide: PermissionsGuard, useValue: createMockPermissionsGuard() },
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  // ─── uploadDocument ───────────────────────────────────────────────────────

  describe('uploadDocument()', () => {
    it('파일과 documentType이 유효하면 문서를 생성하고 반환한다', async () => {
      const file = makeMockFile();
      const req = makeReq();
      mockDocumentService.createDocument.mockResolvedValue({
        id: MOCK_DOC_ID,
        documentType: 'calibration_certificate' as const,
        status: 'active',
      });

      const result = await controller.uploadDocument(
        file,
        'calibration_certificate',
        req,
        MOCK_EQUIPMENT_ID
      );

      expect(result.document.id).toBe(MOCK_DOC_ID);
      expect(result.message).toContain('업로드');
      expect(mockDocumentService.createDocument).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          documentType: 'calibration_certificate',
          equipmentId: MOCK_EQUIPMENT_ID,
        })
      );
    });

    it('file이 없으면 BadRequestException을 던진다', async () => {
      const req = makeReq();

      await expect(
        controller.uploadDocument(undefined as unknown as MulterFile, 'report', req)
      ).rejects.toThrow(BadRequestException);
    });

    it('유효하지 않은 documentType이면 BadRequestException을 던진다', async () => {
      const file = makeMockFile();
      const req = makeReq();

      await expect(controller.uploadDocument(file, 'INVALID_TYPE', req)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('calibrationId가 있으면 findByCalibrationId를 호출한다', async () => {
      mockDocumentService.findByCalibrationId.mockResolvedValue([]);

      const result = await controller.list(undefined, MOCK_CALIBRATION_ID);

      expect(mockDocumentService.findByCalibrationId).toHaveBeenCalledWith(
        MOCK_CALIBRATION_ID,
        undefined
      );
      expect(result).toEqual([]);
    });

    it('equipmentId가 있으면 findByEquipmentId를 호출한다', async () => {
      mockDocumentService.findByEquipmentId.mockResolvedValue([]);

      const result = await controller.list(MOCK_EQUIPMENT_ID_2);

      expect(mockDocumentService.findByEquipmentId).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('includeCalibrations=true이면 findAllByEquipmentId를 호출한다', async () => {
      mockDocumentService.findAllByEquipmentId.mockResolvedValue([]);

      const result = await controller.list(
        MOCK_EQUIPMENT_ID_2,
        undefined,
        undefined,
        undefined,
        undefined,
        'true'
      );

      expect(mockDocumentService.findAllByEquipmentId).toHaveBeenCalledWith(MOCK_EQUIPMENT_ID_2);
      expect(result).toEqual([]);
    });

    it('아무 ID도 없으면 빈 배열을 반환한다', async () => {
      const result = await controller.list();
      expect(result).toEqual([]);
    });

    it('잘못된 UUID 형식의 equipmentId는 BadRequestException을 던진다', async () => {
      await expect(controller.list('not-a-uuid')).rejects.toThrow(BadRequestException);
    });

    it('유효하지 않은 documentType은 BadRequestException을 던진다', async () => {
      const eqId = 'eq-uuid-1111-1111-1111-111111111111';
      await expect(
        controller.list(eqId, undefined, undefined, undefined, 'INVALID')
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── download ─────────────────────────────────────────────────────────────

  describe('download()', () => {
    it('Local 드라이버: readFile로 파일을 읽어 응답을 전송한다', async () => {
      mockStorageProvider.supportsPresignedUrl.mockReturnValue(false);
      const docRecord = {
        id: MOCK_DOC_ID,
        filePath: 'equipment/report.pdf',
        originalFileName: 'report.pdf',
        mimeType: 'application/pdf',
        fileHash: 'abc123',
      };
      mockDocumentService.findByIdAnyStatus.mockResolvedValue(docRecord);
      mockFileUploadService.readFile.mockResolvedValue(Buffer.from('pdf-content'));

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.download(MOCK_DOC_ID, mockRes);

      expect(mockFileUploadService.readFile).toHaveBeenCalledWith(docRecord.filePath);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('S3 드라이버: presigned URL을 JSON으로 반환한다', async () => {
      mockStorageProvider.supportsPresignedUrl.mockReturnValue(true);
      mockStorageProvider.getPresignedDownloadUrl = jest
        .fn()
        .mockResolvedValue('https://s3.example.com/presigned');
      const docRecord = {
        id: MOCK_DOC_ID,
        filePath: 'equipment/report.pdf',
        originalFileName: 'report.pdf',
        mimeType: 'application/pdf',
        fileHash: null,
      };
      mockDocumentService.findByIdAnyStatus.mockResolvedValue(docRecord);

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.download(MOCK_DOC_ID, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ presignedUrl: 'https://s3.example.com/presigned' })
      );
    });
  });

  // ─── verify ───────────────────────────────────────────────────────────────

  describe('verify()', () => {
    it('verifyIntegrity를 호출하고 결과를 반환한다', async () => {
      const integrityResult = { valid: true, expectedHash: 'abc', actualHash: 'abc' };
      mockDocumentService.verifyIntegrity.mockResolvedValue(integrityResult);

      const result = await controller.verify(MOCK_DOC_ID);

      expect(mockDocumentService.verifyIntegrity).toHaveBeenCalledWith(MOCK_DOC_ID);
      expect(result.valid).toBe(true);
    });
  });

  // ─── deleteDocument ───────────────────────────────────────────────────────

  describe('deleteDocument()', () => {
    it('deleteDocument를 호출하고 성공 메시지를 반환한다', async () => {
      mockDocumentService.deleteDocument.mockResolvedValue(undefined);

      const result = await controller.deleteDocument(MOCK_DOC_ID);

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(MOCK_DOC_ID);
      expect(result.message).toContain('삭제');
    });
  });

  // ─── createRevision ───────────────────────────────────────────────────────

  describe('createRevision()', () => {
    it('파일이 없으면 BadRequestException을 던진다', async () => {
      const req = makeReq();

      await expect(
        controller.createRevision(MOCK_DOC_ID, undefined as unknown as MulterFile, req)
      ).rejects.toThrow(BadRequestException);
    });

    it('파일이 있으면 createRevision을 호출하고 결과를 반환한다', async () => {
      const file = makeMockFile();
      const req = makeReq();
      const revision = { id: 'doc-uuid-2', revisionNumber: 2 };
      mockDocumentService.createRevision.mockResolvedValue(revision);

      const result = await controller.createRevision(MOCK_DOC_ID, file, req);

      expect(mockDocumentService.createRevision).toHaveBeenCalledWith(
        MOCK_DOC_ID,
        file,
        MOCK_USER_ID
      );
      expect(result.id).toBe('doc-uuid-2');
    });
  });

  // ─── getRevisionHistory ────────────────────────────────────────────────────

  describe('getRevisionHistory()', () => {
    it('getRevisionHistory를 호출하고 목록을 반환한다', async () => {
      mockDocumentService.getRevisionHistory.mockResolvedValue([]);

      const result = await controller.getRevisionHistory(MOCK_DOC_ID);

      expect(mockDocumentService.getRevisionHistory).toHaveBeenCalledWith(MOCK_DOC_ID);
      expect(result).toEqual([]);
    });
  });
});
