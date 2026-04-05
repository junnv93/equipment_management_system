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
  'equipment_photo', // 장비 사진
  'equipment_manual', // 장비 매뉴얼 (PDF)
  'other', // 기타
  'validation_vendor_attachment', // 유효성확인 방법 1 — 공급자 제공 자료
  'validation_test_data', // 유효성확인 방법 2 — 시험 데이터
] as const;

export const DocumentTypeEnum = z.enum(DOCUMENT_TYPE_VALUES);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

/** DocumentType 개별 상수 — 프론트/백엔드에서 문자열 하드코딩 대신 사용 */
export const DocumentTypeValues = {
  CALIBRATION_CERTIFICATE: 'calibration_certificate',
  RAW_DATA: 'raw_data',
  INSPECTION_REPORT: 'inspection_report',
  HISTORY_CARD: 'history_card',
  EQUIPMENT_PHOTO: 'equipment_photo',
  EQUIPMENT_MANUAL: 'equipment_manual',
  OTHER: 'other',
  VALIDATION_VENDOR_ATTACHMENT: 'validation_vendor_attachment',
  VALIDATION_TEST_DATA: 'validation_test_data',
} as const satisfies Record<string, DocumentType>;

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  calibration_certificate: '교정성적서',
  raw_data: '원시 데이터',
  inspection_report: '검수보고서',
  history_card: '이력카드',
  equipment_photo: '장비 사진',
  equipment_manual: '장비 매뉴얼',
  other: '기타',
  validation_vendor_attachment: '유효성확인 공급자 자료',
  validation_test_data: '유효성확인 시험 데이터',
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
  softwareValidationId: nullableOptionalUuid(),
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
  softwareValidationId: optionalUuid(),
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
