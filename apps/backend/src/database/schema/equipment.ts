import { pgTable, uuid, varchar, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// 장비 상태 enum
export const EquipmentStatus = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  UNDER_MAINTENANCE: 'under_maintenance',
  CALIBRATING: 'calibrating',
  RETIRED: 'retired',
} as const;

// 장비 테이블 스키마
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  managementNumber: varchar('management_number', { length: 50 }).notNull().unique(),
  assetNumber: varchar('asset_number', { length: 50 }),
  modelName: varchar('model_name', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  serialNumber: varchar('serial_number', { length: 100 }),
  location: varchar('location', { length: 100 }),
  calibrationCycle: integer('calibration_cycle'),
  lastCalibrationDate: timestamp('last_calibration_date'),
  nextCalibrationDate: timestamp('next_calibration_date'),
  calibrationAgency: varchar('calibration_agency', { length: 100 }),
  needsIntermediateCheck: boolean('needs_intermediate_check').default(false),
  calibrationMethod: varchar('calibration_method', { length: 50 }),
  purchaseYear: integer('purchase_year'),
  teamId: uuid('team_id'),
  managerId: uuid('manager_id'),
  supplier: varchar('supplier', { length: 100 }),
  contactInfo: varchar('contact_info', { length: 100 }),
  softwareVersion: varchar('software_version', { length: 50 }),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  manualLocation: text('manual_location'),
  accessories: text('accessories'),
  mainFeatures: text('main_features'),
  technicalManager: varchar('technical_manager', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default(EquipmentStatus.AVAILABLE),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 장비 타입 정의
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;

// Zod 스키마 직접 정의
export const insertEquipmentSchema = z.object({
  name: z.string().min(1).max(100),
  managementNumber: z.string().min(1).max(50),
  assetNumber: z.string().max(50).optional(),
  modelName: z.string().max(100).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  calibrationCycle: z.number().int().positive().optional(),
  lastCalibrationDate: z.date().optional(),
  nextCalibrationDate: z.date().optional(),
  calibrationAgency: z.string().max(100).optional(),
  needsIntermediateCheck: z.boolean().optional(),
  calibrationMethod: z.string().max(50).optional(),
  purchaseYear: z.number().int().positive().optional(),
  teamId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  supplier: z.string().max(100).optional(),
  contactInfo: z.string().max(100).optional(),
  softwareVersion: z.string().max(50).optional(),
  firmwareVersion: z.string().max(50).optional(),
  manualLocation: z.string().optional(),
  accessories: z.string().optional(),
  mainFeatures: z.string().optional(),
  technicalManager: z.string().max(100).optional(),
  status: z.enum([
    EquipmentStatus.AVAILABLE,
    EquipmentStatus.IN_USE,
    EquipmentStatus.UNDER_MAINTENANCE,
    EquipmentStatus.CALIBRATING,
    EquipmentStatus.RETIRED,
  ]).optional(),
});

export const selectEquipmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  managementNumber: z.string(),
  assetNumber: z.string().nullable().optional(),
  modelName: z.string().nullable().optional(),
  manufacturer: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  calibrationCycle: z.number().nullable().optional(),
  lastCalibrationDate: z.date().nullable().optional(),
  nextCalibrationDate: z.date().nullable().optional(),
  calibrationAgency: z.string().nullable().optional(),
  needsIntermediateCheck: z.boolean().optional(),
  calibrationMethod: z.string().nullable().optional(),
  purchaseYear: z.number().nullable().optional(),
  teamId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  supplier: z.string().nullable().optional(),
  contactInfo: z.string().nullable().optional(),
  softwareVersion: z.string().nullable().optional(),
  firmwareVersion: z.string().nullable().optional(),
  manualLocation: z.string().nullable().optional(),
  accessories: z.string().nullable().optional(),
  mainFeatures: z.string().nullable().optional(),
  technicalManager: z.string().nullable().optional(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { Team } from './teams';
import type { User } from './users'; 
import type { Loan } from './loans';

export type EquipmentWithRelations = Equipment & {
  team?: Team;
  manager?: User;
  loans?: Loan[];
};

export const equipmentRelations = {
  loans: [],
  team: null,
  manager: null,
} as const; 