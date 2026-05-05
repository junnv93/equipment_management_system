import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DashboardService } from '../dashboard.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import {
  STORAGE_HEALTH_PROVIDER,
  ASYNC_WORK_BACKLOG_PROVIDER,
  SYSTEM_ERROR_EVENT_PROVIDER,
} from '../health-providers/tokens';
import type {
  StorageHealthSnapshot,
  AsyncWorkBacklogSnapshot,
  SystemErrorEventCount,
} from '../health-providers/types';

/**
 * Drizzle query chain mock
 *
 * 모든 체인 메서드가 자기 자신을 반환하고, 마지막 then()에서 결과를 반환합니다.
 * Drizzle의 PromiseLike 패턴을 시뮬레이션합니다.
 *
 * @param resolveValue - 쿼리 결과로 반환할 값
 */
const createQueryChain = (resolveValue: unknown = []): Record<string, jest.Mock> => {
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
  // PromiseLike: await 시 resolveValue 반환
  chain.then = jest
    .fn()
    .mockImplementation((resolve) => Promise.resolve(resolveValue).then(resolve));
  return chain;
};

/** ApprovalsService.getApprovalCountsByScope()의 기본 반환값 */
const createMockApprovalCounts = (
  overrides: Record<string, number> = {}
): Record<string, number> => ({
  outgoing: 0,
  incoming: 0,
  equipment: 0,
  calibration: 0,
  inspection: 0,
  nonconformity: 0,
  disposal_review: 0,
  disposal_final: 0,
  plan_review: 0,
  plan_final: 0,
  software_validation: 0,
  ...overrides,
});

