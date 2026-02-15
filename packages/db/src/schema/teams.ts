import { pgTable, varchar, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

// 팀 유형 정의 (분류와 1:1 매핑)
// ✅ 팀 타입 = 분류 타입 (팀 이름을 분류 이름으로 통일)
export const teamTypes = [
  'FCC_EMC_RF', // FCC EMC/RF → E
  'GENERAL_EMC', // General EMC → R
  'GENERAL_RF', // General RF → W (의왕)
  'SAR', // SAR → S
  'AUTOMOTIVE_EMC', // Automotive EMC → A
  'SOFTWARE', // Software Program → P
] as const;

// 분류코드 정의 (팀과 1:1 매핑)
export const classificationCodes = ['E', 'R', 'W', 'S', 'A', 'P'] as const;

// 팀 타입 → 분류코드 매핑
export const TEAM_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  FCC_EMC_RF: 'E', // FCC EMC/RF
  GENERAL_EMC: 'R', // General EMC
  GENERAL_RF: 'W', // General RF
  SAR: 'S', // SAR
  AUTOMOTIVE_EMC: 'A', // Automotive EMC
  SOFTWARE: 'P', // Software Program
  // 레거시 호환성
  RF: 'E',
  EMC: 'R',
  AUTO: 'A',
};

// 사이트 타입 정의 (팀이 소속된 사이트)
// ✅ 확장: 평택(pyeongtaek) 사이트 추가
export const siteTypes = ['suwon', 'uiwang', 'pyeongtaek'] as const;

// 팀 테이블 스키마
// ✅ Best Practice: 팀은 반드시 하나의 사이트에 소속됨
// ✅ 팀이 장비 분류코드를 결정함 (classificationCode 필드)
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // ✅ 필수 필드: RF, SAR, EMC, AUTO, SOFTWARE
    site: varchar('site', { length: 20 }).notNull(), // ✅ 필수 필드: 'suwon' | 'uiwang' | 'pyeongtaek'
    classificationCode: varchar('classification_code', { length: 1 }), // ✅ 분류코드: E, R, S, A, P
    description: varchar('description', { length: 255 }),
    leaderId: uuid('leader_id'),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // 사이트별 팀 조회 최적화
    siteIdx: index('teams_site_idx').on(table.site),
  })
);

// 관계 정의
// NOTE: teams↔users 관계가 2개 (members, leader)이므로 relationName으로 구분
export const teamsRelations = relations(teams, ({ many, one }) => ({
  equipments: many(equipment),
  members: many(users, { relationName: 'teamMembers' }),
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
    relationName: 'teamLeader',
  }),
}));

// 타입 정의
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
