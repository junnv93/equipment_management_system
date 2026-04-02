import { pgTable, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

// NOTE: UNIQUE(category, key, COALESCE(site, '__global__')) constraint는
// migration SQL에서만 정의 — Drizzle ORM의 .on()이 SQL 표현식을 지원하지 않음
export const systemSettings = pgTable(
  'system_settings',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    value: jsonb('value').notNull(),
    site: varchar('site', { length: 20 }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_system_settings_lookup').on(table.category, table.site)]
);
