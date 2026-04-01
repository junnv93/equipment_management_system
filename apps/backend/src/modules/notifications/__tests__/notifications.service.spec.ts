import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';

const createSelectChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'returning',
    'update',
    'set',
    'delete',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.limit.mockResolvedValue(finalValue);
  chain.returning.mockResolvedValue(finalValue);
  chain.orderBy.mockResolvedValue(finalValue);
  chain.offset.mockResolvedValue(finalValue);
  chain.delete.mockReturnValue(chain);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

const MOCK_USER_ID = 'user-uuid-1';
const MOCK_NOTIF_ID = 'notif-uuid-1';

const MOCK_NOTIFICATION = {
  id: MOCK_NOTIF_ID,
  title: '테스트 알림',
  content: '알림 내용',
  type: 'checkout_submitted',
  category: 'checkout',
  priority: 'medium',
  recipientId: MOCK_USER_ID,
  teamId: null,
  isSystemWide: false,
  equipmentId: null,
  entityType: 'checkout',
  entityId: 'co-uuid-1',
  linkUrl: '/checkouts/co-uuid-1',
  isRead: false,
  readAt: null,
  actorId: null,
  actorName: '시스템',
  recipientSite: 'SUW',
  expiresAt: new Date('2025-01-01'),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let chain: ReturnType<typeof createSelectChain>;

  beforeEach(async () => {
    chain = createSelectChain([MOCK_NOTIFICATION]);
    mockCacheService = createMockCacheService();
    mockCacheService.getOrSet.mockImplementation((_k: unknown, f: () => unknown) => f());

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      delete: jest.fn().mockReturnValue(chain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  // ─── findAllForUser ────────────────────────────────────────────────────────

  describe('findAllForUser()', () => {
    it('사용자 알림 목록과 페이지 메타데이터를 반환한다', async () => {
      // count 쿼리: 첫 번째 db.select → chain → from → where(종단 Promise)
      const countChain: Record<string, jest.Mock> = {};
      const countMethods = ['from', 'where'];
      for (const m of countMethods) {
        countChain[m] = jest.fn().mockReturnValue(countChain);
      }
      countChain.where.mockResolvedValueOnce([{ count: 1 }]);

      // data 쿼리: 두 번째 db.select → chain → from → where → orderBy → limit → offset(종단)
      const dataChain: Record<string, jest.Mock> = {};
      const dataMethods = ['from', 'where', 'orderBy', 'limit', 'offset'];
      for (const m of dataMethods) {
        dataChain[m] = jest.fn().mockReturnValue(dataChain);
      }
      dataChain.offset.mockResolvedValueOnce([MOCK_NOTIFICATION]);

      mockDb.select.mockReturnValueOnce(countChain).mockReturnValueOnce(dataChain);

      const result = await service.findAllForUser(MOCK_USER_ID, null, { page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('isRead 필터를 적용할 수 있다', async () => {
      const countChain: Record<string, jest.Mock> = {};
      for (const m of ['from', 'where']) {
        countChain[m] = jest.fn().mockReturnValue(countChain);
      }
      countChain.where.mockResolvedValueOnce([{ count: 0 }]);

      const dataChain: Record<string, jest.Mock> = {};
      for (const m of ['from', 'where', 'orderBy', 'limit', 'offset']) {
        dataChain[m] = jest.fn().mockReturnValue(dataChain);
      }
      dataChain.offset.mockResolvedValueOnce([]);

      mockDb.select.mockReturnValueOnce(countChain).mockReturnValueOnce(dataChain);

      const result = await service.findAllForUser(MOCK_USER_ID, null, { isRead: false });

      expect(result.items).toHaveLength(0);
    });
  });

  // ─── countUnread ──────────────────────────────────────────────────────────

  describe('countUnread()', () => {
    it('미읽음 알림 수를 반환한다', async () => {
      chain.where.mockResolvedValueOnce([{ count: 3 }]);

      const result = await service.countUnread(MOCK_USER_ID, null);

      expect(result.count).toBe(3);
    });

    it('캐시에서 읽어온다 (getOrSet 호출)', async () => {
      chain.where.mockResolvedValueOnce([{ count: 5 }]);

      await service.countUnread(MOCK_USER_ID, null);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining(MOCK_USER_ID),
        expect.any(Function),
        expect.any(Number)
      );
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('존재하는 알림을 반환한다', async () => {
      chain.limit.mockResolvedValueOnce([MOCK_NOTIFICATION]);

      const result = await service.findOne(MOCK_NOTIF_ID, MOCK_USER_ID, null);

      expect(result.id).toBe(MOCK_NOTIF_ID);
    });

    it('존재하지 않으면 NotFoundException을 던진다', async () => {
      chain.limit.mockResolvedValueOnce([]);

      await expect(service.findOne('nonexistent', MOCK_USER_ID, null)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ─── markAsRead ────────────────────────────────────────────────────────────

  describe('markAsRead()', () => {
    it('알림을 읽음으로 표시하고 캐시를 삭제한다', async () => {
      chain.returning.mockResolvedValueOnce([{ ...MOCK_NOTIFICATION, isRead: true }]);

      const result = await service.markAsRead(MOCK_NOTIF_ID, MOCK_USER_ID);

      expect(result.isRead).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith(expect.stringContaining(MOCK_USER_ID));
    });

    it('알림이 없으면 NotFoundException을 던진다', async () => {
      chain.returning.mockResolvedValueOnce([]);

      await expect(service.markAsRead('nonexistent', MOCK_USER_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  // ─── markAllAsRead ────────────────────────────────────────────────────────

  describe('markAllAsRead()', () => {
    it('성공 여부와 업데이트된 건수를 반환한다', async () => {
      chain.returning.mockResolvedValueOnce([{ id: MOCK_NOTIF_ID }]);

      const result = await service.markAllAsRead(MOCK_USER_ID, null);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('알림을 삭제하고 캐시를 무효화한다', async () => {
      chain.returning.mockResolvedValueOnce([{ id: MOCK_NOTIF_ID }]);

      const result = await service.remove(MOCK_NOTIF_ID, MOCK_USER_ID);

      expect(result.deleted).toBe(true);
      expect(result.id).toBe(MOCK_NOTIF_ID);
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('알림이 없으면 NotFoundException을 던진다', async () => {
      chain.returning.mockResolvedValueOnce([]);

      await expect(service.remove('nonexistent', MOCK_USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createBatch ──────────────────────────────────────────────────────────

  describe('createBatch()', () => {
    it('빈 배열 입력 시 빈 배열을 반환한다 (DB 호출 없음)', async () => {
      const result = await service.createBatch([]);

      expect(result).toHaveLength(0);
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('복수 레코드를 배치 삽입하고 반환한다', async () => {
      const records = [
        {
          title: '알림1',
          content: '내용1',
          type: 'checkout_submitted',
          category: 'checkout',
          priority: 'medium',
          recipientId: MOCK_USER_ID,
        },
      ];
      chain.returning.mockResolvedValueOnce([MOCK_NOTIFICATION]);

      const result = await service.createBatch(records);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  // ─── createSystemNotification ─────────────────────────────────────────────

  describe('createSystemNotification()', () => {
    it('시스템 공지 알림을 생성하고 반환한다', async () => {
      const systemNotif = { ...MOCK_NOTIFICATION, isSystemWide: true };
      chain.returning.mockResolvedValueOnce([systemNotif]);

      const result = await service.createSystemNotification('시스템 공지', '내용');

      expect(result.isSystemWide).toBe(true);
    });
  });
});
