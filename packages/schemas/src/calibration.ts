import { z } from 'zod';
import { ManagementMethodEnum } from './enums';
import { BaseEntity, SoftDeleteEntity, PaginatedResponse } from './common/base';
import { uuidString } from './utils/fields';

// 교정 상태 열거형
export const CalibrationStatusEnum = z.enum([
  'scheduled', // 예정됨
  'in_progress', // 진행 중
  'completed', // 완료됨
  'failed', // 실패
  'cancelled', // 취소됨
]);

export type CalibrationStatus = z.infer<typeof CalibrationStatusEnum>;
export const CALIBRATION_STATUS_VALUES = CalibrationStatusEnum.options;

/** 교정 상태 한국어 레이블 — 리포트/UI 공유 SSOT */
export const CALIBRATION_STATUS_LABELS: Record<CalibrationStatus, string> = {
  scheduled: '예정됨',
  in_progress: '진행 중',
  completed: '완료됨',
  failed: '실패',
  cancelled: '취소됨',
};

// 기본 교정 스키마 (공통 필드)
export const baseCalibrationSchema = z.object({
  equipmentId: uuidString(),
  calibrationManagerId: uuidString(),
  calibrationDate: z.date(),
  nextCalibrationDate: z.date(),
  managementMethod: ManagementMethodEnum,
  status: CalibrationStatusEnum,
  calibrationAgency: z.string(),
  certificateNumber: z.string().optional(),
  certificateFile: z.string().optional(),
  notes: z.string().optional(),
  results: z.string().optional(),
});

// 교정 생성 스키마
export const createCalibrationSchema = baseCalibrationSchema;

// 교정 업데이트 스키마
export const updateCalibrationSchema = baseCalibrationSchema.partial();

// 교정 조회용 스키마
export const calibrationSchema = baseCalibrationSchema.extend({
  id: uuidString(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

// 타입 정의
export type BaseCalibration = z.infer<typeof baseCalibrationSchema>;
export type CreateCalibrationInput = z.infer<typeof createCalibrationSchema>;
export type UpdateCalibrationInput = z.infer<typeof updateCalibrationSchema>;
export type Calibration = z.infer<typeof calibrationSchema> & SoftDeleteEntity;

// 교정 목록 조회를 위한 응답 스키마
export const calibrationListResponseSchema = PaginatedResponse(calibrationSchema);
export type CalibrationListResponse = z.infer<typeof calibrationListResponseSchema>;

// 타입 가드
export const isCalibration = (value: unknown): value is Calibration => {
  try {
    return calibrationSchema.parse(value) !== null;
  } catch {
    return false;
  }
};

// =============================================================================
// 교정성적서 PDF 추출 (Phase A — HCT 양식만 지원)
// =============================================================================

/**
 * 지원 교정기관 — Phase A는 HCT 단일 양식.
 * 추후 KTL 등 추가 시 enum 확장.
 */
export const CalibrationAgencyEnum = z.enum(['HCT']);
export type CalibrationAgency = z.infer<typeof CalibrationAgencyEnum>;

/**
 * 교정성적서 PDF 추출 결과 (표지 메타만).
 * - managementNumber → equipment.management_number 자동 매칭 키
 * - certificateNumber → calibrations.certificateNumber. 수정본은 `-R{n}` suffix.
 * - revisionNumber → 1 = 원본, 2+ = 수정본 (documents.revisionNumber 컨벤션과 일치)
 * - parentCertificateNumber → revision일 때 원본 번호 ('이 성적서는 제 X호의 수정' 문구 추출)
 * - nextCalibrationDate → 일부 양식(안테나 등 KOLAS-G-008 비대상)에서 누락 가능 → nullable
 */
export const extractedCalibrationCertificateSchema = z.object({
  managementNumber: z.string().min(1),
  certificateNumber: z.string().min(1),
  revisionNumber: z.number().int().min(1),
  parentCertificateNumber: z.string().nullable(),
  calibrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nextCalibrationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  agencyName: CalibrationAgencyEnum,
});

export type ExtractedCalibrationCertificate = z.infer<typeof extractedCalibrationCertificateSchema>;
