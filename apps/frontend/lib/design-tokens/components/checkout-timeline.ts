/**
 * Checkout Workflow Timeline Component Tokens
 *
 * WorkflowTimeline.tsx 전용 — 반출 워크플로우 세로 타임라인 스타일 SSOT.
 * 5종 노드 상태: past / current / next / future / skipped
 *
 * 소비처: WorkflowTimeline.tsx, CheckoutStatusStepper.tsx
 * 의존: PR-3 design tokens (TRANSITION_PRESETS)
 */

import { CheckoutStatusValues as CSVal, type CheckoutStatus } from '@equipment-management/schemas';
import { TRANSITION_PRESETS } from '../motion';

// ============================================================================
// Display step sequences — UI 관심사 SSOT (FSM 경로와 일치, SSOT: computeStepIndex)
// CheckoutStatusStepper + WorkflowTimeline 공용. 여기서만 정의.
// ============================================================================

export const CHECKOUT_DISPLAY_STEPS: { nonRental: CheckoutStatus[]; rental: CheckoutStatus[] } = {
  nonRental: [
    CSVal.PENDING,
    CSVal.APPROVED,
    CSVal.CHECKED_OUT,
    CSVal.RETURNED,
    CSVal.RETURN_APPROVED,
  ],
  rental: [
    CSVal.PENDING,
    CSVal.BORROWER_APPROVED,
    CSVal.APPROVED,
    CSVal.LENDER_CHECKED,
    CSVal.BORROWER_RECEIVED,
    CSVal.IN_USE,
    CSVal.BORROWER_RETURNED,
    CSVal.RETURN_APPROVED,
  ],
};

export const CHECKOUT_TIMELINE_TOKENS = {
  container: 'relative flex flex-col gap-0',

  connector: {
    /** left-4 = w-8/2, top-8 = dot 하단, bottom-0 = 다음 노드 상단까지 */
    base: 'absolute left-4 top-8 bottom-0 w-0.5',
    past: 'bg-brand-ok',
    future: 'bg-border',
  },

  node: {
    past: 'opacity-100',
    current: 'opacity-100',
    next: 'opacity-80',
    future: 'opacity-40',
    skipped: 'opacity-30',
  },

  dot: {
    base: 'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
    past: 'bg-brand-ok text-white',
    current: 'bg-brand-info text-white ring-2 ring-brand-info/30',
    next: 'bg-muted border-2 border-brand-info text-brand-info',
    future: 'bg-muted border border-border text-muted-foreground',
    skipped: 'bg-muted border border-border opacity-50',
  },

  label: {
    past: 'text-muted-foreground text-sm',
    current: 'font-medium text-sm text-foreground',
    next: 'text-brand-info text-sm',
    future: 'text-muted-foreground text-sm',
    skipped: 'text-muted-foreground text-sm opacity-50',
  },

  itemWrapper: `relative pl-11 ${TRANSITION_PRESETS.fastOpacity}`,
} as const;

export type CheckoutTimelineNodeState = keyof typeof CHECKOUT_TIMELINE_TOKENS.node;
