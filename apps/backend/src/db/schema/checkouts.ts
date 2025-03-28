import { pgTable, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

export const checkoutStatus = [
  'pending',     // 승인 대기 중
  'approved',    // 승인됨
  'rejected',    // 거부됨
  'active',      // 반출 중
  'returned',    // 반입 완료
  'overdue'      // 반입 기한 초과
] as const;

export const checkouts = pgTable('checkouts', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).references(() => equipment.id).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id).notNull(),
  approverId: varchar('approver_id', { length: 36 }).references(() => users.id),
  destination: varchar('destination', { length: 255 }).notNull(),
  contactInfo: varchar('contact_info', { length: 100 }),
  purpose: text('purpose').notNull(),
  startDate: timestamp('start_date').notNull(),
  expectedEndDate: timestamp('expected_end_date').notNull(),
  actualEndDate: timestamp('actual_end_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const checkoutRelations = relations(checkouts, ({ one }) => ({
  equipment: one(equipment, {
    fields: [checkouts.equipmentId],
    references: [equipment.id],
  }),
  user: one(users, {
    fields: [checkouts.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [checkouts.approverId],
    references: [users.id],
  }),
}));
