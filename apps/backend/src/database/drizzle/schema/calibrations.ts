import { mysqlTable, varchar, timestamp, text, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 교정 상태 정의
export const calibrationStatus = [
  'scheduled',   // 예정됨
  'in_progress', // 진행 중
  'completed',   // 완료됨
  'failed'       // 실패
] as const;

// 교정 테이블 스키마
export const calibrations = mysqlTable('calibrations', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  technicianId: varchar('technician_id', { length: 36 }),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),
  
  // 교정 정보
  calibrationDate: timestamp('calibration_date').notNull(),
  completionDate: timestamp('completion_date'),
  agencyName: varchar('agency_name', { length: 100 }),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  result: varchar('result', { length: 100 }),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  
  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}); 