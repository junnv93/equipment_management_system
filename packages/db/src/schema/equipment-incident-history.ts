import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * 장비 손상/오작동/변경/수리 내역 테이블
 *
 * 장비의 손상, 오작동, 변경, 수리 이력을 추적합니다.
 * incident_type: 'damage' | 'malfunction' | 'change' | 'repair'
 */
export const equipmentIncidentHistory = pgTable('equipment_incident_history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  incidentType: varchar('incident_type', { length: 50 }).notNull(), // damage, malfunction, change, repair
  content: text('content').notNull(),
  reportedBy: varchar('reported_by', { length: 36 }), // 보고자 (users 테이블 참조)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type EquipmentIncidentHistory = typeof equipmentIncidentHistory.$inferSelect;
export type NewEquipmentIncidentHistory = typeof equipmentIncidentHistory.$inferInsert;
