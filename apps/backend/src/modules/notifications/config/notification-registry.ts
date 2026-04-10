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

import {
  Permission,
  type NotificationCategory,
  getApprovalPageUrl,
} from '@equipment-management/shared-constants';
import { type UserRole, ApprovalCategoryValues as AC } from '@equipment-management/schemas';
import { NOTIFICATION_EVENTS } from '../events/notification-events';

// ============================================================================
// 타입 정의
// ============================================================================

// NotificationCategory는 @equipment-management/shared-constants에서 import (SSOT)
export type { NotificationCategory };

/** 알림 수신 범위 */
export type NotificationScope = 'team' | 'site' | 'all';

export type RecipientStrategy =
  | {
      type: 'permission';
      permission: Permission;
      /** 역할별 roleScopes가 없을 때 적용되는 기본 범위 */
      scope: NotificationScope;
      /**
       * 역할별 범위 오버라이드 (SSOT: 역할에 따라 다른 수신 범위 지정)
       *
       * 예시:
       *   roleScopes: { lab_manager: 'site', system_admin: 'all' }
       * → lab_manager는 소속 사이트 전체, system_admin은 전사 범위로 수신
       * → 명시되지 않은 역할은 기본 scope 적용
       * → 'skip': 해당 역할은 이 전략에서 제외 (다른 composite 전략으로 처리 시)
       */
      roleScopes?: Partial<Record<UserRole, NotificationScope | 'skip'>>;
    }
  | { type: 'actor'; field: string }
  | { type: 'team'; field: string }
  | { type: 'composite'; strategies: RecipientStrategy[] };

/** 이메일 템플릿 빌드 결과 */
export interface EmailContent {
  subject: string;
  html: string;
}

/**
 * 이메일 전략
 *
 * - 'immediate': 이벤트 발생 즉시 이메일 발송 (승인 요청/결과)
 * - 'digest': 일간 다이제스트에 포함 (기한 초과/예정 — 스케줄러가 배치 발송)
 * - 'none': 이메일 발송 안 함 (인앱/SSE만)
 */
export type EmailStrategy = 'immediate' | 'digest' | 'none';

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
  /**
   * 이메일 발송 전략 (기본: 'none')
   *
   * 'immediate' → 디스패처가 이벤트 발생 즉시 이메일 발송
   *               (titleTemplate/contentTemplate을 이메일 본문으로 자동 변환)
   * 'digest' → 일간 다이제스트 스케줄러가 배치 발송 (스케줄러가 직접 처리)
   * 'none' → 이메일 발송 안 함
   */
  emailStrategy?: EmailStrategy;
}

// ============================================================================
// 레지스트리 (SSOT)
// ============================================================================

