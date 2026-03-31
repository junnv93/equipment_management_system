import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutsService } from '../checkouts.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { TeamsService } from '../../teams/teams.service';
import { EquipmentImportsService } from '../../equipment-imports/equipment-imports.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../types/auth';

// 테스트용 mock req — 스코프 체크에서 사용
const mockReq = {
  user: {
    userId: '550e8400-e29b-41d4-a716-446655440004',
    roles: ['technical_manager'],
    site: 'suwon',
    teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
  },
} as unknown as AuthenticatedRequest;

describe('CheckoutsService', () => {
  let service: CheckoutsService;
  let mockDrizzle: Record<string, jest.Mock>;
  let mockCacheService: Record<string, jest.Mock>;
  let mockEquipmentService: Record<string, jest.Mock>;
  let mockTeamsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    // 매 테스트마다 새로운 mock 객체 생성
    // chain: 체이닝 + thenable (await 시 빈 배열 반환) — DI value와 분리
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
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            emitAsync: jest.fn().mockResolvedValue([]),
            on: jest.fn(),
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

      const result = await service.findOne(mockCheckout.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCheckout.id);
      expect(result.status).toBe('pending');
    });

    it('should throw NotFoundException when checkout not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      mockDrizzle.limit.mockResolvedValue([]);

      await expect(service.findOne(mockCheckout.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for invalid UUID format', async () => {
      // findOne은 UUID 유효성 검증 없이 바로 DB 조회 → 결과가 없으면 NotFoundException
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValue([]);

      await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
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
    const _approverTeamId = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1'; // 수원 RF팀 UUID

    const mockPendingCheckout = {
      id: checkoutId,
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      requesterId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'pending',
      purpose: 'calibration',
    };

    // TODO: 복잡한 Drizzle 체인 mock이 필요하여 E2E 테스트에서 검증
    it.todo('should approve a pending checkout');

    it('should throw BadRequestException when checkout is not pending', async () => {
      const nonPendingCheckout = { ...mockPendingCheckout, status: 'approved' };

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([nonPendingCheckout]);

      await expect(service.approve(checkoutId, mockApproveDto, mockReq)).rejects.toThrow(
        BadRequestException
      );
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

    // TODO: 복잡한 Drizzle 체인 mock이 필요하여 E2E 테스트에서 검증
    it.todo('should approve return of equipment');

    it('should throw BadRequestException when checkout is not in returned status', async () => {
      const notReturnedCheckout = { ...mockReturnedCheckout, status: 'checked_out' };

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValueOnce([notReturnedCheckout]); // findOne
      // enforceScopeFromCheckout: 장비 사이트/팀 조회
      mockDrizzle.limit.mockResolvedValueOnce([
        { site: 'suwon', teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1' },
      ]);

      await expect(
        service.approveReturn(checkoutId, mockApproveReturnDto, mockReq)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('UUID validation', () => {
    it('should accept valid UUID format', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';

      mockCacheService.getOrSet.mockImplementation(async (key, factory) => factory());
      mockDrizzle.limit.mockResolvedValue([{ id: validUuid, status: 'pending' }]);

      const result = await service.findOne(validUuid);
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
        await expect(service.findOne(invalidUuid)).rejects.toThrow(NotFoundException);
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
});
