import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * 장비 위치 변동 이력 테이블
 *
 * 장비의 위치 변경 이력을 추적합니다.
 */
export const equipmentLocationHistory = pgTable('equipment_location_history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  changedAt: timestamp('changed_at').notNull(),
  newLocation: varchar('new_location', { length: 100 }).notNull(),
  notes: text('notes'),
  changedBy: varchar('changed_by', { length: 36 }), // 변경자 (users 테이블 참조)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type EquipmentLocationHistory = typeof equipmentLocationHistory.$inferSelect;
export type NewEquipmentLocationHistory = typeof equipmentLocationHistory.$inferInsert;
