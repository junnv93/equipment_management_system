import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 장비 폐기 요청 테이블
 *
 * 2단계 승인 워크플로우:
 * 1. 요청 (test_engineer, technical_manager, lab_manager)
 * 2. 검토 (technical_manager, 같은 팀) → reviewStatus='reviewed'
 * 3. 승인 (lab_manager) → reviewStatus='approved', equipment.status='disposed'
 *
 * reviewStatus:
 * - pending: 검토 대기
 * - reviewed: 검토 완료 (승인 대기)
 * - approved: 최종 승인 (폐기 완료)
 * - rejected: 반려됨 (review 또는 approval 단계에서)
 *
 * @see packages/schemas/src/types/disposal.ts - DisposalRequest 타입
 * @see packages/schemas/src/enums.ts - DisposalReasonEnum, DisposalReviewStatusEnum
 */
export const disposalRequests = pgTable(
  'disposal_requests',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 장비 정보 (cascade delete: 장비 삭제 시 폐기 요청도 함께 삭제)
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'cascade' }),

    // 폐기 사유
    // @see packages/schemas/src/enums.ts - DisposalReasonEnum
    reason: varchar('reason', { length: 50 }).notNull(),
    reasonDetail: text('reason_detail').notNull(),

    // 요청자 정보 (restrict: 사용자 삭제 방지)
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    requestedAt: timestamp('requested_at').defaultNow().notNull(),

    // 검토 정보 (technical_manager, 같은 팀)
    reviewStatus: varchar('review_status', { length: 20 }).notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'restrict' }),
    reviewedAt: timestamp('reviewed_at'),
    reviewOpinion: text('review_opinion'),

    // 승인 정보 (lab_manager)
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'restrict' }),
    approvedAt: timestamp('approved_at'),
    approvalComment: text('approval_comment'),

    // 반려 정보 (review 또는 approval 단계)
    rejectedBy: uuid('rejected_by').references(() => users.id, { onDelete: 'restrict' }),
    rejectedAt: timestamp('rejected_at'),
    rejectionReason: text('rejection_reason'),
    rejectionStep: varchar('rejection_step', { length: 20 }), // 'review' | 'approval'

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // 장비별 폐기 요청 조회 (중복 방지)
      equipmentIdIdx: index('disposal_requests_equipment_id_idx').on(table.equipmentId),

      // 상태별 필터링
      reviewStatusIdx: index('disposal_requests_review_status_idx').on(table.reviewStatus),

      // 사용자별 요청 조회
      requestedByIdx: index('disposal_requests_requested_by_idx').on(table.requestedBy),
      reviewedByIdx: index('disposal_requests_reviewed_by_idx').on(table.reviewedBy),
      approvedByIdx: index('disposal_requests_approved_by_idx').on(table.approvedBy),

      // 날짜별 조회
      requestedAtIdx: index('disposal_requests_requested_at_idx').on(table.requestedAt),
    };
  }
);

// 타입 정의
export type DisposalRequest = typeof disposalRequests.$inferSelect;
export type NewDisposalRequest = typeof disposalRequests.$inferInsert;

// Relations 정의 (타입 안전한 조인)
export const disposalRequestsRelations = relations(disposalRequests, ({ one }) => ({
  equipment: one(equipment, {
    fields: [disposalRequests.equipmentId],
    references: [equipment.id],
  }),
  requester: one(users, {
    fields: [disposalRequests.requestedBy],
    references: [users.id],
    relationName: 'requester',
  }),
  reviewer: one(users, {
    fields: [disposalRequests.reviewedBy],
    references: [users.id],
    relationName: 'reviewer',
  }),
  approver: one(users, {
    fields: [disposalRequests.approvedBy],
    references: [users.id],
    relationName: 'approver',
  }),
  rejector: one(users, {
    fields: [disposalRequests.rejectedBy],
    references: [users.id],
    relationName: 'rejector',
  }),
}));
