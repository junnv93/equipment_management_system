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

import { FOCUS_TOKENS, MOTION_TOKENS } from '../semantic';
import { getStaggerDelay, TRANSITION_PRESETS } from '../motion';
import {
  getSemanticContainerColorClasses,
  getSemanticSolidBgClasses,
  getSemanticLeftBorderClasses,
  getSemanticStatusClasses,
} from '../brand';
import { getElapsedDaysUrgency } from '../visual-feedback';
import type { UrgencyLevel } from '../visual-feedback';

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
    base: `flex items-center justify-center rounded-full border-2 ${TRANSITION_PRESETS.fastColor}`,
  },

  /** 스텝 상태별 스타일 */
  status: {
    /** 완료 (UL Green) */
    completed: 'border-ul-green bg-ul-green text-white',
    /** 진행 중 (UL Blue) */
    current: 'border-ul-blue bg-ul-blue text-white',
    /** 대기 (Gray) */
    pending: 'border-brand-neutral/30 bg-background text-muted-foreground',
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
    pending: 'bg-brand-neutral/20',
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
    approve: getSemanticSolidBgClasses('ok'),
    review: getSemanticSolidBgClasses('info'),
    reject: getSemanticSolidBgClasses('critical'),
  },

  /** 액션별 카드 스타일 (상세 다이얼로그용) */
  card: {
    approved: `border-l-4 ${getSemanticContainerColorClasses('ok')}`,
    rejected: `border-l-4 ${getSemanticContainerColorClasses('critical')}`,
    reviewed: `border-l-4 ${getSemanticContainerColorClasses('info')}`,
    requested: `border-l-4 ${getSemanticContainerColorClasses('neutral')}`,
  },

  /** 연결선 */
  connector: 'border-l-2 border-border ml-3',

  /** 블록 인용 (코멘트) */
  blockquote: 'border-l-2 border-muted-foreground/30 pl-2',

  /** 거절 섹션 상단 보더 (detail-renderers.tsx) */
  rejectionBorder: 'border-t border-destructive/30',
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
  /** 승인 버튼 (UL Green outline) */
  approve: 'border border-ul-green text-ul-green hover:bg-ul-green/10',

  /** 반려 버튼 (UL Red outline) */
  reject: 'border border-ul-red text-ul-red hover:bg-ul-red/10',

  /** 상세 보기 버튼 (Neutral outline) */
  detail: 'border border-border text-foreground hover:bg-muted/80',
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
    TRANSITION_PRESETS.fastShadowTransform,
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

  /** 처리 중 (opacity 감소) — transition 없음 = rollback 시 즉시 복원 */
  processing: 'opacity-40',

  /** 퇴장 애니메이션 (opacity 0 + moderate transition) */
  exiting: `${TRANSITION_PRESETS.moderateOpacity} opacity-0`,

  /** 퇴장 애니메이션 duration (ms) — JS setTimeout용
   *  SSOT: getTransitionClasses('moderate') 와 동일 소스(MOTION_TOKENS) 참조 */
  exitDurationMs: MOTION_TOKENS.transition.moderate.duration,
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
// 12. Approval Row Tokens (컴팩트 로우 — Triage Dashboard)
// ============================================================================

/**
 * 승인 컴팩트 로우 — 카드 대체 (~64px vs ~150px)
 *
 * Desktop: 7-column grid [Checkbox][StatusBar][Summary+Meta][Requester/Team][Date][Elapsed][Actions]
 * Mobile: stacked flex 레이아웃
 */
/** 7-column grid 정의 — 로우, 헤더, 스켈레톤에서 공유 (SSOT) */
export const APPROVAL_ROW_GRID_COLS = 'lg:grid-cols-[32px_4px_1fr_140px_100px_80px_auto]' as const;

