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
 * - SOFTWARE_APPROVAL_PAGE_TOKENS: 승인 관리 페이지
 * - SOFTWARE_HISTORY_PAGE_TOKENS: 장비별 이력 페이지
 */

import { TRANSITION_PRESETS } from '../motion';
import {
  getSemanticStatusClasses,
  getSemanticBadgeClasses,
  getSemanticLeftBorderClasses,
  getSemanticContainerColorClasses,
} from '../brand';
import { MICRO_TYPO } from '../semantic';
import { PAGE_HEADER_TOKENS, SUB_PAGE_HEADER_TOKENS } from './page-layout';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 페이지 헤더
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
  /** 반응형 컨테이너 (모바일 세로 → 데스크톱 가로) */
  container: 'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
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
  desc: `${MICRO_TYPO.meta} text-muted-foreground mt-1.5`,
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

// ─────────────────────────────────────────────────────────────────────────────
// 7-a. 가용여부 배지 (available / unavailable)
// ─────────────────────────────────────────────────────────────────────────────

/** UL-QP-18-07 소프트웨어 관리대장 — 가용여부 뱃지 색상 SSOT */
export const SOFTWARE_AVAILABILITY_BADGE_TOKENS: Record<string, string> = {
  available: getSemanticBadgeClasses('ok'),
  unavailable: getSemanticBadgeClasses('critical'),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7-b. 자체 유효성 검증 대상 배지 (requiresValidation)
// ─────────────────────────────────────────────────────────────────────────────

/** O = 검증 대상(ok), X = 비대상(muted) */
export const SOFTWARE_VALIDATION_REQUIRED_BADGE_TOKENS = {
  yes: getSemanticBadgeClasses('ok'),
  no: 'border rounded-md px-2 py-0.5 text-xs font-medium border-border text-muted-foreground',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 8. 승인 관리 페이지 (admin/software-approvals)
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_APPROVAL_PAGE_TOKENS = {
  /** 페이지 컨테이너 */
  container: 'container mx-auto py-6 space-y-6',

  /** 페이지 헤더 — PAGE_HEADER_TOKENS 기반 (리스트 페이지) */
  header: {
    title: PAGE_HEADER_TOKENS.title,
    subtitle: PAGE_HEADER_TOKENS.subtitle,
  },

  /** 변경 요청 카드 */
  card: {
    base: ['border-l-4', getSemanticLeftBorderClasses('warning')].join(' '),
    content: 'pt-6',
    layout: 'flex items-start justify-between',
    body: 'flex-1 space-y-4',
  },

  /** 카드 헤더 영역 (배지 + 이름 + 링크) */
  cardHeader: {
    container: 'flex items-center gap-4',
    name: 'text-sm font-medium text-foreground',
    link: ['text-sm text-primary hover:underline', TRANSITION_PRESETS.fastColor].join(' '),
  },

  /** 카드 정보 그리드 */
  infoGrid: {
    container: 'grid grid-cols-2 md:grid-cols-4 gap-4 text-sm',
    item: 'flex items-center gap-2',
    icon: 'h-4 w-4 text-muted-foreground flex-shrink-0',
    label: 'text-muted-foreground',
    value: 'font-medium',
    monoValue: 'font-medium font-mono text-xs',
  },

  /** 검증 기록 박스 */
  verificationBox: {
    container: 'p-4 bg-muted rounded-lg',
    header: 'flex items-center gap-2 mb-2',
    headerIcon: 'h-4 w-4 text-muted-foreground',
    headerText: 'text-sm font-medium',
    content: 'text-sm whitespace-pre-wrap',
  },

  /** 메타 정보 */
  meta: 'text-xs text-muted-foreground',

  /** 액션 버튼 영역 */
  actions: 'flex gap-2 ml-4',

  /** 다이얼로그 요약 박스 */
  dialogSummary: 'p-4 bg-muted rounded-lg space-y-2',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 9. 장비별 소프트웨어 이력 페이지 (equipment/[id]/software)
// ─────────────────────────────────────────────────────────────────────────────

export const SOFTWARE_HISTORY_PAGE_TOKENS = {
  /** 페이지 컨테이너 */
  container: 'container mx-auto py-6 space-y-6',

  /** 네비게이션 */
  nav: {
    container: 'flex items-center gap-4',
    backIcon: 'h-4 w-4 mr-2',
  },

  /** 헤더 — SUB_PAGE_HEADER_TOKENS 기반 (서브 페이지) */
  header: {
    container: 'flex items-center justify-between',
    title: SUB_PAGE_HEADER_TOKENS.title,
    subtitle: SUB_PAGE_HEADER_TOKENS.subtitle,
  },

  /** 현재 소프트웨어 정보 카드 */
  currentInfo: {
    grid: 'grid grid-cols-2 md:grid-cols-4 gap-4',
    label: 'text-sm text-muted-foreground',
    value: 'font-medium',
  },

  /** 이력 테이블 */
  table: {
    wrapper: 'rounded-lg border border-border overflow-hidden',
    row: [
      'border-b border-border last:border-b-0',
      TRANSITION_PRESETS.fastBg,
      'hover:bg-muted/30',
    ].join(' '),
    cellName: 'font-medium',
    versionBadge: 'flex items-center gap-2',
    statusCell: 'flex items-center gap-2',
    truncatedCell: 'max-w-xs truncate',
  },

  /** 빈 상태 */
  emptyState: {
    container: 'text-center py-12 text-muted-foreground',
    icon: 'h-12 w-12 mx-auto mb-4 opacity-50',
    text: 'text-muted-foreground',
  },

  /** 로딩 스켈레톤 */
  skeleton: {
    container: 'container mx-auto py-6 space-y-6',
  },

  /** 상태 아이콘 색상 */
  statusIcon: {
    approved: 'h-4 w-4 text-brand-ok',
    rejected: 'h-4 w-4 text-brand-critical',
    pending: 'h-4 w-4 text-brand-warning',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 10. 중간점검 알림 (IntermediateCheckAlert)
// ─────────────────────────────────────────────────────────────────────────────

/** 중간점검 상태별 시각 피드백 토큰 */
export const INTERMEDIATE_CHECK_STATUS_TOKENS = {
  overdue: {
    alertClass: ['border-brand-critical', getSemanticContainerColorClasses('critical')].join(' '),
    badgeClass: getSemanticStatusClasses('critical'),
    iconClass: 'text-brand-critical',
  },
  today: {
    alertClass: ['border-brand-repair', getSemanticContainerColorClasses('repair')].join(' '),
    badgeClass: getSemanticStatusClasses('repair'),
    iconClass: 'text-brand-repair',
  },
  upcoming: {
    alertClass: ['border-brand-warning', getSemanticContainerColorClasses('warning')].join(' '),
    badgeClass: getSemanticStatusClasses('warning'),
    iconClass: 'text-brand-warning',
  },
  future: {
    alertClass: ['border-brand-info/40', getSemanticContainerColorClasses('info')].join(' '),
    badgeClass: getSemanticStatusClasses('info'),
    iconClass: 'text-brand-info',
  },
} as const;

export type IntermediateCheckStatusKey = keyof typeof INTERMEDIATE_CHECK_STATUS_TOKENS;
