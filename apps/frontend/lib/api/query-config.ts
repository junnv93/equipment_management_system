/**
 * React Query 캐시 설정 - Single Source of Truth
 *
 * 모든 React Query 훅에서 참조하는 중앙화된 캐시 설정입니다.
 * staleTime, gcTime 등의 설정을 일관되게 관리합니다.
 *
 * 용어 정리:
 * - staleTime: 데이터가 "신선"하다고 간주되는 시간 (이 시간 동안 refetch 안 함)
 * - gcTime: 캐시에서 데이터가 유지되는 시간 (garbage collection time)
 *
 * Architecture v2 (2026-02-16):
 * - Data Fetching Strategy: Real-time 요구사항 4단계 분류
 * - SSOT: REFETCH_STRATEGIES로 중앙화된 갱신 전략
 * - Visual Feedback: Urgency Level과 분리 (Design Token으로 이동)
 */

import type { Site } from '@equipment-management/schemas';
import { CACHE_TTL } from '@equipment-management/shared-constants';

/**
 * 캐시 시간 상수 (밀리초)
 *
 * SSOT: @equipment-management/shared-constants의 CACHE_TTL 참조
 * Backend SimpleCacheService TTL과 동일한 값을 사용합니다.
 */
export const CACHE_TIMES = CACHE_TTL;

/**
 * Refetch Interval 상수 (밀리초)
 *
 * SSOT: 자동 갱신 주기를 명시적으로 정의
 */
export const REFETCH_INTERVALS = {
  /** 30초 - 실시간 중요 데이터 (알림, 채팅) */
  REALTIME: 30 * 1000,
  /** 2분 - 준실시간 데이터 (대시보드 통계) */
  NEAR_REALTIME: 2 * 60 * 1000,
  /** 5분 - 주기적 갱신 (모니터링) */
  PERIODIC: 5 * 60 * 1000,
  /** 10분 - SSE 폴백 (SSE 연결 끊김 시 안전망) */
  SSE_FALLBACK: 10 * 60 * 1000,
  /** 없음 - 사용자 인터랙션 기반 갱신 */
  NONE: undefined,
} as const;

/**
 * Data Fetching Strategy (SSOT)
 *
 * 4단계 Real-time 요구사항 분류:
 * - CRITICAL: SSE/WebSocket 사용 권장 (현재: 30초 폴링)
 * - IMPORTANT: 준실시간 폴링 (2분)
 * - NORMAL: 사용자 인터랙션 기반 (window focus)
 * - STATIC: 수동 갱신 (mutation 후에만)
 *
 * 선택 기준:
 * - 사용자가 즉시 알아야 하는가? → CRITICAL
 * - 화면에 표시되는 숫자가 정확해야 하는가? → IMPORTANT
 * - 사용자가 페이지 방문 시 최신이면 되는가? → NORMAL
 * - 거의 변경되지 않는가? → STATIC
 */
export const REFETCH_STRATEGIES = {
  /** 실시간 (SSE 추천, 현재: 30초 폴링) */
  CRITICAL: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: REFETCH_INTERVALS.REALTIME,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 준실시간 (2분 폴링) */
  IMPORTANT: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: REFETCH_INTERVALS.NEAR_REALTIME,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 사용자 인터랙션 기반 (window focus만) */
  NORMAL: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: REFETCH_INTERVALS.NONE,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 정적 (수동 갱신) */
  STATIC: {
    staleTime: CACHE_TIMES.REFERENCE,
    gcTime: CACHE_TIMES.REFERENCE,
    refetchInterval: REFETCH_INTERVALS.NONE,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  },

  /**
   * SSE 실시간 무효화 + SSE 연결 끊김 폴백 (10분)
   *
   * SSE 이벤트(approval-changed 등)가 즉시 무효화를 담당합니다.
   * 10분 폴링은 SSE 연결이 끊겼을 때의 안전망입니다.
   *
   * CRITICAL(30초 폴링)과의 차이:
   * - CRITICAL: SSE 미구현 상태에서 빈번한 폴링으로 실시간성 보장
   * - SSE_BACKED: SSE가 주 갱신 수단이므로 폴링은 드문 폴백으로 충분
   */
  SSE_BACKED: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: REFETCH_INTERVALS.SSE_FALLBACK,
    refetchOnWindowFocus: true,
    retry: 2,
  },
} as const;

