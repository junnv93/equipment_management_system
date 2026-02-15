import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { NOTIFICATION_REGISTRY } from '../config/notification-registry';
import { NotificationRecipientResolver } from './notification-recipient-resolver';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationTemplateService } from './notification-template.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { NotificationSseService, SseNotificationPayload } from '../sse/notification-sse.service';
import { SettingsService } from '../../settings/settings.service';

/**
 * 알림 디스패처 (배치 인식)
 *
 * 이벤트 수신 → 수신자 해석 → 설정 필터링 → DB 배치 삽입 → SSE 푸시
 * 전체 파이프라인을 오케스트레이션한다.
 */

// 기본 90일 만료 (DB 설정 조회 실패 시 폴백)
const DEFAULT_NOTIFICATION_TTL_DAYS = 90;

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly recipientResolver: NotificationRecipientResolver,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly templateService: NotificationTemplateService,
    private readonly cacheService: SimpleCacheService,
    private readonly sseService: NotificationSseService,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * actorId → actorName 중앙 해석
   *
   * 40+ emit 사이트가 actorName을 비워두어도 디스패처에서 DB 조회로 해석.
   * 5분 인메모리 캐시로 actorId당 최초 1회만 DB hit.
   */
  private async resolveActorName(actorId: string): Promise<string | null> {
    if (!actorId || actorId === 'system') return '시스템';

    const cacheKey = `actor:name:${actorId}`;
    const cached = this.cacheService.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const [user] = await this.db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, actorId))
        .limit(1);

      const name = user?.name || null;
      if (name) this.cacheService.set(cacheKey, name, 5 * 60 * 1000);
      return name;
    } catch (err) {
      this.logger.warn(
        `actorName 조회 실패 (actorId=${actorId}): ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    }
  }

  /**
   * 이벤트를 받아 알림을 생성하고 배치 삽입한다.
   *
   * fire-and-forget: 알림 실패가 비즈니스 로직을 차단하지 않는다.
   *
   * 5단계 파이프라인 (각 단계 독립 에러 격리):
   *   1. actorName 해석
   *   2. 수신자 해석
   *   3. 설정 필터링
   *   4. 템플릿 렌더링 + DB 배치 삽입
   *   5. 캐시 무효화 + SSE 푸시
   */
  async dispatch(eventName: string, payload: Record<string, unknown>): Promise<void> {
    const config = NOTIFICATION_REGISTRY[eventName];
    if (!config) {
      this.logger.debug(`미등록 이벤트 무시: ${eventName}`);
      return;
    }

    try {
      // === Stage 1: actorName 중앙 해석 ===
      const actorId = payload.actorId as string;
      const resolvedActorName =
        (payload.actorName as string) || (await this.resolveActorName(actorId));
      const enrichedPayload = { ...payload, actorName: resolvedActorName || '' };

      // === Stage 2: 수신자 해석 (실패 → early return) ===
      let recipientIds: string[];
      try {
        recipientIds = await this.recipientResolver.resolve(
          config.recipientStrategy,
          enrichedPayload,
          actorId
        );
      } catch (err) {
        this.logger.error(
          `[${eventName}] 수신자 해석 실패`,
          err instanceof Error ? err.stack : String(err)
        );
        return;
      }

      if (recipientIds.length === 0) {
        this.logger.debug(`${eventName}: 수신자 없음, 알림 생성 건너뜀`);
        return;
      }

      // === Stage 3: 설정 필터링 ===
      const enabledIds = await this.preferencesService.filterEnabledUsers(
        recipientIds,
        config.category
      );

      if (enabledIds.length === 0) {
        this.logger.debug(`${eventName}: 모든 수신자가 알림 비활성화, 건너뜀`);
        return;
      }

      // === Stage 4: 템플릿 렌더링 + DB 배치 삽입 (실패 → early return) ===
      const notification = this.templateService.buildNotification(eventName, enrichedPayload);

      let retentionDays = DEFAULT_NOTIFICATION_TTL_DAYS;
      try {
        const settings = await this.settingsService.getSystemSettings();
        retentionDays = settings.notificationRetentionDays;
      } catch {
        this.logger.warn('시스템 설정 조회 실패, 기본 보관 기간 사용');
      }
      const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
      const type = eventName.replace(/\./g, '_');

      const records = enabledIds.map((userId) => ({
        title: notification.title,
        content: notification.content,
        type,
        category: notification.category,
        priority: notification.priority,
        recipientId: userId,
        equipmentId: notification.equipmentId ?? null,
        entityType: notification.entityType,
        entityId: notification.entityId || null,
        linkUrl: notification.linkUrl,
        actorId: actorId || null,
        actorName: resolvedActorName || null,
        expiresAt,
      }));

      let created: Array<typeof schema.notifications.$inferSelect>;
      try {
        created = await this.db.insert(schema.notifications).values(records).returning();
      } catch (err) {
        this.logger.error(
          `[${eventName}] DB 삽입 실패`,
          err instanceof Error ? err.stack : String(err)
        );
        return;
      }

      // === Stage 5: 캐시 무효화 + SSE 푸시 (개별 사용자별 격리) ===
      for (const userId of enabledIds) {
        this.cacheService.delete(`notification:unread:${userId}`);
      }

      for (const record of created) {
        try {
          if (record.recipientId) {
            const ssePayload: SseNotificationPayload = {
              id: record.id,
              title: record.title,
              content: record.content,
              category: record.category,
              priority: record.priority,
              linkUrl: record.linkUrl,
              entityType: record.entityType,
              entityId: record.entityId,
              equipmentId: record.equipmentId,
              createdAt: record.createdAt,
            };
            this.sseService.pushToUser(record.recipientId, ssePayload);
          }
        } catch (sseErr) {
          this.logger.warn(
            `[${eventName}] SSE 푸시 실패 (userId=${record.recipientId}): ${sseErr instanceof Error ? sseErr.message : String(sseErr)}`
          );
        }
      }

      this.logger.log(
        `${eventName}: ${created.length}건 알림 생성 (수신자: ${enabledIds.length}명)`
      );
    } catch (err) {
      this.logger.error(
        `[${eventName}] 예상치 못한 오류`,
        err instanceof Error ? err.stack : String(err)
      );
    }
  }
}
