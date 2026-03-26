import { z } from 'zod';
import { uuidString, optionalUuid, nullableOptionalUuid } from './utils/fields';

// ============================================================
// 문서 타입 enum — SSOT
// ============================================================

export const DOCUMENT_TYPE_VALUES = [
  'calibration_certificate', // 교정성적서
  'raw_data', // 원시 데이터 (교정업체 엑셀 등)
  'inspection_report', // 검수보고서
  'history_card', // 이력카드
  'other', // 기타
] as const;

export const DocumentTypeEnum = z.enum(DOCUMENT_TYPE_VALUES);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  calibration_certificate: '교정성적서',
  raw_data: '원시 데이터',
  inspection_report: '검수보고서',
  history_card: '이력카드',
  other: '기타',
};

// ============================================================
// 문서 상태 enum — SSOT
// ============================================================

export const DOCUMENT_STATUS_VALUES = [
  'active', // 활성 (최신 버전)
  'superseded', // 대체됨 (이전 버전)
  'deleted', // 논리 삭제
] as const;

export const DocumentStatusEnum = z.enum(DOCUMENT_STATUS_VALUES);
export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;

// ============================================================
// 문서 스키마
// ============================================================

export const documentSchema = z.object({
  id: uuidString(),
  equipmentId: nullableOptionalUuid(),
  calibrationId: nullableOptionalUuid(),
  requestId: nullableOptionalUuid(),
  documentType: DocumentTypeEnum,
  status: DocumentStatusEnum,
  fileName: z.string().max(255),
  originalFileName: z.string().max(255),
  filePath: z.string(),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().max(100),
  fileHash: z.string().max(64).nullable().optional(),
  revisionNumber: z.number().int().positive(),
  parentDocumentId: nullableOptionalUuid(),
  isLatest: z.boolean(),
  description: z.string().nullable().optional(),
  uploadedBy: nullableOptionalUuid(),
  uploadedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Document = z.infer<typeof documentSchema>;

// ============================================================
// 문서 생성 입력 스키마
// ============================================================

export const createDocumentInputSchema = z.object({
  equipmentId: optionalUuid(),
  calibrationId: optionalUuid(),
  requestId: optionalUuid(),
  documentType: DocumentTypeEnum,
  description: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

// ============================================================
// JSON 전송용 스키마 (HTTP 응답에서 날짜는 ISO 문자열)
// ============================================================

export const documentJsonSchema = documentSchema.extend({
  uploadedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentJson = z.infer<typeof documentJsonSchema>;
