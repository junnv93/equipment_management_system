import { z } from 'zod';

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 장비 상태 열거형
 *
 * 이 파일이 모든 상태값의 기준입니다.
 * - 데이터베이스 스키마는 이 값과 반드시 일치해야 함
 * - 백엔드/프론트엔드는 이 파일에서 import하여 사용
 * - 새로운 상태값 추가 시 이 파일만 수정하고 마이그레이션 필요
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - available: 사용 가능
 * - in_use: 사용 중 (대여 중 포함)
 * - checked_out: 반출 중 (교정/수리/대여는 checkout_type으로 구분)
 * - calibration_scheduled: 교정 예정
 * - calibration_overdue: 교정 기한 초과
 * - non_conforming: 부적합 (임시적, 수리 후 복귀 가능)
 * - spare: 여분 (보유하고 있지만 상시 관리하지 않음)
 * - retired: 사용 중지 (영구 폐기)
 *
 * @see docs/development/API_STANDARDS.md
 */
export const EquipmentStatusEnum = z.enum([
  'available', // 사용 가능
  'in_use', // 사용 중 (대여 중 포함)
  'checked_out', // 반출 중
  'calibration_scheduled', // 교정 예정
  'calibration_overdue', // 교정 기한 초과
  'non_conforming', // 부적합 (임시, 수리 후 복귀 가능)
  'spare', // 여분
  'retired', // 사용 중지 (영구 폐기)
]);

export type EquipmentStatus = z.infer<typeof EquipmentStatusEnum>;

// 교정 방법 열거형
export const CalibrationMethodEnum = z.enum([
  'external_calibration', // 외부 교정
  'self_inspection', // 자체 점검
  'not_applicable', // 비대상
]);

export type CalibrationMethod = z.infer<typeof CalibrationMethodEnum>;

// 사용자 역할 열거형 (UL-QP-18 절차서 영문 명칭 기준)
export const UserRoleEnum = z.enum([
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
  'lab_manager', // 시험소장 (Lab Manager)
]);

export type UserRole = z.infer<typeof UserRoleEnum>;

// 사이트 타입 열거형
export const SiteEnum = z.enum(['suwon', 'uiwang']);
export type Site = z.infer<typeof SiteEnum>;

// 위치 타입 열거형
export const LocationEnum = z.enum(['수원랩', '의왕랩']);
export type Location = z.infer<typeof LocationEnum>;

// 팀 ID 열거형
export const TeamEnum = z.enum([
  'rf', // RF팀
  'sar', // SAR팀
  'emc', // EMC팀
  'auto', // Automotive팀
]);

export type TeamId = z.infer<typeof TeamEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 대여 상태 열거형
 *
 * 이 파일이 모든 대여 상태값의 기준입니다.
 * - 데이터베이스 스키마는 이 값과 반드시 일치해야 함
 * - 백엔드/프론트엔드는 이 파일에서 import하여 사용
 * - 새로운 상태값 추가 시 이 파일만 수정하고 마이그레이션 필요
 *
 * 표준 상태값 (소문자, snake_case 아님 - 단일 단어):
 * - pending: 대여 신청 (승인 대기)
 * - approved: 승인됨 (아직 대여 시작 전)
 * - active: 대여 중 (실제 사용 중)
 * - returned: 반납 완료
 * - overdue: 반납 기한 초과
 * - rejected: 거절됨
 * - canceled: 취소됨
 *
 * @see docs/development/API_STANDARDS.md
 */
// 대여 상태값 배열 (Zod enum과 동기화)
export const LOAN_STATUS_VALUES = [
  'pending', // 대여 신청 (승인 대기)
  'approved', // 승인됨 (아직 대여 시작 전)
  'active', // 대여 중 (실제 사용 중)
  'returned', // 반납 완료
  'overdue', // 반납 기한 초과
  'rejected', // 거절됨
  'canceled', // 취소됨
] as const;

export const LoanStatusEnum = z.enum(LOAN_STATUS_VALUES as unknown as [string, ...string[]]);
export type LoanStatus = z.infer<typeof LoanStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending: 반출 신청 (승인 대기)
 * - approved: 승인됨 (반출 가능)
 * - rejected: 거절됨
 * - checked_out: 반출 중
 * - returned: 반입 완료
 * - return_approved: 반입 최종 승인됨 (기술책임자 승인)
 * - overdue: 반입 기한 초과
 * - canceled: 취소됨
 */
// 반출 상태값 배열 (Zod enum과 동기화)
export const CHECKOUT_STATUS_VALUES = [
  'pending', // 반출 신청 (승인 대기)
  'approved', // 승인됨 (반출 가능)
  'rejected', // 거절됨
  'checked_out', // 반출 중
  'returned', // 반입 완료 (검사 완료)
  'return_approved', // 반입 최종 승인됨 (기술책임자 승인)
  'overdue', // 반입 기한 초과
  'canceled', // 취소됨
] as const;

