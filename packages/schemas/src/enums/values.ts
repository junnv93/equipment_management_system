import type { EquipmentStatus, UserRole } from './equipment';
import type { CheckoutStatus, CheckoutPurpose } from './checkout';
import type {
  CalibrationApprovalStatus,
  CalibrationFactorApprovalStatus,
  CalibrationFactorType,
  CalibrationRequired,
  IntermediateCheckStatus,
  IntermediateCheckFilterStatus,
  SpecMatch,
} from './calibration';
import type { CalibrationPlanStatus } from './calibration-plan';
import type { NonConformanceStatus, NonConformanceType, RepairResult } from './non-conformance';
import type { ValidationStatus, SoftwareAvailability } from './software';
import type { IncidentType } from './incident';
import type { NotificationPriority, NotificationType } from './notification';
import type {
  ReturnCondition,
  ReturnApprovalStatus,
  ConditionCheckStep,
  ConditionStatus,
  AccessoriesStatus,
} from './return-condition';
import type { DisposalReviewStatus } from './disposal';
import type { UserStatus } from './shared';
import type { ManagementMethod } from './equipment';
import type { ResolutionType } from './non-conformance';

// ============================================================================
// CONST VALUE OBJECTS (TypeScript enum 스타일 접근용)
// Zod enum은 .VALUE 형식 접근이 불가능하므로, 기존 코드 호환성을 위해 제공
// ============================================================================

/**
 * 장비 상태 값 객체 (dot-notation 접근용)
 * @example EquipmentStatusValues.AVAILABLE // 'available'
 */
export const EquipmentStatusValues = {
  AVAILABLE: 'available',
  CHECKED_OUT: 'checked_out',
  NON_CONFORMING: 'non_conforming',
  SPARE: 'spare',
  PENDING_DISPOSAL: 'pending_disposal',
  DISPOSED: 'disposed',
  TEMPORARY: 'temporary',
  INACTIVE: 'inactive',
} as const;

/**
 * 사용자 역할 값 객체 (dot-notation 접근용)
 * @example UserRoleValues.LAB_MANAGER // 'lab_manager'
 */
export const UserRoleValues = {
  TEST_ENGINEER: 'test_engineer',
  TECHNICAL_MANAGER: 'technical_manager',
  QUALITY_MANAGER: 'quality_manager',
  LAB_MANAGER: 'lab_manager',
  SYSTEM_ADMIN: 'system_admin',
} as const;

/**
 * 사용자 상태 값 객체 (dot-notation 접근용)
 * @example UserStatusValues.ACTIVE // 'active'
 */
export const UserStatusValues = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

/**
 * 관리 방법 값 객체 (dot-notation 접근용)
 * @example ManagementMethodValues.EXTERNAL_CALIBRATION // 'external_calibration'
 */
export const ManagementMethodValues = {
  EXTERNAL_CALIBRATION: 'external_calibration',
  SELF_INSPECTION: 'self_inspection',
  NOT_APPLICABLE: 'not_applicable',
} as const satisfies Record<string, ManagementMethod>;

/**
 * 해결 유형 값 객체 (dot-notation 접근용)
 * @example ResolutionTypeValues.REPAIR // 'repair'
 */
export const ResolutionTypeValues = {
  REPAIR: 'repair',
  RECALIBRATION: 'recalibration',
  REPLACEMENT: 'replacement',
  DISPOSAL: 'disposal',
  OTHER: 'other',
} as const satisfies Record<string, ResolutionType>;

/**
 * 반출 상태 값 객체 (dot-notation 접근용)
 * @example CheckoutStatusValues.PENDING // 'pending'
 */
export const CheckoutStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_OUT: 'checked_out',
  LENDER_CHECKED: 'lender_checked',
  BORROWER_RECEIVED: 'borrower_received',
  IN_USE: 'in_use',
  BORROWER_RETURNED: 'borrower_returned',
  LENDER_RECEIVED: 'lender_received',
  RETURNED: 'returned',
  RETURN_APPROVED: 'return_approved',
  OVERDUE: 'overdue',
  CANCELED: 'canceled',
} as const;

/**
 * 반출 목적 값 객체 (dot-notation 접근용)
 * @example CheckoutPurposeValues.CALIBRATION // 'calibration'
 */
export const CheckoutPurposeValues = {
  CALIBRATION: 'calibration',
  REPAIR: 'repair',
  RENTAL: 'rental',
  RETURN_TO_VENDOR: 'return_to_vendor',
} as const;

