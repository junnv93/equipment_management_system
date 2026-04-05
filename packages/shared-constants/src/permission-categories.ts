/**
 * 권한 카테고리 SSOT
 *
 * Permission enum의 주석 섹션 구조를 코드로 정형화.
 * 프론트엔드 권한 카드, 향후 관리자 권한 관리 UI에서 재사용.
 *
 * SSOT 체인:
 *   permissions.ts (Permission enum 정의)
 *     → 이 파일 (카테고리별 그룹핑)
 *       → ProfileContent.tsx (권한 카드 UI)
 */
import { Permission } from './permissions';

export const PERMISSION_CATEGORY_KEYS = [
  'equipment',
  'checkouts',
  'calibrations',
  'calibrationFactors',
  'nonConformances',
  'software',
  'teams',
  'users',
  'notifications',
  'reports',
  'calibrationPlans',
  'audit',
  'disposal',
  'equipmentImports',
  'selfInspections',
  'system',
] as const;

export type PermissionCategoryKey = (typeof PERMISSION_CATEGORY_KEYS)[number];

export const PERMISSION_CATEGORIES: Record<PermissionCategoryKey, readonly Permission[]> = {
  equipment: [
    Permission.VIEW_EQUIPMENT,
    Permission.CREATE_EQUIPMENT,
    Permission.UPDATE_EQUIPMENT,
    Permission.DELETE_EQUIPMENT,
    Permission.APPROVE_EQUIPMENT,
    Permission.REJECT_EQUIPMENT,
    Permission.VIEW_EQUIPMENT_REQUESTS,
  ],
  checkouts: [
    Permission.VIEW_CHECKOUTS,
    Permission.CREATE_CHECKOUT,
    Permission.UPDATE_CHECKOUT,
    Permission.DELETE_CHECKOUT,
    Permission.APPROVE_CHECKOUT,
    Permission.REJECT_CHECKOUT,
    Permission.START_CHECKOUT,
    Permission.COMPLETE_CHECKOUT,
    Permission.CANCEL_CHECKOUT,
  ],
  calibrations: [
    Permission.VIEW_CALIBRATIONS,
    Permission.CREATE_CALIBRATION,
    Permission.UPDATE_CALIBRATION,
    Permission.DELETE_CALIBRATION,
    Permission.APPROVE_CALIBRATION,
    Permission.VIEW_CALIBRATION_REQUESTS,
  ],
  calibrationFactors: [
    Permission.VIEW_CALIBRATION_FACTORS,
    Permission.CREATE_CALIBRATION_FACTOR,
    Permission.APPROVE_CALIBRATION_FACTOR,
    Permission.VIEW_CALIBRATION_FACTOR_REQUESTS,
  ],
  nonConformances: [
    Permission.VIEW_NON_CONFORMANCES,
    Permission.CREATE_NON_CONFORMANCE,
    Permission.UPDATE_NON_CONFORMANCE,
    Permission.CLOSE_NON_CONFORMANCE,
  ],
  software: [
    Permission.VIEW_TEST_SOFTWARE,
    Permission.CREATE_TEST_SOFTWARE,
    Permission.UPDATE_TEST_SOFTWARE,
    Permission.VIEW_SOFTWARE_VALIDATIONS,
    Permission.CREATE_SOFTWARE_VALIDATION,
    Permission.SUBMIT_SOFTWARE_VALIDATION,
    Permission.APPROVE_SOFTWARE_VALIDATION,
  ],
  teams: [
    Permission.VIEW_TEAMS,
    Permission.CREATE_TEAMS,
    Permission.UPDATE_TEAMS,
    Permission.DELETE_TEAMS,
  ],
  users: [Permission.VIEW_USERS, Permission.UPDATE_USERS, Permission.MANAGE_ROLES],
  notifications: [
    Permission.VIEW_NOTIFICATIONS,
    Permission.UPDATE_NOTIFICATION,
    Permission.DELETE_NOTIFICATION,
    Permission.CREATE_SYSTEM_NOTIFICATION,
  ],
  reports: [Permission.VIEW_STATISTICS, Permission.EXPORT_REPORTS],
  calibrationPlans: [
    Permission.VIEW_CALIBRATION_PLANS,
    Permission.CREATE_CALIBRATION_PLAN,
    Permission.UPDATE_CALIBRATION_PLAN,
    Permission.DELETE_CALIBRATION_PLAN,
    Permission.SUBMIT_CALIBRATION_PLAN,
    Permission.REVIEW_CALIBRATION_PLAN,
    Permission.APPROVE_CALIBRATION_PLAN,
    Permission.REJECT_CALIBRATION_PLAN,
    Permission.CONFIRM_CALIBRATION_PLAN_ITEM,
  ],
  audit: [Permission.VIEW_AUDIT_LOGS],
  disposal: [Permission.REQUEST_DISPOSAL, Permission.REVIEW_DISPOSAL, Permission.APPROVE_DISPOSAL],
  equipmentImports: [
    Permission.VIEW_EQUIPMENT_IMPORTS,
    Permission.CREATE_EQUIPMENT_IMPORT,
    Permission.APPROVE_EQUIPMENT_IMPORT,
    Permission.COMPLETE_EQUIPMENT_IMPORT,
    Permission.CANCEL_EQUIPMENT_IMPORT,
  ],
  selfInspections: [
    Permission.VIEW_SELF_INSPECTIONS,
    Permission.CREATE_SELF_INSPECTION,
    Permission.CONFIRM_SELF_INSPECTION,
  ],
  system: [Permission.MANAGE_SYSTEM_SETTINGS, Permission.VIEW_SYSTEM_SETTINGS],
};
