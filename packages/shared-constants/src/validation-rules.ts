/**
 * 검증 규칙 공유 상수 — Backend DTO / Frontend Form SSOT
 *
 * 프론트엔드와 백엔드가 동일한 검증 규칙을 적용하기 위한 단일 소스입니다.
 * DTO의 `.min()`, `.max()` 값과 프론트엔드 폼 검증에서 동일한 상수를 사용합니다.
 *
 * @example
 * // Backend DTO
 * import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 * rejectionReason: z.string().min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
 *
 * // Frontend
 * import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 * if (reason.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) { ... }
 */
export const VALIDATION_RULES = {
  /** 반려/거부 사유 최소 글자 수 */
  REJECTION_REASON_MIN_LENGTH: 10,

  /** 장비 반입 기본 반납 예정일 (일) */
  DEFAULT_RETURN_DAYS: 7,

  /** 일반 텍스트 필드 최대 길이 (name, department 등 varchar(100)) */
  TEXT_FIELD_MAX_LENGTH: 100,

  /** 장기 텍스트 필드 최대 길이 (description, reason 등 varchar(500)) */
  LONG_TEXT_MAX_LENGTH: 500,

  /** 전화번호 최대 길이 */
  PHONE_MAX_LENGTH: 20,

  /** 관리번호 최대 길이 */
  MANAGEMENT_NUMBER_MAX_LENGTH: 50,
} as const;
