import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 팀 유형 enum
export const TeamType = {
  DEPARTMENT: 'department',
  PROJECT: 'project',
  TASK_FORCE: 'task_force',
  LABORATORY: 'laboratory',
} as const;

// 팀 테이블 스키마
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 팀 타입 정의
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

// Zod 스키마 직접 정의
export const insertTeamSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    TeamType.DEPARTMENT,
    TeamType.PROJECT,
    TeamType.TASK_FORCE,
    TeamType.LABORATORY,
  ]).default(TeamType.DEPARTMENT),
  description: z.string().max(255).optional(),
});

export const selectTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { User } from './users';
import type { Equipment } from './equipment';

export type TeamWithRelations = Team & {
  members?: User[];
  equipment?: Equipment[];
};

export const teamRelations = {
  members: [],
  equipment: [],
} as const; 