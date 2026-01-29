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
    HISTORY: (id: string) => `/api/equipment/${id}/history`,
    NON_CONFORMANCE: (id: string) => `/api/equipment/${id}/non-conformance`,
    CALIBRATION_HISTORY: (id: string) => `/api/equipment/${id}/calibration-history`,
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
  },

  // ============================================================================
  // 교정 관리
  // ============================================================================
  CALIBRATIONS: {
    LIST: '/api/calibrations',
    GET: (id: string) => `/api/calibrations/${id}`,
    CREATE: '/api/calibrations',
    UPDATE: (id: string) => `/api/calibrations/${id}`,
    DELETE: (id: string) => `/api/calibrations/${id}`,
    APPROVE: (id: string) => `/api/calibrations/${id}/approve`,
    REJECT: (id: string) => `/api/calibrations/${id}/reject`,
    PENDING: '/api/calibrations/pending',
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
    APPROVE: (id: string) => `/api/calibration-plans/${id}/approve`,
    REJECT: (id: string) => `/api/calibration-plans/${id}/reject`,
    ITEMS: (id: string) => `/api/calibration-plans/${id}/items`,
    CONFIRM_ITEM: (planId: string, itemId: string) =>
      `/api/calibration-plans/${planId}/items/${itemId}/confirm`,
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
  },

  // ============================================================================
  // 부적합 관리
  // ============================================================================
  NON_CONFORMANCES: {
    LIST: '/api/non-conformances',
    GET: (id: string) => `/api/non-conformances/${id}`,
    CREATE: '/api/non-conformances',
    UPDATE: (id: string) => `/api/non-conformances/${id}`,
    CLOSE: (id: string) => `/api/non-conformances/${id}/close`,
    PENDING: '/api/non-conformances/pending',
  },

  // ============================================================================
  // 소프트웨어 관리
  // ============================================================================
  SOFTWARE: {
    LIST: '/api/software',
    GET: (id: string) => `/api/software/${id}`,
    CREATE: '/api/software',
    UPDATE: (id: string) => `/api/software/${id}`,
    DELETE: (id: string) => `/api/software/${id}`,
    CHANGES: {
      LIST: '/api/software-changes',
      GET: (id: string) => `/api/software-changes/${id}`,
      CREATE: '/api/software-changes',
      APPROVE: (id: string) => `/api/software-changes/${id}/approve`,
      REJECT: (id: string) => `/api/software-changes/${id}/reject`,
      PENDING: '/api/software-changes/pending',
    },
  },

  // ============================================================================
  // 사용자 관리
  // ============================================================================
  USERS: {
    LIST: '/api/users',
    GET: (id: string) => `/api/users/${id}`,
    ME: '/api/users/me',
    UPDATE: (id: string) => `/api/users/${id}`,
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
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    DELETE: (id: string) => `/api/notifications/${id}`,
    SETTINGS: '/api/notifications/settings',
  },

  // ============================================================================
  // 대시보드
  // ============================================================================
  DASHBOARD: {
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
  },

  // ============================================================================
  // 감사 로그
  // ============================================================================
  AUDIT_LOGS: {
    LIST: '/api/audit-logs',
    GET: (id: string) => `/api/audit-logs/${id}`,
  },
} as const;

/**
 * API 엔드포인트 타입 (IDE 자동완성용)
 */
export type ApiEndpoints = typeof API_ENDPOINTS;
