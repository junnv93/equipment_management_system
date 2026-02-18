/**
 * Checkout Component Tokens (Layer 3: Component-Specific)
 *
 * 반출입 관리 컴포넌트의 모든 디자인 값을 정의하는 SSOT
 * - 13개 checkout 상태 + 7개 rental import 상태 스타일
 * - Stepper node/connector/label 스타일 (모바일/데스크톱)
 * - Stats card variants (total/pending/overdue/inProgress)
 * - 상세/폼/조건 비교 스타일
 *
 * CRITICAL: CheckoutStatusBadge.tsx 상수 통합, 하드코딩 제거
 */

import { FOCUS_TOKENS } from '../semantic';
import { getTransitionClasses } from '../motion';

// ============================================================================
// 1. Checkout Status Badge Tokens (20개 상태 스타일)
// ============================================================================

/**
 * Checkout 상태 → 스타일 매핑 (WCAG AA 색상 대비 보장: 4.5:1+, light + dark)
 *
 * SSOT: CheckoutStatusBadge.tsx의 CHECKOUT_STATUS_STYLES 이전
 */
export const CHECKOUT_STATUS_BADGE_TOKENS = {
  // 대기 (amber)
  pending:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  // 승인 (blue)
  approved:
    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  // 진행 중 (indigo → teal)
  checked_out:
    'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  lender_checked:
    'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  borrower_received:
    'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
  // 사용 중 (violet)
  in_use:
    'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
  // 반환 진행 (emerald/lime)
  borrower_returned:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  lender_received:
    'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-800',
  // 완료 (green)
  returned:
    'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  return_approved:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  // 거절 (red)
  rejected:
    'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  // 기한 초과 (red 강조)
  overdue:
    'bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  // 취소 (gray)
  canceled:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
} as const;

/**
 * Rental import 상태 → 스타일 매핑 (WCAG AA 색상 대비 보장: 4.5:1+, light + dark)
 *
 * SSOT: CheckoutStatusBadge.tsx의 RENTAL_STATUS_STYLES 이전
 */
export const RENTAL_IMPORT_STATUS_BADGE_TOKENS = {
  // 대기 (amber)
  pending:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  // 승인 (blue)
  approved:
    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  // 거절 (red)
  rejected:
    'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  // 수령 완료 (green)
  received:
    'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  // 반납 진행 중 (orange)
  return_requested:
    'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  // 반납 완료 (green 강조)
  returned:
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  // 취소 (gray)
  canceled:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
} as const;

/**
 * 기본 배지 스타일 (알 수 없는 상태)
 */
export const DEFAULT_CHECKOUT_BADGE =
  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

// ============================================================================
// 2. Checkout Stepper Tokens (진행 표시기)
// ============================================================================

/**
 * Stepper 노드 크기 (모바일/데스크톱)
 *
 * 모바일: 32px (h-8 w-8)
 * 데스크톱: 40px (h-10 w-10)
 */
export const CHECKOUT_STEPPER_TOKENS = {
  node: {
    mobile: 'w-8 h-8',
    desktop: 'w-10 h-10',
  },

  /** 노드 상태별 스타일 (completed/current/pending) */
  status: {
    completed: {
      node: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400',
      label: 'text-green-800 dark:text-green-300',
    },
    current: {
      node: 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
      icon: 'text-blue-600 fill-blue-600 dark:text-blue-400 dark:fill-blue-400',
      label: 'font-medium text-blue-800 dark:text-blue-300',
    },
    pending: {
      node: 'bg-gray-100 dark:bg-gray-800',
      icon: 'text-gray-400',
      label: 'text-gray-500 dark:text-gray-400',
    },
  },

  /** 특수 상태 (rejected/canceled/overdue) */
  special: {
    rejected: {
      container: 'bg-red-100 dark:bg-red-900/30',
      icon: 'text-red-600 dark:text-red-400',
      label: 'text-red-800 dark:text-red-300',
    },
    canceled: {
      container: 'bg-gray-100 dark:bg-gray-800',
      icon: 'text-gray-600 dark:text-gray-400',
      label: 'text-gray-800 dark:text-gray-300',
    },
    overdue: {
      container: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400',
      label: 'text-orange-800 dark:text-orange-300',
    },
  },

  /** 연결선 */
  connector: {
    completed: 'bg-green-400 dark:bg-green-600',
    pending: 'bg-gray-200 dark:bg-gray-700',
  },

  /** 라벨 크기 */
  label: {
    mobile: 'text-sm',
    desktop: 'text-xs',
  },

  /** 아이콘 크기 */
  icon: {
    mobile: 'h-5 w-5',
    desktop: 'h-6 w-6',
    special: 'h-8 w-8',
  },
} as const;

// ============================================================================
// 3. Checkout Stats Variants (통계 카드 4종)
// ============================================================================

/**
 * Checkout 통계 카드 variant별 색상
 *
 * 패턴: DASHBOARD_STATS_VARIANTS 참조 + dark mode 추가
 */
