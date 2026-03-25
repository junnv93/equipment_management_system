/**
 * 도메인 이벤트 상수 + 페이로드 타입
 *
 * SSOT: 모든 이벤트명은 여기서 정의하고, NOTIFICATION_REGISTRY에서 참조한다.
 * 이벤트명 포맷: {domain}.{action} (예: checkout.created)
 */

import { NOTIFICATION_TYPE_VALUES } from '@equipment-management/schemas';

// ============================================================================
// 이벤트 상수 (32개 + batch variants)
// ============================================================================

export const NOTIFICATION_EVENTS = {
  // ─── 반출 (Checkout) ───
  CHECKOUT_CREATED: 'checkout.created',
  CHECKOUT_APPROVED: 'checkout.approved',
  CHECKOUT_REJECTED: 'checkout.rejected',
  CHECKOUT_STARTED: 'checkout.started',
  CHECKOUT_RETURNED: 'checkout.returned',
  CHECKOUT_RETURN_APPROVED: 'checkout.returnApproved',
  CHECKOUT_RETURN_REJECTED: 'checkout.returnRejected',
  CHECKOUT_OVERDUE: 'checkout.overdue',

  // ─── 교정 (Calibration) ───
  CALIBRATION_CREATED: 'calibration.created',
  CALIBRATION_APPROVED: 'calibration.approved',
  CALIBRATION_REJECTED: 'calibration.rejected',
  CALIBRATION_DUE_SOON: 'calibration.dueSoon',
  CALIBRATION_OVERDUE: 'calibration.overdue',

  // ─── 교정계획 (Calibration Plan) ───
  CALIBRATION_PLAN_SUBMITTED: 'calibrationPlan.submitted',
  CALIBRATION_PLAN_REVIEWED: 'calibrationPlan.reviewed',
  CALIBRATION_PLAN_APPROVED: 'calibrationPlan.approved',
  CALIBRATION_PLAN_REJECTED: 'calibrationPlan.rejected',

  // ─── 부적합 (Non-Conformance) ───
  NC_CREATED: 'nonConformance.created',
  NC_CORRECTED: 'nonConformance.corrected',
  NC_CLOSED: 'nonConformance.closed',
  NC_CORRECTION_REJECTED: 'nonConformance.correctionRejected',

  // ─── 장비 요청 (Equipment Request) ───
  EQUIPMENT_REQUEST_CREATED: 'equipment.requestCreated',
  EQUIPMENT_REQUEST_APPROVED: 'equipment.requestApproved',
  EQUIPMENT_REQUEST_REJECTED: 'equipment.requestRejected',

  // ─── 폐기 (Disposal) ───
  DISPOSAL_REQUESTED: 'disposal.requested',
  DISPOSAL_REVIEWED: 'disposal.reviewed',
  DISPOSAL_APPROVED: 'disposal.approved',
  DISPOSAL_REJECTED: 'disposal.rejected',

  // ─── 장비 반입 (Equipment Import) ───
  IMPORT_CREATED: 'equipmentImport.created',
  IMPORT_APPROVED: 'equipmentImport.approved',
  IMPORT_REJECTED: 'equipmentImport.rejected',

  // ─── 소프트웨어 (Software) ───
  SOFTWARE_APPROVED: 'software.approved',
  SOFTWARE_REJECTED: 'software.rejected',

  // ─── 중간점검 (Intermediate Check) ───
  INTERMEDIATE_CHECK_COMPLETED: 'intermediateCheck.completed',

  // ─── 보정계수 (Calibration Factor) ───
  CALIBRATION_FACTOR_APPROVED: 'calibrationFactor.approved',
  CALIBRATION_FACTOR_REJECTED: 'calibrationFactor.rejected',

  // ─── 시스템 ───
  SYSTEM_ANNOUNCEMENT: 'system.announcement',
} as const;

