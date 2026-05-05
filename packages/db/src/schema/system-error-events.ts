import { pgTable, varchar, timestamp, text, uuid, smallint, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * system_error_events — 시스템 에러 (5xx / uncaught) SSOT 테이블.
 *
 * 도입 배경:
 *  - 기존 `audit_logs.action IN ('reject','cancel')` 카운트는 비즈니스 거절 proxy.
 *  - 실제 시스템 에러 (서버가 응답 못 함) 는 어디에도 영속화되지 않음.
 *  - GlobalExceptionFilter 가 5xx 응답 시 fire-and-forget 으로 INSERT — request 흐름 비차단.
 *
 * PII 정책:
 *  - body / headers / query 절대 캡처 금지 (`apps/backend/src/modules/dashboard/health-providers/types.ts` 의 SystemErrorEventInput 참조).
 *  - userId 는 인증된 요청에 한해 nullable FK SET NULL.
 *  - stackPreview 는 development only, production 은 stackHash (SHA-256) 만.
 */
export const systemErrorEvents = pgTable(
  'system_error_events',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /**
     * ErrorCode enum 값 (`@equipment-management/schemas` ErrorCode) 또는 'UnknownError'.
     * varchar(100) — 0055 마이그레이션으로 50→100 확장. 최장 ErrorCode 가 53자
     * (`SOFTWARE_VALIDATION_ONLY_APPROVED_CAN_QUALITY_APPROVE`) 여서 50자는 데이터 유실 위험.
     */
    errorCode: varchar('error_code', { length: 100 }).notNull(),

    /** HTTP method — GET/POST/PATCH/DELETE 등. */
    httpMethod: varchar('http_method', { length: 10 }).notNull(),

    /** UUID/numeric ID 마스킹된 정규화 경로 (`/api/equipment/:id`). */
    normalizedRoute: varchar('normalized_route', { length: 255 }).notNull(),

    /** HTTP status code (5xx 만 캡처). */
    statusCode: smallint('status_code').notNull(),

    /** 인증 사용자 ID — FK SET NULL (감사 보존성). */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    /** SHA-256 hash of error stack — production 에서 그루핑/중복 검출용. */
    stackHash: varchar('stack_hash', { length: 64 }),

    /** Truncated stack preview — development only (4096 자 제한). */
    stackPreview: text('stack_preview'),
  },
  (table) => ({
    // 24h count 쿼리 최적화 — `WHERE created_at >= ? ORDER BY created_at DESC`
    createdAtIdx: index('system_error_events_created_at_idx').on(table.createdAt.desc()),
    // per-code aggregation (future use) — `WHERE error_code = ? AND created_at >= ?`
    codeCreatedAtIdx: index('system_error_events_code_created_at_idx').on(
      table.errorCode,
      table.createdAt.desc()
    ),
  })
);

export const systemErrorEventsRelations = relations(systemErrorEvents, ({ one }) => ({
  user: one(users, {
    fields: [systemErrorEvents.userId],
    references: [users.id],
  }),
}));

export type SystemErrorEvent = typeof systemErrorEvents.$inferSelect;
export type NewSystemErrorEvent = typeof systemErrorEvents.$inferInsert;
