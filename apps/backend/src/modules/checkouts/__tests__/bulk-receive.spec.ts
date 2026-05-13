import {
  VM,
  CONDITION_STATUS_VALUES,
  ACCESSORIES_STATUS_VALUES,
} from '@equipment-management/schemas';
import {
  VALIDATION_RULES,
  Permission,
  derivePermissionsFromRoles,
} from '@equipment-management/shared-constants';
import { bulkReceiveSchema } from '../dto/bulk-receive.dto';
import { CheckoutsController } from '../checkouts.controller';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutsService } from '../checkouts.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { createMockCacheInvalidationHelper } from '../../../common/testing/mock-providers';
import { EquipmentService } from '../../equipment/equipment.service';
import { TeamsService } from '../../teams/teams.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedRequest } from '../../../types/auth';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const BULK_MAX = VALIDATION_RULES.BULK_OPERATION_MAX_COUNT;

const VALID_BASE = {
  ids: [VALID_UUID],
  appearanceStatus: CONDITION_STATUS_VALUES[0], // 'normal'
  operationStatus: CONDITION_STATUS_VALUES[0],
};

describe('bulkReceiveSchema', () => {
  describe('ids 검증', () => {
    it('1건 → 통과', () => {
      const result = bulkReceiveSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });

    it('빈 배열 → 실패 (VM.array.minCases)', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.minCases(1));
      }
    });

    it(`정확히 ${BULK_MAX}건 → 통과`, () => {
      const ids = Array.from({ length: BULK_MAX }, () => VALID_UUID);
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids });
      expect(result.success).toBe(true);
    });

    it(`${BULK_MAX + 1}건 → 실패 (VM.array.maxCases)`, () => {
      const ids = Array.from({ length: BULK_MAX + 1 }, () => VALID_UUID);
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.maxCases(BULK_MAX));
      }
    });

    it('UUID 형식이 아닌 값 → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, ids: ['not-a-uuid'] });
      expect(result.success).toBe(false);
    });
  });

  describe('appearanceStatus / operationStatus 검증', () => {
    it('유효한 CONDITION_STATUS_VALUES → 통과', () => {
      for (const status of CONDITION_STATUS_VALUES) {
        const result = bulkReceiveSchema.safeParse({
          ...VALID_BASE,
          appearanceStatus: status,
          operationStatus: status,
        });
        expect(result.success).toBe(true);
      }
    });

    it('잘못된 appearanceStatus → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, appearanceStatus: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('잘못된 operationStatus → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, operationStatus: 'bad_val' });
      expect(result.success).toBe(false);
    });

    it('appearanceStatus 누락 → 실패', () => {
      const { appearanceStatus: _, ...withoutAppearance } = VALID_BASE;
      const result = bulkReceiveSchema.safeParse(withoutAppearance);
      expect(result.success).toBe(false);
    });

    it('operationStatus 누락 → 실패', () => {
      const { operationStatus: _, ...withoutOp } = VALID_BASE;
      const result = bulkReceiveSchema.safeParse(withoutOp);
      expect(result.success).toBe(false);
    });
  });

  describe('accessoriesStatus 검증 (optional)', () => {
    it('미전달 → 통과', () => {
      const result = bulkReceiveSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.accessoriesStatus).toBeUndefined();
    });

    it('유효한 ACCESSORIES_STATUS_VALUES → 통과', () => {
      for (const status of ACCESSORIES_STATUS_VALUES) {
        const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, accessoriesStatus: status });
        expect(result.success).toBe(true);
      }
    });

    it('잘못된 accessoriesStatus → 실패', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, accessoriesStatus: 'wrong' });
      expect(result.success).toBe(false);
    });
  });

  describe('version / userId 필드 부재 확인 (Rule 2 & Rule 11)', () => {
    it('schema에 version 필드 없음 — 전달해도 무시됨', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, version: 5 });
      expect(result.success).toBe(true);
      if (result.success) expect((result.data as Record<string, unknown>).version).toBeUndefined();
    });

    it('schema에 userId/checkerId 필드 없음 — 전달해도 무시됨', () => {
      const result = bulkReceiveSchema.safeParse({ ...VALID_BASE, userId: 'some-user-id' });
      expect(result.success).toBe(true);
      if (result.success) expect((result.data as Record<string, unknown>).userId).toBeUndefined();
    });
  });

  describe('abnormalDetails / notes 검증 (optional)', () => {
    it('미전달 → 통과', () => {
      const result = bulkReceiveSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });

    it('abnormalDetails 최대 길이 초과 → 실패', () => {
      const result = bulkReceiveSchema.safeParse({
        ...VALID_BASE,
        abnormalDetails: 'a'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      });
      expect(result.success).toBe(false);
    });

    it('notes 최대 길이 초과 → 실패', () => {
      const result = bulkReceiveSchema.safeParse({
        ...VALID_BASE,
        notes: 'n'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('bulkReceive — Permission gate (M-14)', () => {
  it('bulkReceive 컨트롤러 메서드에 Permission.COMPLETE_CHECKOUT 데코레이터 적용됨', () => {
    const permissions: Permission[] = Reflect.getMetadata(
      PERMISSIONS_KEY,
      CheckoutsController.prototype.bulkReceive
    ) as Permission[];
    expect(permissions).toContain(Permission.COMPLETE_CHECKOUT);
  });

  it('COMPLETE_CHECKOUT 미보유 role(quality_manager) → PermissionsGuard.canActivate ForbiddenException (HTTP 403 원인)', () => {
    const reflector = new Reflector();
    const configService = {
      get: jest.fn().mockReturnValue('DENY'),
    } as unknown as ConfigService;

    const guard = new PermissionsGuard(reflector, configService);

    // quality_manager는 COMPLETE_CHECKOUT 권한 없음 (role-permissions.ts)
    const mockContext = {
      getHandler: () => CheckoutsController.prototype.bulkReceive,
      getClass: () => CheckoutsController,
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url: '/api/checkouts/bulk-receive',
          user: {
            userId: 'quality-user-uuid',
            roles: ['quality_manager'],
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});

describe('bulkReceive — partial-failure (M-15)', () => {
  let service: CheckoutsService;
  let mockCacheService: Record<string, jest.Mock>;
  let mockDrizzle: Record<string, jest.Mock>;

  const UUID_SUCCESS = '550e8400-e29b-41d4-a716-111111111111';
  const UUID_FAIL_FSM = '550e8400-e29b-41d4-a716-222222222222';
  const CHECKER_ID = '550e8400-e29b-41d4-a716-999999999999';

  const mockReq = {
    user: {
      userId: CHECKER_ID,
      roles: ['technical_manager'],
      permissions: derivePermissionsFromRoles(['technical_manager']),
      site: 'suwon',
      teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    },
  } as unknown as AuthenticatedRequest;

  const baseCondition = {
    appearanceStatus: 'normal' as const,
    operationStatus: 'normal' as const,
  };

  const baseLenderCheckedCheckout = {
    id: UUID_SUCCESS,
    status: 'lender_checked',
    purpose: 'rental',
    version: 1,
    requesterId: 'requester-uuid',
    lenderTeamId: 'lender-team-uuid',
  };

  beforeEach(async () => {
    const chain: Record<string, jest.Mock> = {};
    const chainMethods = [
      'select',
      'from',
      'where',
      'limit',
      'offset',
      'orderBy',
      'insert',
      'values',
      'returning',
      'update',
      'set',
      'delete',
      'execute',
      'leftJoin',
      'innerJoin',
      'groupBy',
      'having',
    ];
    for (const m of chainMethods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
      resolve([])
    );

    mockDrizzle = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      delete: jest.fn().mockReturnValue(chain),
      transaction: jest.fn().mockImplementation((cb: (db: unknown) => unknown) => cb(mockDrizzle)),
      from: chain.from,
      where: chain.where,
      limit: chain.limit,
      offset: chain.offset,
      orderBy: chain.orderBy,
      values: chain.values,
      returning: chain.returning,
      set: chain.set,
      execute: chain.execute,
      leftJoin: chain.leftJoin,
      innerJoin: chain.innerJoin,
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPattern: jest.fn(),
      deleteByPrefix: jest.fn(),
      getOrSet: jest
        .fn()
        .mockImplementation((_key: string, factory: () => Promise<unknown>) => factory()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDrizzle },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: CacheInvalidationHelper, useValue: createMockCacheInvalidationHelper() },
        {
          provide: EquipmentService,
          useValue: {
            findOne: jest.fn(),
            findByIds: jest.fn().mockResolvedValue(new Map()),
            updateStatus: jest.fn(),
            updateStatusBatch: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: TeamsService, useValue: { findOne: jest.fn() } },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn(), emitAsync: jest.fn().mockResolvedValue([]), on: jest.fn() },
        },
        {
          provide: AuditService,
          useValue: { create: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<CheckoutsService>(CheckoutsService);
  });

  it('status !== lender_checked 항목 → 해당 항목 failed[]에 등록, 정상 항목은 received[]', async () => {
    // findCheckoutEntity는 cacheService.getOrSet → DB 경유
    // submitConditionCheck를 spy하여 UUID_SUCCESS 성공, UUID_FAIL_FSM BadRequest
    const submitSpy = jest
      .spyOn(service as unknown as { submitConditionCheck: jest.Mock }, 'submitConditionCheck')
      .mockResolvedValueOnce({ id: UUID_SUCCESS } as never)
      .mockRejectedValueOnce(
        new BadRequestException({
          code: 'INVALID_FSM_TRANSITION',
          message: 'Cannot perform borrower_receive from checked_out',
        })
      );

    // findCheckoutEntity DB mock: UUID_SUCCESS → lender_checked, UUID_FAIL_FSM → checked_out
    mockDrizzle.limit
      .mockResolvedValueOnce([{ ...baseLenderCheckedCheckout, id: UUID_SUCCESS, version: 1 }])
      .mockResolvedValueOnce([
        { ...baseLenderCheckedCheckout, id: UUID_FAIL_FSM, status: 'checked_out', version: 2 },
      ]);

    const result = await service.bulkReceive(
      [UUID_SUCCESS, UUID_FAIL_FSM],
      baseCondition,
      CHECKER_ID,
      mockReq
    );

    expect(submitSpy).toHaveBeenCalledTimes(2);
    expect(result.received).toHaveLength(1);
    expect(result.received[0]).toMatchObject({ id: UUID_SUCCESS });
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ id: UUID_FAIL_FSM });
    expect(result.failed[0].error).toBeTruthy();
  });

  it('cross-team checkout → ForbiddenException이 failed[]에 등록, received[]는 비어있음', async () => {
    const submitSpy = jest
      .spyOn(service as unknown as { submitConditionCheck: jest.Mock }, 'submitConditionCheck')
      .mockRejectedValueOnce(
        new ForbiddenException({
          code: 'CROSS_TEAM_FORBIDDEN',
          message: 'Cross-team access denied',
        })
      );

    mockDrizzle.limit.mockResolvedValueOnce([
      { ...baseLenderCheckedCheckout, id: UUID_SUCCESS, version: 1 },
    ]);

    const result = await service.bulkReceive([UUID_SUCCESS], baseCondition, CHECKER_ID, mockReq);

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(result.received).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ id: UUID_SUCCESS });
    expect(result.failed[0].error).toBeTruthy();
  });
});
