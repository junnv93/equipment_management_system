import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_REGISTRY } from '../config/notification-registry';
import { NotificationDispatcher } from '../services/notification-dispatcher';

/**
 * 범용 이벤트 리스너 (단일 리스너!)
 *
 * 27개 @OnEvent 핸들러 대신 1개 범용 리스너.
 * NOTIFICATION_REGISTRY에 등록된 모든 이벤트에 대해 리스너를 자동 등록한다.
 * 레지스트리에 이벤트를 추가하면 자동으로 처리됨 — 코드 변경 0.
 */
@Injectable()
export class NotificationEventListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  onModuleInit(): void {
    const eventNames = Object.keys(NOTIFICATION_REGISTRY);

    for (const eventName of eventNames) {
      this.eventEmitter.on(eventName, (payload: Record<string, unknown>) => {
        // fire-and-forget: 알림 실패가 비즈니스 로직을 차단하지 않음
        this.dispatcher.dispatch(eventName, payload).catch((err) => {
          this.logger.error(
            `알림 디스패치 실패 [${eventName}]: ${err instanceof Error ? err.message : String(err)}`,
            err instanceof Error ? err.stack : undefined
          );
        });
      });
    }

    this.logger.log(`${eventNames.length}개 이벤트 리스너 등록 완료`);
  }
}
