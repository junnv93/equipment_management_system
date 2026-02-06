/**
 * React Query 캐시 설정 - Single Source of Truth
 *
 * 모든 React Query 훅에서 참조하는 중앙화된 캐시 설정입니다.
 * staleTime, gcTime 등의 설정을 일관되게 관리합니다.
 *
 * 용어 정리:
 * - staleTime: 데이터가 "신선"하다고 간주되는 시간 (이 시간 동안 refetch 안 함)
 * - gcTime: 캐시에서 데이터가 유지되는 시간 (garbage collection time)
 */

/**
 * 캐시 시간 상수 (밀리초)
 */
export const CACHE_TIMES = {
  /** 30초 - 자주 변경되는 데이터 (대시보드, 알림) */
  SHORT: 30 * 1000,
  /** 2분 - 일반적인 데이터 (상세 페이지) */
  MEDIUM: 2 * 60 * 1000,
  /** 5분 - 변경이 적은 데이터 (목록 페이지) */
  LONG: 5 * 60 * 1000,
  /** 10분 - 거의 변경되지 않는 데이터 (메타데이터) */
  VERY_LONG: 10 * 60 * 1000,
  /** 30분 - 참조 데이터 (팀 목록, 상태 코드) */
  REFERENCE: 30 * 60 * 1000,
} as const;

/**
 * 기능별 Query 설정
 *
 * 각 기능 영역에 맞는 캐시 설정을 정의합니다.
 * 컴포넌트에서 useQuery 호출 시 이 설정을 스프레드하여 사용합니다.
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
  /** 장비 목록 - 필터/검색 시 빠른 응답 필요 */
  EQUIPMENT_LIST: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    refetchOnWindowFocus: false,
    retry: 3,
  },

  /** 장비 상세 - 수정 가능하므로 중간 수준의 캐시 */
  EQUIPMENT_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
    retry: 2,
  },

  /** 대시보드 - 실시간성 중요 */
  DASHBOARD: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: 60 * 1000, // 1분마다 자동 refetch
  },

  /** 교정 계획 목록 */
  CALIBRATION_PLANS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
    retry: 2,
  },

  /** 교정 계획 상세 */
  CALIBRATION_PLAN_DETAIL: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  },

  /** 알림 - 실시간성 중요 */
  NOTIFICATIONS: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchInterval: 30 * 1000, // 30초마다 자동 refetch
  },

  /** 팀 목록 - 거의 변경되지 않음 */
  TEAMS: {
    staleTime: CACHE_TIMES.REFERENCE,
    gcTime: CACHE_TIMES.REFERENCE,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  },

  /** 사용자 목록 */
  USERS: {
    staleTime: CACHE_TIMES.LONG,
    gcTime: CACHE_TIMES.VERY_LONG,
  },

  /** 이력 데이터 (위치, 유지보수, 교정 등) */
  HISTORY: {
    staleTime: CACHE_TIMES.MEDIUM,
    gcTime: CACHE_TIMES.LONG,
  },

  /** 승인 대기 목록 - 실시간성 중요 */
  PENDING_APPROVALS: {
    staleTime: CACHE_TIMES.SHORT,
    gcTime: CACHE_TIMES.MEDIUM,
    refetchOnWindowFocus: true,
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
    list: (filters: Record<string, any>) => [...queryKeys.equipment.lists(), filters] as const,
    details: () => [...queryKeys.equipment.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.equipment.details(), id] as const,
    history: (id: string, type: string) =>
      [...queryKeys.equipment.detail(id), 'history', type] as const,
    // Sub-resources (nested under detail)
    nonConformances: (id: string) =>
      [...queryKeys.equipment.detail(id), 'non-conformances'] as const,
    incidentHistory: (id: string) =>
      [...queryKeys.equipment.detail(id), 'incident-history'] as const,
    disposalRequests: (id: string) =>
      [...queryKeys.equipment.detail(id), 'disposal-requests'] as const,
    currentDisposalRequest: (id: string) =>
      [...queryKeys.equipment.detail(id), 'disposal-request', 'current'] as const,
  },
  calibrationPlans: {
    all: ['calibrationPlans'] as const,
    lists: () => [...queryKeys.calibrationPlans.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.calibrationPlans.lists(), filters] as const,
    details: () => [...queryKeys.calibrationPlans.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calibrationPlans.details(), id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: (role?: string) => [...queryKeys.dashboard.all, 'summary', role] as const,
    equipmentByTeam: (role?: string) =>
      [...queryKeys.dashboard.all, 'equipmentByTeam', role] as const,
    overdueCalibrations: (role?: string) =>
      [...queryKeys.dashboard.all, 'overdueCalibrations', role] as const,
    upcomingCalibrations: (role?: string, days?: number) =>
      [...queryKeys.dashboard.all, 'upcomingCalibrations', role, days] as const,
    overdueCheckouts: (role?: string) =>
      [...queryKeys.dashboard.all, 'overdueCheckouts', role] as const,
    recentActivities: (role?: string) =>
      [...queryKeys.dashboard.all, 'recentActivities', role] as const,
    equipmentStatusStats: (role?: string) =>
      [...queryKeys.dashboard.all, 'equipmentStatusStats', role] as const,
    pendingApprovalCounts: (role?: string) =>
      [...queryKeys.dashboard.all, 'pendingApprovalCounts', role] as const,
  },
  teams: {
    all: ['teams'] as const,
    list: () => [...queryKeys.teams.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.teams.all, 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.notifications.all, 'list', filters] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  nonConformances: {
    all: ['non-conformances'] as const,
    lists: () => [...queryKeys.nonConformances.all, 'list'] as const,
    list: (filters: Record<string, any>) =>
      [...queryKeys.nonConformances.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.nonConformances.all, 'detail', id] as const,
    byEquipment: (equipmentId: string) =>
      [...queryKeys.nonConformances.all, 'equipment', equipmentId] as const,
  },
  disposal: {
    all: ['disposal-requests'] as const,
    lists: () => [...queryKeys.disposal.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.disposal.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.disposal.all, 'detail', id] as const,
  },
} as const;
