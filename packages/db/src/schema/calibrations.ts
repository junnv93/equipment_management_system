import {
  pgTable,
  varchar,
  timestamp,
  text,
  decimal,
  uuid,
  date,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { teams } from './teams';
import { users } from './users';

// 교정 상태 정의
export const calibrationStatus = [
  'scheduled', // 예정됨
  'in_progress', // 진행 중
  'completed', // 완료됨
  'failed', // 실패
] as const;

// 교정 승인 상태 정의
export const calibrationApprovalStatus = [
  'pending_approval', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

// 교정 등록자 역할 정의
export const calibrationRegisteredByRole = [
  'test_engineer', // 시험실무자
  'technical_manager', // 기술책임자
] as const;

// 교정 테이블 스키마
export const calibrations = pgTable('calibrations', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id').notNull(),
  technicianId: uuid('technician_id'),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),

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
  approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('pending_approval'),
  registeredBy: uuid('registered_by'), // 등록자 ID
  approvedBy: uuid('approved_by'), // 승인자 ID (기술책임자)
  registeredByRole: varchar('registered_by_role', { length: 50 }), // 등록자 역할
  registrarComment: text('registrar_comment'), // 등록자 코멘트 (기술책임자 직접 등록 시 필수)
  approverComment: text('approver_comment'), // 승인자 코멘트 (기술책임자 승인 시 필수)
  rejectionReason: text('rejection_reason'), // 반려 사유

  // Optimistic locking version
  version: integer('version').notNull().default(1),

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
