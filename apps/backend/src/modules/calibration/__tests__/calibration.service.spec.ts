import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { CalibrationService } from '../calibration.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import {
  createMockCacheService,
  createMockEventEmitter,
  createMockCacheInvalidationHelper,
} from '../../../common/testing/mock-providers';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { I18nService } from '../../../common/i18n/i18n.service';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';

/** Drizzle select 체인 mock 빌더 */
const createSelectChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'returning',
    'update',
    'set',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.limit.mockResolvedValue(finalValue);
  chain.returning.mockResolvedValue(finalValue);
  chain.orderBy.mockResolvedValue(finalValue);
  // chain 자체를 thenable로 만들어 where/offset이 마지막인 경우 처리
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

const MOCK_CALIBRATION_ROW = {
  id: 'cal-uuid-1',
  equipmentId: 'eq-uuid-1',
  technicianId: 'user-uuid-1',
  calibrationDate: new Date('2024-01-01'),
  nextCalibrationDate: new Date('2025-01-01'),
  status: 'completed',
  approvalStatus: 'pending_approval',
  agencyName: '한국교정',
  certificateNumber: 'CERT-001',
  notes: null,
  registeredBy: 'user-uuid-1',
  approvedBy: null,
  approverComment: null,
  version: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

const MOCK_DOCUMENT_ROW = {
  id: 'doc-uuid-1',
  calibrationId: 'cal-uuid-1',
  documentType: DocumentTypeValues.CALIBRATION_CERTIFICATE,
  fileName: 'cert.pdf',
  originalFileName: 'certificate.pdf',
  filePath: 'calibration/pending/cert.pdf',
  fileSize: 102400,
  mimeType: 'application/pdf',
  fileHash: 'abc123',
  uploadedBy: 'user-uuid-1',
  isLatest: true,
  parentDocumentId: null,
  revisionNumber: 1,
  description: null,
  equipmentId: null,
  requestId: null,
  softwareValidationId: null,
  intermediateInspectionId: null,
  selfInspectionId: null,
  nonConformanceId: null,
  status: 'active',
  retentionPeriod: null,
  retentionExpiresAt: null,
  uploadedAt: new Date('2024-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const MOCK_FILE: Express.Multer.File = {
  fieldname: 'files',
  originalname: 'certificate.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: Buffer.from('fake-pdf'),
  size: 102400,
  stream: null as never,
  destination: '',
  filename: '',
  path: '',
};

describe('CalibrationService', () => {
  let service: CalibrationService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockFileUploadService: { saveFiles: jest.Mock; deleteFile: jest.Mock };
  let mockDb: { select: jest.Mock; insert: jest.Mock; update: jest.Mock; transaction: jest.Mock };
  let chain: ReturnType<typeof createSelectChain>;

  beforeEach(async () => {
    chain = createSelectChain([{ calibration: MOCK_CALIBRATION_ROW, certDocPath: null }]);
    mockCacheService = createMockCacheService();
    mockEventEmitter = createMockEventEmitter();
    mockFileUploadService = {
      saveFiles: jest.fn().mockResolvedValue([
        {
          uuid: 'doc-uuid-1',
          fileName: 'cert.pdf',
          originalFileName: 'certificate.pdf',
          filePath: 'calibration/pending/cert.pdf',
          fileSize: 102400,
          mimeType: 'application/pdf',
          fileHash: 'abc123',
        },
      ]),
      deleteFile: jest.fn().mockResolvedValue(undefined),
    };

    // getOrSet은 factory 즉시 실행 (캐시 미스 시뮬레이션)
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      transaction: jest.fn().mockImplementation((cb: (tx: typeof mockDb) => unknown) => cb(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalibrationService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: CacheInvalidationHelper, useValue: createMockCacheInvalidationHelper() },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: I18nService, useValue: { t: jest.fn().mockReturnValue('') } },
        { provide: FileUploadService, useValue: mockFileUploadService },
      ],
    }).compile();

    service = module.get<CalibrationService>(CalibrationService);
  });

  describe('findOne()', () => {
    it('캐시 서비스를 통해 교정 레코드를 조회한다', async () => {
      await service.findOne('cal-uuid-1');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('cal-uuid-1'),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('존재하지 않는 ID에서 NotFoundException을 던진다', async () => {
      chain.limit.mockResolvedValueOnce([]);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createWithDocuments()', () => {
    const BASE_DTO = {
      equipmentId: 'eq-uuid-1',
      calibrationManagerId: 'user-uuid-1',
      calibrationDate: new Date('2024-01-01'),
      nextCalibrationDate: new Date('2025-01-01'),
      calibrationAgency: '한국교정',
      certificateNumber: 'CERT-001',
    } as never;

    it('새 교정 기록을 등록하고 pending_approval 상태로 반환한다', async () => {
      const insertedRow = { ...MOCK_CALIBRATION_ROW, approvalStatus: 'pending_approval' };
      // equipment 조회 (limit)
      chain.limit.mockResolvedValueOnce([
        {
          calibrationCycle: 12,
          name: '오실로스코프',
          managementNumber: 'SUW-E0001',
          teamId: 'team-1',
          site: 'suwon',
        },
      ]);
      // calibrations insert
      chain.returning.mockResolvedValueOnce([insertedRow]);
      // documents insert
      chain.returning.mockResolvedValueOnce([MOCK_DOCUMENT_ROW]);

      const result = await service.createWithDocuments(
        BASE_DTO,
        [MOCK_FILE],
        [DocumentTypeValues.CALIBRATION_CERTIFICATE as never],
        [undefined],
        'user-uuid-1'
      );

      expect(result.calibration.approvalStatus).toBe('pending_approval');
      expect(result.documents).toHaveLength(1);
    });

    it('교정 등록 후 캐시를 무효화한다', async () => {
      chain.limit.mockResolvedValueOnce([
        {
          calibrationCycle: 12,
          name: '오실로스코프',
          managementNumber: 'SUW-E0001',
          teamId: 'team-1',
          site: 'suwon',
        },
      ]);
      chain.returning.mockResolvedValueOnce([MOCK_CALIBRATION_ROW]);
      chain.returning.mockResolvedValueOnce([MOCK_DOCUMENT_ROW]);

      await service.createWithDocuments(
        BASE_DTO,
        [MOCK_FILE],
        [DocumentTypeValues.CALIBRATION_CERTIFICATE as never],
        [undefined],
        'user-uuid-1'
      );

      expect(mockCacheService.deleteByPrefix).toHaveBeenCalledWith(
        expect.stringContaining('calibration:list:')
      );
    });

    it('DB 트랜잭션 실패 시 업로드된 파일을 삭제한다', async () => {
      chain.limit.mockResolvedValueOnce([
        {
          calibrationCycle: 12,
          name: '오실로스코프',
          managementNumber: 'SUW-E0001',
          teamId: 'team-1',
          site: 'suwon',
        },
      ]);
      mockDb.transaction.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createWithDocuments(
          BASE_DTO,
          [MOCK_FILE],
          [DocumentTypeValues.CALIBRATION_CERTIFICATE as never],
          [undefined],
          'user-uuid-1'
        )
      ).rejects.toThrow('DB error');

      expect(mockFileUploadService.deleteFile).toHaveBeenCalledWith('calibration/pending/cert.pdf');
    });
  });

  describe('approveCalibration()', () => {
    it('pending_approval이 아닌 교정 승인 시 BadRequestException을 던진다', async () => {
      // findOne이 이미 승인된 교정 반환
      const alreadyApproved = { ...MOCK_CALIBRATION_ROW, approvalStatus: 'approved' };
      chain.limit.mockResolvedValueOnce([{ calibration: alreadyApproved, certDocPath: null }]);

      await expect(
        service.approveCalibration('cal-uuid-1', {
          approverId: 'approver-1',
          version: 1,
        } as never)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll()', () => {
    it('기본 쿼리로 교정 목록과 메타데이터를 반환한다', async () => {
      // count 쿼리: where → [{count: 1}]
      chain.where.mockResolvedValueOnce([{ count: 1 }]);
      // data 쿼리: orderBy → chain → limit → chain → offset → [row]
      chain.orderBy.mockReturnValueOnce(chain);
      chain.limit.mockReturnValueOnce(chain);
      chain.offset.mockResolvedValueOnce([
        {
          calibration: MOCK_CALIBRATION_ROW,
          equipmentName: '오실로스코프',
          managementNumber: 'SUW-E0001',
          teamId: 'team-1',
          teamName: 'FCC EMC/RF',
        },
      ]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.currentPage).toBe(1);
    });
  });
});
