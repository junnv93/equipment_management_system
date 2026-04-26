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
  // 파일 서빙 (스토리지 → 인증된 클라이언트)
  // ============================================================================
  FILES: {
    /**
     * 스토리지 파일 서빙 기본 경로
     * 사용법: `${API_ENDPOINTS.FILES.SERVE}/${storageKey}`
     * 예: /api/files/signatures/uuid.png
     *
     * 백엔드가 S3이면 Presigned URL로 302 redirect,
     * Local이면 버퍼 스트리밍으로 응답합니다.
     */
    SERVE: '/api/files',
  },
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
    /**
     * 관리번호로 장비 단건 조회 (QR 모바일 랜딩 등 관리번호 기반 진입점).
     * UUID 기반 GET과 구분되는 의미론: 단일 조회 + 관리번호 고유성 + 사이트 스코프 자동 적용.
     */
    BY_MANAGEMENT_NUMBER: (mgmt: string) =>
      `/api/equipment/by-management-number/${encodeURIComponent(mgmt)}`,
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
    /** 공용 장비 등록 (isShared=true 고정) */
    CREATE_SHARED: '/api/equipment/shared',
    // 수리 이력
    REPAIR_HISTORY: {
      LIST: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history`,
      CREATE: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history`,
      RECENT: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history/recent`,
      /** 수리 이력 요약 (최근 건수 + 비용 합계) */
      SUMMARY: (equipmentId: string) => `/api/equipment/${equipmentId}/repair-history/summary`,
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
    /** 대여 1차 승인 (차용 팀 TM) */
    BORROWER_APPROVE: (id: string) => `/api/checkouts/${id}/borrower-approve`,
    /** 대여 1차 반려 (차용 팀 TM) */
    BORROWER_REJECT: (id: string) => `/api/checkouts/${id}/borrower-reject`,
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
    /** QR 인수인계 토큰 발급 (POST) — 대여자/차용자가 호출, 10분 TTL jti 1회용 */
    HANDOVER_TOKEN: (id: string) => `/api/checkouts/${id}/handover-token`,
    /** QR 인수인계 토큰 검증 + 소비 (POST) — 스캔 진입점이 호출 */
    HANDOVER_VERIFY: '/api/checkouts/handover/verify',
    // 반출지 목록 조회 (DB에서 실제 사용된 값들)
    DESTINATIONS: '/api/checkouts/destinations',
    // BFF: 반입 현황 집계 (Sprint 3.1)
    INBOUND_OVERVIEW: '/api/checkouts/inbound-overview',
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
    THUMBNAIL: (id: string, size?: 'sm' | 'md' | 'lg') =>
      `/api/documents/${id}/thumbnail${size && size !== 'sm' ? `?size=${size}` : ''}`,
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
    CONFIRM_ALL_ITEMS: (planId: string) => `/api/calibration-plans/${planId}/items/confirm-all`,
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
    /** NC 전용 첨부 엔드포인트 — NC permission 경계 준수 (범용 /documents와 분리) */
    ATTACHMENTS: (id: string) => `/api/non-conformances/${id}/attachments`,
    ATTACHMENT: (id: string, documentId: string) =>
      `/api/non-conformances/${id}/attachments/${documentId}`,
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
    LIST_ALL: '/api/software-validations',
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
    /** 백엔드 직접 로그인 — E2E/내부 전용, 프론트엔드 NextAuth 플로우에서 사용 금지 */
    BACKEND_LOGIN: '/api/auth/login',
    /** 현재 세션 프로필 조회 — E2E/내부 전용 */
    PROFILE: '/api/auth/profile',
    /** 테스트 환경 헬스 체크 — E2E/내부 전용 */
    TEST: '/api/auth/test',
    /** 테스트 역할 로그인 — E2E 전용, 프로덕션 비활성화 */
    TEST_LOGIN: (role: string) => `/api/auth/test-login?role=${role}`,
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
    SUBMIT: (id: string) => `/api/self-inspections/${id}/submit`,
    WITHDRAW: (id: string) => `/api/self-inspections/${id}/withdraw`,
    APPROVE: (id: string) => `/api/self-inspections/${id}/approve`,
    REJECT: (id: string) => `/api/self-inspections/${id}/reject`,
    RESUBMIT: (id: string) => `/api/self-inspections/${id}/resubmit`,
    DELETE: (id: string) => `/api/self-inspections/${id}`,
    RESULT_SECTIONS: {
      LIST: (inspectionId: string) => `/api/self-inspections/${inspectionId}/result-sections`,
      CREATE: (inspectionId: string) => `/api/self-inspections/${inspectionId}/result-sections`,
      UPDATE: (inspectionId: string, sectionId: string) =>
        `/api/self-inspections/${inspectionId}/result-sections/${sectionId}`,
      DELETE: (inspectionId: string, sectionId: string) =>
        `/api/self-inspections/${inspectionId}/result-sections/${sectionId}`,
      /** 순서 재할당 (단일 원자 트랜잭션) */
      REORDER: (inspectionId: string) =>
        `/api/self-inspections/${inspectionId}/result-sections/reorder`,
      UPLOAD_CSV: (inspectionId: string) =>
        `/api/self-inspections/${inspectionId}/result-sections/upload-csv`,
    },
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
    WITHDRAW: (id: string) => `/api/intermediate-inspections/${id}/withdraw`,
    RESUBMIT: (id: string) => `/api/intermediate-inspections/${id}/resubmit`,
    DELETE: (id: string) => `/api/intermediate-inspections/${id}`,
    RESULT_SECTIONS: {
      LIST: (inspectionId: string) =>
        `/api/intermediate-inspections/${inspectionId}/result-sections`,
      CREATE: (inspectionId: string) =>
        `/api/intermediate-inspections/${inspectionId}/result-sections`,
      UPDATE: (inspectionId: string, sectionId: string) =>
        `/api/intermediate-inspections/${inspectionId}/result-sections/${sectionId}`,
      DELETE: (inspectionId: string, sectionId: string) =>
        `/api/intermediate-inspections/${inspectionId}/result-sections/${sectionId}`,
      /** 순서 재할당 (단일 원자 트랜잭션) */
      REORDER: (inspectionId: string) =>
        `/api/intermediate-inspections/${inspectionId}/result-sections/reorder`,
      UPLOAD_CSV: (inspectionId: string) =>
        `/api/intermediate-inspections/${inspectionId}/result-sections/upload-csv`,
    },
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
    /** 양식명 기준 개정 메타데이터(changeSummary) 이력 (UL-QP-03 §7.5) */
    REVISIONS_BY_NAME: '/api/form-templates/revisions',
    /** 보존연한 만료로 소프트 아카이브된 양식 목록 (UL-QP-03 §11) */
    ARCHIVED: '/api/form-templates/archived',
  },

  // ============================================================================
  // 보안 리포팅 (CSP violation 수집 등)
  // ============================================================================
  SECURITY: {
    /** CSP violation report 수집 — proxy.ts report-uri + Report-To directive의 SSOT 경로 */
    CSP_REPORT: '/api/security/csp-report',
  },
} as const;

/**
 * API 엔드포인트 타입 (IDE 자동완성용)
 */
export type ApiEndpoints = typeof API_ENDPOINTS;
