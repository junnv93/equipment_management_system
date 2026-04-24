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
 *
 * ─── 신규 권한 추가 시 가이드 ─────────────────────────────────────────────
 * 1. 리소스 명사 단/복수 결정:
 *    - 컬렉션 조회(목록) → 복수형 (`view:checkouts`, `view:teams`, `view:notifications`)
 *    - 단일 리소스 mutation → 단수형 (`create:checkout`, `update:notification`)
 *    - 기존 권한과의 일관성을 우선 (예: equipment는 불가산이라 단수 유지)
 * 2. 워크플로우 단계가 있는 도메인은 CRUD 대신 transition 동사 사용:
 *    - 예: `submit:`, `review:`, `approve:`, `complete:`, `cancel:`
 *    - 절차서(UL-QP-18)의 각 단계가 권한 1개에 대응되도록
 * 3. CRUD 매트릭스 폭발 금지: 실제로 분기되는 행동만 권한화
 *    (역할별로 항상 같이 부여된다면 하나로 합치기)
 * 4. 추가 후 ROLE_PERMISSIONS(role-permissions.ts) 매핑 반드시 갱신
 *    + PERMISSION_LABELS도 함께 추가 (서버 사이드 라벨)
 * 5. 명명 불일치(단/복수)는 발견하더라도 기존 항목을 리네임하지 말 것 —
 *    DB/감사로그/프론트 캐시 키 전체 마이그레이션 비용이 이득보다 큼.
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
  /** 대여(rental) 1차 승인 — 차용 팀 기술책임자 전용 */
  BORROWER_APPROVE_CHECKOUT = 'borrower_approve:checkout',
  /** 대여(rental) 1차 반려 — 차용 팀 기술책임자 전용 */
  BORROWER_REJECT_CHECKOUT = 'borrower_reject:checkout',
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
  /** NC 첨부(현장 사진 등) 업로드 — CREATE_NON_CONFORMANCE 권한자라면 첨부도 가능해야 맥락 일치 */
  UPLOAD_NON_CONFORMANCE_ATTACHMENT = 'upload:non-conformance-attachment',
  /** NC 첨부 삭제 — 신고자(혹은 기술책임자)만. UPDATE_NON_CONFORMANCE와 동등한 쓰기 권한 레벨 */
  DELETE_NON_CONFORMANCE_ATTACHMENT = 'delete:non-conformance-attachment',

  // ============================================================================
  // 시험용 소프트웨어 관련 권한
  // ============================================================================
  VIEW_TEST_SOFTWARE = 'view:test-software',
  CREATE_TEST_SOFTWARE = 'create:test-software',
  UPDATE_TEST_SOFTWARE = 'update:test-software',

  // ============================================================================
  // 소프트웨어 유효성 확인 관련 권한 (ISO/IEC 17025 §6.2.2 독립성)
  // ============================================================================
  VIEW_SOFTWARE_VALIDATIONS = 'view:software-validations',
  CREATE_SOFTWARE_VALIDATION = 'create:software-validation',
  SUBMIT_SOFTWARE_VALIDATION = 'submit:software-validation',
  /** 공통 승인 게이트: findPending/reject 엔드포인트 접근. 역할 무관하게 승인 권한자 공통 */
  APPROVE_SOFTWARE_VALIDATION = 'approve:software-validation',
  /** 기술 승인 (§6.2.2: 제출자와 달라야 함) — technical_manager 전용 */
  APPROVE_TECH_SOFTWARE_VALIDATION = 'approve:software-validation:technical',
  /** 품질 승인 (§6.2.2: 기술 승인자와 달라야 함) — quality_manager 전용 */
  APPROVE_QUALITY_SOFTWARE_VALIDATION = 'approve:software-validation:quality',
  /** 재검증 요청 — 소프트웨어 버전 변경 시 기존 유효성 확인 무효화 */
  REVALIDATE_SOFTWARE_VALIDATION = 'revalidate:software-validation',

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
  /** 시험실무자: 생성/수정/제출/재제출/사진업로드/결과섹션 관리 */
  SUBMIT_SELF_INSPECTION = 'submit:self-inspection',
  WITHDRAW_SELF_INSPECTION = 'withdraw:self-inspection',
  /** 기술책임자: 승인 */
  APPROVE_SELF_INSPECTION = 'approve:self-inspection',
  REJECT_SELF_INSPECTION = 'reject:self-inspection',
  DELETE_SELF_INSPECTION = 'delete:self-inspection',

  // ============================================================================
  // 양식 템플릿 관련 권한
  // ============================================================================
  VIEW_FORM_TEMPLATES = 'view:form-templates',
  MANAGE_FORM_TEMPLATES = 'manage:form-templates',
  /** 과거(superseded) 양식 버전 다운로드 권한. 품질책임자/시험소장/시스템관리자만 */
  DOWNLOAD_FORM_TEMPLATE_HISTORY = 'download:form-template-history',

  // ============================================================================
  // 중간점검 관련 권한 (UL-QP-18-03 역할 분리)
  // ============================================================================
  SUBMIT_INTERMEDIATE_INSPECTION = 'submit:intermediate-inspection',
  WITHDRAW_INTERMEDIATE_INSPECTION = 'withdraw:intermediate-inspection',
  REVIEW_INTERMEDIATE_INSPECTION = 'review:intermediate-inspection',
  APPROVE_INTERMEDIATE_INSPECTION = 'approve:intermediate-inspection',
  REJECT_INTERMEDIATE_INSPECTION = 'reject:intermediate-inspection',
  DELETE_INTERMEDIATE_INSPECTION = 'delete:intermediate-inspection',

  // ============================================================================
  // 시스템 설정 관련 권한
  // ============================================================================
  MANAGE_SYSTEM_SETTINGS = 'manage:system:settings',
  VIEW_SYSTEM_SETTINGS = 'view:system:settings',

  // ============================================================================
  // 데이터 마이그레이션 권한 (SYSTEM_ADMIN 전용)
  // ============================================================================
  PERFORM_DATA_MIGRATION = 'perform:data:migration',
}

