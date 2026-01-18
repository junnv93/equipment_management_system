import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  index,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { equipmentRequests } from './equipment-requests';

// 첨부 파일 타입 enum
export const attachmentTypeEnum = pgEnum('attachment_type', [
  'inspection_report', // 검수보고서 (신규 장비 등록 시)
  'history_card', // 이력카드 (기존 장비 등록 시)
  'other', // 기타
]);

// 장비 첨부 파일 테이블
export const equipmentAttachments = pgTable(
  'equipment_attachments',
  {
    id: serial('id').primaryKey(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),

    // 연결 정보
    equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }),
    requestId: integer('request_id').references(() => equipmentRequests.id, {
      onDelete: 'cascade',
    }), // 요청과 연결

    // 파일 정보
    attachmentType: attachmentTypeEnum('attachment_type').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
    filePath: text('file_path').notNull(), // 파일 저장 경로 또는 URL
    fileSize: bigint('file_size', { mode: 'number' }).notNull(), // 파일 크기 (bytes)
    mimeType: varchar('mime_type', { length: 100 }).notNull(), // MIME 타입 (예: application/pdf, image/jpeg)

    // 메타데이터
    description: text('description'), // 파일 설명

    // 시스템 필드
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      // 인덱스 추가
      uuidIdx: index('equipment_attachments_uuid_idx').on(table.uuid),
      equipmentIdIdx: index('equipment_attachments_equipment_id_idx').on(table.equipmentId),
      requestIdIdx: index('equipment_attachments_request_id_idx').on(table.requestId),
      attachmentTypeIdx: index('equipment_attachments_attachment_type_idx').on(
        table.attachmentType
      ),
      // 복합 인덱스: 장비별 첨부 파일 조회 최적화
      equipmentTypeIdx: index('equipment_attachments_equipment_type_idx').on(
        table.equipmentId,
        table.attachmentType
      ),
    };
  }
);

// 장비 첨부 파일 타입 정의
export type EquipmentAttachment = typeof equipmentAttachments.$inferSelect;
export type NewEquipmentAttachment = typeof equipmentAttachments.$inferInsert;

// Drizzle relations 설정
export const equipmentAttachmentsRelations = relations(equipmentAttachments, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentAttachments.equipmentId],
    references: [equipment.id],
  }),
  request: one(equipmentRequests, {
    fields: [equipmentAttachments.requestId],
    references: [equipmentRequests.id],
  }),
}));