export const NOTIFICATION_REGISTRY: Record<string, NotificationConfig> = {
  // ─── 반출 (Checkout) ───────────────────────────────────────────────────

  [NOTIFICATION_EVENTS.CHECKOUT_CREATED]: {
    category: 'checkout',
    priority: 'high',
    titleTemplate: '반출 승인 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 반출을 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_CHECKOUT,
      scope: 'team',
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.OUTGOING),
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_APPROVED]: {
    category: 'checkout',
    priority: 'medium',
    titleTemplate: '반출 승인 완료: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 반출이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    titleTemplate: '반입 승인 요청: {{equipmentName}}',
    contentTemplate:
      '{{actorName}}님이 {{equipmentName}}({{managementNumber}}) 반입을 요청했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.COMPLETE_CHECKOUT,
      scope: 'team',
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.CHECKOUT_RETURN_APPROVED]: {
    category: 'checkout',
    priority: 'medium',
    titleTemplate: '반입 승인 완료: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 반입이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'requesterId' },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
        {
          type: 'permission',
          permission: Permission.APPROVE_CHECKOUT,
          scope: 'team',
          roleScopes: { lab_manager: 'site', system_admin: 'all' },
        },
      ],
    },
    linkTemplate: '/checkouts/{{checkoutId}}',
    entityType: 'checkout',
    entityIdField: 'checkoutId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'digest',
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
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.CALIBRATION),
    entityType: 'calibration',
    entityIdField: 'calibrationId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.CALIBRATION_APPROVED]: {
    category: 'calibration',
    priority: 'medium',
    titleTemplate: '교정 승인 완료: {{equipmentName}}',
    contentTemplate: '{{equipmentName}}({{managementNumber}}) 교정 기록이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'registeredBy' },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'calibration',
    entityIdField: 'calibrationId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    emailStrategy: 'digest',
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
        {
          type: 'permission',
          permission: Permission.APPROVE_CALIBRATION,
          scope: 'team',
          // technical_manager는 team 전략에서 이미 처리, lab_manager·system_admin만 추가
          roleScopes: {
            technical_manager: 'skip',
            lab_manager: 'site',
            system_admin: 'all',
          },
        },
      ],
    },
    linkTemplate: '/equipment/{{equipmentId}}',
    entityType: 'calibration',
    entityIdField: 'equipmentId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'digest',
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
      // system_admin은 전사 교정계획서를 모니터링
      roleScopes: { system_admin: 'all' },
    },
    linkTemplate: '/calibration-plans?planId={{planId}}',
    entityType: 'calibration_plan',
    entityIdField: 'planId',
    emailStrategy: 'immediate',
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
      roleScopes: { system_admin: 'all' },
    },
    linkTemplate: '/calibration-plans?planId={{planId}}',
    entityType: 'calibration_plan',
    entityIdField: 'planId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.NONCONFORMITY),
    entityType: 'non_conformance',
    entityIdField: 'ncId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.EQUIPMENT),
    entityType: 'equipment_request',
    entityIdField: 'requestId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.DISPOSAL_REVIEW),
    entityType: 'disposal',
    entityIdField: 'disposalId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
      roleScopes: { system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.DISPOSAL_FINAL),
    entityType: 'disposal',
    entityIdField: 'disposalId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
      roleScopes: { lab_manager: 'site', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.INCOMING),
    entityType: 'equipment_import',
    entityIdField: 'importId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
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
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.IMPORT_ORPHAN_DETECTED]: {
    category: 'equipment_import',
    priority: 'high',
    titleTemplate: '반입 orphan 감지: {{equipmentName}}',
    contentTemplate:
      '{{equipmentName}} 반입이 RETURN_REQUESTED 상태에서 고아 상태로 감지되었습니다. 자동 복구를 시도합니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_EQUIPMENT_IMPORT,
      scope: 'all',
    },
    linkTemplate: '/equipment-imports',
    entityType: 'equipment_import',
    entityIdField: 'importId',
    equipmentIdField: 'equipmentId',
    emailStrategy: 'immediate',
  },

  // ─── 소프트웨어 유효성 확인 (Software Validation) ───────────────────────

  [NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED]: {
    category: 'software',
    priority: 'high',
    titleTemplate: '소프트웨어 유효성 확인 제출: {{softwareName}}',
    contentTemplate: '{{actorName}}님이 {{softwareName}} 유효성 확인을 제출했습니다.',
    recipientStrategy: {
      type: 'permission',
      permission: Permission.APPROVE_SOFTWARE_VALIDATION,
      scope: 'site',
      roleScopes: { quality_manager: 'all', system_admin: 'all' },
    },
    linkTemplate: getApprovalPageUrl(AC.SOFTWARE_VALIDATION),
    entityType: 'software_validation',
    entityIdField: 'validationId',
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED]: {
    category: 'software',
    priority: 'medium',
    titleTemplate: '소프트웨어 유효성 확인 승인: {{softwareName}}',
    contentTemplate: '{{softwareName}} 유효성 확인이 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'submittedBy' },
    linkTemplate: '/software/{{testSoftwareId}}',
    entityType: 'software_validation',
    entityIdField: 'validationId',
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_REJECTED]: {
    category: 'software',
    priority: 'high',
    titleTemplate: '소프트웨어 유효성 확인 반려: {{softwareName}}',
    contentTemplate: '{{softwareName}} 유효성 확인이 반려되었습니다. 사유: {{reason}}',
    recipientStrategy: { type: 'actor', field: 'submittedBy' },
    linkTemplate: '/software/{{testSoftwareId}}',
    entityType: 'software_validation',
    entityIdField: 'validationId',
    emailStrategy: 'immediate',
  },

  [NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_QUALITY_APPROVED]: {
    category: 'software',
    priority: 'high',
    titleTemplate: '소프트웨어 유효성 확인 품질 승인: {{softwareName}}',
    contentTemplate: '{{softwareName}} 유효성 확인이 품질책임자에 의해 최종 승인되었습니다.',
    recipientStrategy: { type: 'actor', field: 'submittedBy' },
    linkTemplate: '/software/{{testSoftwareId}}',
    entityType: 'software_validation',
    entityIdField: 'validationId',
    emailStrategy: 'immediate',
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

// ============================================================================
