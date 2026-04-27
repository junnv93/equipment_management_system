import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutsService } from '../checkouts.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { TeamsService } from '../../teams/teams.service';
import { EquipmentImportsService } from '../../equipment-imports/equipment-imports.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedRequest } from '../../../types/auth';
import { derivePermissionsFromRoles } from '@equipment-management/shared-constants';

// 테스트용 mock req — FSM assertFsmAction이 req.user.permissions를 직접 참조하므로
// roles에서 파생한 permissions 배열을 반드시 포함해야 함
const mockReq = {
  user: {
    userId: '550e8400-e29b-41d4-a716-446655440004',
    roles: ['technical_manager'],
    permissions: derivePermissionsFromRoles(['technical_manager']),
    site: 'suwon',
    teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
  },
} as unknown as AuthenticatedRequest;

describe('CheckoutsService', () => {
  let service: CheckoutsService;
  let mockDrizzle: Record<string, jest.Mock>;
  let mockChain: Record<string, unknown>; // getCheckoutItemsWithFirstEquipment 등 thenable 직접 override용
  let mockCacheService: Record<string, jest.Mock>;
  let mockEquipmentService: Record<string, jest.Mock>;
  let mockTeamsService: Record<string, jest.Mock>;
  let mockImportsService: Record<string, jest.Mock>;
  let mockEventEmitter: { emit: jest.Mock; emitAsync: jest.Mock; on: jest.Mock };

  beforeEach(async () => {
    // 매 테스트마다 새로운 mock 객체 생성
    // chain: 체이닝 + thenable (await 시 빈 배열 반환) — DI value와 분리
    const chain: Record<string, jest.Mock> = {};
    mockChain = chain; // .then 직접 접근용 (getCheckoutItemsWithFirstEquipment 등)
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
    ];
    for (const m of chainMethods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    // chain은 thenable: await 시 빈 배열 반환 (where/orderBy가 마지막인 쿼리 지원)
    (chain as Record<string, unknown>).then = jest.fn((resolve: (v: unknown[]) => void) =>
      resolve([])
    );

    // mockDrizzle: NestJS DI에 주입되는 객체 (thenable이 아님!)
    // select/insert/update/delete/transaction 진입점만 제공
    mockDrizzle = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      delete: jest.fn().mockReturnValue(chain),
      transaction: jest.fn().mockImplementation((cb) => cb(mockDrizzle)),
      // chain의 terminal 메서드도 mockDrizzle에 노출 (테스트에서 mockResolvedValueOnce 사용)
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

    mockEquipmentService = {
      findOne: jest.fn(),
      findByIds: jest.fn().mockResolvedValue(new Map()),
      updateStatus: jest.fn(),
      updateStatusBatch: jest.fn().mockResolvedValue([]),
    };

    mockTeamsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutsService,
        {
          provide: 'DRIZZLE_INSTANCE',
          useValue: mockDrizzle,
        },
        {
          provide: SimpleCacheService,
          useValue: mockCacheService,
        },
        {
          provide: EquipmentService,
          useValue: mockEquipmentService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
        {
          provide: EquipmentImportsService,
          useValue: (mockImportsService = {
            findOne: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            updateStatus: jest.fn(),
            onReturnCompleted: jest.fn().mockResolvedValue(undefined),
            onReturnCanceled: jest.fn().mockResolvedValue(undefined),
          }),
        },
        {
          provide: EventEmitter2,
          useValue: (mockEventEmitter = {
            emit: jest.fn(),
            emitAsync: jest.fn().mockResolvedValue([]),
            on: jest.fn(),
          }),
        },
        {
          provide: AuditService,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutsService>(CheckoutsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    const mockCheckout = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'pending',
      purpose: 'calibration',
      checkoutDate: new Date(),
      expectedReturnDate: new Date(),
      createdAt: new Date(),
    };

    it('should return a checkout by id', async () => {
      // Mock cache miss, database returns data
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockDrizzle.limit.mockResolvedValue([mockCheckout]);

      const result = await service.findOne(mockCheckout.id, []);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCheckout.id);
      expect(result.status).toBe('pending');
    });

    it('should throw NotFoundException when checkout not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockDrizzle.limit.mockResolvedValue([]);

      await expect(service.findOne(mockCheckout.id, [])).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid UUID format', async () => {
      // findOne은 UUID 유효성 검증 없이 바로 DB 조회 → 결과가 없으면 NotFoundException
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValue([]);

      await expect(service.findOne('invalid-uuid', [])).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const equipmentId1 = '550e8400-e29b-41d4-a716-446655440001';
    const requesterId = '550e8400-e29b-41d4-a716-446655440002';
    const userTeamId = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1'; // 수원 RF팀 UUID
    const mockCreateDto = {
      equipmentIds: [equipmentId1],
      purpose: 'calibration' as const,
      destination: 'HCT 교정기관',
      reason: '연간 정기 교정을 위한 반출',
      expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: '연간 교정',
    };

    const mockEquipment = {
      id: equipmentId1,
      name: 'Test Equipment',
      status: 'available',
      site: 'suwon',
      teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', // 수원 RF팀 UUID
    };

    it('should create a new checkout request', async () => {
      const mockCreatedCheckout = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        equipmentId: equipmentId1,
        purpose: mockCreateDto.purpose,
        destination: mockCreateDto.destination,
        reason: mockCreateDto.reason,
        requesterId: requesterId,
        status: 'pending',
        createdAt: new Date(),
      };

      const equipMap = new Map([[equipmentId1, mockEquipment]]);
      mockEquipmentService.findByIds.mockResolvedValue(equipMap);
      mockTeamsService.findOne.mockResolvedValue({ id: userTeamId, classification: 'general_rf' });
      mockDrizzle.returning.mockResolvedValue([mockCreatedCheckout]);
      mockCacheService.deleteByPattern.mockResolvedValue(undefined);

      const result = await service.create(mockCreateDto, requesterId, userTeamId);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
      expect(mockEquipmentService.findByIds).toHaveBeenCalledWith([equipmentId1], true);
    });

    it('should throw BadRequestException for invalid equipment UUID', async () => {
      const invalidDto = { ...mockCreateDto, equipmentIds: ['invalid-uuid'] };

      await expect(service.create(invalidDto, requesterId, userTeamId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when equipment not found', async () => {
      // findByIds가 BadRequestException을 던지면 잡아서 CHECKOUT_EQUIPMENT_NOT_FOUND로 변환
      mockEquipmentService.findByIds.mockRejectedValue(
        new BadRequestException({
          code: 'EQUIPMENT_NOT_FOUND',
          message: '장비를 찾을 수 없습니다.',
        })
      );

      await expect(service.create(mockCreateDto, requesterId, userTeamId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('approve', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const approverId = '550e8400-e29b-41d4-a716-446655440004';
    const mockApproveDto = {
      version: 1,
      approverId: approverId,
      comment: '승인합니다.',
    };
    const approverTeamId = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1'; // 수원 RF팀 UUID

    const mockPendingCheckout = {
      id: checkoutId,
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'pending',
      purpose: 'calibration',
    };

    it('should approve a pending checkout', async () => {
      const mockApprovedCheckout = {
        ...mockPendingCheckout,
        status: 'approved',
        version: 2,
        approverId: approverId,
        approvedAt: new Date(),
      };

      const mockEquipment = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Equipment',
        managementNumber: 'SUW-E0001',
        site: 'suwon',
        teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
      };

      // findOne: getOrSet가 factory 건너뛰고 직접 반환 (내부 DB 체인 mock 불필요)
      mockCacheService.getOrSet.mockResolvedValue({ ...mockPendingCheckout, version: 1 });
      // select checkoutItems: await db.select().from().where() → chain을 await → chain.then 호출
      // mockDrizzle.where.then이 아닌 mockChain.then을 override해야 실제 동작
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([{ equipmentId: mockEquipment.id }])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      // equipmentService.findByIds
      mockEquipmentService.findByIds.mockResolvedValue(
        new Map([[mockEquipment.id, mockEquipment]])
      );
      // teamsService.findOne (approver team classification)
      mockTeamsService.findOne.mockResolvedValue({
        id: approverTeamId,
        classification: 'general_rf',
      });
      // updateWithVersion (CAS) — returning
      mockDrizzle.returning.mockResolvedValueOnce([mockApprovedCheckout]);
      // getAffectedTeamIds — requester user 조회
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' }]);

      const result = await service.approve(checkoutId, mockApproveDto, mockReq);

      mockChain.then = originalThen;

      expect(result).toBeDefined();
      expect(result.status).toBe('approved');
    });

    it('should throw BadRequestException when checkout is not pending', async () => {
      const nonPendingCheckout = { ...mockPendingCheckout, status: 'approved' };
      const eqId = '550e8400-e29b-41d4-a716-446655440001';

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([nonPendingCheckout]);
      // scope-먼저 패턴: items + equipment 로드 후 scope 통과, assertFsmAction에서 INVALID_TRANSITION
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([{ equipmentId: eqId }]))
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      mockEquipmentService.findByIds.mockResolvedValueOnce(
        new Map([[eqId, { id: eqId, site: 'suwon', teamId: null }]])
      );

      await expect(service.approve(checkoutId, mockApproveDto, mockReq)).rejects.toThrow(
        BadRequestException
      );

      mockChain.then = originalThen;
    });

    it('should throw BadRequestException (NO_EQUIPMENT) when checkout has no items', async () => {
      // items 쿼리 기본 반환값: [] (chain.then default)
      mockCacheService.getOrSet.mockResolvedValue({ ...mockPendingCheckout, version: 1 });
      mockEquipmentService.findByIds.mockResolvedValue(new Map());

      await expect(service.approve(checkoutId, mockApproveDto, mockReq)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException (LENDER_TEAM_ONLY) when team-less user approves RENTAL checkout', async () => {
      const rentalCheckout = {
        ...mockPendingCheckout,
        purpose: 'rental',
        lenderTeamId: 'aabb1234-82b8-488e-9ea5-4fe71bb086e1',
        lenderSiteId: 'suwon',
        version: 1,
      };
      const mockRentalEquipment = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Equipment',
        managementNumber: 'SUW-E0001',
        site: 'suwon',
        teamId: 'aabb1234-82b8-488e-9ea5-4fe71bb086e1',
      };
      // 팀 미소속 사용자: teamId undefined → enforceScopeFromData site fallback 통과 후 LENDER_TEAM_ONLY 도달
      const mockReqNoTeam = {
        user: {
          userId: mockReq.user.userId,
          roles: ['technical_manager'],
          permissions: mockReq.user.permissions,
          site: 'suwon',
          teamId: undefined,
        },
      } as unknown as AuthenticatedRequest;

      mockCacheService.getOrSet.mockResolvedValue(rentalCheckout);
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([{ equipmentId: mockRentalEquipment.id }])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      mockEquipmentService.findByIds.mockResolvedValue(
        new Map([[mockRentalEquipment.id, mockRentalEquipment]])
      );

      await expect(service.approve(checkoutId, mockApproveDto, mockReqNoTeam)).rejects.toThrow(
        ForbiddenException
      );

      mockChain.then = originalThen;
    });
  });

  describe('reject', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const approverId = '550e8400-e29b-41d4-a716-446655440004';
    const mockRejectDto = {
      version: 1,
      reason: '장비 상태가 좋지 않아 반출이 불가합니다.',
      approverId: approverId,
    };

    const mockPendingCheckout = {
      id: checkoutId,
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'pending',
      purpose: 'calibration',
    };

    it('should reject a pending checkout with reason', async () => {
      const mockRejectedCheckout = {
        ...mockPendingCheckout,
        status: 'rejected',
        approverId: approverId,
        rejectionReason: mockRejectDto.reason,
      };

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([mockPendingCheckout]); // findOne
      // enforceScopeFromCheckout: 장비 사이트/팀 조회
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'suwon', teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' },
      ]);
      mockDrizzle.returning.mockResolvedValue([mockRejectedCheckout]);
      // getAffectedTeamIds: select().from().where().limit(1)
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' }]);
      mockCacheService.deleteByPattern.mockResolvedValue(undefined);

      const result = await service.reject(checkoutId, mockRejectDto, mockReq);

      expect(result).toBeDefined();
      expect(result.status).toBe('rejected');
    });

    it('should throw BadRequestException when reason is empty', async () => {
      const emptyReasonDto = { version: 1, reason: '', approverId: approverId };

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([mockPendingCheckout]); // findOne
      // enforceScopeFromCheckout: 장비 사이트/팀 조회
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'suwon', teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' },
      ]);

      await expect(service.reject(checkoutId, emptyReasonDto, mockReq)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('returnCheckout', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const returnerId = '550e8400-e29b-41d4-a716-446655440002';
    const mockReturnDto = {
      version: 1,
      calibrationChecked: true,
      repairChecked: false,
      workingStatusChecked: true,
      inspectionNotes: '교정 완료 후 반입, 정상 작동 확인',
    };

    const mockCheckedOutCheckout = {
      id: checkoutId,
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      requesterId: returnerId,
      status: 'checked_out',
      purpose: 'calibration',
    };

    it('should process return of checked out equipment', async () => {
      const mockReturnedCheckout = {
        ...mockCheckedOutCheckout,
        status: 'returned',
        actualReturnDate: new Date(),
        calibrationChecked: mockReturnDto.calibrationChecked,
        workingStatusChecked: mockReturnDto.workingStatusChecked,
      };

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([mockCheckedOutCheckout]); // findOne
      // enforceScopeFromCheckout: 장비 사이트/팀 조회
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'suwon', teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' },
      ]);
      mockDrizzle.returning.mockResolvedValue([mockReturnedCheckout]);
      // getAffectedTeamIds: select().from().where().limit(1)
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' }]);
      mockCacheService.deleteByPattern.mockResolvedValue(undefined);

      const result = await service.returnCheckout(checkoutId, mockReturnDto, returnerId, mockReq);

      expect(result).toBeDefined();
      expect(result.status).toBe('returned');
    });

    it('should throw BadRequestException when checkout is not in checked_out status', async () => {
      const notCheckedOut = { ...mockCheckedOutCheckout, status: 'pending' };

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([notCheckedOut]); // findOne
      // enforceScopeFromCheckout: 장비 사이트/팀 조회
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'suwon', teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' },
      ]);

      await expect(
        service.returnCheckout(checkoutId, mockReturnDto, returnerId, mockReq)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveReturn', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const approverId = '550e8400-e29b-41d4-a716-446655440004';
    const mockApproveReturnDto = {
      version: 1,
      approverId: approverId,
      comment: '반입 확인 완료',
    };

    const mockReturnedCheckout = {
      id: checkoutId,
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'returned',
      purpose: 'calibration',
    };

    it('should approve return of equipment', async () => {
      const mockApprovedReturn = {
        ...mockReturnedCheckout,
        status: 'return_approved',
        version: 2,
        returnApprovedBy: approverId,
        returnApprovedAt: new Date(),
      };

      // findOne: getOrSet가 직접 반환
      mockCacheService.getOrSet.mockResolvedValue({ ...mockReturnedCheckout, version: 1 });
      // db.select().from(checkoutItems).where(): approve 패턴 — equipmentId만 반환
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([{ equipmentId: '550e8400-e29b-41d4-a716-446655440001' }])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      // equipmentService.findByIds: 팀 체크 + 알림용 데이터 통합 (approve 패턴 통일)
      mockEquipmentService.findByIds.mockResolvedValueOnce(
        new Map([
          [
            '550e8400-e29b-41d4-a716-446655440001',
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Test Equipment',
              managementNumber: 'SUW-E0001',
              site: 'suwon',
              teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
              team: { classification: 'general_rf' },
            },
          ],
        ])
      );
      // teamsService.findOne (RF팀 승인자)
      mockTeamsService.findOne.mockResolvedValueOnce({
        id: mockReq.user.teamId,
        classification: 'general_rf',
      });
      // transaction: updateWithVersion → returning
      mockDrizzle.returning.mockResolvedValueOnce([mockApprovedReturn]);
      // equipmentService.updateStatusBatch
      mockEquipmentService.updateStatusBatch.mockResolvedValue([]);
      // getAffectedTeamIds: requester user 조회
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' }]);

      const result = await service.approveReturn(checkoutId, mockApproveReturnDto, mockReq);

      mockChain.then = originalThen;

      expect(result).toBeDefined();
      expect(result.status).toBe('return_approved');
    });

    it('should throw ForbiddenException (CROSS_TEAM_FORBIDDEN) when EMC team approves RF team equipment return', async () => {
      const rfEquipmentId = '550e8400-e29b-41d4-a716-446655440001';
      const emcTeamId = 'emc0b94c-82b8-488e-9ea5-4fe71bb086e1';

      const mockReqEmc = {
        user: {
          ...mockReq.user,
          teamId: emcTeamId,
        },
      } as unknown as AuthenticatedRequest;

      mockCacheService.getOrSet.mockResolvedValue({ ...mockReturnedCheckout, version: 1 });
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([{ equipmentId: rfEquipmentId }])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      // equipmentService.findByIds → RF팀 장비 (enforceScopeFromData site 통과 후 팀 체크에서 차단)
      mockEquipmentService.findByIds.mockResolvedValueOnce(
        new Map([
          [
            rfEquipmentId,
            {
              id: rfEquipmentId,
              name: 'RF Equipment',
              managementNumber: 'SUW-R0001',
              site: 'suwon',
              teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
              team: { classification: 'general_rf' },
            },
          ],
        ])
      );
      // teamsService.findOne → EMC팀
      mockTeamsService.findOne.mockResolvedValueOnce({
        id: emcTeamId,
        classification: 'general_emc',
      });

      await expect(
        service.approveReturn(checkoutId, mockApproveReturnDto, mockReqEmc)
      ).rejects.toThrow(ForbiddenException);

      mockChain.then = originalThen;
    });

    it('should throw BadRequestException when checkout is not in returned status', async () => {
      const notReturnedCheckout = { ...mockReturnedCheckout, status: 'checked_out' };
      const eqId = '550e8400-e29b-41d4-a716-446655440001';

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([notReturnedCheckout]); // findOne
      // scope-먼저 패턴: items + equipment 로드 후 scope 통과, assertFsmAction에서 INVALID_TRANSITION
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([{ equipmentId: eqId }]))
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      mockEquipmentService.findByIds.mockResolvedValueOnce(
        new Map([[eqId, { id: eqId, site: 'suwon', teamId: null }]])
      );

      await expect(
        service.approveReturn(checkoutId, mockApproveReturnDto, mockReq)
      ).rejects.toThrow(BadRequestException);

      mockChain.then = originalThen;
    });
  });

  describe('rejectReturn', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const approverId = '550e8400-e29b-41d4-a716-446655440004';
    const mockRejectReturnDto = {
      version: 1,
      reason: '반입 검사 항목 미충족: 재검사 필요',
      approverId,
    };

    const mockReturnedCheckout = {
      id: checkoutId,
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'returned',
      purpose: 'calibration',
    };

    it('should throw BadRequestException (NO_EQUIPMENT) when checkout has no items', async () => {
      // items 쿼리 기본 반환값: [] (chain.then default)
      mockCacheService.getOrSet.mockResolvedValue({ ...mockReturnedCheckout, version: 1 });
      mockEquipmentService.findByIds.mockResolvedValue(new Map());

      await expect(service.rejectReturn(checkoutId, mockRejectReturnDto, mockReq)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException (INVALID_TRANSITION) for RENTAL checkout — FSM does not permit reject_return for rental purpose', async () => {
      // 아키텍처 제약: FSM이 reject_return을 CAL_REPAIR 목적에만 허용 (checkout-fsm.ts purposes: CAL_REPAIR)
      // RENTAL 반출의 rejectReturn은 assertFsmAction에서 INVALID_TRANSITION으로 차단됨.
      // 결과적으로 rejectReturn 내부의 LENDER_TEAM_ONLY 체크는 RENTAL에 대해 dead code가 됨.
      // TODO: FSM에 RENTAL reject_return 추가 또는 dead code 제거 검토 필요
      const eqId = '550e8400-e29b-41d4-a716-446655440001';
      const rentalReturnedCheckout = {
        id: checkoutId,
        requesterId: '550e8400-e29b-41d4-a716-446655440002',
        status: 'returned',
        purpose: 'rental',
        lenderTeamId: 'aabb1234-82b8-488e-9ea5-4fe71bb086e1',
        version: 1,
        site: 'suwon',
        teamId: null,
      };
      const dtoNoTeam = {
        version: 1,
        reason: '반입 검사 항목 미충족',
        approverId,
        approverTeamId: undefined as string | undefined,
      };

      // scope-먼저 패턴: items + equipment 로드 후 scope 통과 → assertFsmAction에서 INVALID_TRANSITION
      mockCacheService.getOrSet.mockResolvedValue(rentalReturnedCheckout);
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([{ equipmentId: eqId }]))
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      mockEquipmentService.findByIds.mockResolvedValueOnce(
        new Map([[eqId, { id: eqId, site: 'suwon', teamId: null }]])
      );

      await expect(service.rejectReturn(checkoutId, dtoNoTeam, mockReq)).rejects.toThrow(
        BadRequestException
      );

      mockChain.then = originalThen;
    });
  });

  describe('borrowerApprove', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const approverId = mockReq.user.userId;
    const borrowerTeamId = mockReq.user.teamId;
    const mockDto = { version: 1, approverId };

    const rentalPendingCheckout = {
      id: checkoutId,
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'pending',
      purpose: 'rental',
      lenderTeamId: 'aabb1234-82b8-488e-9ea5-4fe71bb086e1',
      version: 1,
    };

    it('(a) 정상 1차 승인: BORROWER_APPROVED 전이 + emitAsync 발행', async () => {
      const borrowerApprovedCheckout = {
        ...rentalPendingCheckout,
        status: 'borrower_approved',
        version: 2,
        borrowerApproverId: approverId,
        borrowerApprovedAt: new Date(),
      };

      // findOne
      mockCacheService.getOrSet.mockResolvedValue({ ...rentalPendingCheckout });
      // requester 조회 (site + teamId)
      mockDrizzle.limit.mockResolvedValueOnce([{ site: 'suwon', teamId: borrowerTeamId }]);
      // CAS update (returning)
      mockDrizzle.returning.mockResolvedValueOnce([borrowerApprovedCheckout]);
      // getAffectedTeamIds: requester user 조회
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: borrowerTeamId }]);
      // getCheckoutItemsWithFirstEquipment: select().from().leftJoin().where() → thenable
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([
            {
              equipmentId: '550e8400-e29b-41d4-a716-446655440001',
              equipmentName: 'Test Equipment',
              managementNumber: 'SUW-E0001',
            },
          ])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));

      const result = await service.borrowerApprove(checkoutId, mockDto, mockReq);

      mockChain.then = originalThen;

      expect(result.status).toBe('borrower_approved');
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        'checkout.borrowerApproved',
        expect.objectContaining({ checkoutId })
      );
    });

    it('(b) 비-rental purpose → BadRequestException(BORROWER_APPROVE_RENTAL_ONLY)', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...rentalPendingCheckout,
        purpose: 'calibration',
      });

      await expect(service.borrowerApprove(checkoutId, mockDto, mockReq)).rejects.toThrow(
        BadRequestException
      );
    });

    it('(c) 스코프 외 사용자 (다른 사이트) → ForbiddenException', async () => {
      mockCacheService.getOrSet.mockResolvedValue({ ...rentalPendingCheckout });
      // requester가 daejeon 사이트 → enforceScopeForBorrower(enforceSiteAccess)에서 차단
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'daejeon', teamId: 'cc001234-82b8-488e-9ea5-4fe71bb086e1' },
      ]);

      await expect(service.borrowerApprove(checkoutId, mockDto, mockReq)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('(d) req.user.teamId 없음 → ForbiddenException(BORROWER_TEAM_ONLY)', async () => {
      // teamId 미소속 TM: enforceScopeForBorrower는 site fallback으로 통과하나
      // identity rule(!req.user.teamId)에서 BORROWER_TEAM_ONLY로 차단
      const mockReqNoTeam = {
        user: {
          userId: mockReq.user.userId,
          roles: ['technical_manager'],
          permissions: mockReq.user.permissions,
          site: 'suwon',
          teamId: undefined,
        },
      } as unknown as AuthenticatedRequest;

      mockCacheService.getOrSet.mockResolvedValue({ ...rentalPendingCheckout });
      // requester는 동일 사이트 + 팀 있음
      mockDrizzle.limit.mockResolvedValueOnce([{ site: 'suwon', teamId: borrowerTeamId }]);

      await expect(service.borrowerApprove(checkoutId, mockDto, mockReqNoTeam)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('borrowerReject', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';
    const approverId = mockReq.user.userId;
    const borrowerTeamId = mockReq.user.teamId;
    const mockRejectDto = {
      version: 1,
      approverId,
      reason: '팀 장비 운용 일정 충돌로 반려합니다.',
    };

    const rentalPendingCheckout = {
      id: checkoutId,
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'pending',
      purpose: 'rental',
      lenderTeamId: 'aabb1234-82b8-488e-9ea5-4fe71bb086e1',
      version: 1,
    };

    it('(a) 정상 1차 반려: REJECTED 전이 + borrowerRejectionReason 기록 + emitAsync 발행', async () => {
      const rejectedCheckout = {
        ...rentalPendingCheckout,
        status: 'rejected',
        version: 2,
        borrowerApproverId: approverId,
        borrowerRejectionReason: mockRejectDto.reason,
      };

      mockCacheService.getOrSet.mockResolvedValue({ ...rentalPendingCheckout });
      mockDrizzle.limit.mockResolvedValueOnce([{ site: 'suwon', teamId: borrowerTeamId }]);
      mockDrizzle.returning.mockResolvedValueOnce([rejectedCheckout]);
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: borrowerTeamId }]);
      const originalThen = mockChain.then;
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([
            {
              equipmentId: '550e8400-e29b-41d4-a716-446655440001',
              equipmentName: 'Test Equipment',
              managementNumber: 'SUW-E0001',
            },
          ])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));

      const result = await service.borrowerReject(checkoutId, mockRejectDto, mockReq);

      mockChain.then = originalThen;

      expect(result.status).toBe('rejected');
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        'checkout.borrowerRejected',
        expect.objectContaining({ checkoutId })
      );
    });

    it('(b) 비-rental purpose → BadRequestException(BORROWER_APPROVE_RENTAL_ONLY)', async () => {
      mockCacheService.getOrSet.mockResolvedValue({
        ...rentalPendingCheckout,
        purpose: 'repair',
      });

      await expect(service.borrowerReject(checkoutId, mockRejectDto, mockReq)).rejects.toThrow(
        BadRequestException
      );
    });

    it('(c) req.user.teamId 없음 → ForbiddenException(BORROWER_TEAM_ONLY)', async () => {
      const mockReqNoTeam = {
        user: {
          userId: mockReq.user.userId,
          roles: ['technical_manager'],
          permissions: mockReq.user.permissions,
          site: 'suwon',
          teamId: undefined,
        },
      } as unknown as AuthenticatedRequest;

      mockCacheService.getOrSet.mockResolvedValue({ ...rentalPendingCheckout });
      mockDrizzle.limit.mockResolvedValueOnce([{ site: 'suwon', teamId: borrowerTeamId }]);

      await expect(
        service.borrowerReject(checkoutId, mockRejectDto, mockReqNoTeam)
      ).rejects.toThrow(ForbiddenException);
    });

    it('(d) req.user.teamId != requester.teamId → ForbiddenException(BORROWER_TEAM_ONLY)', async () => {
      const mockReqDiffTeam = {
        user: {
          ...mockReq.user,
          teamId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        },
      } as unknown as AuthenticatedRequest;

      mockCacheService.getOrSet.mockResolvedValue({ ...rentalPendingCheckout });
      // requester teamId = borrowerTeamId; req.user.teamId is different ↑
      mockDrizzle.limit.mockResolvedValueOnce([{ site: 'suwon', teamId: borrowerTeamId }]);

      await expect(
        service.borrowerReject(checkoutId, mockRejectDto, mockReqDiffTeam)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('callback error resilience', () => {
    const checkoutId = '550e8400-e29b-41d4-a716-446655440003';

    it('cancel: 콜백 실패해도 checkout 상태는 canceled로 유지된다', async () => {
      const pendingCheckout = {
        id: checkoutId,
        status: 'pending',
        purpose: 'return_to_vendor',
        requesterId: '550e8400-e29b-41d4-a716-446655440002',
        version: 1,
      };
      const canceledCheckout = { ...pendingCheckout, status: 'canceled', version: 2 };

      // findOne via getOrSet
      mockCacheService.getOrSet.mockResolvedValue({ ...pendingCheckout });
      // enforceScopeFromCheckout: 장비 사이트/팀 조회
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'suwon', teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' },
      ]);
      // updateWithVersion (returning)
      mockDrizzle.returning.mockResolvedValueOnce([canceledCheckout]);
      // callback fails
      mockImportsService.onReturnCanceled.mockRejectedValueOnce(new Error('CAS 실패'));
      // getAffectedTeamIds
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' }]);

      const result = await service.cancel(checkoutId, 1, mockReq);

      expect(result.status).toBe('canceled');
      expect(mockImportsService.onReturnCanceled).toHaveBeenCalledWith(checkoutId);
    });

    it('approveReturn: 콜백 실패해도 checkout 상태는 return_approved로 유지된다', async () => {
      const returnedCheckout = {
        id: checkoutId,
        status: 'returned',
        purpose: 'return_to_vendor',
        requesterId: '550e8400-e29b-41d4-a716-446655440002',
        version: 1,
      };
      const approvedReturn = { ...returnedCheckout, status: 'return_approved', version: 2 };

      // findOne via getOrSet
      mockCacheService.getOrSet.mockResolvedValue({ ...returnedCheckout });
      // db.select().from(checkoutItems).where(): approve 패턴 — equipmentId만 반환
      mockChain.then = jest
        .fn()
        .mockImplementationOnce((resolve: (v: unknown) => void) =>
          resolve([{ equipmentId: '550e8400-e29b-41d4-a716-446655440001' }])
        )
        .mockImplementation((resolve: (v: unknown) => void) => resolve([]));
      // equipmentService.findByIds: 팀 체크 + 알림 데이터 통합 (approve 패턴)
      mockEquipmentService.findByIds.mockResolvedValueOnce(
        new Map([
          [
            '550e8400-e29b-41d4-a716-446655440001',
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Test Equipment',
              managementNumber: 'SUW-E0001',
              site: 'suwon',
              teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
              team: { classification: 'general_rf' },
            },
          ],
        ])
      );
      // teamsService.findOne (mockReq.user.teamId 있으므로 호출됨)
      mockTeamsService.findOne.mockResolvedValueOnce({
        id: mockReq.user.teamId,
        classification: 'general_rf',
      });
      // transaction → updateWithVersion + updateStatusBatch
      mockDrizzle.returning.mockResolvedValueOnce([approvedReturn]);
      mockEquipmentService.updateStatusBatch.mockResolvedValue([]);
      // callback fails
      mockImportsService.onReturnCompleted.mockRejectedValueOnce(new Error('콜백 실패'));
      // getAffectedTeamIds
      mockDrizzle.limit.mockResolvedValueOnce([{ teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' }]);

      const result = await service.approveReturn(
        checkoutId,
        { version: 1, approverId: '550e8400-e29b-41d4-a716-446655440004', comment: '확인' },
        mockReq
      );

      expect(result.status).toBe('return_approved');
      expect(mockImportsService.onReturnCompleted).toHaveBeenCalledWith(checkoutId);
    });
  });

  describe('UUID validation', () => {
    it('should accept valid UUID format', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValue([{ id: validUuid, status: 'pending' }]);

      const result = await service.findOne(validUuid, []);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for invalid UUID format in findOne', async () => {
      // findOne은 UUID 검증 없이 DB 조회 → NotFoundException
      const invalidUuids = [
        'not-a-uuid',
        '12345',
        'g50e8400-e29b-41d4-a716-446655440000', // invalid character 'g'
      ];

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValue([]);

      for (const invalidUuid of invalidUuids) {
        await expect(service.findOne(invalidUuid, [])).rejects.toThrow(NotFoundException);
      }
    });

    it('should throw BadRequestException for invalid UUID in create', async () => {
      // create는 validateUuid를 호출하여 BadRequestException 발생
      const invalidDto = {
        equipmentIds: ['invalid-uuid-format'],
        purpose: 'calibration' as const,
        destination: '교정기관',
        reason: '교정',
        expectedReturnDate: new Date().toISOString(),
      };

      await expect(service.create(invalidDto, 'invalid-requester-id')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getInboundOverview', () => {
    const mockImportList = {
      data: [],
      meta: { pagination: { total: 0, pageSize: 10, currentPage: 1, totalPages: 0 } },
    };

    beforeEach(() => {
      // 렌탈 imports findAll mock
      mockImportsService.findAll.mockResolvedValue(mockImportList);
      // sparkline 쿼리는 .groupBy().orderBy() 체인을 사용 — 기본 체인에 없으므로 추가
      const chain = mockChain as Record<string, jest.Mock>;
      chain.groupBy = jest.fn().mockReturnValue(chain);
      chain.having = jest.fn().mockReturnValue(chain);
    });

    it('should return combined overview with standard/rental/internalShared/sparkline', async () => {
      const query = { limitPerSection: 10 };
      const result = await service.getInboundOverview(query, null);

      expect(result).toHaveProperty('standard');
      expect(result).toHaveProperty('rental');
      expect(result).toHaveProperty('internalShared');
      expect(result).toHaveProperty('sparkline');
      expect(result).toHaveProperty('generatedAt');
      expect(result.sparkline).toHaveProperty('standard');
      expect(result.sparkline).toHaveProperty('rental');
      expect(result.sparkline).toHaveProperty('internalShared');
      // sparkline은 14일치 배열
      expect(result.sparkline.standard).toHaveLength(14);
      expect(result.sparkline.rental).toHaveLength(14);
      expect(result.sparkline.internalShared).toHaveLength(14);
    });

    it('should call rentalImportsService.findAll twice (rental + internalShared)', async () => {
      await service.getInboundOverview({ limitPerSection: 10 }, null);

      expect(mockImportsService.findAll).toHaveBeenCalledTimes(2);
      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'rental' })
      );
      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sourceType: 'internal_shared' })
      );
    });

    it('should pass statusFilter only when it is a valid import status', async () => {
      await service.getInboundOverview({ limitPerSection: 10, statusFilter: 'pending' }, null);
      // 'pending'은 유효한 import status
      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should not pass statusFilter to imports when it is a checkout-only status', async () => {
      // 'lender_checked'는 checkout 전용 status — EQUIPMENT_IMPORT_STATUS_VALUES에 없음
      await service.getInboundOverview(
        { limitPerSection: 10, statusFilter: 'lender_checked' },
        null
      );
      expect(mockImportsService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: undefined })
      );
    });
  });
});
