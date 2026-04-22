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
