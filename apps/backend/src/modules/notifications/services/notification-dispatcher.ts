import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { NOTIFICATION_REGISTRY } from '../config/notification-registry';
import { EVENT_TO_NOTIFICATION_TYPE } from '../events/notification-events';
import { NotificationRecipientResolver } from './notification-recipient-resolver';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationTemplateService } from './notification-template.service';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';
import { NotificationSseService, SseNotificationPayload } from '../sse/notification-sse.service';
import { SettingsService } from '../../settings/settings.service';
import { NOTIFICATION_CONFIG, UUID_TEST_REGEX } from '@equipment-management/shared-constants';

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
   * actorId 정규화 — Anti-Corruption Layer
   *
   * emit 사이트가 전달하는 다양한 actorId 형식을 DB uuid 컬럼에 안전한 값으로 변환.
   * 이 메서드가 유일한 actorId→DB 변환 지점이며, 40+ emit 사이트를 개별 수정할 필요 없음.
   *
   * 변환 규칙:
   *   - SYSTEM_ACTOR_ID ('system') → null (스케줄러 자동화 이벤트)
   *   - falsy (빈 문자열, null, undefined) → null (emit 사이트 방어적 폴백)
   *   - 유효한 UUID → 그대로 반환 (사용자 액션)
   *   - 비-UUID 문자열 → null + warn 로그 (미래 emit 사이트 방어)
   */
  private normalizeActorForDb(actorId: string | null | undefined): string | null {
    if (!actorId || actorId === NOTIFICATION_CONFIG.SYSTEM_ACTOR_ID) return null;
    if (UUID_TEST_REGEX.test(actorId)) return actorId;

    this.logger.warn(`비-UUID actorId 감지, null로 정규화: "${actorId}"`);
    return null;
  }

  /**
   * actorId → actorName 중앙 해석
   *
   * 40+ emit 사이트가 actorName을 비워두어도 디스패처에서 DB 조회로 해석.
   * 5분 인메모리 캐시로 actorId당 최초 1회만 DB hit.
   *
   * @param dbActorId - normalizeActorForDb()를 거친 정규화된 actorId (null 또는 유효 UUID)
   */
  private async resolveActorName(dbActorId: string | null): Promise<string | null> {
    if (!dbActorId) return '시스템';

    const cacheKey = `${CACHE_KEY_PREFIXES.ACTOR_NAME}${dbActorId}`;
    const cached = this.cacheService.get<string>(cacheKey);
    if (cached) return cached;

    try {
      const [user] = await this.db
        .select({ name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, dbActorId))
        .limit(1);

      const name = user?.name || null;
      if (name) this.cacheService.set(cacheKey, name, 5 * 60 * 1000);
      return name;
    } catch (err) {
      this.logger.warn(
        `actorName 조회 실패 (actorId=${dbActorId}): ${err instanceof Error ? err.message : String(err)}`
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
      // === Stage 1: actorId 정규화 + actorName 중앙 해석 ===
      const rawActorId = payload.actorId as string | undefined;
      const dbActorId = this.normalizeActorForDb(rawActorId);
      const resolvedActorName =
        (payload.actorName as string) || (await this.resolveActorName(dbActorId));
      const enrichedPayload = { ...payload, actorName: resolvedActorName || '' };

      // === Stage 2: 수신자 해석 (실패 → early return) ===
      // recipientResolver에는 raw actorId를 전달 — 'system'이면 자기 자신 제외 불필요 (의도적)
      let recipientIds: string[];
      try {
        recipientIds = await this.recipientResolver.resolve(
          config.recipientStrategy,
          enrichedPayload,
          rawActorId ?? ''
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
        actorId: dbActorId,
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
      // SSE 푸시는 RxJS `Subject.next()` (sync) 이지만 이 메서드 전체가 NotificationEventListener의
      // sync 콜백 안에서 fire-and-forget 실행되므로, HTTP 응답 시점에 SSE 푸시 완료 보장 없음.
      // 구독자가 없는 유저에게는 pushToUser 가 no-op (line 242 근처 warn 로그).
      // 자세한 정책: docs/references/backend-patterns.md "SSE 일관성 보장 범위".
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

      // === Stage 6: 즉시 이메일 발송 (emailStrategy='immediate'인 경우만) ===
      if (config.emailStrategy === 'immediate') {
        await this.sendImmediateEmail(
          eventName,
          notification.title,
          notification.content,
          enabledIds
        );
      }
    } catch (err) {
      this.logger.error(
        `[${eventName}] 예상치 못한 오류`,
        err instanceof Error ? err.stack : String(err)
      );
    }
  }

  /**
   * Stage 6: 즉시 이메일 발송 (승인 요청/결과)
   *
   * emailStrategy='immediate'인 이벤트에 대해 즉시 이메일을 발송한다.
   * titleTemplate/contentTemplate 렌더링 결과를 범용 이메일 템플릿으로 변환.
   * fire-and-forget: 이메일 실패가 인앱 알림에 영향을 주지 않는다.
   */
  private async sendImmediateEmail(
    eventName: string,
    title: string,
    content: string,
    enabledIds: string[]
  ): Promise<void> {
    try {
      const emailUserIds = await this.preferencesService.filterEmailEnabledUsers(enabledIds);
      if (emailUserIds.length === 0) return;

      const users = await this.db
        .select({ id: schema.users.id, email: schema.users.email })
        .from(schema.users)
        .where(inArray(schema.users.id, emailUserIds));

      const emailContent = this.emailTemplateService.buildImmediateEmail(title, content);

      const results = await Promise.all(
        users
          .filter((u) => u.email)
          .map((u) =>
            this.emailService
              .sendMail({ to: u.email, subject: emailContent.subject, html: emailContent.html })
              .then(() => 'success' as const)
              .catch(() => 'failed' as const)
          )
      );

      const success = results.filter((r) => r === 'success').length;
      const failed = results.filter((r) => r === 'failed').length;
      if (success > 0 || failed > 0) {
        this.logger.log(`${eventName}: 즉시 이메일 발송 (성공: ${success}, 실패: ${failed})`);
      }
    } catch (err) {
      this.logger.warn(
        `[${eventName}] 즉시 이메일 발송 실패: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
