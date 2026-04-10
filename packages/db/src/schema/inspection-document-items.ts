import { pgTable, varchar, timestamp, uuid, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { documents } from './documents';

/**
 * 점검 항목 ↔ 문서 연결 테이블
 *
 * 중간점검(QP-18-03) / 자체점검(QP-18-05) 항목별 사진·그래프를
 * documents 테이블과 연결합니다.
 *
 * inspectionItemType으로 polymorphic 참조:
 * - 'intermediate' → intermediate_inspection_items.id
 * - 'self' → self_inspection_items.id
 */
export const inspectionDocumentItems = pgTable(
  'inspection_document_items',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    inspectionItemId: uuid('inspection_item_id').notNull(),
    inspectionItemType: varchar('inspection_item_type', { length: 20 }).notNull(), // 'intermediate' | 'self'
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    itemIdx: index('inspection_document_items_item_idx').on(
      table.inspectionItemId,
      table.inspectionItemType
    ),
    documentIdIdx: index('inspection_document_items_document_id_idx').on(table.documentId),
  })
);

export type InspectionDocumentItem = typeof inspectionDocumentItems.$inferSelect;
export type NewInspectionDocumentItem = typeof inspectionDocumentItems.$inferInsert;

// Relations
export const inspectionDocumentItemsRelations = relations(inspectionDocumentItems, ({ one }) => ({
  document: one(documents, {
    fields: [inspectionDocumentItems.documentId],
    references: [documents.id],
  }),
}));
