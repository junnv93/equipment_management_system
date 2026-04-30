/**
 * approvals 도메인 공개 타입 + 상수 + Zod 스키마 SSOT
 *
 * 의존성 방향: 이 파일은 외부 API 모듈을 import하지 않는다.
 * @equipment-management/schemas, shared-constants, zod 만 허용.
 */

import { z } from 'zod';
import { VALIDATION_RULES, ROLE_APPROVAL_CATEGORIES } from '@equipment-management/shared-constants';
import {
  type UserRole,
  type UnifiedApprovalStatus,
  type ApprovalCategory,
} from '@equipment-management/schemas';

// ============================================================================
// 통합 승인 상태 타입
// ✅ SSOT: UnifiedApprovalStatus는 @equipment-management/schemas에서 import
export type { UnifiedApprovalStatus };

// ============================================================================
// 승인 카테고리 정의
// ✅ SSOT: ApprovalCategory는 @equipment-management/schemas에서 import
export type { ApprovalCategory };

/**
 * 역할별 탭 설정
 * SSOT: 백엔드 ApprovalsService의 getPendingCountsByRole과 동기화
 */
// ✅ SSOT: ROLE_APPROVAL_CATEGORIES는 shared-constants에서 import
export const ROLE_TABS: Record<UserRole, readonly ApprovalCategory[]> = ROLE_APPROVAL_CATEGORIES;

/**
 * 탭 메타 정보
 *
 * SSOT: 아이콘, 라벨, 승인 시 코멘트 필수 여부의 단일 소스
 */
export interface TabMeta {
  /** i18n 키 — t(labelKey) with useTranslations('approvals') */
  labelKey: string;
  /** lucide-react 아이콘 이름 */
  icon: string;
  /** i18n 키 — 승인/검토 버튼 라벨 */
  actionKey: string;
  /** 승인 시 코멘트 입력 필수 여부 (기본 false) */
  commentRequired?: boolean;
  /** i18n 키 — 코멘트 다이얼로그 제목 (commentRequired일 때 사용) */
  commentDialogTitleKey?: string;
  /** i18n 키 — 코멘트 placeholder (commentRequired일 때 사용) */
  commentPlaceholderKey?: string;
  /** 총 승인 단계 수 — SSOT (1=단일 승인, 2=disposal, 3=calibration_plan) */
  totalApprovalSteps: number;
  /** 다단계 승인 타입 — StepIndicator의 type 파라미터 (totalApprovalSteps > 1일 때만 유효) */
  multiStepType?: 'disposal' | 'calibration_plan';
  /** 반려 가능 여부 — false면 반려 버튼 미표시 + API hard-throw 차단 (AR-8) */
  canReject?: boolean;
  /** 사이드바 섹션 그룹핑 */
  section: ApprovalSection;
}

// ============================================================================
// 승인 섹션 정의 (사이드바 카테고리 그룹핑)
// ============================================================================

export type ApprovalSection = 'checkout' | 'equipment' | 'management';

export const APPROVAL_SECTIONS = {
  checkout: { labelKey: 'sections.checkout', order: 0 },
  equipment: { labelKey: 'sections.equipment', order: 1 },
  management: { labelKey: 'sections.management', order: 2 },
} as const;

// ============================================================================
// 매직넘버 상수화
// ============================================================================

/** 반려 사유 최소 글자 수 — SSOT: shared-constants/validation-rules */
export const REJECTION_MIN_LENGTH = VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH;
/** 반려 사유 최대 글자 수 — SSOT: shared-constants/validation-rules.LONG_TEXT_MAX_LENGTH */
export const REJECTION_MAX_LENGTH = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH;

/**
 * 반려 사유 검증 Zod 스키마 (SSOT)
 *
 * defense in depth: backend 동일 규칙(REJECTION_MIN_LENGTH) SSOT 적용.
 */
export const RejectReasonSchema = z
  .string()
  .min(REJECTION_MIN_LENGTH, `반려 사유는 ${REJECTION_MIN_LENGTH}자 이상 입력해주세요.`)
  .max(REJECTION_MAX_LENGTH, `반려 사유는 ${REJECTION_MAX_LENGTH}자 이내로 입력해주세요.`);

