/**
 * Workflow Panel Tokens (Layer 3: Component-Specific)
 *
 * NextStepPanel 및 FSM 기반 워크플로우 안내 패널의 디자인 SSOT.
 * ELEVATION_TOKENS.surface.floating + SPACING_RHYTHM_TOKENS.comfortable 기반.
 *
 * 소비처: NextStepPanel.tsx, CheckoutGroupCard (다음 단계 인라인 표시)
 * 의존: PR-3 ELEVATION_TOKENS.surface / SPACING_RHYTHM_TOKENS
 */

import { ELEVATION_TOKENS, FOCUS_TOKENS, MICRO_TYPO, SPACING_RHYTHM_TOKENS } from '../semantic';
import { ANIMATION_PRESETS, TRANSITION_PRESETS } from '../motion';
import { getSemanticLeftBorderClasses } from '../brand';

export const WORKFLOW_PANEL_TOKENS = {
  container: {
    base: [
      'rounded-lg border border-border/60 bg-card',
      ELEVATION_TOKENS.surface.floating,
      SPACING_RHYTHM_TOKENS.comfortable.padding,
      TRANSITION_PRESETS.fastBgBorder,
    ].join(' '),
    urgency: {
      normal: getSemanticLeftBorderClasses('info'),
      warning: getSemanticLeftBorderClasses('warning'),
      critical: getSemanticLeftBorderClasses('critical'),
    },
  },

  header: 'flex items-center justify-between mb-2',
  title: 'text-sm font-semibold text-foreground flex items-center gap-2',

  urgencyDot: {
    normal: 'w-2 h-2 rounded-full bg-brand-info',
    warning: `w-2 h-2 rounded-full bg-brand-warning ${ANIMATION_PRESETS.pulse}`,
    critical: `w-2 h-2 rounded-full bg-brand-critical ${ANIMATION_PRESETS.pulse}`,
  },

  hint: 'text-sm text-muted-foreground leading-relaxed',
  actorLabel: `${MICRO_TYPO.label} text-muted-foreground mt-2`,

  action: {
    primary: [
      'mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md',
      'bg-primary text-primary-foreground hover:bg-primary/90',
      TRANSITION_PRESETS.fastBgColor,
      FOCUS_TOKENS.classes.default,
    ].join(' '),
    blocked: [
      'mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md',
      'bg-muted text-muted-foreground cursor-not-allowed',
      FOCUS_TOKENS.classes.default,
    ].join(' '),
  },

  blockedReason: 'text-xs text-muted-foreground italic mt-1',
  terminal: 'text-sm text-muted-foreground text-center py-4',

  /**
   * variant 서브트리 — compact(행 Zone 4 용) / hero(상세 Hero 용)
   * Sprint 4.1: NextStepPanel variant prop의 UI 차별화 토큰
   */
  variant: {
    compact: {
      container: 'flex items-center gap-1.5 px-1.5 py-1 rounded',
      heading: 'sr-only',
      actionButton: [
        'h-6 px-2 text-xs rounded inline-flex items-center gap-1 shrink-0',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        TRANSITION_PRESETS.fastBg,
        FOCUS_TOKENS.classes.default,
      ].join(' '),
    },
    hero: {
      container: [
        ELEVATION_TOKENS.surface.floating,
        'rounded-xl',
        SPACING_RHYTHM_TOKENS.comfortable.padding,
      ].join(' '),
      heading: 'text-lg font-semibold text-foreground',
      actionButton: [
        'mt-4 w-full h-10 px-4 text-sm rounded-md inline-flex items-center justify-center gap-2',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        TRANSITION_PRESETS.fastBg,
        FOCUS_TOKENS.classes.default,
      ].join(' '),
    },
  } satisfies Record<
    'compact' | 'hero',
    { container: string; heading: string; actionButton: string }
  >,

  /**
   * actor 서브트리 — FSM nextActor → 3-way 색 분기 (requester / approver / receiver)
   * Sprint 4.1 V1 S3: 역할별 다음 행동 즉시 구별
   */
  actor: {
    requester: {
      border: getSemanticLeftBorderClasses('info'),
      icon: 'text-brand-info',
      accent: 'bg-brand-info/5',
    },
    approver: {
      border: getSemanticLeftBorderClasses('warning'),
      icon: 'text-brand-warning',
      accent: 'bg-brand-warning/5',
    },
    receiver: {
      border: getSemanticLeftBorderClasses('ok'),
      icon: 'text-brand-ok',
      accent: 'bg-brand-ok/5',
    },
  } satisfies Record<
    'requester' | 'approver' | 'receiver',
    { border: string; icon: string; accent: string }
  >,

  /**
   * overflow 서브트리 — compact variant DropdownMenu 트리거 / 메뉴 토큰
   */
  overflow: {
    trigger: [
      'h-6 w-6 rounded flex items-center justify-center shrink-0',
      'text-muted-foreground hover:text-foreground hover:bg-muted',
      FOCUS_TOKENS.classes.default,
      TRANSITION_PRESETS.fastBg,
    ].join(' '),
    menu: 'min-w-[140px]',
  },
} as const;

