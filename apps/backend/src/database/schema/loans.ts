import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 대여 상태 enum
export const LoanStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
} as const;

// 대여 테이블 스키마
export const loans = pgTable('loans', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id').notNull(),
  borrowerId: uuid('borrower_id').notNull(),
  approverId: uuid('approver_id'),
  status: varchar('status', { length: 50 }).notNull().default(LoanStatus.PENDING),
  loanDate: timestamp('loan_date'),
  expectedReturnDate: timestamp('expected_return_date').notNull(),
  actualReturnDate: timestamp('actual_return_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 대여 타입 정의
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;

// Zod 스키마 직접 정의
export const insertLoanSchema = z.object({
  equipmentId: z.string().uuid(),
  borrowerId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
  status: z.enum([
    LoanStatus.PENDING,
    LoanStatus.APPROVED,
    LoanStatus.REJECTED,
    LoanStatus.ACTIVE,
    LoanStatus.RETURNED,
    LoanStatus.OVERDUE,
  ]).default(LoanStatus.PENDING),
  loanDate: z.date().optional(),
  expectedReturnDate: z.date(),
  actualReturnDate: z.date().optional(),
  notes: z.string().optional(),
});

export const selectLoanSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  borrowerId: z.string().uuid(),
  approverId: z.string().uuid().nullable().optional(),
  status: z.string(),
  loanDate: z.date().nullable().optional(),
  expectedReturnDate: z.date(),
  actualReturnDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { Equipment } from './equipment';
import type { User } from './users';

export type LoanWithRelations = Loan & {
  equipment?: Equipment;
  borrower?: User;
  approver?: User;
};

export const loanRelations = {
  equipment: null,
  borrower: null,
  approver: null,
} as const; 