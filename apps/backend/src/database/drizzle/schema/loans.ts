import { pgTable, varchar, timestamp, text, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 대여 상태 정의
export const loanStatus = [
  'pending', // 대기 중
  'active', // 대여 중
  'returned', // 반납 완료
  'overdue', // 반납 기한 초과
] as const;

// 대여 테이블 스키마
export const loans = pgTable('loans', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id').notNull(),
  borrowerId: uuid('borrower_id').notNull(),
  approverId: uuid('approver_id'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),

  // 대여 정보
  loanDate: timestamp('loan_date'),
  expectedReturnDate: timestamp('expected_return_date').notNull(),
  actualReturnDate: timestamp('actual_return_date'),
  notes: text('notes'),

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
