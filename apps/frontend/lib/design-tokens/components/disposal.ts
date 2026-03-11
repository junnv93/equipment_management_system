/**
 * Disposal Component Tokens (Layer 3: Component-Specific)
 *
 * 폐기 워크플로우 컴포넌트의 디자인 값 SSOT
 * - Stepper (3단계: 요청 → 검토 → 승인)
 * - Progress Card, Banner
 * - Dialog 공통 스타일
 * - Review Opinion Card
 */

import { FOCUS_TOKENS } from '../semantic';
import { getTransitionClasses } from '../motion';

// ============================================================================
// Disposal Stepper Tokens
// ============================================================================

/**
 * 폐기 진행 스테퍼 스타일 (3-step workflow)
 */
export const DISPOSAL_STEPPER_TOKENS = {
  /** 스텝 노드 크기 */
  node: {
    size: 'h-8 w-8',
    base: 'flex items-center justify-center rounded-full border-2',
  },

  /** 스텝 상태별 스타일 */
  status: {
    completed: 'border-brand-ok bg-brand-ok text-white',
    current: 'border-orange-500 bg-orange-500 text-white',
    pending: 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400',
  },

  /** 스텝 라벨 */
  label: {
    base: 'text-xs font-medium',
    completed: 'text-brand-ok',
    current: 'text-orange-700 dark:text-orange-400',
    pending: 'text-gray-400',
  },

  /** 연결선 */
  connector: {
    base: 'mx-2 h-[2px] w-12',
    completed: 'bg-brand-ok',
    pending: 'bg-gray-200 dark:bg-gray-700',
  },

  /** 아이콘 */
  icon: 'h-4 w-4',
} as const;

// ============================================================================
// Disposal Timeline Tokens (DetailDialog)
// ============================================================================

/**
 * 폐기 타임라인 (상세 다이얼로그 내)
 */
export const DISPOSAL_TIMELINE_TOKENS = {
  /** 타임라인 노드 */
  node: {
    size: 'h-9 w-9',
    base: 'flex shrink-0 items-center justify-center rounded-full border-2',
    completed: 'border-brand-ok bg-brand-ok text-white',
    rejected: 'border-red-500 bg-red-500 text-white',
    pending: 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400',
  },

  /** 연결선 */
  connector: {
    base: 'absolute left-[18px] top-[36px] h-full w-[2px]',
    completed: 'bg-brand-ok',
    pending: 'bg-gray-200 dark:bg-gray-700',
  },

  /** 단계 제목 */
  title: {
    completed: 'text-brand-ok',
    rejected: 'text-red-700 dark:text-red-400',
    pending: 'text-gray-400',
  },

  /** 카드 배경 */
  card: {
    default: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
    rejected: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30',
  },
} as const;

// ============================================================================
// Disposal Card/Banner Tokens
// ============================================================================

/**
 * 폐기 진행 카드 (ProgressCard)
 */
export const DISPOSAL_PROGRESS_CARD_TOKENS = {
  /** 카드 컨테이너 */
  container: 'border-l-4 border-l-orange-500 bg-orange-50 border-orange-200',

  /** 제목 */
  title: 'text-orange-900 font-semibold',

  /** 본문 */
  text: 'text-sm text-orange-800',

  /** 서브텍스트 */
  subtext: 'text-xs text-orange-600',

  /** 상세 보기 버튼 */
  viewButton: 'border-orange-300 text-orange-700 hover:bg-orange-100',

  /** 취소 버튼 */
  cancelButton: 'border-red-300 text-red-700 hover:bg-red-100',
} as const;

/**
 * 폐기 완료 배너 (DisposedBanner)
 */
export const DISPOSAL_BANNER_TOKENS = {
  container: 'border-l-4 border-l-gray-500 bg-gray-100 border-gray-300',
  title: 'text-gray-900 font-semibold',
  text: 'text-sm text-gray-700',
  icon: 'h-5 w-5 text-gray-600',
} as const;

