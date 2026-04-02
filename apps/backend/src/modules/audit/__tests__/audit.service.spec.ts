import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import { SYSTEM_USER_UUID } from '../../../database/utils/uuid-constants';

describe('AuditService', () => {
  let service: AuditService;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
  };
  let mockCacheService: Record<string, jest.Mock>;

  // Drizzle fluent chain builder — 모든 메서드가 this를 반환하고 then()으로 resolve
  const createInsertChain = (): { values: jest.Mock } => {
    const chain = { values: jest.fn().mockResolvedValue(undefined) };
    return chain;
  };

  const createSelectChain = (rows: unknown[]): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const self = (): Record<string, jest.Mock> => chain;
    chain.from = jest.fn().mockImplementation(self);
    chain.where = jest.fn().mockImplementation(self);
    chain.orderBy = jest.fn().mockImplementation(self);
    chain.limit = jest.fn().mockImplementation(self);
    chain.offset = jest.fn().mockImplementation(self);
    chain.groupBy = jest.fn().mockImplementation(self);
    // Promise-like: await 시 rows 반환
    chain.then = jest.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(rows));
    return chain;
  };

  const createUpdateChain = (): { set: jest.Mock; where: jest.Mock } => {
    const chain = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
    };
    return chain;
  };

  const sampleLog = {
    id: 'log-1',
    userId: 'user-1',
    userName: '홍길동',
    userRole: 'technical_manager',
    action: 'approve',
    entityType: 'equipment',
    entityId: 'eq-1',
    entityName: '네트워크 분석기(SUW-E0326)',
    details: null,
    ipAddress: '127.0.0.1',
    userSite: 'SUW',
    userTeamId: 'team-1',
    timestamp: new Date('2025-05-09T09:30:00'),
    createdAt: new Date('2025-05-09T09:30:00'),
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();

    const insertChain = createInsertChain();
    mockDb = {
      insert: jest.fn().mockReturnValue(insertChain),
      select: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('create', () => {
    it('감사 로그를 생성하고 캐시를 무효화해야 한다', async () => {
      const dto = {
        userId: 'user-1',
        userName: '홍길동',
        userRole: 'technical_manager',
        action: 'approve' as const,
        entityType: 'equipment' as const,
        entityId: 'eq-1',
        entityName: '분석기',
      };

      await service.create(dto);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalledTimes(3);
    });

    it('DB 에러 시 예외를 던지지 않아야 한다', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await expect(
        service.create({
          userId: 'user-1',
          userName: 'test',
          userRole: 'system',
          action: 'login' as const,
          entityType: 'user' as const,
          entityId: 'user-1',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('필터와 페이지네이션을 적용하여 결과를 반환해야 한다', async () => {
      const actionCounts = [
        { action: 'approve', count: 5 },
        { action: 'create', count: 3 },
      ];
      const items = [sampleLog];

      // getOrSet는 pass-through로 factory 실행
      // Promise.all에서 두 쿼리 병렬 실행
      const selectChain1 = createSelectChain(actionCounts);
      const selectChain2 = createSelectChain(items);

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain1 : selectChain2;
      });

      const result = await service.findAll({ entityType: 'equipment' }, { page: 1, limit: 10 });

      expect(result.items).toEqual(items);
      expect(result.meta.totalItems).toBe(8); // 5 + 3
      expect(result.meta.currentPage).toBe(1);
      expect(result.summary).toEqual({ approve: 5, create: 3 });
    });

    it('빈 필터에서도 동작해야 한다', async () => {
      const selectChain1 = createSelectChain([]);
      const selectChain2 = createSelectChain([]);

      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? selectChain1 : selectChain2;
      });

      const result = await service.findAll({}, { page: 1, limit: 20 });

      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('findOne', () => {
    it('존재하는 로그를 반환해야 한다', async () => {
      const selectChain = createSelectChain([sampleLog]);
      mockDb.select.mockReturnValue(selectChain);

      const result = await service.findOne('log-1');

      expect(result).toEqual(sampleLog);
    });

    it('존재하지 않는 로그에 NotFoundException을 던져야 한다', async () => {
      const selectChain = createSelectChain([]);
      // findOne은 limit(1) 후 destructuring하므로 빈 배열 반환
      selectChain.limit.mockResolvedValue([]);
      mockDb.select.mockReturnValue(selectChain);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('scope가 site일 때 WHERE 조건을 추가해야 한다', async () => {
      const selectChain = createSelectChain([sampleLog]);
      selectChain.limit.mockResolvedValue([sampleLog]);
      mockDb.select.mockReturnValue(selectChain);

      await service.findOne('log-1', { type: 'site', site: 'SUW', label: 'SUW' });

      // where가 호출되었는지 확인
      expect(selectChain.where).toHaveBeenCalled();
    });
  });

  describe('findByEntity', () => {
    it('엔티티 타입/ID로 로그를 조회해야 한다', async () => {
      const logs = [sampleLog];
      const selectChain = createSelectChain(logs);
      mockDb.select.mockReturnValue(selectChain);

      const result = await service.findByEntity('equipment', 'eq-1');

      expect(result).toEqual(logs);
    });
  });

  describe('findByUser', () => {
    it('사용자 ID로 로그를 조회해야 한다', async () => {
      const logs = [sampleLog];
      const selectChain = createSelectChain(logs);
      mockDb.select.mockReturnValue(selectChain);

      const result = await service.findByUser('user-1', 50);

      expect(result).toEqual(logs);
    });
  });

  describe('formatLogMessage', () => {
    it('entityName이 있을 때 포맷된 메시지를 반환해야 한다', () => {
      const message = service.formatLogMessage(sampleLog as never);

      expect(message).toContain('2025년 5월 09일');
      expect(message).toContain('홍길동');
      expect(message).toContain('네트워크 분석기(SUW-E0326)');
    });

    it('entityName이 없을 때 entityId를 사용해야 한다', () => {
      const logWithoutName = { ...sampleLog, entityName: null };
      const message = service.formatLogMessage(logWithoutName as never);

      expect(message).toContain('eq-1');
      expect(message).not.toContain('null');
    });
  });

  describe('handleAuthFailed', () => {
    it('실패 이벤트를 감사 로그로 기록해야 한다', async () => {
      await service.handleAuthFailed({
        event: 'login_failed',
        email: 'bad@example.com',
        reason: 'Invalid credentials',
        timestamp: new Date().toISOString(),
      });

      expect(mockDb.insert).toHaveBeenCalled();
      // SYSTEM_USER_UUID를 userId로 사용
      const insertedValues = mockDb.insert.mock.results[0].value.values;
      expect(insertedValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: SYSTEM_USER_UUID,
          userName: 'bad@example.com',
          action: 'login',
        })
      );
    });

    it('email이 없으면 unknown으로 기록해야 한다', async () => {
      await service.handleAuthFailed({
        event: 'refresh_denied',
        reason: 'Token expired',
        timestamp: new Date().toISOString(),
      });

      const insertedValues = mockDb.insert.mock.results[0].value.values;
      expect(insertedValues).toHaveBeenCalledWith(expect.objectContaining({ userName: 'unknown' }));
    });
  });

  describe('handleAuthSuccess', () => {
    it('성공 이벤트를 기록하고 lastLogin을 갱신해야 한다', async () => {
      const updateChain = createUpdateChain();
      mockDb.update.mockReturnValue(updateChain);

      await service.handleAuthSuccess({
        event: 'login_success',
        userId: 'user-1',
        email: 'user@example.com',
        provider: 'credentials',
        timestamp: new Date().toISOString(),
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(updateChain.set).toHaveBeenCalledWith(
        expect.objectContaining({ lastLogin: expect.any(Date) })
      );
    });

    it('userId가 없으면 lastLogin 갱신을 건너뛰어야 한다', async () => {
      await service.handleAuthSuccess({
        event: 'login_success',
        userId: '',
        email: 'user@example.com',
        provider: 'azure-ad',
        timestamp: new Date().toISOString(),
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });
});
