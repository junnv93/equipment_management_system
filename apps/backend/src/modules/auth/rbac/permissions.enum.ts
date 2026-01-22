export enum Permission {
  // 장비 관련 권한
  VIEW_EQUIPMENT = 'view:equipment',
  CREATE_EQUIPMENT = 'create:equipment',
  UPDATE_EQUIPMENT = 'update:equipment',
  DELETE_EQUIPMENT = 'delete:equipment',
  APPROVE_EQUIPMENT = 'approve:equipment', // 장비 승인 권한
  REJECT_EQUIPMENT = 'reject:equipment', // 장비 반려 권한
  VIEW_EQUIPMENT_REQUESTS = 'view:equipment:requests', // 장비 요청 목록 조회

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
  APPROVE_CALIBRATION = 'approve:calibration', // 교정 승인 권한 (기술책임자)
  VIEW_CALIBRATION_REQUESTS = 'view:calibration:requests', // 교정 승인 대기 목록 조회

  // 보정계수 관련 권한
  VIEW_CALIBRATION_FACTORS = 'view:calibration-factors',
  CREATE_CALIBRATION_FACTOR = 'create:calibration-factor',
  APPROVE_CALIBRATION_FACTOR = 'approve:calibration-factor', // 보정계수 승인 권한 (기술책임자)
  VIEW_CALIBRATION_FACTOR_REQUESTS = 'view:calibration-factor:requests', // 보정계수 승인 대기 목록 조회

  // 부적합 관련 권한
  VIEW_NON_CONFORMANCES = 'view:non-conformances',
  CREATE_NON_CONFORMANCE = 'create:non-conformance', // 부적합 등록 (시험실무자)
  UPDATE_NON_CONFORMANCE = 'update:non-conformance', // 부적합 업데이트 (원인분석/조치)
  CLOSE_NON_CONFORMANCE = 'close:non-conformance', // 부적합 종료 (기술책임자)

  // 소프트웨어 관련 권한
  VIEW_SOFTWARE = 'view:software', // 소프트웨어 관리대장 조회
  CREATE_SOFTWARE_CHANGE = 'create:software-change', // 소프트웨어 변경 요청 (검증 기록 필수)
  APPROVE_SOFTWARE_CHANGE = 'approve:software-change', // 소프트웨어 변경 승인 (기술책임자)
  VIEW_SOFTWARE_REQUESTS = 'view:software:requests', // 소프트웨어 변경 승인 대기 목록 조회

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

  // 교정계획서 관련 권한
  VIEW_CALIBRATION_PLANS = 'view:calibration-plans', // 교정계획서 조회
  CREATE_CALIBRATION_PLAN = 'create:calibration-plan', // 교정계획서 작성 (기술책임자)
  UPDATE_CALIBRATION_PLAN = 'update:calibration-plan', // 교정계획서 수정 (기술책임자)
  DELETE_CALIBRATION_PLAN = 'delete:calibration-plan', // 교정계획서 삭제 (기술책임자, draft만)
  SUBMIT_CALIBRATION_PLAN = 'submit:calibration-plan', // 교정계획서 승인 요청 (기술책임자)
  APPROVE_CALIBRATION_PLAN = 'approve:calibration-plan', // 교정계획서 승인 (lab_manager)
  REJECT_CALIBRATION_PLAN = 'reject:calibration-plan', // 교정계획서 반려 (lab_manager)
  CONFIRM_CALIBRATION_PLAN_ITEM = 'confirm:calibration-plan-item', // 항목 확인 (기술책임자)

  // 감사 로그 관련 권한
  VIEW_AUDIT_LOGS = 'view:audit-logs', // 감사 로그 조회 (lab_manager만)
}
