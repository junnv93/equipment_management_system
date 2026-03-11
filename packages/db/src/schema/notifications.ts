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
    recipientId: uuid('recipient_id'), // 특정 사용자 수신
    teamId: uuid('team_id'), // 팀 전체 수신 (단일 레코드)
    isSystemWide: boolean('is_system_wide').notNull().default(false), // 전체 사용자

    // 관련 엔티티 (딥링크 + 연관 조회)
    equipmentId: uuid('equipment_id'), // 관련 장비
    entityType: varchar('entity_type', { length: 50 }), // 'checkout' | 'calibration' 등
    entityId: uuid('entity_id'), // 해당 엔티티 UUID
    linkUrl: varchar('link_url', { length: 300 }), // 프론트엔드 딥링크

    // 읽음 상태
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),

    // 이벤트 발생자
    actorId: uuid('actor_id'),
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
    userId: uuid('user_id').notNull().unique(),

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
