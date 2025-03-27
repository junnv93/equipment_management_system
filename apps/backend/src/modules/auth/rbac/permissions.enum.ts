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