/**
 * 교정 승인 상태 값 객체 (dot-notation 접근용)
 * @example CalibrationApprovalStatusValues.PENDING_APPROVAL // 'pending_approval'
 */
export const CalibrationApprovalStatusValues = {
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * 보정계수 승인 상태 값 객체 (dot-notation 접근용)
 * @example CalibrationFactorApprovalStatusValues.PENDING // 'pending'
 */
export const CalibrationFactorApprovalStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * 보정계수 타입 값 객체 (dot-notation 접근용)
 * @example CalibrationFactorTypeValues.ANTENNA_GAIN // 'antenna_gain'
 */
export const CalibrationFactorTypeValues = {
  ANTENNA_GAIN: 'antenna_gain',
  CABLE_LOSS: 'cable_loss',
  PATH_LOSS: 'path_loss',
  AMPLIFIER_GAIN: 'amplifier_gain',
  OTHER: 'other',
} as const;

/** @example CalibrationRequiredValues.REQUIRED // 'required' */
export const CalibrationRequiredValues = {
  REQUIRED: 'required',
  NOT_REQUIRED: 'not_required',
} as const satisfies Record<string, CalibrationRequired>;

/** @example SpecMatchValues.MATCH // 'match' */
export const SpecMatchValues = {
  MATCH: 'match',
  MISMATCH: 'mismatch',
} as const satisfies Record<string, SpecMatch>;

/**
 * 중간점검 상태 값 상수 — 하드코딩 문자열 리터럴 대신 사용
 * @example IntermediateCheckStatusValues.PENDING // 'pending'
 */
export const IntermediateCheckStatusValues = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  DUE: 'due',
} as const satisfies Record<string, IntermediateCheckStatus>;

export const IntermediateCheckFilterStatusValues = {
  OVERDUE: 'overdue',
  DUE: 'due',
  PENDING: 'pending',
} as const satisfies Record<string, IntermediateCheckFilterStatus>;

/**
 * 부적합 유형 값 객체 (dot-notation 접근용)
 * @example NonConformanceTypeValues.DAMAGE // 'damage'
 */
export const NonConformanceTypeValues = {
  DAMAGE: 'damage',
  MALFUNCTION: 'malfunction',
  CALIBRATION_FAILURE: 'calibration_failure',
  CALIBRATION_OVERDUE: 'calibration_overdue',
  MEASUREMENT_ERROR: 'measurement_error',
  OTHER: 'other',
} as const;

/**
 * 부적합 상태 값 객체 (dot-notation 접근용)
 * @example NonConformanceStatusValues.OPEN // 'open'
 */
export const NonConformanceStatusValues = {
  OPEN: 'open',
  CORRECTED: 'corrected',
  CLOSED: 'closed',
} as const;

/**
 * 수리 결과 값 객체 (dot-notation 접근용)
 * @example RepairResultValues.COMPLETED // 'completed'
 */
export const RepairResultValues = {
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const;

/**
 * 사고 유형 값 객체 (dot-notation 접근용)
 * @example IncidentTypeValues.DAMAGE // 'damage'
 */
export const IncidentTypeValues = {
  DAMAGE: 'damage',
  MALFUNCTION: 'malfunction',
  CHANGE: 'change',
  REPAIR: 'repair',
  CALIBRATION_OVERDUE: 'calibration_overdue',
} as const;

/**
 * 유효성 확인 상태 값 객체 (dot-notation 접근용)
 * @example ValidationStatusValues.DRAFT // 'draft'
 */
export const ValidationStatusValues = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  QUALITY_APPROVED: 'quality_approved',
  REJECTED: 'rejected',
} as const satisfies Record<string, ValidationStatus>;

/**
 * 소프트웨어 가용 여부 값 객체 (dot-notation 접근용)
 * @example SoftwareAvailabilityValues.AVAILABLE // 'available'
 */
export const SoftwareAvailabilityValues = {
  AVAILABLE: 'available',
  UNAVAILABLE: 'unavailable',
} as const satisfies Record<string, SoftwareAvailability>;

/**
 * 알림 우선순위 값 객체 (dot-notation 접근용)
 * @example NotificationPriorityValues.MEDIUM // 'medium'
 */
export const NotificationPriorityValues = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

/**
 * 알림 유형 값 객체 (dot-notation 접근용)
 * @example NotificationTypeValues.CHECKOUT_CREATED // 'checkout_created'
 */
