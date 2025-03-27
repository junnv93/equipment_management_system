// 장비 상태 열거형
export enum EquipmentStatusEnum {
  AVAILABLE = 'available', // 사용 가능
  LOANED = 'loaned', // 대여 중
  CHECKED_OUT = 'checked_out', // 반출 중
  CALIBRATION_SCHEDULED = 'calibration_scheduled', // 교정 예정
  CALIBRATION_OVERDUE = 'calibration_overdue', // 교정 기한 초과
  MAINTENANCE = 'maintenance', // 유지보수 중
  RETIRED = 'retired' // 사용 중지
}

// 교정 방법 열거형
export enum CalibrationMethodEnum {
  EXTERNAL_CALIBRATION = 'external_calibration', // 외부 교정
  SELF_INSPECTION = 'self_inspection', // 자체 점검
  NOT_APPLICABLE = 'not_applicable' // 비대상
}

// 사용자 역할 열거형
export enum UserRoleEnum {
  ADMIN = 'admin', // 관리자
  MANAGER = 'manager', // 팀 관리자
  USER = 'user' // 일반 사용자
}

// 팀 ID 열거형
export enum TeamEnum {
  RF = 'rf', // RF팀
  SAR = 'sar', // SAR팀
  EMC = 'emc', // EMC팀
  AUTO = 'auto' // Automotive팀
}

// 대여 상태 열거형
export enum RentalStatusEnum {
  PENDING = 'pending', // 대여 신청
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 거절됨
  BORROWED = 'borrowed', // 대여 중
  RETURNED = 'returned', // 반납 완료
  OVERDUE = 'overdue', // 연체
  CANCELED = 'canceled' // 취소됨
}

// 대여 유형 열거형
export enum RentalTypeEnum {
  INTERNAL = 'internal', // 내부 대여
  EXTERNAL = 'external' // 외부 대여
}

// 교정 상태 열거형
export enum CalibrationStatusEnum {
  SCHEDULED = 'scheduled', // 예정됨
  IN_PROGRESS = 'in_progress', // 진행 중
  COMPLETED = 'completed', // 완료됨
  FAILED = 'failed', // 실패
  CANCELLED = 'cancelled' // 취소됨
}

// 반출 상태 열거형
export enum CheckoutStatusEnum {
  PENDING = 'pending', // 반출 신청
  APPROVED = 'approved', // 승인됨
  REJECTED = 'rejected', // 거절됨
  CHECKED_OUT = 'checked_out', // 반출 중
  RETURNED = 'returned', // 반납 완료
  OVERDUE = 'overdue', // 연체
  CANCELED = 'canceled' // 취소됨
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