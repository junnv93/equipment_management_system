/**
 * 선언적 알림 레지스트리 (Declarative Notification Registry)
 *
 * SSOT: 27개 이벤트의 모든 알림 동작을 한 곳에서 선언한다.
 * 새 이벤트 추가 시 코드 변경 없이 이 설정 객체에 한 줄 추가만 필요.
 *
 * 구조:
 * - category: 알림 분류 (프론트엔드 필터, 설정 토글과 매핑)
 * - priority: 알림 우선순위
 * - titleTemplate / contentTemplate: {{변수}} 치환 가능한 메시지 템플릿
 * - recipientStrategy: Permission 기반 수신자 해석 전략
 * - linkTemplate: 프론트엔드 딥링크 ({{변수}} 치환)
 * - entityType / entityIdField: 엔티티 연결 정보
 */

import { Permission, type NotificationCategory } from '@equipment-management/shared-constants';
import { NOTIFICATION_EVENTS } from '../events/notification-events';

// ============================================================================
// 타입 정의
// ============================================================================

// NotificationCategory는 @equipment-management/shared-constants에서 import (SSOT)
export type { NotificationCategory };

export type RecipientStrategy =
  | { type: 'permission'; permission: Permission; scope: 'team' | 'site' | 'all' }
  | { type: 'actor'; field: string }
  | { type: 'team'; field: string }
  | { type: 'composite'; strategies: RecipientStrategy[] };

export interface NotificationConfig {
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high';
  titleTemplate: string;
  contentTemplate: string;
  recipientStrategy: RecipientStrategy;
  linkTemplate: string;
  entityType: string;
  entityIdField: string;
  equipmentIdField?: string;
}

// ============================================================================
// 레지스트리 (SSOT)
// ============================================================================

