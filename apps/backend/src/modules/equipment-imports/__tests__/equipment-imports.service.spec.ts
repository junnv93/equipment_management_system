import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EquipmentImportsService } from '../equipment-imports.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { CheckoutsService } from '../../checkouts/checkouts.service';
import { createMockEventEmitter } from '../../../common/testing/mock-providers';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';

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
      const approvedImport = { ...MOCK_IMPORT, status: 'approved' };
      mockDb.select.mockReturnValue(createSelectChain([approvedImport]));

      await expect(
        service.approve('import-uuid-1', 'approver-1', { version: 1 } as never)
      ).rejects.toThrow(BadRequestException);
    });

    it('승인 성공 시 이벤트를 발행한다', async () => {
      // findOne: pending 반환
      mockDb.select.mockReturnValue(createSelectChain([MOCK_IMPORT]));
      // updateWithVersion: approved 반환
      const approvedImport = { ...MOCK_IMPORT, status: 'approved', version: 2 };
      mockDb.update.mockReturnValue(createUpdateChain(approvedImport));

      await service.approve('import-uuid-1', 'approver-1', { version: 1 } as never);

      // 이벤트명 NOTIFICATION_EVENTS.IMPORT_APPROVED = "equipmentImport.approved"
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        expect.stringContaining('Import'),
        expect.objectContaining({ importId: 'import-uuid-1' })
      );
    });
  });

  describe('reject()', () => {
    it('pending 상태가 아닌 반입 거절 시 BadRequestException을 던진다', async () => {
      const approvedImport = { ...MOCK_IMPORT, status: 'approved' };
      mockDb.select.mockReturnValue(createSelectChain([approvedImport]));

      await expect(
        service.reject('import-uuid-1', 'approver-1', {
          version: 1,
          rejectionReason: '불필요',
        } as never)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
