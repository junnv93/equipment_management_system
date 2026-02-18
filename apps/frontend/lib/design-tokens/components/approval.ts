/**
 * Approval Component Tokens (Layer 3: Component-Specific)
 *
 * 승인관리(Unified Approval) 컴포넌트의 디자인 값 SSOT
 * - 5개 UnifiedApprovalStatus 배지 + 카드 보더
 * - 다단계 승인 Stepper (폐기 2단계, 교정계획 3단계)
 * - 승인 이력 Timeline
 * - 승인/반려 액션 버튼
 * - 탭, 벌크 액션 바, Empty state
 * - 정보 그리드 (요청자/팀/일시)
 */

import { FOCUS_TOKENS } from '../semantic';
import { getStaggerDelay } from '../motion';

// ============================================================================
// 1. Approval Status Badge Tokens
// ============================================================================

/**
 * UnifiedApprovalStatus → 스타일 매핑 (WCAG AA 색상 대비 보장)
 *
 * SSOT: ApprovalItem.tsx, ApprovalDetailModal.tsx의 STATUS_STYLES 통합
 *
 * 5개 상태: pending, pending_review, reviewed, approved, rejected
 */
export const APPROVAL_STATUS_BADGE_TOKENS = {
  /** 대기 (UL Orange) */
  pending: 'bg-ul-orange text-white',
  /** 검토 대기 (UL Orange) */
  pending_review: 'bg-ul-orange text-white',
  /** 검토 완료 (UL Blue) */
  reviewed: 'bg-ul-blue text-white',
  /** 승인 완료 (UL Green) */
  approved: 'bg-ul-green text-white',
  /** 반려 (UL Red) */
  rejected: 'bg-ul-red text-white',
} as const;

/**
 * 카드 왼쪽 보더 색상 매핑 (상태별 시각적 구분)
 *
 * SSOT: ApprovalItem.tsx의 BORDER_COLORS 통합
 */
export const APPROVAL_CARD_BORDER_TOKENS = {
  pending: 'border-l-ul-orange',
  pending_review: 'border-l-ul-orange',
  reviewed: 'border-l-ul-blue',
  approved: 'border-l-ul-green',
  rejected: 'border-l-ul-red',
} as const;

// ============================================================================
// 2. Approval Stepper Tokens (다단계 승인 진행 표시기)
// ============================================================================

/**
 * 다단계 승인 스테퍼 (폐기 2단계, 교정계획 3단계)
 *
 * SSOT: ApprovalStepIndicator.tsx 하드코딩 제거
 * - hex `text-[#0067B1]` → token
 * - gray 하드코딩 → token
 */
export const APPROVAL_STEPPER_TOKENS = {
  /** 스텝 노드 크기 */
  node: {
    size: 'w-8 h-8',
    base: 'flex items-center justify-center rounded-full border-2 transition-colors',
  },

  /** 스텝 상태별 스타일 */
  status: {
    /** 완료 (UL Green) */
    completed: 'border-ul-green bg-ul-green text-white',
    /** 진행 중 (UL Blue) */
    current: 'border-ul-blue bg-ul-blue text-white',
    /** 대기 (Gray) */
    pending: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400',
    /** 반려 (UL Red) */
    rejected: 'border-ul-red bg-ul-red text-white',
  },

  /** 스텝 라벨 */
  label: {
    base: 'text-sm font-medium',
    /** 진행 중 (UL Blue - 기존 hex #0067B1 대체) */
    current: 'text-ul-blue dark:text-ul-info',
    /** 완료/대기 */
    inactive: 'text-muted-foreground',
  },

  /** 연결선 */
  connector: {
    base: 'w-8 h-0.5 mx-2',
    completed: 'bg-ul-green',
    pending: 'bg-gray-200 dark:bg-gray-700',
  },

  /** 아이콘 */
  icon: 'h-4 w-4',

  /** 최소 너비 (단계 정보) */
  infoWidth: 'min-w-[80px]',
} as const;

// ============================================================================
// 3. Approval Timeline Tokens (승인 이력)
// ============================================================================

/**
 * 승인 이력 타임라인
 *
 * SSOT: ApprovalHistoryCard.tsx 하드코딩 제거
 */
export const APPROVAL_TIMELINE_TOKENS = {
  /** 액션별 아이콘 배지 스타일 */
  iconBadge: {
    approve: 'bg-ul-green text-white',
    review: 'bg-ul-blue text-white',
    reject: 'bg-ul-red text-white',
  },

  /** 액션별 카드 스타일 (상세 다이얼로그용) */
  card: {
    approved: 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/30',
    rejected: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/30',
    reviewed: 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/30',
    requested: 'border-l-4 border-l-gray-300 bg-gray-50 dark:bg-gray-800/50',
  },

  /** 연결선 */
  connector: 'border-l-2 border-gray-200 dark:border-gray-700 ml-3',

  /** 블록 인용 (코멘트) */
  blockquote: 'border-l-2 border-gray-300 dark:border-gray-600 pl-2',

  /** 거절 섹션 상단 보더 (detail-renderers.tsx) */
  rejectionBorder: 'border-t border-red-200 dark:border-red-800',
} as const;

// ============================================================================
// 4. Approval Action Button Tokens
// ============================================================================

/**
 * 승인/반려/상세 버튼 variant 스타일
 *
 * SSOT: ApprovalItem, BulkActionBar, ApprovalDetailModal, RejectModal 6곳 중복 제거
 */
