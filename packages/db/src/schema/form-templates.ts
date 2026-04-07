import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

/**
 * 양식 템플릿 테이블
 *
 * UL-QP-18 양식 관리 절차서 기반. 식별자 모델:
 * - `formName`: 안정 키 (양식명은 변경되지 않음). "시험설비 관리대장" 등
 * - `formNumber`: 개정마다 바뀌는 가변 번호. 역사적으로 전역 유니크
 *   (예: 2026년 UL-QP-18-01이 개정되면 UL-QP-26-02로 바뀜)
 *
 * 개정(revise): 새 formNumber로 새 row INSERT + 이전 row의 `isCurrent=false`, `supersededAt=now`
 * 파일 교체(replace): 같은 row의 storage/mime/filename UPDATE. 이력 보존 없음 (절차서 요구 X)
 *
 * UL-QP-18-02 이력카드, UL-QP-19-01 교정계획서는 런타임 생성이라 이 테이블에 행이 없어도 됩니다.
 */
export const formTemplates = pgTable(
  'form_templates',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    /** 양식명 (안정 키, 절차서 공식 명칭). 예: '시험설비 관리대장' */
    formName: varchar('form_name', { length: 200 }).notNull(),
    /** 양식 번호 (가변, 개정마다 변경). 역사적 전역 유니크: 과거 번호로도 조회 가능 */
    formNumber: varchar('form_number', { length: 30 }).notNull(),
    /** 스토리지 경로 */
    storageKey: varchar('storage_key', { length: 500 }).notNull(),
    /** 업로드 시 원본 파일명 */
    originalFilename: varchar('original_filename', { length: 300 }).notNull(),
    /** MIME 타입 */
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    /** 파일 크기 (bytes) */
    fileSize: integer('file_size').notNull(),
    /** 현행 여부 — formName당 하나만 true */
    isCurrent: boolean('is_current').notNull().default(true),
    /** 개정으로 대체된 시점. 현행이면 null */
    supersededAt: timestamp('superseded_at'),
    /** 업로드한 사용자 */
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'restrict' }),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // 양식명별 이력 조회
    index('form_templates_form_name_idx').on(table.formName),
    // formName당 하나의 현행
    uniqueIndex('form_templates_current_idx')
      .on(table.formName)
      .where(sql`${table.isCurrent} = true`),
    // 과거 번호 검색 일관성: formNumber는 전역 유니크 (역사적으로도 중복 불허)
    uniqueIndex('form_templates_form_number_unique').on(table.formNumber),
  ]
);

export const formTemplatesRelations = relations(formTemplates, ({ one }) => ({
  uploader: one(users, {
    fields: [formTemplates.uploadedBy],
    references: [users.id],
  }),
}));

export type FormTemplate = typeof formTemplates.$inferSelect;
export type NewFormTemplate = typeof formTemplates.$inferInsert;
