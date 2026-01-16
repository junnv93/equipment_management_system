import { pgTable, varchar, timestamp, text, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH 준수
 *
 * 이 배열은 packages/schemas/src/enums.ts의 CheckoutStatusEnum과 반드시 일치해야 합니다.
 * 상태값 변경 시 enums.ts를 먼저 수정하고, 이 파일도 동기화해야 합니다.
 *
 * @see packages/schemas/src/enums.ts - CheckoutStatusEnum
 */
export const checkoutStatus = [
  'pending', // 반출 신청 (승인 대기)
  'first_approved', // 1차 승인됨 (외부 대여만, 2단계 승인 필요)
  'final_approved', // 최종 승인됨 (반출 가능)
  'rejected', // 거절됨
  'checked_out', // 반출 중
  'returned', // 반입 완료
  'overdue', // 반입 기한 초과
  'canceled', // 취소됨
] as const;

/**
 * 반출 목적 열거형
 * @see packages/schemas/src/enums.ts - CheckoutPurposeEnum
 */
export const checkoutPurpose = [
  'calibration', // 교정
  'repair', // 수리
  'external_rental', // 외부 대여
] as const;

// 장비 반출 테이블 스키마
export const checkouts = pgTable('checkouts', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),

  // 사용자 정보
  requesterId: uuid('requester_id')
    .notNull()
    .references(() => users.id), // 신청자 (장비 담당자)
  firstApproverId: uuid('first_approver_id').references(() => users.id), // 1차 승인자 (담당자 또는 팀 매니저)
  finalApproverId: uuid('final_approver_id').references(() => users.id), // 최종 승인자 (팀 매니저, 외부 대여만)
  returnerId: uuid('returner_id').references(() => users.id), // 반입 처리자

  // 반출 정보
  purpose: varchar('purpose', { length: 50 }).notNull(), // 목적: calibration, repair, external_rental
  destination: varchar('destination', { length: 255 }).notNull(), // 반출 장소
  phoneNumber: varchar('phone_number', { length: 50 }),
  address: text('address'),
  reason: text('reason').notNull(), // 반출 사유

  // 날짜 정보
  checkoutDate: timestamp('checkout_date'), // 실제 반출일
  expectedReturnDate: timestamp('expected_return_date').notNull(), // 예상 반입일
  actualReturnDate: timestamp('actual_return_date'), // 실제 반입일

  // 상태 및 승인 정보
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  rejectionReason: text('rejection_reason'), // 반려 사유 (반려 시 필수)

  // 반입 검사 정보
  calibrationChecked: boolean('calibration_checked').default(false), // 교정 확인 여부
  repairChecked: boolean('repair_checked').default(false), // 수리 확인 여부
  workingStatusChecked: boolean('working_status_checked').default(false), // 작동 여부 확인
  inspectionNotes: text('inspection_notes'), // 검사 비고

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 반출된 장비 목록 테이블 스키마
export const checkoutItems = pgTable('checkout_items', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  checkoutId: uuid('checkout_id')
    .notNull()
    .references(() => checkouts.id, { onDelete: 'cascade' }),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id),

  // 반입 시 검사 정보
  conditionBefore: text('condition_before'), // 반출 전 상태
  conditionAfter: text('condition_after'), // 반입 후 상태
  inspectionNotes: text('inspection_notes'), // 검사 비고

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 관계 정의
export const checkoutsRelations = relations(checkouts, ({ one, many }) => ({
  requester: one(users, {
    fields: [checkouts.requesterId],
    references: [users.id],
    relationName: 'checkout_requester',
  }),
  firstApprover: one(users, {
    fields: [checkouts.firstApproverId],
    references: [users.id],
    relationName: 'checkout_first_approver',
  }),
  finalApprover: one(users, {
    fields: [checkouts.finalApproverId],
    references: [users.id],
    relationName: 'checkout_final_approver',
  }),
  returner: one(users, {
    fields: [checkouts.returnerId],
    references: [users.id],
    relationName: 'checkout_returner',
  }),
  items: many(checkoutItems),
}));

export const checkoutItemsRelations = relations(checkoutItems, ({ one }) => ({
  checkout: one(checkouts, {
    fields: [checkoutItems.checkoutId],
    references: [checkouts.id],
  }),
  equipment: one(equipment, {
    fields: [checkoutItems.equipmentId],
    references: [equipment.id],
  }),
}));
