/**
 * 권한 상수 정의
 *
 * ⚠️ SSOT: 이 파일이 권한의 단일 소스
 * 백엔드/프론트엔드 모두 이 파일에서 import
 *
 * 권한 명명 규칙: action:resource[:sub-resource]
 * - view: 조회
 * - create: 생성
 * - update: 수정
 * - delete: 삭제
 * - approve: 승인
 * - reject: 반려
 */

/**
 * Permission enum — TypeScript enum 사용 (Zod enum이 아닌 이유)
 *
 * 1. Permission은 순수 백엔드 인가 로직용 (Zod 검증 불필요)
 * 2. enum은 역방향 매핑 지원 (Permission[value] → key name)
 * 3. NestJS @RequirePermissions() 데코레이터와 호환성
 *
 * ⚠️ 다른 도메인 enum은 Zod enum 패턴 사용 (packages/schemas/src/enums.ts)
 */
export enum Permission {
  // ============================================================================
  // 장비 관련 권한
  // ============================================================================
  VIEW_EQUIPMENT = 'view:equipment',
  CREATE_EQUIPMENT = 'create:equipment',
  UPDATE_EQUIPMENT = 'update:equipment',
  DELETE_EQUIPMENT = 'delete:equipment',
  APPROVE_EQUIPMENT = 'approve:equipment',
  REJECT_EQUIPMENT = 'reject:equipment',
  VIEW_EQUIPMENT_REQUESTS = 'view:equipment:requests',

  // ============================================================================
  // 반출 관련 권한 (교정/수리/시험소간 대여 모두 포함)
  // ============================================================================
  VIEW_CHECKOUTS = 'view:checkouts',
  CREATE_CHECKOUT = 'create:checkout',
  UPDATE_CHECKOUT = 'update:checkout',
  DELETE_CHECKOUT = 'delete:checkout',
  APPROVE_CHECKOUT = 'approve:checkout',
  REJECT_CHECKOUT = 'reject:checkout',
  START_CHECKOUT = 'start:checkout',
  COMPLETE_CHECKOUT = 'complete:checkout',
  CANCEL_CHECKOUT = 'cancel:checkout',

  // ============================================================================
  // 교정 관련 권한
  // ============================================================================
  VIEW_CALIBRATIONS = 'view:calibrations',
  CREATE_CALIBRATION = 'create:calibration',
  UPDATE_CALIBRATION = 'update:calibration',
  DELETE_CALIBRATION = 'delete:calibration',
  APPROVE_CALIBRATION = 'approve:calibration',
  VIEW_CALIBRATION_REQUESTS = 'view:calibration:requests',

  // ============================================================================
  // 보정계수 관련 권한
  // ============================================================================
  VIEW_CALIBRATION_FACTORS = 'view:calibration-factors',
  CREATE_CALIBRATION_FACTOR = 'create:calibration-factor',
  APPROVE_CALIBRATION_FACTOR = 'approve:calibration-factor',
  VIEW_CALIBRATION_FACTOR_REQUESTS = 'view:calibration-factor:requests',

  // ============================================================================
  // 부적합 관련 권한
  // ============================================================================
  VIEW_NON_CONFORMANCES = 'view:non-conformances',
  CREATE_NON_CONFORMANCE = 'create:non-conformance',
  UPDATE_NON_CONFORMANCE = 'update:non-conformance',
  CLOSE_NON_CONFORMANCE = 'close:non-conformance',

  // ============================================================================
  // 시험용 소프트웨어 관련 권한
  // ============================================================================
  VIEW_TEST_SOFTWARE = 'view:test-software',
  CREATE_TEST_SOFTWARE = 'create:test-software',
  UPDATE_TEST_SOFTWARE = 'update:test-software',

