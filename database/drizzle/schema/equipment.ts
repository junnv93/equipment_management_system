// equipment.ts - 장비 스키마 예시
import { pgTable, varchar, integer, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './teams';
import { users } from './users';
import { loans } from './loans';
import { calibrations } from './calibrations';

export const equipmentStatus = [
  'available',    // 사용 가능
  'loaned',       // 대여 중
  'checked_out',  // 반출 중
  'calibration_scheduled', // 교정 예정
  'calibration_overdue',   // 교정 기한 초과
  'maintenance',  // 유지보수 중
  'retired'       // 사용 중지
] as const;

export const calibrationMethods = [
  'external_calibration',  // 외부 교정
  'self_inspection',       // 자체 점검
  'not_applicable'         // 비대상
] as const;

export const equipment = pgTable('equipment', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  managementNumber: varchar('management_number', { length: 50 }).unique().notNull(),
  assetNumber: varchar('asset_number', { length: 50 }),
  modelName: varchar('model_name', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  location: varchar('location', { length: 100 }),
  
  // 교정 정보
  calibrationCycle: integer('calibration_cycle'), // 개월 단위
  lastCalibrationDate: timestamp('last_calibration_date'),
  nextCalibrationDate: timestamp('next_calibration_date'),
  calibrationAgency: varchar('calibration_agency', { length: 100 }),
  needsIntermediateCheck: boolean('needs_intermediate_check').default(false),
  calibrationMethod: varchar('calibration_method', { length: 50 }).notNull(),
  
  // 관리 정보
  purchaseYear: integer('purchase_year'),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id),
  managerId: varchar('manager_id', { length: 36 }).references(() => users.id),
  
  // 추가 정보
  supplier: varchar('supplier', { length: 100 }),
  contactInfo: varchar('contact_info', { length: 100 }),
  softwareVersion: varchar('software_version', { length: 50 }),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  manualLocation: text('manual_location'),
  accessories: text('accessories'),
  mainFeatures: text('main_features'),
  technicalManager: varchar('technical_manager', { length: 100 }),
  
  // 상태 정보
  status: varchar('status', { length: 50 }).notNull().default('available'),
  
  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 관계 정의
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  team: one(teams, {
    fields: [equipment.teamId],
    references: [teams.id],
  }),
  manager: one(users, {
    fields: [equipment.managerId],
    references: [users.id],
  }),
  loans: many(loans),
  calibrations: many(calibrations),
  // 기타 관계
})); 