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
    transaction: jest.Mock;
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
      // transaction(callback) → callback(mockDb) : tx는 동일 mockDb로 프록시
      transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockDb);
      }),
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
    it('감사 로그를 생성해야 한다 (append-only — 캐시 무효화 없음, TTL에 위임)', async () => {
      const dto = {
        userId: 'user-1',
        userName: '홍길동',
        userRole: 'technical_manager' as const,
        action: 'approve' as const,
        entityType: 'equipment' as const,
        entityId: 'eq-1',
        entityName: '분석기',
      };

      await service.create(dto);

      expect(mockDb.insert).toHaveBeenCalled();
      // write-heavy 워크로드에서 브루트포스 invalidation 제거 → deleteByPrefix 호출 0
      expect(mockCacheService.deleteByPrefix).not.toHaveBeenCalled();
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
      // userId null = 익명/실패 액션 (FK SET NULL); entityId는 nil UUID 유지
      const insertedValues = mockDb.insert.mock.results[0].value.values;
      expect(insertedValues).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          entityId: SYSTEM_USER_UUID,
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

  describe('findAllCursor', () => {
    /** base64(JSON({t,i})) 커서 인코딩 — audit.service.ts:241-247 과 동일 포맷 */
    const buildCursor = (timestamp: Date, id: string): string =>
      Buffer.from(JSON.stringify({ t: timestamp.toISOString(), i: id })).toString('base64');

    it('첫 페이지 (cursor 없음) — summary 포함, hasMore=false, nextCursor=null', async () => {
      // isFirstPage=true → Promise.all 이 select 2회 호출 (items → summary)
      const itemsChain = createSelectChain([sampleLog]);
      const summaryChain = createSelectChain([{ action: 'approve', count: 5 }]);
      let call = 0;
      mockDb.select.mockImplementation(() => (++call === 1 ? itemsChain : summaryChain));

      const result = await service.findAllCursor({}, undefined, 30);

      expect(result.items).toEqual([sampleLog]);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(result.summary).toEqual({ approve: 5 });
      // fetchLimit = limit + 1 → hasMore 감지용 +1 row
      expect(itemsChain.limit).toHaveBeenCalledWith(31);
      // summary 쿼리는 groupBy(action) 호출
      expect(summaryChain.groupBy).toHaveBeenCalled();
    });

    it('첫 페이지 — limit+1 fetch 로 hasMore=true, pageItems slice, nextCursor 인코딩', async () => {
      // 3 rows 반환 + limit=2 → fetchLimit=3 → hasMore=true → pageItems 는 앞 2개
      const manyRows = [
        { ...sampleLog, id: 'log-a', timestamp: new Date('2025-05-09T10:00:00Z') },
        { ...sampleLog, id: 'log-b', timestamp: new Date('2025-05-09T09:30:00Z') },
        { ...sampleLog, id: 'log-c', timestamp: new Date('2025-05-09T09:00:00Z') },
      ];
      const itemsChain = createSelectChain(manyRows);
      const summaryChain = createSelectChain([]);
      let call = 0;
      mockDb.select.mockImplementation(() => (++call === 1 ? itemsChain : summaryChain));

      const result = await service.findAllCursor({}, undefined, 2);

      expect(result.hasMore).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('log-a');
      expect(result.items[1].id).toBe('log-b');
      expect(result.nextCursor).not.toBeNull();

      // nextCursor 디코딩 → 마지막 pageItem(log-b) 의 (t, i)
      const decoded = JSON.parse(Buffer.from(result.nextCursor!, 'base64').toString('utf-8')) as {
        t: string;
        i: string;
      };
      expect(decoded.i).toBe('log-b');
      expect(new Date(decoded.t).toISOString()).toBe('2025-05-09T09:30:00.000Z');
    });

    it('유효한 cursor → 후속 페이지 경로 (summary 없음, select 1회만)', async () => {
      const itemsChain = createSelectChain([sampleLog]);
      mockDb.select.mockReturnValue(itemsChain);

      const cursor = buildCursor(new Date('2025-05-10T10:00:00Z'), 'log-prev');
      const result = await service.findAllCursor({}, cursor, 30);

      // 후속 페이지: summary 미포함
      expect(result.summary).toBeUndefined();
      // items 쿼리만 호출 (summary 경로는 Promise.resolve(null) 로 skip)
      expect(mockDb.select).toHaveBeenCalledTimes(1);
      // keyset row-value WHERE 를 포함한 conditions 가 병합되어 where() 호출
      expect(itemsChain.where).toHaveBeenCalled();
      expect(result.items).toEqual([sampleLog]);
    });

    it('Invalid cursor (깨진 base64) → 첫 페이지로 fallback, summary 포함', async () => {
      const itemsChain = createSelectChain([sampleLog]);
      const summaryChain = createSelectChain([{ action: 'login', count: 1 }]);
      let call = 0;
      mockDb.select.mockImplementation(() => (++call === 1 ? itemsChain : summaryChain));

      const result = await service.findAllCursor({}, 'not-valid-base64!!!', 30);

      // fallback → 첫 페이지: summary 포함
      expect(result.summary).toEqual({ login: 1 });
      expect(result.items).toEqual([sampleLog]);
      // select 2회 호출 확인 (items + summary)
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('Invalid cursor (유효 base64, 필드 누락) → 첫 페이지로 fallback', async () => {
      const itemsChain = createSelectChain([]);
      const summaryChain = createSelectChain([]);
      let call = 0;
      mockDb.select.mockImplementation(() => (++call === 1 ? itemsChain : summaryChain));

      // `i` 필드 누락 — typeof decoded.i !== 'string' 경로
      const badCursor = Buffer.from(JSON.stringify({ t: new Date().toISOString() })).toString(
        'base64'
      );
      const result = await service.findAllCursor({}, badCursor, 30);

      // 첫 페이지로 fallback → summary 객체 반환 (빈 객체라도 undefined 는 아님)
      expect(result.summary).toBeDefined();
      expect(result.summary).toEqual({});
      // select 2회 (items + summary) 확인 — 첫 페이지 경로로 진입
      expect(mockDb.select).toHaveBeenCalledTimes(2);
    });

    it('필터 조건 (userId + entityType) → items/summary 모두에 WHERE 적용', async () => {
      const itemsChain = createSelectChain([sampleLog]);
      const summaryChain = createSelectChain([{ action: 'approve', count: 2 }]);
      let call = 0;
      mockDb.select.mockImplementation(() => (++call === 1 ? itemsChain : summaryChain));

      await service.findAllCursor(
        { userId: 'user-1', entityType: 'equipment', userSite: 'SUW' },
        undefined,
        30
      );

      // buildFilterConditions 가 3개 이상의 조건을 생성 → where() 가 양쪽 쿼리에서 호출
      expect(itemsChain.where).toHaveBeenCalled();
      expect(summaryChain.where).toHaveBeenCalled();
      // order by 는 (timestamp DESC, id DESC) 복합 커서 — items 쿼리만
      expect(itemsChain.orderBy).toHaveBeenCalled();
    });
  });
});
