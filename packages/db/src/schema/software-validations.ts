import {
  pgTable,
  varchar,
  timestamp,
  text,
  uuid,
  index,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { VALIDATION_TYPE_VALUES, VALIDATION_STATUS_VALUES } from '@equipment-management/schemas';
import type { ValidationType, ValidationStatus } from '@equipment-management/schemas';
import { testSoftware } from './test-software';
import { users } from './users';

/**
 * 소프트웨어 유효성 확인 (UL-QP-18-09)
 *
 * 방법 1: 공급자 시연 (vendor)
 * 방법 2: UL 자체 시험 (self)
 *
 * 워크플로우: draft → submitted → approved → quality_approved (또는 rejected)
 * 기술책임자 승인 + 품질책임자 최종 승인
 */
export const softwareValidations = pgTable(
  'software_validations',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 대상 소프트웨어
    testSoftwareId: uuid('test_software_id')
      .notNull()
      .references(() => testSoftware.id, { onDelete: 'restrict' }),

    // 유효성 확인 유형 및 상태
    validationType: varchar('validation_type', { length: 20 }).$type<ValidationType>().notNull(),
    status: varchar('status', { length: 20 }).$type<ValidationStatus>().notNull().default('draft'),

    // 검증 대상 버전
    softwareVersion: varchar('software_version', { length: 100 }),
    testDate: timestamp('test_date'),

    // ── 공통 ──
    infoDate: timestamp('info_date'), // 입수 일자 (UL-QP-18-09)
    softwareAuthor: varchar('software_author', { length: 200 }), // 제작자

    // ── 방법 1: 공급자 시연 (vendor) ──
    vendorName: varchar('vendor_name', { length: 200 }),
    vendorSummary: text('vendor_summary'),
    receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'restrict' }),
    receivedDate: timestamp('received_date'),
    attachmentNote: text('attachment_note'),

    // ── 방법 2: UL 자체 시험 (self) ──
    referenceDocuments: text('reference_documents'),
    operatingUnitDescription: text('operating_unit_description'),
    softwareComponents: text('software_components'),
    hardwareComponents: text('hardware_components'),
    acquisitionFunctions: jsonb('acquisition_functions'), // 획득 기능 검증 항목 배열
    processingFunctions: jsonb('processing_functions'), // 프로세싱 기능 검증 항목 배열
    controlFunctions: jsonb('control_functions'), // 제어 기능 검증 항목 배열
    performedBy: uuid('performed_by').references(() => users.id, { onDelete: 'restrict' }),

    // ── 승인 프로세스 ──
    submittedAt: timestamp('submitted_at'),
    submittedBy: uuid('submitted_by').references(() => users.id, { onDelete: 'restrict' }),
    technicalApproverId: uuid('technical_approver_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    technicalApprovedAt: timestamp('technical_approved_at'),
    qualityApproverId: uuid('quality_approver_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    qualityApprovedAt: timestamp('quality_approved_at'),
    rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'restrict' }),
    rejectedAt: timestamp('rejected_at'),
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
    testSoftwareIdIdx: index('software_validations_test_software_id_idx').on(table.testSoftwareId),
    testSoftwareIdStatusIdx: index('software_validations_test_software_id_status_idx').on(
      table.testSoftwareId,
      table.status
    ),
    statusIdx: index('software_validations_status_idx').on(table.status),
    validationTypeIdx: index('software_validations_validation_type_idx').on(table.validationType),
    receivedByIdx: index('software_validations_received_by_idx').on(table.receivedBy),
    performedByIdx: index('software_validations_performed_by_idx').on(table.performedBy),
    submittedByIdx: index('software_validations_submitted_by_idx').on(table.submittedBy),
    technicalApproverIdIdx: index('software_validations_technical_approver_id_idx').on(
      table.technicalApproverId
    ),
    qualityApproverIdIdx: index('software_validations_quality_approver_id_idx').on(
      table.qualityApproverId
    ),
    rejectedByIdx: index('software_validations_rejected_by_idx').on(table.rejectedBy),
    createdByIdx: index('software_validations_created_by_idx').on(table.createdBy),
  })
);

export type SoftwareValidation = typeof softwareValidations.$inferSelect;
export type NewSoftwareValidation = typeof softwareValidations.$inferInsert;

/** @see packages/schemas/src/enums/software.ts (SSOT) */
export const validationTypeValues = VALIDATION_TYPE_VALUES;
export const validationStatusValues = VALIDATION_STATUS_VALUES;

export const softwareValidationsRelations = relations(softwareValidations, ({ one }) => ({
  testSoftware: one(testSoftware, {
    fields: [softwareValidations.testSoftwareId],
    references: [testSoftware.id],
  }),
  creator: one(users, {
    fields: [softwareValidations.createdBy],
    references: [users.id],
    relationName: 'softwareValidationCreator',
  }),
  submitter: one(users, {
    fields: [softwareValidations.submittedBy],
    references: [users.id],
    relationName: 'softwareValidationSubmitter',
  }),
  technicalApprover: one(users, {
    fields: [softwareValidations.technicalApproverId],
    references: [users.id],
    relationName: 'softwareValidationTechnicalApprover',
  }),
  qualityApprover: one(users, {
    fields: [softwareValidations.qualityApproverId],
    references: [users.id],
    relationName: 'softwareValidationQualityApprover',
  }),
  performer: one(users, {
    fields: [softwareValidations.performedBy],
    references: [users.id],
    relationName: 'softwareValidationPerformer',
  }),
  receiver: one(users, {
    fields: [softwareValidations.receivedBy],
    references: [users.id],
    relationName: 'softwareValidationReceiver',
  }),
}));
