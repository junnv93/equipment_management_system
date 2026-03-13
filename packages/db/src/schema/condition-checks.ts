import { pgTable, varchar, timestamp, text, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  CONDITION_CHECK_STEP_VALUES,
  CONDITION_STATUS_VALUES,
  ACCESSORIES_STATUS_VALUES,
} from '@equipment-management/schemas';
import type { ConditionCheckStep } from '@equipment-management/schemas';
import { checkouts } from './checkouts';
import { users } from './users';

/** @see packages/schemas/src/enums.ts - ConditionCheckStepEnum (SSOT) */
export const conditionCheckStep = CONDITION_CHECK_STEP_VALUES;

/** @see packages/schemas/src/enums.ts - ConditionStatusEnum (SSOT) */
export const conditionStatus = CONDITION_STATUS_VALUES;

/** @see packages/schemas/src/enums.ts - AccessoriesStatusEnum (SSOT) */
export const accessoriesStatus = ACCESSORIES_STATUS_VALUES;

/**
 * 상태 확인 기록 테이블 (대여 목적 양측 4단계 확인용)
 *
 * 대여 목적 반출 시 양측 4단계 확인을 기록합니다:
 * - ① 반출 전 확인 (빌려주는 측)
 * - ② 인수 시 확인 (빌리는 측)
 * - ③ 반납 전 확인 (빌린 측)
 * - ④ 반입 시 확인 (빌려준 측)
 *
 * 각 단계에서 외관 상태, 작동 상태, 부속품 상태를 기록합니다.
 */
export const conditionChecks = pgTable(
  'condition_checks',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 반출 참조
    checkoutId: uuid('checkout_id')
      .notNull()
      .references(() => checkouts.id, { onDelete: 'cascade' }),

    // 확인 단계
    step: varchar('step', { length: 50 }).$type<ConditionCheckStep>().notNull(), // lender_checkout, borrower_receive, ...

    // 확인자 정보
    checkedBy: uuid('checked_by')
      .notNull()
      .references(() => users.id),
    checkedAt: timestamp('checked_at').defaultNow().notNull(),

    // 상태 확인 항목
    appearanceStatus: varchar('appearance_status', { length: 20 }).notNull(), // normal, abnormal
    operationStatus: varchar('operation_status', { length: 20 }).notNull(), // normal, abnormal
    accessoriesStatus: varchar('accessories_status', { length: 20 }), // complete, incomplete (선택)

    // 이상 시 상세 기록
    abnormalDetails: text('abnormal_details'),

    // 이전 단계와 비교 (④단계에서 사용)
    comparisonWithPrevious: text('comparison_with_previous'),

    // 메모/비고
    notes: text('notes'),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    checkoutIdIdx: index('condition_checks_checkout_id_idx').on(table.checkoutId),
    checkedByIdx: index('condition_checks_checked_by_idx').on(table.checkedBy),
    // stepIdx 제거: 4값 저선택도 enum, 단독 쿼리 없음
  })
);

// 관계 정의
export const conditionChecksRelations = relations(conditionChecks, ({ one }) => ({
  checkout: one(checkouts, {
    fields: [conditionChecks.checkoutId],
    references: [checkouts.id],
  }),
  checker: one(users, {
    fields: [conditionChecks.checkedBy],
    references: [users.id],
    relationName: 'condition_check_checker',
  }),
}));
