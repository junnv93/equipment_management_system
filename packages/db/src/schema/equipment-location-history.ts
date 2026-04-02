import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 장비 위치 변동 이력 테이블
 *
 * 장비의 위치 변경 이력을 추적합니다.
 */
export const equipmentLocationHistory = pgTable(
  'equipment_location_history',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),
    changedAt: timestamp('changed_at').notNull(),
    previousLocation: varchar('previous_location', { length: 100 }),
    newLocation: varchar('new_location', { length: 100 }).notNull(),
    notes: text('notes'),
    changedBy: uuid('changed_by').references(() => users.id), // 변경자 (users 테이블 참조)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    equipmentIdIdx: index('equipment_location_history_equipment_id_idx').on(table.equipmentId),
    changedAtIdx: index('equipment_location_history_changed_at_idx').on(table.changedAt),
    equipmentChangedAtIdx: index('equipment_location_history_equipment_changed_at_idx').on(
      table.equipmentId,
      table.changedAt
    ),
  })
);

// Relations 정의
export const equipmentLocationHistoryRelations = relations(equipmentLocationHistory, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentLocationHistory.equipmentId],
    references: [equipment.id],
  }),
  changer: one(users, {
    fields: [equipmentLocationHistory.changedBy],
    references: [users.id],
  }),
}));

export type EquipmentLocationHistory = typeof equipmentLocationHistory.$inferSelect;
export type NewEquipmentLocationHistory = typeof equipmentLocationHistory.$inferInsert;
