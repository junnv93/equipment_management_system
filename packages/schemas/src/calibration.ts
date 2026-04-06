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
  cost: z.number().optional(),
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