export const CheckoutStatusEnum = z.enum(
  CHECKOUT_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CheckoutStatus = z.infer<typeof CheckoutStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 목적 열거형
 */
// 반출 목적값 배열 (Zod enum과 동기화)
export const CHECKOUT_PURPOSE_VALUES = [
  'calibration', // 교정
  'repair', // 수리
  'rental', // 대여
] as const;

export const CheckoutPurposeEnum = z.enum(
  CHECKOUT_PURPOSE_VALUES as unknown as [string, ...string[]]
);
export type CheckoutPurpose = z.infer<typeof CheckoutPurposeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 승인 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - pending_approval: 승인 대기 (시험실무자가 등록)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const CALIBRATION_APPROVAL_STATUS_VALUES = [
  'pending_approval', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationApprovalStatusEnum = z.enum(
  CALIBRATION_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CalibrationApprovalStatus = z.infer<typeof CalibrationApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 등록자 역할 열거형
 */
export const CALIBRATION_REGISTERED_BY_ROLE_VALUES = [
  'test_engineer', // 시험실무자 (Test Engineer)
  'technical_manager', // 기술책임자 (Technical Manager)
] as const;

export const CalibrationRegisteredByRoleEnum = z.enum(
  CALIBRATION_REGISTERED_BY_ROLE_VALUES as unknown as [string, ...string[]]
);
export type CalibrationRegisteredByRole = z.infer<typeof CalibrationRegisteredByRoleEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 반출 유형 열거형
 *
 * 모든 반출 유형은 1단계 승인으로 통합됨 (기술책임자 승인):
 * - calibration: 교정 목적 반출 (외부 교정기관)
 * - repair: 수리 목적 반출 (외부 수리업체)
 * - rental: 대여 목적 반출 (시험소 간 대여)
 */
export const CHECKOUT_TYPE_VALUES = [
  'calibration', // 교정 목적 반출
  'repair', // 수리 목적 반출
  'rental', // 대여 목적 반출
] as const;

export const CheckoutTypeEnum = z.enum(CHECKOUT_TYPE_VALUES as unknown as [string, ...string[]]);
export type CheckoutType = z.infer<typeof CheckoutTypeEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 보정계수 타입 열거형
 *
 * 표준 타입값 (소문자 + 언더스코어):
 * - antenna_gain: 안테나 이득
 * - cable_loss: 케이블 손실
 * - path_loss: 경로 손실
 * - amplifier_gain: 증폭기 이득
 * - other: 기타
 */
export const CALIBRATION_FACTOR_TYPE_VALUES = [
  'antenna_gain', // 안테나 이득
  'cable_loss', // 케이블 손실
  'path_loss', // 경로 손실
  'amplifier_gain', // 증폭기 이득
  'other', // 기타
] as const;

export const CalibrationFactorTypeEnum = z.enum(
  CALIBRATION_FACTOR_TYPE_VALUES as unknown as [string, ...string[]]
);
export type CalibrationFactorType = z.infer<typeof CalibrationFactorTypeEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 보정계수 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기 (시험실무자가 변경 요청)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationFactorApprovalStatusEnum = z.enum(
  CALIBRATION_FACTOR_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CalibrationFactorApprovalStatus = z.infer<typeof CalibrationFactorApprovalStatusEnum>;

/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 부적합 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - open: 부적합 등록 (발견됨)
 * - analyzing: 원인 분석 중
 * - corrected: 조치 완료 (종료 승인 대기)
 * - closed: 종료됨 (기술책임자 승인)
 */
export const NON_CONFORMANCE_STATUS_VALUES = [
  'open', // 부적합 등록 (발견됨)
  'analyzing', // 원인 분석 중
  'corrected', // 조치 완료 (종료 승인 대기)
  'closed', // 종료됨 (기술책임자 승인)
] as const;

export const NonConformanceStatusEnum = z.enum(
  NON_CONFORMANCE_STATUS_VALUES as unknown as [string, ...string[]]
);
export type NonConformanceStatus = z.infer<typeof NonConformanceStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 공용장비 출처 열거형
 *
 * 표준 값 (소문자 + 언더스코어):
 * - safety_lab: Safety Lab 등 사내 공용장비
 * - external: 외부 기관 보유 장비
 */
export const SHARED_SOURCE_VALUES = [
  'safety_lab', // Safety Lab 등 사내 공용장비
  'external', // 외부 기관 보유 장비
] as const;

export const SharedSourceEnum = z.enum(SHARED_SOURCE_VALUES as unknown as [string, ...string[]]);
export type SharedSource = z.infer<typeof SharedSourceEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 소프트웨어 타입 열거형
 *
 * 표준 타입값 (소문자 + 언더스코어):
 * - measurement: 측정 소프트웨어 (EMC32, DASY6 SAR 등)
 * - analysis: 분석 소프트웨어
 * - control: 제어 소프트웨어
 * - other: 기타
 */
export const SOFTWARE_TYPE_VALUES = [
  'measurement', // 측정 소프트웨어
  'analysis', // 분석 소프트웨어
  'control', // 제어 소프트웨어
  'other', // 기타
] as const;

export const SoftwareTypeEnum = z.enum(SOFTWARE_TYPE_VALUES as unknown as [string, ...string[]]);
export type SoftwareType = z.infer<typeof SoftwareTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 소프트웨어 변경 승인 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - pending: 승인 대기 (변경 요청)
 * - approved: 승인됨 (기술책임자가 승인)
 * - rejected: 반려됨
 */
export const SOFTWARE_APPROVAL_STATUS_VALUES = [
  'pending', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const SoftwareApprovalStatusEnum = z.enum(
  SOFTWARE_APPROVAL_STATUS_VALUES as unknown as [string, ...string[]]
);
export type SoftwareApprovalStatus = z.infer<typeof SoftwareApprovalStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정계획서 상태 열거형
 *
 * 표준 상태값 (소문자 + 언더스코어):
 * - draft: 작성 중 (기술책임자가 계획서 작성 중)
 * - pending_approval: 승인 대기 (시험소장에게 승인 요청됨)
 * - approved: 승인됨 (시험소장이 승인 완료)
 * - rejected: 반려됨 (시험소장이 반려, 사유 필수)
 *
 * @see docs/development/API_STANDARDS.md
 */
export const CALIBRATION_PLAN_STATUS_VALUES = [
  'draft', // 작성 중
  'pending_approval', // 승인 대기
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

export const CalibrationPlanStatusEnum = z.enum(
  CALIBRATION_PLAN_STATUS_VALUES as unknown as [string, ...string[]]
);
export type CalibrationPlanStatus = z.infer<typeof CalibrationPlanStatusEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 액션 열거형
 *
 * 표준 액션값 (소문자 + 언더스코어):
 * - create: 생성
 * - update: 수정
 * - delete: 삭제
 * - approve: 승인
 * - reject: 반려
 * - checkout: 반출
 * - return: 반입/반납
 * - cancel: 취소
 * - login: 로그인
 * - logout: 로그아웃
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ACTION_VALUES = [
  'create', // 생성
  'update', // 수정
  'delete', // 삭제
  'approve', // 승인
  'reject', // 반려
  'checkout', // 반출
  'return', // 반입/반납
  'cancel', // 취소
  'login', // 로그인
  'logout', // 로그아웃
] as const;

export const AuditActionEnum = z.enum(AUDIT_ACTION_VALUES as unknown as [string, ...string[]]);
export type AuditAction = z.infer<typeof AuditActionEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 엔티티 타입 열거형
 *
 * 표준 엔티티 타입값 (소문자 + 언더스코어):
 * - equipment: 장비
 * - calibration: 교정
 * - checkout: 반출
 * - rental: 대여
 * - user: 사용자
 * - team: 팀
 * - calibration_factor: 보정계수
 * - non_conformance: 부적합
 * - software: 소프트웨어
 * - calibration_plan: 교정계획서
 * - repair_history: 수리이력
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ENTITY_TYPE_VALUES = [
  'equipment', // 장비
  'calibration', // 교정
  'checkout', // 반출
  'rental', // 대여
  'user', // 사용자
  'team', // 팀
  'calibration_factor', // 보정계수
  'non_conformance', // 부적합
  'software', // 소프트웨어
  'calibration_plan', // 교정계획서
  'repair_history', // 수리이력
] as const;

export const AuditEntityTypeEnum = z.enum(
  AUDIT_ENTITY_TYPE_VALUES as unknown as [string, ...string[]]
);
export type AuditEntityType = z.infer<typeof AuditEntityTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 장비 사고/이벤트 유형 열거형
 *
 * 표준 유형값 (소문자 + 언더스코어):
 * - damage: 손상
 * - malfunction: 오작동
 * - change: 변경
 * - repair: 수리
 */
export const INCIDENT_TYPE_VALUES = [
  'damage', // 손상
  'malfunction', // 오작동
  'change', // 변경
  'repair', // 수리
] as const;

export const IncidentTypeEnum = z.enum(INCIDENT_TYPE_VALUES as unknown as [string, ...string[]]);
export type IncidentType = z.infer<typeof IncidentTypeEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 시방일치 여부 열거형
 *
 * 표준 값 (소문자):
 * - match: 일치
 * - mismatch: 불일치
 */
export const SPEC_MATCH_VALUES = [
  'match', // 일치
  'mismatch', // 불일치
] as const;

export const SpecMatchEnum = z.enum(SPEC_MATCH_VALUES as unknown as [string, ...string[]]);
export type SpecMatch = z.infer<typeof SpecMatchEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 교정 필요 여부 열거형
 *
 * 표준 값 (소문자):
 * - required: 필요
 * - not_required: 불필요
 */
export const CALIBRATION_REQUIRED_VALUES = [
  'required', // 필요
  'not_required', // 불필요
] as const;

export const CalibrationRequiredEnum = z.enum(
  CALIBRATION_REQUIRED_VALUES as unknown as [string, ...string[]]
);
export type CalibrationRequired = z.infer<typeof CalibrationRequiredEnum>;
