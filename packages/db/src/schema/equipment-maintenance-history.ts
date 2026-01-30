import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 장비 유지보수 내역 테이블
 *
 * 장비의 유지보수 이력을 추적합니다.
 */
export const equipmentMaintenanceHistory = pgTable('equipment_maintenance_history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id, { onDelete: 'cascade' }),
  performedAt: timestamp('performed_at').notNull(),
  content: text('content').notNull(),
  performedBy: uuid('performed_by').references(() => users.id), // 수행자 (users 테이블 참조)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations 정의
export const equipmentMaintenanceHistoryRelations = relations(
  equipmentMaintenanceHistory,
  ({ one }) => ({
    equipment: one(equipment, {
      fields: [equipmentMaintenanceHistory.equipmentId],
      references: [equipment.id],
    }),
    performer: one(users, {
      fields: [equipmentMaintenanceHistory.performedBy],
      references: [users.id],
    }),
  })
);

export type EquipmentMaintenanceHistory = typeof equipmentMaintenanceHistory.$inferSelect;
export type NewEquipmentMaintenanceHistory = typeof equipmentMaintenanceHistory.$inferInsert;
