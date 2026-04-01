import { NotificationSseService, SseNotificationPayload } from '../sse/notification-sse.service';

const MOCK_USER_ID = 'user-uuid-1';
const MOCK_NOTIFICATION: SseNotificationPayload = {
  id: 'notif-uuid-1',
  title: '테스트 알림',
  content: '알림 내용',
  category: 'checkout',
  priority: 'medium',
  linkUrl: '/checkouts/co-uuid-1',
  entityType: 'checkout',
  entityId: 'co-uuid-1',
  equipmentId: null,
  createdAt: new Date(),
};

describe('NotificationSseService', () => {
  let service: NotificationSseService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new NotificationSseService();
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.useRealTimers();
  });

  // ─── createStream ─────────────────────────────────────────────────────────

  describe('createStream()', () => {
    it('새 스트림을 생성하고 Observable을 반환한다', () => {
      const stream$ = service.createStream(MOCK_USER_ID);

      expect(stream$).toBeDefined();
      expect(stream$.subscribe).toBeDefined();
    });

    it('같은 userId로 두 번 구독해도 같은 Subject를 공유한다', () => {
      const stream1$ = service.createStream(MOCK_USER_ID);
      const stream2$ = service.createStream(MOCK_USER_ID);

      // 두 스트림 모두 유효함
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      const sub1 = stream1$.subscribe((v) => received1.push(v));
      const sub2 = stream2$.subscribe((v) => received2.push(v));

      service.pushToUser(MOCK_USER_ID, MOCK_NOTIFICATION);

      // 두 구독 모두 동일한 이벤트를 수신
      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it('마지막 구독 해제 시 Subject가 정리된다', () => {
      const stream$ = service.createStream(MOCK_USER_ID);
      const sub = stream$.subscribe(() => {});

      expect(service.getActiveConnectionCount()).toBe(1);

      sub.unsubscribe();

      expect(service.getActiveConnectionCount()).toBe(0);
    });
  });

  // ─── pushToUser ───────────────────────────────────────────────────────────

  describe('pushToUser()', () => {
    it('연결된 사용자에게 알림을 푸시한다', () => {
      const received: unknown[] = [];
      const sub = service.createStream(MOCK_USER_ID).subscribe((event) => {
        received.push(event);
      });

      service.pushToUser(MOCK_USER_ID, MOCK_NOTIFICATION);

      expect(received).toHaveLength(1);

      sub.unsubscribe();
    });

    it('연결되지 않은 사용자에게 푸시해도 에러가 발생하지 않는다', () => {
      expect(() => {
        service.pushToUser('nonexistent-user', MOCK_NOTIFICATION);
      }).not.toThrow();
    });
  });

  // ─── pushToUsers ──────────────────────────────────────────────────────────

  describe('pushToUsers()', () => {
    it('여러 사용자에게 동시에 알림을 푸시한다', () => {
      const userId2 = 'user-uuid-2';
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      const sub1 = service.createStream(MOCK_USER_ID).subscribe((e) => received1.push(e));
      const sub2 = service.createStream(userId2).subscribe((e) => received2.push(e));

      service.pushToUsers([MOCK_USER_ID, userId2], MOCK_NOTIFICATION);

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });
  });

  // ─── broadcastApprovalChanged ─────────────────────────────────────────────

  describe('broadcastApprovalChanged()', () => {
    it('연결된 모든 사용자에게 approval-changed 이벤트를 브로드캐스트한다', () => {
      const userId2 = 'user-uuid-2';
      const received1: unknown[] = [];
      const received2: unknown[] = [];

      const sub1 = service.createStream(MOCK_USER_ID).subscribe((e) => received1.push(e));
      const sub2 = service.createStream(userId2).subscribe((e) => received2.push(e));

      service.broadcastApprovalChanged('checkout.approved');

      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it('연결된 사용자가 없으면 아무것도 하지 않는다', () => {
      expect(() => {
        service.broadcastApprovalChanged('checkout.approved');
      }).not.toThrow();
    });
  });

  // ─── disconnectUser ───────────────────────────────────────────────────────

  describe('disconnectUser()', () => {
    it('사용자 연결을 강제 종료한다', () => {
      const sub = service.createStream(MOCK_USER_ID).subscribe(() => {});

      expect(service.getActiveConnectionCount()).toBe(1);

      service.disconnectUser(MOCK_USER_ID);

      expect(service.getActiveConnectionCount()).toBe(0);

      sub.unsubscribe();
    });

    it('존재하지 않는 사용자를 disconnect해도 에러가 없다', () => {
      expect(() => {
        service.disconnectUser('nonexistent');
      }).not.toThrow();
    });
  });

  // ─── getActiveConnectionCount ─────────────────────────────────────────────

  describe('getActiveConnectionCount()', () => {
    it('활성 커넥션 수를 반환한다', () => {
      expect(service.getActiveConnectionCount()).toBe(0);

      const sub = service.createStream(MOCK_USER_ID).subscribe(() => {});

      expect(service.getActiveConnectionCount()).toBe(1);

      sub.unsubscribe();

      expect(service.getActiveConnectionCount()).toBe(0);
    });
  });

  // ─── onModuleDestroy ──────────────────────────────────────────────────────

  describe('onModuleDestroy()', () => {
    it('모든 커넥션을 정리한다', () => {
      service.createStream(MOCK_USER_ID).subscribe(() => {});
      service.createStream('user-uuid-2').subscribe(() => {});

      service.onModuleDestroy();

      expect(service.getActiveConnectionCount()).toBe(0);
    });
  });
});
