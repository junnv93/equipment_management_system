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

import type { ApprovalCategory } from '@equipment-management/schemas';

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
    /**
     * @deprecated Use ADMIN.APPROVALS instead (통합 승인 페이지 사용)
     * Redirects to /admin/approvals?tab=checkout
     */
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
  // 부적합 관리
  // ============================================================================
  NON_CONFORMANCES: {
    LIST: '/non-conformances',
    DETAIL: (id: string) => `/non-conformances/${id}`,
  },

  // ============================================================================
  // 팀 관리
  // ============================================================================
  TEAMS: {
    LIST: '/teams',
    DETAIL: (id: string) => `/teams/${id}`,
    EDIT: (id: string) => `/teams/${id}/edit`,
  },

  // ============================================================================
  // 관리자
  // ============================================================================
  ADMIN: {
    APPROVALS: '/admin/approvals',
    AUDIT_LOGS: '/admin/audit-logs',
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
  // 장비 반입 관리 (렌탈 + 내부 공용, 반출입 관리 하위로 통합)
  // ============================================================================
  EQUIPMENT_IMPORTS: {
    LIST: '/checkouts?view=inbound',
    CREATE_RENTAL: '/checkouts/import/rental',
    CREATE_INTERNAL: '/checkouts/import/shared',
    DETAIL: (id: string) => `/checkouts/import/${id}`,
    RECEIVE: (id: string) => `/checkouts/import/${id}/receive`,
  },

  // ============================================================================
  // 설정
  // ============================================================================
  SETTINGS: {
    INDEX: '/settings',
    PROFILE: '/settings/profile',
    NOTIFICATIONS: '/settings/notifications',
    DISPLAY: '/settings/display',
    ADMIN_CALIBRATION: '/settings/admin/calibration',
    ADMIN_SYSTEM: '/settings/admin/system',
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

/**
 * 통합 승인 페이지 URL 생성
 *
 * ⚠️ SSOT: 승인 탭 딥링크 생성 시 이 함수를 사용
 * - FRONTEND_ROUTES.ADMIN.APPROVALS (경로)
 * - ApprovalCategory (탭 식별자, @equipment-management/schemas)
 * 두 SSOT를 조합하여 URL을 생성합니다.
 *
 * @example
 * getApprovalPageUrl('outgoing')     // → '/admin/approvals?tab=outgoing'
 * getApprovalPageUrl('disposal_final') // → '/admin/approvals?tab=disposal_final'
 */
export function getApprovalPageUrl(tab: ApprovalCategory): string {
  return `${FRONTEND_ROUTES.ADMIN.APPROVALS}?tab=${tab}`;
}
