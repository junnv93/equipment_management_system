import { Test, TestingModule } from '@nestjs/testing';
import { InboundOverviewService } from './inbound-overview.service';
import type { InboundOverviewResult } from './inbound-overview.service';
import { CheckoutsService } from '../checkouts/checkouts.service';
import { EquipmentImportsService } from '../equipment-imports/equipment-imports.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_TTL } from '@equipment-management/shared-constants';

const MOCK_STANDARD_LIST = {
  items: [],
  meta: { total: 0, pageSize: 10, currentPage: 1, totalPages: 0 },
};

const MOCK_IMPORT_LIST = {
  items: [],
  meta: { totalItems: 0, pageSize: 10, currentPage: 1, totalPages: 0 },
};

describe('InboundOverviewService', () => {
  let service: InboundOverviewService;
  let mockCheckoutsService: { findAll: jest.Mock };
  let mockImportsService: { findAll: jest.Mock };
  let mockCacheService: { getOrSet: jest.Mock };
  let mockDb: { select: jest.Mock };

  beforeEach(async () => {
    const selectChain: Record<string, jest.Mock> = {};
    for (const m of ['from', 'where', 'groupBy', 'orderBy']) {
      selectChain[m] = jest.fn().mockReturnValue(selectChain);
    }
    selectChain.orderBy.mockResolvedValue([]);

    mockDb = { select: jest.fn().mockReturnValue(selectChain) };
    mockCheckoutsService = { findAll: jest.fn().mockResolvedValue(MOCK_STANDARD_LIST) };
    mockImportsService = { findAll: jest.fn().mockResolvedValue(MOCK_IMPORT_LIST) };
    mockCacheService = {
      getOrSet: jest
        .fn()
        .mockImplementation((_key: string, factory: () => Promise<unknown>) => factory()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InboundOverviewService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: CheckoutsService, useValue: mockCheckoutsService },
        { provide: EquipmentImportsService, useValue: mockImportsService },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<InboundOverviewService>(InboundOverviewService);
  });

  describe('getInboundOverview()', () => {
    it('standard / rental / internalShared / sparkline 4개 섹션을 반환한다', async () => {
      const result = (await service.getInboundOverview(
        { limitPerSection: 10 },
        null
      )) as InboundOverviewResult;

      expect(result).toHaveProperty('standard');
      expect(result).toHaveProperty('rental');
      expect(result).toHaveProperty('internalShared');
      expect(result).toHaveProperty('sparkline');
      expect(result).toHaveProperty('generatedAt');
    });

    it('sparkline 배열은 14일치(length=14)를 반환한다', async () => {
      const result = (await service.getInboundOverview(
        { limitPerSection: 10 },
        null
      )) as InboundOverviewResult;

      expect(result.sparkline.standard).toHaveLength(14);
      expect(result.sparkline.rental).toHaveLength(14);
      expect(result.sparkline.internalShared).toHaveLength(14);
    });

    it('EquipmentImportsService.findAll을 rental + internalShared 2회 호출한다', async () => {
      await service.getInboundOverview({ limitPerSection: 10 }, null);

      expect(mockImportsService.findAll).toHaveBeenCalledTimes(2);
      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'rental' })
      );
      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'internal_shared' })
      );
    });

    it('유효한 import status 필터는 findAll에 전달한다', async () => {
      await service.getInboundOverview({ limitPerSection: 10, statusFilter: 'pending' }, null);

      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('checkout 전용 status 필터는 imports findAll에 전달하지 않는다', async () => {
      // 'lender_checked'는 EQUIPMENT_IMPORT_STATUS_VALUES에 없음
      await service.getInboundOverview(
        { limitPerSection: 10, statusFilter: 'lender_checked' },
        null
      );

      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined })
      );
    });

    it('캐시 미스 시 getOrSet factory가 실행된다', async () => {
      await service.getInboundOverview({ limitPerSection: 5 }, 'team-uuid-1');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('inbound-overview:t:team-uuid-1'),
        expect.any(Function),
        CACHE_TTL.SHORT
      );
    });
  });
});
