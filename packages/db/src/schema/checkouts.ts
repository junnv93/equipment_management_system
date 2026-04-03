import {
  pgTable,
  varchar,
  timestamp,
  text,
  uuid,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  CHECKOUT_STATUS_VALUES,
  CHECKOUT_PURPOSE_VALUES,
  CHECKOUT_TYPE_VALUES,
} from '@equipment-management/schemas';
import type { CheckoutStatus } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';

/** @see packages/schemas/src/enums.ts - CheckoutStatusEnum (SSOT) */
export const checkoutStatus = CHECKOUT_STATUS_VALUES;

/** @see packages/schemas/src/enums.ts - CheckoutPurposeEnum (SSOT) */
export const checkoutPurpose = CHECKOUT_PURPOSE_VALUES;

/** @see packages/schemas/src/enums.ts - CheckoutTypeEnum (SSOT) */
export const checkoutType = CHECKOUT_TYPE_VALUES;

// 장비 반출 테이블 스키마
export const checkouts = pgTable(
  'checkouts',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 사용자 정보
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }), // 신청자 (장비 담당자)
    approverId: uuid('approver_id').references(() => users.id, { onDelete: 'restrict' }), // 승인자 (기술책임자)
    returnerId: uuid('returner_id').references(() => users.id, { onDelete: 'restrict' }), // 반입 처리자

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
    status: varchar('status', { length: 50 }).$type<CheckoutStatus>().notNull().default('pending'),
    approvedAt: timestamp('approved_at'), // 승인 시간
    rejectionReason: text('rejection_reason'), // 반려 사유 (반려 시 필수)

    // 반입 검사 정보
    calibrationChecked: boolean('calibration_checked').default(false), // 교정 확인 여부
    repairChecked: boolean('repair_checked').default(false), // 수리 확인 여부
    workingStatusChecked: boolean('working_status_checked').default(false), // 작동 여부 확인
    inspectionNotes: text('inspection_notes'), // 검사 비고

    // 반입 승인 정보
    returnApprovedBy: uuid('return_approved_by').references(() => users.id, {
      onDelete: 'restrict',
    }), // 반입 최종 승인자 (기술책임자)
    returnApprovedAt: timestamp('return_approved_at'), // 반입 최종 승인 시간

    // 시험소간 대여 반입 시 빌려준 측 확인 정보
    lenderConfirmedBy: uuid('lender_confirmed_by').references(() => users.id, {
      onDelete: 'restrict',
    }), // 빌려준 측 확인자
    lenderConfirmedAt: timestamp('lender_confirmed_at'), // 빌려준 측 확인 일시
    lenderConfirmNotes: text('lender_confirm_notes'), // 빌려준 측 확인 메모

    // Optimistic locking version
    version: integer('version').notNull().default(1),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // CAS 복합 인덱스: optimistic locking
    idVersionIdx: index('checkouts_id_version_idx').on(table.id, table.version),
    // 내 반출 목록 조회 최적화
    requesterIdx: index('checkouts_requester_id_idx').on(table.requesterId),
    // 승인 대기 목록 필터 최적화
    statusIdx: index('checkouts_status_idx').on(table.status),
    // 최신순 정렬 + 상태 필터 복합 인덱스
    statusCreatedIdx: index('checkouts_status_created_at_idx').on(table.status, table.createdAt),
    // 기한 초과 탐지 최적화 (스케줄러)
    statusExpectedReturnIdx: index('checkouts_status_expected_return_idx').on(
      table.status,
      table.expectedReturnDate
    ),
    // 대여 시 빌려주는 팀 조회 최적화
    lenderTeamIdIdx: index('checkouts_lender_team_id_idx').on(table.lenderTeamId),
  })
);

// 반출된 장비 목록 테이블 스키마
// ✅ UUID 통일: equipmentId를 uuid로 변경 (equipment.id가 uuid로 변경됨)
export const checkoutItems = pgTable(
  'checkout_items',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    checkoutId: uuid('checkout_id')
      .notNull()
      .references(() => checkouts.id, { onDelete: 'cascade' }),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),

    // 반입 시 검사 정보
    conditionBefore: text('condition_before'), // 반출 전 상태
    conditionAfter: text('condition_after'), // 반입 후 상태
    inspectionNotes: text('inspection_notes'), // 검사 비고

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // checkout_items 조회 최적화
    checkoutIdIdx: index('checkout_items_checkout_id_idx').on(table.checkoutId),
    equipmentIdIdx: index('checkout_items_equipment_id_idx').on(table.equipmentId),
  })
);

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
