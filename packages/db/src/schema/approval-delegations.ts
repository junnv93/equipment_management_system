import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import type { ApprovalCategory } from '@equipment-management/schemas';
import { users } from './users';

export const approvalDelegations = pgTable(
  'approval_delegations',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    delegatorId: uuid('delegator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    delegateeId: uuid('delegatee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    category: varchar('category', { length: 50 }).$type<ApprovalCategory>().notNull(),
    reason: varchar('reason', { length: 500 }),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('approval_delegations_delegatee_active_idx').on(
      table.delegateeId,
      table.category,
      table.startsAt,
      table.endsAt,
      table.revokedAt
    ),
    index('approval_delegations_delegator_idx').on(table.delegatorId, table.startsAt),
    uniqueIndex('approval_delegations_no_duplicate_active_idx').on(
      table.delegatorId,
      table.delegateeId,
      table.category,
      table.startsAt,
      table.endsAt
    ),
  ]
);

export type ApprovalDelegation = typeof approvalDelegations.$inferSelect;
export type NewApprovalDelegation = typeof approvalDelegations.$inferInsert;
