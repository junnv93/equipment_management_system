import { pgTable, varchar, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * ⚠️ SSOT 준수: 팀 관련 상수는 @equipment-management/schemas에서 import
 * - teamTypes 제거 → ClassificationEnum 사용
 * - TEAM_TYPE_TO_CLASSIFICATION 제거 → CLASSIFICATION_TO_CODE 사용
 * - siteTypes 제거 → SiteEnum 사용
 */

// 팀 테이블 스키마
// ✅ SSOT: classification 필드는 장비의 classification과 동일한 값 사용
// ✅ Best Practice: 팀은 반드시 하나의 사이트에 소속됨
// ✅ 팀이 장비 분류를 결정함 (classification = classificationCode의 전체 이름)
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    classification: varchar('classification', { length: 50 }).notNull(), // ✅ type → classification (소문자 통일)
    site: varchar('site', { length: 20 }).notNull(), // ✅ 필수 필드: 'suwon' | 'uiwang' | 'pyeongtaek'
    classificationCode: varchar('classification_code', { length: 1 }), // ✅ 분류코드: E, R, W, S, A, P
    description: varchar('description', { length: 255 }),
    leaderId: uuid('leader_id').references(() => users.id, { onDelete: 'set null' }),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // 사이트별 팀 조회 최적화
    siteIdx: index('teams_site_idx').on(table.site),
    // 분류별 팀 조회 최적화 (신규)
    classificationIdx: index('teams_classification_idx').on(table.classification),
    leaderIdIdx: index('teams_leader_id_idx').on(table.leaderId),
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