/**
 * 권한 라벨 — 한국어 (백엔드 감사로그, 알림 메시지 등 서버 사이드 렌더링에 사용)
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
  [Permission.BORROWER_APPROVE_CHECKOUT]: '대여 1차 승인 (차용 팀)',
  [Permission.BORROWER_REJECT_CHECKOUT]: '대여 1차 반려 (차용 팀)',
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
  [Permission.UPLOAD_NON_CONFORMANCE_ATTACHMENT]: '부적합 첨부 업로드',
  [Permission.DELETE_NON_CONFORMANCE_ATTACHMENT]: '부적합 첨부 삭제',

  [Permission.VIEW_TEST_SOFTWARE]: '시험용 소프트웨어 조회',
  [Permission.CREATE_TEST_SOFTWARE]: '시험용 소프트웨어 등록',
  [Permission.UPDATE_TEST_SOFTWARE]: '시험용 소프트웨어 수정',
  [Permission.VIEW_SOFTWARE_VALIDATIONS]: '소프트웨어 유효성 확인 조회',
  [Permission.CREATE_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 생성',
  [Permission.SUBMIT_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 제출',
  [Permission.APPROVE_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 승인 (공통)',
  [Permission.APPROVE_TECH_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 기술 승인',
  [Permission.APPROVE_QUALITY_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 품질 승인',
  [Permission.REVALIDATE_SOFTWARE_VALIDATION]: '소프트웨어 유효성 확인 재검증 요청',

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
  [Permission.SUBMIT_SELF_INSPECTION]: '자체점검 제출',
  [Permission.WITHDRAW_SELF_INSPECTION]: '자체점검 제출 취소',
  [Permission.APPROVE_SELF_INSPECTION]: '자체점검 승인',
  [Permission.REJECT_SELF_INSPECTION]: '자체점검 반려',
  [Permission.DELETE_SELF_INSPECTION]: '자체점검 삭제',

  [Permission.VIEW_FORM_TEMPLATES]: '양식 조회',
  [Permission.MANAGE_FORM_TEMPLATES]: '양식 관리',
  [Permission.DOWNLOAD_FORM_TEMPLATE_HISTORY]: '양식 개정 이력 다운로드',

  [Permission.SUBMIT_INTERMEDIATE_INSPECTION]: '중간점검 제출',
  [Permission.WITHDRAW_INTERMEDIATE_INSPECTION]: '중간점검 제출 취소',
  [Permission.REVIEW_INTERMEDIATE_INSPECTION]: '중간점검 검토',
  [Permission.APPROVE_INTERMEDIATE_INSPECTION]: '중간점검 승인',
  [Permission.REJECT_INTERMEDIATE_INSPECTION]: '중간점검 반려',
  [Permission.DELETE_INTERMEDIATE_INSPECTION]: '중간점검 삭제',

  [Permission.MANAGE_SYSTEM_SETTINGS]: '시스템 설정 관리',
  [Permission.PERFORM_DATA_MIGRATION]: '데이터 마이그레이션 실행',
  [Permission.VIEW_SYSTEM_SETTINGS]: '시스템 설정 조회',
};

/**
 * 권한 라벨 — 영어 (프론트엔드 en 로케일 렌더링)
 *
 * Record<Permission, string> 타입이 컴파일 타임에 완전성을 강제.
 * 새 Permission enum 값 추가 시 이 객체에 영어 라벨을 추가하지 않으면 tsc 에러 발생.
 */
