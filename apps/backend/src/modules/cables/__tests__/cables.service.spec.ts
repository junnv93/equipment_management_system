import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CablesService } from '../cables.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import { CableStatusValues } from '@equipment-management/schemas';

const MOCK_CABLE = {
  id: 'cable-uuid-1',
  managementNumber: 'C0001',
  length: 1.5,
  connectorType: 'N-type',
  frequencyRangeMin: 0,
  frequencyRangeMax: 6000,
  serialNumber: 'SN-001',
  location: 'Lab A',
  site: 'suwon',
  status: CableStatusValues.ACTIVE,
  lastMeasurementDate: null,
  createdBy: 'user-uuid-1',
  casVersion: 1,
  version: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const MOCK_MEASUREMENT = {
  id: 'meas-uuid-1',
  cableId: 'cable-uuid-1',
  measurementDate: new Date('2024-06-01'),
  measuredBy: 'user-uuid-1',
  measurementEquipmentId: null,
  notes: null,
  createdAt: new Date('2024-06-01'),
};

describe('CablesService', () => {
  let service: CablesService;
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
    // Make chain thenable so `await chain` resolves at any point in the call chain
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
      resolve(Array.isArray(value) ? value : [value]);
    return chain;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    const selectChain = createSelectChain([MOCK_CABLE]);

    mockDb = {
      select: jest.fn().mockReturnValue(selectChain),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_CABLE]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_CABLE]),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CablesService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<CablesService>(CablesService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('케이블을 생성하고 리스트 캐시를 무효화한다', async () => {
      const result = await service.create(
        {
          managementNumber: 'C0001',
          connectorType: 'N-type',
        } as never,
        'user-uuid-1'
      );

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'cable-uuid-1' });
    });
  });

  describe('findAll()', () => {
    it('페이지네이션 메타와 함께 케이블 목록을 반환한다', async () => {
      const countChain = createSelectChain([{ count: 1 }]);
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_CABLE]))
        .mockReturnValueOnce(countChain);

      const result = await service.findAll({ page: 1, pageSize: 10 } as never);

      expect(result.items).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.currentPage).toBe(1);
    });

    it('검색/connectorType/status/site 필터를 적용한다', async () => {
      const countChain = createSelectChain([{ count: 0 }]);
      mockDb.select.mockReturnValueOnce(createSelectChain([])).mockReturnValueOnce(countChain);

      const result = await service.findAll({
        search: 'C0001',
        connectorType: 'N-type',
        status: CableStatusValues.ACTIVE,
        site: 'suwon',
        page: 1,
        pageSize: 10,
      } as never);

      expect(result.items).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('케이블과 최신 데이터 포인트를 반환한다', async () => {
      const cableChain = createSelectChain([MOCK_CABLE]);
      const measurementChain = createSelectChain([MOCK_MEASUREMENT]);
      const dataPointsChain = createSelectChain([]);
      mockDb.select
        .mockReturnValueOnce(cableChain)
        .mockReturnValueOnce(measurementChain)
        .mockReturnValueOnce(dataPointsChain);

      const result = await service.findOne('cable-uuid-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('cable-uuid-1');
      expect(result.latestDataPoints).toBeDefined();
    });

    it('케이블이 없으면 NotFoundException을 던진다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValueOnce(emptyChain);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('updateWithVersion을 호출하고 캐시를 무효화한다', async () => {
      await service.update('cable-uuid-1', { version: 1, length: 2.0 } as never);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('버전 불일치 시 ConflictException을 던진다', async () => {
      // updateWithVersion: UPDATE returns [] (version mismatch) → SELECT finds record with different version
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]), // 0 rows — CAS miss
          }),
        }),
      });
      mockDb.select.mockReturnValueOnce(
        createSelectChain([{ id: 'cable-uuid-1', version: 2 }]) // server version=2, client sent version=1
      );

      await expect(
        service.update('cable-uuid-1', { version: 1, length: 2.0 } as never)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('addMeasurement()', () => {
    it('케이블이 없으면 NotFoundException을 던진다', async () => {
      const emptyChain = createSelectChain([]);
      mockDb.select.mockReturnValueOnce(emptyChain);

      await expect(
        service.addMeasurement(
          'non-existent',
          { measurementDate: '2024-06-01', dataPoints: [] } as never,
          'user-uuid-1'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('트랜잭션으로 측정값과 데이터 포인트를 삽입한다', async () => {
      const cableChain = createSelectChain([{ id: 'cable-uuid-1' }]);
      mockDb.select.mockReturnValueOnce(cableChain);
      mockDb.insert
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_MEASUREMENT]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockResolvedValue([]),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockResolvedValue([]),
        });

      const result = await service.addMeasurement(
        'cable-uuid-1',
        {
          measurementDate: '2024-06-01',
          dataPoints: [{ frequencyMhz: 1000, lossDb: -1.5 }],
        } as never,
        'user-uuid-1'
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findMeasurements()', () => {
    it('날짜 내림차순으로 측정 목록을 반환한다', async () => {
      const chain = createSelectChain([MOCK_MEASUREMENT]);
      mockDb.select.mockReturnValueOnce(chain);

      const result = await service.findMeasurements('cable-uuid-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findMeasurementDetail()', () => {
    it('측정 상세와 데이터 포인트를 반환한다', async () => {
      const dataPoint = {
        id: 'dp-uuid-1',
        measurementId: 'meas-uuid-1',
        frequencyMhz: 1000,
        lossDb: -1.5,
      };
      mockDb.select
        .mockReturnValueOnce(createSelectChain([MOCK_MEASUREMENT]))
        .mockReturnValueOnce(createSelectChain([dataPoint]));

      const result = await service.findMeasurementDetail('meas-uuid-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('meas-uuid-1');
      expect(result.dataPoints).toBeDefined();
    });

    it('측정이 없으면 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));

      await expect(service.findMeasurementDetail('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('onVersionConflict()', () => {
    it('detail 캐시를 삭제한다', async () => {
      await (
        service as unknown as { onVersionConflict: (id: string) => Promise<void> }
      ).onVersionConflict('cable-uuid-1');

      expect(mockCacheService.delete).toHaveBeenCalledWith(expect.stringContaining('cable-uuid-1'));
    });
  });
});
