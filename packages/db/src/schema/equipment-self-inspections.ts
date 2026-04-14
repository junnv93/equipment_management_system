import {
  pgTable,
  varchar,
  timestamp,
  text,
  uuid,
  index,
  integer,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  SELF_INSPECTION_ITEM_JUDGMENT_VALUES,
  SELF_INSPECTION_RESULT_VALUES,
  SELF_INSPECTION_STATUS_VALUES,
} from '@equipment-management/schemas';
import type {
  SelfInspectionItemJudgment,
  SelfInspectionResult,
  SelfInspectionStatus,
} from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 자체점검표 (UL-QP-18-05, 섹션 8.6)
 *
 * 장비에 대한 정기 자체점검 기록 관리
 * 워크플로우: draft → submitted(담당+검토=시험실무자) → approved(승인=기술책임자)
 *            submitted → rejected(반려) → resubmit → draft
 *            submitted → withdraw → draft (제출자 본인만)
 */
export const equipmentSelfInspections = pgTable(
  'equipment_self_inspections',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 대상 장비
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),

    // 점검 정보
    inspectionDate: timestamp('inspection_date').notNull(),
    inspectorId: uuid('inspector_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // 점검 항목 판정 (레거시 고정 컬럼 — 하위 호환)
    appearance: varchar('appearance', { length: 10 }).$type<SelfInspectionItemJudgment>().notNull(),
    functionality: varchar('functionality', { length: 10 })
      .$type<SelfInspectionItemJudgment>()
      .notNull(),
    safety: varchar('safety', { length: 10 }).$type<SelfInspectionItemJudgment>().notNull(),
    calibrationStatus: varchar('calibration_status', { length: 10 })
      .$type<SelfInspectionItemJudgment>()
      .notNull(),

    // 전체 결과
    overallResult: varchar('overall_result', { length: 10 })
      .$type<SelfInspectionResult>()
      .notNull(),
    remarks: text('remarks'),

    // 기타 특기사항 (조치내용) — QP-18-05 섹션 3
    // 형식: [{content: string, date: string | null}]
    specialNotes: jsonb('special_notes').$type<{ content: string; date: string | null }[]>(),

    // 점검 주기 (월 단위)
    inspectionCycle: integer('inspection_cycle').notNull().default(6),
    nextInspectionDate: date('next_inspection_date'),

    // 결재 프로세스 (QP-18-05 섹션 4: 담당/검토/승인)
    approvalStatus: varchar('approval_status', { length: 20 })
      .$type<SelfInspectionStatus>()
      .notNull()
      .default('draft'),

    // 제출 (담당+검토 = 시험실무자 동일인)
    submittedAt: timestamp('submitted_at'),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'restrict' }),

    // 승인 (기술책임자)
    approvedAt: timestamp('approved_at'),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'restrict' }),

    // 반려
    rejectedAt: timestamp('rejected_at'),
    rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'restrict' }),
    rejectionReason: text('rejection_reason'),

    // 생성자
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // Optimistic locking
    version: integer('version').notNull().default(1),
  },
  (table) => ({
    equipmentIdIdx: index('self_inspections_equipment_id_idx').on(table.equipmentId),
    inspectionDateIdx: index('self_inspections_inspection_date_idx').on(table.inspectionDate),
    nextInspectionDateIdx: index('self_inspections_next_inspection_date_idx').on(
      table.nextInspectionDate
    ),
    approvalStatusIdx: index('self_inspections_approval_status_idx').on(table.approvalStatus),
    inspectorIdIdx: index('self_inspections_inspector_id_idx').on(table.inspectorId),
    submittedByIdx: index('self_inspections_submitted_by_idx').on(table.submittedBy),
    approvedByIdx: index('self_inspections_approved_by_idx').on(table.approvedBy),
    rejectedByIdx: index('self_inspections_rejected_by_idx').on(table.rejectedBy),
  })
);

export type EquipmentSelfInspection = typeof equipmentSelfInspections.$inferSelect;
export type NewEquipmentSelfInspection = typeof equipmentSelfInspections.$inferInsert;

/** @see packages/schemas/src/enums/self-inspection.ts (SSOT) */
export const selfInspectionItemJudgmentValues = SELF_INSPECTION_ITEM_JUDGMENT_VALUES;
export const selfInspectionResultValues = SELF_INSPECTION_RESULT_VALUES;
export const selfInspectionStatusValues = SELF_INSPECTION_STATUS_VALUES;

// ============================================================================
// 자체점검 항목 (유연한 체크리스트 — QP-18-05 섹션 2)
// ============================================================================

/**
 * 자체점검 개별 항목
 *
 * 기본 항목: 외관검사, 출력 특성 점검, 안전 점검, 기능 점검
 * 사용자가 항목을 추가/삭제할 수 있음
 */
export const selfInspectionItems = pgTable(
  'self_inspection_items',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    inspectionId: uuid('inspection_id')
      .notNull()
      .references(() => equipmentSelfInspections.id, { onDelete: 'cascade' }),
    itemNumber: integer('item_number').notNull(),
    checkItem: varchar('check_item', { length: 300 }).notNull(),
    checkResult: varchar('check_result', { length: 10 })
      .$type<SelfInspectionItemJudgment>()
      .notNull(),
    detailedResult: text('detailed_result'),
  },
  (table) => ({
    inspectionIdIdx: index('self_inspection_items_inspection_id_idx').on(table.inspectionId),
  })
);

export type SelfInspectionItem = typeof selfInspectionItems.$inferSelect;
export type NewSelfInspectionItem = typeof selfInspectionItems.$inferInsert;

// ============================================================================
// Relations
// ============================================================================

export const equipmentSelfInspectionsRelations = relations(
  equipmentSelfInspections,
  ({ one, many }) => ({
    equipment: one(equipment, {
      fields: [equipmentSelfInspections.equipmentId],
      references: [equipment.id],
    }),
    inspector: one(users, {
      fields: [equipmentSelfInspections.inspectorId],
      references: [users.id],
      relationName: 'selfInspectionInspector',
    }),
    submitter: one(users, {
      fields: [equipmentSelfInspections.submittedBy],
      references: [users.id],
      relationName: 'selfInspectionSubmitter',
    }),
    approver: one(users, {
      fields: [equipmentSelfInspections.approvedBy],
      references: [users.id],
      relationName: 'selfInspectionApprover',
    }),
    rejector: one(users, {
      fields: [equipmentSelfInspections.rejectedBy],
      references: [users.id],
      relationName: 'selfInspectionRejector',
    }),
    creator: one(users, {
      fields: [equipmentSelfInspections.createdBy],
      references: [users.id],
      relationName: 'selfInspectionCreator',
    }),
    items: many(selfInspectionItems),
  })
);

export const selfInspectionItemsRelations = relations(selfInspectionItems, ({ one }) => ({
  inspection: one(equipmentSelfInspections, {
    fields: [selfInspectionItems.inspectionId],
    references: [equipmentSelfInspections.id],
  }),
}));
