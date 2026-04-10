import {
  pgTable,
  varchar,
  text,
  uuid,
  index,
  integer,
  decimal,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { InspectionResultSectionType, InspectionType } from '@equipment-management/schemas';
import { documents } from './documents';
import { users } from './users';

/**
 * 점검 결과 섹션 (중간점검 QP-18-03 / 자체점검 QP-18-05)
 *
 * 장비 유형별로 완전히 가변적인 "측정 결과" 영역을 관리합니다.
 * - RF 장비: 측정 데이터 테이블 + OBW 그래프
 * - DC 장비: DC 전압 테이블
 * - 패시브: 외관 사진 + 텍스트
 * - OTA: VSWR 그래프 사진 다수
 *
 * inspectionId는 코드레벨 FK — 양쪽 테이블(intermediate_inspections / equipment_self_inspections) 참조
 */
export const inspectionResultSections = pgTable(
  'inspection_result_sections',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 점검 참조 (코드레벨 FK — intermediate_inspections 또는 equipment_self_inspections)
    inspectionId: uuid('inspection_id').notNull(),
    inspectionType: varchar('inspection_type', { length: 20 }).$type<InspectionType>().notNull(),

    // 정렬 순서
    sortOrder: integer('sort_order').notNull(),

    // 섹션 유형
    sectionType: varchar('section_type', { length: 20 })
      .$type<InspectionResultSectionType>()
      .notNull(),

    // 콘텐츠
    title: varchar('title', { length: 200 }),
    content: text('content'),
    tableData: jsonb('table_data').$type<{ headers: string[]; rows: string[][] }>(),

    // 이미지 참조 (documents 테이블)
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),

    // 이미지 크기 (cm 단위, Export 시 사용)
    imageWidthCm: decimal('image_width_cm', { precision: 4, scale: 1 }),
    imageHeightCm: decimal('image_height_cm', { precision: 4, scale: 1 }),

    // 감사 필드
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    inspectionSortIdx: index('irs_inspection_sort_idx').on(
      table.inspectionId,
      table.inspectionType,
      table.sortOrder
    ),
  })
);

export type InspectionResultSection = typeof inspectionResultSections.$inferSelect;
export type NewInspectionResultSection = typeof inspectionResultSections.$inferInsert;
