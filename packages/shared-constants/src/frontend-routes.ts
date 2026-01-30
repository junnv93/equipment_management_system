/**
 * 프론트엔드 라우트 상수
 *
 * ⚠️ SSOT: 이 파일이 프론트엔드 경로의 단일 소스
 * 네비게이션, 리다이렉트, 링크에서 import하여 사용
 *
 * 명명 규칙:
 * - 리소스별 그룹화 (EQUIPMENT, CHECKOUTS 등)
 * - 기본 라우트: LIST, CREATE, DETAIL, EDIT
 * - 특수 페이지: MANAGE, PENDING_CHECKS 등
 */

export const FRONTEND_ROUTES = {
  // ============================================================================
  // 대시보드
  // ============================================================================
  DASHBOARD: '/',

  // ============================================================================
  // 장비 관리
  // ============================================================================
  EQUIPMENT: {
    LIST: '/equipment',
    CREATE: '/equipment/create',
    DETAIL: (id: string) => `/equipment/${id}`,
    EDIT: (id: string) => `/equipment/${id}/edit`,
  },

  // ============================================================================
  // 반출 관리 (교정/수리/대여)
  // ============================================================================
  CHECKOUTS: {
    LIST: '/checkouts',
    CREATE: '/checkouts/create',
    MANAGE: '/checkouts/manage',
    DETAIL: (id: string) => `/checkouts/${id}`,
    CHECK: (id: string) => `/checkouts/${id}/check`,
    RETURN: (id: string) => `/checkouts/${id}/return`,
    PENDING_CHECKS: '/checkouts/pending-checks',
  },

  // ============================================================================
  // 교정 관리
  // ============================================================================
  CALIBRATION: {
    LIST: '/calibration',
    REGISTER: '/calibration/register',
    DETAIL: (id: string) => `/calibration/${id}`,
  },

  // ============================================================================
  // 교정계획서 관리
  // ============================================================================
  CALIBRATION_PLANS: {
    LIST: '/calibration-plans',
    CREATE: '/calibration-plans/create',
    DETAIL: (id: string) => `/calibration-plans/${id}`,
    EDIT: (id: string) => `/calibration-plans/${id}/edit`,
  },

  // ============================================================================
  // 관리자
  // ============================================================================
  ADMIN: {
    EQUIPMENT_APPROVALS: '/admin/equipment-approvals',
    APPROVALS: '/admin/approvals',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings',
  },

  // ============================================================================
  // 알림
  // ============================================================================
  NOTIFICATIONS: {
    LIST: '/notifications',
    SETTINGS: '/notifications/settings',
  },

  // ============================================================================
  // 인증
  // ============================================================================
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
  },
} as const;

/**
 * 프론트엔드 라우트 타입 (IDE 자동완성용)
 */
export type FrontendRoutes = typeof FRONTEND_ROUTES;
