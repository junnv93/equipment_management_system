import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { NOTIFICATION_REGISTRY } from '../config/notification-registry';
import { NOTIFICATION_EVENTS, EVENT_TO_NOTIFICATION_TYPE } from '../events/notification-events';
import { NotificationRecipientResolver } from './notification-recipient-resolver';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationTemplateService } from './notification-template.service';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import { NotificationSseService, SseNotificationPayload } from '../sse/notification-sse.service';
import { SettingsService } from '../../settings/settings.service';
import { NOTIFICATION_CONFIG } from '@equipment-management/shared-constants';

/**
 * 알림 디스패처 (배치 인식)
 *
 * 이벤트 수신 → 수신자 해석 → 설정 필터링 → DB 배치 삽입 → SSE 푸시
 * 전체 파이프라인을 오케스트레이션한다.
 */

// SSOT: @equipment-management/shared-constants
const DEFAULT_NOTIFICATION_TTL_DAYS = NOTIFICATION_CONFIG.DEFAULT_TTL_DAYS;

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly recipientResolver: NotificationRecipientResolver,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly templateService: NotificationTemplateService,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
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

    const cacheKey = `${CACHE_KEY_PREFIXES.ACTOR_NAME}${actorId}`;
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

      // 수신자 사이트 일괄 조회 (감사 추적 + 관리자 사이트 스코핑용)
      // 의식적 트레이드오프: RecipientResolver가 이미 users 테이블을 쿼리하지만,
      // resolver의 반환 타입을 string[] → {id, site}[]로 변경하면 4개 전략 + composite 로직
      // 전부 수정 필요 (blast radius 큼). PK IN 조회 1회(~1ms)는 수용 가능.
      const recipientSiteMap = new Map<string, string | null>();
      try {
        const userSites = await this.db
          .select({ id: schema.users.id, site: schema.users.site })
          .from(schema.users)
          .where(inArray(schema.users.id, enabledIds));
        for (const u of userSites) {
          recipientSiteMap.set(u.id, u.site ?? null);
        }
      } catch (err) {
        this.logger.warn(
          `수신자 사이트 조회 실패, recipientSite=null로 계속: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      let retentionDays = DEFAULT_NOTIFICATION_TTL_DAYS;
      try {
        const settings = await this.settingsService.getSystemSettings();
        retentionDays = settings.notificationRetentionDays;
      } catch {
        this.logger.warn('시스템 설정 조회 실패, 기본 보관 기간 사용');
      }
      const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
      const type = EVENT_TO_NOTIFICATION_TYPE[eventName as keyof typeof EVENT_TO_NOTIFICATION_TYPE];

      const records = enabledIds.map((userId) => ({
        title: notification.title,
        content: notification.content,
        type,
        category: notification.category,
        priority: notification.priority,
        recipientId: userId,
        teamId: null, // 개인 알림 (팀 알림이 아님)
        isSystemWide: false, // 개인 알림 (시스템 전체 알림이 아님)
        equipmentId: notification.equipmentId ?? null,
        entityType: notification.entityType,
        entityId: notification.entityId || null,
        linkUrl: notification.linkUrl,
        isRead: false, // 명시적 초기값
        readAt: null,
        actorId: actorId || null,
        actorName: resolvedActorName || null,
        recipientSite: recipientSiteMap.get(userId) ?? null,
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
        this.cacheService.delete(`${CACHE_KEY_PREFIXES.NOTIFICATION}unread:${userId}`);
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

      // === Stage 6: 이메일 발송 (config.emailEnabled인 경우만) ===
      await this.sendEmailNotifications(eventName, config, enabledIds, enrichedPayload);
    } catch (err) {
      this.logger.error(
        `[${eventName}] 예상치 못한 오류`,
        err instanceof Error ? err.stack : String(err)
      );
    }
  }

  /**
   * Stage 6: 이메일 알림 발송
   *
   * emailEnabled가 true인 이벤트에 대해서만 동작.
   * 이메일 수신을 opt-in한 사용자에게만 발송한다.
   * fire-and-forget: 개별 실패가 다른 수신자에 영향을 주지 않는다.
   */
  private async sendEmailNotifications(
    eventName: string,
    config: (typeof NOTIFICATION_REGISTRY)[string],
    enabledIds: string[],
    enrichedPayload: Record<string, unknown>
  ): Promise<void> {
    if (!config.emailEnabled) return;

    try {
      // 이메일 수신 opt-in 사용자 필터
      const emailUserIds = await this.preferencesService.filterEmailEnabledUsers(enabledIds);
      if (emailUserIds.length === 0) {
        this.logger.debug(`${eventName}: 이메일 수신 활성화된 사용자 없음`);
        return;
      }

      // 이메일 주소 일괄 조회
      const userEmails = await this.db
        .select({ id: schema.users.id, email: schema.users.email })
        .from(schema.users)
        .where(inArray(schema.users.id, emailUserIds));

      const emailMap = new Map(userEmails.map((u) => [u.id, u.email]));

      // 이벤트별 템플릿 빌드
      const emailContent = this.buildEmailContent(eventName, enrichedPayload);
      if (!emailContent) {
        this.logger.warn(`${eventName}: 이메일 템플릿 매핑 없음, 이메일 발송 건너뜀`);
        return;
      }

      // 각 사용자에게 이메일 발송 (fire-and-forget, 개별 실패 격리)
      let successCount = 0;
      let failCount = 0;

      for (const userId of emailUserIds) {
        const email = emailMap.get(userId);
        if (!email) continue;

        try {
          await this.emailService.sendMail({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html,
          });
          successCount++;
        } catch (err) {
          failCount++;
          this.logger.warn(
            `[${eventName}] 이메일 발송 실패 (userId=${userId}): ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      this.logger.log(`${eventName}: 이메일 발송 완료 (성공: ${successCount}, 실패: ${failCount})`);
    } catch (err) {
      this.logger.error(
        `[${eventName}] 이메일 발송 단계 실패`,
        err instanceof Error ? err.stack : String(err)
      );
    }
  }

  /**
   * 이벤트명에 따라 적절한 이메일 템플릿을 빌드한다.
   */
  private buildEmailContent(
    eventName: string,
    payload: Record<string, unknown>
  ): { subject: string; html: string } | null {
    const linkUrl = payload.linkUrl as string | undefined;

    switch (eventName) {
      case NOTIFICATION_EVENTS.CALIBRATION_OVERDUE:
        return this.emailTemplateService.buildCalibrationOverdueEmail({
          equipmentName: payload.equipmentName as string,
          managementNumber: payload.managementNumber as string,
          nextCalibrationDate: payload.nextCalibrationDate as string,
          linkUrl: linkUrl ?? '',
        });

      case NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON:
        return this.emailTemplateService.buildCalibrationDueSoonEmail({
          equipmentName: payload.equipmentName as string,
          managementNumber: payload.managementNumber as string,
          daysLeft: payload.daysUntil as number,
          dueDate: (payload.nextCalibrationDate as string) ?? '',
          linkUrl: linkUrl ?? '',
        });

      case NOTIFICATION_EVENTS.CHECKOUT_OVERDUE:
        return this.emailTemplateService.buildCheckoutOverdueEmail({
          equipmentName: payload.equipmentName as string,
          managementNumber: payload.managementNumber as string,
          expectedReturnDate: payload.expectedReturnDate as string,
          checkoutId: payload.checkoutId as string,
          linkUrl: linkUrl ?? '',
        });

      default:
        return null;
    }
  }
}
