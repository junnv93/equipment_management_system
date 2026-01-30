import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 장비 손상/오작동/변경/수리 내역 테이블
 *
 * 장비의 손상, 오작동, 변경, 수리 이력을 추적합니다.
 * incident_type: 'damage' | 'malfunction' | 'change' | 'repair'
 */
export const equipmentIncidentHistory = pgTable('equipment_incident_history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id, { onDelete: 'cascade' }),
  occurredAt: timestamp('occurred_at').notNull(),
  incidentType: varchar('incident_type', { length: 50 }).notNull(), // damage, malfunction, change, repair
  content: text('content').notNull(),
  reportedBy: uuid('reported_by').references(() => users.id), // 보고자 (users 테이블 참조)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations 정의
export const equipmentIncidentHistoryRelations = relations(equipmentIncidentHistory, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentIncidentHistory.equipmentId],
    references: [equipment.id],
  }),
  reporter: one(users, {
    fields: [equipmentIncidentHistory.reportedBy],
    references: [users.id],
  }),
}));

export type EquipmentIncidentHistory = typeof equipmentIncidentHistory.$inferSelect;
export type NewEquipmentIncidentHistory = typeof equipmentIncidentHistory.$inferInsert;