export type NotificationEventName = (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

// ============================================================================
// 이벤트명 → 알림 타입 변환 (SSOT 교차 검증)
// ============================================================================

/**
 * 이벤트명을 notification type (snake_case)으로 변환
 *
 * 변환 규칙:
 *   1. '.' → '_' (도메인 구분자 변환)
 *   2. camelCase → snake_case (NOTIFICATION_TYPE_VALUES 형식에 맞춤)
 *
 * 예시:
 *   'checkout.returnApproved' → 'checkout_return_approved'
 *   'calibrationPlan.submitted' → 'calibration_plan_submitted'
 *   'checkout.created' → 'checkout_created'
 */
function toNotificationType(eventName: string): string {
  return eventName
    .replace(/\./g, '_')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase();
}

/**
 * 사전 검증된 이벤트명 → 알림 타입 매핑
 *
 * 모듈 로드 시점에 NOTIFICATION_TYPE_VALUES(SSOT)와 교차 검증.
 * 불일치 시 즉시 에러 → CI/서버 시작에서 탐지.
 */
export const EVENT_TO_NOTIFICATION_TYPE: Readonly<Record<NotificationEventName, string>> =
  Object.freeze(
    Object.fromEntries(Object.values(NOTIFICATION_EVENTS).map((e) => [e, toNotificationType(e)]))
  ) as Readonly<Record<NotificationEventName, string>>;

// SSOT 교차 검증: 모든 이벤트의 변환 결과가 NOTIFICATION_TYPE_VALUES에 존재하는지 확인
const _validTypes = new Set<string>(NOTIFICATION_TYPE_VALUES);
for (const [event, type] of Object.entries(EVENT_TO_NOTIFICATION_TYPE)) {
  if (!_validTypes.has(type)) {
    throw new Error(
      `SSOT 불일치: 이벤트 '${event}' → 타입 '${type}'이 NOTIFICATION_TYPE_VALUES에 없음. ` +
        `packages/schemas/src/enums/notification.ts에 '${type}'을 추가하세요.`
    );
  }
}

// ============================================================================
// 페이로드 타입
// ============================================================================

/** 모든 이벤트의 공통 페이로드 */
export interface BaseNotificationEvent {
  /** 이벤트 발행자 UUID. 시스템 이벤트는 NOTIFICATION_CONFIG.SYSTEM_ACTOR_ID, 사용자 이벤트는 UUID */
  actorId?: string;
  actorName: string;
  timestamp: Date;
}

/** 반출 관련 이벤트 페이로드 */
export interface CheckoutNotificationEvent extends BaseNotificationEvent {
  checkoutId: string;
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  requesterId: string;
  requesterTeamId: string;
  purpose?: string;
  reason?: string;
}

/** 교정 관련 이벤트 페이로드 */
export interface CalibrationNotificationEvent extends BaseNotificationEvent {
  calibrationId: string;
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  teamId: string;
  reason?: string;
}

/** 부적합 관련 이벤트 페이로드 */
export interface NcNotificationEvent extends BaseNotificationEvent {
  ncId: string;
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  reporterTeamId: string;
  reason?: string;
}

/** 폐기 관련 이벤트 페이로드 */
export interface DisposalNotificationEvent extends BaseNotificationEvent {
  disposalId: string;
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  requesterId: string;
  requesterTeamId: string;
  requesterSite: string;
  reason?: string;
}

/** 장비 반입 관련 이벤트 페이로드 */
export interface ImportNotificationEvent extends BaseNotificationEvent {
  importId: string;
  equipmentId?: string;
  equipmentName: string;
  managementNumber?: string;
  requesterId: string;
  requesterTeamId: string;
  reason?: string;
}

/** 장비 요청 관련 이벤트 페이로드 */
export interface EquipmentRequestNotificationEvent extends BaseNotificationEvent {
  requestId: string;
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  requesterId: string;
  requesterTeamId: string;
  reason?: string;
}

/** 교정계획 관련 이벤트 페이로드 */
export interface CalibrationPlanNotificationEvent extends BaseNotificationEvent {
  planId: string;
  year: number;
  siteId: string;
  teamId: string;
  createdBy: string;
  reason?: string;
}

/** 소프트웨어 관련 이벤트 페이로드 */
export interface SoftwareNotificationEvent extends BaseNotificationEvent {
  softwareHistoryId: string;
  equipmentId: string;
  reason?: string;
}

/** 보정계수 관련 이벤트 페이로드 */
export interface CalibrationFactorNotificationEvent extends BaseNotificationEvent {
  factorId: string;
  equipmentId: string;
  reason?: string;
}

/** 시스템 공지 페이로드 */
export interface SystemNotificationEvent extends BaseNotificationEvent {
  title: string;
  content: string;
  priority?: string;
}

/** 모든 이벤트 페이로드의 유니언 */
export type NotificationEventPayload =
  | CheckoutNotificationEvent
  | CalibrationNotificationEvent
  | CalibrationPlanNotificationEvent
  | NcNotificationEvent
  | DisposalNotificationEvent
  | ImportNotificationEvent
  | EquipmentRequestNotificationEvent
  | SoftwareNotificationEvent
  | CalibrationFactorNotificationEvent
  | SystemNotificationEvent;
