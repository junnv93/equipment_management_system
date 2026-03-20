import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 공용장비 출처 열거형
 *
 * 표준 값 (소문자 + 언더스코어):
 * - safety_lab: Safety Lab 등 사내 공용장비 (legacy)
 * - external: 외부 기관 보유 장비 (렌탈)
 * - internal_shared: 내부 공용장비 (통합 반입 프로세스용)
 */
export const SHARED_SOURCE_VALUES = [
  'safety_lab', // Safety Lab 등 사내 공용장비 (legacy)
  'external', // 외부 기관 보유 장비 (렌탈)
  'internal_shared', // 내부 공용장비 (통합 반입 프로세스용)
] as const;

export const SharedSourceEnum = z.enum(SHARED_SOURCE_VALUES as readonly [string, ...string[]]);
export type SharedSource = z.infer<typeof SharedSourceEnum>;

// ============================================================================
// 정렬 순서 (공통)
// ============================================================================

export const SORT_ORDER_VALUES = ['asc', 'desc'] as const;
export const SortOrderEnum = z.enum(SORT_ORDER_VALUES);
export type SortOrder = z.infer<typeof SortOrderEnum>;

// NOTE: AttachmentTypeEnum/AttachmentType는 equipment-attachment.ts에서 정의 (SSOT)
// 여기서 재정의 금지 — 중복 export 충돌 발생

export const ATTACHMENT_TYPE_VALUES = ['inspection_report', 'history_card', 'other'] as const;

// AttachmentType re-import for LABELS 참조만 가능
import type { AttachmentType as _AttachmentType } from '../equipment-attachment';

export const ATTACHMENT_TYPE_LABELS: Record<_AttachmentType, string> = {
  inspection_report: '검수보고서',
  history_card: '이력카드',
  other: '기타',
};

/**
 * SINGLE SOURCE OF TRUTH: 사용자 상태 열거형
 *
 * 표준 상태값 (소문자):
 * - active: 활성
 * - inactive: 비활성
 * - pending: 승인 대기
 */
export const USER_STATUS_VALUES = ['active', 'inactive', 'pending'] as const;

export const UserStatusEnum = z.enum(USER_STATUS_VALUES as readonly [string, ...string[]]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

// ============================================================================
// 승인 액션 (approve/reject — 공통)
// ============================================================================

export const APPROVAL_ACTION_VALUES = ['approve', 'reject'] as const;
export const ApprovalActionEnum = z.enum(APPROVAL_ACTION_VALUES);
export type ApprovalAction = z.infer<typeof ApprovalActionEnum>;

// ============================================================================
// 보고서 형식/기간
// ============================================================================

export const REPORT_FORMAT_VALUES = ['excel', 'csv', 'pdf'] as const;
export const ReportFormatEnum = z.enum(REPORT_FORMAT_VALUES);
export type ReportFormat = z.infer<typeof ReportFormatEnum>;

export const REPORT_PERIOD_VALUES = ['week', 'month', 'quarter', 'year'] as const;
export const ReportPeriodEnum = z.enum(REPORT_PERIOD_VALUES);
export type ReportPeriod = z.infer<typeof ReportPeriodEnum>;
