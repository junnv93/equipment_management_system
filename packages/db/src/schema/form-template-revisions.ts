import { pgTable, varchar, timestamp, uuid, integer, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { formTemplates } from './form-templates';
import { users } from './users';

/**
 * 양식 템플릿 개정 이력 (UL-QP-03 §7.5)
 *
 * 개정 시점마다 changeSummary(개정 사유)를 누적합니다.
 * formTemplates 테이블의 row 단위로 1:1 매핑되며, 새 버전이 INSERT될 때 함께 INSERT됩니다.
 */
export const formTemplateRevisions = pgTable(
  'form_template_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    formTemplateId: uuid('form_template_id')
      .references(() => formTemplates.id, { onDelete: 'restrict' })
      .notNull(),
    /** 개정 직전 formNumber. 최초 등록이면 null */
    previousFormNumber: varchar('previous_form_number', { length: 30 }),
    /** 새로 발급된 formNumber */
    newFormNumber: varchar('new_form_number', { length: 30 }).notNull(),
    /** 개정 사유 / 변경 요약 (필수) */
    changeSummary: text('change_summary').notNull(),
    revisedBy: uuid('revised_by').references(() => users.id, { onDelete: 'restrict' }),
    revisedAt: timestamp('revised_at').defaultNow().notNull(),
    /** CAS 버전 필드 (낙관적 잠금) */
    version: integer('version').notNull().default(1),
  },
  (table) => [
    index('form_template_revisions_form_template_id_idx').on(table.formTemplateId),
    index('form_template_revisions_revised_by_idx').on(table.revisedBy),
  ]
);

export const formTemplateRevisionsRelations = relations(formTemplateRevisions, ({ one }) => ({
  formTemplate: one(formTemplates, {
    fields: [formTemplateRevisions.formTemplateId],
    references: [formTemplates.id],
  }),
  reviser: one(users, {
    fields: [formTemplateRevisions.revisedBy],
    references: [users.id],
  }),
}));

export type FormTemplateRevision = typeof formTemplateRevisions.$inferSelect;
export type NewFormTemplateRevision = typeof formTemplateRevisions.$inferInsert;
