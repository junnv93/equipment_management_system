import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';

// 팀 유형 정의
export const teamTypes = [
  'RF', // RF팀
  'SAR', // SAR팀
  'EMC', // EMC팀
  'AUTO', // Automotive팀
  'GENERAL', // 일반팀
] as const;

// 팀 테이블 스키마
// ✅ 스키마 일치화: id가 uuid 타입으로 변경됨
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }), // ✅ 실제 DB에는 type 컬럼이 없을 수 있음 (옵셔널로 처리)
  description: varchar('description', { length: 255 }),
  site: varchar('site', { length: 20 }), // 'suwon' | 'uiwang'

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 관계 정의
export const teamsRelations = relations(teams, ({ many }) => ({
  equipments: many(equipment),
}));