export const TAB_META: Record<ApprovalCategory, TabMeta> = {
  // Direction-based (checkout section)
  outgoing: {
    labelKey: 'tabMeta.outgoing.label',
    icon: 'ArrowUpFromLine',
    actionKey: 'tabMeta.outgoing.action',
    totalApprovalSteps: 1,
    section: 'checkout',
  },
  incoming: {
    labelKey: 'tabMeta.incoming.label',
    icon: 'ArrowDownToLine',
    actionKey: 'tabMeta.incoming.action',
    totalApprovalSteps: 1,
    section: 'checkout',
  },

  // Equipment section
  equipment: {
    labelKey: 'tabMeta.equipment.label',
    icon: 'Package',
    actionKey: 'tabMeta.equipment.action',
    totalApprovalSteps: 1,
    section: 'equipment',
  },
  calibration: {
    labelKey: 'tabMeta.calibration.label',
    icon: 'FileCheck',
    actionKey: 'tabMeta.calibration.action',
    totalApprovalSteps: 1,
    section: 'equipment',
  },
  inspection: {
    labelKey: 'tabMeta.inspection.label',
    icon: 'ClipboardCheck',
    actionKey: 'tabMeta.inspection.action',
    totalApprovalSteps: 1,
    canReject: false, // AR-8: 점검 항목은 반려 불가 — backend도 hard-throw
    section: 'equipment',
  },
  self_inspection: {
    labelKey: 'tabMeta.self_inspection.label',
    icon: 'ClipboardList',
    actionKey: 'tabMeta.self_inspection.action',
    totalApprovalSteps: 1,
    canReject: true,
    section: 'equipment',
  },
  nonconformity: {
    labelKey: 'tabMeta.nonconformity.label',
    icon: 'AlertTriangle',
    actionKey: 'tabMeta.nonconformity.action',
    totalApprovalSteps: 1,
    section: 'equipment',
  },

  // Management section
  disposal_review: {
    labelKey: 'tabMeta.disposal_review.label',
    icon: 'Trash2',
    actionKey: 'tabMeta.disposal_review.action',
    commentRequired: true,
    commentDialogTitleKey: 'tabMeta.disposal_review.commentDialogTitle',
    commentPlaceholderKey: 'tabMeta.disposal_review.commentPlaceholder',
    totalApprovalSteps: 2,
    multiStepType: 'disposal',
    section: 'management',
  },
  disposal_final: {
    labelKey: 'tabMeta.disposal_final.label',
    icon: 'Trash2',
    actionKey: 'tabMeta.disposal_final.action',
    totalApprovalSteps: 2,
    multiStepType: 'disposal',
    section: 'management',
  },
  plan_review: {
    labelKey: 'tabMeta.plan_review.label',
    icon: 'Calendar',
    actionKey: 'tabMeta.plan_review.action',
    totalApprovalSteps: 3,
    multiStepType: 'calibration_plan',
    section: 'management',
  },
  plan_final: {
    labelKey: 'tabMeta.plan_final.label',
    icon: 'Calendar',
    actionKey: 'tabMeta.plan_final.action',
    totalApprovalSteps: 3,
    multiStepType: 'calibration_plan',
    section: 'management',
  },
  software_validation: {
    labelKey: 'tabMeta.software_validation.label',
    icon: 'Code',
    actionKey: 'tabMeta.software_validation.action',
    // AR-14: backend approveValidationSchema에 approvalComment 추가 완료 (2026-04-27).
    commentRequired: true,
    commentDialogTitleKey: 'tabMeta.software_validation.commentDialogTitle',
    commentPlaceholderKey: 'tabMeta.software_validation.commentPlaceholder',
    totalApprovalSteps: 1,
    section: 'management',
  },
};

// ============================================================================
// 승인 항목 인터페이스
// ============================================================================

export interface ApprovalHistoryEntry {
  step: number;
  action: 'review' | 'approve' | 'reject';
  actorId: string;
  actorName: string;
  actorRole: string;
  actionAt: string;
  comment?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * 구조화된 summary 데이터 (i18n용)
 *
 * 컴포넌트에서 t() 함수로 로컬라이즈된 summary를 생성할 때 사용.
 */
export type ApprovalSummaryData =
  | { type: 'calibration'; equipmentId: string }
  | { type: 'checkout'; equipmentNames: string; direction: 'outgoing' | 'incoming' }
  | { type: 'calibration_plan'; year: string; siteId: string }
  | { type: 'equipment_request'; equipmentName: string; requestType: string }
  | { type: 'disposal'; equipmentName: string; managementNumber: string; step: 'review' | 'final' }
  | { type: 'software_validation'; softwareName: string }
  | { type: 'inspection'; equipmentName: string }
  | { type: 'self_inspection'; equipmentName: string }
  | { type: 'non_conformance'; cause: string }
  | {
      type: 'equipment_import';
      equipmentName: string;
      sourceType: 'rental' | 'internal_shared';
      vendorOrDepartment: string;
    };

export interface ApprovalItem {
  id: string;
  category: ApprovalCategory;
  status: UnifiedApprovalStatus;
  requesterId: string;
  requesterName: string;
  requesterTeam: string;
  /** 신청자 사이트 코드 — 소속 표시 시 site/team 형식 결합용 */
  requesterSite?: string;
  requestedAt: string;
  summary: string;
  /** 구조화된 summary 데이터 — getLocalizedSummary()에서 i18n 렌더링용 */
  summaryData?: ApprovalSummaryData;
  details: Record<string, unknown>;
  attachments?: Attachment[];
  approvalHistory?: ApprovalHistoryEntry[];
  originalData?: unknown;
}

/**
 * 카테고리별 대기 개수
 * SSOT: 백엔드 ApprovalsService의 PendingCountsByCategory와 동기화
 */
export interface PendingCountsByCategory {
  outgoing: number;
  incoming: number;
  equipment: number;
  calibration: number;
  inspection: number;
  self_inspection: number;
  nonconformity: number;
  disposal_review: number;
  disposal_final: number;
  plan_review: number;
  plan_final: number;
  software_validation: number;
}

export interface ApprovalKpiResponse {
  /** 오늘 현재 사용자가 처리(승인+반려)한 건수 */
  todayProcessed: number;
  /** 현재 카테고리에서 URGENT_THRESHOLD_DAYS 이상 경과한 건수 (서버 집계) */
  urgentCount: number;
  /** 현재 카테고리 평균 대기일 (서버 집계) */
  avgWaitDays: number;
}

export interface BulkActionResult {
  success: string[];
  failed: string[];
}

/** 장비 요청 유형 키 — i18n에서 requestTypes.* 키와 매칭 */
export const REQUEST_TYPES = ['create', 'update', 'delete'] as const;