  // ============================================================================
  // 소프트웨어 유효성 확인 관련 권한
  // ============================================================================
  VIEW_SOFTWARE_VALIDATIONS = 'view:software-validations',
  CREATE_SOFTWARE_VALIDATION = 'create:software-validation',
  SUBMIT_SOFTWARE_VALIDATION = 'submit:software-validation',
  APPROVE_SOFTWARE_VALIDATION = 'approve:software-validation',

  // ============================================================================
  // 팀 관련 권한
  // ============================================================================
  VIEW_TEAMS = 'view:teams',
  CREATE_TEAMS = 'create:teams',
  UPDATE_TEAMS = 'update:teams',
  DELETE_TEAMS = 'delete:teams',

  // ============================================================================
  // 사용자 관리 권한
  // ============================================================================
  VIEW_USERS = 'view:users',
  UPDATE_USERS = 'update:users',
  MANAGE_ROLES = 'manage:roles',

  // ============================================================================
  // 알림 관련 권한
  // ============================================================================
  VIEW_NOTIFICATIONS = 'view:notifications',
  UPDATE_NOTIFICATION = 'update:notification',
  DELETE_NOTIFICATION = 'delete:notification',
  CREATE_SYSTEM_NOTIFICATION = 'create:system:notification',

  // ============================================================================
  // 통계 및 보고서 관련 권한
  // ============================================================================
  VIEW_STATISTICS = 'view:statistics',
  EXPORT_REPORTS = 'export:reports',

  // ============================================================================
  // 교정계획서 관련 권한 (3단계 승인 워크플로우)
  // ============================================================================
  VIEW_CALIBRATION_PLANS = 'view:calibration-plans',
  CREATE_CALIBRATION_PLAN = 'create:calibration-plan',
  UPDATE_CALIBRATION_PLAN = 'update:calibration-plan',
  DELETE_CALIBRATION_PLAN = 'delete:calibration-plan',
  SUBMIT_CALIBRATION_PLAN = 'submit:calibration-plan', // 검토 요청 (기술책임자 → 품질책임자)
  REVIEW_CALIBRATION_PLAN = 'review:calibration-plan', // 검토 완료 (품질책임자) - 신규
  APPROVE_CALIBRATION_PLAN = 'approve:calibration-plan', // 최종 승인 (시험소장)
  REJECT_CALIBRATION_PLAN = 'reject:calibration-plan', // 반려 (품질책임자/시험소장)
  CONFIRM_CALIBRATION_PLAN_ITEM = 'confirm:calibration-plan-item',

  // ============================================================================
  // 감사 로그 관련 권한
  // ============================================================================
  VIEW_AUDIT_LOGS = 'view:audit-logs',

  // ============================================================================
  // 폐기 관련 권한 (2단계 승인 워크플로우)
  // ============================================================================
  REQUEST_DISPOSAL = 'request:disposal',
  REVIEW_DISPOSAL = 'review:disposal',
  APPROVE_DISPOSAL = 'approve:disposal',

  // ============================================================================
  // 장비 반입 관련 권한 (렌탈 + 내부 공용 통합)
  // ============================================================================
  VIEW_EQUIPMENT_IMPORTS = 'view:equipment-imports',
  CREATE_EQUIPMENT_IMPORT = 'create:equipment-import',
  APPROVE_EQUIPMENT_IMPORT = 'approve:equipment-import',
  COMPLETE_EQUIPMENT_IMPORT = 'complete:equipment-import',
  CANCEL_EQUIPMENT_IMPORT = 'cancel:equipment-import',

  // ============================================================================
  // 자체점검 관련 권한 (UL-QP-18-05)
  // ============================================================================
  VIEW_SELF_INSPECTIONS = 'view:self-inspections',
  CREATE_SELF_INSPECTION = 'create:self-inspection',
  CONFIRM_SELF_INSPECTION = 'confirm:self-inspection',

  // ============================================================================
  // 양식 템플릿 관련 권한
  // ============================================================================
  VIEW_FORM_TEMPLATES = 'view:form-templates',
  MANAGE_FORM_TEMPLATES = 'manage:form-templates',

