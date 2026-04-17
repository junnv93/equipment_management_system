import {
  pgTable,
  varchar,
  timestamp,
  text,
  bigint,
  uuid,
  integer,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { DocumentType, DocumentStatus } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { calibrations } from './calibrations';
import { equipmentRequests } from './equipment-requests';
import { softwareValidations } from './software-validations';
import { intermediateInspections } from './intermediate-inspections';
import { equipmentSelfInspections } from './equipment-self-inspections';
import { nonConformances } from './non-conformances';
import { users } from './users';

/**
 * 통합 문서 관리 테이블
 *
 * 교정성적서, 원시 데이터, 검수보고서, 이력카드 등 모든 문서를 통합 관리합니다.
 * - document_type: varchar 패턴 (값 확장 가능 — DB enum 정책 참조)
 * - status: 버전 관리 지원 (active → superseded)
 * - file_hash: SHA-256 무결성 검증
 * - parent_document_id: 개정 이력 추적 (self-referencing FK)
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 소유자 연결 (다형성 FK — 하나 이상 NOT NULL)
    equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'restrict' }),
    calibrationId: uuid('calibration_id').references(() => calibrations.id, {
      onDelete: 'cascade',
    }),
    requestId: uuid('request_id').references(() => equipmentRequests.id, { onDelete: 'cascade' }),
    softwareValidationId: uuid('software_validation_id').references(() => softwareValidations.id, {
      onDelete: 'cascade',
    }),
    intermediateInspectionId: uuid('intermediate_inspection_id').references(
      () => intermediateInspections.id,
      { onDelete: 'cascade' }
    ),
    selfInspectionId: uuid('self_inspection_id').references(() => equipmentSelfInspections.id, {
      onDelete: 'cascade',
    }),
    // 부적합(NC) 첨부 — QR 현장 사진, 원인 분석 보고서 등. NC 삭제 시 cascade(첨부도 함께 소프트 삭제는 서비스 레이어 책임).
    nonConformanceId: uuid('non_conformance_id').references(() => nonConformances.id, {
      onDelete: 'cascade',
    }),

    // 문서 분류
    documentType: varchar('document_type', { length: 50 }).$type<DocumentType>().notNull(),
    status: varchar('status', { length: 20 }).$type<DocumentStatus>().notNull().default('active'),

    // 파일 메타데이터
    fileName: varchar('file_name', { length: 255 }).notNull(),
    originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
    filePath: text('file_path').notNull(),
    fileSize: bigint('file_size', { mode: 'number' }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),

    // 무결성
    fileHash: varchar('file_hash', { length: 64 }),

    // 버전 관리
    revisionNumber: integer('revision_number').notNull().default(1),
    parentDocumentId: uuid('parent_document_id').references((): AnyPgColumn => documents.id, {
      onDelete: 'set null',
    }),
    isLatest: boolean('is_latest').notNull().default(true),

    // 메타데이터
    description: text('description'),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),

    // 보존연한 (UL-QP-18 섹션 15)
    retentionPeriod: varchar('retention_period', { length: 20 }),
    retentionExpiresAt: timestamp('retention_expires_at'),

    // 시스템 필드
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    equipmentIdIdx: index('documents_equipment_id_idx').on(table.equipmentId),
    calibrationIdIdx: index('documents_calibration_id_idx').on(table.calibrationId),
    requestIdIdx: index('documents_request_id_idx').on(table.requestId),
    documentTypeIdx: index('documents_document_type_idx').on(table.documentType),
    parentDocumentIdIdx: index('documents_parent_document_id_idx').on(table.parentDocumentId),
    calibrationTypeIdx: index('documents_calibration_type_idx').on(
      table.calibrationId,
      table.documentType
    ),
    equipmentTypeIdx: index('documents_equipment_type_idx').on(
      table.equipmentId,
      table.documentType
    ),
    softwareValidationIdIdx: index('documents_software_validation_id_idx').on(
      table.softwareValidationId
    ),
    softwareValidationTypeIdx: index('documents_software_validation_type_idx').on(
      table.softwareValidationId,
      table.documentType
    ),
    intermediateInspectionIdIdx: index('documents_intermediate_inspection_id_idx').on(
      table.intermediateInspectionId
    ),
    selfInspectionIdIdx: index('documents_self_inspection_id_idx').on(table.selfInspectionId),
    nonConformanceIdIdx: index('documents_non_conformance_id_idx').on(table.nonConformanceId),
    /** NC 첨부 조회 — 상세 페이지 Documents 탭이 typ별 필터링 자주 사용 */
    nonConformanceTypeIdx: index('documents_non_conformance_type_idx').on(
      table.nonConformanceId,
      table.documentType
    ),
    statusIdx: index('documents_status_idx').on(table.status),
    /** purgeDeletedDocuments 쿼리 최적화: WHERE status='deleted' AND updatedAt < cutoff */
    statusUpdatedAtIdx: index('documents_status_updated_at_idx').on(table.status, table.updatedAt),
    retentionExpiresAtIdx: index('documents_retention_expires_at_idx').on(table.retentionExpiresAt),
    uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
  })
);

// 타입 정의
export type DocumentRecord = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// Drizzle relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [documents.equipmentId],
    references: [equipment.id],
  }),
  calibration: one(calibrations, {
    fields: [documents.calibrationId],
    references: [calibrations.id],
  }),
  request: one(equipmentRequests, {
    fields: [documents.requestId],
    references: [equipmentRequests.id],
  }),
  softwareValidation: one(softwareValidations, {
    fields: [documents.softwareValidationId],
    references: [softwareValidations.id],
  }),
  intermediateInspection: one(intermediateInspections, {
    fields: [documents.intermediateInspectionId],
    references: [intermediateInspections.id],
  }),
  selfInspection: one(equipmentSelfInspections, {
    fields: [documents.selfInspectionId],
    references: [equipmentSelfInspections.id],
  }),
  nonConformance: one(nonConformances, {
    fields: [documents.nonConformanceId],
    references: [nonConformances.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  parentDocument: one(documents, {
    fields: [documents.parentDocumentId],
    references: [documents.id],
    relationName: 'document_revisions',
  }),
  childDocuments: many(documents, {
    relationName: 'document_revisions',
  }),
}));