export const APPROVAL_ROW_TOKENS = {
  /** 로우 컨테이너 — desktop grid, mobile stacked */
  container: {
    base: 'group relative border-b border-border last:border-b-0',
    desktop: `lg:grid ${APPROVAL_ROW_GRID_COLS} lg:items-center lg:gap-3 lg:px-4 lg:py-3`,
    mobile: 'flex flex-col gap-2 p-4 lg:p-0',
    /** 헤더 행 (컬럼 라벨) */
    header: `hidden lg:grid ${APPROVAL_ROW_GRID_COLS} lg:gap-3 lg:px-4 lg:py-2 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground`,
  },

  /** urgency 기반 행 배경색 (경과일 기반) */
  urgencyBg: {
    info: '',
    warning: 'bg-brand-warning/5',
    critical: 'bg-brand-critical/5',
    emergency: 'bg-brand-critical/10',
  } as Record<UrgencyLevel, string>,

  /** urgency 좌측 보더 (4px 수직 막대) */
  urgencyBorder: {
    info: 'bg-border',
    warning: 'bg-brand-warning',
    critical: 'bg-brand-critical',
    emergency: 'bg-brand-critical',
  } as Record<UrgencyLevel, string>,

  /** 호버 스타일 */
  hover: 'hover:bg-muted/40',

  /** 다단계 인라인 도트 배지 */
  stepBadge: 'text-xs text-muted-foreground font-mono tabular-nums',

  /** 액션 버튼 영역 (desktop: icon-only, mobile: text 포함) */
  actions: {
    container: 'flex items-center gap-1',
    iconButton: 'h-8 w-8 p-0',
  },
} as const;

// ============================================================================
// 13. Approval KPI Strip Tokens (4개 KPI 카드)
// ============================================================================

/**
 * 승인 KPI 스트립 — EQUIPMENT_KPI_STRIP_TOKENS 패턴 참조
 *
 * 4가지 variant: total(blue), urgent(red), avgWait(orange), processed(green)
 */
export const APPROVAL_KPI_STRIP_TOKENS = {
  container: 'grid grid-cols-2 lg:grid-cols-4 gap-3',
  card: {
    base: 'bg-card border border-border rounded-lg p-3 flex items-start gap-3 border-l-4',
    hover: ['hover:shadow-sm', TRANSITION_PRESETS.fastShadowBorder].join(' '),
    focus: FOCUS_TOKENS.classes.default,
  },
  value: 'text-xl font-semibold tabular-nums leading-tight',
  label: 'text-xs text-muted-foreground',
  sub: 'text-[11px] text-muted-foreground/70',
  borderColors: {
    total: getSemanticLeftBorderClasses('info'),
    urgent: getSemanticLeftBorderClasses('critical'),
    avgWait: getSemanticLeftBorderClasses('warning'),
    processed: getSemanticLeftBorderClasses('ok'),
  },
  iconBg: {
    total: getSemanticStatusClasses('info'),
    urgent: getSemanticStatusClasses('critical'),
    avgWait: getSemanticStatusClasses('warning'),
    processed: getSemanticStatusClasses('ok'),
  },
  iconContainer: 'rounded-md p-2 flex-shrink-0',
} as const;

export type ApprovalKpiVariant = keyof typeof APPROVAL_KPI_STRIP_TOKENS.borderColors;

// ============================================================================
// 14. Approval Category Sidebar Tokens
// ============================================================================

/**
 * 카테고리 사이드바 — sticky 네비게이션
 *
 * lg: 이상에서만 표시 (220px)
 */
export const APPROVAL_CATEGORY_SIDEBAR_TOKENS = {
  container: 'w-[220px] flex-shrink-0 sticky top-20 self-start',
  sectionLabel: 'text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-3 py-2',
  item: {
    base: [
      'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm',
      TRANSITION_PRESETS.fastBgColor,
    ].join(' '),
    active: 'bg-primary text-primary-foreground font-medium',
    inactive: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  },
  icon: 'h-4 w-4 flex-shrink-0',
  badge: {
    base: 'ml-auto text-xs font-medium tabular-nums',
    normal: 'text-muted-foreground',
    urgent: 'text-brand-critical font-semibold',
  },
  divider: 'border-t border-border my-2',
} as const;

// ============================================================================
// 15. Approval Mobile Category Bar Tokens
// ============================================================================

/**
 * 모바일 카테고리 가로 스크롤 pill bar (<lg)
 */
export const APPROVAL_MOBILE_CATEGORY_BAR_TOKENS = {
  container: 'flex gap-1.5 overflow-x-auto pb-2 scrollbar-none',
  pill: {
    base: [
      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border',
      TRANSITION_PRESETS.fastBgColorBorder,
    ].join(' '),
    active: 'bg-primary text-primary-foreground border-primary',
    inactive: 'bg-background text-muted-foreground border-border hover:bg-muted',
  },
  sectionDivider: 'w-px bg-border self-stretch mx-1 flex-shrink-0',
  badge: 'text-xs tabular-nums',
} as const;

