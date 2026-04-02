import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';
import { nonConformances } from './non-conformances';

/**
 * 장비 손상/오작동/변경/수리 내역 테이블
 *
 * 장비의 손상, 오작동, 변경, 수리 이력을 추적합니다.
 * incident_type: 'damage' | 'malfunction' | 'change' | 'repair' | 'calibration_overdue'
 */
export const equipmentIncidentHistory = pgTable(
  'equipment_incident_history',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),
    occurredAt: timestamp('occurred_at').notNull(),
    incidentType: varchar('incident_type', { length: 50 }).notNull(), // damage, malfunction, change, repair, calibration_overdue
    content: text('content').notNull(),
    reportedBy: uuid('reported_by').references(() => users.id), // 보고자 (users 테이블 참조)
    nonConformanceId: uuid('non_conformance_id').references(() => nonConformances.id, {
      onDelete: 'set null',
    }), // 연결된 부적합 (구조적 FK)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // 장비별 사고 이력 조회 최적화
    equipmentIdIdx: index('incident_history_equipment_id_idx').on(table.equipmentId),
    // 부적합 연결 조회 최적화
    nonConformanceIdIdx: index('incident_history_nc_id_idx').on(table.nonConformanceId),
  })
);

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
  nonConformance: one(nonConformances, {
    fields: [equipmentIncidentHistory.nonConformanceId],
    references: [nonConformances.id],
  }),
}));

export type EquipmentIncidentHistory = typeof equipmentIncidentHistory.$inferSelect;
export type NewEquipmentIncidentHistory = typeof equipmentIncidentHistory.$inferInsert;