export const NOTIFICATION_REGISTRY: Record<string, NotificationConfig> = {
  // ─── 반출 (Checkout) ───────────────────────────────────────────────────

  [NOTIFICATION_EVENTS.CHECKOUT_CREATED]: {
    category: 'checkout',
    priority: 'high',
    titleTemplate: '반출 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 반출을 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_CHECKOUT,
      scope: 'team',
    },
    linkTemplate: '/admin/checkout-approvals',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_APPROVED]: {
    category: 'checkout',
    priority: 'medium',
    titleTemplate: '반출 승인: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 반출이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_REJECTED]: {
    category: 'checkout',
    priority: 'high',
    titleTemplate: '반출 반려: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 반출이 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_STARTED]: {
    category: 'checkout',
    priority: 'low',
    titleTemplate: '반출 시작: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 반출이 시작되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_RETURNED]: {
    category: 'checkout',
    priority: 'medium',
    titleTemplate: '반입 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 반입을 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.COMPLETE_CHECKOUT,
      scope: 'team',
    },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED]: {
    category: 'checkout',
    priority: 'medium',
    titleTemplate: '반입 승인: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 반입이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_REJECTED]: {
    category: 'checkout',
    priority: 'high',
    titleTemplate: '반입 반려: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 반입이 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_OVERDUE]: {
    category: 'checkout',
    priority: 'high',
    titleTemplate: '반출 기한 초과: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 반출 기한이 초과되었습니다.',
    recipientStrategy: {
      type: 'composite',
      strategies: [
        { type: 'actor', field: 'requesterId' },
        { type: 'permission', permission: Permission.APPROVE_CHECKOUT, scope: 'team' },
      ],
    },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
  },

  // ─── 교정 (Calibration) ────────────────────────────────────────────────

  [NOTIFICATION_EVENTS.CALIBRATION_CREATED]: {
    category: 'calibration',
    priority: 'high',
    titleTemplate: '교정 승인 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 교정 기록을 등록했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_CALIBRATION,
      scope: 'team',
    },
    linkTemplate: '/admin/calibration-approvals',
    entityType: 'calibration',
    entityIdField: 'calibrationId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_APPROVED]: {
    category: 'calibration',
    priority: 'medium',
    titleTemplate: '교정 승인: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 교정 기록이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'registeredBy' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'calibration',
    entityIdField: 'calibrationId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_REJECTED]: {
    category: 'calibration',
    priority: 'high',
    titleTemplate: '교정 반려: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 교정 기록이 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'registeredBy' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'calibration',
    entityIdField: 'calibrationId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON]: {
    category: 'calibration',
    priority: 'medium',
    titleTemplate: '교정 예정: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 교정이 곧 예정되어 있습니다.',
    recipientStrategy: { type: 'team', field: 'teamId' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'calibration',
    entityIdField: 'equipmentId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_OVERDUE]: {
    category: 'calibration',
    priority: 'high',
    titleTemplate: '교정 기한 초과: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 교정 기한이 초과되어 부적합 처리되었습니다.',
    recipientStrategy: {
      type: 'composite',
      strategies: [
        { type: 'team', field: 'teamId' },
        { type: 'permission', permission: Permission.APPROVE_CALIBRATION, scope: 'team' },
      ],
    },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'calibration',
    entityIdField: 'equipmentId',
    equipmentIdField: 'equipmentId',
  },

  // ─── 교정계획 (Calibration Plan) 3-step ────────────────────────────────

  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_SUBMITTED]: {
    category: 'calibration_plan',
    priority: 'medium',
    titleTemplate: '교정계획서 검토 요청: {{year}}년',
    contentTemplate: '{{actorName}}님이 {{year}}년 교정계획서 검토를 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.REVIEW_CALIBRATION_PLAN,
      scope: 'site',
    },
    linkTemplate: '/calibration-plans?planId={{planId}}',
    entityType: 'calibration_plan',
    entityIdField: 'planId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_REVIEWED]: {
    category: 'calibration_plan',
    priority: 'medium',
    titleTemplate: '교정계획서 검토 완료: {{year}}년',
    contentTemplate: '{{year}}년 교정계획서가 검토 완료되어 최종 승인을 대기합니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_CALIBRATION_PLAN,
      scope: 'site',
    },
    linkTemplate: '/calibration-plans?planId={{planId}}',
    entityType: 'calibration_plan',
    entityIdField: 'planId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_APPROVED]: {
    category: 'calibration_plan',
    priority: 'medium',
    titleTemplate: '교정계획서 최종 승인: {{year}}년',
    contentTemplate: '{{year}}년 교정계획서가 최종 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'createdBy' },
    linkTemplate: '/calibration-plans?planId={{planId}}',
    entityType: 'calibration_plan',
    entityIdField: 'planId',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_PLAN_REJECTED]: {
    category: 'calibration_plan',
    priority: 'high',
    titleTemplate: '교정계획서 반려: {{year}}년',
    contentTemplate: '{{year}}년 교정계획서가 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'createdBy' },
    linkTemplate: '/calibration-plans?planId={{planId}}',
    entityType: 'calibration_plan',
    entityIdField: 'planId',
  },

  // ─── 부적합 (Non-Conformance) ──────────────────────────────────────────

  [NOTIFICATION_EVENTS.NC_CREATED]: {
    category: 'non_conformance',
    priority: 'high',
    titleTemplate: '부적합 등록: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}})에 부적합이 등록되었습니다.',
    recipientStrategy: { type: 'team', field: 'reporterTeamId' },
    linkTemplate: '/equipment/{{equipmentId}}/non-conformance',
    entityType: 'non_conformance',
    entityIdField: 'ncId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.NC_CORRECTED]: {
    category: 'non_conformance',
    priority: 'medium',
    titleTemplate: '조치 완료 승인 요청: {{equipmentName}}',
    contentTemplate: '{{equipmentName}} 부적합 조치가 완료되어 승인을 요청합니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.CLOSE_NON_CONFORMANCE,
      scope: 'team',
    },
    linkTemplate: '/admin/non-conformance-approvals',
    entityType: 'non_conformance',
    entityIdField: 'ncId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.NC_CLOSED]: {
    category: 'non_conformance',
    priority: 'medium',
    titleTemplate: '부적합 종료: {{equipmentName}}',
    contentTemplate: '{{equipmentName}} 부적합이 종료되었습니다.',
    recipientStrategy: { type: 'team', field: 'reporterTeamId' },
    linkTemplate: '/equipment/{{equipmentId}}/non-conformance',
    entityType: 'non_conformance',
    entityIdField: 'ncId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.NC_CORRECTION_REJECTED]: {
    category: 'non_conformance',
    priority: 'high',
    titleTemplate: '조치 반려: {{equipmentName}}',
    contentTemplate: '{{equipmentName}} 부적합 조치가 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'team', field: 'reporterTeamId' },
    linkTemplate: '/equipment/{{equipmentId}}/non-conformance',
    entityType: 'non_conformance',
    entityIdField: 'ncId',
    equipmentIdField: 'equipmentId',
  },

  // ─── 장비 요청 (Equipment Request) ─────────────────────────────────────

  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_CREATED]: {
    category: 'equipment',
    priority: 'medium',
    titleTemplate: '장비 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 장비 요청을 등록했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_EQUIPMENT,
      scope: 'team',
    },
    linkTemplate: '/admin/equipment-approvals',
    entityType: 'equipment_request',
    entityIdField: 'requestId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_APPROVED]: {
    category: 'equipment',
    priority: 'medium',
    titleTemplate: '장비 요청 승인: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 장비 요청이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'equipment_request',
    entityIdField: 'requestId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.EQUIPMENT_REQUEST_REJECTED]: {
    category: 'equipment',
    priority: 'high',
    titleTemplate: '장비 요청 반려: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 장비 요청이 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'equipment_request',
    entityIdField: 'requestId',
    equipmentIdField: 'equipmentId',
  },

  // ─── 폐기 (Disposal) 2단계 ─────────────────────────────────────────────

  [NOTIFICATION_EVENTS.DISPOSAL_REQUESTED]: {
    category: 'disposal',
    priority: 'medium',
    titleTemplate: '폐기 검토 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 폐기를 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.REVIEW_DISPOSAL,
      scope: 'team',
    },
    linkTemplate: '/admin/disposal-approvals',
    entityType: 'disposal',
    entityIdField: 'disposalId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.DISPOSAL_REVIEWED]: {
    category: 'disposal',
    priority: 'medium',
    titleTemplate: '폐기 최종 승인 요청: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 폐기가 검토 완료되어 최종 승인을 요청합니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_DISPOSAL,
      scope: 'site',
    },
    linkTemplate: '/admin/disposal-approvals',
    entityType: 'disposal',
    entityIdField: 'disposalId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.DISPOSAL_APPROVED]: {
    category: 'disposal',
    priority: 'medium',
    titleTemplate: '폐기 승인: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 폐기가 최종 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'disposal',
    entityIdField: 'disposalId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.DISPOSAL_REJECTED]: {
    category: 'disposal',
    priority: 'high',
    titleTemplate: '폐기 반려: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}}({{managementNumber}}) 폐기가 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'disposal',
    entityIdField: 'disposalId',
    equipmentIdField: 'equipmentId',
  },

  // ─── 장비 반입 (Equipment Import) ──────────────────────────────────────

  [NOTIFICATION_EVENTS.IMPORT_CREATED]: {
    category: 'equipment_import',
    priority: 'medium',
    titleTemplate: '반입 요청: {{equipmentName}}',
    contentTemplate: '{{actorName}}님이 {{equipmentName}} 반입을 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_EQUIPMENT_IMPORT,
      scope: 'team',
    },
    linkTemplate: '/admin/equipment-import-approvals',
    entityType: 'equipment_import',
    entityIdField: 'importId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.IMPORT_APPROVED]: {
    category: 'equipment_import',
    priority: 'medium',
    titleTemplate: '반입 승인: {{equipmentName}}',
    contentTemplate: '{{equipmentName}} 반입이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/equipment-imports',
    entityType: 'equipment_import',
    entityIdField: 'importId',
    equipmentIdField: 'equipmentId',
  },

  [NOTIFICATION_EVENTS.IMPORT_REJECTED]: {
    category: 'equipment_import',
    priority: 'high',
    titleTemplate: '반입 반려: {{equipmentName}}',
    contentTemplate: '{{equipmentName}} 반입이 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/equipment-imports',
    entityType: 'equipment_import',
    entityIdField: 'importId',
    equipmentIdField: 'equipmentId',
  },

  // ─── 시스템 ────────────────────────────────────────────────────────────

  [NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT]: {
    category: 'system',
    priority: 'high',
    titleTemplate: '{{title}}',
    contentTemplate: '{{content}}',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.VIEW_NOTIFICATIONS,
      scope: 'all',
    },
    linkTemplate: '/notifications',
    entityType: 'system',
    entityIdField: 'actorId',
  },
};
