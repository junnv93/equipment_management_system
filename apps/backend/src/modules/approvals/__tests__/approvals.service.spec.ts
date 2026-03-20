import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApprovalsService } from '../approvals.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import * as schema from '@equipment-management/db/schema';

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  /**
   * 테이블별 COUNT 반환값 설정
   *
   * select().from(table).where() 또는 select().from(table).innerJoin().where() 경로에서
   * table 객체를 키로 사용하여 테이블별 다른 count를 반환합니다.
   */
  const tableCounts = new Map<object, number>();

  const createSelectChain = (table: object): Record<string, jest.Mock> => {
    const cnt = tableCounts.get(table) ?? 0;
    const chain: Record<string, jest.Mock> = {
      where: jest.fn().mockResolvedValue([{ count: cnt }]),
      innerJoin: jest.fn(),
    };
    // innerJoin → 동일 chain 반환 (체이닝: .innerJoin().where())
    chain.innerJoin.mockReturnValue(chain);
    return chain;
  };

  const MOCK_USER = {
    id: 'user-1',
    teamId: 'team-1',
    site: 'SUW',
  };

  let mockDb: {
    query: { users: { findFirst: jest.Mock } };
    select: jest.Mock;
  };

  beforeEach(async () => {
    tableCounts.clear();

    mockDb = {
      query: {
        users: { findFirst: jest.fn().mockResolvedValue(MOCK_USER) },
      },
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockImplementation((table: object) => createSelectChain(table)),
      }),
    };

    const mockCacheService = {
      getOrSet: jest.fn().mockImplementation((_key: string, fn: () => Promise<unknown>) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
  });

  describe('getPendingCountsByRole', () => {
    it('존재하지 않는 userId로 조회하면 NotFoundException을 던진다', async () => {
      mockDb.query.users.findFirst.mockResolvedValue(null);

      await expect(
        service.getPendingCountsByRole('non-existent-user', 'technical_manager')
      ).rejects.toThrow(NotFoundException);
    });

    it('test_engineer 역할은 모든 카테고리 카운트가 0이어야 한다', async () => {
      const result = await service.getPendingCountsByRole('user-1', 'test_engineer');

      expect(result.outgoing).toBe(0);
      expect(result.incoming).toBe(0);
      expect(result.equipment).toBe(0);
      expect(result.calibration).toBe(0);
      expect(result.inspection).toBe(0);
      expect(result.nonconformity).toBe(0);
      expect(result.disposal_review).toBe(0);
      expect(result.disposal_final).toBe(0);
      expect(result.plan_review).toBe(0);
      expect(result.plan_final).toBe(0);
      expect(result.software).toBe(0);
    });

    it('quality_manager 역할은 plan_review만 조회한다', async () => {
      tableCounts.set(schema.calibrationPlans, 2);

      const result = await service.getPendingCountsByRole('user-1', 'quality_manager');

      expect(result.plan_review).toBe(2);
      // quality_manager는 plan_review 외 다른 카테고리에 접근하지 않음
      expect(result.outgoing).toBe(0);
      expect(result.incoming).toBe(0);
      expect(result.equipment).toBe(0);
      expect(result.calibration).toBe(0);
      expect(result.disposal_review).toBe(0);
      expect(result.disposal_final).toBe(0);
      expect(result.plan_final).toBe(0);
      expect(result.software).toBe(0);
    });

    it('technical_manager 역할은 outgoing/incoming/calibration 등을 조회한다', async () => {
      tableCounts.set(schema.checkouts, 1);
      tableCounts.set(schema.calibrations, 2);
      tableCounts.set(schema.softwareHistory, 1);

      const result = await service.getPendingCountsByRole('user-1', 'technical_manager');

      // technical_manager는 plan_review/plan_final에 접근하지 않음
      expect(result.plan_review).toBe(0);
      expect(result.plan_final).toBe(0);
      // software는 조회됨
      expect(result.software).toBe(1);
    });

    it('lab_manager 역할은 disposal_final과 plan_final을 조회한다', async () => {
      // lab_manager: DISPOSAL_DATA_SCOPE=site → site 필터 적용
      mockDb.query.users.findFirst.mockResolvedValue({ ...MOCK_USER, site: 'SUW' });
      tableCounts.set(schema.disposalRequests, 3);
      tableCounts.set(schema.calibrationPlans, 1);

      const result = await service.getPendingCountsByRole('user-1', 'lab_manager');

      expect(result.disposal_final).toBe(3);
      expect(result.plan_final).toBe(1);
      // lab_manager는 equipment/calibration 직접 승인 안함
      expect(result.equipment).toBe(0);
      expect(result.calibration).toBe(0);
    });

    it('반환 객체가 PendingCountsByCategory의 모든 키를 포함한다', async () => {
      const result = await service.getPendingCountsByRole('user-1', 'test_engineer');

      const expectedKeys = [
        'outgoing',
        'incoming',
        'equipment',
        'calibration',
        'inspection',
        'nonconformity',
        'disposal_review',
        'disposal_final',
        'plan_review',
        'plan_final',
        'software',
      ];

      for (const key of expectedKeys) {
        expect(result).toHaveProperty(key);
        expect(typeof result[key as keyof typeof result]).toBe('number');
      }
    });
  });
});
