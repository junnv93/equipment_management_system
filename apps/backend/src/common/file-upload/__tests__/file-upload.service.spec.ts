import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { createHash } from 'crypto';
import { FileUploadService } from '../file-upload.service';
import { STORAGE_PROVIDER } from '../../storage/storage.interface';
import { IdentifierService } from '../../identifiers/identifier.service';
import { createMockIdentifierService } from '../../testing/mock-providers';
import { ErrorCode } from '@equipment-management/schemas';
import type { MulterFile } from '../../../types/common.types';

const MOCK_UUID = '00000000-0000-4000-8000-000000000001';

function makeFile(overrides: Partial<MulterFile> = {}): MulterFile {
  const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
  return {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    ...overrides,
  } as MulterFile;
}

describe('FileUploadService', () => {
  let service: FileUploadService;
  let mockProvider: Record<string, jest.Mock>;
  let mockIdentifiers: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockProvider = {
      ensureContainer: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue(Buffer.from('content')),
      delete: jest.fn().mockResolvedValue(undefined),
      supportsPresignedUrl: jest.fn().mockReturnValue(false),
    };
    mockIdentifiers = createMockIdentifierService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileUploadService,
        { provide: STORAGE_PROVIDER, useValue: mockProvider },
        { provide: IdentifierService, useValue: mockIdentifiers },
      ],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    await service.onModuleInit();
  });

  // ── validateFile: 기본 정책 ─────────────────────────────────────────────────

  describe('validateFile — 기본 정책', () => {
    it('빈 buffer → FileEmpty', async () => {
      const file = makeFile({ buffer: Buffer.alloc(0), size: 0 });
      await expect(service.saveFile(file)).rejects.toMatchObject({
        response: { code: ErrorCode.FileEmpty },
      });
    });

    it('10MB 초과 → FileTooLarge', async () => {
      const oversized = Buffer.alloc(11 * 1024 * 1024);
      // magic bytes 통과를 위해 PDF 시그니처 추가
      oversized[0] = 0x25;
      oversized[1] = 0x50;
      oversized[2] = 0x44;
      oversized[3] = 0x46;
      const file = makeFile({ buffer: oversized, size: oversized.length });
      await expect(service.saveFile(file)).rejects.toMatchObject({
        response: { code: ErrorCode.FileTooLarge },
      });
    });

    it('allow-list 외 MIME → InvalidFileType', async () => {
      const file = makeFile({ mimetype: 'application/zip', originalname: 'test.zip' });
      await expect(service.saveFile(file)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.saveFile(file)).rejects.toMatchObject({
        response: { code: ErrorCode.InvalidFileType },
      });
    });
  });

  // ── validateMagicBytes: MIME 위장 공격 방지 ────────────────────────────────

  describe('validateMagicBytes — MIME 위장 공격 방지', () => {
    it('PDF MIME + PDF 시그니처 → 통과', async () => {
      const file = makeFile(); // 기본값: PDF mimetype + %PDF- buffer
      await expect(service.saveFile(file)).resolves.toBeDefined();
    });

    it('PDF MIME + JPEG payload → FileContentMismatch', async () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const file = makeFile({ buffer: jpegHeader, size: jpegHeader.length });
      await expect(service.saveFile(file)).rejects.toMatchObject({
        response: { code: ErrorCode.FileContentMismatch },
      });
    });

    it('PNG MIME + ZIP payload → FileContentMismatch', async () => {
      const zipHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const file = makeFile({
        mimetype: 'image/png',
        originalname: 'test.png',
        buffer: zipHeader,
        size: zipHeader.length,
      });
      await expect(service.saveFile(file)).rejects.toMatchObject({
        response: { code: ErrorCode.FileContentMismatch },
      });
    });

    it('DOCX MIME + plain text payload → FileContentMismatch', async () => {
      const plainText = Buffer.from('Hello World');
      const file = makeFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'test.docx',
        buffer: plainText,
        size: plainText.length,
      });
      await expect(service.saveFile(file)).rejects.toMatchObject({
        response: { code: ErrorCode.FileContentMismatch },
      });
    });

    it('CSV MIME → magic bytes 검증 skip (allow-list 통과)', async () => {
      const csvData = Buffer.from('name,value\nhello,world');
      const file = makeFile({
        mimetype: 'text/csv',
        originalname: 'data.csv',
        buffer: csvData,
        size: csvData.length,
      });
      await expect(service.saveFile(file)).resolves.toBeDefined();
    });
  });

  // ── saveFile: 정상 흐름 ─────────────────────────────────────────────────────

  describe('saveFile — 정상 흐름', () => {
    it('IdentifierService.generateAttachmentId 경유 → filePath에 UUID 포함', async () => {
      const file = makeFile();
      const result = await service.saveFile(file);

      expect(mockIdentifiers.generateAttachmentId).toHaveBeenCalledTimes(1);
      expect(result.filePath).toContain(MOCK_UUID);
    });

    it('SHA-256 fileHash가 실제 buffer 해시와 일치', async () => {
      const file = makeFile();
      const expectedHash = createHash('sha256').update(file.buffer).digest('hex');
      const result = await service.saveFile(file);

      expect(result.fileHash).toBe(expectedHash);
    });

    it('filePath 패턴: {subdirectory}/{uuid}.{ext}', async () => {
      const file = makeFile();
      const result = await service.saveFile(file, 'equipment');

      expect(result.filePath).toMatch(/^equipment\/[0-9a-f-]+\.pdf$/);
    });

    it('provider.upload 1회 호출', async () => {
      const file = makeFile();
      await service.saveFile(file);

      expect(mockProvider.upload).toHaveBeenCalledTimes(1);
    });

    it('sanitizeKey — path traversal 입력 제거 후 안전한 키 사용', async () => {
      const file = makeFile();
      await service.saveFile(file, '../etc/passwd');

      const [calledKey] = mockProvider.upload.mock.calls[0] as [string, ...unknown[]];
      expect(calledKey).not.toContain('..');
      expect(calledKey).toMatch(/^etc\/passwd\//);
    });

    it('sanitizeKey — 백슬래시 경로 입력 정규화', async () => {
      const file = makeFile();
      await service.saveFile(file, 'attachments\\sub');

      const [calledKey] = mockProvider.upload.mock.calls[0] as [string, ...unknown[]];
      expect(calledKey).toMatch(/^attachments\/sub\//);
    });
  });

  // ── saveFile: 에러 변환 ─────────────────────────────────────────────────────

  describe('saveFile — 에러 변환', () => {
    it('provider.upload 실패 → FileSaveFailed(InternalServerErrorException)', async () => {
      mockProvider.upload.mockRejectedValue(new Error('S3 timeout'));
      const file = makeFile();
      let caught: unknown;
      try {
        await service.saveFile(file);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect(caught).toMatchObject({ response: { code: ErrorCode.FileSaveFailed } });
    });

    it('BadRequestException은 그대로 전파 (에러 래핑 안 함)', async () => {
      const file = makeFile({ buffer: Buffer.alloc(0), size: 0 });

      await expect(service.saveFile(file)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