/**
 * 기능별 Query 설정 (SSOT: REFETCH_STRATEGIES 기반)
 *
 * 각 기능 영역에 맞는 갱신 전략을 명시적으로 선언합니다.
 * 하드코딩된 refetchInterval 대신 REFETCH_STRATEGIES를 참조합니다.
 *
 * @example
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: ['equipment', id],
 *   queryFn: () => equipmentApi.getEquipment(id),
 *   ...QUERY_CONFIG.EQUIPMENT_DETAIL,
 * });
 * ```
 */
export const QUERY_CONFIG = {
  /** 장비 목록 - NORMAL (사용자 필터링 시 갱신) */
  EQUIPMENT_LIST: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false, // 필터 조작 시에만 갱신
    retry: 3,
  },

  /** 장비 상세 - NORMAL (mutation 후 자동 무효화) */
  EQUIPMENT_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 대시보드 - NORMAL (탭 전환 시 갱신, 자동 폴링 없음) */
  DASHBOARD: REFETCH_STRATEGIES.NORMAL,

  /** 교정 요약 통계 - NORMAL */
  CALIBRATION_SUMMARY: REFETCH_STRATEGIES.NORMAL,

  /** 교정 이력 목록 - NORMAL */
  CALIBRATION_LIST: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    retry: 2,
  },

  /** 교정 계획 목록 - NORMAL */
  CALIBRATION_PLANS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    retry: 2,
  },

  /** 교정 계획 상세 - NORMAL */
  CALIBRATION_PLAN_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 알림 - CRITICAL (SSE 전환 전까지 30초 폴링) */
  NOTIFICATIONS: REFETCH_STRATEGIES.CRITICAL,

  /** 팀 목록 - STATIC (거의 변경 없음) */
  TEAMS: REFETCH_STRATEGIES.STATIC,

  /** 사용자 목록 - NORMAL */
  USERS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 이력 데이터 - NORMAL */
  HISTORY: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 승인 대기 목록 - NORMAL (SSE로 무효화 예정) */
  PENDING_APPROVALS: REFETCH_STRATEGIES.NORMAL,

  /** 사용자 설정 - STATIC (mutation onSettled invalidation으로만 갱신) */
  SETTINGS: REFETCH_STRATEGIES.STATIC,

  /** 감사 로그 목록 - append-only, 사용자 명시적 갱신 기반 (window focus 갱신 없음) */
  AUDIT_LOGS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    retry: 2,
  },

  /** 부적합 관리 목록 - NORMAL (상태 변경 후 무효화로 갱신) */
  NON_CONFORMANCES_LIST: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    retry: 2,
  },

  /** 부적합 관리 상세 - NORMAL (mutation 후 자동 무효화) */
  NON_CONFORMANCES_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 시험용 소프트웨어 목록 - NORMAL (사용자 필터링 시 갱신) */
  TEST_SOFTWARE_LIST: REFETCH_STRATEGIES.NORMAL,

  /** 시험용 소프트웨어 상세 - NORMAL (mutation 후 자동 무효화) */
  TEST_SOFTWARE_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 케이블 목록 - NORMAL (사용자 필터링 시 갱신) */
  CABLES_LIST: REFETCH_STRATEGIES.NORMAL,

  /** 케이블 상세 - NORMAL (mutation 후 자동 무효화) */
  CABLES_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 승인 카운트 - SSE_BACKED (SSE approval-changed 이벤트로 실시간 무효화, 10분 폴백) */
  APPROVAL_COUNTS: REFETCH_STRATEGIES.SSE_BACKED,

  /**
   * 결과 섹션 (중간/자체점검 동적 콘텐츠) - NORMAL
   * 편집 빈도가 낮고 mutation 후 자동 무효화로 갱신됨.
   * 매 mount 마다 refetch 하지 않도록 MEDIUM staleTime 적용.
   */
  RESULT_SECTIONS: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    refetchOnWindowFocus: true,
    retry: 2,
  },

  /** 모니터링 - PERIODIC (5분 폴링, 시스템 상태 주기적 갱신) */
  MONITORING: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: REFETCH_INTERVALS.PERIODIC,
    refetchOnWindowFocus: true,
    retry: 2,
  },
} as const;

