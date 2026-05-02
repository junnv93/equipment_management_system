import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EquipmentApprovalService } from '../services/equipment-approval.service';
import { EquipmentService } from '../equipment.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { DocumentService } from '../../../common/file-upload/document.service';
import { rejectRequestSchema } from '../dto/reject-request.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ErrorCode, UserRoleValues } from '@equipment-management/schemas';

const DRIZZLE_INSTANCE = 'DRIZZLE_INSTANCE';
const MIN = VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH;
const MAX = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;

/**
 * equipment-approval-reject defense-in-depth boundary matrix
 *
 * equipment-reject-zod-fail-close-hardening sprint (2026-05-02):
 * Layer 1 — rejectRequestSchema Zod: `.trim().min(MIN).max(MAX)`
 * Layer 2 — EquipmentApprovalService.rejectRequest: service fail-close `< MIN`
 */
describe('equipment-approval-reject — defense-in-depth boundary matrix', () => {
  // ============================================================================
  // Layer 1: Zod schema boundary (DTO)
  // ============================================================================

  describe('rejectRequestSchema.rejectionReason', () => {
    const baseValid = { version: 1 };

    it.each([
      ['empty string', ''],
      ['whitespace only (trim → 0)', '          '],
      [`${MIN - 1} chars (below MIN)`, 'a'.repeat(MIN - 1)],
    ])('rejects %s', (_label, rejectionReason) => {
      const result = rejectRequestSchema.safeParse({ ...baseValid, rejectionReason });
      expect(result.success).toBe(false);
    });

    it.each([
      [`${MIN} chars (boundary MIN)`, 'a'.repeat(MIN)],
      [`${MAX} chars (boundary MAX)`, 'a'.repeat(MAX)],
    ])('accepts %s', (_label, rejectionReason) => {
      const result = rejectRequestSchema.safeParse({ ...baseValid, rejectionReason });
      expect(result.success).toBe(true);
    });

    it(`rejects ${MAX + 1} chars (above MAX)`, () => {
      const result = rejectRequestSchema.safeParse({
        ...baseValid,
        rejectionReason: 'a'.repeat(MAX + 1),
      });
      expect(result.success).toBe(false);
    });

    it('trims surrounding whitespace before length check — reject', () => {
      // 앞뒤 공백 포함 MIN+1자 → trim 후 MIN-1자 → reject
      const result = rejectRequestSchema.safeParse({
        ...baseValid,
        rejectionReason: ` ${'a'.repeat(MIN - 1)} `,
      });
      expect(result.success).toBe(false);
    });

    it('trims surrounding whitespace before length check — accept (trim 후 정확히 MIN)', () => {
      // 앞뒤 공백 2자 포함 MIN+2자 → trim 후 MIN자 → accept (.trim().min(MIN) 순서 검증)
      const result = rejectRequestSchema.safeParse({
        ...baseValid,
        rejectionReason: ` ${'a'.repeat(MIN)} `,
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Layer 2: Service fail-close (rejectRequest 진입 전 차단)
  // ============================================================================

  describe('EquipmentApprovalService.rejectRequest — fail-close', () => {
    let service: EquipmentApprovalService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockDb: any;

    beforeEach(async () => {
      mockDb = {
        query: {
          users: { findFirst: jest.fn() },
          equipment: { findFirst: jest.fn() },
          equipmentRequests: { findFirst: jest.fn() },
        },
        transaction: jest
          .fn()
          .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EquipmentApprovalService,
          { provide: DRIZZLE_INSTANCE, useValue: mockDb },
          {
            provide: EquipmentService,
            useValue: { getEquipmentById: jest.fn() },
          },
          {
            provide: DocumentService,
            useValue: { getDocumentById: jest.fn() },
          },
          {
            provide: EventEmitter2,
            useValue: { emitAsync: jest.fn().mockResolvedValue(undefined) },
          },
          {
            provide: SimpleCacheService,
            useValue: {
              get: jest.fn(),
              set: jest.fn(),
              deleteByPattern: jest.fn().mockResolvedValue(undefined),
              deleteByPrefix: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<EquipmentApprovalService>(EquipmentApprovalService);
    });

    const TECHNICAL_MANAGER_ROLES = [UserRoleValues.TECHNICAL_MANAGER];

    it.each([
      ['empty string', ''],
      ['whitespace only (trim → 0)', '     '],
      [`${MIN - 1} chars (below MIN)`, 'a'.repeat(MIN - 1)],
    ])('throws EquipmentRequestRejectionReasonRequired for %s', async (_label, rejectionReason) => {
      await expect(
        service.rejectRequest('uuid', 'approver-id', rejectionReason, TECHNICAL_MANAGER_ROLES, 1)
      ).rejects.toMatchObject({
        response: {
          code: ErrorCode.EquipmentRequestRejectionReasonRequired,
        },
      });
    });

    it(`accepts ${MIN} chars (boundary MIN) and proceeds past fail-close`, async () => {
      // fail-close 통과 후 DB 조회로 진행됨 — findFirst mock이 null 반환하므로 NotFoundException 발생
      // 즉, BadRequestException(rejectionReason)이 아닌 것으로 fail-close 통과 확인
      const validReason = 'a'.repeat(MIN);
      await expect(
        service.rejectRequest('uuid', 'approver-id', validReason, TECHNICAL_MANAGER_ROLES, 1)
      ).rejects.not.toMatchObject({
        response: {
          code: ErrorCode.EquipmentRequestRejectionReasonRequired,
        },
      });
    });
  });
});
