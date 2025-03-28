import { pgTable, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

export const loanStatus = [
  'pending',     // 승인 대기 중
  'approved',    // 승인됨
  'rejected',    // 거부됨
  'active',      // 대여 중
  'returned',    // 반납 완료
  'overdue'      // 반납 기한 초과
] as const;

export const loans = pgTable('loans', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).references(() => equipment.id).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id).notNull(),
  approverId: varchar('approver_id', { length: 36 }).references(() => users.id),
  startDate: timestamp('start_date').notNull(),
  expectedEndDate: timestamp('expected_end_date').notNull(),
  actualEndDate: timestamp('actual_end_date'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const loanRelations = relations(loans, ({ one }) => ({
  equipment: one(equipment, {
    fields: [loans.equipmentId],
    references: [equipment.id],
  }),
  user: one(users, {
    fields: [loans.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [loans.approverId],
    references: [users.id],
  }),
}));
