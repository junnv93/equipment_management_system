import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';

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
const createMockApprovalCounts = (overrides: Record<string, number> = {}) => ({
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
  software: 0,
  ...overrides,
});

describe('DashboardService', () => {
  let service: DashboardService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockDb: { select: jest.Mock };
  let mockApprovalsService: { getApprovalCountsByScope: jest.Mock };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    // getOrSet은 factory 함수를 즉시 실행하도록 설정 (캐시 미스 시뮬레이션)
    mockCacheService.getOrSet.mockImplementation((_key: unknown, factory: () => unknown) =>
      factory()
    );

    mockDb = {
      select: jest.fn().mockReturnValue(createQueryChain()),
    };

    mockApprovalsService = {
      getApprovalCountsByScope: jest.fn().mockResolvedValue(createMockApprovalCounts()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: ApprovalsService, useValue: mockApprovalsService },
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
      // getSummary는 Promise.all([equipmentStats, checkoutResult])로 2개 쿼리 실행
      mockDb.select
        .mockReturnValueOnce(
          createQueryChain([{ total: 10, available: 7, upcomingCalibrations: 2 }])
        )
        .mockReturnValueOnce(createQueryChain([{ count: 3 }]));

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
        createMockApprovalCounts({ equipment: 3, calibration: 2, outgoing: 5, software: 1 })
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
        createMockApprovalCounts({ equipment: 1, calibration: 1, outgoing: 1, software: 1 })
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
});
