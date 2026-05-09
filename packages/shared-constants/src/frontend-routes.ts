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

import type {
  ApprovalCategory,
  UserSelectableCheckoutPurpose,
} from '@equipment-management/schemas';

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
  PURPOSE: 'purpose',
  SCOPE_VALUES: {
    MINE: 'mine',
  },
  VIEW_VALUES: {
    ACTIVE: 'active',
    YOUR_TURN: 'yourTurn',
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
     * 장비별 교정 이력 sub-route — `CalibrationHistoryTab` 재사용 + deep-link 진입점.
     * 메인 `/calibration?equipmentId=...` 보완 (좁은 컨텍스트로 단일 장비 교정만 노출).
     */
    CALIBRATION_HISTORY: (id: string) => `/equipment/${id}/calibration-history`,
    /**
     * 장비별 수리(유지보수) 이력 sub-route — `RepairHistoryClient` full page 진입점.
     * `MaintenanceHistoryTab` footer "전체 보기" 링크가 본 빌더로 navigate.
     */
    REPAIR_HISTORY: (id: string) => `/equipment/${id}/repair-history`,
    /**
     * 장비별 보정계수 sub-route — `CalibrationFactorsClient` full page 진입점.
     * `CalibrationFactorsTab` footer "전체 보기" 링크가 본 빌더로 navigate.
     */
    CALIBRATION_FACTORS: (id: string) => `/equipment/${id}/calibration-factors`,
    /**
     * 장비별 부적합 생성 딥링크. `?action=create` 파라미터가 생성 폼을 자동 오픈.
     * 사용: QR 모바일 랜딩, 이메일 알림, 대시보드 quick action 등 모든 진입점 공유.
     */
    NON_CONFORMANCES_CREATE: (id: string) =>
      `/equipment/${id}/non-conformance?${QUERY_INTENTS.ACTION}=${QUERY_INTENTS.ACTIONS.CREATE}`,
    /**
     * 장비별 자체점검 생성 딥링크. `?action=create` 파라미터가 점검 등록 다이얼로그를 자동 오픈.
     * 장비 상세 탭 내 인라인 폼 — 전용 서브라우트 없음.
     */
    SELF_INSPECTION_CREATE: (id: string) =>
      `/equipment/${id}?${QUERY_INTENTS.ACTION}=${QUERY_INTENTS.ACTIONS.CREATE}&intent=self_inspection`,
    /**
     * 장비별 중간점검 생성 딥링크. `?action=create` 파라미터가 점검 등록 다이얼로그를 자동 오픈.
     * 장비 상세 탭 내 인라인 폼 — 전용 서브라우트 없음.
     */
    INTERMEDIATE_INSPECTION_CREATE: (id: string) =>
      `/equipment/${id}?${QUERY_INTENTS.ACTION}=${QUERY_INTENTS.ACTIONS.CREATE}&intent=intermediate_inspection`,
    /**
     * 장비 요청(폐기/수리/이전) 생성 딥링크. `?action=create` 파라미터가 요청 폼을 자동 오픈.
     * 장비 상세 탭 내 인라인 폼 — 전용 서브라우트 없음.
     */
    EQUIPMENT_REQUEST_CREATE: (id: string) =>
      `/equipment/${id}?${QUERY_INTENTS.ACTION}=${QUERY_INTENTS.ACTIONS.CREATE}&intent=equipment_request`,
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
    /**
     * QR 핸드오버 스캔 후 condition-check 페이지 + step 자동 prefill 딥링크.
     * `/handover?token=...` verify 성공 후 redirect 시 사용.
     *
     * @param step HandoverTokenPurpose — 'borrower_receive' | 'borrower_return' | 'lender_receive'
     */
    CHECK_WITH_STEP: (id: string, step: string) =>
      `/checkouts/${id}/check?step=${encodeURIComponent(step)}`,
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
    /**
     * 반출 신청 생성 딥링크 — 특정 장비를 프리셀렉션한 채로 /checkouts/create 진입.
     * QR 랜딩의 `request_checkout` CTA, 장비 상세 "반출 신청" 버튼 등 모든 진입점 공유.
     *
     * `CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID` 파라미터를 `CreateCheckoutContent`가 읽어 자동 선택.
     * `options.purpose` 를 지정하면 `CHECKOUT_QUERY_PARAMS.PURPOSE` 파라미터도 포함.
     *
     * @example
     * CREATE_FOR_EQUIPMENT('uuid-123')                          // ?equipmentId=uuid-123
     * CREATE_FOR_EQUIPMENT('uuid-123', { purpose: 'rental' })   // ?equipmentId=uuid-123&purpose=rental
     */
    CREATE_FOR_EQUIPMENT: (
      equipmentId: string,
      options?: { purpose?: UserSelectableCheckoutPurpose }
    ) => {
      const params = new URLSearchParams({
        [CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID]: equipmentId,
      });
      if (options?.purpose) {
        params.set(CHECKOUT_QUERY_PARAMS.PURPOSE, options.purpose);
      }
      return `/checkouts/create?${params.toString()}`;
    },
  },

  // ============================================================================
  // 교정 관리
  // ============================================================================
  CALIBRATION: {
    LIST: '/calibration',
    REGISTER: '/calibration/register',
    DETAIL: (id: string) => `/calibration/${id}`,
    /** 특정 장비의 교정 이력 deep-link (CalibrationListTable row 클릭 진입점) */
    BY_EQUIPMENT: (equipmentId: string) =>
      `/calibration?equipmentId=${encodeURIComponent(equipmentId)}`,
  },

  // ============================================================================
  // 교정계획서 관리
  // ============================================================================
  CALIBRATION_PLANS: {
    LIST: '/calibration-plans',
    CREATE: '/calibration-plans/create',
    DETAIL: (id: string) => `/calibration-plans/${id}`,
    EDIT: (id: string) => `/calibration-plans/${id}/edit`,
    /**
     * 교정계획 생성 딥링크 — 특정 장비를 사전 선택한 채로 /calibration-plans/create 진입.
     * QR 랜딩 및 장비 상세 "교정계획 등록" CTA 공유.
     */
    CREATE_FOR_EQUIPMENT: (equipmentId: string) =>
      `/calibration-plans/create?${QUERY_INTENTS.ACTION}=${QUERY_INTENTS.ACTIONS.CREATE}&equipmentId=${encodeURIComponent(equipmentId)}`,
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
  // 소프트웨어 유효성 확인 글로벌 뷰 (UL-QP-18-09)
  // 개별 소프트웨어와 무관하게 모든 유효성 확인 레코드를 조회/관리하는 전역 페이지.
  // ============================================================================
  SOFTWARE_VALIDATIONS: {
    LIST: '/software-validations',
    DETAIL: (id: string) => `/software-validations/${id}`,
    /** 특정 소프트웨어의 유효성 확인 목록으로 필터링된 진입 */
    BY_SOFTWARE: (softwareId: string) =>
      `/software-validations?softwareId=${encodeURIComponent(softwareId)}`,
    /** 재검증 필요 항목만 필터링 */
    REVALIDATION_REQUIRED: '/software-validations?status=revalidation_required',
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

  // ============================================================================
  // 도움말 / In-app FAQ
  // ============================================================================
  /**
   * 도움말 라우트 SSOT — Sprint 4.5 S6.
   * `mailto:` 외 in-app 대체 경로를 제공해 EmptyState/error fallback 등에서
   * 사용자가 "어떻게 해야 하나요?" 의문을 가질 때 진입 가능한 단일 라우트.
   *
   * 새 도움말 토픽 추가 시 `topicKey`를 `messages/{locale}/help.json` 의
   * `sections.<topicKey>` 와 동기화. 라우트 자체에는 토픽이 anchor(#)로 표현된다.
   */
  HELP: {
    INDEX: '/help',
    TOPIC: (topicKey: string) => `/help#${encodeURIComponent(topicKey)}`,
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
