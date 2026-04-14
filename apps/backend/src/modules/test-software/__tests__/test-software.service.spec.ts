import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TestSoftwareService } from '../test-software.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  createMockCacheService,
  createMockEventEmitter,
} from '../../../common/testing/mock-providers';
import { SoftwareAvailabilityValues } from '@equipment-management/schemas';

const MOCK_SOFTWARE = {
  id: 'sw-uuid-1',
  managementNumber: 'P0001',
  name: '테스트 소프트웨어 A',
  softwareVersion: '1.0.0',
  testField: 'EMC',
  primaryManagerId: 'user-uuid-1',
  secondaryManagerId: null,
  installedAt: null,
  manufacturer: 'TestMfg',
  location: 'Lab A',
  availability: SoftwareAvailabilityValues.AVAILABLE,
  requiresValidation: true,
  site: 'suwon',
  version: 1,
  casVersion: 1,
  createdBy: 'user-uuid-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  primaryManagerName: 'Test User',
  secondaryManagerName: null,
};

describe('TestSoftwareService', () => {
  let service: TestSoftwareService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    execute: jest.Mock;
    transaction: jest.Mock;
  };

  const createSelectChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const methods = [
      'select',
      'from',
      'where',
      'limit',
      'leftJoin',
      'innerJoin',
      'orderBy',
      'offset',
    ];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    // then 프로퍼티만으로 async 해결 — limit/orderBy.mockResolvedValue는
    // 중간 체인 메서드를 Promise로 바꿔서 이후 체이닝을 파괴하므로 제거
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
      resolve(Array.isArray(value) ? value : [value]);
    return chain;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockEventEmitter = createMockEventEmitter();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    mockDb = {
      select: jest.fn().mockReturnValue(createSelectChain([MOCK_SOFTWARE])),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_SOFTWARE]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_SOFTWARE]),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'link-uuid-1' }]),
        }),
      }),
      execute: jest.fn().mockResolvedValue({ rows: [{ max_num: null }] }),
      transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
        const txDb = {
          ...mockDb,
          execute: jest.fn().mockResolvedValue({ rows: [{ max_num: null }] }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([MOCK_SOFTWARE]),
            }),
          }),
        };
        return fn(txDb);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestSoftwareService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<TestSoftwareService>(TestSoftwareService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('관리번호를 생성하고 소프트웨어를 등록한다', async () => {
      const result = await service.create(
        { name: '테스트', testField: 'EMC' } as never,
        'user-uuid-1'
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll()', () => {
    it('관리자 이름이 JOIN된 페이지네이션 결과를 반환한다', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_SOFTWARE]))
        .mockReturnValueOnce(createSelectChain([{ count: 1 }]));

      const result = await service.findAll({ page: 1, pageSize: 10 } as never);

      expect(result.items).toBeDefined();
      expect(result.meta).toBeDefined();
    });
  });

  describe('findOne()', () => {
    it('소프트웨어가 있으면 반환한다', async () => {
      const result = await service.findOne('sw-uuid-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('sw-uuid-1');
    });

    it('없으면 NotFoundException을 던진다', async () => {
      mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('updateWithVersion을 호출하고 캐시를 무효화한다', async () => {
      await service.update('sw-uuid-1', { version: 1, name: '수정됨' } as never);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('버전 불일치 시 ConflictException을 던진다', async () => {
      // updateWithVersion: UPDATE returns [] (CAS miss)
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      // updateWithVersion 내부 SELECT: 서버 version=2, 클라이언트 version=1 전송
      mockDb.select.mockReturnValueOnce(createSelectChain([{ id: 'sw-uuid-1', version: 2 }]));

      await expect(
        service.update('sw-uuid-1', { version: 1, name: '수정됨' } as never)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleAvailability()', () => {
    it('available → unavailable로 전환한다', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([
                { ...MOCK_SOFTWARE, availability: SoftwareAvailabilityValues.UNAVAILABLE },
              ]),
          }),
        }),
      });

      const result = await service.toggleAvailability('sw-uuid-1', 1);
      expect(result.availability).toBe(SoftwareAvailabilityValues.UNAVAILABLE);
    });

    it('unavailable → available로 전환한다', async () => {
      const unavailableSw = {
        ...MOCK_SOFTWARE,
        availability: SoftwareAvailabilityValues.UNAVAILABLE,
      };
      mockDb.select.mockReturnValueOnce(createSelectChain([unavailableSw]));
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([
                { ...unavailableSw, availability: SoftwareAvailabilityValues.AVAILABLE },
              ]),
          }),
        }),
      });

      const result = await service.toggleAvailability('sw-uuid-1', 1);
      expect(result.availability).toBe(SoftwareAvailabilityValues.AVAILABLE);
    });
  });

  describe('linkEquipment()', () => {
    it('장비를 연결하고 이벤트를 emit한다', async () => {
      const link = {
        id: 'link-uuid-1',
        testSoftwareId: 'sw-uuid-1',
        equipmentId: 'eq-uuid-1',
        notes: null,
      };
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([link]),
        }),
      });

      const result = await service.linkEquipment('sw-uuid-1', {
        equipmentId: 'eq-uuid-1',
      } as never);

      expect(result).toMatchObject({ testSoftwareId: 'sw-uuid-1' });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'test-software.equipment.linked',
        expect.any(Object)
      );
    });

    it('중복 연결 시 ConflictException을 던진다', async () => {
      const pgUniqueError = Object.assign(new Error('unique violation'), { code: '23505' });
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(pgUniqueError),
        }),
      });

      await expect(
        service.linkEquipment('sw-uuid-1', { equipmentId: 'eq-uuid-1' } as never)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('unlinkEquipment()', () => {
    it('장비 연결을 해제하고 이벤트를 emit한다', async () => {
      await service.unlinkEquipment('sw-uuid-1', 'eq-uuid-1');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'test-software.equipment.unlinked',
        expect.any(Object)
      );
    });

    it('연결이 없으면 NotFoundException을 던진다', async () => {
      mockDb.delete.mockReturnValueOnce({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.unlinkEquipment('sw-uuid-1', 'eq-uuid-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('findLinkedEquipment()', () => {
    it('소프트웨어에 연결된 장비 목록을 반환한다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }]));

      const result = await service.findLinkedEquipment('sw-uuid-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findByEquipmentId()', () => {
    it('장비에 연결된 소프트웨어 목록을 반환한다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_SOFTWARE]));

      const result = await service.findByEquipmentId('eq-uuid-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
