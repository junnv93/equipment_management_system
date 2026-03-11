import {
  pgTable,
  varchar,
  timestamp,
  text,
  decimal,
  uuid,
  date,
  jsonb,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { calibrations } from './calibrations';
import { users } from './users';

/**
 * 보정계수 타입 정의
 * ⚠️ 중요: 이 값들은 packages/schemas/src/enums.ts의 CalibrationFactorTypeEnum과 반드시 일치해야 함
 * Single Source of Truth 원칙: schemas 패키지의 값이 우선
 * @see packages/schemas/src/enums.ts
 */
export const calibrationFactorTypes = [
  'antenna_gain', // 안테나 이득
  'cable_loss', // 케이블 손실
  'path_loss', // 경로 손실
  'amplifier_gain', // 증폭기 이득
  'other', // 기타
] as const;

/**
 * 보정계수 승인 상태 정의
 * ⚠️ 중요: 이 값들은 packages/schemas/src/enums.ts의 CalibrationFactorApprovalStatusEnum과 반드시 일치해야 함
 * Single Source of Truth 원칙: schemas 패키지의 값이 우선
 * @see packages/schemas/src/enums.ts
 */
export const calibrationFactorApprovalStatus = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

/**
 * 보정계수 이력 테이블 스키마
 *
 * 장비별 보정계수를 관리하며, 교정 시마다 변경 가능
 * 승인 전까지는 이전 보정계수가 유지됨
 *
 * @see docs/development/PROMPTS_FOR_IMPLEMENTATION_v2.md 프롬프트 6-1
 */
export const calibrationFactors = pgTable(
  'calibration_factors',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 장비 및 교정 관계
    equipmentId: uuid('equipment_id').notNull(),
    calibrationId: uuid('calibration_id'), // nullable - 교정 기록과 연결 (선택)

    // 보정계수 정보
    factorType: varchar('factor_type', { length: 50 }).notNull(), // 'antenna_gain' | 'cable_loss' | 'path_loss' | 'amplifier_gain' | 'other'
    factorName: varchar('factor_name', { length: 200 }).notNull(), // 사용자 정의 이름 (예: "3GHz 안테나 이득")
    factorValue: decimal('factor_value', { precision: 15, scale: 6 }).notNull(), // 수치 값
    unit: varchar('unit', { length: 20 }).notNull(), // 단위 (dB, dBi, dBm 등)

    // 다중 파라미터 (주파수별 값 등)
    // 예: { "frequency": "3GHz", "temperature": "25C", "values": [1.2, 1.3, 1.4] }
    parameters: jsonb('parameters'),

    // 유효 기간
    effectiveDate: date('effective_date').notNull(), // 적용 시작일
    expiryDate: date('expiry_date'), // 만료일 (nullable, 교정 주기에 따라)

    // 승인 프로세스
    approvalStatus: varchar('approval_status', { length: 20 }).notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
    requestedBy: uuid('requested_by').notNull(), // 요청자 ID (시험실무자)
    approvedBy: uuid('approved_by'), // 승인자 ID (기술책임자)
    requestedAt: timestamp('requested_at').defaultNow().notNull(), // 요청 시각
    approvedAt: timestamp('approved_at'), // 승인 시각
    approverComment: text('approver_comment'), // 승인/반려 시 코멘트

    // Optimistic Locking (CAS)
    version: integer('version').notNull().default(1),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // 소프트 삭제 (영구 보관 원칙)
  },
  (table) => {
    return {
      // 장비별 보정계수 조회 최적화
      equipmentIdIdx: index('calibration_factors_equipment_id_idx').on(table.equipmentId),
      // 승인 상태별 조회 최적화
      approvalStatusIdx: index('calibration_factors_approval_status_idx').on(table.approvalStatus),
      // 교정 기록별 조회 최적화
      calibrationIdIdx: index('calibration_factors_calibration_id_idx').on(table.calibrationId),
      // 복합 인덱스: 장비별 승인된 현재 보정계수 조회
      equipmentApprovedIdx: index('calibration_factors_equipment_approved_idx').on(
        table.equipmentId,
        table.approvalStatus,
        table.effectiveDate
      ),
      // 유효 기간 조회 최적화
      effectiveDateIdx: index('calibration_factors_effective_date_idx').on(table.effectiveDate),
    };
  }
);

// 보정계수 타입 정의
export type CalibrationFactor = typeof calibrationFactors.$inferSelect;
export type NewCalibrationFactor = typeof calibrationFactors.$inferInsert;

// 보정계수 관계 정의
// ✅ UUID 통일: equipment.uuid → equipment.id 참조로 변경
export const calibrationFactorsRelations = relations(calibrationFactors, ({ one }) => ({
  equipment: one(equipment, {
    fields: [calibrationFactors.equipmentId],
    references: [equipment.id],
  }),
  calibration: one(calibrations, {
    fields: [calibrationFactors.calibrationId],
    references: [calibrations.id],
  }),
  requester: one(users, {
    fields: [calibrationFactors.requestedBy],
    references: [users.id],
    relationName: 'calibrationFactorRequester',
  }),
  approver: one(users, {
    fields: [calibrationFactors.approvedBy],
    references: [users.id],
    relationName: 'calibrationFactorApprover',
  }),
}));