export const PERMISSION_LABELS_EN: Record<Permission, string> = {
  [Permission.VIEW_EQUIPMENT]: 'View Equipment',
  [Permission.CREATE_EQUIPMENT]: 'Create Equipment',
  [Permission.UPDATE_EQUIPMENT]: 'Update Equipment',
  [Permission.DELETE_EQUIPMENT]: 'Delete Equipment',
  [Permission.APPROVE_EQUIPMENT]: 'Approve Equipment',
  [Permission.REJECT_EQUIPMENT]: 'Reject Equipment',
  [Permission.VIEW_EQUIPMENT_REQUESTS]: 'View Equipment Requests',

  [Permission.VIEW_CHECKOUTS]: 'View Checkouts',
  [Permission.CREATE_CHECKOUT]: 'Create Checkout',
  [Permission.UPDATE_CHECKOUT]: 'Update Checkout',
  [Permission.DELETE_CHECKOUT]: 'Delete Checkout',
  [Permission.APPROVE_CHECKOUT]: 'Approve Checkout',
  [Permission.REJECT_CHECKOUT]: 'Reject Checkout',
  [Permission.BORROWER_APPROVE_CHECKOUT]: 'Borrower Approve Checkout (Rental 1st)',
  [Permission.BORROWER_REJECT_CHECKOUT]: 'Borrower Reject Checkout (Rental 1st)',
  [Permission.START_CHECKOUT]: 'Start Checkout',
  [Permission.COMPLETE_CHECKOUT]: 'Complete Return',
  [Permission.CANCEL_CHECKOUT]: 'Cancel Checkout',

  [Permission.VIEW_CALIBRATIONS]: 'View Calibrations',
  [Permission.CREATE_CALIBRATION]: 'Create Calibration',
  [Permission.UPDATE_CALIBRATION]: 'Update Calibration',
  [Permission.DELETE_CALIBRATION]: 'Delete Calibration',
  [Permission.APPROVE_CALIBRATION]: 'Approve Calibration',
  [Permission.VIEW_CALIBRATION_REQUESTS]: 'View Calibration Requests',

  [Permission.VIEW_CALIBRATION_FACTORS]: 'View Calibration Factors',
  [Permission.CREATE_CALIBRATION_FACTOR]: 'Create Calibration Factor',
  [Permission.APPROVE_CALIBRATION_FACTOR]: 'Approve Calibration Factor',
  [Permission.VIEW_CALIBRATION_FACTOR_REQUESTS]: 'View Calibration Factor Requests',

  [Permission.VIEW_NON_CONFORMANCES]: 'View Non-Conformances',
  [Permission.CREATE_NON_CONFORMANCE]: 'Create Non-Conformance',
  [Permission.UPDATE_NON_CONFORMANCE]: 'Update Non-Conformance',
  [Permission.CLOSE_NON_CONFORMANCE]: 'Close Non-Conformance',
  [Permission.UPLOAD_NON_CONFORMANCE_ATTACHMENT]: 'Upload Non-Conformance Attachment',
  [Permission.DELETE_NON_CONFORMANCE_ATTACHMENT]: 'Delete Non-Conformance Attachment',

  [Permission.VIEW_TEST_SOFTWARE]: 'View Test Software',
  [Permission.CREATE_TEST_SOFTWARE]: 'Create Test Software',
  [Permission.UPDATE_TEST_SOFTWARE]: 'Update Test Software',
  [Permission.VIEW_SOFTWARE_VALIDATIONS]: 'View Software Validations',
  [Permission.CREATE_SOFTWARE_VALIDATION]: 'Create Software Validation',
  [Permission.SUBMIT_SOFTWARE_VALIDATION]: 'Submit Software Validation',
  [Permission.APPROVE_SOFTWARE_VALIDATION]: 'Approve Software Validation',
  [Permission.APPROVE_TECH_SOFTWARE_VALIDATION]: 'Approve Software Validation (Technical)',
  [Permission.APPROVE_QUALITY_SOFTWARE_VALIDATION]: 'Approve Software Validation (Quality)',
  [Permission.REVALIDATE_SOFTWARE_VALIDATION]: 'Request Software Re-validation',

  [Permission.VIEW_TEAMS]: 'View Teams',
  [Permission.CREATE_TEAMS]: 'Create Teams',
  [Permission.UPDATE_TEAMS]: 'Update Teams',
  [Permission.DELETE_TEAMS]: 'Delete Teams',

  [Permission.VIEW_USERS]: 'View Users',
  [Permission.UPDATE_USERS]: 'Update Users',
  [Permission.MANAGE_ROLES]: 'Manage Roles',

  [Permission.VIEW_NOTIFICATIONS]: 'View Notifications',
  [Permission.UPDATE_NOTIFICATION]: 'Update Notification',
  [Permission.DELETE_NOTIFICATION]: 'Delete Notification',
  [Permission.CREATE_SYSTEM_NOTIFICATION]: 'Create System Notification',

  [Permission.VIEW_STATISTICS]: 'View Statistics',
  [Permission.EXPORT_REPORTS]: 'Export Reports',

  [Permission.VIEW_CALIBRATION_PLANS]: 'View Calibration Plans',
  [Permission.CREATE_CALIBRATION_PLAN]: 'Create Calibration Plan',
  [Permission.UPDATE_CALIBRATION_PLAN]: 'Update Calibration Plan',
  [Permission.DELETE_CALIBRATION_PLAN]: 'Delete Calibration Plan',
  [Permission.SUBMIT_CALIBRATION_PLAN]: 'Submit Calibration Plan',
  [Permission.REVIEW_CALIBRATION_PLAN]: 'Review Calibration Plan',
  [Permission.APPROVE_CALIBRATION_PLAN]: 'Approve Calibration Plan',
  [Permission.REJECT_CALIBRATION_PLAN]: 'Reject Calibration Plan',
  [Permission.CONFIRM_CALIBRATION_PLAN_ITEM]: 'Confirm Calibration Plan Item',

  [Permission.VIEW_AUDIT_LOGS]: 'View Audit Logs',

  [Permission.REQUEST_DISPOSAL]: 'Request Disposal',
  [Permission.REVIEW_DISPOSAL]: 'Review Disposal',
  [Permission.APPROVE_DISPOSAL]: 'Approve Disposal',

  [Permission.VIEW_EQUIPMENT_IMPORTS]: 'View Equipment Imports',
  [Permission.CREATE_EQUIPMENT_IMPORT]: 'Create Equipment Import',
  [Permission.APPROVE_EQUIPMENT_IMPORT]: 'Approve Equipment Import',
  [Permission.COMPLETE_EQUIPMENT_IMPORT]: 'Complete Equipment Import',
  [Permission.CANCEL_EQUIPMENT_IMPORT]: 'Cancel Equipment Import',

  [Permission.VIEW_SELF_INSPECTIONS]: 'View Self Inspections',
  [Permission.SUBMIT_SELF_INSPECTION]: 'Submit Self Inspection',
  [Permission.WITHDRAW_SELF_INSPECTION]: 'Withdraw Self Inspection',
  [Permission.APPROVE_SELF_INSPECTION]: 'Approve Self Inspection',
  [Permission.REJECT_SELF_INSPECTION]: 'Reject Self Inspection',
  [Permission.DELETE_SELF_INSPECTION]: 'Delete Self Inspection',

  [Permission.VIEW_FORM_TEMPLATES]: 'View Form Templates',
  [Permission.MANAGE_FORM_TEMPLATES]: 'Manage Form Templates',
  [Permission.DOWNLOAD_FORM_TEMPLATE_HISTORY]: 'Download Form Template History',

  [Permission.SUBMIT_INTERMEDIATE_INSPECTION]: 'Submit Intermediate Inspection',
  [Permission.WITHDRAW_INTERMEDIATE_INSPECTION]: 'Withdraw Intermediate Inspection',
  [Permission.REVIEW_INTERMEDIATE_INSPECTION]: 'Review Intermediate Inspection',
  [Permission.APPROVE_INTERMEDIATE_INSPECTION]: 'Approve Intermediate Inspection',
  [Permission.REJECT_INTERMEDIATE_INSPECTION]: 'Reject Intermediate Inspection',
  [Permission.DELETE_INTERMEDIATE_INSPECTION]: 'Delete Intermediate Inspection',

  [Permission.MANAGE_SYSTEM_SETTINGS]: 'Manage System Settings',
  [Permission.VIEW_SYSTEM_SETTINGS]: 'View System Settings',
  [Permission.PERFORM_DATA_MIGRATION]: 'Perform Data Migration',
};

/**
 * 로케일별 권한 라벨 맵 — 프론트엔드 컴포넌트에서 직접 사용
 *
 * @example
 * const labels = PERMISSION_LABELS_LOCALIZED[locale] ?? PERMISSION_LABELS_LOCALIZED.ko;
 */
export const PERMISSION_LABELS_LOCALIZED: Record<string, Record<Permission, string>> = {
  ko: PERMISSION_LABELS,
  en: PERMISSION_LABELS_EN,
};
