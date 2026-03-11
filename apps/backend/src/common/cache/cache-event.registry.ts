import { NOTIFICATION_EVENTS } from '../../modules/notifications/events/notification-events';

/**
 * 캐시 무효화 액션 타입
 *
 * CacheInvalidationHelper의 메서드에 1:1 매핑되는 액션.
 * payload 필드를 참조하여 동적으로 무효화 대상을 결정한다.
 */
export interface CacheInvalidationAction {
  /** CacheInvalidationHelper 메서드명 */
  method:
    | 'invalidateAllDashboard'
    | 'invalidateAllEquipment'
    | 'invalidateEquipmentDetail'
    | 'invalidateEquipmentLists'
    | 'invalidateAfterEquipmentUpdate'
    | 'invalidateAfterNonConformanceCreation'
    | 'invalidateAfterNonConformanceStatusChange'
    | 'invalidateAfterDisposal'
    | 'invalidateAfterCalibrationPlanUpdate';

  /** payload에서 equipmentId를 추출할 필드명 (기본: 'equipmentId') */
  equipmentIdField?: string;

  /** payload에서 planId를 추출할 필드명 */
  planIdField?: string;

  /** invalidateAfterEquipmentUpdate의 statusChanged 파라미터 */
  statusChanged?: boolean;

  /** invalidateAfterEquipmentUpdate의 teamIdChanged 파라미터 */
  teamIdChanged?: boolean;

  /** invalidateAfterNonConformanceStatusChange의 equipmentStatusChanged 파라미터 */
  equipmentStatusChanged?: boolean;
}

/**
 * 추가 패턴 기반 캐시 삭제 (CacheInvalidationHelper에 없는 캐시)
 *
 * 서비스별 로컬 캐시 키 패턴을 이벤트에 연결한다.
 * 예: checkout 승인 → checkout:* 캐시 삭제
 */
export interface CachePatternDeletion {
  /** SimpleCacheService.deleteByPattern()에 전달할 정규식 패턴 */
  pattern: string;
}

export interface CacheInvalidationRule {
  /** CacheInvalidationHelper 메서드 호출 목록 */
  actions: CacheInvalidationAction[];
  /** 추가 패턴 삭제 (서비스 로컬 캐시) */
  patterns?: CachePatternDeletion[];
}

/**
 * 이벤트 → 캐시 무효화 규칙 레지스트리 (SSOT)
 *
 * 설계 원칙:
 * 1. 모든 상태 변경 이벤트는 최소한 대시보드 캐시를 무효화
 * 2. 장비 상태에 영향을 주는 이벤트는 장비 상세/목록도 무효화
 * 3. 패턴 기반 삭제로 서비스 로컬 캐시도 커버
 *
 * 새 이벤트 추가 시: 이 레지스트리에 규칙을 추가하면 자동 처리 — 코드 변경 0
 */
export const CACHE_INVALIDATION_REGISTRY: Record<string, CacheInvalidationRule> = {
  // ─── 반출 (Checkout) ───
  // 모든 반출 이벤트는 대시보드 카운트에 영향 + checkout 캐시 무효화
  [NOTIFICATION_EVENTS.CHECKOUT_CREATED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_APPROVED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_STARTED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_RETURNED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: 'checkout:*' }],
  },
  [NOTIFICATION_EVENTS.CHECKOUT_OVERDUE]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: 'checkout:*' }],
  },

  // ─── 교정 (Calibration) ───
  [NOTIFICATION_EVENTS.CALIBRATION_CREATED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [{ pattern: 'calibration:list:*' }, { pattern: 'calibration:pending:*' }],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: 'calibration:list:*' }, { pattern: 'calibration:pending:*' }],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_REJECTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [{ pattern: 'calibration:list:*' }, { pattern: 'calibration:pending:*' }],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON]: {
    actions: [{ method: 'invalidateAllDashboard' }],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_OVERDUE]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: 'calibration:list:*' }, { pattern: 'calibration:pending:*' }],
  },

  // ─── 교정계획 (Calibration Plan) ───
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_SUBMITTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_REVIEWED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_APPROVED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },
  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_REJECTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateAfterCalibrationPlanUpdate', planIdField: 'planId' },
    ],
  },

  // ─── 부적합 (Non-Conformance) ───
  [NOTIFICATION_EVENTS.NC_CREATED]: {
    actions: [{ method: 'invalidateAfterNonConformanceCreation', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.NC_CORRECTED]: {
    actions: [
      {
        method: 'invalidateAfterNonConformanceStatusChange',
        equipmentIdField: 'equipmentId',
        equipmentStatusChanged: false,
      },
    ],
  },
  [NOTIFICATION_EVENTS.NC_CLOSED]: {
    actions: [
      {
        method: 'invalidateAfterNonConformanceStatusChange',
        equipmentIdField: 'equipmentId',
        equipmentStatusChanged: true,
      },
    ],
  },
  [NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED]: {
    actions: [
      {
        method: 'invalidateAfterNonConformanceStatusChange',
        equipmentIdField: 'equipmentId',
        equipmentStatusChanged: false,
      },
    ],
  },

  // ─── 장비 요청 (Equipment Request) ───
  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_CREATED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
  },
  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
  },
  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
  },

  // ─── 폐기 (Disposal) ───
  [NOTIFICATION_EVENTS.DISPOSAL_REQUESTED]: {
    actions: [{ method: 'invalidateAfterDisposal', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.DISPOSAL_REVIEWED]: {
    actions: [{ method: 'invalidateAfterDisposal', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.DISPOSAL_APPROVED]: {
    actions: [{ method: 'invalidateAfterDisposal', equipmentIdField: 'equipmentId' }],
  },
  [NOTIFICATION_EVENTS.DISPOSAL_REJECTED]: {
    actions: [
      { method: 'invalidateAllDashboard' },
      { method: 'invalidateEquipmentDetail', equipmentIdField: 'equipmentId' },
    ],
    patterns: [{ pattern: 'disposal-requests:*' }],
  },

  // ─── 장비 반입 (Equipment Import) ───
  [NOTIFICATION_EVENTS.IMPORT_CREATED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: 'equipment-imports:*' }],
  },
  [NOTIFICATION_EVENTS.IMPORT_APPROVED]: {
    actions: [
      {
        method: 'invalidateAfterEquipmentUpdate',
        equipmentIdField: 'equipmentId',
        statusChanged: true,
      },
    ],
    patterns: [{ pattern: 'equipment-imports:*' }],
  },
  [NOTIFICATION_EVENTS.IMPORT_REJECTED]: {
    actions: [{ method: 'invalidateAllDashboard' }],
    patterns: [{ pattern: 'equipment-imports:*' }],
  },
};
