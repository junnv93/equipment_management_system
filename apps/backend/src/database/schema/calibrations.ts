import { pgTable, uuid, varchar, timestamp, text, boolean, index } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 교정 방법 enum
export const CalibrationMethod = {
  EXTERNAL: 'external', // 외부 교정
  INTERNAL: 'internal', // 내부 교정
  VERIFICATION: 'verification', // 자체 검증
  VENDOR: 'vendor', // 제조사 교정
} as const;

// 교정 결과 enum
export const CalibrationResult = {
  PASS: 'pass', // 합격
  FAIL: 'fail', // 불합격
  CONDITIONAL: 'conditional', // 조건부 합격
  PENDING: 'pending', // 대기 중
} as const;

// 교정 테이블 스키마
export const calibrations = pgTable('calibrations', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id').notNull(),
  calibrationDate: timestamp('calibration_date').notNull(),
  nextCalibrationDate: timestamp('next_calibration_date').notNull(),
  method: varchar('method', { length: 50 }).notNull(),
  agency: varchar('agency', { length: 255 }),
  performedBy: uuid('performed_by'),
  result: varchar('result', { length: 50 }).notNull(),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  certificateFile: varchar('certificate_file', { length: 255 }),
  notes: text('notes'),
  isVerified: boolean('is_verified').default(false),
  verifiedBy: uuid('verified_by'),
  verificationDate: timestamp('verification_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    equipmentIdIdx: index('calibration_equipment_id_idx').on(table.equipmentId),
    calibrationDateIdx: index('calibration_date_idx').on(table.calibrationDate),
    nextCalibrationDateIdx: index('next_calibration_date_idx').on(table.nextCalibrationDate),
    methodIdx: index('calibration_method_idx').on(table.method),
    resultIdx: index('calibration_result_idx').on(table.result),
    performedByIdx: index('calibration_performed_by_idx').on(table.performedBy),
  };
});

// 교정 타입 정의
export type Calibration = typeof calibrations.$inferSelect;
export type NewCalibration = typeof calibrations.$inferInsert;

// Zod 스키마 직접 정의
export const insertCalibrationSchema = z.object({
  equipmentId: z.string().uuid(),
  calibrationDate: z.date(),
  nextCalibrationDate: z.date(),
  method: z.enum([
    CalibrationMethod.EXTERNAL,
    CalibrationMethod.INTERNAL,
    CalibrationMethod.VERIFICATION,
    CalibrationMethod.VENDOR,
  ]),
  agency: z.string().max(255).optional(),
  performedBy: z.string().uuid().optional(),
  result: z.enum([
    CalibrationResult.PASS,
    CalibrationResult.FAIL,
    CalibrationResult.CONDITIONAL,
    CalibrationResult.PENDING,
  ]),
  certificateNumber: z.string().max(100).optional(),
  certificateFile: z.string().max(255).optional(),
  notes: z.string().optional(),
  isVerified: z.boolean().optional(),
  verifiedBy: z.string().uuid().optional(),
  verificationDate: z.date().optional(),
});

export const selectCalibrationSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  calibrationDate: z.date(),
  nextCalibrationDate: z.date(),
  method: z.string(),
  agency: z.string().nullable().optional(),
  performedBy: z.string().uuid().nullable().optional(),
  result: z.string(),
  certificateNumber: z.string().nullable().optional(),
  certificateFile: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isVerified: z.boolean(),
  verifiedBy: z.string().uuid().nullable().optional(),
  verificationDate: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { Equipment } from './equipment';
import type { User } from './users';

export type CalibrationWithRelations = Calibration & {
  equipment?: Equipment;
  performer?: User;
  verifier?: User;
};

export const calibrationRelations = {
  equipment: null,
  performer: null,
  verifier: null,
} as const; 