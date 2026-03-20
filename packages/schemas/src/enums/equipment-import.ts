import { z } from 'zod';

// ============================================================================
// 장비 반입 관련 ENUM (렌탈 + 내부 공용 통합)
// ============================================================================

/**
 * SINGLE SOURCE OF TRUTH: 장비 반입 출처 타입 열거형
 *
 * 장비 반입 시스템은 두 가지 출처를 지원합니다:
 * - rental: 외부 렌탈 업체 (vendor 정보 필수)
 * - internal_shared: 내부 공용장비 (ownerDepartment 정보 필수)
 *
 * 이 필드는 discriminator로 사용되어 조건부 validation을 제어합니다.
 */
export const EQUIPMENT_IMPORT_SOURCE_VALUES = [
  'rental', // 외부 렌탈 업체
  'internal_shared', // 내부 공용장비
] as const;

export const EquipmentImportSourceEnum = z.enum(EQUIPMENT_IMPORT_SOURCE_VALUES);
export type EquipmentImportSource = z.infer<typeof EquipmentImportSourceEnum>;

/**
 * 장비 반입 출처 값 객체 (dot-notation 접근용)
 * @example EquipmentImportSourceValues.RENTAL // 'rental'
 */
export const EquipmentImportSourceValues = {
  RENTAL: 'rental',
  INTERNAL_SHARED: 'internal_shared',
} as const;

/**
 * SINGLE SOURCE OF TRUTH: 장비 반입 상태 열거형
 *
 * 통합 반입 워크플로우 상태 (렌탈 + 내부 공용):
 * - pending: 반입 신청 (승인 대기)
 * - approved: 승인됨 (장비 도착 대기)
 * - rejected: 거절됨
 * - received: 수령 완료 (장비 자동 등록됨)
 * - return_requested: 반납 진행 중 (checkout 생성됨)
 * - returned: 반납 완료 (장비 비활성화)
 * - canceled: 취소됨
 */
export const EQUIPMENT_IMPORT_STATUS_VALUES = [
  'pending', // 반입 신청 (승인 대기)
  'approved', // 승인됨 (장비 도착 대기)
  'rejected', // 거절됨
  'received', // 수령 완료 (장비 자동 등록됨)
  'return_requested', // 반납 진행 중 (checkout 생성됨)
  'returned', // 반납 완료 (장비 비활성화)
  'canceled', // 취소됨
] as const;

export const EquipmentImportStatusEnum = z.enum(EQUIPMENT_IMPORT_STATUS_VALUES);
export type EquipmentImportStatus = z.infer<typeof EquipmentImportStatusEnum>;

/**
 * 장비 반입 상태 값 객체 (dot-notation 접근용)
 * @example EquipmentImportStatusValues.PENDING // 'pending'
 */
export const EquipmentImportStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RECEIVED: 'received',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  CANCELED: 'canceled',
} as const;
