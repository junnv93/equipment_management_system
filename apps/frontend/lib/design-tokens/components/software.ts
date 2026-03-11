/**
 * Software 컴포넌트 Design Token
 *
 * Layer 3 (Component): 즉시 사용 가능한 클래스 조합
 * Layer 2 (Semantic) 참조: INTERACTIVE_TOKENS, MOTION_TOKENS, FOCUS_TOKENS
 *
 * SSOT 역할:
 * - SOFTWARE_STATS_TOKENS: 통계 카드 (3개)
 * - SOFTWARE_SUMMARY_TOKENS: 소프트웨어별 현황 그리드
 * - SOFTWARE_TABLE_TOKENS: 관리대장 테이블
 * - SOFTWARE_SEARCH_TOKENS: 검색 바
 * - SOFTWARE_EMPTY_STATE_TOKENS: 빈 상태
 */

import { TRANSITION_PRESETS } from '../motion';
import { getSemanticStatusClasses } from '../brand';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 페이지 헤더
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_HEADER_TOKENS = {
  container: 'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
  title: 'text-2xl font-bold tracking-tight text-foreground',
  subtitle: 'text-sm text-muted-foreground',
  createBtn: [
    'inline-flex items-center gap-2',
    'bg-primary text-primary-foreground',
    'hover:bg-primary/90',
    TRANSITION_PRESETS.fastBg,
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  ].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. 통계 카드 (3개)
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_STATS_TOKENS = {
  grid: 'grid grid-cols-1 sm:grid-cols-3 gap-4',

  card: {
    base: [
      'relative overflow-hidden rounded-lg border border-border bg-card p-4',
      TRANSITION_PRESETS.fastShadowBorder,
      'hover:shadow-sm hover:border-border/80',
    ].join(' '),
  },

  iconContainer: 'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
  iconBg: {
    equipment: getSemanticStatusClasses('info'),
    types: getSemanticStatusClasses('purple'),
    updated: getSemanticStatusClasses('ok'),
  } as Record<string, string>,

  label: 'text-xs text-muted-foreground font-medium',
  value: 'text-2xl font-bold tabular-nums text-foreground leading-none mt-1',
  desc: 'text-[11px] text-muted-foreground mt-1.5',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. 소프트웨어별 현황 그리드
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_SUMMARY_TOKENS = {
  section: 'space-y-3',
  sectionHeader: 'flex items-center justify-between',
  sectionTitle: 'text-base font-semibold text-foreground',
  sectionDesc: 'text-xs text-muted-foreground',

  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',

  card: {
    base: [
      'flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card',
      'cursor-pointer',
      TRANSITION_PRESETS.fastBgShadow,
      'hover:bg-muted/50 hover:shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    ].join(' '),
  },

  cardIcon: 'h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0',
  cardIconText: 'text-primary text-xs font-bold',

  cardInfo: 'flex-1 min-w-0',
  cardName: 'text-sm font-semibold text-foreground truncate',
  cardMeta: 'flex items-center gap-2 mt-0.5',
  cardCount: 'text-xs text-muted-foreground',
  cardVersion: 'text-xs font-mono text-muted-foreground tabular-nums',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. 검색 바
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_SEARCH_TOKENS = {
  container: 'flex items-center gap-3',
  inputWrapper: 'relative flex-1 max-w-sm',
  inputIcon:
    'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
  input: [
    'w-full pl-9 pr-3 h-9 rounded-md border border-input bg-transparent',
    'text-sm placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5. 관리대장 테이블
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_TABLE_TOKENS = {
  wrapper: 'rounded-lg border border-border overflow-hidden',
  table: 'w-full',

  headerRow: 'bg-muted/50 border-b border-border',
  headerCell:
    'px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider',

  bodyRow: [
    'border-b border-border last:border-b-0',
    TRANSITION_PRESETS.fastBg,
    'hover:bg-muted/30',
  ].join(' '),
  bodyCell: 'px-4 py-3 text-sm text-foreground',

  equipmentName: 'font-medium text-foreground',
  softwareName: 'font-mono text-xs',
  version: 'font-mono text-xs tabular-nums text-muted-foreground',
  date: 'text-xs text-muted-foreground tabular-nums',

  actionBtn: [
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium',
    'text-primary hover:bg-primary/10',
    TRANSITION_PRESETS.fastBg,
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
  ].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. 빈 상태
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_EMPTY_STATE_TOKENS = {
  container: 'flex flex-col items-center justify-center py-16 text-center',
  icon: 'h-12 w-12 text-muted-foreground/30 mb-4',
  title: 'text-base font-semibold text-muted-foreground',
  desc: 'text-sm text-muted-foreground/70 mt-1 max-w-[300px]',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7. 승인 상태 배지
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_APPROVAL_BADGE_TOKENS: Record<string, string> = {
  pending: getSemanticStatusClasses('warning'),
  approved: getSemanticStatusClasses('ok'),
  rejected: getSemanticStatusClasses('critical'),
} as const;
