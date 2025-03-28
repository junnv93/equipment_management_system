import { pgTable, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

export const calibrationStatus = [
  'scheduled',     // 예정됨
  'in_progress',   // 진행 중
  'completed',     // 완료됨
  'failed',        // 실패
  'canceled'       // 취소됨
] as const;

export const calibrations = pgTable('calibrations', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).references(() => equipment.id).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id),
  agency: varchar('agency', { length: 100 }),
  calibrationDate: timestamp('calibration_date').notNull(),
  nextCalibrationDate: timestamp('next_calibration_date'),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  passed: boolean('passed'),
  certificateLocation: text('certificate_location'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const calibrationRelations = relations(calibrations, ({ one }) => ({
  equipment: one(equipment, {
    fields: [calibrations.equipmentId],
    references: [equipment.id],
  }),
  user: one(users, {
    fields: [calibrations.userId],
    references: [users.id],
  }),
}));
