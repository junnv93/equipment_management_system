import { pgTable, varchar, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { teams } from './teams';
import { equipment } from './equipment';

// ============================================================================
// 알림 테이블 (Notifications)
// ============================================================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 알림 내용
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    priority: varchar('priority', { length: 10 }).notNull().default('medium'),

    // 수신 대상 (3가지 전략: 개인 / 팀 / 시스템 전체)
    // FK + ON DELETE CASCADE: 수신자/팀이 삭제되면 알림도 함께 정리되어
    // dangling reference 와 IDOR 잠재성을 방지한다.
    recipientId: uuid('recipient_id').references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
    isSystemWide: boolean('is_system_wide').notNull().default(false), // 전체 사용자

    // 관련 엔티티 (딥링크 + 연관 조회)
    // equipment 는 hard delete 가 사실상 없고 disposed 상태로만 전이되지만,
    // 향후 정책 변경 대비 CASCADE 로 안전 fallback.
    equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }), // 'checkout' | 'calibration' 등
    // entityId 는 polymorphic (entityType 별로 다른 테이블 참조) → DB-level FK 불가.
    entityId: uuid('entity_id'),
    linkUrl: varchar('link_url', { length: 300 }), // 프론트엔드 딥링크

    // 읽음 상태
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),

    // 이벤트 발생자
    // SET NULL: 사용자가 떠나도 감사 추적용으로 알림 자체는 보존.
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorName: varchar('actor_name', { length: 100 }),

    // 수신자 사이트 (감사 추적 + 관리자 통계)
    recipientSite: varchar('recipient_site', { length: 20 }),

    // 만료
    expiresAt: timestamp('expires_at'),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // "내 미읽은 알림" 메인 쿼리 최적화
    index('idx_notifications_recipient_read_created').on(
      table.recipientId,
      table.isRead,
      table.createdAt
    ),
    // 팀 알림 조회
    index('idx_notifications_team_created').on(table.teamId, table.createdAt),
    // 시스템 공지 조회
    index('idx_notifications_system_created').on(table.isSystemWide, table.createdAt),
    // 엔티티별 알림 조회
    index('idx_notifications_entity').on(table.entityType, table.entityId),
    // 만료 알림 정리 스케줄러
    index('idx_notifications_expires').on(table.expiresAt),
    // 사이트별 시간순 조회 최적화 (관리자 통계)
    index('idx_notifications_site_created').on(table.recipientSite, table.createdAt),
    // actor_id FK (ON DELETE SET NULL) 의 삭제 경로를 지원하기 위한 인덱스.
    // PostgreSQL 은 FK 컬럼을 자동 인덱싱하지 않아, 사용자 삭제 시 전체 스캔이 발생.
    index('idx_notifications_actor').on(table.actorId),
  ]
);

// 알림 관계 정의
export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [notifications.teamId],
    references: [teams.id],
  }),
  equipment: one(equipment, {
    fields: [notifications.equipmentId],
    references: [equipment.id],
  }),
}));

// ============================================================================
// 알림 설정 테이블 (Notification Preferences)
// ============================================================================

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    // 전체 토글
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),
    emailEnabled: boolean('email_enabled').notNull().default(false),

    // 카테고리별 토글 (7개)
    checkoutEnabled: boolean('checkout_enabled').notNull().default(true),
    calibrationEnabled: boolean('calibration_enabled').notNull().default(true),
    nonConformanceEnabled: boolean('non_conformance_enabled').notNull().default(true),
    disposalEnabled: boolean('disposal_enabled').notNull().default(true),
    equipmentImportEnabled: boolean('equipment_import_enabled').notNull().default(true),
    equipmentEnabled: boolean('equipment_enabled').notNull().default(true),
    systemEnabled: boolean('system_enabled').notNull().default(true),
    calibrationPlanEnabled: boolean('calibration_plan_enabled').notNull().default(true),

    // 수신 빈도
    frequency: varchar('frequency', { length: 20 }).notNull().default('immediate'),
    digestTime: varchar('digest_time', { length: 5 }).notNull().default('09:00'),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_notification_prefs_user').on(table.userId)]
);

// 알림 설정 관계 정의
export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));
