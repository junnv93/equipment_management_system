import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IntermediateInspectionsService } from '../intermediate-inspections.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import { InspectionApprovalStatusValues } from '@equipment-management/schemas';

const MOCK_INSPECTION = {
  id: 'insp-uuid-1',
  calibrationId: 'cal-uuid-1',
  equipmentId: 'eq-uuid-1',
  inspectionDate: new Date('2024-06-01'),
  inspectorId: 'user-uuid-1',
  classification: null,
  inspectionCycle: null,
  calibrationValidityPeriod: null,
  overallResult: null,
  remarks: null,
  approvalStatus: InspectionApprovalStatusValues.DRAFT,
  submittedAt: null,
  submittedBy: null,
  reviewedAt: null,
  reviewedBy: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  rejectionReason: null,
  createdBy: 'user-uuid-1',
  version: 1,
  casVersion: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const _MOCK_INSPECTION_WITH_RELATIONS = {
  ...MOCK_INSPECTION,
  items: [],
  inspectionEquipment: [],
};

describe('IntermediateInspectionsService', () => {
  let service: IntermediateInspectionsService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    transaction: jest.Mock;
  };

  const createSelectChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const methods = ['select', 'from', 'where', 'limit', 'leftJoin', 'orderBy', 'offset'];
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
    chain.returning.mockResolvedValue([returnValue]);
    return chain;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    mockDb = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_INSPECTION]),
        }),
      }),
      update: jest.fn().mockReturnValue(mockUpdateChain(MOCK_INSPECTION)),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
    };

    // ⚠️ 의도적으로 mockDb.select에 선 적재(mockReturnValueOnce)를 하지 않는다.
    // 각 테스트는 자신이 필요한 select mock을 직접 설정해야 한다.
    // 선 적재하면 테스트 순서에 따라 "이전 mock이 잘못된 테스트 호출에서 소비"되는
    // 순서 의존성이 생겨 상태 전이 테스트가 오작동한다.

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntermediateInspectionsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<IntermediateInspectionsService>(IntermediateInspectionsService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('트랜잭션으로 점검 + 항목 + 장비를 삽입한다', async () => {
      // calibration check (select)
      mockDb.select.mockReturnValueOnce(
        createSelectChain([{ id: 'cal-uuid-1', equipmentId: 'eq-uuid-1' }])
      );
      mockDb.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_INSPECTION]),
          }),
        })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) }) // items
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) }); // equipment

      const result = await service.create(
        { calibrationId: 'cal-uuid-1', inspectionDate: '2024-06-01', items: [] } as never,
        'eq-uuid-1',
        'user-uuid-1'
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('insp-uuid-1');
    });

    it('교정이 없으면 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      await expect(
        service.create(
          { calibrationId: 'non-existent', inspectionDate: '2024-06-01', items: [] } as never,
          'eq-uuid-1',
          'user-uuid-1'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createByEquipment()', () => {
    it('장비에 연결된 교정으로 점검을 생성한다', async () => {
      // needsIntermediateCheck 조회 → true
      mockDb.select.mockReturnValueOnce(createSelectChain([{ needsIntermediateCheck: true }]));
      // 승인된 교정 select → found
      mockDb.select.mockReturnValueOnce(createSelectChain([{ id: 'cal-uuid-1' }]));
      // create() 내부 calibration 존재 확인 select
      mockDb.select.mockReturnValueOnce(
        createSelectChain([{ id: 'cal-uuid-1', equipmentId: 'eq-uuid-1' }])
      );
      mockDb.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_INSPECTION]),
          }),
        })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) });

      const result = await service.createByEquipment(
        'eq-uuid-1',
        { inspectionDate: '2024-06-01', items: [] } as never,
        'user-uuid-1'
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('insp-uuid-1');
    });

    it('needsIntermediateCheck=false 장비는 BadRequestException을 던진다', async () => {
      // needsIntermediateCheck 조회 → false
      mockDb.select.mockReturnValueOnce(createSelectChain([{ needsIntermediateCheck: false }]));

      await expect(
        service.createByEquipment(
          'non-applicable-eq',
          { inspectionDate: '2024-06-01', items: [] } as never,
          'user-uuid-1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('교정 없는 비교정 장비는 calibrationId=null로 점검을 생성한다', async () => {
      // needsIntermediateCheck 조회 → true
      mockDb.select.mockReturnValueOnce(createSelectChain([{ needsIntermediateCheck: true }]));
      // approved calibration select → not found
      mockDb.select.mockReturnValueOnce(createSelectChain([]));
      // fallback any calibration select → not found
      mockDb.select.mockReturnValueOnce(createSelectChain([]));
      mockDb.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...MOCK_INSPECTION, calibrationId: null }]),
          }),
        })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) });

      const result = await service.createByEquipment(
        'non-calib-eq',
        { inspectionDate: '2024-06-01', items: [] } as never,
        'user-uuid-1'
      );

      expect(result).toBeDefined();
      expect(result.calibrationId).toBeNull();
    });
  });

  describe('createByCalibration()', () => {
    it('교정 ID로 equipmentId를 조회하여 점검을 생성한다', async () => {
      // calibration lookup → found
      mockDb.select.mockReturnValueOnce(createSelectChain([{ equipmentId: 'eq-uuid-1' }]));
      // create() 내부 calibration 존재 확인 select
      mockDb.select.mockReturnValueOnce(
        createSelectChain([{ id: 'cal-uuid-1', equipmentId: 'eq-uuid-1' }])
      );
      mockDb.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_INSPECTION]),
          }),
        })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) })
        .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) });

      const result = await service.createByCalibration(
        'cal-uuid-1',
        { inspectionDate: '2024-06-01', items: [] } as never,
        'user-uuid-1'
      );

      expect(result).toBeDefined();
    });

    it('교정이 없으면 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      await expect(
        service.createByCalibration(
          'non-existent-cal',
          { inspectionDate: '2024-06-01', items: [] } as never,
          'user-uuid-1'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne()', () => {
    it('항목 및 측정장비를 포함한 점검 상세를 반환한다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      const result = await service.findOne('insp-uuid-1');

      expect(result.id).toBe('insp-uuid-1');
      expect(result.items).toBeDefined();
      expect(result.inspectionEquipment).toBeDefined();
    });

    it('없으면 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('draft 상태에서 수정 성공한다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await service.update('insp-uuid-1', { version: 1 } as never);
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('draft가 아닌 상태에서 BadRequestException을 던진다', async () => {
      const submitted = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([submitted]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.update('insp-uuid-1', { version: 1 } as never)).rejects.toThrow(
        BadRequestException
      );
    });

    it('버전 불일치 시 ConflictException을 던진다', async () => {
      // findOne: draft 상태 확인 (3 selects)
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]))
        // updateWithVersion 내부 SELECT: record exists with different version → CAS conflict
        .mockReturnValueOnce(createSelectChain([{ id: 'insp-uuid-1', version: 2 }]));
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]), // 0 rows — CAS miss
          }),
        }),
      });

      await expect(service.update('insp-uuid-1', { version: 1 } as never)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('submit()', () => {
    it('draft → submitted 상태 전이', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      const updated = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
      };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));

      await service.submit('insp-uuid-1', 1, 'user-uuid-1');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('draft가 아닌 상태에서 BadRequestException을 던진다', async () => {
      const submitted = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([submitted]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.submit('insp-uuid-1', 1, 'user-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('review()', () => {
    it('submitted → reviewed 상태 전이', async () => {
      const submitted = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([submitted]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      const updated = { ...submitted, approvalStatus: InspectionApprovalStatusValues.REVIEWED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));

      await service.review('insp-uuid-1', 1, 'reviewer-uuid-1');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('submitted가 아닌 상태에서 BadRequestException을 던진다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.review('insp-uuid-1', 1, 'reviewer-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('approve()', () => {
    it('reviewed → approved 상태 전이', async () => {
      const reviewed = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.REVIEWED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([reviewed]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      const updated = { ...reviewed, approvalStatus: InspectionApprovalStatusValues.APPROVED };
      mockDb.update.mockReturnValueOnce(mockUpdateChain(updated));

      await service.approve('insp-uuid-1', 1, 'approver-uuid-1');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('reviewed가 아닌 상태에서 BadRequestException을 던진다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.approve('insp-uuid-1', 1, 'approver-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reject()', () => {
    it('submitted → rejected 상태 전이', async () => {
      const submitted = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([submitted]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      mockDb.update.mockReturnValueOnce(
        mockUpdateChain({ ...submitted, approvalStatus: InspectionApprovalStatusValues.REJECTED })
      );

      await service.reject('insp-uuid-1', 1, 'reviewer-uuid-1', '기준 미달');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('reviewed → rejected 상태 전이', async () => {
      const reviewed = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.REVIEWED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([reviewed]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      mockDb.update.mockReturnValueOnce(
        mockUpdateChain({ ...reviewed, approvalStatus: InspectionApprovalStatusValues.REJECTED })
      );

      await service.reject('insp-uuid-1', 1, 'reviewer-uuid-1', '미달');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('draft/approved 상태에서 BadRequestException을 던진다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION])) // draft
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.reject('insp-uuid-1', 1, 'reviewer-uuid-1', '이유')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('withdraw()', () => {
    it('submitted → draft 상태 전이 (제출자 일치)', async () => {
      const submitted = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
        submittedBy: 'user-uuid-1',
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([submitted]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      mockDb.update.mockReturnValueOnce(
        mockUpdateChain({
          ...submitted,
          approvalStatus: InspectionApprovalStatusValues.DRAFT,
          submittedBy: null,
        })
      );

      await service.withdraw('insp-uuid-1', 1, 'user-uuid-1');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('제출자 불일치 시 BadRequestException을 던진다', async () => {
      const submitted = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.SUBMITTED,
        submittedBy: 'other-user',
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([submitted]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.withdraw('insp-uuid-1', 1, 'user-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('submitted가 아닌 상태에서 BadRequestException을 던진다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.withdraw('insp-uuid-1', 1, 'user-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('resubmit()', () => {
    it('rejected → draft 상태 전이', async () => {
      const rejected = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.REJECTED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([rejected]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      mockDb.update.mockReturnValueOnce(
        mockUpdateChain({ ...rejected, approvalStatus: InspectionApprovalStatusValues.DRAFT })
      );

      await service.resubmit('insp-uuid-1', 1, 'user-uuid-1');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('rejected가 아닌 상태에서 BadRequestException을 던진다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.resubmit('insp-uuid-1', 1, 'user-uuid-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('remove()', () => {
    it('allowApproved=false, draft 상태 삭제 성공', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      // transaction 내 하위 테이블 삭제
      mockDb.select.mockReturnValueOnce(createSelectChain([])); // item IDs
      mockDb.delete.mockReturnValue({ where: jest.fn().mockResolvedValue([]) });

      const result = await service.remove('insp-uuid-1', false);
      expect(result.success).toBe(true);
    });

    it('allowApproved=false, approved 상태 삭제 시 BadRequestException', async () => {
      const approved = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.APPROVED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([approved]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));

      await expect(service.remove('insp-uuid-1', false)).rejects.toThrow(BadRequestException);
    });

    it('allowApproved=true, approved 상태도 삭제 가능', async () => {
      const approved = {
        ...MOCK_INSPECTION,
        approvalStatus: InspectionApprovalStatusValues.APPROVED,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([approved]))
        .mockReturnValueOnce(createSelectChain([]))
        .mockReturnValueOnce(createSelectChain([]));
      mockDb.select.mockReturnValueOnce(createSelectChain([])); // item IDs
      mockDb.delete.mockReturnValue({ where: jest.fn().mockResolvedValue([]) });

      const result = await service.remove('insp-uuid-1', true);
      expect(result.success).toBe(true);
    });
  });
});