/**
 * Query Key 팩토리
 *
 * 일관된 query key 구조를 보장합니다.
 *
 * @example
 * ```typescript
 * const { data } = useQuery({
 *   queryKey: queryKeys.equipment.detail(id),
 *   queryFn: () => equipmentApi.getEquipment(id),
 * });
 * ```
 */
export const queryKeys = {
  equipment: {
    all: ['equipment'] as const,
    lists: () => [...queryKeys.equipment.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.equipment.lists(), filters] as const,
    search: (term?: string) => [...queryKeys.equipment.all, 'search', term] as const,
    checkoutSearch: (search?: string, purpose?: string, teamId?: string) =>
      [...queryKeys.equipment.all, 'checkout-search', search, purpose, teamId] as const,
    details: () => [...queryKeys.equipment.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.equipment.details(), id] as const,
    history: (id: string, type: string) =>
      [...queryKeys.equipment.detail(id), 'history', type] as const,
    managementNumberCheck: (value?: string, excludeId?: string) =>
      [...queryKeys.equipment.all, 'management-number-check', value, excludeId] as const,
    // Sub-resources (nested under detail)
    nonConformances: (id: string) =>
      [...queryKeys.equipment.detail(id), 'non-conformances'] as const,
    openNonConformances: (id: string) =>
      [...queryKeys.equipment.detail(id), 'open-non-conformances'] as const,
    incidentHistory: (id: string) =>
      [...queryKeys.equipment.detail(id), 'incident-history'] as const,
    repairHistory: (id: string) => [...queryKeys.equipment.detail(id), 'repair-history'] as const,
    locationHistory: (id: string) =>
      [...queryKeys.equipment.detail(id), 'location-history'] as const,
    maintenanceHistory: (id: string) =>
      [...queryKeys.equipment.detail(id), 'maintenance-history'] as const,
    checkoutHistory: (id: string) =>
      [...queryKeys.equipment.detail(id), 'checkout-history'] as const,
    calibrationFactors: (id: string) =>
      [...queryKeys.equipment.detail(id), 'calibration-factors'] as const,
    disposalRequests: (id: string) =>
      [...queryKeys.equipment.detail(id), 'disposal-requests'] as const,
    currentDisposalRequest: (id: string) =>
      [...queryKeys.equipment.detail(id), 'disposal-request', 'current'] as const,
    selfInspections: (id: string) =>
      [...queryKeys.equipment.detail(id), 'self-inspections'] as const,
    intermediateInspections: (id: string) =>
      [...queryKeys.equipment.detail(id), 'intermediate-inspections'] as const,
  },
  calibrationPlans: {
    all: ['calibrationPlans'] as const,
    lists: () => [...queryKeys.calibrationPlans.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.calibrationPlans.lists(), filters] as const,
    details: () => [...queryKeys.calibrationPlans.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calibrationPlans.details(), id] as const,
    pending: () => [...queryKeys.calibrationPlans.all, 'pending'] as const,
    versions: (planId: string) =>
      [...queryKeys.calibrationPlans.detail(planId), 'versions'] as const,
    externalEquipment: (year?: string, site?: string, teamId?: string) =>
      [...queryKeys.calibrationPlans.all, 'external-equipment', year, site, teamId] as const,
  },
  calibrationFactors: {
    all: ['calibration-factors'] as const,
    lists: () => [...queryKeys.calibrationFactors.all, 'list'] as const,
    byEquipment: (equipmentId: string) =>
      [...queryKeys.calibrationFactors.all, 'equipment', equipmentId] as const,
    allByEquipment: (equipmentId: string) =>
      [...queryKeys.calibrationFactors.all, 'all-by-equipment', equipmentId] as const,
    pending: () => [...queryKeys.calibrationFactors.all, 'pending'] as const,
    registry: () => [...queryKeys.calibrationFactors.all, 'registry'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    aggregate: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'aggregate', role, teamId] as const,
    summary: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'summary', role, teamId] as const,
    equipmentByTeam: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'equipmentByTeam', role, teamId] as const,
    overdueCalibrations: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'overdueCalibrations', role, teamId] as const,
    upcomingCalibrations: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'upcomingCalibrations', role, teamId] as const,
    overdueCheckouts: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'overdueCheckouts', role, teamId] as const,
    recentActivities: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'recentActivities', role, teamId] as const,
    equipmentStatusStats: (role?: string, teamId?: string) =>
      [...queryKeys.dashboard.all, 'equipmentStatusStats', role, teamId] as const,
    pendingApprovalCounts: (role?: string) =>
      [...queryKeys.dashboard.all, 'pendingApprovalCounts', role] as const,
  },
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (filters?: object) => [...queryKeys.teams.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.teams.all, 'detail', id] as const,
    members: (teamId: string) => [...queryKeys.teams.detail(teamId), 'members'] as const,
    filterOptions: (site?: string) => [...queryKeys.teams.all, 'filter-options', site] as const,
    bySite: (site?: string) => [...queryKeys.teams.all, 'by-site', site] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    search: (params: Record<string, string | undefined>) =>
      [...queryKeys.users.all, 'search', params] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: object) => [...queryKeys.notifications.all, 'list', filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
  },
  nonConformances: {
    all: ['non-conformances'] as const,
    lists: () => [...queryKeys.nonConformances.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.nonConformances.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.nonConformances.all, 'detail', id] as const,
    byEquipment: (equipmentId: string) =>
      [...queryKeys.nonConformances.all, 'equipment', equipmentId] as const,
  },
  disposal: {
    all: ['disposal-requests'] as const,
    lists: () => [...queryKeys.disposal.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.disposal.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.disposal.all, 'detail', id] as const,
  },
  checkouts: {
    all: ['checkouts'] as const,
    lists: () => [...queryKeys.checkouts.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.checkouts.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.checkouts.all, 'detail', id] as const,
    outbound: (teamId?: string, status?: string, location?: string) =>
      [...queryKeys.checkouts.all, 'outbound', teamId, status, location] as const,
    inbound: (filters: object = {}) => [...queryKeys.checkouts.all, 'inbound', filters] as const,
    destinations: () => [...queryKeys.checkouts.all, 'destinations'] as const,
    pending: (role?: string) => [...queryKeys.checkouts.all, 'pending', role] as const,
    returnPending: () => [...queryKeys.checkouts.all, 'return-pending'] as const,
    summary: (params: object = {}) => [...queryKeys.checkouts.all, 'summary', params] as const,
  },
  calibrations: {
    all: ['calibrations'] as const,
    summary: (teamId?: string, site?: string) =>
      teamId || site
        ? ([...queryKeys.calibrations.all, 'summary', { teamId, site }] as const)
        : ([...queryKeys.calibrations.all, 'summary'] as const),
    overdue: (teamId?: string, site?: string) =>
      teamId || site
        ? ([...queryKeys.calibrations.all, 'overdue', { teamId, site }] as const)
        : ([...queryKeys.calibrations.all, 'overdue'] as const),
    upcoming: (days?: number, teamId?: string, site?: string) =>
      teamId || site
        ? ([...queryKeys.calibrations.all, 'upcoming', days, { teamId, site }] as const)
        : ([...queryKeys.calibrations.all, 'upcoming', days] as const),
    historyList: (filters?: object) => [...queryKeys.calibrations.all, 'history', filters] as const,
    pending: () => [...queryKeys.calibrations.all, 'pending'] as const,
    byEquipment: (equipmentId: string) =>
      [...queryKeys.calibrations.all, 'equipment', equipmentId] as const,
    intermediateChecks: (teamId?: string, site?: string) =>
      teamId || site
        ? ([...queryKeys.calibrations.all, 'intermediate-checks', { teamId, site }] as const)
        : ([...queryKeys.calibrations.all, 'intermediate-checks'] as const),
    documents: (calibrationId: string) =>
      [...queryKeys.calibrations.all, 'documents', calibrationId] as const,
  },
  intermediateInspections: {
    all: ['intermediate-inspections'] as const,
    byCalibration: (calibrationId: string) =>
      ['intermediate-inspections', 'calibration', calibrationId] as const,
    detail: (id: string) => ['intermediate-inspections', 'detail', id] as const,
    resultSections: (inspectionId: string) =>
      ['intermediate-inspections', 'detail', inspectionId, 'result-sections'] as const,
  },
  selfInspections: {
    resultSections: (inspectionId: string) =>
      ['self-inspections', 'detail', inspectionId, 'result-sections'] as const,
  },
  documents: {
    all: ['documents'] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    revisions: (id: string) => ['documents', 'revisions', id] as const,
    byEquipment: (equipmentId: string) => ['documents', 'equipment', equipmentId] as const,
    byRequest: (requestId: string) => ['documents', 'request', requestId] as const,
    byValidation: (validationId: string) => ['documents', 'validation', validationId] as const,
  },
  reports: {
    all: ['reports'] as const,
    equipmentUsage: (filters?: object) =>
      [...queryKeys.reports.all, 'equipment-usage', filters] as const,
    calibrationStatus: (filters?: object) =>
      [...queryKeys.reports.all, 'calibration-status', filters] as const,
    checkoutStatistics: (filters?: object) =>
      [...queryKeys.reports.all, 'checkout-statistics', filters] as const,
    utilizationRate: (filters?: object) =>
      [...queryKeys.reports.all, 'utilization-rate', filters] as const,
    equipmentDowntime: (filters?: object) =>
      [...queryKeys.reports.all, 'equipment-downtime', filters] as const,
  },
  testSoftware: {
    all: ['test-software'] as const,
    lists: () => [...queryKeys.testSoftware.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.testSoftware.lists(), filters] as const,
    details: () => [...queryKeys.testSoftware.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.testSoftware.details(), id] as const,
    byEquipment: (equipmentId: string) =>
      [...queryKeys.testSoftware.all, 'by-equipment', equipmentId] as const,
    linkedEquipment: (softwareId: string) =>
      [...queryKeys.testSoftware.all, 'linked-equipment', softwareId] as const,
  },
  cables: {
    all: ['cables'] as const,
    lists: () => [...queryKeys.cables.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.cables.lists(), filters] as const,
    details: () => [...queryKeys.cables.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cables.details(), id] as const,
    measurements: (cableId: string) =>
      [...queryKeys.cables.detail(cableId), 'measurements'] as const,
    measurementDetail: (id: string) => [...queryKeys.cables.all, 'measurement-detail', id] as const,
  },
  softwareValidations: {
    all: ['software-validations'] as const,
    byTestSoftware: (softwareId: string) =>
      [...queryKeys.softwareValidations.all, 'by-software', softwareId] as const,
    details: () => [...queryKeys.softwareValidations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.softwareValidations.details(), id] as const,
  },
  equipmentImports: {
    all: ['equipment-imports'] as const,
    lists: () => [...queryKeys.equipmentImports.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.equipmentImports.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.equipmentImports.all, 'detail', id] as const,
    bySourceType: (sourceType: string, filters: object = {}) =>
      [...queryKeys.equipmentImports.all, sourceType, filters] as const,
  },
  equipmentRequests: {
    all: ['equipment-requests'] as const,
    lists: () => [...queryKeys.equipmentRequests.all, 'list'] as const,
    pending: () => [...queryKeys.equipmentRequests.all, 'pending'] as const,
    detail: (id: string) => [...queryKeys.equipmentRequests.all, 'detail', id] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    list: (category?: string, teamId?: string) =>
      [...queryKeys.approvals.all, category, teamId] as const,
    /** SSOT: 네비 뱃지, 대시보드 카드, 승인 페이지 공용 */
    counts: (role?: string) => ['approval-counts', role] as const,
    /** 역할 무관 prefix — 무효화 전용 (모든 role의 counts를 한번에 무효화) */
    countsAll: ['approval-counts'] as const,
    /** 승인 KPI — 서버 사이드 집계 (카테고리별 urgentCount/avgWaitDays 포함) */
    kpi: (category?: string) => [...queryKeys.approvals.all, 'kpi', category] as const,
  },
  auditLogs: {
    all: ['audit-logs'] as const,
    lists: () => [...queryKeys.auditLogs.all, 'list'] as const,
    list: (filters: object) => [...queryKeys.auditLogs.lists(), filters] as const,
    infiniteList: (filters: object) => [...queryKeys.auditLogs.all, 'infinite', filters] as const,
    detail: (id: string) => [...queryKeys.auditLogs.all, 'detail', id] as const,
  },
  settings: {
    all: ['settings'] as const,
    profile: () => [...queryKeys.settings.all, 'profile'] as const,
    preferences: () => [...queryKeys.settings.all, 'preferences'] as const,
    calibration: (site?: Site) => [...queryKeys.settings.all, 'calibration', site] as const,
    system: () => [...queryKeys.settings.all, 'system'] as const,
  },
  monitoring: {
    all: ['monitoring'] as const,
    metrics: () => [...queryKeys.monitoring.all, 'metrics'] as const,
    status: () => [...queryKeys.monitoring.all, 'status'] as const,
    httpStats: () => [...queryKeys.monitoring.all, 'http-stats'] as const,
    cacheStats: () => [...queryKeys.monitoring.all, 'cache-stats'] as const,
  },
  formTemplates: {
    all: ['formTemplates'] as const,
    list: () => [...queryKeys.formTemplates.all, 'list'] as const,
    // 개정 이력은 양식명(안정 키) 기준으로 조회
    historyByName: (formName: string) =>
      [...queryKeys.formTemplates.all, 'history', formName] as const,
    revisionsByName: (formName: string) =>
      [...queryKeys.formTemplates.all, 'revisions', formName] as const,
    searchByNumber: (formNumber: string) =>
      [...queryKeys.formTemplates.all, 'search', formNumber] as const,
    /** 보존연한 만료로 소프트 아카이브된 양식 목록 (UL-QP-03 §11) */
    archived: () => [...queryKeys.formTemplates.all, 'archived'] as const,
  },
  breadcrumbs: {
    all: ['breadcrumb'] as const,
    equipment: (id?: string) => [...queryKeys.breadcrumbs.all, 'equipment', id] as const,
    resource: (type: string, id?: string) => [...queryKeys.breadcrumbs.all, type, id] as const,
  },
  /**
   * 스토리지 파일 서빙 쿼리 키 (FilesController: GET /api/files/:subdir/:filename)
   *
   * 캐싱 전략:
   * - staleTime: MEDIUM(5분) — 서명/장비사진은 자주 바뀌지 않음
   * - gcTime: SHORT(1분) — Blob URL은 GC 시 revoke 필요 (StorageImage 컴포넌트가 처리)
   * - storageKey: '{subdir}/{uuid}.{ext}' 형식 (DB 저장값 그대로 사용)
   */
  storageFiles: {
    all: ['storageFiles'] as const,
    url: (storageKey: string) => [...queryKeys.storageFiles.all, storageKey] as const,
  },
} as const;
