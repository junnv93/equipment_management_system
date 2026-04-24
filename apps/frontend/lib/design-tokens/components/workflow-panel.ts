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
import { TRANSITION_PRESETS } from '../motion';
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
    warning: 'w-2 h-2 rounded-full bg-brand-warning motion-safe:animate-pulse',
    critical: 'w-2 h-2 rounded-full bg-brand-critical motion-safe:animate-pulse',
  },

  hint: 'text-sm text-muted-foreground leading-relaxed',
  actor: `${MICRO_TYPO.label} text-muted-foreground mt-2`,

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
    ].join(' '),
  },

  blockedReason: 'text-xs text-muted-foreground italic mt-1',
  terminal: 'text-sm text-muted-foreground text-center py-4',
} as const;

export type WorkflowPanelUrgency = keyof typeof WORKFLOW_PANEL_TOKENS.container.urgency;

// ============================================================================
// NEXT_STEP_PANEL_TOKENS — FSM 다음 단계 안내 패널 (NextStepPanel.tsx 전용)
// ============================================================================

/**
 * NextStepPanel 전용 토큰 — FSM currentStepIndex+1 안내에 최적화.
 *
 * container.floating: 모달/드롭다운 수준 강조 (ELEVATION_TOKENS.surface.emphasis 기반)
 * container.inline: 그룹 카드 내 인라인 삽입 (ELEVATION_TOKENS.surface.raised 기반)
 */
export const NEXT_STEP_PANEL_TOKENS = {
  container: {
    floating: `${ELEVATION_TOKENS.surface.emphasis} rounded-lg ${SPACING_RHYTHM_TOKENS.comfortable.padding}`,
    inline: `${ELEVATION_TOKENS.surface.raised} rounded-md ${SPACING_RHYTHM_TOKENS.tight.padding}`,
    compact: `${ELEVATION_TOKENS.surface.raised} rounded px-2 py-1.5`,
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
    critical:
      'border-l-4 border-l-brand-critical bg-brand-critical/5 motion-safe:animate-pulse-hard motion-reduce:animate-none',
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
