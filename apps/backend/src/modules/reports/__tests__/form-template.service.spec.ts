import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { FormTemplateService } from '../form-template.service';
import { STORAGE_PROVIDER } from '../../../common/storage/storage.interface';
import { CACHE_SERVICE } from '../../../common/cache/cache.interface';
import { IdentifierService } from '../../../common/identifiers/identifier.service';
import { createMockIdentifierService } from '../../../common/testing/mock-providers';
import { ErrorCode } from '@equipment-management/schemas';

const MOCK_UUID = '00000000-0000-4000-8000-000000000001';

// ZIP 시그니처 + MIN_VALID_FILE_SIZE(4096) 이상의 유효 파일 버퍼
function makeValidOfficeBuffer(): Buffer {
  const buf = Buffer.alloc(5000, 0x20);
  buf[0] = 0x50; // P
  buf[1] = 0x4b; // K
  buf[2] = 0x03;
  buf[3] = 0x04;
  return buf;
}

type FormTemplateRowStub = {
  id: string;
  formName: string;
  formNumber: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  isCurrent: boolean;
  uploadedBy: string | null;
  uploadedAt: Date;
  supersededAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

function makeMockFormTemplateRow(overrides: Record<string, unknown> = {}): FormTemplateRowStub {
  return {
    id: 'template-id-1',
    formName: '시험설비 관리대장',
    formNumber: 'UL-QP-18-01',
    storageKey: `form-templates/UL-QP-18-01/${MOCK_UUID}.docx`,
    originalFilename: 'template.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 5000,
    isCurrent: true,
    uploadedBy: 'user-1' as string | null,
    uploadedAt: new Date('2026-01-01'),
    supersededAt: null as Date | null,
    archivedAt: null as Date | null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const createQueryChain = (resolveValue: unknown = []): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'from',
    'where',
    'set',
    'values',
    'returning',
    'orderBy',
    'limit',
    'and',
    'eq',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.then = jest
    .fn()
    .mockImplementation((resolve: (v: unknown) => unknown) =>
      Promise.resolve(resolveValue).then(resolve)
    );
  return chain;
};

describe('FormTemplateService', () => {
  let service: FormTemplateService;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };
  let mockStorage: Record<string, jest.Mock>;
  let mockCache: Record<string, jest.Mock>;
  let mockIdentifiers: Record<string, jest.Mock>;

  const validInput = {
    formName: '시험설비 관리대장',
    formNumber: 'UL-QP-18-99',
    file: makeValidOfficeBuffer(),
    filename: 'template.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    userId: 'user-1',
    changeSummary: '최초 등록',
  };

  beforeEach(async () => {
    mockStorage = {
      ensureContainer: jest.fn().mockResolvedValue(undefined),
      upload: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue(makeValidOfficeBuffer()),
      delete: jest.fn().mockResolvedValue(undefined),
      supportsPresignedUrl: jest.fn().mockReturnValue(false),
    };

    mockCache = {
      getOrSet: jest.fn().mockImplementation((_key: unknown, factory: () => unknown) => factory()),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockIdentifiers = createMockIdentifierService();

    const existingRow = makeMockFormTemplateRow();

    // 기본: select → 현행 row 반환 (findCurrentByName 등)
    mockDb = {
      select: jest.fn().mockReturnValue(createQueryChain([existingRow])),
      insert: jest.fn().mockReturnValue(createQueryChain([existingRow])),
      update: jest.fn().mockReturnValue(createQueryChain([existingRow])),
      transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => {
        const tx = {
          select: jest.fn().mockReturnValue(createQueryChain([])),
          insert: jest.fn().mockReturnValue(createQueryChain([existingRow])),
          update: jest.fn().mockReturnValue(createQueryChain([existingRow])),
        };
        return cb(tx);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormTemplateService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: STORAGE_PROVIDER, useValue: mockStorage },
        { provide: CACHE_SERVICE, useValue: mockCache },
        { provide: IdentifierService, useValue: mockIdentifiers },
      ],
    }).compile();

    service = module.get<FormTemplateService>(FormTemplateService);
  });

  // ── findCurrentByName ─────────────────────────────────────────────────────

  describe('findCurrentByName', () => {
    it('현행 row 존재 → 반환', async () => {
      const result = await service.findCurrentByName('시험설비 관리대장');
      expect(result).not.toBeNull();
      expect(result?.formName).toBe('시험설비 관리대장');
    });

    it('없음 → null 반환', async () => {
      mockDb.select.mockReturnValueOnce(createQueryChain([]));
      const result = await service.findCurrentByName('없는양식');
      expect(result).toBeNull();
    });
  });

  // ── getCurrentByName ──────────────────────────────────────────────────────

  describe('getCurrentByName', () => {
    it('없음 → FormTemplateNotFound 던짐', async () => {
      mockDb.select.mockReturnValueOnce(createQueryChain([]));
      await expect(service.getCurrentByName('없는양식')).rejects.toMatchObject({
        response: { code: ErrorCode.FormTemplateNotFound },
      });
    });
  });

  // ── createFormTemplateVersion ─────────────────────────────────────────────

  describe('createFormTemplateVersion', () => {
    it('FORM_CATALOG 미존재 formName → InvalidFormName', async () => {
      await expect(
        service.createFormTemplateVersion({ ...validInput, formName: '존재하지않는양식' })
      ).rejects.toMatchObject({
        response: { code: ErrorCode.InvalidFormName },
      });
    });

    it('중복 formNumber → FormNumberAlreadyExists(ConflictException)', async () => {
      // findByFormNumber가 기존 row 반환
      mockDb.select.mockReturnValueOnce(createQueryChain([makeMockFormTemplateRow()]));
      await expect(service.createFormTemplateVersion(validInput)).rejects.toBeInstanceOf(
        ConflictException
      );
    });

    it('파일 크기 < 4096 → InvalidFormat(BadRequestException)', async () => {
      const smallBuf = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // ZIP sig but too small
      mockDb.select.mockReturnValueOnce(createQueryChain([])); // findByFormNumber → null
      await expect(
        service.createFormTemplateVersion({ ...validInput, file: smallBuf })
      ).rejects.toMatchObject({
        response: { code: ErrorCode.InvalidFormat },
      });
    });

    it('Office MIME + ZIP sig 누락 → InvalidFormat', async () => {
      const noSigBuf = Buffer.alloc(5000, 0x41); // 'A' * 5000, no ZIP sig
      mockDb.select.mockReturnValueOnce(createQueryChain([])); // findByFormNumber → null
      await expect(
        service.createFormTemplateVersion({ ...validInput, file: noSigBuf })
      ).rejects.toMatchObject({
        response: { code: ErrorCode.InvalidFormat },
      });
    });

    it('정상 흐름 → IdentifierService.generateAttachmentId 경유 storageKey 생성', async () => {
      // findByFormNumber → null (중복 없음)
      mockDb.select.mockReturnValueOnce(createQueryChain([]));

      await service.createFormTemplateVersion(validInput);

      expect(mockIdentifiers.generateAttachmentId).toHaveBeenCalledTimes(1);
      expect(mockStorage.upload).toHaveBeenCalledTimes(1);
      const [calledKey] = mockStorage.upload.mock.calls[0] as [string, ...unknown[]];
      expect(calledKey).toContain(MOCK_UUID);
    });

    it('DB 트랜잭션 실패 → safeDeleteStorage 호출(방금 업로드 파일 정리)', async () => {
      // findByFormNumber → null
      mockDb.select.mockReturnValueOnce(createQueryChain([]));
      // transaction이 에러 던짐
      mockDb.transaction.mockRejectedValueOnce(new Error('DB 커넥션 끊김'));

      await expect(service.createFormTemplateVersion(validInput)).rejects.toThrow('DB 커넥션 끊김');
      // storage.upload 후 실패했으므로 delete 호출됨
      expect(mockStorage.delete).toHaveBeenCalledTimes(1);
    });
  });

  // ── replaceCurrentFile ────────────────────────────────────────────────────

  describe('replaceCurrentFile', () => {
    const replaceInput = {
      formName: '시험설비 관리대장',
      file: makeValidOfficeBuffer(),
      filename: 'new-template.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      userId: 'user-1',
    };

    it('현행 row 없음 → FormTemplateNotFound', async () => {
      mockDb.select.mockReturnValueOnce(createQueryChain([])); // findCurrentByName → null
      await expect(service.replaceCurrentFile(replaceInput)).rejects.toMatchObject({
        response: { code: ErrorCode.FormTemplateNotFound },
      });
    });

    it('DB UPDATE 실패 → 방금 업로드 파일만 정리(이전 파일 보존)', async () => {
      // getCurrentByName → 현행 row 반환
      mockDb.select.mockReturnValueOnce(createQueryChain([makeMockFormTemplateRow()]));
      mockDb.update.mockReturnValueOnce(createQueryChain(new Error('UPDATE 실패')));
      // update chain의 returning()이 throw하도록
      const failChain = createQueryChain([]);
      failChain.then = jest
        .fn()
        .mockImplementation((_res: unknown, rej: (e: Error) => unknown) =>
          Promise.reject(new Error('UPDATE 실패')).catch(rej)
        );
      mockDb.update.mockReturnValueOnce(failChain);

      await expect(service.replaceCurrentFile(replaceInput)).rejects.toThrow();
      expect(mockStorage.delete).toHaveBeenCalledTimes(1);
    });
  });

  // ── downloadBuffer / getTemplateBuffer ───────────────────────────────────

  describe('downloadBuffer', () => {
    it('cache hit → storage.download 미호출', async () => {
      const cachedBuf = Buffer.from('cached');
      mockCache.getOrSet.mockResolvedValueOnce(cachedBuf);

      const row = makeMockFormTemplateRow();
      const result = await service.downloadBuffer(row);

      expect(result).toBe(cachedBuf);
      expect(mockStorage.download).not.toHaveBeenCalled();
    });

    it('cache miss → storage.download 1회', async () => {
      // getOrSet이 factory 즉시 실행 (기본 동작)
      const row = makeMockFormTemplateRow();
      await service.downloadBuffer(row);

      expect(mockStorage.download).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTemplateBuffer', () => {
    it('FORM_CATALOG 미존재 키 → FormTemplateNotFound', async () => {
      await expect(service.getTemplateBuffer('UNKNOWN-KEY')).rejects.toMatchObject({
        response: { code: ErrorCode.FormTemplateNotFound },
      });
    });

    it('FORM_CATALOG 존재 키 + 현행 row 없음 → FormTemplateNotFound', async () => {
      mockDb.select.mockReturnValueOnce(createQueryChain([]));
      await expect(service.getTemplateBuffer('UL-QP-18-01')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  // ── assertValidFileContent ────────────────────────────────────────────────

  describe('assertValidFileContent (간접 검증)', () => {
    it('DOC legacy MIME + 크기 충분 → ZIP sig 검증 없이 통과', async () => {
      const legacyBuf = Buffer.alloc(5000, 0x42); // 'B' * 5000, OLE compound
      legacyBuf[0] = 0xd0;
      legacyBuf[1] = 0xcf;
      legacyBuf[2] = 0x11;
      legacyBuf[3] = 0xe0;
      mockDb.select.mockReturnValueOnce(createQueryChain([])); // findByFormNumber → null
      await expect(
        service.createFormTemplateVersion({
          ...validInput,
          mimeType: 'application/msword',
          filename: 'legacy.doc',
          file: legacyBuf,
        })
      ).resolves.toBeDefined();
    });
  });
});
