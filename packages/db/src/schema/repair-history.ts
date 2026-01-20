import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  varchar,
  index,
  uuid as pgUuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';

/**
 * 장비 수리 이력 테이블
 *
 * 장비의 수리 이력을 기록합니다.
 * 수리 이력은 영구 보관됩니다 (소프트 삭제 지원).
 */
export const repairHistory = pgTable(
  'repair_history',
  {
    id: serial('id').primaryKey(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),

    // 장비 연결
    equipmentId: integer('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'cascade' }),

    // 수리 정보
    repairDate: timestamp('repair_date').notNull(), // 수리 일자
    repairDescription: text('repair_description').notNull(), // 수리 내용
    repairedBy: varchar('repaired_by', { length: 100 }), // 수리 담당자
    repairCompany: varchar('repair_company', { length: 200 }), // 외부 수리 업체
    cost: integer('cost'), // 수리 비용 (원)
    repairResult: varchar('repair_result', { length: 50 }), // 수리 결과: 'completed' | 'partial' | 'failed'

    // 추가 정보
    notes: text('notes'), // 비고
    attachmentPath: varchar('attachment_path', { length: 500 }), // 첨부 파일 경로

    // 소프트 삭제
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
    deletedBy: varchar('deleted_by', { length: 36 }),

    // 시스템 필드
    createdBy: varchar('created_by', { length: 36 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // 장비별 수리 이력 조회 최적화
      equipmentIdIdx: index('repair_history_equipment_id_idx').on(table.equipmentId),
      // 수리일 기준 조회 최적화
      repairDateIdx: index('repair_history_repair_date_idx').on(table.repairDate),
      // 삭제되지 않은 이력만 조회
      isDeletedIdx: index('repair_history_is_deleted_idx').on(table.isDeleted),
      // 복합 인덱스: 장비별 최신 수리 이력
      equipmentDateIdx: index('repair_history_equipment_date_idx').on(
        table.equipmentId,
        table.repairDate
      ),
    };
  }
);

// 수리 결과 타입
export const repairResultValues = ['completed', 'partial', 'failed'] as const;
export type RepairResult = (typeof repairResultValues)[number];

// 타입 정의
export type RepairHistory = typeof repairHistory.$inferSelect;
export type NewRepairHistory = typeof repairHistory.$inferInsert;

// Relations 정의
export const repairHistoryRelations = relations(repairHistory, ({ one }) => ({
  equipment: one(equipment, {
    fields: [repairHistory.equipmentId],
    references: [equipment.id],
  }),
}));
