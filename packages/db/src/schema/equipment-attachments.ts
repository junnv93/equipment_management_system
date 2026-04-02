import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  index,
  bigint,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ATTACHMENT_TYPE_VALUES } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { equipmentRequests } from './equipment-requests';

// 첨부 파일 타입 enum — SSOT: @equipment-management/schemas
export const attachmentTypeEnum = pgEnum('attachment_type', ATTACHMENT_TYPE_VALUES);

// 장비 첨부 파일 테이블
// ✅ UUID 통일: serial(integer) id를 uuid id로 변경
export const equipmentAttachments = pgTable(
  'equipment_attachments',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 연결 정보
    equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'restrict' }),
    requestId: uuid('request_id').references(() => equipmentRequests.id, {
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
      // 인덱스 추가 (uuid를 PK로 사용하므로 별도 uuid 인덱스 불필요)
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