export const CHECKOUT_STATS_VARIANTS = {
  total: {
    /** Hover border */
    hoverBorder: 'hover:border-ul-midnight/30 dark:hover:border-ul-info/30',
    /** Active border (필터 선택 시) */
    activeBorder: 'border-ul-midnight dark:border-ul-info',
    /** Active bg */
    activeBg: 'bg-ul-midnight/10 dark:bg-ul-info/20',
    /** Icon color */
    iconColor: 'text-ul-midnight dark:text-ul-info',
  },
  pending: {
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    activeBorder: 'border-amber-500 dark:border-amber-600',
    activeBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  overdue: {
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-700',
    activeBorder: 'border-red-500 dark:border-red-600',
    activeBg: 'bg-red-50 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  inProgress: {
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    activeBorder: 'border-blue-500 dark:border-blue-600',
    activeBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
} as const;

export type CheckoutStatsVariant = keyof typeof CHECKOUT_STATS_VARIANTS;

/**
 * 통계 카드 클래스 가져오기
 */
export function getCheckoutStatsClasses(
  variant: CheckoutStatsVariant = 'total',
  isActive: boolean = false
): string {
  const config = CHECKOUT_STATS_VARIANTS[variant];
  const baseClasses = 'cursor-pointer border-2';

  if (isActive) {
    return [baseClasses, config.activeBorder, config.activeBg].join(' ');
  }

  return [baseClasses, 'border-transparent', config.hoverBorder].join(' ');
}

// ============================================================================
// 4. Checkout Motion (애니메이션)
// ============================================================================

/**
 * Checkout 컴포넌트 모션 토큰
 *
 * Web Interface Guidelines 준수: specific property transitions, no transition-all
 */
export const CHECKOUT_MOTION = {
  /** 통계 카드: hover 시 border + bg 전환 */
  statsCard: getTransitionClasses('fast', ['border-color', 'background-color']),

  /** 테이블 row hover: 배경색만 전환 */
  rowHover: getTransitionClasses('instant', ['background-color']),

  /** 아이템 hover: 배경색 + 스케일 */
  itemHover: getTransitionClasses('fast', ['background-color', 'transform']),

  /** Chevron 회전 */
  chevronRotate: getTransitionClasses('fast', ['transform']),

  /** Selectable row: 배경색 + 불투명도 + border */
  selectableRow: getTransitionClasses('fast', ['background-color', 'opacity', 'border-color']),
} as const;

// ============================================================================
// 5. Checkout Interaction Tokens (상호작용 요소)
// ============================================================================

/**
 * Checkout 상호작용 토큰
 */
export const CHECKOUT_INTERACTION_TOKENS = {
  /** Group card trigger: hover + instant bg transition */
  groupCardTrigger: [
    'hover:bg-muted/50',
    getTransitionClasses('instant', ['background-color']),
  ].join(' '),

  /** Clickable row: cursor + hover + transition */
  clickableRow: [
    'cursor-pointer',
    'hover:bg-muted/50',
    getTransitionClasses('instant', ['background-color']),
  ].join(' '),

  /** Row focus (focus-visible) */
  rowFocus: FOCUS_TOKENS.classes.default,

  /** Equipment item: border + rounded + hover + transition */
  equipmentItem: [
    'border',
    'rounded-md',
    'hover:bg-muted/50',
    getTransitionClasses('fast', ['background-color']),
  ].join(' '),
} as const;

// ============================================================================
// 6. Checkout Detail Tokens (상세 페이지)
// ============================================================================

/**
 * Checkout 상세 페이지 토큰
 */
export const CHECKOUT_DETAIL_TOKENS = {
  /** 담당자 카드 */
  personCard: 'bg-muted/50 dark:bg-muted/30',

  /** 담당자 아이콘 컨테이너 */
  personIconContainer: 'bg-ul-midnight/10 dark:bg-ul-info/20',

  /** 이상 내용 영역 */
  abnormalContent: 'bg-red-50 dark:bg-red-950/30',

  /** 승인 버튼 */
  approveButton:
    'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white',

  /** 거절 카드 */
  rejectionCard: 'border-red-200 dark:border-red-800',

  /** 거절 제목 */
  rejectionTitle: 'text-red-700 dark:text-red-400',
} as const;

// ============================================================================
// 7. Condition Comparison Tokens (조건 비교)
// ============================================================================

/**
 * 장비 상태 비교 토큰 (반입 시 상태 비교)
 */
export const CONDITION_COMPARISON_TOKENS = {
  /** 악화 (빨강) */
  worsened: 'bg-red-50 dark:bg-red-950/30',

  /** 변경 (노랑) */
  changed: 'bg-yellow-50 dark:bg-yellow-950/30',

  /** 이상 내용 영역 */
  abnormalDetail: 'bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500',

  /** 이상 내용 제목 */
  abnormalTitle: 'text-red-700 dark:text-red-400',

  /** 이상 내용 텍스트 */
  abnormalText: 'text-red-600 dark:text-red-300',
} as const;

// ============================================================================
// 8. Checkout Form Tokens (생성/수정 폼)
// ============================================================================

/**
 * Checkout 폼 토큰
 */
export const CHECKOUT_FORM_TOKENS = {
  /** Selectable row */
  selectableRow: {
    /** Base: transition-all 대신 specific properties */
    base: getTransitionClasses('fast', ['background-color', 'opacity', 'border-color']),

    /** Selected */
    selected: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',

    /** Hoverable (selected 아닐 때) */
    hoverable: [
      'hover:bg-muted/50',
      'cursor-pointer',
      getTransitionClasses('fast', ['background-color']),
      FOCUS_TOKENS.classes.default,
    ].join(' '),

    /** Disabled */
    disabled: 'opacity-50 cursor-not-allowed',
  },

  /** 이상 내용 textarea (focus → focus-visible) */
  abnormalTextarea:
    'focus-visible:border-red-400 focus-visible:ring-red-400 dark:focus-visible:border-red-600 dark:focus-visible:ring-red-600',
} as const;
