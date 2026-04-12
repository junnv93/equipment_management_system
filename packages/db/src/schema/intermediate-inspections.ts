import { pgTable, varchar, timestamp, text, uuid, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  INSPECTION_APPROVAL_STATUS_VALUES,
  INSPECTION_JUDGMENT_VALUES,
  INSPECTION_RESULT_VALUES,
  EQUIPMENT_CLASSIFICATION_VALUES,
} from '@equipment-management/schemas';
import type {
  InspectionApprovalStatus,
  InspectionJudgment,
  InspectionResult,
  EquipmentClassification,
} from '@equipment-management/schemas';
import { calibrations } from './calibrations';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 중간점검표 (UL-QP-18-03)
 *
 * 교정 장비에 대한 중간점검 기록 관리
 * 워크플로우: draft → submitted → reviewed → approved (또는 rejected)
 */
export const intermediateInspections = pgTable(
  'intermediate_inspections',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 대상 교정 및 장비
    calibrationId: uuid('calibration_id')
      .notNull()
      .references(() => calibrations.id, { onDelete: 'restrict' }),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),

    // 점검 정보
    inspectionDate: timestamp('inspection_date').notNull(),
    inspectorId: uuid('inspector_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    classification: varchar('classification', { length: 20 }).$type<EquipmentClassification>(),
    inspectionCycle: varchar('inspection_cycle', { length: 20 }),
    calibrationValidityPeriod: varchar('calibration_validity_period', { length: 50 }),
    overallResult: varchar('overall_result', { length: 20 }).$type<InspectionResult>(),
    remarks: text('remarks'),

    // 승인 프로세스
    approvalStatus: varchar('approval_status', { length: 20 })
      .$type<InspectionApprovalStatus>()
      .notNull()
      .default('draft'),
    submittedAt: timestamp('submitted_at'),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'restrict' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'restrict' }),
    approvedAt: timestamp('approved_at'),
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'restrict' }),
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
    calibrationIdIdx: index('intermediate_inspections_calibration_id_idx').on(table.calibrationId),
    equipmentIdIdx: index('intermediate_inspections_equipment_id_idx').on(table.equipmentId),
    approvalStatusIdx: index('intermediate_inspections_approval_status_idx').on(
      table.approvalStatus
    ),
    inspectionDateIdx: index('intermediate_inspections_inspection_date_idx').on(
      table.inspectionDate
    ),
    inspectorIdIdx: index('intermediate_inspections_inspector_id_idx').on(table.inspectorId),
    createdByIdx: index('intermediate_inspections_created_by_idx').on(table.createdBy),
    submittedByIdx: index('intermediate_inspections_submitted_by_idx').on(table.submittedBy),
    reviewedByIdx: index('intermediate_inspections_reviewed_by_idx').on(table.reviewedBy),
    approvedByIdx: index('intermediate_inspections_approved_by_idx').on(table.approvedBy),
    rejectedByIdx: index('intermediate_inspections_rejected_by_idx').on(table.rejectedBy),
  })
);

export type IntermediateInspection = typeof intermediateInspections.$inferSelect;
export type NewIntermediateInspection = typeof intermediateInspections.$inferInsert;

/** @see packages/schemas/src/enums/intermediate-inspection.ts (SSOT) */
export const inspectionApprovalStatusValues = INSPECTION_APPROVAL_STATUS_VALUES;
export const inspectionResultValues = INSPECTION_RESULT_VALUES;
export const equipmentClassificationValues = EQUIPMENT_CLASSIFICATION_VALUES;

/**
 * 중간점검 항목 (개별 점검 체크리스트)
 */