// ============================================================================
// Disposal Button Tokens
// ============================================================================

/**
 * 폐기 버튼 variant 스타일
 */
export const DISPOSAL_BUTTON_TOKENS = {
  /** 폐기 요청 */
  request: 'border-red-500 text-red-600 hover:bg-red-50',

  /** 폐기 완료 (disabled) */
  completed: 'border-gray-300 text-gray-500',

  /** 폐기 진행 중 (드롭다운 트리거) */
  inProgress: 'bg-orange-500 hover:bg-orange-600',

  /** 반려 버튼 */
  reject: 'border-red-300 text-red-700 hover:bg-red-50',

  /** 검토 완료 (파란색) */
  review: 'bg-blue-600 hover:bg-blue-700',

  /** 최종 승인 (초록색) */
  approve: 'bg-brand-ok hover:bg-brand-ok/90',

  /** 폐기 요청 제출 (빨간색) */
  submit: 'bg-red-600 hover:bg-red-700',
} as const;

// ============================================================================
// Disposal Info Card Tokens
// ============================================================================

/**
 * 폐기 정보 카드 (ReviewDialog, ApprovalDialog 내)
 */
export const DISPOSAL_INFO_CARD_TOKENS = {
  /** 기본 정보 카드 */
  container: 'border-blue-200 bg-blue-50',
  title: 'text-sm font-medium text-blue-900',
  label: 'font-medium text-gray-700',
  text: 'text-gray-600',

  /** 반려 안내 영역 */
  rejectNotice: 'rounded-md bg-red-50 border border-red-200 p-3',
  rejectText: 'text-sm text-red-800',

  /** 반려 카운트 */
  rejectCount: 'text-xs text-red-500',
} as const;

// ============================================================================
// Review Opinion Card Tokens
// ============================================================================

/**
 * 검토 의견 카드
 */
export const REVIEW_OPINION_CARD_TOKENS = {
  container: 'border-l-4 border-l-blue-500 bg-blue-50',
  reviewerName: 'text-sm font-semibold text-blue-900',
  timestamp: 'text-xs text-blue-600',
  blockquote: 'border-l-2 border-blue-300 pl-3 text-sm text-gray-700 italic',
} as const;

// ============================================================================
// Form Section Tokens
// ============================================================================

/**
 * 폼 섹션 번호 배지 (1, 2, 3, 4 등)
 */
export const FORM_SECTION_TOKENS = {
  /** 섹션 번호 배지 */
  badge:
    'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium',
} as const;

// ============================================================================
// Disposal File Link Tokens
// ============================================================================

/**
 * 파일 다운로드 링크 (첨부 파일)
 */
export const DISPOSAL_FILE_LINK_TOKENS = {
  base: [
    'flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300',
    FOCUS_TOKENS.classes.default,
    getTransitionClasses('fast', ['color']),
  ].join(' '),
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 스테퍼 노드 상태 클래스 반환
 */
export function getStepperNodeClasses(status: 'completed' | 'current' | 'pending'): string {
  return [
    DISPOSAL_STEPPER_TOKENS.node.base,
    DISPOSAL_STEPPER_TOKENS.node.size,
    DISPOSAL_STEPPER_TOKENS.status[status],
  ].join(' ');
}

/**
 * 스테퍼 라벨 상태 클래스 반환
 */
export function getStepperLabelClasses(status: 'completed' | 'current' | 'pending'): string {
  return [DISPOSAL_STEPPER_TOKENS.label.base, DISPOSAL_STEPPER_TOKENS.label[status]].join(' ');
}

/**
 * 타임라인 노드 상태 클래스 반환
 */
export function getTimelineNodeStatusClasses(status: 'completed' | 'rejected' | 'pending'): string {
  return [
    DISPOSAL_TIMELINE_TOKENS.node.base,
    DISPOSAL_TIMELINE_TOKENS.node.size,
    DISPOSAL_TIMELINE_TOKENS.node[status],
  ].join(' ');
}
