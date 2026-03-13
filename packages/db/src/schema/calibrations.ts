import {
  pgTable,
  varchar,
  timestamp,
  text,
  decimal,
  uuid,
  date,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  CALIBRATION_STATUS_VALUES,
  CALIBRATION_APPROVAL_STATUS_VALUES,
  CALIBRATION_REGISTERED_BY_ROLE_VALUES,
} from '@equipment-management/schemas';
import type {
  CalibrationStatus,
  CalibrationApprovalStatus,
  CalibrationRegisteredByRole,
} from '@equipment-management/schemas';
import { equipment } from './equipment';
import { teams } from './teams';
import { users } from './users';

/** @see packages/schemas/src/calibration.ts - CalibrationStatusEnum (SSOT) */
export const calibrationStatus = CALIBRATION_STATUS_VALUES;

/** @see packages/schemas/src/enums.ts - CalibrationApprovalStatusEnum (SSOT) */
export const calibrationApprovalStatus = CALIBRATION_APPROVAL_STATUS_VALUES;

/** @see packages/schemas/src/enums.ts - CalibrationRegisteredByRoleEnum (SSOT) */
export const calibrationRegisteredByRole = CALIBRATION_REGISTERED_BY_ROLE_VALUES;

// 교정 테이블 스키마
export const calibrations = pgTable(
  'calibrations',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    equipmentId: uuid('equipment_id').notNull(),
    technicianId: uuid('technician_id'),
    status: varchar('status', { length: 50 })
      .$type<CalibrationStatus>()
      .notNull()
      .default('scheduled'),

    // 교정 정보
    calibrationDate: timestamp('calibration_date').notNull(),
    completionDate: timestamp('completion_date'),
    nextCalibrationDate: timestamp('next_calibration_date'),
    agencyName: varchar('agency_name', { length: 100 }),
    certificateNumber: varchar('certificate_number', { length: 100 }),
    certificatePath: varchar('certificate_path', { length: 500 }), // 교정성적서 파일 경로
    result: varchar('result', { length: 100 }),
    cost: decimal('cost', { precision: 10, scale: 2 }),
    notes: text('notes'),

    // 중간점검 일정
    intermediateCheckDate: date('intermediate_check_date'),

    // 승인 프로세스 필드
    approvalStatus: varchar('approval_status', { length: 50 })
      .$type<CalibrationApprovalStatus>()
      .notNull()
      .default('pending_approval'),
    registeredBy: uuid('registered_by'), // 등록자 ID
    approvedBy: uuid('approved_by'), // 승인자 ID (기술책임자)
    registeredByRole: varchar('registered_by_role', {
      length: 50,
    }).$type<CalibrationRegisteredByRole>(), // 등록자 역할
    registrarComment: text('registrar_comment'), // 등록자 코멘트 (기술책임자 직접 등록 시 필수)
    approverComment: text('approver_comment'), // 승인자 코멘트 (기술책임자 승인 시 필수)
    rejectionReason: text('rejection_reason'), // 반려 사유

    // Optimistic locking version
    version: integer('version').notNull().default(1),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // equipmentIdIdx 제거: equipmentApprovalIdx(equipmentId, approvalStatus) leading prefix로 커버됨
    statusIdx: index('calibrations_status_idx').on(table.status),
    approvalStatusIdx: index('calibrations_approval_status_idx').on(table.approvalStatus),
    nextCalibrationDateIdx: index('calibrations_next_calibration_date_idx').on(
      table.nextCalibrationDate
    ),
    calibrationDateIdx: index('calibrations_calibration_date_idx').on(table.calibrationDate),
    registeredByIdx: index('calibrations_registered_by_idx').on(table.registeredBy),
    equipmentApprovalIdx: index('calibrations_equipment_approval_idx').on(
      table.equipmentId,
      table.approvalStatus
    ),
  })
);

// 교정 타입
export type Calibration = typeof calibrations.$inferSelect;
export type NewCalibration = typeof calibrations.$inferInsert;

// Drizzle relations for joins
export const calibrationsRelations = relations(calibrations, ({ one }) => ({
  equipment: one(equipment, {
    fields: [calibrations.equipmentId],
    references: [equipment.id],
  }),
  registeredByUser: one(users, {
    fields: [calibrations.registeredBy],
    references: [users.id],
    relationName: 'calibration_registered_by',
  }),
  approvedByUser: one(users, {
    fields: [calibrations.approvedBy],
    references: [users.id],
    relationName: 'calibration_approved_by',
  }),
}));
