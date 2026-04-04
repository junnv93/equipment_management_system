import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 알림 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 * 이벤트명 기반 ('.' → '_' + camelCase → snake_case)
 *
 * 변환 SSOT: notification-events.ts의 EVENT_TO_NOTIFICATION_TYPE에서
 * 이 배열과 교차 검증하여 불일치 시 서버 시작 에러 발생.
 */
export const NOTIFICATION_TYPE_VALUES = [
  // ─── 반출 (Checkout) ───
  'checkout_created', // 반출 요청
  'checkout_approved', // 반출 승인됨
  'checkout_rejected', // 반출 반려됨
  'checkout_started', // 반출 시작
  'checkout_returned', // 반입 요청
  'checkout_return_approved', // 반입 승인됨
  'checkout_return_rejected', // 반입 반려됨
  'checkout_overdue', // 반출 기한 초과

  // ─── 교정 (Calibration) ───
  'calibration_created', // 교정 등록 (승인 요청)
  'calibration_approved', // 교정 승인됨
  'calibration_rejected', // 교정 반려됨
  'calibration_due_soon', // 교정 예정 (D-day 알림)
  'calibration_overdue', // 교정 기한 초과

  // ─── 교정계획 (Calibration Plan) ───
  'calibration_plan_submitted', // 교정계획서 제출
  'calibration_plan_reviewed', // 교정계획서 검토 완료
  'calibration_plan_approved', // 교정계획서 최종 승인
  'calibration_plan_rejected', // 교정계획서 반려

  // ─── 부적합 (Non-Conformance) ───
  'non_conformance_created', // 부적합 등록
  'non_conformance_corrected', // 부적합 조치 완료
  'non_conformance_closed', // 부적합 종료
  'non_conformance_correction_rejected', // 조치 반려

  // ─── 장비 요청 (Equipment Request) ───
  'equipment_request_created', // 장비 요청 등록
  'equipment_request_approved', // 장비 요청 승인됨
  'equipment_request_rejected', // 장비 요청 반려됨

  // ─── 폐기 (Disposal) ───
  'disposal_requested', // 폐기 요청
  'disposal_reviewed', // 폐기 검토 완료
  'disposal_approved', // 폐기 최종 승인
  'disposal_rejected', // 폐기 반려

  // ─── 장비 반입 (Equipment Import) ───
  'equipment_import_created', // 반입 요청
  'equipment_import_approved', // 반입 승인됨
  'equipment_import_rejected', // 반입 반려됨

  // ─── 소프트웨어 유효성 확인 (Software Validation) ───
  'software_validation_submitted', // 유효성 확인 제출
  'software_validation_approved', // 유효성 확인 승인
  'software_validation_rejected', // 유효성 확인 반려

  // ─── 중간점검 (Intermediate Check) ───
  'intermediate_check_completed', // 중간점검 완료

  // ─── 보정계수 (Calibration Factor) ───
  'calibration_factor_approved', // 보정계수 승인
  'calibration_factor_rejected', // 보정계수 반려

  // ─── 시스템 ───
  'system_announcement', // 시스템 공지

  // ─── 레거시 호환 (기존 코드에서 참조) ───
  'calibration_due', // → calibration_due_soon 으로 대체 예정
  'calibration_completed', // → calibration_approved 으로 대체 예정
  'calibration_approval_pending', // → calibration_created 으로 대체 예정
  'intermediate_check_due', // 중간점검 예정
  'rental_request', // → checkout_created 으로 대체 예정
  'rental_approved', // → checkout_approved 으로 대체 예정
  'rental_rejected', // → checkout_rejected 으로 대체 예정
  'rental_completed', // 레거시
  'return_requested', // → checkout_returned 으로 대체 예정
  'return_approved', // → checkout_return_approved 으로 대체 예정
  'return_rejected', // 레거시
  'equipment_maintenance', // 레거시
  'system', // → system_announcement 으로 대체 예정
  'checkout', // → checkout_created 으로 대체 예정
  'maintenance', // 레거시
] as const;

export const NotificationTypeEnum = z.enum(NOTIFICATION_TYPE_VALUES);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 알림 우선순위 열거형
 *
 * 표준 우선순위값 (소문자):
 * - low: 낮음
 * - medium: 보통
 * - high: 높음
 */
export const NOTIFICATION_PRIORITY_VALUES = ['low', 'medium', 'high'] as const;

export const NotificationPriorityEnum = z.enum(NOTIFICATION_PRIORITY_VALUES);
export type NotificationPriority = z.infer<typeof NotificationPriorityEnum>;

// ============================================================================
// Notification Frequency
// ============================================================================

export const NotificationFrequencyEnum = z.enum(['immediate', 'daily', 'weekly']);
export type NotificationFrequency = z.infer<typeof NotificationFrequencyEnum>;
export const NOTIFICATION_FREQUENCY_VALUES = NotificationFrequencyEnum.options;
