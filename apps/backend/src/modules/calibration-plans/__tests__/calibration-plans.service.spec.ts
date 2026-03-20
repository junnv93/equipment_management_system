import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CalibrationPlansService } from '../calibration-plans.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import {
  createMockCacheService,
  createMockEventEmitter,
} from '../../../common/testing/mock-providers';
import { EventEmitter2 } from '@nestjs/event-emitter';

const MOCK_PLAN = {
  id: 'plan-uuid-1',
  year: 2024,
  siteId: 'suwon',
  teamId: 'team-uuid-1',
  status: 'draft',
  casVersion: 1,
  version: 1,
  isLatestVersion: true,
  createdBy: 'user-uuid-1',
  submittedAt: null,
  reviewedBy: null,
  reviewedAt: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('CalibrationPlansService', () => {
  let service: CalibrationPlansService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };

  /** select chain — limit을 마지막으로 사용하는 findOneBasic/create용 */
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
      'returning',
    ];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    chain.limit.mockResolvedValue(value);
    chain.returning.mockResolvedValue(value);
    chain.orderBy.mockResolvedValue(value);
    // where가 마지막인 findOneBasic 지원
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
      resolve(Array.isArray(value) ? value : [value]);
    return chain;
  };

  /** update chain — returning()이 마지막 */
  const createUpdateChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    ['update', 'set', 'where', 'returning'].forEach(
      (m) => (chain[m] = jest.fn().mockReturnValue(chain))
    );
    chain.returning.mockResolvedValue(Array.isArray(value) ? value : [value]);
    return chain;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockEventEmitter = createMockEventEmitter();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    const selectChain = createSelectChain([MOCK_PLAN]);
    const updateChain = createUpdateChain(MOCK_PLAN);

    mockDb = {
      select: jest.fn().mockReturnValue(selectChain),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([MOCK_PLAN]) }),
      }),
      update: jest.fn().mockReturnValue(updateChain),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalibrationPlansService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<CalibrationPlansService>(CalibrationPlansService);
  });

  describe('create()', () => {
    it('같은 연도/사이트에 이미 계획서가 있으면 ConflictException을 던진다', async () => {
      // select().from().where().limit() → [MOCK_PLAN] (이미 존재)
      // 첫 번째 select 호출은 "already exists" 체크 → [MOCK_PLAN]

      await expect(
        service.create({
          year: 2024,
          siteId: 'suwon',
          teamId: 'team-uuid-1',
          createdBy: 'user-uuid-1',
        } as never)
      ).rejects.toThrow(ConflictException);
    });

    it('중복이 없으면 계획서를 생성한다', async () => {
      // 첫 번째 체크 → 빈 배열 (중복 없음)
      const emptySelectChain = createSelectChain([]);
      mockDb.select.mockReturnValueOnce(emptySelectChain);
      // transaction 내부에서 insert + 추가 쿼리들
      const insertChain = {
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_PLAN]),
        }),
      };
      mockDb.insert = jest.fn().mockReturnValue(insertChain);
      // findOne: select({plan, authorName, teamName}) 형태 반환
      const findOneRow = { plan: MOCK_PLAN, authorName: 'test-user', teamName: 'test-team' };
      // findOne 내부: 1) plan 조회 → [findOneRow], 2) items 조회 → []
      const planChain = createSelectChain([findOneRow]);
      const itemsChain = createSelectChain([]);
      mockDb.select.mockReturnValueOnce(planChain).mockReturnValueOnce(itemsChain);

      // transaction mock: 계획서 id 반환
      mockDb.transaction.mockResolvedValue({ ...MOCK_PLAN, id: 'new-plan-id' });

      const result = await service.create({
        year: 2024,
        siteId: 'suwon',
        teamId: 'team-uuid-1',
        createdBy: 'user-uuid-1',
      } as never);

      expect(result).toBeDefined();
    });
  });

  describe('submitForReview()', () => {
    it('draft 상태가 아닌 계획서를 검토 요청하면 BadRequestException을 던진다', async () => {
      const pendingPlan = { ...MOCK_PLAN, status: 'pending_review' };
      mockDb.select.mockReturnValue(createSelectChain([pendingPlan]));

      await expect(
        service.submitForReview('plan-uuid-1', { casVersion: 1, submittedBy: 'user-1' })
      ).rejects.toThrow(BadRequestException);
    });

    it('draft 상태 계획서 검토 요청 시 이벤트를 발행한다', async () => {
      // findOneBasic: draft 상태 반환
      const draftChain = createSelectChain([MOCK_PLAN]);
      // updatePlanWithCAS: returning → [updated plan]
      const updatedPlan = { ...MOCK_PLAN, status: 'pending_review', casVersion: 2 };
      const updateChain = createUpdateChain(updatedPlan);
      mockDb.update.mockReturnValue(updateChain);
      // findOne: select({plan, authorName, teamName}) 형태 반환 + items 조회
      const findOneRow = { plan: updatedPlan, authorName: 'test-user', teamName: 'test-team' };
      const planChain = createSelectChain([findOneRow]);
      const itemsChain = createSelectChain([]);
      // 순서: findOneBasic(select#1) → findOne plan(select#2) → findOne items(select#3)
      mockDb.select
        .mockReturnValueOnce(draftChain) // findOneBasic
        .mockReturnValueOnce(planChain) // findOne: plan 조회
        .mockReturnValueOnce(itemsChain); // findOne: items 조회
      mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

      await service.submitForReview('plan-uuid-1', { casVersion: 1, submittedBy: 'user-1' });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        expect.stringContaining('calibrationPlan'),
        expect.objectContaining({ planId: 'plan-uuid-1' })
      );
    });
  });

  describe('review()', () => {
    it('pending_review가 아닌 계획서 검토 시 BadRequestException을 던진다', async () => {
      const approvedPlan = { ...MOCK_PLAN, status: 'approved' };
      mockDb.select.mockReturnValue(createSelectChain([approvedPlan]));

      await expect(
        service.review('plan-uuid-1', {
          casVersion: 1,
          reviewedBy: 'reviewer-1',
        } as never)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve()', () => {
    it('pending_approval이 아닌 계획서 최종 승인 시 BadRequestException을 던진다', async () => {
      const draftPlan = { ...MOCK_PLAN, status: 'draft' };
      mockDb.select.mockReturnValue(createSelectChain([draftPlan]));

      await expect(
        service.approve('plan-uuid-1', {
          casVersion: 1,
          approvedBy: 'approver-1',
        } as never)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneBasic()', () => {
    it('존재하지 않는 계획서 ID에서 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      // findOneBasic은 private이므로 public API로 테스트 (submit → findOneBasic 호출)
      await expect(service.submit('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
