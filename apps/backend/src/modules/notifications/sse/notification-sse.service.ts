import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, map, finalize, interval, merge } from 'rxjs';

/**
 * SSE 알림 실시간 푸시 서비스
 *
 * Map<userId, Subject<NotificationEvent>> 로 커넥션을 관리한다.
 * - createStream(userId): SSE Observable 생성 + 30초 heartbeat
 * - pushToUser(userId, data): 특정 사용자에게 알림 전송
 * - pushToUsers(userIds, data): 다수 사용자에게 배치 전송
 *
 * EventSource는 자동 재연결을 지원하므로, 커넥션 끊김 시 클라이언트가 자동 복구.
 * 서버 재시작 시 모든 Subject가 해제되므로 메모리 누수 없음.
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
   * 클라이언트 연결 해제 시 finalize()에서 자동 정리.
   */
  createStream(userId: string): Observable<MessageEvent> {
    // 기존 커넥션이 있으면 재사용 (같은 사용자 다중 탭 = 같은 Subject)
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Subject<SseNotificationPayload>());
      this.logger.debug(`SSE 커넥션 생성: userId=${userId}`);
    }

    const subject = this.connections.get(userId)!;

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
        this.logger.debug(`SSE 구독 해제: userId=${userId}`);
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
      this.logger.debug(`SSE 강제 종료: userId=${userId}`);
    }
  }

  /**
   * 30초 주기 heartbeat 시작
   *
   * SSE 커넥션은 프록시/로드밸런서에 의해 타임아웃될 수 있으므로,
   * 주기적 heartbeat(comment)로 커넥션 유지.
   * NestJS의 경우 빈 comment는 클라이언트에서 무시됨.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      // closed된 Subject 정리
      for (const [userId, subject] of this.connections) {
        if (subject.closed) {
          this.connections.delete(userId);
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

    this.logger.log('SSE 서비스 종료: 모든 커넥션 해제');
  }
}
