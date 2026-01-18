import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';

// 사용자 역할 정의 (새로운 역할 시스템)
export const userRoles = [
  'test_operator', // 시험실무자
  'technical_manager', // 기술책임자
  'site_admin', // 시험소별 관리자
] as const;

// 사이트 타입 정의
export const siteTypes = ['suwon', 'uiwang'] as const;

// 위치 타입 정의
export const locationTypes = ['수원랩', '의왕랩'] as const;

// 사용자 테이블 스키마
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('test_operator'),
  teamId: uuid('team_id'),
  azureAdId: varchar('azure_ad_id', { length: 255 }),

  // 사이트 및 위치 정보
  site: varchar('site', { length: 20 }), // 'suwon' | 'uiwang'
  location: varchar('location', { length: 50 }), // '수원랩' | '의왕랩'
  position: varchar('position', { length: 100 }), // 직위 정보

  // 시스템 필드
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 관계 정의
export const usersRelations = relations(users, ({ many }) => ({
  managedEquipments: many(equipment),
}));