export const APPROVAL_ACTION_BUTTON_TOKENS = {
  /** 승인 버튼 (UL Green) */
  approve: 'bg-ul-green hover:bg-ul-green-hover text-white',

  /** 반려 버튼 (UL Red) */
  reject: 'bg-ul-red hover:bg-ul-red-hover text-white',

  /** 상세 보기 버튼 (Outline) */
  detail: 'variant-outline',
} as const;

// ============================================================================
// 5. Approval Tab Tokens
// ============================================================================

/**
 * 승인 카테고리 탭
 *
 * SSOT: ApprovalsClient.tsx 탭 스타일
 */
export const APPROVAL_TAB_TOKENS = {
  /** 탭 리스트 컨테이너 */
  listContainer: 'bg-muted/50',

  /** Active indicator (UL Red 언더라인) */
  activeIndicator: 'data-[state=active]:border-b-2 data-[state=active]:border-ul-red',

  /** 탭 배지 기본 스타일 (count 기반 urgency는 getUrgencyFeedbackClasses 사용) */
  badge: {
    base: 'ml-1 h-5 min-w-5 px-1.5',
  },
} as const;

// ============================================================================
// 6. Approval Bulk Bar Tokens
// ============================================================================

/**
 * 일괄 처리 액션 바
 *
 * SSOT: BulkActionBar.tsx 컨테이너 스타일
 */
export const APPROVAL_BULK_BAR_TOKENS = {
  container: 'bg-muted/30',
} as const;

// ============================================================================
// 7. Approval Info Grid Tokens
// ============================================================================

/**
 * 요청 정보 그리드 (요청자/팀/일시)
 *
 * SSOT: ApprovalItem.tsx 정보 그리드
 */
export const APPROVAL_INFO_GRID_TOKENS = {
  /** 아이콘 컨테이너 */
  iconContainer: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted',

  /** 아이콘 크기 */
  icon: 'h-3.5 w-3.5 text-muted-foreground',

  /** 라벨 */
  label: 'text-muted-foreground',

  /** 값 */
  value: 'font-medium',
} as const;

// ============================================================================
// 8. Approval Empty State Tokens
// ============================================================================

/**
 * 승인 목록 Empty State
 *
 * SSOT: ApprovalList.tsx empty state 패턴
 *
 * 패턴: EQUIPMENT_EMPTY_STATE_TOKENS 참조
 */
export const APPROVAL_EMPTY_STATE_TOKENS = {
  /** 아이콘 컨테이너 */
  iconContainer: 'mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center',

  /** 아이콘 크기 */
  icon: 'h-8 w-8 text-muted-foreground/50',

  /** 텍스트 */
  text: 'text-center text-muted-foreground',
} as const;

// ============================================================================
// 9. Approval Motion (애니메이션)
// ============================================================================

/**
 * 승인 컴포넌트 모션 토큰
 *
 * Web Interface Guidelines 준수: specific property transitions, no transition-all
 */
export const APPROVAL_MOTION = {
  /** 카드 hover: box-shadow + transform */
  cardHover: [
    'motion-safe:transition-[box-shadow,transform]',
    'motion-safe:duration-200',
    'motion-reduce:transition-none',
    'hover:shadow-md',
    'hover:scale-[1.01]',
    'hover:-translate-y-0.5',
  ].join(' '),

  /** 리스트 아이템 stagger delay */
  listStagger: (index: number) => getStaggerDelay(index, 'list'),

  /** 리스트 아이템 진입 애니메이션 */
  listItemEnter: 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2',

  /** 스켈레톤 pulse */
  skeleton: 'motion-safe:animate-pulse',
} as const;

// ============================================================================
// 10. Approval Focus Tokens
// ============================================================================

/**
 * 승인 컴포넌트 focus-visible 토큰
 *
 * WCAG 접근성: focus > focus-visible 우선
 */
export const APPROVAL_FOCUS = {
  /** 카드 focus */
  card: FOCUS_TOKENS.classes.default,

  /** 버튼 focus */
  button: FOCUS_TOKENS.classes.default,
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 승인 상태 배지 클래스 반환
 */
export function getApprovalStatusBadgeClasses(status: string): string {
  return (
    APPROVAL_STATUS_BADGE_TOKENS[status as keyof typeof APPROVAL_STATUS_BADGE_TOKENS] ||
    APPROVAL_STATUS_BADGE_TOKENS.pending
  );
}

/**
 * 카드 왼쪽 보더 클래스 반환
 */
export function getApprovalCardBorderClasses(status: string): string {
  return (
    APPROVAL_CARD_BORDER_TOKENS[status as keyof typeof APPROVAL_CARD_BORDER_TOKENS] ||
    APPROVAL_CARD_BORDER_TOKENS.pending
  );
}

/**
 * 스테퍼 노드 상태 클래스 반환
 */
export function getApprovalStepperNodeClasses(
  stepStatus: 'completed' | 'current' | 'pending' | 'rejected'
): string {
  return [
    APPROVAL_STEPPER_TOKENS.node.base,
    APPROVAL_STEPPER_TOKENS.node.size,
    APPROVAL_STEPPER_TOKENS.status[stepStatus],
  ].join(' ');
}

/**
 * 승인 액션 버튼 클래스 반환
 */
export function getApprovalActionButtonClasses(action: 'approve' | 'reject' | 'detail'): string {
  return APPROVAL_ACTION_BUTTON_TOKENS[action];
}
