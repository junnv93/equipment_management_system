import { mysqlTable, varchar, timestamp, text } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 반출 상태 정의
export const checkoutStatus = [
  'pending', // 대기 중
  'approved', // 승인됨
  'rejected', // 거부됨
  'checked_out', // 반출 중
  'returned', // 반납 완료
  'overdue', // 반납 기한 초과
] as const;

// 장비 반출 테이블 스키마
export const checkouts = mysqlTable('checkouts', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  requesterId: varchar('requester_id', { length: 36 }).notNull(),
  approverId: varchar('approver_id', { length: 36 }),
  returnerId: varchar('returner_id', { length: 36 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),

  // 반출 정보
  destination: varchar('destination', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }),
  address: varchar('address', { length: 255 }),
  reason: text('reason').notNull(),
  checkoutDate: timestamp('checkout_date'),
  expectedReturnDate: timestamp('expected_return_date').notNull(),
  actualReturnDate: timestamp('actual_return_date'),

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

// 반출된 장비 목록 테이블 스키마
export const checkoutItems = mysqlTable('checkout_items', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  checkoutId: varchar('checkout_id', { length: 36 }).notNull(),
  equipmentId: varchar('equipment_id', { length: 36 }).notNull(),
  quantity: varchar('quantity', { length: 10 }).notNull().default('1'),

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
