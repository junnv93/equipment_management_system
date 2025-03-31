import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 반출 상태 enum
export const CheckoutStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
} as const;

// 반출 테이블 스키마
export const checkouts = pgTable('checkouts', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id').notNull().references(() => equipment.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  approverId: uuid('approver_id').references(() => users.id),
  location: varchar('location', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  address: text('address'),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).notNull().default(CheckoutStatus.PENDING),
  checkoutDate: timestamp('checkout_date').notNull().defaultNow(),
  expectedReturnDate: timestamp('expected_return_date'),
  actualReturnDate: timestamp('actual_return_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 반출 타입 정의
export type Checkout = typeof checkouts.$inferSelect;
export type NewCheckout = typeof checkouts.$inferInsert;

// Zod 스키마 직접 정의
export const insertCheckoutSchema = z.object({
  equipmentId: z.string().uuid(),
  userId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
  location: z.string().min(1).max(255),
  phoneNumber: z.string().max(50).optional(),
  address: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum([
    CheckoutStatus.PENDING,
    CheckoutStatus.APPROVED,
    CheckoutStatus.REJECTED,
    CheckoutStatus.ACTIVE,
    CheckoutStatus.RETURNED,
    CheckoutStatus.OVERDUE,
  ]).optional(),
  checkoutDate: z.date().optional(),
  expectedReturnDate: z.date().optional(),
  actualReturnDate: z.date().optional(),
  notes: z.string().optional(),
});

export const selectCheckoutSchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  userId: z.string().uuid(),
  approverId: z.string().uuid().nullable().optional(),
  location: z.string(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  status: z.string(),
  checkoutDate: z.date(),
  expectedReturnDate: z.date().nullable().optional(),
  actualReturnDate: z.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { Equipment } from './equipment';
import type { User } from './users';
import { users } from './users';
import { equipment } from './equipment';

export type CheckoutWithRelations = Checkout & {
  equipment?: Equipment;
  user?: User;
  approver?: User;
};

export const checkoutRelations = {
  equipment: null,
  user: null,
  approver: null,
} as const; 