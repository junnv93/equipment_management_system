import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 장비 유지보수 내역 테이블
 *
 * 장비의 유지보수 이력을 추적합니다.
 */
export const equipmentMaintenanceHistory = pgTable(
  'equipment_maintenance_history',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),
    performedAt: timestamp('performed_at').notNull(),
    content: text('content').notNull(),
    performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'restrict' }), // 수행자 (users 테이블 참조)
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // 복합 인덱스: 장비 상세 페이지 핵심 쿼리 (WHERE equipment_id = ? ORDER BY performed_at DESC)
    // leading prefix가 단일 equipmentId 인덱스를 커버하므로 별도 equipmentId 인덱스 불필요
    // @see calibrations.ts — equipmentApprovalIdx 패턴과 동일 원칙
    equipmentPerformedAtIdx: index('maintenance_history_equipment_performed_at_idx').on(
      table.equipmentId,
      table.performedAt
    ),
    // 날짜 범위 단독 쿼리 최적화 (equipmentId 없이 기간별 조회 시)
    performedAtIdx: index('maintenance_history_performed_at_idx').on(table.performedAt),
  })
);

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
