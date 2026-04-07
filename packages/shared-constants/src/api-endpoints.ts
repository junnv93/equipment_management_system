/**
 * API 엔드포인트 상수
 *
 * ⚠️ SSOT: 이 파일이 API 경로의 단일 소스
 * 프론트엔드 API 클라이언트에서 import하여 사용
 *
 * 명명 규칙:
 * - 리소스별 그룹화 (EQUIPMENT, CHECKOUTS 등)
 * - 기본 CRUD: LIST, GET, CREATE, UPDATE, DELETE
 * - 특수 액션: APPROVE, REJECT, SUBMIT 등
 */

export const API_ENDPOINTS = {
  // ============================================================================
  // 장비 관리
  // ============================================================================
  EQUIPMENT: {
    LIST: '/api/equipment',
    GET: (id: string) => `/api/equipment/${id}`,
    CREATE: '/api/equipment',
    UPDATE: (id: string) => `/api/equipment/${id}`,
    DELETE: (id: string) => `/api/equipment/${id}`,
    /** 관리번호 중복 검사 - excludeId는 수정 시 현재 장비 ID */
    CHECK_MANAGEMENT_NUMBER: '/api/equipment/check-management-number',
    /** 장비 상태 변경 */
    STATUS: (id: string) => `/api/equipment/${id}/status`,
    /** 교정 예정 장비 조회 */
    CALIBRATION_DUE: '/api/equipment/calibration/due',
    /** 팀별 장비 조회 */
    TEAM: (teamId: string) => `/api/equipment/team/${teamId}`,
    /** 파일 첨부 */
    ATTACHMENTS: '/api/equipment/attachments',
    /** 이력카드 docx 내보내기 (UL-QP-18-02) */
    HISTORY_CARD: (id: string) => `/api/equipment/${id}/history-card`,
    // 위치 변동 이력
    LOCATION_HISTORY: {
      LIST: (id: string) => `/api/equipment/${id}/location-history`,
      CREATE: (id: string) => `/api/equipment/${id}/location-history`,
      DELETE: (historyId: string) => `/api/equipment/location-history/${historyId}`,
    },
    // 유지보수 내역
    MAINTENANCE_HISTORY: {
      LIST: (id: string) => `/api/equipment/${id}/maintenance-history`,
      CREATE: (id: string) => `/api/equipment/${id}/maintenance-history`,
      DELETE: (historyId: string) => `/api/equipment/maintenance-history/${historyId}`,
    },
    // 사고/손상 이력
    INCIDENT_HISTORY: {
      LIST: (id: string) => `/api/equipment/${id}/incident-history`,
      CREATE: (id: string) => `/api/equipment/${id}/incident-history`,
      DELETE: (historyId: string) => `/api/equipment/incident-history/${historyId}`,
    },
    // 장비 등록/수정/삭제 요청 승인
    REQUESTS: {
      LIST: '/api/equipment/requests',
      GET: (id: string) => `/api/equipment/requests/${id}`,
      PENDING: '/api/equipment/requests/pending',
      APPROVE: (id: string) => `/api/equipment/requests/${id}/approve`,
      REJECT: (id: string) => `/api/equipment/requests/${id}/reject`,
    },
    /** 장비별 반출 이력 */
    CHECKOUTS: (equipmentId: string) => `/api/equipment/${equipmentId}/checkouts`,
    // 수리 이력
    REPAIR_HISTORY: {
      LIST: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history`,
      CREATE: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history`,
      RECENT: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history/recent`,
      GET: (id: string) => `/api/repair-history/${id}`,
      UPDATE: (id: string) => `/api/repair-history/${id}`,
      DELETE: (id: string) => `/api/repair-history/${id}`,
    },
    // 장비 폐기
    DISPOSAL: {
      REQUEST: (equipmentId: string) => `/api/equipment/${equipmentId}/disposal/request`,
      REVIEW: (equipmentId: string) => `/api/equipment/${equipmentId}/disposal/review`,
      APPROVE: (equipmentId: string) => `/api/equipment/${equipmentId}/disposal/approve`,
      CANCEL: (equipmentId: string) => `/api/equipment/${equipmentId}/disposal/request`,
      CURRENT: (equipmentId: string) => `/api/equipment/${equipmentId}/disposal/current`,
      // 승인 대기 목록
      PENDING_REVIEW: '/api/disposal-requests/pending-review',
      PENDING_APPROVAL: '/api/disposal-requests/pending-approval',
    },
  },

  // ============================================================================
  // 반출 관리 (교정/수리/대여)
  // ============================================================================
  CHECKOUTS: {
    LIST: '/api/checkouts',
    GET: (id: string) => `/api/checkouts/${id}`,
    CREATE: '/api/checkouts',
    UPDATE: (id: string) => `/api/checkouts/${id}`,
    DELETE: (id: string) => `/api/checkouts/${id}`,
    APPROVE: (id: string) => `/api/checkouts/${id}/approve`,
    REJECT: (id: string) => `/api/checkouts/${id}/reject`,
    START: (id: string) => `/api/checkouts/${id}/start`,
    COMPLETE: (id: string) => `/api/checkouts/${id}/complete`,
    CANCEL: (id: string) => `/api/checkouts/${id}/cancel`,
    RETURN: (id: string) => `/api/checkouts/${id}/return`,
    APPROVE_RETURN: (id: string) => `/api/checkouts/${id}/approve-return`,
    REJECT_RETURN: (id: string) => `/api/checkouts/${id}/reject-return`,
    // 대여 목적 양측 확인 (상태 확인 기록)
    CONDITION_CHECK: (id: string) => `/api/checkouts/${id}/condition-check`,
    CONDITION_CHECKS: (id: string) => `/api/checkouts/${id}/condition-checks`,
    // 확인 필요 목록 조회
    PENDING_CHECKS: '/api/checkouts/pending-checks',
    // 반출지 목록 조회 (DB에서 실제 사용된 값들)
    DESTINATIONS: '/api/checkouts/destinations',
  },

  // ============================================================================
  // 교정 관리
  // ============================================================================
  CALIBRATIONS: {
    LIST: '/api/calibration',
    GET: (id: string) => `/api/calibration/${id}`,
    CREATE: '/api/calibration',
    UPDATE: (id: string) => `/api/calibration/${id}`,
    DELETE: (id: string) => `/api/calibration/${id}`,
    APPROVE: (id: string) => `/api/calibration/${id}/approve`,
    REJECT: (id: string) => `/api/calibration/${id}/reject`,
    PENDING: '/api/calibration/pending',
    SUMMARY: '/api/calibration/summary',
    OVERDUE: '/api/calibration/overdue',
    UPCOMING: (days?: number) => `/api/calibration/upcoming${days ? `?days=${days}` : ''}`,
    HISTORY: (equipmentId: string) => `/api/calibration/equipment/${equipmentId}`,
    HISTORY_LIST: '/api/calibration',
    INTERMEDIATE_CHECKS: {
      ALL: '/api/calibration/intermediate-checks/all',
      LIST: (days?: number) => `/api/calibration/intermediate-checks${days ? `?days=${days}` : ''}`,
      COMPLETE: (id: string) => `/api/calibration/${id}/intermediate-check/complete`,
    },
    /** @deprecated DOCUMENTS(id)를 사용하세요 */
    CERTIFICATE: (id: string) => `/api/calibration/${id}/certificate`,
    /** 교정별 문서 목록 (성적서 + 원시데이터 등) */
    DOCUMENTS: (id: string) => `/api/calibration/${id}/documents`,
  },

  // ============================================================================
  // 문서 관리 (통합)
  // ============================================================================
  DOCUMENTS: {
    BASE: '/api/documents',
    UPLOAD: '/api/documents',
    DETAIL: (id: string) => `/api/documents/${id}`,
    DOWNLOAD: (id: string) => `/api/documents/${id}/download`,
    VERIFY: (id: string) => `/api/documents/${id}/verify`,
    REVISIONS: (id: string) => `/api/documents/${id}/revisions`,
  },

  // ============================================================================
  // 교정계획서 관리
  // ============================================================================
  CALIBRATION_PLANS: {
    LIST: '/api/calibration-plans',
    GET: (id: string) => `/api/calibration-plans/${id}`,
    CREATE: '/api/calibration-plans',
    UPDATE: (id: string) => `/api/calibration-plans/${id}`,
    DELETE: (id: string) => `/api/calibration-plans/${id}`,
    SUBMIT: (id: string) => `/api/calibration-plans/${id}/submit`,
    SUBMIT_FOR_REVIEW: (id: string) => `/api/calibration-plans/${id}/submit-for-review`,
    REVIEW: (id: string) => `/api/calibration-plans/${id}/review`,
    APPROVE: (id: string) => `/api/calibration-plans/${id}/approve`,
    REJECT: (id: string) => `/api/calibration-plans/${id}/reject`,
    ITEMS: (id: string) => `/api/calibration-plans/${id}/items`,
    CONFIRM_ITEM: (planId: string, itemId: string) =>
      `/api/calibration-plans/${planId}/items/${itemId}/confirm`,
    UPDATE_ITEM: (planId: string, itemId: string) =>
      `/api/calibration-plans/${planId}/items/${itemId}`,
    NEW_VERSION: (id: string) => `/api/calibration-plans/${id}/new-version`,
    VERSION_HISTORY: (id: string) => `/api/calibration-plans/${id}/versions`,
    EXPORT: (id: string) => `/api/calibration-plans/${id}/export`,
    EXTERNAL_EQUIPMENT: '/api/calibration-plans/equipment/external',
    PENDING_REVIEW: '/api/calibration-plans?status=pending_review',
    PENDING_APPROVAL: '/api/calibration-plans?status=pending_approval',
    VERSIONS: (year?: number, siteId?: string) =>
      `/api/calibration-plans/versions${year || siteId ? '?' : ''}${year ? `year=${year}` : ''}${year && siteId ? '&' : ''}${siteId ? `siteId=${siteId}` : ''}`,
  },

  // ============================================================================
  // 보정계수 관리
  // ============================================================================
  CALIBRATION_FACTORS: {
    LIST: '/api/calibration-factors',
    GET: (id: string) => `/api/calibration-factors/${id}`,
    CREATE: '/api/calibration-factors',
    UPDATE: (id: string) => `/api/calibration-factors/${id}`,
    DELETE: (id: string) => `/api/calibration-factors/${id}`,
    APPROVE: (id: string) => `/api/calibration-factors/${id}/approve`,
    REJECT: (id: string) => `/api/calibration-factors/${id}/reject`,
    PENDING: '/api/calibration-factors/pending',
    EQUIPMENT: (equipmentId: string) => `/api/calibration-factors/equipment/${equipmentId}`,
    REGISTRY: '/api/calibration-factors/registry',
  },

  // ============================================================================
  // 부적합 관리
  // ============================================================================
  NON_CONFORMANCES: {
    LIST: '/api/non-conformances',
    GET: (id: string) => `/api/non-conformances/${id}`,
    CREATE: '/api/non-conformances',
    UPDATE: (id: string) => `/api/non-conformances/${id}`,
    DELETE: (id: string) => `/api/non-conformances/${id}`,
    CLOSE: (id: string) => `/api/non-conformances/${id}/close`,
    REJECT_CORRECTION: (id: string) => `/api/non-conformances/${id}/reject-correction`,
    EQUIPMENT: (equipmentId: string) => `/api/non-conformances/equipment/${equipmentId}`,
  },

  // ============================================================================
  // 시험용 소프트웨어 관리 (UL-QP-18-07)
  // ============================================================================
  TEST_SOFTWARE: {
    LIST: '/api/test-software',
    GET: (id: string) => `/api/test-software/${id}`,
    CREATE: '/api/test-software',
    UPDATE: (id: string) => `/api/test-software/${id}`,
    TOGGLE_AVAILABILITY: (id: string) => `/api/test-software/${id}/availability`,
    BY_EQUIPMENT: (equipmentId: string) => `/api/test-software/by-equipment/${equipmentId}`,
    LINKED_EQUIPMENT: (id: string) => `/api/test-software/${id}/equipment`,
    LINK_EQUIPMENT: (id: string) => `/api/test-software/${id}/equipment`,
    UNLINK_EQUIPMENT: (id: string, equipmentId: string) =>
      `/api/test-software/${id}/equipment/${equipmentId}`,
  },

  // ============================================================================
  // 소프트웨어 유효성 확인 (UL-QP-18-09)
  // ============================================================================
  SOFTWARE_VALIDATIONS: {
    LIST: (softwareId: string) => `/api/test-software/${softwareId}/validations`,
    GET: (id: string) => `/api/software-validations/${id}`,
    CREATE: (softwareId: string) => `/api/test-software/${softwareId}/validations`,
    UPDATE: (id: string) => `/api/software-validations/${id}`,
    SUBMIT: (id: string) => `/api/software-validations/${id}/submit`,
    APPROVE: (id: string) => `/api/software-validations/${id}/approve`,
    QUALITY_APPROVE: (id: string) => `/api/software-validations/${id}/quality-approve`,
    REJECT: (id: string) => `/api/software-validations/${id}/reject`,
    REVISE: (id: string) => `/api/software-validations/${id}/revise`,
    PENDING: '/api/software-validations/pending',
  },

  // ============================================================================
  // 사용자 관리
  // ============================================================================
  USERS: {
    LIST: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    CREATE: '/api/users',
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
    ME: '/api/users/me',
    PREFERENCES: '/api/users/me/preferences',
    CHANGE_ROLE: (id: string) => `/api/users/${id}/change-role`,
    ACTIVATE: (id: string) => `/api/users/${id}/activate`,
    DEACTIVATE: (id: string) => `/api/users/${id}/deactivate`,
    PERMISSIONS: (id: string) => `/api/users/${id}/permissions`,
    /** 전자서명 업로드/삭제 */
    SIGNATURE: '/api/users/me/signature',
    /** NextAuth 로그인 시 사용자 동기화 (Internal API Key) */
    SYNC: '/api/users/sync',
  },

  // ============================================================================
  // 시스템 설정
  // ============================================================================
  SETTINGS: {
    CALIBRATION: '/api/settings/calibration',
    SYSTEM: '/api/settings/system',
  },

  // ============================================================================
  // 팀 관리
  // ============================================================================
  TEAMS: {
    LIST: '/api/teams',
    GET: (id: string) => `/api/teams/${id}`,
    CREATE: '/api/teams',
    UPDATE: (id: string) => `/api/teams/${id}`,
    DELETE: (id: string) => `/api/teams/${id}`,
  },

  // ============================================================================
  // 알림 관리
  // ============================================================================
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    GET: (id: string) => `/api/notifications/${id}`,
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (id: string) => `/api/notifications/${id}`,
    SETTINGS: '/api/notifications/settings',
    STREAM: '/api/notifications/stream',
    ADMIN: '/api/notifications/admin',
    TRIGGER_OVERDUE_CHECK: '/api/notifications/trigger-overdue-check',
    TRIGGER_CHECKOUT_OVERDUE_CHECK: '/api/notifications/trigger-checkout-overdue-check',
  },

  // ============================================================================
  // 모니터링
  // ============================================================================
  MONITORING: {
    HEALTH: '/api/monitoring/health',
    METRICS: '/api/monitoring/metrics',
    DIAGNOSTICS: '/api/monitoring/diagnostics',
    STATUS: '/api/monitoring/status',
    HTTP_STATS: '/api/monitoring/http-stats',
    CACHE_STATS: '/api/monitoring/cache-stats',
  },

  // ============================================================================
  // 대시보드
  // ============================================================================
  DASHBOARD: {
    AGGREGATE: '/api/dashboard/aggregate',
    SUMMARY: '/api/dashboard/summary',
    EQUIPMENT_BY_TEAM: '/api/dashboard/equipment-by-team',
    EQUIPMENT_STATUS_STATS: '/api/dashboard/equipment-status-stats',
    OVERDUE_CALIBRATIONS: '/api/dashboard/overdue-calibrations',
    UPCOMING_CALIBRATIONS: '/api/dashboard/upcoming-calibrations',
    OVERDUE_RENTALS: '/api/dashboard/overdue-rentals',
    RECENT_ACTIVITIES: '/api/dashboard/recent-activities',
    PENDING_APPROVAL_COUNTS: '/api/dashboard/pending-approval-counts',
  },

  // ============================================================================
  // 인증
  // ============================================================================
  AUTH: {
    LOGIN: '/api/auth/callback/credentials',
    LOGOUT: '/api/auth/signout',
    SESSION: '/api/auth/session',
    CSRF: '/api/auth/csrf',
    REFRESH: '/api/auth/refresh',
  },

  // ============================================================================
  // 감사 로그
  // ============================================================================
  AUDIT_LOGS: {
    LIST: '/api/audit-logs',
    GET: (id: string) => `/api/audit-logs/${id}`,
    BY_ENTITY: (entityType: string, entityId: string) =>
      `/api/audit-logs/entity/${entityType}/${entityId}`,
    BY_USER: (userId: string) => `/api/audit-logs/user/${userId}`,
    /** 파일 내보내기 (excel/csv/pdf) — RBAC 스코프 자동 적용 */
    EXPORT: '/api/reports/export/audit-logs',
  },

  // ============================================================================
  // 장비 반입 관리 (렌탈 + 내부 공용 통합)
  // ============================================================================
  EQUIPMENT_IMPORTS: {
    LIST: '/api/equipment-imports',
    GET: (id: string) => `/api/equipment-imports/${id}`,
    CREATE: '/api/equipment-imports',
    APPROVE: (id: string) => `/api/equipment-imports/${id}/approve`,
    REJECT: (id: string) => `/api/equipment-imports/${id}/reject`,
    RECEIVE: (id: string) => `/api/equipment-imports/${id}/receive`,
    INITIATE_RETURN: (id: string) => `/api/equipment-imports/${id}/initiate-return`,
    CANCEL: (id: string) => `/api/equipment-imports/${id}/cancel`,
  },

  // ============================================================================
  // 승인 관리 통합 API
  // ============================================================================
  /**
   * 통합 승인 카운트 API
   *
   * 모든 승인 카테고리의 대기 개수를 한 번에 조회
   * 기존 13개 별도 API 호출을 1개로 통합하여 성능 향상
   */
  APPROVALS: {
    COUNTS: '/api/approvals/counts',
    KPI: '/api/approvals/kpi',
    STREAM: '/api/approvals/stream',
  },

  // ============================================================================
  // 보고서 관리
  // ============================================================================
  REPORTS: {
    EQUIPMENT_USAGE: '/api/reports/equipment-usage',
    CALIBRATION_STATUS: '/api/reports/calibration-status',
    RENTAL_STATISTICS: '/api/reports/rental-statistics',
    UTILIZATION_RATE: '/api/reports/utilization-rate',
    EQUIPMENT_DOWNTIME: '/api/reports/equipment-downtime',
    EXPORT: {
      EQUIPMENT_USAGE: '/api/reports/export/equipment-usage',
      EQUIPMENT_INVENTORY: '/api/reports/export/equipment-inventory',
      CALIBRATION_STATUS: '/api/reports/export/calibration-status',
      UTILIZATION: '/api/reports/export/utilization',
      TEAM_EQUIPMENT: '/api/reports/export/team-equipment',
      MAINTENANCE: '/api/reports/export/maintenance',
      /** 공식 양식 템플릿 내보내기 (UL-QP-18-01 ~ 11) */
      FORM_TEMPLATE: (formNumber: string) => `/api/reports/export/form/${formNumber}`,
    },
  },

  // ============================================================================
  // 데이터 마이그레이션 (Excel → DB 일괄 가져오기)
  // ============================================================================
  DATA_MIGRATION: {
    EQUIPMENT: {
      PREVIEW: '/api/data-migration/equipment/preview',
      EXECUTE: '/api/data-migration/equipment/execute',
      ERROR_REPORT: (sessionId: string) =>
        `/api/data-migration/equipment/${sessionId}/error-report`,
      TEMPLATE: '/api/data-migration/equipment/template',
    },
  },

  // ============================================================================
  // 자체점검 관리 (UL-QP-18-05)
  // ============================================================================
  SELF_INSPECTIONS: {
    BY_EQUIPMENT: (equipmentId: string) => `/api/equipment/${equipmentId}/self-inspections`,
    GET: (id: string) => `/api/self-inspections/${id}`,
    UPDATE: (id: string) => `/api/self-inspections/${id}`,
    CONFIRM: (id: string) => `/api/self-inspections/${id}/confirm`,
    DELETE: (id: string) => `/api/self-inspections/${id}`,
  },

  // ============================================================================
  // 케이블/경로손실 관리 (UL-QP-18-08)
  // ============================================================================
  CABLES: {
    LIST: '/api/cables',
    GET: (id: string) => `/api/cables/${id}`,
    CREATE: '/api/cables',
    UPDATE: (id: string) => `/api/cables/${id}`,
    MEASUREMENTS: {
      LIST: (cableId: string) => `/api/cables/${cableId}/measurements`,
      CREATE: (cableId: string) => `/api/cables/${cableId}/measurements`,
      GET: (measurementId: string) => `/api/cables/measurements/${measurementId}`,
    },
  },

  // ============================================================================
  // 중간점검 관리
  // ============================================================================
  INTERMEDIATE_INSPECTIONS: {
    BY_EQUIPMENT: (equipmentId: string) => `/api/equipment/${equipmentId}/intermediate-inspections`,
    BY_CALIBRATION: (calibrationId: string) =>
      `/api/calibration/${calibrationId}/intermediate-inspections`,
    GET: (id: string) => `/api/intermediate-inspections/${id}`,
    UPDATE: (id: string) => `/api/intermediate-inspections/${id}`,
    SUBMIT: (id: string) => `/api/intermediate-inspections/${id}/submit`,
    REVIEW: (id: string) => `/api/intermediate-inspections/${id}/review`,
    APPROVE: (id: string) => `/api/intermediate-inspections/${id}/approve`,
    REJECT: (id: string) => `/api/intermediate-inspections/${id}/reject`,
  },

  // ============================================================================
  // 양식 템플릿 관리
  // ============================================================================
  FORM_TEMPLATES: {
    LIST: '/api/form-templates',
    /** row ID로 다운로드 (현행/과거 공통). 과거 row는 DOWNLOAD_FORM_TEMPLATE_HISTORY 권한 필요 */
    DOWNLOAD_BY_ID: (id: string) => `/api/form-templates/${id}/download`,
    /** 양식명 기준 개정 이력 조회 */
    HISTORY_BY_NAME: '/api/form-templates/history',
    /** 과거 formNumber로 검색 */
    SEARCH_BY_NUMBER: '/api/form-templates/search',
    /**
     * 양식 템플릿 버전 생성 (최초 등록 + 개정 공통).
     * 서비스가 기존 현행 row 존재 여부로 자동 분기:
     * - 없으면: 단순 INSERT (최초 등록)
     * - 있으면: 이전 row supersede + INSERT (개정)
     */
    CREATE: '/api/form-templates',
    /** 동일 formNumber 파일 교체 (이력 보존 없음) */
    REPLACE: '/api/form-templates/replace',
  },

  // ============================================================================
  // DEPRECATED: Legacy rental imports (proxy to EQUIPMENT_IMPORTS)
  // ============================================================================
  /**
   * @deprecated Use EQUIPMENT_IMPORTS instead
   * Legacy endpoints for backward compatibility
   */
  RENTAL_IMPORTS: {
    LIST: '/api/equipment-imports?sourceType=rental',
    GET: (id: string) => `/api/equipment-imports/${id}`,
    CREATE: '/api/equipment-imports',
    APPROVE: (id: string) => `/api/equipment-imports/${id}/approve`,
    REJECT: (id: string) => `/api/equipment-imports/${id}/reject`,
    RECEIVE: (id: string) => `/api/equipment-imports/${id}/receive`,
    INITIATE_RETURN: (id: string) => `/api/equipment-imports/${id}/initiate-return`,
    CANCEL: (id: string) => `/api/equipment-imports/${id}/cancel`,
  },
} as const;

/**
 * API 엔드포인트 타입 (IDE 자동완성용)
 */
export type ApiEndpoints = typeof API_ENDPOINTS;
