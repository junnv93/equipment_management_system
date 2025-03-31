import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 사용자 역할 enum
export const UserRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

// 사용자 테이블 스키마
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default(UserRole.USER),
  teamId: uuid('team_id'),
  azureAdId: varchar('azure_ad_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 사용자 타입 정의
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Zod 스키마 직접 정의
export const insertUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  role: z.enum([
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.USER,
  ]).default(UserRole.USER),
  teamId: z.string().uuid().optional(),
  azureAdId: z.string().max(255).optional(),
});

export const selectUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.string(),
  teamId: z.string().uuid().nullable().optional(),
  azureAdId: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { Team } from './teams';
import type { Equipment } from './equipment';
import type { Loan } from './loans';

export type UserWithRelations = User & {
  team?: Team;
  managedEquipment?: Equipment[];
  loans?: Loan[];
  approvedLoans?: Loan[];
};

export const userRelations = {
  team: null,
  managedEquipment: [],
  loans: [],
  approvedLoans: [],
} as const; 