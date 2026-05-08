import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DisposalService } from '../services/disposal.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import {
  requestDisposalSchema,
  reviewDisposalSchema,
  approveDisposalSchema,
} from '../dto/disposal.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';

const DRIZZLE_INSTANCE = 'DRIZZLE_INSTANCE';
const MIN = VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH;
const MAX = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;

/**
 * DisposalService 유닛 테스트 — defense-in-depth boundary matrix
 *
 * 검증 layer:
 * 1. Zod schema (approveDisposalSchema discriminatedUnion) — reject 경로 comment min/max 강제
 * 2. Service layer — business logic (transaction, DB 업데이트, audit log)
 *
 * approveDisposal reject 분기의 comment min 검증은 Zod discriminatedUnion으로 이관
 * (2026-05-08 reject-modal-ssot-closure). Service는 이미 검증된 데이터 수신.
 */
describe('DisposalService — defense-in-depth boundary matrix', () => {
  let service: DisposalService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDb: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCacheService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEventEmitter: any;
  let updateWithVersionSpy: jest.SpyInstance;

  beforeEach(async () => {
    mockDb = {
      query: {
        disposalRequests: { findFirst: jest.fn() },
        equipment: { findFirst: jest.fn() },
        users: { findFirst: jest.fn() },
      },
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      deleteByPattern: jest.fn().mockResolvedValue(undefined),
      deleteByPrefix: jest.fn(),
    };
    mockEventEmitter = { emitAsync: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisposalService,
        { provide: DRIZZLE_INSTANCE, useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        {
          provide: CacheInvalidationHelper,
          useValue: { invalidateAfterDisposal: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<DisposalService>(DisposalService);
    // VersionedBaseService.updateWithVersion은 트랜잭션 내부에서 호출됨
    // — 본 spec은 fail-close 경로(throw)가 transaction 진입 전 차단되는지가 핵심이라
    //   transaction 진입 후 호출은 noop으로 mock
    updateWithVersionSpy = jest
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn(service as any, 'updateWithVersion')
      .mockResolvedValue(undefined);
  });

  // ============================================================================
  // Layer 1: Zod schema boundary (DTO)
  // ============================================================================

  describe('Zod schema boundary — requestDisposalSchema.reasonDetail', () => {
    const baseValid = { reason: 'obsolete' as const };

    it.each([
      ['empty string', ''],
      ['whitespace only (10 chars trim → 0)', '          '],
      [`${MIN - 1} chars (below min)`, 'a'.repeat(MIN - 1)],
    ])('rejects %s', (_label, reasonDetail) => {
      const result = requestDisposalSchema.safeParse({ ...baseValid, reasonDetail });
      expect(result.success).toBe(false);
    });

    it.each([
      [`${MIN} chars (boundary min)`, 'a'.repeat(MIN)],
      [`${MAX} chars (boundary max)`, 'a'.repeat(MAX)],
    ])('accepts %s', (_label, reasonDetail) => {
      const result = requestDisposalSchema.safeParse({ ...baseValid, reasonDetail });
      expect(result.success).toBe(true);
    });

    it(`rejects ${MAX + 1} chars (above max)`, () => {
      const result = requestDisposalSchema.safeParse({
        ...baseValid,
        reasonDetail: 'a'.repeat(MAX + 1),
      });
      expect(result.success).toBe(false);
    });

    it('trims surrounding whitespace before length check', () => {
      // 11자(앞뒤 공백 1자 포함 → trim 후 9자) → reject
      const result = requestDisposalSchema.safeParse({
        ...baseValid,
        reasonDetail: ` ${'a'.repeat(MIN - 1)} `,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Zod schema boundary — reviewDisposalSchema.opinion', () => {
    const baseValid = { version: 1, decision: 'approve' as const };

    it.each([
      ['empty', ''],
      [`whitespace only ${MIN} chars`, ' '.repeat(MIN)],
      [`${MIN - 1} chars`, 'a'.repeat(MIN - 1)],
      [`${MAX + 1} chars`, 'a'.repeat(MAX + 1)],
    ])('rejects opinion %s', (_label, opinion) => {
      const result = reviewDisposalSchema.safeParse({ ...baseValid, opinion });
      expect(result.success).toBe(false);
    });

    it.each([
      [`${MIN} chars`, 'a'.repeat(MIN)],
      [`${MAX} chars`, 'a'.repeat(MAX)],
    ])('accepts opinion %s', (_label, opinion) => {
      const result = reviewDisposalSchema.safeParse({ ...baseValid, opinion });
      expect(result.success).toBe(true);
    });
  });

  describe('Zod schema boundary — approveDisposalSchema.comment', () => {
    const baseValid = { version: 1, decision: 'approve' as const };

    it('accepts undefined comment (optional)', () => {
      const result = approveDisposalSchema.safeParse(baseValid);
      expect(result.success).toBe(true);
    });

    it('accepts empty string comment (Zod max only — service layer enforces reject min)', () => {
      const result = approveDisposalSchema.safeParse({ ...baseValid, comment: '' });
      expect(result.success).toBe(true);
    });

    it(`accepts ${MAX} chars comment`, () => {
      const result = approveDisposalSchema.safeParse({ ...baseValid, comment: 'a'.repeat(MAX) });
      expect(result.success).toBe(true);
    });

    it(`rejects ${MAX + 1} chars comment`, () => {
      const result = approveDisposalSchema.safeParse({
        ...baseValid,
        comment: 'a'.repeat(MAX + 1),
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Layer 2: Service layer fail-close (approveDisposal reject 분기)
  // ============================================================================

  describe('reviewDisposal reject branch — service layer fail-close', () => {
    const equipmentId = 'eq-1234-5678-uuid';
    const reviewedBy = 'reviewer-uuid';

    beforeEach(() => {
      mockDb.query.disposalRequests.findFirst.mockResolvedValue({
        id: 'disposal-req-uuid',
        equipmentId,
        reviewStatus: 'pending',
        version: 1,
        requestedBy: 'requester-uuid',
      });
      mockDb.query.equipment.findFirst.mockResolvedValue({
        id: equipmentId,
        name: 'eq',
        managementNumber: 'M-1',
        teamId: 'team-1',
        site: 'suwon',
      });
      mockDb.query.users.findFirst.mockResolvedValue({
        id: reviewedBy,
        role: 'technical_manager',
        teamId: 'team-1',
      });
    });

    it.each([
      ['undefined opinion', undefined],
      ['empty string', ''],
      [`whitespace only ${MIN} chars`, ' '.repeat(MIN)],
      [`${MIN - 1} chars`, 'a'.repeat(MIN - 1)],
      [`whitespace + ${MIN - 1} chars (trim 후 below min)`, ` ${'a'.repeat(MIN - 1)} `],
    ])(
      'fail-close %s — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED',
      async (_label, opinion) => {
        const dto = {
          version: 1,
          decision: 'reject' as const,
          opinion,
        };

        try {
          await service.reviewDisposal(equipmentId, dto as never, reviewedBy);
          fail('expected BadRequestException');
        } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect(e).toMatchObject({
            response: { code: ErrorCode.DisposalRejectCommentRequired },
          });
        }

        expect(mockDb.query.disposalRequests.findFirst).not.toHaveBeenCalled();
        expect(mockDb.transaction).not.toHaveBeenCalled();
        expect(updateWithVersionSpy).not.toHaveBeenCalled();
      }
    );

    it('reject 통과 — rejectionReason 및 이벤트 reason에 trim된 opinion 사용', async () => {
      const opinion = ` ${'a'.repeat(MIN)} `;
      await service.reviewDisposal(
        equipmentId,
        { version: 1, decision: 'reject', opinion },
        reviewedBy
      );

      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      const callArgs = updateWithVersionSpy.mock.calls[0];
      const updatePayload = callArgs[3];
      expect(updatePayload.rejectionReason).toBe(opinion.trim());
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ reason: opinion.trim(), rejectionStep: 'review' })
      );
    });

    it('approve 통과 — reviewOpinion에 trim된 opinion 사용', async () => {
      const opinion = ` ${'a'.repeat(MIN)} `;
      await service.reviewDisposal(
        equipmentId,
        { version: 1, decision: 'approve', opinion },
        reviewedBy
      );

      const callArgs = updateWithVersionSpy.mock.calls[0];
      const updatePayload = callArgs[3];
      expect(updatePayload.reviewOpinion).toBe(opinion.trim());
    });
  });

  describe('approveDisposalSchema discriminatedUnion — Zod reject 경로 comment 검증', () => {
    it.each([
      ['undefined (missing)', undefined],
      ['empty string', ''],
      [`whitespace only (${MIN}자, trim 후 0)`, ' '.repeat(MIN)],
      [`${MIN - 1}자 (boundary below)`, 'a'.repeat(MIN - 1)],
      [`공백 + ${MIN - 1}자 (trim 후 below min)`, ` ${'a'.repeat(MIN - 1)} `],
    ])(
      'reject 경로 — %s → Zod FAIL (decision=reject이면 comment min(%d) 필수)',
      (_label, comment) => {
        const result = approveDisposalSchema.safeParse({ version: 1, decision: 'reject', comment });
        expect(result.success).toBe(false);
      }
    );

    it.each([
      [`${MIN}자 (boundary)`, 'a'.repeat(MIN)],
      [`${MAX}자 (boundary)`, 'a'.repeat(MAX)],
      [`공백 + ${MIN}자 (trim 후 ${MIN})`, ` ${'a'.repeat(MIN)} `],
    ])('reject 경로 — %s → Zod PASS', (_label, comment) => {
      const result = approveDisposalSchema.safeParse({ version: 1, decision: 'reject', comment });
      expect(result.success).toBe(true);
    });

    it('approve 경로 — comment undefined → Zod PASS (optional)', () => {
      const result = approveDisposalSchema.safeParse({ version: 1, decision: 'approve' });
      expect(result.success).toBe(true);
    });

    it('approve 경로 — comment 1자(below min) → Zod PASS (approve는 min 미적용)', () => {
      const result = approveDisposalSchema.safeParse({
        version: 1,
        decision: 'approve',
        comment: 'x',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('approveDisposal reject branch — service transaction', () => {
    const equipmentId = 'eq-1234-5678-uuid';
    const approvedBy = 'user-uuid';

    const reviewedRequest = {
      id: 'disposal-req-uuid',
      equipmentId,
      reviewStatus: 'reviewed',
      version: 1,
    };

    beforeEach(() => {
      mockDb.query.disposalRequests.findFirst.mockResolvedValue(reviewedRequest);
      mockDb.query.equipment.findFirst.mockResolvedValue({
        id: equipmentId,
        name: 'eq',
        managementNumber: 'M-1',
        teamId: 't1',
        site: 'suwon',
      });
      mockDb.query.users.findFirst.mockResolvedValue({ id: approvedBy, role: 'lab_manager' });
    });

    it.each([
      [`${MIN}자 (boundary)`, 'a'.repeat(MIN)],
      [`${MAX}자 (boundary)`, 'a'.repeat(MAX)],
      [`공백 + ${MIN}자 (trim 후 ${MIN})`, ` ${'a'.repeat(MIN)} `],
    ])(
      'reject 통과 %s — transaction 진입 + audit log에 trim된 comment 사용',
      async (_label, comment) => {
        const dto = { version: 1, decision: 'reject' as const, comment };
        await service.approveDisposal(equipmentId, dto, approvedBy);

        expect(mockDb.transaction).toHaveBeenCalledTimes(1);
        const callArgs = updateWithVersionSpy.mock.calls[0];
        const updatePayload = callArgs[3];
        expect(updatePayload.rejectionReason).toBe(comment.trim());
        // fallback 메시지 회귀 차단
        expect(updatePayload.rejectionReason).not.toBe('승인 단계에서 반려');
      }
    );
  });

  describe('approveDisposal approve branch — comment optional 정규화', () => {
    const equipmentId = 'eq-1234-5678-uuid';
    const approvedBy = 'user-uuid';

    beforeEach(() => {
      mockDb.query.disposalRequests.findFirst.mockResolvedValue({
        id: 'disposal-req-uuid',
        equipmentId,
        reviewStatus: 'reviewed',
        version: 1,
      });
      mockDb.query.equipment.findFirst.mockResolvedValue({
        id: equipmentId,
        name: 'eq',
        managementNumber: 'M-1',
        teamId: 't1',
        site: 'suwon',
      });
      mockDb.query.users.findFirst.mockResolvedValue({ id: approvedBy, role: 'lab_manager' });
    });

    it.each([
      ['undefined', undefined, null],
      ['empty string', '', null],
      ['whitespace only', '     ', null],
      [`${MIN} chars (정상)`, 'a'.repeat(MIN), 'a'.repeat(MIN)],
      [`${MIN} chars + trim`, ` ${'a'.repeat(MIN)} `, 'a'.repeat(MIN)],
    ])(
      'approve 통과 %s — approvalComment 정규화 결과 검증',
      async (_label, comment, expectedStored) => {
        const dto = { version: 1, decision: 'approve' as const, comment };
        await service.approveDisposal(equipmentId, dto, approvedBy);

        expect(mockDb.transaction).toHaveBeenCalled();
        const callArgs = updateWithVersionSpy.mock.calls[0];
        const updatePayload = callArgs[3];
        expect(updatePayload.approvalComment).toBe(expectedStored);
      }
    );
  });
});
