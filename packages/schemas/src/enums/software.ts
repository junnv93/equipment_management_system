import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 시험용 소프트웨어 관련 열거형
 *
 * UL-QP-18-07 (시험용 소프트웨어 관리대장) 기반
 * UL-QP-18-09 (시험 소프트웨어 유효성 확인) 기반
 */

// ============================================================================
// 시험분야 (UL-QP-18-07 관리대장 컬럼)
// ============================================================================

export const TEST_FIELD_VALUES = [
  'RF', // RF 시험
  'SAR', // SAR 시험
  'EMC', // EMC 시험
  'RED', // RED 시험
  'HAC', // HAC 시험
] as const;

export const TestFieldEnum = z.enum(TEST_FIELD_VALUES);
export type TestField = z.infer<typeof TestFieldEnum>;

// ============================================================================
// 소프트웨어 가용 여부
// ============================================================================

export const SOFTWARE_AVAILABILITY_VALUES = [
  'available', // 가용
  'unavailable', // 불가
] as const;

export const SoftwareAvailabilityEnum = z.enum(SOFTWARE_AVAILABILITY_VALUES);
export type SoftwareAvailability = z.infer<typeof SoftwareAvailabilityEnum>;

// ============================================================================
// 유효성 확인 방법 (UL-QP-18-09)
// ============================================================================

export const VALIDATION_TYPE_VALUES = [
  'vendor', // 방법 1: 공급자 시연
  'self', // 방법 2: UL 자체 시험
] as const;

export const ValidationTypeEnum = z.enum(VALIDATION_TYPE_VALUES);
export type ValidationType = z.infer<typeof ValidationTypeEnum>;

// ============================================================================
// 유효성 확인 상태
// ============================================================================

export const VALIDATION_STATUS_VALUES = [
  'draft', // 초안
  'submitted', // 제출됨
  'approved', // 기술책임자 승인
  'quality_approved', // 품질책임자 승인 (최종)
  'rejected', // 반려됨
] as const;

export const ValidationStatusEnum = z.enum(VALIDATION_STATUS_VALUES);
export type ValidationStatus = z.infer<typeof ValidationStatusEnum>;
