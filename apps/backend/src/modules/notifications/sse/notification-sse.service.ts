import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, map, finalize, interval, merge } from 'rxjs';

/**
 * SSE 알림 실시간 푸시 서비스
 *
 * Map<userId, Subject<NotificationEvent>> 로 커넥션을 관리한다.
 * - createStream(userId): SSE Observable 생성 + 30초 heartbeat
 * - pushToUser(userId, data): 특정 사용자에게 알림 전송
 * - pushToUsers(userIds, data): 다수 사용자에게 배치 전송
 * - broadcastApprovalChanged(): 모든 연결된 사용자에게 approval-changed 이벤트 전송
 *
 * 다중 탭 지원: 같은 userId → 같은 Subject 재사용 (push 1번 → 모든 탭 수신)
 * 수명 관리: Reference Counting — 마지막 구독 해제 시 Subject 자동 정리
 */

export interface SseNotificationPayload {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  linkUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  equipmentId: string | null;
  createdAt: Date;
}

// NestJS @Sse()가 기대하는 MessageEvent 형식
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Injectable()
export class NotificationSseService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationSseService.name);

  // userId → Subject (각 사용자별 SSE 스트림)
  private readonly connections = new Map<string, Subject<SseNotificationPayload>>();

  // userId → 활성 구독 수 (Reference Counting)
  // 마지막 구독 해제 시 Subject 정리 트리거
  private readonly subscriptionCounts = new Map<string, number>();

  // heartbeat interval ID
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  // heartbeat 주기 (30초)
  private readonly HEARTBEAT_INTERVAL_MS = 30_000;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * 사용자별 SSE 스트림 생성
   *
   * Observable<MessageEvent>를 반환하여 NestJS @Sse()와 호환.
   * 클라이언트 연결 해제 시 finalize()에서 refcount 감소 → 마지막 구독이면 Subject 정리.
   *
   * 다중 탭: 같은 userId → 같은 Subject 공유 → push 1번으로 모든 탭에 전달
   */
  createStream(userId: string): Observable<MessageEvent> {
    // 기존 커넥션이 없으면 생성 (다중 탭 = 같은 Subject 공유)
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Subject<SseNotificationPayload>());
      this.subscriptionCounts.set(userId, 0);
      this.logger.debug(`SSE 커넥션 생성: userId=${userId}`);
    }

    const subject = this.connections.get(userId)!;
    const newCount = (this.subscriptionCounts.get(userId) ?? 0) + 1;
    this.subscriptionCounts.set(userId, newCount);
    this.logger.debug(`SSE 구독 추가: userId=${userId}, 활성 구독=${newCount}`);

    // 알림 스트림
    const notifications$ = subject.pipe(
      map((notification) => ({
        data: notification,
        type: 'notification',
        id: notification.id,
      }))
    );

    // Heartbeat 스트림 (30초마다 SSE 이벤트로 커넥션 유지)
    // 프록시/로드밸런서가 유휴 연결을 종료하지 않도록 주기적 데이터 전송
    const heartbeat$ = interval(this.HEARTBEAT_INTERVAL_MS).pipe(
      map(() => ({ data: '', type: 'heartbeat' }) as MessageEvent)
    );

    return merge(notifications$, heartbeat$).pipe(
      finalize(() => {
        const remaining = (this.subscriptionCounts.get(userId) ?? 1) - 1;
        this.subscriptionCounts.set(userId, remaining);
        this.logger.debug(`SSE 구독 해제: userId=${userId}, 남은 구독=${remaining}`);

        // 마지막 구독이 해제되면 Subject를 정리하여 메모리 누수 방지
        if (remaining <= 0) {
          const s = this.connections.get(userId);
          if (s && !s.closed) {
            s.complete();
          }
          this.connections.delete(userId);
          this.subscriptionCounts.delete(userId);
          this.logger.debug(`SSE 커넥션 정리 (마지막 구독 해제): userId=${userId}`);
        }
      })
    );
  }

  /**
   * 특정 사용자에게 알림 푸시
   */
  pushToUser(userId: string, notification: SseNotificationPayload): void {
    const subject = this.connections.get(userId);
    if (subject && !subject.closed) {
      subject.next(notification);
      this.logger.debug(`SSE 푸시: userId=${userId}, notificationId=${notification.id}`);
    }
  }

  /**
   * 다수 사용자에게 배치 푸시
   */
  pushToUsers(userIds: string[], notification: SseNotificationPayload): void {
    for (const userId of userIds) {
      this.pushToUser(userId, notification);
    }
  }

  /**
   * 모든 연결된 사용자에게 approval-changed 이벤트 브로드캐스트
   *
   * 승인 관련 도메인 이벤트 발생 시 호출하여 프론트엔드의
   * approval counts 쿼리를 무효화하게 한다.
   * 2분 폴링 → SSE 실시간 갱신으로 전환.
   */
  broadcastApprovalChanged(triggerEvent: string): void {
    const activeCount = this.connections.size;
    if (activeCount === 0) return;

    for (const [userId, subject] of this.connections) {
      if (!subject.closed) {
        // approval-changed 이벤트는 SseNotificationPayload와 다른 형태이므로
        // Subject.next 대신 직접 MessageEvent를 사용자에게 전달할 수 없다.
        // 대신 특수한 notification payload로 승인 변경을 알린다.
        subject.next({
          id: `approval-changed-${Date.now()}`,
          title: '__approval_changed__',
          content: triggerEvent,
          category: 'approval',
          priority: 'low',
          linkUrl: null,
          entityType: 'approval',
          entityId: null,
          equipmentId: null,
          createdAt: new Date(),
        });
      }
    }

    this.logger.debug(`승인 변경 브로드캐스트: ${activeCount}명 사용자, trigger=${triggerEvent}`);
  }

  /**
   * 연결된 사용자 수 조회 (모니터링용)
   */
  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 특정 사용자 커넥션 강제 종료 (로그아웃 시)
   */
  disconnectUser(userId: string): void {
    const subject = this.connections.get(userId);
    if (subject) {
      subject.complete();
      this.connections.delete(userId);
      this.subscriptionCounts.delete(userId);
      this.logger.debug(`SSE 강제 종료: userId=${userId}`);
    }
  }

  /**
   * 30초 주기 heartbeat 시작
   *
   * closed된 Subject(예외 상황으로 refcount 오차 발생 시)를 주기적으로 정리.
   * 정상 흐름에서는 finalize()의 refcount 방식이 처리하므로 이 정리는 안전망 역할.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [userId, subject] of this.connections) {
        if (subject.closed) {
          this.connections.delete(userId);
          this.subscriptionCounts.delete(userId);
          this.logger.debug(`SSE 정리 (closed Subject): userId=${userId}`);
        }
      }
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * 모듈 종료 시 모든 커넥션 정리
   */
  onModuleDestroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    for (const [userId, subject] of this.connections) {
      subject.complete();
      this.connections.delete(userId);
    }
    this.subscriptionCounts.clear();

    this.logger.log('SSE 서비스 종료: 모든 커넥션 해제');
  }
}
