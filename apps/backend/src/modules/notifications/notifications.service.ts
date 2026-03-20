import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { and, desc, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import type { SQL } from 'drizzle-orm';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import {
  DEFAULT_PAGE_SIZE,
  NOTIFICATION_RETENTION_DAYS,
} from '@equipment-management/shared-constants';
import { NotificationTypeValues } from '@equipment-management/schemas';
import { likeContains, safeIlike } from '../../common/utils/like-escape';

/**
 * 알림 서비스 (DB 기반)
 *
 * 인메모리 배열 → Drizzle ORM 쿼리로 전면 교체.
 * 알림 CRUD + 읽음 처리 + 미읽음 카운트를 담당.
 * 알림 생성은 NotificationDispatcher가 담당 (이 서비스는 저수준 DB 레이어).
 */

/**
 * 사용자의 알림 소유권 OR 조건을 빌드한다 (SSOT).
 *
 * WHERE (recipientId = userId OR teamId = userTeamId OR isSystemWide = true)
 *
 * 개인 알림 + 팀 브로드캐스트 + 시스템 공지 3가지를 포괄.
 * markAllAsRead에서는 isSystemWide를 의도적으로 제외한다
 * (시스템 공지는 공유 단일 행 — 한 사용자가 읽음 처리하면 전체 영향).
 */
function buildOwnershipCondition(
  userId: string,
  userTeamId: string | null,
  options?: { excludeSystemWide?: boolean }
): SQL {
  const conditions: SQL[] = [eq(schema.notifications.recipientId, userId)];

  if (userTeamId) {
    conditions.push(eq(schema.notifications.teamId, userTeamId));
  }

  if (!options?.excludeSystemWide) {
    conditions.push(eq(schema.notifications.isSystemWide, true));
  }

  return or(...conditions)!;
}

export interface NotificationRecord {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string;
  priority: string;
  recipientId: string | null;
  teamId: string | null;
  isSystemWide: boolean;
  equipmentId: string | null;
  entityType: string | null;
  entityId: string | null;
  linkUrl: string | null;
  isRead: boolean;
  readAt: Date | null;
  actorId: string | null;
  actorName: string | null;
  recipientSite: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FindAllQuery {
  recipientId?: string;
  teamId?: string;
  types?: string[];
  priorities?: string[];
  category?: string;
  isRead?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 사용자의 알림 목록을 조회한다.
   *
   * WHERE (recipientId = userId OR teamId = userTeamId OR isSystemWide = true)
   */
  async findAllForUser(
    userId: string,
    userTeamId: string | null,
    query: FindAllQuery
  ): Promise<{
    items: NotificationRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      category,
      types,
      priorities,
      isRead,
      search,
      fromDate,
      toDate,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const conditions = [buildOwnershipCondition(userId, userTeamId)];

    // 추가 필터링
    if (category) {
      conditions.push(eq(schema.notifications.category, category));
    }
    if (types && types.length > 0) {
      conditions.push(inArray(schema.notifications.type, types));
    }
    if (priorities && priorities.length > 0) {
      conditions.push(inArray(schema.notifications.priority, priorities));
    }
    if (isRead !== undefined) {
      conditions.push(eq(schema.notifications.isRead, isRead));
    }
    if (search) {
      conditions.push(
        or(
          safeIlike(schema.notifications.title, likeContains(search)),
          safeIlike(schema.notifications.content, likeContains(search))
        )!
      );
    }
    if (fromDate) {
      conditions.push(gte(schema.notifications.createdAt, new Date(fromDate)));
    }
    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999);
      conditions.push(lte(schema.notifications.createdAt, toDateObj));
    }

    const whereClause = and(...conditions);

    // Count query
    const [{ count }] = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.notifications)
      .where(whereClause);

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    // Data query
    const items = await this.db
      .select()
      .from(schema.notifications)
      .where(whereClause)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items as NotificationRecord[],
      total: totalItems,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 미읽음 알림 개수 (15초 캐시)
   */
  async countUnread(userId: string, userTeamId: string | null): Promise<{ count: number }> {
    const cacheKey = `notification:unread:${userId}`;

    const count = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [result] = await this.db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(schema.notifications)
          .where(
            and(buildOwnershipCondition(userId, userTeamId), eq(schema.notifications.isRead, false))
          );

        return result.count;
      },
      15 // 15초 캐시
    );

    return { count };
  }

  /**
   * 단일 알림 조회 (소유권 검증 포함)
   *
   * IDOR 방어: recipientId/teamId/isSystemWide 3-condition OR로 소유권 검증.
   * 미매칭 시 404 반환 (존재 여부 노출 방지).
   */
  async findOne(
    id: string,
    userId: string,
    userTeamId: string | null
  ): Promise<NotificationRecord> {
    const [notification] = await this.db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.id, id), buildOwnershipCondition(userId, userTeamId)))
      .limit(1);

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: `Notification ID ${id} not found.`,
      });
    }

    return notification as NotificationRecord;
  }

  /**
   * 읽음 표시
   */
  async markAsRead(id: string, userId: string): Promise<NotificationRecord> {
    const now = new Date();

    const [updated] = await this.db
      .update(schema.notifications)
      .set({ isRead: true, readAt: now, updatedAt: now })
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.recipientId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: `Notification ID ${id} not found.`,
      });
    }

    this.cacheService.delete(`notification:unread:${userId}`);
    return updated as NotificationRecord;
  }

  /**
   * 모든 알림 읽음 표시
   */
  async markAllAsRead(
    userId: string,
    userTeamId: string | null
  ): Promise<{ success: boolean; count: number }> {
    const now = new Date();

    // isSystemWide 제외: 시스템 공지는 공유 단일 행 — 한 사용자가 읽음 처리하면 전체 영향
    const result = await this.db
      .update(schema.notifications)
      .set({ isRead: true, readAt: now, updatedAt: now })
      .where(
        and(
          buildOwnershipCondition(userId, userTeamId, { excludeSystemWide: true }),
          eq(schema.notifications.isRead, false)
        )
      )
      .returning({ id: schema.notifications.id });

    this.cacheService.delete(`notification:unread:${userId}`);

    return { success: true, count: result.length };
  }

  /**
   * 알림 삭제
   */
  async remove(id: string, userId: string): Promise<{ id: string; deleted: boolean }> {
    const result = await this.db
      .delete(schema.notifications)
      .where(and(eq(schema.notifications.id, id), eq(schema.notifications.recipientId, userId)))
      .returning({ id: schema.notifications.id });

    if (result.length === 0) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: `Notification ID ${id} not found.`,
      });
    }

    this.cacheService.delete(`notification:unread:${userId}`);
    return { id, deleted: true };
  }

  /**
   * 관리자 알림 현황 조회
   *
   * @SiteScoped가 recipientSite를 query에 주입 (site 스코프).
   * system_admin은 필터 없이 전체 조회.
   * notifications.teamId는 "팀 브로드캐스트 대상"이므로 관리자 필터에 사용하지 않음.
   */
  async findAllAdmin(query: FindAllQuery & { recipientSite?: string }): Promise<{
    items: NotificationRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      category,
      isRead,
      search,
      recipientSite,
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
    } = query;

    const conditions: SQL[] = [];

    // @SiteScoped 인터셉터가 주입한 사이트 필터
    if (recipientSite) {
      conditions.push(eq(schema.notifications.recipientSite, recipientSite));
    }

    if (category) {
      conditions.push(eq(schema.notifications.category, category));
    }
    if (isRead !== undefined) {
      conditions.push(eq(schema.notifications.isRead, isRead));
    }
    if (search) {
      conditions.push(
        or(
          safeIlike(schema.notifications.title, likeContains(search)),
          safeIlike(schema.notifications.content, likeContains(search))
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.notifications)
      .where(whereClause);

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / pageSize);
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select()
      .from(schema.notifications)
      .where(whereClause)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    return {
      items: items as NotificationRecord[],
      total: totalItems,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 배치 삽입 (Dispatcher가 호출)
   */
  async createBatch(
    records: Array<{
      title: string;
      content: string;
      type: string;
      category: string;
      priority: string;
      recipientId?: string | null;
      teamId?: string | null;
      isSystemWide?: boolean;
      equipmentId?: string | null;
      entityType?: string | null;
      entityId?: string | null;
      linkUrl?: string | null;
      actorId?: string | null;
      actorName?: string | null;
      recipientSite?: string | null;
      expiresAt?: Date | null;
    }>
  ): Promise<NotificationRecord[]> {
    if (records.length === 0) return [];

    const inserted = await this.db.insert(schema.notifications).values(records).returning();

    return inserted as NotificationRecord[];
  }

  /**
   * 만료 알림 정리 (스케줄러가 호출)
   *
   * 중요도(priority) × 읽음(isRead) 매트릭스에 따른 차등 보존:
   *
   * | Priority       | 읽음 상태 | 기본 TTL | 유예   | 실질 보존 |
   * |----------------|-----------|---------|--------|-----------|
   * | low            | 무관      | base    | 0일    | base      |
   * | medium         | 읽음      | base    | 0일    | base      |
   * | medium         | 미읽음    | base    | +mediumGrace | base + mediumGrace |
   * | high/critical  | 무관      | base    | +highGrace   | base + highGrace   |
   *
   * base, highGrace, mediumGrace는 SettingsService에서 동적 로드.
   */
  async deleteExpired(options?: {
    highGraceDays?: number;
    mediumUnreadGraceDays?: number;
  }): Promise<number> {
    const now = new Date();

    const highGraceDays = options?.highGraceDays ?? 90;
    const mediumUnreadGraceDays = options?.mediumUnreadGraceDays ?? 30;

    const highGraceMs = highGraceDays * 24 * 60 * 60 * 1000;
    const mediumUnreadGraceMs = mediumUnreadGraceDays * 24 * 60 * 60 * 1000;

    const result = await this.db
      .delete(schema.notifications)
      .where(
        and(
          lte(schema.notifications.expiresAt, now),
          or(
            // 1. low priority → 만료 즉시 삭제
            eq(schema.notifications.priority, 'low'),
            // 2. medium + 읽음 → 만료 즉시 삭제
            and(eq(schema.notifications.priority, 'medium'), eq(schema.notifications.isRead, true)),
            // 3. medium + 미읽음 → mediumUnreadGraceDays 유예 후 삭제
            and(
              eq(schema.notifications.priority, 'medium'),
              eq(schema.notifications.isRead, false),
              lte(schema.notifications.expiresAt, new Date(now.getTime() - mediumUnreadGraceMs))
            ),
            // 4. high/critical → highGraceDays 유예 후 삭제 (읽음 여부 무관)
            and(
              inArray(schema.notifications.priority, ['high', 'critical']),
              lte(schema.notifications.expiresAt, new Date(now.getTime() - highGraceMs))
            )
          )
        )
      )
      .returning({ id: schema.notifications.id });

    if (result.length > 0) {
      this.logger.log(
        `만료 알림 삭제: ${result.length}건 (유예: high=${highGraceDays}d, medium-unread=${mediumUnreadGraceDays}d)`
      );
    }

    return result.length;
  }

  /**
   * 시스템 공지 생성 (레거시 호환 — CalibrationOverdueScheduler 등에서 사용)
   *
   * @param retentionDays 보관 일수 (미지정 시 기본 90일)
   */
  async createSystemNotification(
    title: string,
    content: string,
    priority: string = 'medium',
    retentionDays: number = NOTIFICATION_RETENTION_DAYS
  ): Promise<NotificationRecord> {
    const [created] = await this.db
      .insert(schema.notifications)
      .values({
        title,
        content,
        type: NotificationTypeValues.SYSTEM_ANNOUNCEMENT,
        category: 'system',
        priority,
        isSystemWide: true,
        expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
      })
      .returning();

    return created as NotificationRecord;
  }
}
