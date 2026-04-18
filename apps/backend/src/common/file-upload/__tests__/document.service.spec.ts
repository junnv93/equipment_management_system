import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentService } from '../document.service';
import type { DocumentRecord } from '@equipment-management/db/schema/documents';

describe('DocumentService', () => {
  const chainMethods = [
    'select',
    'from',
    'where',
    'limit',
    'offset',
    'orderBy',
    'insert',
    'update',
    'values',
    'set',
    'returning',
    'leftJoin',
    'innerJoin',
    'delete',
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chain: Record<string, jest.Mock>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockFileUploadService: any;
  let service: DocumentService;

  const makeDoc = (overrides: Partial<DocumentRecord> = {}): DocumentRecord =>
    ({
      id: 'doc-1',
      equipmentId: null,
      calibrationId: null,
      requestId: null,
      softwareValidationId: null,
      intermediateInspectionId: null,
      selfInspectionId: null,
      nonConformanceId: null,
      documentType: 'equipment_photo',
      status: 'active',
      fileName: 'photo.jpg',
      originalFileName: 'photo.jpg',
      filePath: 'equipment_photos/photo.jpg',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      fileHash: 'abc123',
      revisionNumber: 1,
      parentDocumentId: null,
      isLatest: true,
      description: null,
      uploadedBy: null,
      uploadedAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    }) as unknown as DocumentRecord;

  const mockMulterFile = {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 1024,
  };

  beforeEach(() => {
    chain = {} as Record<string, jest.Mock>;
    for (const m of chainMethods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
      resolve([])
    );

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      delete: jest.fn().mockReturnValue(chain),
      transaction: jest.fn(),
      query: {
        documents: { findFirst: jest.fn() },
        softwareValidations: { findFirst: jest.fn() },
      },
    };

    mockFileUploadService = {
      saveFile: jest.fn().mockResolvedValue({
        fileName: 'photo.jpg',
        originalFileName: 'photo.jpg',
        filePath: 'equipment_photos/photo.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        fileHash: 'abc123',
      }),
      readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    // NestJS DI 없이 직접 생성 — 이 서비스의 의존성은 2개뿐 (mockDb, fileUploadService)
    service = new DocumentService(mockDb, mockFileUploadService);
  });

  // ============================================================================
  // findByNonConformanceId
  // ============================================================================

  describe('findByNonConformanceId', () => {
    it('NC ID로 활성 문서 목록을 반환한다', async () => {
      const docs = [
        makeDoc({ id: 'doc-1', nonConformanceId: 'nc-1' }),
        makeDoc({ id: 'doc-2', nonConformanceId: 'nc-1' }),
      ];
      (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
        resolve(docs)
      );

      const result = await service.findByNonConformanceId('nc-1');

      expect(mockDb.select).toHaveBeenCalled();
      expect(chain.where).toHaveBeenCalled();
      expect(chain.orderBy).toHaveBeenCalled();
      expect(result).toEqual(docs);
    });

    it('결과가 없으면 빈 배열을 반환한다', async () => {
      (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
        resolve([])
      );

      const result = await service.findByNonConformanceId('nc-not-exist');

      expect(result).toEqual([]);
    });

    it('type 파라미터가 있으면 where 조건에 포함된다', async () => {
      const docs = [
        makeDoc({ id: 'doc-1', nonConformanceId: 'nc-1', documentType: 'equipment_photo' }),
      ];
      (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
        resolve(docs)
      );

      const result = await service.findByNonConformanceId('nc-1', 'equipment_photo');

      expect(chain.where).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // createRevision
  // ============================================================================

  describe('createRevision', () => {
    it('부모 문서가 없으면 NotFoundException을 던진다', async () => {
      mockDb.query.documents.findFirst.mockResolvedValue(undefined);

      await expect(
        service.createRevision('nonexistent-id', mockMulterFile as never)
      ).rejects.toThrow(NotFoundException);
    });

    it('개정판 생성 시 트랜잭션을 사용한다', async () => {
      const parentDoc = makeDoc({ id: 'parent-1', nonConformanceId: 'nc-1', revisionNumber: 1 });
      mockDb.query.documents.findFirst.mockResolvedValue(parentDoc);

      const revDoc = makeDoc({
        id: 'rev-1',
        parentDocumentId: 'parent-1',
        revisionNumber: 2,
        nonConformanceId: 'nc-1',
      });

      mockDb.transaction.mockImplementation(
        async (fn: (tx: Record<string, jest.Mock>) => Promise<DocumentRecord>) => {
          const txChain: Record<string, jest.Mock> = {};
          for (const m of chainMethods) {
            txChain[m] = jest.fn().mockReturnValue(txChain);
          }
          (txChain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
            resolve([revDoc])
          );
          const tx = {
            update: jest.fn().mockReturnValue(txChain),
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([revDoc]),
              }),
            }),
          };
          return fn(tx as never);
        }
      );

      const result = await service.createRevision('parent-1', mockMulterFile as never, 'user-1');

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result).toEqual(revDoc);
    });

    it('nonConformanceId FK가 부모에서 개정판으로 승계된다', async () => {
      const parentDoc = makeDoc({ id: 'parent-nc', nonConformanceId: 'nc-99', revisionNumber: 1 });
      mockDb.query.documents.findFirst.mockResolvedValue(parentDoc);

      const revDoc = makeDoc({
        id: 'rev-nc',
        nonConformanceId: 'nc-99',
        revisionNumber: 2,
        parentDocumentId: 'parent-nc',
      });

      let capturedValues: Record<string, unknown> | null = null;
      mockDb.transaction.mockImplementation(
        async (fn: (tx: Record<string, jest.Mock>) => Promise<DocumentRecord>) => {
          const txChain: Record<string, jest.Mock> = {};
          for (const m of chainMethods) {
            txChain[m] = jest.fn().mockReturnValue(txChain);
          }
          const tx = {
            update: jest.fn().mockReturnValue(txChain),
            insert: jest.fn().mockReturnValue({
              values: jest.fn().mockImplementation((vals: Record<string, unknown>) => {
                capturedValues = vals;
                return { returning: jest.fn().mockResolvedValue([revDoc]) };
              }),
            }),
          };
          return fn(tx as never);
        }
      );

      await service.createRevision('parent-nc', mockMulterFile as never, 'user-1');

      expect(capturedValues).not.toBeNull();
      expect(capturedValues!['nonConformanceId']).toBe('nc-99');
    });
  });

  // ============================================================================
  // createDocument — owner FK 검증
  // ============================================================================

  describe('createDocument', () => {
    it('소유자 FK 없이 생성하면 BadRequestException을 던진다', async () => {
      await expect(
        service.createDocument(mockMulterFile as never, {
          documentType: 'equipment_photo',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('nonConformanceId가 있으면 정상 생성된다', async () => {
      const doc = makeDoc({ id: 'doc-nc', nonConformanceId: 'nc-1' });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([doc]),
        }),
      });

      const result = await service.createDocument(mockMulterFile as never, {
        documentType: 'equipment_photo',
        nonConformanceId: 'nc-1',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(doc);
    });

    it('softwareValidationId 없이 validation draft 검증은 건너뛴다', async () => {
      const doc = makeDoc({ id: 'doc-eq', equipmentId: 'eq-1' });
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([doc]),
        }),
      });

      const result = await service.createDocument(mockMulterFile as never, {
        documentType: 'equipment_photo',
        equipmentId: 'eq-1',
      });

      // softwareValidation 조회가 호출되지 않아야 함
      expect(mockDb.query.softwareValidations.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual(doc);
    });
  });
});
