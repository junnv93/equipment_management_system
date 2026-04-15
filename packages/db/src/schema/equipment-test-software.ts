import { pgTable, uuid, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { testSoftware } from './test-software';

/**
 * 장비 ↔ 시험용 소프트웨어 M:N 중간 테이블
 *
 * 하나의 시험용 SW(예: EMC32)가 여러 장비를 제어하고,
 * 하나의 장비가 여러 시험용 SW로 제어될 수 있음 (시험 목적에 따라).
 *
 * 이력카드 항목 7 "관련 S/W"는 이 관계에서 JOIN으로 조회.
 */
export const equipmentTestSoftware = pgTable(
  'equipment_test_software',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'cascade' }),

    testSoftwareId: uuid('test_software_id')
      .notNull()
      .references(() => testSoftware.id, { onDelete: 'cascade' }),

    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueEquipmentSoftware: uniqueIndex('equipment_test_software_unique_idx').on(
      table.equipmentId,
      table.testSoftwareId
    ),
    // testSoftwareId 단독 조회용 역방향 인덱스 — "이 SW가 사용되는 장비 목록" 쿼리 최적화
    // (unique idx의 leading column이 equipmentId이므로 역방향 탐색 시 full scan 발생)
    testSoftwareIdIdx: index('equipment_test_software_test_software_id_idx').on(
      table.testSoftwareId
    ),
  })
);

export type EquipmentTestSoftware = typeof equipmentTestSoftware.$inferSelect;
export type NewEquipmentTestSoftware = typeof equipmentTestSoftware.$inferInsert;

export const equipmentTestSoftwareRelations = relations(equipmentTestSoftware, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentTestSoftware.equipmentId],
    references: [equipment.id],
  }),
  testSoftware: one(testSoftware, {
    fields: [equipmentTestSoftware.testSoftwareId],
    references: [testSoftware.id],
  }),
}));
