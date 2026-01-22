/**
 * ⚠️ DEPRECATED: 이 파일은 더 이상 직접 사용하지 않습니다.
 *
 * 대신 @equipment-management/schemas에서 import하여 사용하세요:
 * import { EquipmentStatusEnum, EquipmentStatus } from '@equipment-management/schemas';
 *
 * 이 파일은 하위 호환성을 위해 유지되지만, 새로운 코드에서는 사용하지 마세요.
 *
 * @deprecated Use @equipment-management/schemas instead
 */
// 장비 상태 열거형
export enum EquipmentStatusEnum {
  AVAILABLE = 'available', // 사용 가능
  IN_USE = 'in_use', // 사용 중 (대여 중 포함)
  CHECKED_OUT = 'checked_out', // 반출 중
  CALIBRATION_SCHEDULED = 'calibration_scheduled', // 교정 예정
  CALIBRATION_OVERDUE = 'calibration_overdue', // 교정 기한 초과
  NON_CONFORMING = 'non_conforming', // 부적합 (임시, 수리 후 복귀 가능)
  SPARE = 'spare', // 여분
  RETIRED = 'retired', // 폐기 (영구)
}

// 교정 방법 열거형
export enum CalibrationMethodEnum {
  EXTERNAL_CALIBRATION = 'external_calibration', // 외부 교정
  SELF_INSPECTION = 'self_inspection', // 자체 점검
  NOT_APPLICABLE = 'not_applicable', // 비대상
}

// 사용자 역할 열거형 (UL-QP-18 절차서 영문 명칭 기준)
// @deprecated 이 enum은 하위 호환성을 위해 유지됩니다.
// 새로운 코드에서는 @equipment-management/schemas의 UserRoleEnum을 사용하세요.
export enum UserRoleEnum {
  TEST_ENGINEER = 'test_engineer', // 시험실무자 (Test Engineer)
  TECHNICAL_MANAGER = 'technical_manager', // 기술책임자 (Technical Manager)
  LAB_MANAGER = 'lab_manager', // 시험소장 (Lab Manager)
}

// 하위 호환성을 위한 별칭 (enum 외부에 정의)
/** @deprecated Use UserRoleEnum.TEST_ENGINEER instead */
export const USER = UserRoleEnum.TEST_ENGINEER;
/** @deprecated Use UserRoleEnum.TECHNICAL_MANAGER instead */
export const MANAGER = UserRoleEnum.TECHNICAL_MANAGER;
/** @deprecated Use UserRoleEnum.LAB_MANAGER instead */
export const ADMIN = UserRoleEnum.LAB_MANAGER;

// 팀 ID 열거형
export enum TeamEnum {
  RF = 'rf', // RF팀
  SAR = 'sar', // SAR팀
  EMC = 'emc', // EMC팀
  AUTO = 'auto', // Automotive팀
}

// 대여 상태 열거형
export enum RentalStatusEnum {
  PENDING = 'pending', // 대여 신청
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 거절됨
  BORROWED = 'borrowed', // 대여 중
  RETURNED = 'returned', // 반납 완료
  OVERDUE = 'overdue', // 연체
  CANCELED = 'canceled', // 취소됨
  RETURN_REQUESTED = 'return_requested', // 반납 요청됨
}

// 대여 유형 열거형
export enum RentalTypeEnum {
  INTERNAL = 'internal', // 내부 대여
  EXTERNAL = 'external', // 외부 대여
}

// 교정 상태 열거형
export enum CalibrationStatusEnum {
  SCHEDULED = 'scheduled', // 예정됨
  IN_PROGRESS = 'in_progress', // 진행 중
  COMPLETED = 'completed', // 완료됨
  FAILED = 'failed', // 실패
  CANCELLED = 'cancelled', // 취소됨
}

// 교정 승인 상태 열거형
export enum CalibrationApprovalStatusEnum {
  PENDING_APPROVAL = 'pending_approval', // 승인 대기
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 반려됨
}

// 교정 등록자 역할 열거형
export enum CalibrationRegisteredByRoleEnum {
  TEST_ENGINEER = 'test_engineer', // 시험실무자 (Test Engineer)
  TECHNICAL_MANAGER = 'technical_manager', // 기술책임자 (Technical Manager)
}

// 반출 상태 열거형
export enum CheckoutStatusEnum {
  PENDING = 'pending', // 반출 신청
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 거절됨
  CHECKED_OUT = 'checked_out', // 반출 중
  RETURNED = 'returned', // 반납 완료
  OVERDUE = 'overdue', // 연체
  CANCELED = 'canceled', // 취소됨
}

// 권한 열거형
export enum Permission {
  // 장비 관련 권한
  VIEW_EQUIPMENT = 'view:equipment',
  CREATE_EQUIPMENT = 'create:equipment',
  UPDATE_EQUIPMENT = 'update:equipment',
  DELETE_EQUIPMENT = 'delete:equipment',

  // 대여 관련 권한
  VIEW_RENTALS = 'view:rentals',
  REQUEST_RENTAL = 'request:rental',
  APPROVE_RENTAL = 'approve:rental',
  REJECT_RENTAL = 'reject:rental',

  // 반출 관련 권한
  VIEW_CHECKOUTS = 'view:checkouts',
  CREATE_CHECKOUT = 'create:checkout',
  APPROVE_CHECKOUT = 'approve:checkout',

  // 교정 관련 권한
  VIEW_CALIBRATIONS = 'view:calibrations',
  CREATE_CALIBRATION = 'create:calibration',
  UPDATE_CALIBRATION = 'update:calibration',
  DELETE_CALIBRATION = 'delete:calibration',
  APPROVE_CALIBRATION = 'approve:calibration',
  VIEW_CALIBRATION_REQUESTS = 'view:calibration:requests',

  // 팀 관련 권한
  VIEW_TEAMS = 'view:teams',
  CREATE_TEAMS = 'create:teams',
  UPDATE_TEAMS = 'update:teams',
  DELETE_TEAMS = 'delete:teams',

  // 사용자 관리 권한
  VIEW_USERS = 'view:users',
  UPDATE_USERS = 'update:users',
  MANAGE_ROLES = 'manage:roles',

  // 알림 관련 권한
  VIEW_NOTIFICATIONS = 'view:notifications',
  CREATE_NOTIFICATION = 'create:notification',
  UPDATE_NOTIFICATION = 'update:notification',
  DELETE_NOTIFICATION = 'delete:notification',
  CREATE_SYSTEM_NOTIFICATION = 'create:system:notification',
  MANAGE_NOTIFICATION_SETTINGS = 'manage:notification:settings',

  // 통계 및 보고서 관련 권한
  VIEW_STATISTICS = 'view:statistics',
  EXPORT_REPORTS = 'export:reports',
  CREATE_DASHBOARD = 'create:dashboard',
  MANAGE_REPORTS = 'manage:reports',
}
