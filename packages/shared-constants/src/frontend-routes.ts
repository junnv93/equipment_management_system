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

/**
 * 범용 Intent URL 쿼리 파라미터 상수 — SSOT.
 *
 * 특정 UI 상태(생성 폼 오픈, 상세 모달 오픈 등)를 URL에 표현하여 딥링크 공유·브라우저
 * 히스토리·진입점 통합을 가능하게 한다. Linear/Notion/GitHub이 채택한 패턴.
 *
 * 사용처:
 * - `FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES_CREATE(id)` 빌더
 * - 진입 페이지에서 `useSearchParams().get(QUERY_INTENTS.ACTION) === QUERY_INTENTS.ACTIONS.CREATE` 감지
 *
 * 새 intent 추가 시 `ACTIONS`에 값만 추가 — 리터럴 문자열 하드코딩 금지.
 */
export const QUERY_INTENTS = {
  ACTION: 'action',
  ACTIONS: {
    CREATE: 'create',
  },
} as const;

/**
 * 반출(checkout) 목록 페이지의 URL 쿼리 파라미터 상수.
 *
 * 내 반출/활성 필터 등 목록 뷰 상태를 딥링크로 공유하기 위한 SSOT.
 * `FRONTEND_ROUTES.CHECKOUTS.LIST_MINE_ACTIVE` 빌더가 조합.
 */
export const CHECKOUT_QUERY_PARAMS = {
  SCOPE: 'scope',
  VIEW: 'view',
  EQUIPMENT_ID: 'equipmentId',
  SCOPE_VALUES: {
    MINE: 'mine',
  },
  VIEW_VALUES: {
    ACTIVE: 'active',
  },
} as const;

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
    /**
     * 관리번호 기반 모바일 QR 랜딩 (Phase 1).
     * 경로 prefix(`/e/`)는 `EQUIPMENT_QR_PATH_PREFIX` in `qr-url.ts`와 일치해야 함 — 변경 시 동반 수정.
     */
    BY_MGMT: (mgmt: string) => `/e/${encodeURIComponent(mgmt)}`,
    /** 장비별 부적합 관리 페이지 (목록 + 인라인 생성 폼). */
    NON_CONFORMANCES: (id: string) => `/equipment/${id}/non-conformance`,
    /**
     * 장비별 부적합 생성 딥링크. `?action=create` 파라미터가 생성 폼을 자동 오픈.
     * 사용: QR 모바일 랜딩, 이메일 알림, 대시보드 quick action 등 모든 진입점 공유.
     */
    NON_CONFORMANCES_CREATE: (id: string) =>
      `/equipment/${id}/non-conformance?${QUERY_INTENTS.ACTION}=${QUERY_INTENTS.ACTIONS.CREATE}`,
  },

  /**
   * QR 스캐너 페이지 (Phase 2에서 구현).
   * Phase 1에서 SSOT 사전 등록 — 후속 Phase의 merge churn 감소 목적.
   */
  SCAN: '/scan',

  /**
   * 인수인계 QR 확인 페이지 (Phase 3, 서명 토큰 기반).
   * 토큰은 URL param이 아닌 query string(`?token=...`)으로 전달.
   */
  HANDOVER: (token?: string) =>
    token ? `/handover?token=${encodeURIComponent(token)}` : '/handover',

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
    /**
     * "내가 현재 반출 중인 장비" 딥링크. QR 랜딩의 `mark_checkout_returned` CTA,
     * 대시보드 "내 반출" 빠른 이동 등 공유.
     *
     * @param equipmentId 선택적. 특정 장비로 필터링 (QR 진입 시 해당 장비 하이라이트).
     */
    LIST_MINE_ACTIVE: (equipmentId?: string) => {
      const params = new URLSearchParams({
        [CHECKOUT_QUERY_PARAMS.SCOPE]: CHECKOUT_QUERY_PARAMS.SCOPE_VALUES.MINE,
        [CHECKOUT_QUERY_PARAMS.VIEW]: CHECKOUT_QUERY_PARAMS.VIEW_VALUES.ACTIVE,
      });
      if (equipmentId) params.set(CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID, equipmentId);
      return `/checkouts?${params.toString()}`;
    },
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
  // 시험용 소프트웨어 관리 (UL-QP-18-07)
  // ============================================================================
  SOFTWARE: {
    LIST: '/software',
    CREATE: '/software/create',
    DETAIL: (id: string) => `/software/${id}`,
    VALIDATION: (id: string) => `/software/${id}/validation`,
    VALIDATION_DETAIL: (softwareId: string, validationId: string) =>
      `/software/${softwareId}/validation/${validationId}`,
  },

  // ============================================================================
  // 케이블/경로손실 관리 (UL-QP-18-08)
  // ============================================================================
  CABLES: {
    LIST: '/cables',
    CREATE: '/cables/create',
    DETAIL: (id: string) => `/cables/${id}`,
  },

  // ============================================================================
  // 양식 관리 (UL-QP-18 양식 템플릿)
  // ============================================================================
  FORM_TEMPLATES: '/form-templates',

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
    DATA_MIGRATION: '/admin/data-migration',
    MONITORING: '/admin/monitoring',
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