export type WorkflowPanelUrgency = keyof typeof WORKFLOW_PANEL_TOKENS.container.urgency;
export type WorkflowPanelActorVariant = keyof typeof WORKFLOW_PANEL_TOKENS.actor;

// ============================================================================
// NEXT_STEP_PANEL_TOKENS — FSM 다음 단계 안내 패널 (NextStepPanel.tsx 전용)
// ============================================================================

/**
 * NextStepPanel 전용 토큰 — FSM currentStepIndex+1 안내에 최적화.
 *
 * container.floating: 모달/드롭다운 수준 강조 (ELEVATION_TOKENS.surface.emphasis 기반)
 * container.inline: 그룹 카드 내 인라인 삽입 (ELEVATION_TOKENS.surface.raised 기반)
 * container.hero: 상세 Hero 영역 강조 (ELEVATION_TOKENS.surface.emphasis 기반, 더 큰 패딩)
 */
export const NEXT_STEP_PANEL_TOKENS = {
  container: {
    floating: `${ELEVATION_TOKENS.surface.emphasis} rounded-lg ${SPACING_RHYTHM_TOKENS.comfortable.padding}`,
    inline: `${ELEVATION_TOKENS.surface.raised} rounded-md ${SPACING_RHYTHM_TOKENS.tight.padding}`,
    compact: `${ELEVATION_TOKENS.surface.raised} rounded px-2 py-1.5`,
    hero: `${ELEVATION_TOKENS.surface.emphasis} rounded-xl ${SPACING_RHYTHM_TOKENS.comfortable.padding}`,
  },

  labels: {
    current: 'text-xs text-muted-foreground uppercase tracking-wide',
    next: 'text-xs text-brand-info uppercase tracking-wide font-medium',
    actor: 'text-xs text-muted-foreground italic',
    hint: 'text-xs text-muted-foreground',
  },

  values: {
    current: 'text-base font-medium',
    next: 'text-xl font-semibold text-brand-info',
  },

  urgency: {
    normal: '',
    warning: 'border-l-4 border-l-brand-warning bg-brand-warning/5',
    critical: `border-l-4 border-l-brand-critical bg-brand-critical/5 ${ANIMATION_PRESETS.pulseSoft}`,
  },

  actionButton: {
    primary: [
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
      'bg-brand-info text-white hover:bg-brand-info/90',
      TRANSITION_PRESETS.fastBg,
      FOCUS_TOKENS.classes.brand,
    ].join(' '),
    secondary: [
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm',
      'border border-border hover:bg-muted',
      TRANSITION_PRESETS.fastBg,
      FOCUS_TOKENS.classes.default,
    ].join(' '),
    ghost:
      'inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground',
  },

  terminal: {
    badge:
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-ok/10 text-brand-ok',
    icon: 'h-3 w-3',
  },
} as const;

export type NextStepPanelUrgency = keyof typeof NEXT_STEP_PANEL_TOKENS.urgency;
export type NextStepPanelContainer = keyof typeof NEXT_STEP_PANEL_TOKENS.container;