  // ============================================================================
  // 시스템 설정 관련 권한
  // ============================================================================
  MANAGE_SYSTEM_SETTINGS = 'manage:system:settings',
  VIEW_SYSTEM_SETTINGS = 'view:system:settings',

  // ============================================================================
  // DEPRECATED: Legacy rental import permissions (backward compatibility)
  // ============================================================================
  /**
   * @deprecated Use VIEW_EQUIPMENT_IMPORTS instead
   */
  VIEW_RENTAL_IMPORTS = 'view:equipment-imports',
  /**
   * @deprecated Use CREATE_EQUIPMENT_IMPORT instead
   */
  CREATE_RENTAL_IMPORT = 'create:equipment-import',
  /**
   * @deprecated Use APPROVE_EQUIPMENT_IMPORT instead
   */
  APPROVE_RENTAL_IMPORT = 'approve:equipment-import',
  /**
   * @deprecated Use COMPLETE_EQUIPMENT_IMPORT instead
   */
  COMPLETE_RENTAL_IMPORT = 'complete:equipment-import',
  /**
   * @deprecated Use CANCEL_EQUIPMENT_IMPORT instead
   */
  CANCEL_RENTAL_IMPORT = 'cancel:equipment-import',
}

/**
 * 권한 라벨 (UI 표시용)
 *
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(settings.profile.permissions.labels.*)를 사용하세요.
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEW_EQUIPMENT]: '장비 조회',
  [Permission.CREATE_EQUIPMENT]: '장비 등록',
  [Permission.UPDATE_EQUIPMENT]: '장비 수정',
  [Permission.DELETE_EQUIPMENT]: '장비 삭제',
  [Permission.APPROVE_EQUIPMENT]: '장비 승인',
  [Permission.REJECT_EQUIPMENT]: '장비 반려',
  [Permission.VIEW_EQUIPMENT_REQUESTS]: '장비 요청 조회',

  [Permission.VIEW_CHECKOUTS]: '반출 조회',
  [Permission.CREATE_CHECKOUT]: '반출 신청',
  [Permission.UPDATE_CHECKOUT]: '반출 수정',
  [Permission.DELETE_CHECKOUT]: '반출 삭제',
  [Permission.APPROVE_CHECKOUT]: '반출 승인',
  [Permission.REJECT_CHECKOUT]: '반출 반려',
  [Permission.START_CHECKOUT]: '반출 시작',
  [Permission.COMPLETE_CHECKOUT]: '반입 완료',
  [Permission.CANCEL_CHECKOUT]: '반출 취소',

  [Permission.VIEW_CALIBRATIONS]: '교정 조회',
  [Permission.CREATE_CALIBRATION]: '교정 등록',
  [Permission.UPDATE_CALIBRATION]: '교정 수정',
  [Permission.DELETE_CALIBRATION]: '교정 삭제',
  [Permission.APPROVE_CALIBRATION]: '교정 승인',
  [Permission.VIEW_CALIBRATION_REQUESTS]: '교정 요청 조회',

  [Permission.VIEW_CALIBRATION_FACTORS]: '보정계수 조회',
  [Permission.CREATE_CALIBRATION_FACTOR]: '보정계수 등록',
  [Permission.APPROVE_CALIBRATION_FACTOR]: '보정계수 승인',
  [Permission.VIEW_CALIBRATION_FACTOR_REQUESTS]: '보정계수 요청 조회',

  [Permission.VIEW_NON_CONFORMANCES]: '부적합 조회',
  [Permission.CREATE_NON_CONFORMANCE]: '부적합 등록',
  [Permission.UPDATE_NON_CONFORMANCE]: '부적합 수정',
  [Permission.CLOSE_NON_CONFORMANCE]: '부적합 종료',

  [Permission.VIEW_TEST_SOFTWARE]: '시험용 소프트웨어 조회',
  [Permission.CREATE_TEST_SOFTWARE]: '시험용 소프트웨어 등록',
  [Permission.UPDATE_TEST_SOFTWARE]: '시험용 소프트웨어 수정',
  [Permission.VIEW_SOFTWARE_VALIDATIONS]: '소프트웨어 유효성 확인 조회',
  [Permission.CREATE_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 생성',
  [Permission.SUBMIT_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 제출',
  [Permission.APPROVE_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 승인',

  [Permission.VIEW_TEAMS]: '팀 조회',
  [Permission.CREATE_TEAMS]: '팀 생성',
  [Permission.UPDATE_TEAMS]: '팀 수정',
  [Permission.DELETE_TEAMS]: '팀 삭제',

  [Permission.VIEW_USERS]: '사용자 조회',
  [Permission.UPDATE_USERS]: '사용자 수정',
  [Permission.MANAGE_ROLES]: '역할 관리',

  [Permission.VIEW_NOTIFICATIONS]: '알림 조회',
  [Permission.UPDATE_NOTIFICATION]: '알림 수정',
  [Permission.DELETE_NOTIFICATION]: '알림 삭제',
  [Permission.CREATE_SYSTEM_NOTIFICATION]: '시스템 알림 생성',

  [Permission.VIEW_STATISTICS]: '통계 조회',
  [Permission.EXPORT_REPORTS]: '보고서 내보내기',

  [Permission.VIEW_CALIBRATION_PLANS]: '교정계획서 조회',
  [Permission.CREATE_CALIBRATION_PLAN]: '교정계획서 작성',
  [Permission.UPDATE_CALIBRATION_PLAN]: '교정계획서 수정',
  [Permission.DELETE_CALIBRATION_PLAN]: '교정계획서 삭제',
  [Permission.SUBMIT_CALIBRATION_PLAN]: '교정계획서 검토 요청',
  [Permission.REVIEW_CALIBRATION_PLAN]: '교정계획서 검토',
  [Permission.APPROVE_CALIBRATION_PLAN]: '교정계획서 최종 승인',
  [Permission.REJECT_CALIBRATION_PLAN]: '교정계획서 반려',
  [Permission.CONFIRM_CALIBRATION_PLAN_ITEM]: '교정계획 항목 확인',

  [Permission.VIEW_AUDIT_LOGS]: '감사 로그 조회',

  [Permission.REQUEST_DISPOSAL]: '폐기 요청',
  [Permission.REVIEW_DISPOSAL]: '폐기 검토',
  [Permission.APPROVE_DISPOSAL]: '폐기 승인',

  [Permission.VIEW_EQUIPMENT_IMPORTS]: '장비 반입 조회',
  [Permission.CREATE_EQUIPMENT_IMPORT]: '장비 반입 신청',
  [Permission.APPROVE_EQUIPMENT_IMPORT]: '장비 반입 승인',
  [Permission.COMPLETE_EQUIPMENT_IMPORT]: '장비 반입 완료',
  [Permission.CANCEL_EQUIPMENT_IMPORT]: '장비 반입 취소',

  [Permission.VIEW_SELF_INSPECTIONS]: '자체점검 조회',
  [Permission.CREATE_SELF_INSPECTION]: '자체점검 등록',
  [Permission.CONFIRM_SELF_INSPECTION]: '자체점검 확인',

  [Permission.VIEW_FORM_TEMPLATES]: '양식 조회',
  [Permission.MANAGE_FORM_TEMPLATES]: '양식 관리',

  [Permission.MANAGE_SYSTEM_SETTINGS]: '시스템 설정 관리',
  [Permission.VIEW_SYSTEM_SETTINGS]: '시스템 설정 조회',

  // Legacy labels omitted (same string values as new permissions)
  // VIEW_RENTAL_IMPORTS, CREATE_RENTAL_IMPORT, etc. share strings with EQUIPMENT_IMPORTS
};
