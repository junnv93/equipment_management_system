/**
 * Audit Component Tokens (Layer 3: Component-Specific)
 *
 * 감사로그 컴포넌트의 모든 디자인 값을 정의하는 SSOT
 * - 12개 액션별 배지 스타일 (light + dark mode, WCAG AA)
 * - 테이블/상세/Diff/엔티티 링크/빈 상태/페이지네이션 스타일
 * - Motion system (specific property transitions, no transition-all)
 *
 * CRITICAL: packages/schemas의 AUDIT_ACTION_COLORS를 대체 (deprecated 처리)
 */

import { type AuditAction } from '@equipment-management/schemas';
import { FOCUS_TOKENS } from '../semantic';
import { getTransitionClasses } from '../motion';

// ============================================================================
// 1. Audit Action Badge Tokens (12개 액션 색상)
// ============================================================================

/**
 * 액션별 배지 스타일 (WCAG AA 색상 대비 보장: 4.5:1+, light + dark)
 *
 * SSOT: packages/schemas의 AUDIT_ACTION_COLORS 확장판
 * - Dark mode 추가 (dark:bg-*-900/20 dark:text-*-300)
 * - Border 추가 (light + dark)
 */
export const AUDIT_ACTION_BADGE_TOKENS: Record<AuditAction, string> = {
  // 생성 (blue)
  create:
    'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  // 수정 (yellow)
  update:
    'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  // 삭제 (red)
  delete:
    'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  // 승인 (green)
  approve:
    'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  // 반려 (orange)
  reject:
    'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  // 반출 (purple)
  checkout:
    'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  // 반입 (cyan)
  return:
    'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
  // 취소 (gray)
  cancel:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700',
  // 로그인 (indigo)
  login:
    'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  // 로그아웃 (slate)
  logout:
    'bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  // 종료 (teal)
  close:
    'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
  // 조치 반려 (rose)
  reject_correction:
    'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
};

/**
 * 기본 액션 배지 스타일 (알 수 없는 액션)
 */
export const DEFAULT_AUDIT_ACTION_BADGE =
  'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

// ============================================================================
// 2. Audit Table Tokens (테이블 스타일)
// ============================================================================

/**
 * 감사로그 테이블 스타일
 */
export const AUDIT_TABLE_TOKENS = {
  /** Row hover + focus (interactive) */
  rowInteractive: [
    'cursor-pointer',
    'hover:bg-muted/50',
    getTransitionClasses('instant', ['background-color']),
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** Timestamp column (mono font + tabular-nums) */
  timestamp: 'font-mono text-xs tabular-nums',

  /** IP Address column */
  ipAddress: 'font-mono text-xs text-muted-foreground tabular-nums',

  /** Numeric content (tabular-nums for alignment) */
  numeric: 'tabular-nums',
} as const;

// ============================================================================
// 3. Audit Diff Tokens (변경 사항 Diff Viewer)
// ============================================================================

/**
 * Diff Viewer 스타일 (변경 전후 비교)
 */
export const AUDIT_DIFF_TOKENS = {
  /** 삭제된 값 (빨강) */
  removed: 'bg-red-50 dark:bg-red-950/20',

  /** 추가된 값 (초록) */
  added: 'bg-green-50 dark:bg-green-950/20',

  /** Empty state */
  empty: 'text-center py-8 text-muted-foreground',
} as const;

// ============================================================================
// 4. Audit Entity Link Tokens (엔티티 링크)
// ============================================================================

/**
 * 엔티티 링크 스타일 (EntityLinkCell 컴포넌트)
 */
export const AUDIT_ENTITY_LINK_TOKENS = {
  /** 활성 링크 (hover 포함) */
  link: [
    'text-blue-600 dark:text-blue-400',
    'hover:text-blue-800 dark:hover:text-blue-300',
    'hover:underline',
    getTransitionClasses('fast', ['color']),
  ].join(' '),

  /** 비활성 (라우팅 불가능한 엔티티) */
  inactive: 'text-muted-foreground',
} as const;

// ============================================================================
// 5. Audit Detail Tokens (상세 다이얼로그)
// ============================================================================

/**
 * 감사로그 상세 다이얼로그 스타일
 */
export const AUDIT_DETAIL_TOKENS = {
  /** 코드 블록 배경 (추가 정보 섹션) */
  codeBlock: 'bg-muted/50 dark:bg-muted/30 rounded-md',

  /** Mono font (ID, IP, 메타데이터) */
  mono: 'font-mono text-xs',
} as const;

// ============================================================================
// 6. Audit Empty State Tokens (빈 상태)
// ============================================================================

/**
 * 빈 상태 스타일
 */
export const AUDIT_EMPTY_STATE_TOKENS = {
  /** 전체 컨테이너 */
  container: 'text-center py-12 text-muted-foreground',

  /** 아이콘 */
  icon: 'h-12 w-12 mx-auto mb-4 opacity-50',

  /** 텍스트 */
  text: 'text-sm',
} as const;

// ============================================================================
// 7. Audit Pagination Tokens (페이지네이션)
// ============================================================================

/**
 * 페이지네이션 스타일
 */
export const AUDIT_PAGINATION_TOKENS = {
  /** 페이지 정보 텍스트 (tabular-nums for alignment) */
  info: 'text-sm text-muted-foreground tabular-nums',

  /** 현재 페이지 번호 (tabular-nums for alignment) */
  pageNumber: 'text-sm tabular-nums',
} as const;

// ============================================================================
// 8. Audit Motion (애니메이션)
// ============================================================================

/**
 * 감사로그 모션 토큰
 *
 * Web Interface Guidelines 준수: specific property transitions, no transition-all
 */
export const AUDIT_MOTION = {
  /** 테이블 row hover: 배경색만 전환 */
  rowHover: getTransitionClasses('instant', ['background-color']),

  /** 엔티티 링크 색상 전환 */
  linkColor: getTransitionClasses('fast', ['color']),

  /** 새로고침 버튼 회전 */
  refreshSpin: 'motion-safe:animate-spin',
} as const;
