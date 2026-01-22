import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * 장비 유지보수 내역 테이블
 *
 * 장비의 유지보수 이력을 추적합니다.
 */
export const equipmentMaintenanceHistory = pgTable('equipment_maintenance_history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  performedAt: timestamp('performed_at').notNull(),
  content: text('content').notNull(),
  performedBy: varchar('performed_by', { length: 36 }), // 수행자 (users 테이블 참조)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type EquipmentMaintenanceHistory = typeof equipmentMaintenanceHistory.$inferSelect;
export type NewEquipmentMaintenanceHistory = typeof equipmentMaintenanceHistory.$inferInsert;