describe('DashboardService', () => {
  let service: DashboardService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockDb: { select: jest.Mock; execute: jest.Mock };
  let mockApprovalsService: { getApprovalCountsByScope: jest.Mock };
  let mockConfigService: { get: jest.Mock };
  let mockStorageProvider: { read: jest.Mock<Promise<StorageHealthSnapshot>, []> };
  let mockBacklogProvider: { read: jest.Mock<Promise<AsyncWorkBacklogSnapshot>, []> };
  let mockErrorProvider: {
    count24h: jest.Mock<Promise<SystemErrorEventCount>, []>;
    record: jest.Mock;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    // getOrSet은 factory 함수를 즉시 실행하도록 설정 (캐시 미스 시뮬레이션)
    mockCacheService.getOrSet.mockImplementation((_key: unknown, factory: () => unknown) =>
      factory()
    );

    mockDb = {
      select: jest.fn().mockReturnValue(createQueryChain()),
      execute: jest.fn().mockResolvedValue({ rows: [] }),
    };

    mockApprovalsService = {
      getApprovalCountsByScope: jest.fn().mockResolvedValue(createMockApprovalCounts()),
    };

    mockConfigService = {
      get: jest.fn(() => undefined),
    };

    // 기본 provider mock — getSystemHealth 외 테스트에서는 호출되지 않음.
    mockStorageProvider = {
      read: jest.fn<Promise<StorageHealthSnapshot>, []>().mockResolvedValue({
        dbSizeBytes: 0,
        diskUsedBytes: null,
        diskTotalBytes: null,
        storagePct: 0,
        backend: 'configured-capacity',
      }),
    };
    mockBacklogProvider = {
      read: jest.fn<Promise<AsyncWorkBacklogSnapshot>, []>().mockResolvedValue({
        queueSize: 0,
        backend: 'pending-work-aggregate',
      }),
    };
    mockErrorProvider = {
      count24h: jest.fn<Promise<SystemErrorEventCount>, []>().mockResolvedValue({
        errorCount24h: 0,
        source: 'system-error-events',
      }),
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: ApprovalsService, useValue: mockApprovalsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: STORAGE_HEALTH_PROVIDER, useValue: mockStorageProvider },
        { provide: ASYNC_WORK_BACKLOG_PROVIDER, useValue: mockBacklogProvider },
        { provide: SYSTEM_ERROR_EVENT_PROVIDER, useValue: mockErrorProvider },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getSummary()', () => {
    it('캐시 서비스를 통해 데이터를 조회한다', async () => {
      await service.getSummary('team-1', 'SUW');

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('dashboard:summary'),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('site와 teamId가 캐시 키에 포함된다', async () => {
      await service.getSummary('team-abc', 'UIW');

      const cacheKey = mockCacheService.getOrSet.mock.calls[0][0] as string;
      expect(cacheKey).toContain('UIW');
      expect(cacheKey).toContain('team-abc');
    });

    it('site와 teamId 없이 호출 시 전체 데이터 키를 사용한다', async () => {
      await service.getSummary();

      const cacheKey = mockCacheService.getOrSet.mock.calls[0][0] as string;
      expect(cacheKey).toContain('all');
    });

    it('반환값에 totalEquipment, availableEquipment가 포함된다', async () => {
      // getSummary는 단일 쿼리로 4개 필드를 조건부 집계 (equipment.status 기반 SSOT)
      mockDb.select.mockReturnValueOnce(
        createQueryChain([{ total: 10, available: 7, activeCheckouts: 3, upcomingCalibrations: 2 }])
      );

      const result = await service.getSummary(undefined, 'SUW');

      expect(result).toEqual({
        totalEquipment: 10,
        availableEquipment: 7,
        activeCheckouts: 3,
        upcomingCalibrations: 2,
      });
    });
  });

  describe('getAggregate()', () => {
    it('8개 서브 메서드를 병렬로 호출하고 모든 필드를 반환한다', async () => {
      const result = await service.getAggregate('technical_manager', 'SUW', 'team-1');

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('equipmentByTeam');
      expect(result).toHaveProperty('overdueCalibrations');
      expect(result).toHaveProperty('upcomingCalibrations');
      expect(result).toHaveProperty('overdueCheckouts');
      expect(result).toHaveProperty('equipmentStatusStats');
      expect(result).toHaveProperty('recentActivities');
      expect(result).toHaveProperty('upcomingCheckoutReturns');
    });

    it('부분 실패 시 해당 필드만 null이고 나머지는 정상 반환된다', async () => {
      // 캐시 키에 'summary'가 포함된 호출만 실패시킴
      mockCacheService.getOrSet.mockImplementation((key: string, factory: () => unknown) => {
        if (key.includes('summary')) {
          return Promise.reject(new Error('DB connection lost'));
        }
        return factory();
      });

      const result = await service.getAggregate('technical_manager', 'SUW');

      expect(result.summary).toBeNull();
      // 나머지 필드는 정상 (빈 데이터이지만 null이 아님)
      expect(result.equipmentByTeam).not.toBeNull();
      expect(result.overdueCalibrations).not.toBeNull();
      expect(result.recentActivities).not.toBeNull();
    });

    it('모든 서브 메서드가 실패해도 에러를 throw하지 않는다', async () => {
      mockCacheService.getOrSet.mockRejectedValue(new Error('Total failure'));

      const result = await service.getAggregate('technical_manager', undefined);

      expect(result.summary).toBeNull();
      expect(result.equipmentByTeam).toBeNull();
      expect(result.overdueCalibrations).toBeNull();
      expect(result.upcomingCalibrations).toBeNull();
      expect(result.overdueCheckouts).toBeNull();
      expect(result.equipmentStatusStats).toBeNull();
      expect(result.recentActivities).toBeNull();
      expect(result.upcomingCheckoutReturns).toBeNull();
    });

    it('aggregate 자체는 추가 캐시하지 않는다 (서브 메서드가 개별 캐시)', async () => {
      await service.getAggregate('technical_manager', 'SUW');

      const cacheKeys = mockCacheService.getOrSet.mock.calls.map((c) => c[0] as string);
      expect(cacheKeys.every((k) => !k.includes('aggregate'))).toBe(true);
    });
  });

  describe('getPendingApprovalCounts()', () => {
    it('ApprovalsService.getApprovalCountsByScope()에 위임한다', async () => {
      await service.getPendingApprovalCounts('technical_manager', 'team-1', 'SUW');

      expect(mockApprovalsService.getApprovalCountsByScope).toHaveBeenCalledWith({
        role: 'technical_manager',
        site: 'SUW',
        teamId: 'team-1',
      });
    });

    it('PendingCountsByCategory를 대시보드 DTO 형식으로 매핑한다', async () => {
      mockApprovalsService.getApprovalCountsByScope.mockResolvedValue(
        createMockApprovalCounts({
          equipment: 3,
          calibration: 2,
          outgoing: 5,
          software_validation: 1,
        })
      );

      const result = await service.getPendingApprovalCounts('technical_manager');

      expect(result).toEqual({
        equipment: 3,
        calibration: 2,
        checkout: 5, // outgoing → checkout 매핑
        software: 1,
        total: 11, // 3 + 2 + 5 + 1
      });
    });

    it('total은 매핑된 필드들의 합계이다', async () => {
      mockApprovalsService.getApprovalCountsByScope.mockResolvedValue(
        createMockApprovalCounts({
          equipment: 1,
          calibration: 1,
          outgoing: 1,
          software_validation: 1,
        })
      );

      const result = await service.getPendingApprovalCounts('technical_manager');

      expect(result.total).toBe(
        result.equipment + result.calibration + result.checkout + result.software
      );
    });

    it('SSOT에 없는 calibrationFactor 필드가 포함되지 않는다', async () => {
      const result = await service.getPendingApprovalCounts('technical_manager');

      expect(result).not.toHaveProperty('calibrationFactor');
    });
  });

  describe('getRecentActivities()', () => {
    it('감사 로그를 대시보드 활동 타입으로 변환한다', async () => {
      const mockAuditRow = {
        id: 'audit-1',
        action: 'create',
        entityType: 'equipment',
        entityId: 'eq-1',
        entityName: '디지털 멀티미터',
        userId: 'user-1',
        userName: '홍길동',
        timestamp: new Date('2026-03-20T10:00:00Z'),
        details: null,
        checkoutPurpose: null,
      };

      mockDb.select.mockReturnValue(createQueryChain([mockAuditRow]));

      const result = await service.getRecentActivities(20);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'audit-1',
        type: 'equipment_added', // AUDIT_TO_ACTIVITY_TYPE['create:equipment']
        equipmentName: '디지털 멀티미터',
        userName: '홍길동',
        details: '장비 "디지털 멀티미터" 생성', // AUDIT_ACTION_LABELS + AUDIT_ENTITY_TYPE_LABELS
      });
    });

    it('checkout purpose가 rental이면 활동 타입을 오버라이드한다', async () => {
      const mockRentalRow = {
        id: 'audit-2',
        action: 'create',
        entityType: 'checkout',
        entityId: 'co-1',
        entityName: '온도계',
        userId: 'user-1',
        userName: '김철수',
        timestamp: new Date('2026-03-20T11:00:00Z'),
        details: null,
        checkoutPurpose: 'rental',
      };

      mockDb.select.mockReturnValue(createQueryChain([mockRentalRow]));

      const result = await service.getRecentActivities(20);

      // checkout_created → rental_created (RENTAL_ACTIVITY_TYPE_OVERRIDES)
      expect(result[0].type).toBe('rental_created');
    });

    it('스코프 조건이 캐시 키에 반영된다', async () => {
      await service.getRecentActivities(20, 'team-1', 'SUW');

      const cacheKey = mockCacheService.getOrSet.mock.calls[0][0] as string;
      expect(cacheKey).toContain('SUW');
      expect(cacheKey).toContain('team-1');
    });
  });

  describe('getSystemHealth()', () => {
    /**
     * Provider 위임 후 dashboard.service 가 직접 쿼리하는 것은:
     *   1. db.execute(SELECT 1)                        — dbResponseMs 측정
     *   2. db.select(activeUsers)        ← chain 1     — auditLogs groupBy
     *   3. db.select(maxUsers)           ← chain 2     — users count
     *
     * Storage / backlog / errorCount24h 는 provider mock 으로 직접 주입.
     */
    function setupHealthMocks(opts: {
      storageSnapshot?: Partial<StorageHealthSnapshot>;
      backlogSnapshot?: Partial<AsyncWorkBacklogSnapshot>;
      errorSnapshot?: Partial<SystemErrorEventCount>;
      dbResponseMs: number;
      activeUsers?: { userId: string }[];
      maxUsersCount?: number;
    }) {
      const {
        storageSnapshot = {},
        backlogSnapshot = {},
        errorSnapshot = {},
        dbResponseMs,
        activeUsers = [{ userId: 'u1' }, { userId: 'u2' }],
        maxUsersCount = 10,
      } = opts;

      const fullStorage: StorageHealthSnapshot = {
        dbSizeBytes: 10 * 1024 * 1024 * 1024,
        diskUsedBytes: null,
        diskTotalBytes: null,
        storagePct: 10,
        backend: 'configured-capacity',
        ...storageSnapshot,
      };
      const fullBacklog: AsyncWorkBacklogSnapshot = {
        queueSize: 0,
        backend: 'pending-work-aggregate',
        ...backlogSnapshot,
      };
      const fullError: SystemErrorEventCount = {
        errorCount24h: 3,
        source: 'system-error-events',
        ...errorSnapshot,
      };

      mockStorageProvider.read.mockResolvedValueOnce(fullStorage);
      mockBacklogProvider.read.mockResolvedValueOnce(fullBacklog);
      mockErrorProvider.count24h.mockResolvedValueOnce(fullError);

      // db.execute: SELECT 1 ping 만 호출됨 (pg_database_size 는 provider 로 이동).
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      // db.select: activeUsers + maxUsers 두 번만.
      mockDb.select
        .mockReturnValueOnce(createQueryChain(activeUsers))
        .mockReturnValueOnce(createQueryChain([{ count: maxUsersCount }]));

      // Date.now: dbStart → dbEnd (차이 = dbResponseMs)
      const realNow = Date.now;
      jest
        .spyOn(Date, 'now')
        .mockImplementationOnce(() => 1_000_000)
        .mockImplementationOnce(() => 1_000_000 + dbResponseMs)
        .mockImplementation(() => realNow.call(Date));
    }

    afterEach(() => {
      (Date.now as unknown as jest.SpyInstance).mockRestore?.();
    });

    it('storagePct 는 storage provider 결과를 그대로 노출 (10%)', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.storagePct).toBe(10);
      expect(result.storageBackend).toBe('configured-capacity');
    });

    it('storagePct 100 cap 은 provider 책임 (provider 가 100 반환)', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 100 },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.storagePct).toBe(100);
    });

    it('storagePct null (pg-database fallback) 은 DTO 에서 0 으로 폴백', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: null, backend: 'pg-database', dbSizeBytes: 99 },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.storagePct).toBe(0);
      expect(result.storageBackend).toBe('pg-database');
      expect(result.dbSizeBytes).toBe(99);
    });

    it('overallStatus 는 모든 메트릭 정상 시 healthy', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.overallStatus).toBe('healthy');
    });

    it('overallStatus 는 dbResponseMs >= 500 시 degraded', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        dbResponseMs: 500,
      });
      const result = await service.getSystemHealth();
      expect(result.overallStatus).toBe('degraded');
    });

    it('overallStatus 는 storagePct >= 90 시 degraded', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 95 },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.overallStatus).toBe('degraded');
    });

    it('overallStatus 는 dbResponseMs >= 1500 시 down (degraded 우선순위 위)', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        dbResponseMs: 1500,
      });
      const result = await service.getSystemHealth();
      expect(result.overallStatus).toBe('down');
    });

    it('storagePct null 일 때 storage 조건은 overallStatus 판정에서 skip (healthy)', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: null, backend: 'pg-database' },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.overallStatus).toBe('healthy');
    });

    it('queueSize 는 backlog provider 결과를 그대로 노출', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        backlogSnapshot: { queueSize: 12, backend: 'pending-work-aggregate' },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.queueSize).toBe(12);
      expect(result.queueBackend).toBe('pending-work-aggregate');
    });

    it('errorCount24h 는 error provider 결과를 그대로 노출 + errorSource 매핑', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        errorSnapshot: { errorCount24h: 7, source: 'system-error-events' },
        dbResponseMs: 50,
      });
      const result = await service.getSystemHealth();
      expect(result.errorCount24h).toBe(7);
      expect(result.errorSource).toBe('system-error-events');
    });

    it('activeUsers/maxUsers/measuredAt 인라인 측정 결과 매핑', async () => {
      setupHealthMocks({
        storageSnapshot: { storagePct: 10 },
        dbResponseMs: 50,
        activeUsers: [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }],
        maxUsersCount: 25,
      });
      const result = await service.getSystemHealth();
      expect(result.activeUsers).toBe(3);
      expect(result.maxUsers).toBe(25);
      expect(typeof result.measuredAt).toBe('string');
    });
  });
});
