import { pgTable, uuid, varchar, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import type { SavedViewScope } from '@equipment-management/schemas';
import { users } from './users';
import { teams } from './teams';

/**
 * 사용자 저장 뷰 (Saved Views) — checkouts 등 목록 화면의 필터 조합을 서버에 영구 저장.
 *
 * - scope 트리아드: PRIVATE / TEAM / GLOBAL (Zod enum SSOT는 `packages/schemas/src/enums/saved-views.ts`)
 *   - PRIVATE: 본인만 read/write — teamId NULL
 *   - TEAM   : 같은 팀 read, 본인만 write — teamId NOT NULL
 *   - GLOBAL : 모두 read, MANAGE_SAVED_VIEWS_GLOBAL 권한만 write — teamId NULL
 * - module 컬럼: 'checkouts' 등 view scope. 향후 equipment/calibration 확장 시 schema 무변경.
 * - CAS 잠금: version 컬럼 (VersionedBaseService 상속) — 드래그 정렬 ↔ 추가/삭제 동시 race 차단.
 * - 한 사용자당 모듈별 5개 제한은 service 레이어에서 enforce (MAX_SAVED_VIEWS).
 */
export const savedViews = pgTable(
  'saved_views',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    /** 표시 이름 — SaveViewDialog input maxLength 80 */
    name: varchar('name', { length: 80 }).notNull(),
    /** URL search params 직렬화 문자열 (예: `status=APPROVED&purpose=CAL`). 클라이언트가 형식 책임. */
    params: text('params').notNull(),
    /** 소유자 — 삭제 시 cascade (사용자 탈퇴 → 본인 saved view 함께 제거) */
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** 뷰가 속한 도메인 모듈 — MVP는 'checkouts' 한 값. */
    module: varchar('module', { length: 40 }).notNull(),
    /** scope 트리아드 — Zod enum `SavedViewScopeEnum`이 SSOT */
    scope: varchar('scope', { length: 16 }).$type<SavedViewScope>().notNull(),
    /** TEAM scope 시 teamId 필수. PRIVATE/GLOBAL은 NULL. 팀 삭제 시 NULL 처리 후 PRIVATE 강등 정책은 service에서. */
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    /** 정렬 순서 (낮을수록 먼저) — reorder endpoint로만 갱신 */
    sortOrder: integer('sort_order').notNull().default(0),
    /** CAS 낙관적 잠금 카운터 — VersionedBaseService.updateWithVersion 사용 */
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    /** 가장 잦은 쿼리: 본인의 module별 목록 정렬 조회 */
    index('saved_views_owner_module_sort_idx').on(table.ownerId, table.module, table.sortOrder),
    /** TEAM scope 멤버 가시성 + GLOBAL read 보조 인덱스 */
    index('saved_views_scope_team_module_idx').on(table.scope, table.teamId, table.module),
  ]
);

export type SavedView = typeof savedViews.$inferSelect;
export type NewSavedView = typeof savedViews.$inferInsert;
