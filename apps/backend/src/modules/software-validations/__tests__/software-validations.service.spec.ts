import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SoftwareValidationsService } from '../software-validations.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  createMockCacheService,
  createMockEventEmitter,
} from '../../../common/testing/mock-providers';
import { ValidationStatusValues } from '@equipment-management/schemas';

const MOCK_VALIDATION = {
  id: 'val-uuid-1',
  testSoftwareId: 'sw-uuid-1',
  validationType: 'vendor',
  status: ValidationStatusValues.DRAFT,
  softwareVersion: '1.0.0',
  testDate: null,
  infoDate: null,
  softwareAuthor: null,
  vendorName: null,
  vendorSummary: null,
  receivedBy: null,
  receivedDate: null,
  attachmentNote: null,
  referenceDocuments: null,
  operatingUnitDescription: null,
  softwareComponents: null,
  hardwareComponents: null,
  acquisitionFunctions: null,
  processingFunctions: null,
  controlFunctions: null,
  performedBy: null,
  submittedAt: null,
  submittedBy: null,
  technicalApproverId: null,
  technicalApprovedAt: null,
  qualityApproverId: null,
  qualityApprovedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  createdBy: 'user-uuid-1',
  version: 1,
  casVersion: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('SoftwareValidationsService', () => {
  let service: SoftwareValidationsService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };

  const createSelectChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const methods = ['select', 'from', 'where', 'limit', 'orderBy', 'offset', 'inArray'];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    // then 프로퍼티만으로 async 해결 — limit/orderBy.mockResolvedValue는
    // 중간 체인 메서드를 Promise로 바꿔서 이후 체이닝을 파괴하므로 사용하지 않는다
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
      resolve(Array.isArray(value) ? value : [value]);
    return chain;
  };

  const mockUpdateChain = (returnValue: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    ['update', 'set', 'where', 'returning'].forEach(
      (m) => (chain[m] = jest.fn().mockReturnValue(chain))
    );
    chain.returning.mockResolvedValue(Array.isArray(returnValue) ? returnValue : [returnValue]);
    return chain;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockEventEmitter = createMockEventEmitter();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    mockDb = {
      select: jest.fn().mockReturnValue(createSelectChain([MOCK_VALIDATION])),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_VALIDATION]),
        }),
      }),
      update: jest.fn().mockReturnValue(mockUpdateChain(MOCK_VALIDATION)),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftwareValidationsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<SoftwareValidationsService>(SoftwareValidationsService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('draft 상태로 유효성 확인을 생성하고 캐시를 무효화한다', async () => {
      // testSoftware 존재 확인 → sw 있음
      mockDb.select.mockReturnValueOnce(createSelectChain([{ id: 'sw-uuid-1' }]));

      const result = await service.create(
        'sw-uuid-1',
        { validationType: 'vendor' } as never,
        'user-uuid-1'
      );

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
      expect(result.status).toBe(ValidationStatusValues.DRAFT);
    });

    it('testSoftware가 없으면 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      await expect(
        service.create('non-existent', { validationType: 'vendor' } as never, 'user-uuid-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne()', () => {
    it('유효성 확인이 있으면 반환한다', async () => {
      const result = await service.findOne('val-uuid-1');
      expect(result.id).toBe('val-uuid-1');
    });

    it('없으면 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('draft 상태에서 수정 성공한다', async () => {
      await service.update('val-uuid-1', { version: 1, softwareVersion: '2.0.0' } as never);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('draft가 아닌 상태에서 BadRequestException을 던진다', async () => {
      const submittedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED };
      mockDb.select.mockReturnValueOnce(createSelectChain([submittedValidation]));

      await expect(service.update('val-uuid-1', { version: 1 } as never)).rejects.toThrow(
        BadRequestException
      );
    });

    it('버전 불일치 시 ConflictException을 던진다', async () => {
      // update()는 findOne을 먼저 호출하므로 select mock 순서가 중요
      // 1) findOne용 select (DRAFT 상태)
      mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_VALIDATION]));
      // 2) updateWithVersion: UPDATE → 0 rows (CAS miss)
      mockDb.update.mockReturnValueOnce(mockUpdateChain([]));
      // 3) updateWithVersion 내부 existence check → version=2 (클라이언트가 version=1 전송)
      mockDb.select.mockReturnValueOnce(createSelectChain([{ id: 'val-uuid-1', version: 2 }]));

      await expect(
        service.update('val-uuid-1', { version: 1, softwareVersion: '2.0.0' } as never)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submit()', () => {
    it('draft → submitted 상태 전이 및 이벤트 emit', async () => {
      const updated = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));

      await service.submit('val-uuid-1', 1, 'user-uuid-1');

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        expect.stringContaining('submitted'),
        expect.any(Object)
      );
    });

    it('draft가 아닌 상태에서 BadRequestException을 던진다', async () => {
      const submittedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED };
      mockDb.select.mockReturnValueOnce(createSelectChain([submittedValidation]));

      await expect(service.submit('val-uuid-1', 1, 'user-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('approve()', () => {
    it('submitted → approved 상태 전이 및 이벤트 emit', async () => {
      const submittedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED };
      mockDb.select.mockReturnValueOnce(createSelectChain([submittedValidation]));
      const updated = { ...submittedValidation, status: ValidationStatusValues.APPROVED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));
      mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

      await service.approve('val-uuid-1', 1, 'approver-uuid-1');

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        expect.stringContaining('approved'),
        expect.any(Object)
      );
    });

    it('submitted가 아닌 상태에서 BadRequestException을 던진다', async () => {
      await expect(service.approve('val-uuid-1', 1, 'approver-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('qualityApprove()', () => {
    it('approved → quality_approved 상태 전이 및 이벤트 emit', async () => {
      const approvedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.APPROVED };
      mockDb.select.mockReturnValueOnce(createSelectChain([approvedValidation]));
      const updated = { ...approvedValidation, status: ValidationStatusValues.QUALITY_APPROVED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));
      mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

      await service.qualityApprove('val-uuid-1', 1, 'qa-uuid-1');

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        expect.stringContaining('quality'),
        expect.any(Object)
      );
    });

    it('approved가 아닌 상태에서 BadRequestException을 던진다', async () => {
      await expect(service.qualityApprove('val-uuid-1', 1, 'qa-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reject()', () => {
    it('submitted → rejected 상태 전이 및 이벤트 emit', async () => {
      const submittedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.SUBMITTED };
      mockDb.select.mockReturnValueOnce(createSelectChain([submittedValidation]));
      const updated = { ...submittedValidation, status: ValidationStatusValues.REJECTED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));
      mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

      await service.reject('val-uuid-1', 1, 'reviewer-uuid-1', '미달');

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        expect.stringContaining('rejected'),
        expect.any(Object)
      );
    });

    it('approved → rejected 상태 전이', async () => {
      const approvedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.APPROVED };
      mockDb.select.mockReturnValueOnce(createSelectChain([approvedValidation]));
      const updated = { ...approvedValidation, status: ValidationStatusValues.REJECTED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));
      mockDb.select.mockReturnValueOnce(createSelectChain([{ name: '소프트웨어 A' }]));

      await service.reject('val-uuid-1', 1, 'reviewer-uuid-1', '기준 미달');

      expect(mockEventEmitter.emitAsync).toHaveBeenCalled();
    });

    it('draft/quality_approved 상태에서 BadRequestException을 던진다', async () => {
      await expect(service.reject('val-uuid-1', 1, 'reviewer-uuid-1', '이유')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('revise()', () => {
    it('rejected → draft 상태 전이', async () => {
      const rejectedValidation = { ...MOCK_VALIDATION, status: ValidationStatusValues.REJECTED };
      mockDb.select.mockReturnValueOnce(createSelectChain([rejectedValidation]));
      const updated = { ...rejectedValidation, status: ValidationStatusValues.DRAFT };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));

      const result = await service.revise('val-uuid-1', 1);
      expect(result).toBeDefined();
    });

    it('rejected가 아닌 상태에서 BadRequestException을 던진다', async () => {
      await expect(service.revise('val-uuid-1', 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findPending()', () => {
    it('submitted/approved 상태의 유효성 확인 목록을 반환한다', async () => {
      const result = await service.findPending({} as never);
      expect(Array.isArray(result)).toBe(true);
    });

    it('사이트 필터 적용 시 scoped SW가 없으면 빈 배열을 반환한다', async () => {
      // resolveScopedSoftwareIds → SELECT on testSoftware → empty
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      const result = await service.findPending({ site: 'suwon' } as never);
      expect(result).toEqual([]);
    });
  });
});
