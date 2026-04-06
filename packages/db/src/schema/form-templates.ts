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
 * 스토리지 기반 양식 관리: docx/xlsx 템플릿을 DB + 스토리지로 관리하여
 * 파일시스템 의존성 제거, 컨테이너 친화적 운영 지원
 */
export const formTemplates = pgTable(
  'form_templates',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    /** 양식 번호 (예: 'UL-QP-18-03') — FORM_CATALOG 키와 매칭 */
    formNumber: varchar('form_number', { length: 20 }).notNull(),
    /** 템플릿 버전 (formNumber별 순차 증가) */
    version: integer('version').notNull().default(1),
    /** 스토리지 경로 (예: 'form-templates/UL-QP-18-03/v1.docx') */
    storageKey: varchar('storage_key', { length: 500 }).notNull(),
    /** 업로드 시 원본 파일명 */
    originalFilename: varchar('original_filename', { length: 300 }).notNull(),
    /** MIME 타입 */
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    /** 파일 크기 (bytes) */
    fileSize: integer('file_size').notNull(),
    /** 활성 여부 — formNumber당 하나만 active */
    isActive: boolean('is_active').notNull().default(true),
    /** 업로드한 사용자 */
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'restrict' }),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('form_templates_form_number_idx').on(table.formNumber),
    uniqueIndex('form_templates_active_idx')
      .on(table.formNumber)
      .where(sql`${table.isActive} = true`),
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
