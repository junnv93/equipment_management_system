/**
 * Checkout Icon Map (Layer 3: Component-Specific)
 *
 * 반출입 워크플로우에서 사용하는 모든 Lucide 아이콘의 SSOT.
 * 컴포넌트 단위 로컬 재정의 금지 — 반드시 이 파일에서 import.
 *
 * 소비처: CheckoutStatusStepper, NextStepPanel, EmptyState, CheckoutGroupCard
 */

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  Lock,
  Package,
  RotateCcw,
  Send,
  ShieldCheck,
  Timer,
  UserCheck,
} from 'lucide-react';

export const CHECKOUT_ICON_MAP = {
  status: {
    pending: Clock,
    approved: UserCheck,
    checked_out: Package,
    returned: RotateCcw,
    return_approved: CheckCircle2,
    rejected: Ban,
    canceled: Ban,
    overdue: Timer,
    lender_checked: ShieldCheck,
    borrower_received: ArrowRight,
    in_use: Package,
    borrower_returned: RotateCcw,
    lender_received: CheckCircle2,
  },

  /** ctaKind별 아이콘 — NextStepPanel 액션 버튼용 */
  action: {
    approve: CheckCircle2,
    reject: Ban,
    start: ArrowRight,
    lender_check: ShieldCheck,
    submit_return: Send,
    approve_return: CheckCircle2,
    reject_return: AlertTriangle,
  },

  /** EmptyState variant별 아이콘 */
  emptyState: {
    'in-progress': Clock,
    completed: CheckCircle2,
    filtered: AlertTriangle,
  },

  /** 긴급도별 아이콘 — WorkflowPanel urgency dot 옆 */
  urgency: {
    normal: ArrowRight,
    warning: AlertTriangle,
    critical: Timer,
  },

  /** 잠금 상태 (권한 없는 액션) */
  locked: Lock,
} as const;

export type CheckoutStatusIconKey = keyof typeof CHECKOUT_ICON_MAP.status;
export type CheckoutActionIconKey = keyof typeof CHECKOUT_ICON_MAP.action;
export type CheckoutEmptyStateIconKey = keyof typeof CHECKOUT_ICON_MAP.emptyState;
export type CheckoutUrgencyIconKey = keyof typeof CHECKOUT_ICON_MAP.urgency;
