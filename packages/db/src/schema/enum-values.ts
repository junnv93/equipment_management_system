/**
 * ⚠️ SINGLE SOURCE OF TRUTH: DB 스키마용 Enum VALUES 배열
 *
 * 이 파일이 모든 enum 배열의 원본입니다.
 * - DB 스키마 파일(users.ts, checkouts.ts 등)은 이 파일에서 import
 * - packages/schemas/src/enums.ts는 @equipment-management/db에서 이 값을 import하여 Zod enum 생성
 * - 새로운 enum 추가 시 이 파일에 추가하고, schemas/enums.ts에서 Zod enum 래핑
 *
 * ⚡ 의존성 없음 (zod, drizzle 등 미사용) — 순환 의존 방지
 */

// ─── 사용자 (Users) ─────────────────────────────────────────────────────────

export const USER_ROLE_VALUES = [
  'test_engineer', // 시험실무자
  'technical_manager', // 기술책임자
  'quality_manager', // 품질책임자
  'lab_manager', // 시험소장
  'system_admin', // 시스템 관리자
] as const;

export const LOCATION_VALUES = ['수원랩', '의왕랩', '평택랩'] as const;

// ─── 장비 (Equipment) ───────────────────────────────────────────────────────

export const EQUIPMENT_STATUS_VALUES = [
  'available', // 사용 가능
  'in_use', // 사용 중
  'checked_out', // 반출 중
  'calibration_scheduled', // 교정 예정
  'calibration_overdue', // 교정 기한 초과
  'non_conforming', // 부적합
  'spare', // 여분
  'retired', // 사용 중지 (deprecated)
  'pending_disposal', // 폐기 대기
  'disposed', // 폐기 완료
  'temporary', // 임시 등록
  'inactive', // 비활성
] as const;

export const CALIBRATION_METHOD_VALUES = [
  'external_calibration', // 외부 교정
  'self_inspection', // 자체 점검
  'not_applicable', // 비대상
] as const;

// ─── 교정 (Calibrations) ────────────────────────────────────────────────────

export const CALIBRATION_STATUS_VALUES = [
  'scheduled', // 예정됨
  'in_progress', // 진행 중
  'completed', // 완료됨
  'failed', // 실패
] as const;

export const CALIBRATION_APPROVAL_STATUS_VALUES = [
  'pending_approval', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CALIBRATION_REGISTERED_BY_ROLE_VALUES = [
  'test_engineer', // 시험실무자
  'technical_manager', // 기술책임자
] as const;

// ─── 반출 (Checkouts) ───────────────────────────────────────────────────────

export const CHECKOUT_STATUS_VALUES = [
  'pending', // 반출 신청
  'approved', // 승인됨
  'rejected', // 거절됨
  'checked_out', // 반출 중
  'lender_checked', // ① 반출 전 확인 완료
  'borrower_received', // ② 인수 확인 완료
  'in_use', // 사용 중
  'borrower_returned', // ③ 반납 전 확인 완료
  'lender_received', // ④ 반입 확인 완료
  'returned', // 반입 완료
  'return_approved', // 반입 최종 승인됨
  'overdue', // 반입 기한 초과
  'canceled', // 취소됨
] as const;

export const CHECKOUT_PURPOSE_VALUES = [
  'calibration', // 교정
  'repair', // 수리
  'rental', // 대여
  'return_to_vendor', // 렌탈 반납
] as const;

export const CHECKOUT_TYPE_VALUES = [
  'calibration', // 교정 목적 반출
  'repair', // 수리 목적 반출
  'rental', // 대여 목적 반출
] as const;

// ─── 상태 확인 (Condition Checks) ───────────────────────────────────────────

export const CONDITION_CHECK_STEP_VALUES = [
  'lender_checkout', // ① 반출 전
  'borrower_receive', // ② 인수 시
  'borrower_return', // ③ 반납 전
  'lender_return', // ④ 반입 시
] as const;

export const CONDITION_STATUS_VALUES = ['normal', 'abnormal'] as const;

export const ACCESSORIES_STATUS_VALUES = ['complete', 'incomplete'] as const;

// ─── 부적합 (Non-Conformances) ──────────────────────────────────────────────

export const NON_CONFORMANCE_STATUS_VALUES = [
  'open', // 부적합 등록
  'analyzing', // 원인 분석 중
  'corrected', // 조치 완료
  'closed', // 종료됨
] as const;

export const NON_CONFORMANCE_TYPE_VALUES = [
  'damage', // 손상
  'malfunction', // 오작동
  'calibration_failure', // 교정 실패
  'calibration_overdue', // 교정 기한 초과
  'measurement_error', // 측정 오류
  'other', // 기타
] as const;

export const RESOLUTION_TYPE_VALUES = [
  'repair', // 수리
  'recalibration', // 재교정
  'replacement', // 교체
  'disposal', // 폐기
  'other', // 기타
] as const;
