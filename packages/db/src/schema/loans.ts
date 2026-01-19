import { pgTable, varchar, timestamp, text, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH 준수
 *
 * 이 배열은 packages/schemas/src/enums.ts의 LoanStatusEnum과 반드시 일치해야 합니다.
 * 상태값 변경 시 enums.ts를 먼저 수정하고, 이 파일도 동기화해야 합니다.
 *
 * @see packages/schemas/src/enums.ts - LoanStatusEnum
 */
export const loanStatus = [
  'pending', // 대여 신청 (승인 대기)
  'approved', // 승인됨 (아직 대여 시작 전)
  'active', // 대여 중 (실제 사용 중)
  'returned', // 반납 완료
  'overdue', // 반납 기한 초과
  'rejected', // 거절됨
  'canceled', // 취소됨
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
  rejectionReason: text('rejection_reason'), // 반려 사유 (반려 시 필수)
  approverComment: text('approver_comment'), // 승인자 코멘트
  autoApproved: boolean('auto_approved').default(false), // 동일 팀 자동 승인 여부

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
