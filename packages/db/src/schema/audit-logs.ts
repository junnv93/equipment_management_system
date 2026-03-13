import { pgTable, varchar, timestamp, text, uuid, json, index } from 'drizzle-orm/pg-core';
import { AUDIT_ACTION_VALUES, AUDIT_ENTITY_TYPE_VALUES } from '@equipment-management/schemas';

/** @see packages/schemas/src/enums.ts - AuditActionEnum (SSOT) */
export const auditAction = AUDIT_ACTION_VALUES;

/** @see packages/schemas/src/enums.ts - AuditEntityTypeEnum (SSOT) */
export const auditEntityType = AUDIT_ENTITY_TYPE_VALUES;

/**
 * 감사 로그 상세 정보 타입
 */
export interface AuditLogDetails {
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  requestId?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * 감사 로그 테이블 스키마
 *
 * 로그 형식 예시:
 * "2025년 5월 09일 09:30, 홍석환(기술책임자)이 '네트워크 분석기(SUW-E0326)' 신규 등록 요청을 '승인'함."
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    // 식별자
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 시간 정보
    timestamp: timestamp('timestamp').defaultNow().notNull(),

    // 사용자 정보
    userId: uuid('user_id').notNull(),
    userName: varchar('user_name', { length: 100 }).notNull(),
    userRole: varchar('user_role', { length: 50 }).notNull(),

    // 액션 정보
    action: varchar('action', { length: 50 }).notNull(),

    // 엔티티 정보
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    entityName: varchar('entity_name', { length: 200 }), // 예: 장비명

    // 상세 정보 (변경 전/후 값, 요청 ID 등)
    details: json('details').$type<AuditLogDetails>(),

    // 요청 정보
    ipAddress: varchar('ip_address', { length: 50 }),

    // 역할별 접근 범위 (RBAC 스코프 필터링용)
    // nullable: 기존 로그 호환 (backfill로 보완)
    userSite: varchar('user_site', { length: 10 }),
    userTeamId: uuid('user_team_id'),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // 엔티티별 이력 조회 최적화 (WHERE entity_type = ? ORDER BY timestamp DESC)
    entityTypeTimestampIdx: index('audit_logs_entity_type_timestamp_idx').on(
      table.entityType,
      table.timestamp
    ),
    // 액션별 이력 조회 최적화 (WHERE action = ? ORDER BY timestamp DESC)
    actionTimestampIdx: index('audit_logs_action_timestamp_idx').on(table.action, table.timestamp),
    // 특정 엔티티 이력 조회 (WHERE entity_id = ?)
    entityIdIdx: index('audit_logs_entity_id_idx').on(table.entityId),
    // 사용자별 감사 추적 (WHERE user_id = ? ORDER BY timestamp DESC)
    userIdTimestampIdx: index('audit_logs_user_id_timestamp_idx').on(table.userId, table.timestamp),
    // 사이트별 감사 로그 조회 (lab_manager 스코프)
    userSiteTimestampIdx: index('audit_logs_user_site_timestamp_idx').on(
      table.userSite,
      table.timestamp
    ),
    // 팀별 감사 로그 조회 (technical_manager 스코프)
    userTeamIdTimestampIdx: index('audit_logs_user_team_id_timestamp_idx').on(
      table.userTeamId,
      table.timestamp
    ),
  })
);

// 감사 로그 타입
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
