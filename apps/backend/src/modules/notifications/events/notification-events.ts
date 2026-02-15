/**
 * 도메인 이벤트 상수 + 페이로드 타입
 *
 * SSOT: 모든 이벤트명은 여기서 정의하고, NOTIFICATION_REGISTRY에서 참조한다.
 * 이벤트명 포맷: {domain}.{action} (예: checkout.created)
 */

// ============================================================================
// 이벤트 상수 (27개 + batch variants)
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

  // ─── 시스템 ───
  SYSTEM_ANNOUNCEMENT: 'system.announcement',
} as const;

export type NotificationEventName = (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

// ============================================================================
// 페이로드 타입
// ============================================================================

/** 모든 이벤트의 공통 페이로드 */
export interface BaseNotificationEvent {
  actorId: string;
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
  | SystemNotificationEvent;
