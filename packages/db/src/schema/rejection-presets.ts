import { pgTable, varchar, text, boolean, integer, uuid, timestamp } from 'drizzle-orm/pg-core';

/**
 * 반려 사유 프리셋 — 관리자가 등록한 반려 사유 템플릿.
 * 반려 모달에서 1-click 선택 → 텍스트에어리어 자동 채움.
 *
 * 시드 데이터는 UL-QP-18 절차서 기준으로 사용자 확인 후 삽입 (임의 생성 금지).
 */
export const rejectionPresets = pgTable('rejection_presets', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  /** 드롭다운 표시 레이블 (예: "교정 예정 중 반출 불가") */
  label: varchar('label', { length: 200 }).notNull(),
  /** 텍스트에어리어 자동 채움용 전문 (선택 사항) */
  template: text('template'),
  /** 기본 제공 프리셋 여부 — true면 삭제 불가 */
  isDefault: boolean('is_default').notNull().default(false),
  /** 정렬 순서 (낮을수록 먼저 표시) */
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type RejectionPreset = typeof rejectionPresets.$inferSelect;
export type NewRejectionPreset = typeof rejectionPresets.$inferInsert;
