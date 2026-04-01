import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';

/**
 * Drizzle SELECT 체인 mock 빌더
 *
 * 체인의 모든 메서드는 체인을 반환 + thenable(await 가능).
 * limit/orderBy/groupBy/offset 후에 orderBy 등이 추가 체인될 수 있으므로
 * then 핸들러로 종단 처리.
 */
const createSelectChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'orderBy',
    'limit',
    'offset',
    'groupBy',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  // 모든 체인 메서드가 await 가능하도록 thenable 설정
  (chain as Record<string, unknown>).then = (
    resolve: (v: unknown) => void,
    _reject?: (e: unknown) => void
  ) => Promise.resolve(finalValue).then(resolve, _reject);
  return chain;
};

const ALL_SCOPE: ResolvedDataScope = { type: 'all', label: '전체' };
const TEAM_SCOPE: ResolvedDataScope = { type: 'team', teamId: 'team-uuid-1', label: 'FCC 팀' };

describe('ReportsService', () => {
  let service: ReportsService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockDb: { select: jest.Mock };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    const defaultChain = createSelectChain([]);
    mockDb = {
      select: jest.fn().mockReturnValue(defaultChain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('getEquipmentUsage()', () => {
    it('팀별 통계와 상위 장비 목록을 반환한다', async () => {
      const teamChain = createSelectChain([
        { teamName: 'FCC EMC', checkoutCount: 5, equipmentCount: 3 },
      ]);
      const topChain = createSelectChain([
        { equipmentId: 'eq-uuid-1', name: '오실로스코프', checkoutCount: 3 },
      ]);
      const trendChain = createSelectChain([]);

      mockDb.select
        .mockReturnValueOnce(teamChain)
        .mockReturnValueOnce(topChain)
        .mockReturnValue(trendChain);

      const result = await service.getEquipmentUsage({ equipmentId: undefined }, ALL_SCOPE);

      expect(result.departmentDistribution).toHaveLength(1);
      expect(result.topEquipment).toHaveLength(1);
      expect(result.timeframe).toBeDefined();
    });

    it('team 스코프에서 팀 조건이 적용된다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      const result = await service.getEquipmentUsage({ equipmentId: undefined }, TEAM_SCOPE);

      expect(result).toBeDefined();
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('결과를 캐시에서 가져온다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      await service.getEquipmentUsage({ equipmentId: undefined }, ALL_SCOPE);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('reports:'),
        expect.any(Function),
        expect.any(Number)
      );
    });
  });

  describe('getCalibrationStatus()', () => {
    it('교정 상태 통계를 반환한다', async () => {
      const statusChain = createSelectChain([{ status: 'completed', statusCount: 5 }]);
      const overdueChain = createSelectChain([{ cnt: 2 }]);
      const dueChain = createSelectChain([{ cnt: 1 }]);
      const totalChain = createSelectChain([{ cnt: 10 }]);
      const trendChain = createSelectChain([]);

      mockDb.select
        .mockReturnValueOnce(statusChain)
        .mockReturnValueOnce(overdueChain)
        .mockReturnValueOnce(dueChain)
        .mockReturnValueOnce(totalChain)
        .mockReturnValue(trendChain);

      const result = await service.getCalibrationStatus({}, ALL_SCOPE);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalEquipment).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCheckoutStatistics()', () => {
    it('반출 통계를 반환한다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      const result = await service.getCheckoutStatistics({}, ALL_SCOPE);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('getUtilizationRate()', () => {
    it('장비 가동률 통계를 반환한다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      const result = await service.getUtilizationRate(
        { period: 'month', equipmentId: undefined },
        ALL_SCOPE
      );

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('getEquipmentDowntime()', () => {
    it('장비 다운타임 통계를 반환한다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      const result = await service.getEquipmentDowntime({ equipmentId: undefined }, ALL_SCOPE);

      expect(result).toBeDefined();
    });
  });

  describe('getEquipmentInventoryData()', () => {
    it('장비 재고 export 데이터를 반환한다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValue(emptyChain);

      const result = await service.getEquipmentInventoryData({}, ALL_SCOPE);

      expect(result.title).toBeDefined();
      expect(result.columns.length).toBeGreaterThan(0);
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });
});
