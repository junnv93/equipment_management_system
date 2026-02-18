import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApprovalsService } from '../approvals.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let mockDb: {
    query: {
      users: { findFirst: jest.Mock };
      checkouts: { findMany: jest.Mock };
      calibrations: { findMany: jest.Mock };
      calibrationPlans: { findMany: jest.Mock };
      nonConformances: { findMany: jest.Mock };
      disposalRequests: { findMany: jest.Mock };
      equipmentRequests: { findMany: jest.Mock };
      softwareHistory: { findMany: jest.Mock };
      equipmentImports: { findMany: jest.Mock };
    };
  };

  const MOCK_USER = {
    id: 'user-1',
    teamId: 'team-1',
    site: 'SUW',
  };

  beforeEach(async () => {
    mockDb = {
      query: {
        users: { findFirst: jest.fn().mockResolvedValue(MOCK_USER) },
        checkouts: { findMany: jest.fn().mockResolvedValue([]) },
        calibrations: { findMany: jest.fn().mockResolvedValue([]) },
        calibrationPlans: { findMany: jest.fn().mockResolvedValue([]) },
        nonConformances: { findMany: jest.fn().mockResolvedValue([]) },
        disposalRequests: { findMany: jest.fn().mockResolvedValue([]) },
        equipmentRequests: { findMany: jest.fn().mockResolvedValue([]) },
        softwareHistory: { findMany: jest.fn().mockResolvedValue([]) },
        equipmentImports: { findMany: jest.fn().mockResolvedValue([]) },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApprovalsService, { provide: 'DRIZZLE_INSTANCE', useValue: mockDb }],
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
      mockDb.query.calibrationPlans.findMany.mockResolvedValue([{}, {}]); // 2 pending

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
      mockDb.query.checkouts.findMany.mockResolvedValue([{}]); // 1 pending checkout
      mockDb.query.calibrations.findMany.mockResolvedValue([{}, {}]); // 2 pending calibrations
      mockDb.query.softwareHistory.findMany.mockResolvedValue([{}]); // 1 software

      const result = await service.getPendingCountsByRole('user-1', 'technical_manager');

      // technical_manager는 plan_review/plan_final에 접근하지 않음
      expect(result.plan_review).toBe(0);
      expect(result.plan_final).toBe(0);
      // software는 조회됨
      expect(result.software).toBe(1);
    });

    it('lab_manager 역할은 disposal_final과 plan_final을 조회한다', async () => {
      // site=null → getDisposalFinalCount가 db.query.findMany 경로를 사용 (select 경로 회피)
      mockDb.query.users.findFirst.mockResolvedValue({ ...MOCK_USER, site: null });
      mockDb.query.disposalRequests.findMany.mockResolvedValue([{}, {}, {}]); // 3 disposal final
      mockDb.query.calibrationPlans.findMany.mockResolvedValue([{}]); // 1 plan final

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
