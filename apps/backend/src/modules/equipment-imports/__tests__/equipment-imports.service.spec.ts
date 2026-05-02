import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { EquipmentImportsService } from '../equipment-imports.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { CheckoutsService } from '../../checkouts/checkouts.service';
import { createMockEventEmitter } from '../../../common/testing/mock-providers';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { DocumentService } from '../../../common/file-upload/document.service';

const MOCK_IMPORT = {
  id: 'import-uuid-1',
  status: 'pending',
  sourceType: 'rental',
  equipmentName: '오실로스코프',
  requesterId: 'user-uuid-1',
  approverId: null,
  teamId: 'team-uuid-1',
  site: 'suwon',
  vendorName: '삼성',
  ownerDepartment: null,
  equipmentId: null,
  usagePeriodStart: new Date('2024-01-01'),
  usagePeriodEnd: new Date('2024-03-01'),
  temporaryNumber: null,
  rejectionReason: null,
  version: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('EquipmentImportsService', () => {
  let service: EquipmentImportsService;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
    query: {
      equipmentImports: { findMany: jest.Mock; findFirst: jest.Mock };
    };
  };

  /** select().from().where().limit() 체인 */
  const createSelectChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const methods = [
      'select',
      'from',
      'where',
      'limit',
      'leftJoin',
      'orderBy',
      'offset',
      'returning',
    ];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    const arr = Array.isArray(value) ? value : [value];
    chain.limit.mockResolvedValue(arr);
    chain.returning.mockResolvedValue(arr);
    chain.orderBy.mockResolvedValue(arr);
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(arr);
    return chain;
  };

  /** update().set().where().returning() 체인 */
  const createUpdateChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    ['update', 'set', 'where', 'returning'].forEach(
      (m) => (chain[m] = jest.fn().mockReturnValue(chain))
    );
    const arr = Array.isArray(value) ? value : [value];
    chain.returning.mockResolvedValue(arr);
    return chain;
  };

  beforeEach(async () => {
    mockEventEmitter = createMockEventEmitter();

    mockDb = {
      select: jest.fn().mockReturnValue(createSelectChain([MOCK_IMPORT])),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_IMPORT]),
        }),
      }),
      update: jest.fn().mockReturnValue(createUpdateChain(MOCK_IMPORT)),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
      query: {
        equipmentImports: {
          findMany: jest.fn().mockResolvedValue([MOCK_IMPORT]),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentImportsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        {
          provide: EquipmentService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: 'new-eq-id', managementNumber: 'TEMP-001' }),
            update: jest.fn(),
          },
        },
        {
          provide: CheckoutsService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        {
          provide: SimpleCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            deleteByPattern: jest.fn(),
            deleteByPrefix: jest.fn(),
            getOrSet: jest
              .fn()
              .mockImplementation((_key: string, factory: () => Promise<unknown>) => factory()),
          },
        },
        {
          provide: CacheInvalidationHelper,
          useValue: {
            invalidateAfterEquipmentUpdate: jest.fn().mockResolvedValue(undefined),
            invalidateAfterCheckoutStatusChange: jest.fn().mockResolvedValue(undefined),
            invalidateAllDashboard: jest.fn().mockResolvedValue(undefined),
            invalidateAllEquipmentImports: jest.fn(),
            invalidateEquipmentImportsWithEquipment: jest.fn(),
          },
        },
        {
          provide: DocumentService,
          useValue: {
            attachDocument: jest.fn(),
            deleteDocumentsByEntity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EquipmentImportsService>(EquipmentImportsService);
  });

  describe('findOne()', () => {
    it('존재하는 반입 ID로 반입 기록을 반환한다', async () => {
      const result = await service.findOne('import-uuid-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('import-uuid-1');
      expect(result.status).toBe('pending');
    });

    it('존재하지 않는 ID에서 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll()', () => {
    it('반입 목록을 반환한다', async () => {
      // findMany → items, select count → meta.totalItems
      const countChain = createSelectChain([{ count: 1 }]);
      mockDb.select.mockReturnValue(countChain);

      const result = (await service.findAll({})) as {
        items: unknown[];
        meta: { totalItems: number };
      };

      expect(Array.isArray(result.items)).toBe(true);
    });

    it('status 필터를 적용할 수 있다', async () => {
      mockDb.query.equipmentImports.findMany.mockResolvedValue([]);
      const countChain = createSelectChain([{ count: 0 }]);
      mockDb.select.mockReturnValue(countChain);

      const result = (await service.findAll({ status: 'approved' as never })) as {
        items: unknown[];
      };

      expect(result.items).toHaveLength(0);
    });
  });

  describe('approve()', () => {
    it('pending 상태가 아닌 반입 승인 시 BadRequestException을 던진다', async () => {
      // 새 CAS 원자 플로우: WHERE status=PENDING 병합 → UPDATE 0 rows → 분류 SELECT
      // version 은 일치 하지만 __pre_0 (status 컬럼 alias) 가 precondition 과 불일치 → 400
      mockDb.update.mockReturnValue(createUpdateChain([]));
      mockDb.select.mockReturnValue(
        createSelectChain([{ id: 'import-uuid-1', version: 1, __pre_0: 'approved' }])
      );

      await expect(
        service.approve('import-uuid-1', 'approver-1', { version: 1 } as never)
      ).rejects.toThrow(BadRequestException);
    });

    it('승인 성공 시 이벤트를 발행한다', async () => {
      // updateWithVersion: approved 반환 (findOne 선행 호출은 더 이상 없음)
      const approvedImport = { ...MOCK_IMPORT, status: 'approved', version: 2 };
      mockDb.update.mockReturnValue(createUpdateChain(approvedImport));

      await service.approve('import-uuid-1', 'approver-1', { version: 1 } as never);

      // 이벤트명 NOTIFICATION_EVENTS.IMPORT_APPROVED = "equipmentImport.approved"
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        expect.stringContaining('Import'),
        expect.objectContaining({ importId: 'import-uuid-1' })
      );
    });
  });

  describe('reject()', () => {
    it('pending 상태가 아닌 반입 거절 시 BadRequestException을 던진다', async () => {
      // approve 와 동일한 원자 CAS 플로우 — precondition(__pre_0) 불일치 경로
      mockDb.update.mockReturnValue(createUpdateChain([]));
      mockDb.select.mockReturnValue(
        createSelectChain([{ id: 'import-uuid-1', version: 1, __pre_0: 'approved' }])
      );

      await expect(
        service.reject('import-uuid-1', 'approver-1', {
          version: 1,
          rejectionReason: '장비 반입 사양 불일치 — 재요청 필요', // 10+ 자
        } as never)
      ).rejects.toThrow(BadRequestException);
    });

    // 5-layer defense-in-depth fail-close: rejectionReason ≥10자 강제
    describe('rejectionReason fail-close (REJECTION_REASON_MIN_LENGTH)', () => {
      const MIN = VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH;
      it.each([
        ['빈 문자열', ''],
        ['공백만 (trim 후 0자)', '   '],
        [`${MIN - 1}자 (boundary)`, 'a'.repeat(MIN - 1)],
      ])(
        '%s — EquipmentImportRejectionReasonRequired BadRequestException',
        async (_label, reason) => {
          try {
            await service.reject('import-uuid-1', 'approver-1', {
              version: 1,
              rejectionReason: reason,
            } as never);
            throw new Error('expected BadRequestException');
          } catch (e) {
            expect(e).toBeInstanceOf(BadRequestException);
            const response = (e as BadRequestException).getResponse() as { code?: string };
            expect(response.code).toBe(ErrorCode.EquipmentImportRejectionReasonRequired);
          }
        }
      );
    });
  });

  describe('onReturnCanceled()', () => {
    const MOCK_RETURN_IMPORT = {
      ...MOCK_IMPORT,
      status: 'return_requested',
      returnCheckoutId: 'checkout-uuid-1',
    };

    it('첫 번째 시도에서 성공적으로 상태를 롤백한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([MOCK_RETURN_IMPORT]));
      const txUpdateChain = createUpdateChain([{ id: MOCK_RETURN_IMPORT.id }]);
      mockDb.update.mockReturnValue(txUpdateChain);

      await service.onReturnCanceled('checkout-uuid-1');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('ConflictException 시 1회 재시도하여 성공한다', async () => {
      // 매 시도마다 select가 호출되므로 2번 반환
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_RETURN_IMPORT]))
        .mockReturnValueOnce(createSelectChain([{ ...MOCK_RETURN_IMPORT, version: 2 }]));

      let txCallCount = 0;
      mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
        txCallCount++;
        if (txCallCount === 1) {
          // 첫 번째 시도: CAS 실패 (returning 빈 배열 → ConflictException)
          const failTx = {
            ...mockDb,
            update: jest.fn().mockReturnValue(createUpdateChain([])),
          };
          return fn(failTx);
        }
        // 두 번째 시도: 성공
        const successTx = {
          ...mockDb,
          update: jest.fn().mockReturnValue(createUpdateChain([{ id: MOCK_RETURN_IMPORT.id }])),
        };
        return fn(successTx);
      });

      await service.onReturnCanceled('checkout-uuid-1');

      expect(txCallCount).toBe(2);
    });

    it('ConflictException 재시도 후에도 실패하면 예외를 던진다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([MOCK_RETURN_IMPORT]));

      // 모든 시도에서 CAS 실패
      mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const failTx = {
          ...mockDb,
          update: jest.fn().mockReturnValue(createUpdateChain([])),
        };
        return fn(failTx);
      });

      await expect(service.onReturnCanceled('checkout-uuid-1')).rejects.toThrow(ConflictException);
    });

    it('연결된 반입이 없으면 조용히 반환한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await service.onReturnCanceled('non-existent-checkout');

      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe('onReturnCompleted()', () => {
    const MOCK_RETURN_IMPORT = {
      ...MOCK_IMPORT,
      status: 'return_requested',
      returnCheckoutId: 'checkout-uuid-1',
      equipmentId: 'eq-uuid-1',
    };

    it('반납 완료 시 import 상태를 returned로 변경한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([MOCK_RETURN_IMPORT]));
      const txUpdateChain = createUpdateChain([{ id: MOCK_RETURN_IMPORT.id }]);
      mockDb.update.mockReturnValue(txUpdateChain);

      // tx 내부에서 select + update가 여러번 호출됨
      mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const tx = {
          update: jest.fn().mockReturnValue(createUpdateChain([{ id: 'some-id' }])),
          select: jest.fn().mockReturnValue(createSelectChain([{ version: 1 }])),
        };
        return fn(tx);
      });

      await service.onReturnCompleted('checkout-uuid-1');

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('연결된 반입이 없으면 조용히 반환한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await service.onReturnCompleted('non-existent-checkout');

      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });
});
