import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';

// 사용자 역할 정의
export const userRoles = [
  'admin',      // 관리자
  'user',       // 일반 사용자
  'approver'    // 승인자
] as const;

// 사용자 테이블 스키마
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  teamId: uuid('team_id'),
  azureAdId: varchar('azure_ad_id', { length: 255 }),
  
  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 관계 정의
export const usersRelations = relations(users, ({ many }) => ({
  managedEquipments: many(equipment),
})); 