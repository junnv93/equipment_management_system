import { pgTable, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { teams } from './teams';

export const userRoles = [
  'admin',     // 관리자
  'manager',   // 팀장/승인자
  'user'       // 일반 사용자
] as const;

export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id),
  active: boolean('active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRelations = relations(users, ({ one }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
}));