export const intermediateInspectionItems = pgTable(
  'intermediate_inspection_items',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    inspectionId: uuid('inspection_id')
      .notNull()
      .references(() => intermediateInspections.id, { onDelete: 'cascade' }),
    itemNumber: integer('item_number').notNull(),
    checkItem: varchar('check_item', { length: 300 }).notNull(),
    checkCriteria: varchar('check_criteria', { length: 300 }),
    checkResult: varchar('check_result', { length: 300 }),
    detailedResult: text('detailed_result'),
    judgment: varchar('judgment', { length: 10 }).$type<InspectionJudgment>(),
  },
  (table) => ({
    inspectionIdIdx: index('intermediate_inspection_items_inspection_id_idx').on(
      table.inspectionId
    ),
  })
);

export type IntermediateInspectionItem = typeof intermediateInspectionItems.$inferSelect;
export type NewIntermediateInspectionItem = typeof intermediateInspectionItems.$inferInsert;

/** @see packages/schemas/src/enums/intermediate-inspection.ts (SSOT) */
export const inspectionJudgmentValues = INSPECTION_JUDGMENT_VALUES;

/**
 * 중간점검 대상 장비 (점검에 포함된 장비 목록)
 */
export const intermediateInspectionEquipment = pgTable(
  'intermediate_inspection_equipment',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    inspectionId: uuid('inspection_id')
      .notNull()
      .references(() => intermediateInspections.id, { onDelete: 'cascade' }),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),
    calibrationDate: timestamp('calibration_date'),
  },
  (table) => ({
    inspectionIdIdx: index('intermediate_inspection_equipment_inspection_id_idx').on(
      table.inspectionId
    ),
    equipmentIdIdx: index('intermediate_inspection_equipment_equipment_id_idx').on(
      table.equipmentId
    ),
  })
);

export type IntermediateInspectionEquipment = typeof intermediateInspectionEquipment.$inferSelect;
export type NewIntermediateInspectionEquipment =
  typeof intermediateInspectionEquipment.$inferInsert;

// ============================================================================
// Relations
// ============================================================================

export const intermediateInspectionsRelations = relations(
  intermediateInspections,
  ({ one, many }) => ({
    calibration: one(calibrations, {
      fields: [intermediateInspections.calibrationId],
      references: [calibrations.id],
    }),
    equipment: one(equipment, {
      fields: [intermediateInspections.equipmentId],
      references: [equipment.id],
    }),
    inspector: one(users, {
      fields: [intermediateInspections.inspectorId],
      references: [users.id],
      relationName: 'intermediateInspectionInspector',
    }),
    creator: one(users, {
      fields: [intermediateInspections.createdBy],
      references: [users.id],
      relationName: 'intermediateInspectionCreator',
    }),
    submitter: one(users, {
      fields: [intermediateInspections.submittedBy],
      references: [users.id],
      relationName: 'intermediateInspectionSubmitter',
    }),
    reviewer: one(users, {
      fields: [intermediateInspections.reviewedBy],
      references: [users.id],
      relationName: 'intermediateInspectionReviewer',
    }),
    approver: one(users, {
      fields: [intermediateInspections.approvedBy],
      references: [users.id],
      relationName: 'intermediateInspectionApprover',
    }),
    rejector: one(users, {
      fields: [intermediateInspections.rejectedBy],
      references: [users.id],
      relationName: 'intermediateInspectionRejector',
    }),
    items: many(intermediateInspectionItems),
    inspectionEquipment: many(intermediateInspectionEquipment),
  })
);

export const intermediateInspectionItemsRelations = relations(
  intermediateInspectionItems,
  ({ one }) => ({
    inspection: one(intermediateInspections, {
      fields: [intermediateInspectionItems.inspectionId],
      references: [intermediateInspections.id],
    }),
  })
);

export const intermediateInspectionEquipmentRelations = relations(
  intermediateInspectionEquipment,
  ({ one }) => ({
    inspection: one(intermediateInspections, {
      fields: [intermediateInspectionEquipment.inspectionId],
      references: [intermediateInspections.id],
    }),
    equipment: one(equipment, {
      fields: [intermediateInspectionEquipment.equipmentId],
      references: [equipment.id],
    }),
  })
);