export const NotificationTypeValues = {
  // 신규 이벤트 기반 타입
  CHECKOUT_CREATED: 'checkout_created',
  CHECKOUT_APPROVED: 'checkout_approved',
  CHECKOUT_REJECTED: 'checkout_rejected',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_RETURNED: 'checkout_returned',
  CHECKOUT_RETURN_APPROVED: 'checkout_return_approved',
  CHECKOUT_OVERDUE: 'checkout_overdue',
  CALIBRATION_CREATED: 'calibration_created',
  CALIBRATION_APPROVED: 'calibration_approved',
  CALIBRATION_REJECTED: 'calibration_rejected',
  CALIBRATION_DUE_SOON: 'calibration_due_soon',
  CALIBRATION_OVERDUE: 'calibration_overdue',
  NON_CONFORMANCE_CREATED: 'non_conformance_created',
  NON_CONFORMANCE_CORRECTED: 'non_conformance_corrected',
  NON_CONFORMANCE_CLOSED: 'non_conformance_closed',
  NON_CONFORMANCE_CORRECTION_REJECTED: 'non_conformance_correction_rejected',
  EQUIPMENT_REQUEST_CREATED: 'equipment_request_created',
  EQUIPMENT_REQUEST_APPROVED: 'equipment_request_approved',
  EQUIPMENT_REQUEST_REJECTED: 'equipment_request_rejected',
  DISPOSAL_REQUESTED: 'disposal_requested',
  DISPOSAL_REVIEWED: 'disposal_reviewed',
  DISPOSAL_APPROVED: 'disposal_approved',
  DISPOSAL_REJECTED: 'disposal_rejected',
  EQUIPMENT_IMPORT_CREATED: 'equipment_import_created',
  EQUIPMENT_IMPORT_APPROVED: 'equipment_import_approved',
  EQUIPMENT_IMPORT_REJECTED: 'equipment_import_rejected',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  // 레거시 호환
  CALIBRATION_DUE: 'calibration_due',
  CALIBRATION_COMPLETED: 'calibration_completed',
  CALIBRATION_APPROVAL_PENDING: 'calibration_approval_pending',
  INTERMEDIATE_CHECK_DUE: 'intermediate_check_due',
  RENTAL_REQUEST: 'rental_request',
  RENTAL_APPROVED: 'rental_approved',
  RENTAL_REJECTED: 'rental_rejected',
  RENTAL_COMPLETED: 'rental_completed',
  RETURN_REQUESTED: 'return_requested',
  RETURN_APPROVED: 'return_approved',
  RETURN_REJECTED: 'return_rejected',
  EQUIPMENT_MAINTENANCE: 'equipment_maintenance',
  SYSTEM: 'system',
  CHECKOUT: 'checkout',
  MAINTENANCE: 'maintenance',
} as const;

/**
 * 반납 상태 값 객체 (dot-notation 접근용)
 * @example ReturnConditionValues.GOOD // 'good'
 */
export const ReturnConditionValues = {
  GOOD: 'good',
  DAMAGED: 'damaged',
  LOST: 'lost',
  NEEDS_REPAIR: 'needs_repair',
  NEEDS_CALIBRATION: 'needs_calibration',
} as const;

/**
 * 반납 승인 상태 값 객체 (dot-notation 접근용)
 * @example ReturnApprovalStatusValues.APPROVED // 'approved'
 */
export const ReturnApprovalStatusValues = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

/**
 * 상태 확인 단계 값 객체 (dot-notation 접근용)
 * @example ConditionCheckStepValues.LENDER_CHECKOUT // 'lender_checkout'
 */
export const ConditionCheckStepValues = {
  LENDER_CHECKOUT: 'lender_checkout',
  BORROWER_RECEIVE: 'borrower_receive',
  BORROWER_RETURN: 'borrower_return',
  LENDER_RETURN: 'lender_return',
} as const;

/**
 * 외관/작동 상태 값 객체 (dot-notation 접근용)
 * @example ConditionStatusValues.NORMAL // 'normal'
 */
export const ConditionStatusValues = {
  NORMAL: 'normal',
  ABNORMAL: 'abnormal',
} as const;

/**
 * 부속품 상태 값 객체 (dot-notation 접근용)
 * @example AccessoriesStatusValues.COMPLETE // 'complete'
 */
export const AccessoriesStatusValues = {
  COMPLETE: 'complete',
  INCOMPLETE: 'incomplete',
} as const;

/**
 * 폐기 검토 상태 값 객체 (dot-notation 접근용)
 * @example DisposalReviewStatusValues.PENDING // 'pending'
 */
export const DisposalReviewStatusValues = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
