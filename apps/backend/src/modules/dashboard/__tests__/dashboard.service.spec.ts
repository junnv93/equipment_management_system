import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';

/** 집계 쿼리 mock — count 결과를 단일 객체 배열로 반환 */
const createCountChain = (value: number): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'groupBy',
    'orderBy',
    'limit',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.where.mockResolvedValue([{ count: value }]);
  chain.groupBy.mockResolvedValue([]);
  chain.orderBy.mockResolvedValue([]);
  chain.limit.mockResolvedValue([]);
  return chain;
};

describe('DashboardService', () => {
  let service: DashboardService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockDb: { select: jest.Mock };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    // getOrSet은 factory 함수를 즉시 실행하도록 설정 (캐시 미스 시뮬레이션)
    mockCacheService.getOrSet.mockImplementation((_key: unknown, factory: () => unknown) =>
      factory()
    );

    mockDb = {
      select: jest.fn().mockReturnValue(createCountChain(0)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getSummary()', () => {
    it('캐시 서비스를 통해 데이터를 조회한다', async () => {
      await service.getSummary('user-1', 'test_engineer', 'team-1', 'SUW');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('dashboard:summary'),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('site와 teamId가 캐시 키에 포함된다', async () => {
      await service.getSummary('user-1', 'test_engineer', 'team-abc', 'UIW');

      const cacheKey = mockCacheService.getOrSet.mock.calls[0][0] as string;
      expect(cacheKey).toContain('UIW');
      expect(cacheKey).toContain('team-abc');
    });

    it('site와 teamId 없이 호출 시 전체 데이터 키를 사용한다', async () => {
      await service.getSummary('user-1', 'system_admin');

      const cacheKey = mockCacheService.getOrSet.mock.calls[0][0] as string;
      expect(cacheKey).toContain('all');
    });

    it('반환값에 totalEquipment, availableEquipment가 포함된다', async () => {
      const totalChain = createCountChain(10);
      mockDb.select
        .mockReturnValueOnce(totalChain) // totalEquipment
        .mockReturnValueOnce(createCountChain(7)) // availableEquipment
        .mockReturnValueOnce(createCountChain(2)) // checkedOut
        .mockReturnValue(createCountChain(0)); // 나머지

      const result = await service.getSummary('user-1', 'lab_manager', undefined, 'SUW');

      expect(result).toHaveProperty('totalEquipment');
      expect(result).toHaveProperty('availableEquipment');
    });
  });
});
