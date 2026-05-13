import { pgTable, uuid, varchar, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';

/**
 * 반출지(destination) 관리 엔티티 (SH-6).
 *
 * checkouts.destination varchar(255) 기반 자유 입력을 entity 테이블로 승격.
 * - autocomplete 풍부화: 전체 관리 목록 제공 (개인 이력 5건 제한 해제)
 * - 분석용: JOIN 가능한 정형 데이터 구조
 * - 비파괴적 마이그레이션: checkouts.destination 유지 (FK 변경 없음)
 *
 * 관리 정책:
 * - 체크아웃 생성/수정 시 destination 자동 upsert (이미 존재하면 기존 entity 재사용)
 * - is_active=false: combobox 목록에서 제외하지만 기존 데이터 보존
 */
export const checkoutDestinations = pgTable(
  'checkout_destinations',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    /** 반출지명 — checkouts.destination 값과 동일 (UNIQUE 보장) */
    name: varchar('name', { length: 255 }).notNull(),
    /** false 시 autocomplete 목록에서 제외 (기존 체크아웃 참조 보존) */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    nameUnique: unique('checkout_destinations_name_unique').on(table.name),
    isActiveIdx: index('checkout_destinations_is_active_idx').on(table.isActive),
  })
);

export type CheckoutDestination = typeof checkoutDestinations.$inferSelect;
export type NewCheckoutDestination = typeof checkoutDestinations.$inferInsert;
