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
  'approved', // 승인됨 (반출 가능)
  'rejected', // 거절됨
  'checked_out', // 반출 중 (교정/수리)
  // 대여 목적 양측 확인 상태 (시험소간 대여)
  'lender_checked', // ① 반출 전 확인 완료 (빌려주는 측)
  'borrower_received', // ② 인수 확인 완료 (빌리는 측)
  'in_use', // 사용 중 (대여)
  'borrower_returned', // ③ 반납 전 확인 완료 (빌린 측)
  'lender_received', // ④ 반입 확인 완료 (빌려준 측)
  'returned', // 반입 완료 (검사 완료)
  'return_approved', // 반입 최종 승인됨 (기술책임자 승인)
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
  'rental', // 외부 대여
] as const;

/**
 * 반출 유형 열거형
 * @see packages/schemas/src/enums.ts - CheckoutTypeEnum
 */
export const checkoutType = [
  'calibration', // 내부 교정 목적 반출
  'repair', // 내부 수리 목적 반출
  'rental', // 외부 대여 목적 반출
] as const;

// 장비 반출 테이블 스키마
export const checkouts = pgTable('checkouts', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),

  // 사용자 정보
  requesterId: uuid('requester_id')
    .notNull()
    .references(() => users.id), // 신청자 (장비 담당자)
  approverId: uuid('approver_id').references(() => users.id), // 승인자 (기술책임자)
  returnerId: uuid('returner_id').references(() => users.id), // 반입 처리자

  // 반출 정보
  purpose: varchar('purpose', { length: 50 }).notNull(), // 목적: calibration, repair, rental
  checkoutType: varchar('checkout_type', { length: 50 }).notNull().default('calibration'), // 반출 유형: calibration, repair, rental
  destination: varchar('destination', { length: 255 }).notNull(), // 반출 장소

  // 외부 대여 시 빌려주는 측 정보
  lenderTeamId: uuid('lender_team_id'), // 빌려주는 측 팀 ID
  lenderSiteId: varchar('lender_site_id', { length: 50 }), // 빌려주는 측 사이트 ID
  phoneNumber: varchar('phone_number', { length: 50 }),
  address: text('address'),
  reason: text('reason').notNull(), // 반출 사유

  // 날짜 정보
  checkoutDate: timestamp('checkout_date'), // 실제 반출일
  expectedReturnDate: timestamp('expected_return_date').notNull(), // 예상 반입일
  actualReturnDate: timestamp('actual_return_date'), // 실제 반입일

  // 상태 및 승인 정보
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  approvedAt: timestamp('approved_at'), // 승인 시간
  rejectionReason: text('rejection_reason'), // 반려 사유 (반려 시 필수)

  // 반입 검사 정보
  calibrationChecked: boolean('calibration_checked').default(false), // 교정 확인 여부
  repairChecked: boolean('repair_checked').default(false), // 수리 확인 여부
  workingStatusChecked: boolean('working_status_checked').default(false), // 작동 여부 확인
  inspectionNotes: text('inspection_notes'), // 검사 비고

  // 반입 승인 정보
  returnApprovedBy: uuid('return_approved_by').references(() => users.id), // 반입 최종 승인자 (기술책임자)
  returnApprovedAt: timestamp('return_approved_at'), // 반입 최종 승인 시간

  // 시험소간 대여 반입 시 빌려준 측 확인 정보
  lenderConfirmedBy: uuid('lender_confirmed_by').references(() => users.id), // 빌려준 측 확인자
  lenderConfirmedAt: timestamp('lender_confirmed_at'), // 빌려준 측 확인 일시
  lenderConfirmNotes: text('lender_confirm_notes'), // 빌려준 측 확인 메모

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 반출된 장비 목록 테이블 스키마
// ✅ UUID 통일: equipmentId를 uuid로 변경 (equipment.id가 uuid로 변경됨)
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
  approver: one(users, {
    fields: [checkouts.approverId],
    references: [users.id],
    relationName: 'checkout_approver',
  }),
  returner: one(users, {
    fields: [checkouts.returnerId],
    references: [users.id],
    relationName: 'checkout_returner',
  }),
  returnApprover: one(users, {
    fields: [checkouts.returnApprovedBy],
    references: [users.id],
    relationName: 'checkout_return_approver',
  }),
  lenderConfirmer: one(users, {
    fields: [checkouts.lenderConfirmedBy],
    references: [users.id],
    relationName: 'checkout_lender_confirmer',
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