// ============================================================================
// 16. Approval Detail Panel Tokens (Split View 우측 상세 패널)
// ============================================================================

/**
 * 승인 상세 인라인 패널 — Split View 우측 (xl:+)
 *
 * 모달 대체: 리스트에서 항목 클릭 시 즉시 렌더링.
 * Layer 2 (semantic) + motion preset 참조로 3-Layer 아키텍처 준수.
 *
 * SSOT: ApprovalDetailPanel.tsx 하드코딩 제거
 */
export const APPROVAL_DETAIL_PANEL_TOKENS = {
  /** 패널 최외곽 컨테이너 */
  container: 'flex flex-col h-full overflow-hidden bg-card border-l border-border',

  /** 진입 애니메이션 — APPROVAL_MOTION.listItemEnter 패턴과 일관 */
  contentEnter: `flex flex-col h-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 motion-safe:duration-${MOTION_TOKENS.transition.fast.duration}`,

  /** 헤더 (요약 정보) */
  header: {
    container: 'flex-shrink-0 p-4 border-b border-border space-y-3',
    topRow: 'flex items-center gap-2',
    title: 'text-base font-semibold text-foreground line-clamp-2',
    metaGrid: 'grid grid-cols-3 gap-3',
    /** APPROVAL_INFO_GRID_TOKENS.label 패턴 재사용 */
    metaLabel: APPROVAL_INFO_GRID_TOKENS.label,
    metaValue: 'text-sm font-medium text-foreground',
  },

  /** 스크롤 영역 (본문) */
  body: 'flex-1 overflow-y-auto p-4 space-y-4',

  /** 섹션 (상세 정보 블록) */
  section: {
    container: 'space-y-2',
    title: 'flex items-center gap-2 text-sm font-medium text-foreground',
    titleLine: 'flex-1 h-px bg-border',
  },

  /** 첨부 파일 행 */
  attachment: {
    row: 'flex items-center gap-2 py-1.5',
    icon: `${APPROVAL_INFO_GRID_TOKENS.icon} flex-shrink-0`,
    name: 'text-sm truncate flex-1',
    size: 'text-xs text-muted-foreground tabular-nums',
  },

  /** 하단 고정 액션 영역 */
  footer: {
    container: `flex-shrink-0 flex items-center gap-2 p-4 border-t border-border ${APPROVAL_BULK_BAR_TOKENS.container}`,
    button: 'flex-1 h-9 text-sm font-medium',
  },

  /** 키보드 단축키 배지 */
  kbdBadge:
    'ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border',

  /** 빈 상태 (항목 미선택) — APPROVAL_EMPTY_STATE_TOKENS 패턴 축소판 */
  empty: {
    wrapper: 'flex-1 flex items-center justify-center p-8',
    iconContainer: APPROVAL_EMPTY_STATE_TOKENS.iconContainer
      .replace('w-16 h-16', 'w-12 h-12')
      .replace('mb-4', 'mb-3'),
    icon: APPROVAL_EMPTY_STATE_TOKENS.icon.replace('h-8 w-8', 'h-6 w-6'),
    text: 'text-sm font-medium text-foreground',
    hint: 'text-xs text-muted-foreground mt-1',
  },
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

// ============================================================================
// 11. Approval Elapsed Days Tokens (경과일 시각화)
// ============================================================================

/**
 * 경과일 텍스트 토큰
 *
 * 오래된 건일수록 눈에 띄는 색상으로 표시
 * - info (1-3일): 기본 muted 텍스트
 * - warning (4-7일): 노란색 + font-medium
 * - critical (8일+): 빨간색 + font-semibold
 */
export const APPROVAL_ELAPSED_DAYS_TOKENS: Record<UrgencyLevel, string> & { base: string } = {
  base: 'font-mono tabular-nums text-sm',
  info: 'text-muted-foreground',
  warning: 'text-brand-warning font-medium',
  critical: 'text-brand-critical font-semibold',
  emergency: 'text-brand-critical font-semibold',
} as const;

/**
 * 경과일 텍스트 클래스 반환
 */
export function getElapsedDaysClasses(elapsedDays: number): string {
  const urgency = getElapsedDaysUrgency(elapsedDays);
  return [APPROVAL_ELAPSED_DAYS_TOKENS.base, APPROVAL_ELAPSED_DAYS_TOKENS[urgency]].join(' ');
}
