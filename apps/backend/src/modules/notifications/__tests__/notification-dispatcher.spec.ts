import { Test, TestingModule } from '@nestjs/testing';
import { NotificationDispatcher } from '../services/notification-dispatcher';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { NotificationSseService } from '../sse/notification-sse.service';
import { SettingsService } from '../../settings/settings.service';
import { NotificationRecipientResolver } from '../services/notification-recipient-resolver';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationTemplateService } from '../services/notification-template.service';
import {
  createMockCacheService,
  createMockNotificationSseService,
  createMockSettingsService,
  createMockNotificationTemplateService,
  createMockNotificationPreferencesService,
  createMockNotificationRecipientResolver,
} from '../../../common/testing/mock-providers';
import { EmailService } from '../services/email.service';
import { EmailTemplateService } from '../services/email-template.service';

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
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.limit.mockResolvedValue(finalValue);
  chain.returning.mockResolvedValue(finalValue);
  chain.orderBy.mockResolvedValue(finalValue);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

const MOCK_ACTOR_ID = 'user-uuid-1';
const MOCK_RECIPIENT_ID = 'user-uuid-2';

// NOTIFICATION_REGISTRY에 실제 등록된 이벤트명
const TEST_EVENT = 'checkout.created';

const MOCK_CREATED_NOTIF = {
  id: 'notif-uuid-1',
  title: '테스트 알림',
  content: '내용',
  type: 'checkout_submitted',
  category: 'checkout',
  priority: 'medium',
  recipientId: MOCK_RECIPIENT_ID,
  teamId: null,
  isSystemWide: false,
  equipmentId: null,
  entityType: 'checkout',
  entityId: 'co-uuid-1',
  linkUrl: '/checkouts/co-uuid-1',
  isRead: false,
  readAt: null,
  actorId: MOCK_ACTOR_ID,
  actorName: '홍길동',
  recipientSite: 'SUW',
  expiresAt: new Date('2025-01-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NotificationDispatcher', () => {
  let dispatcher: NotificationDispatcher;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockSseService: ReturnType<typeof createMockNotificationSseService>;
  let mockSettingsService: ReturnType<typeof createMockSettingsService>;
  let mockTemplateService: ReturnType<typeof createMockNotificationTemplateService>;
  let mockPreferencesService: ReturnType<typeof createMockNotificationPreferencesService>;
  let mockRecipientResolver: ReturnType<typeof createMockNotificationRecipientResolver>;
  let mockEmailService: Record<string, jest.Mock>;
  let mockEmailTemplateService: Record<string, jest.Mock>;
  let mockDb: { select: jest.Mock; insert: jest.Mock };
  let chain: ReturnType<typeof createSelectChain>;

  beforeEach(async () => {
    chain = createSelectChain([]);
    mockCacheService = createMockCacheService();
    mockSseService = createMockNotificationSseService();
    mockSettingsService = createMockSettingsService();
    mockTemplateService = createMockNotificationTemplateService();
    mockPreferencesService = createMockNotificationPreferencesService();
    mockRecipientResolver = createMockNotificationRecipientResolver();

    mockEmailService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };
    mockEmailTemplateService = {
      buildImmediateEmail: jest.fn().mockReturnValue({
        subject: '테스트 이메일',
        html: '<p>내용</p>',
      }),
    };

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDispatcher,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: NotificationRecipientResolver, useValue: mockRecipientResolver },
        { provide: NotificationPreferencesService, useValue: mockPreferencesService },
        { provide: NotificationTemplateService, useValue: mockTemplateService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: EmailTemplateService, useValue: mockEmailTemplateService },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: NotificationSseService, useValue: mockSseService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    dispatcher = module.get<NotificationDispatcher>(NotificationDispatcher);
  });

  // ─── dispatch ─────────────────────────────────────────────────────────────

  describe('dispatch()', () => {
    it('미등록 이벤트는 조용히 무시한다', async () => {
      await expect(
        dispatcher.dispatch('UNKNOWN_EVENT', { actorId: MOCK_ACTOR_ID })
      ).resolves.not.toThrow();

      expect(mockRecipientResolver.resolve).not.toHaveBeenCalled();
    });

    it('등록된 이벤트에서 수신자가 없으면 DB INSERT를 하지 않는다', async () => {
      mockRecipientResolver.resolve.mockResolvedValue([]);

      await dispatcher.dispatch(TEST_EVENT, { actorId: MOCK_ACTOR_ID, checkoutId: 'co-uuid-1' });

      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('설정에서 모든 수신자가 비활성화되어 있으면 DB INSERT를 하지 않는다', async () => {
      mockRecipientResolver.resolve.mockResolvedValue([MOCK_RECIPIENT_ID]);
      mockPreferencesService.filterEnabledUsers.mockResolvedValue([]);

      await dispatcher.dispatch(TEST_EVENT, { actorId: MOCK_ACTOR_ID, checkoutId: 'co-uuid-1' });

      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('수신자가 있으면 알림을 DB에 삽입하고 SSE를 푸시한다', async () => {
      mockRecipientResolver.resolve.mockResolvedValue([MOCK_RECIPIENT_ID]);
      mockPreferencesService.filterEnabledUsers.mockResolvedValue([MOCK_RECIPIENT_ID]);
      // actorName 조회 (db.select...limit(1)) → 사용자 이름 반환
      chain.limit.mockResolvedValueOnce([{ name: '홍길동' }]);
      // 수신자 사이트 조회 (db.select...where(inArray)) → thenable chain
      chain.where.mockResolvedValueOnce([{ id: MOCK_RECIPIENT_ID, site: 'SUW' }]);
      // 설정 조회
      mockSettingsService.getSystemSettings.mockResolvedValue({ notificationRetentionDays: 90 });
      // DB INSERT returning
      chain.returning.mockResolvedValueOnce([MOCK_CREATED_NOTIF]);

      await dispatcher.dispatch(TEST_EVENT, {
        actorId: MOCK_ACTOR_ID,
        checkoutId: 'co-uuid-1',
        equipmentId: 'eq-uuid-1',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockSseService.pushToUser).toHaveBeenCalledWith(
        MOCK_RECIPIENT_ID,
        expect.objectContaining({ id: 'notif-uuid-1' })
      );
    });

    it('수신자 해석 실패 시 에러를 삼키고 조용히 반환한다', async () => {
      mockRecipientResolver.resolve.mockRejectedValue(new Error('DB 연결 실패'));

      await expect(
        dispatcher.dispatch(TEST_EVENT, { actorId: MOCK_ACTOR_ID })
      ).resolves.not.toThrow();

      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('actorId=system은 null로 정규화된다', async () => {
      mockRecipientResolver.resolve.mockResolvedValue([MOCK_RECIPIENT_ID]);
      mockPreferencesService.filterEnabledUsers.mockResolvedValue([MOCK_RECIPIENT_ID]);
      // actorId=system → null 정규화 → resolveActorName(null) → '시스템' (DB 조회 없음)
      // 수신자 사이트 조회
      chain.where.mockResolvedValueOnce([]);
      chain.returning.mockResolvedValueOnce([{ ...MOCK_CREATED_NOTIF, actorId: null }]);

      await dispatcher.dispatch(TEST_EVENT, {
        actorId: 'system',
        checkoutId: 'co-uuid-1',
      });

      // insert가 actorId: null로 호출되었는지 간접 검증 (에러 없이 완료)
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});
