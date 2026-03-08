/**
 * Audit Component Tokens (Layer 3: Component-Specific)
 *
 * 감사로그 컴포넌트의 모든 디자인 값을 정의하는 SSOT
 * - 12개 액션별 배지 스타일 (brand CSS 변수 기반 → 다크모드 자동 지원)
 * - 테이블/상세/Diff/엔티티 링크/빈 상태/페이지네이션 스타일
 * - 필터 바 / 헤더 토큰 (Layer 3 확장)
 * - Motion system (specific property transitions, no transition-all)
 */

import { type AuditAction } from '@equipment-management/schemas';
import { FOCUS_TOKENS } from '../semantic';
import { getTransitionClasses } from '../motion';
import { getSemanticBadgeClasses } from '../brand';

// ============================================================================
// 1. Audit Action Badge Tokens (12개 액션 색상)
// ============================================================================

/**
 * 액션별 배지 스타일
 *
 * brand CSS 변수 기반으로 다크모드를 자동 지원합니다.
 * getSemanticBadgeClasses()는 brand.ts의 CSS 변수를 사용합니다.
 *
 * 4색 체계 (사용자 요청):
 *   CREATE  → ok(초록)
 *   UPDATE  → info(파랑)
 *   DELETE  → critical(빨강)
 *   APPROVE → purple(보라)
 *
 * CRITICAL: 키 이름 변경 금지 (AuditLogDetailDialog, AuditLogsContent 공용)
 */
export const AUDIT_ACTION_BADGE_TOKENS: Record<AuditAction, string> = {
  create: getSemanticBadgeClasses('ok'),
  update: getSemanticBadgeClasses('info'),
  delete: getSemanticBadgeClasses('critical'),
  approve: getSemanticBadgeClasses('purple'),
  reject: getSemanticBadgeClasses('warning'),
  checkout: getSemanticBadgeClasses('purple'),
  return: getSemanticBadgeClasses('ok'),
  cancel: getSemanticBadgeClasses('neutral'),
  login: getSemanticBadgeClasses('info'),
  logout: getSemanticBadgeClasses('neutral'),
  close: getSemanticBadgeClasses('neutral'),
  reject_correction: getSemanticBadgeClasses('critical'),
};

/**
 * 기본 액션 배지 (알 수 없는 액션)
 */
export const DEFAULT_AUDIT_ACTION_BADGE = getSemanticBadgeClasses('neutral');

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

  /** Timestamp column (mono font + tabular-nums + muted color) */
  timestamp: 'font-mono text-xs tabular-nums text-brand-text-muted',

  /** IP Address column */
  ipAddress: 'font-mono text-xs text-brand-text-muted tabular-nums',

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
  container: 'text-center py-16 text-brand-text-muted',

  /** 아이콘 */
  icon: 'h-10 w-10 mx-auto mb-3 opacity-30',

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
  info: 'text-xs text-brand-text-muted tabular-nums font-mono',

  /** 현재 페이지 번호 (tabular-nums for alignment) */
  pageNumber: 'text-xs tabular-nums font-mono text-brand-text-muted',
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

// ============================================================================
// 9. Audit Filter Tokens (필터 바 — 리디자인)
// ============================================================================

/**
 * 감사로그 필터 바 스타일
 *
 * 액션 타입 칩 + 보조 필터(엔티티/날짜/사용자)를 하나의 카드로 통합
 */
export const AUDIT_FILTER_TOKENS = {
  /** 전체 필터 카드 */
  bar: 'p-4 bg-brand-bg-surface border border-brand-border-subtle rounded-lg space-y-3',

  /** 필드 레이블 */
  fieldLabel: 'text-xs font-medium text-brand-text-muted',

  /** 액션 칩 Row */
  actionChipsRow: 'flex flex-wrap gap-1.5',

  /** 보조 필터 Row (날짜, 엔티티, 사용자) */
  secondaryRow: 'flex flex-wrap items-end gap-3 border-t border-brand-border-subtle pt-3',
} as const;

/**
 * 액션 타입 필터 칩 클래스 생성
 *
 * active 상태: elevated 배경 + default 테두리 + primary 텍스트
 * inactive 상태: subtle 테두리 + muted 텍스트 (hover 포함)
 */
export function getAuditActionChipClasses(active: boolean): string {
  const base = [
    'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border',
    getTransitionClasses('instant', ['background-color', 'border-color', 'color']),
    FOCUS_TOKENS.classes.default,
  ].join(' ');

  return active
    ? `${base} bg-brand-bg-elevated border-brand-border-default text-brand-text-primary shadow-sm`
    : `${base} border-brand-border-subtle text-brand-text-muted hover:border-brand-border-default hover:text-brand-text-primary`;
}

// ============================================================================
// 10. Audit Header Tokens (헤더 — 리디자인)
// ============================================================================

/**
 * 감사로그 페이지 헤더 스타일
 */
export const AUDIT_HEADER_TOKENS = {
  /** 헤더 레이아웃 컨테이너 */
  container: 'flex items-start justify-between gap-4',

  /** 제목 그룹 (좌) */
  titleGroup: 'min-w-0',

  /** 페이지 타이틀 */
  title:
    'font-display text-2xl font-semibold tracking-tight text-brand-text-primary flex items-center gap-2',

  /** 스코프 부제목 */
  subtitle: 'flex items-center gap-1.5 text-sm text-brand-text-muted mt-1',

  /** 액션 그룹 (우) */
  actionsGroup: 'flex items-center gap-2 shrink-0',

  /** 총 건수 배지 (mono font + terminal aesthetic) */
  statsBadge:
    'font-mono tabular-nums text-xs bg-brand-bg-elevated border border-brand-border-subtle px-2.5 py-1.5 rounded-md text-brand-text-muted',
} as const;
