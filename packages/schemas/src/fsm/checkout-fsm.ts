import { z } from 'zod';
import {
  CHECKOUT_STATUS_VALUES,
  type CheckoutStatus,
  type CheckoutPurpose,
} from '../enums/checkout';
import { RENTAL_PHASES, getRentalPhase, getPhaseIndex, type RentalPhase } from './rental-phase';

export type { RentalPhase } from './rental-phase';
export {
  RENTAL_PHASES,
  RENTAL_STATUS_TO_PHASE,
  PHASE_STEP_COUNT,
  RENTAL_PHASE_I18N_KEY,
  getRentalPhase,
  getPhaseIndex,
  getStepsInPhase,
} from './rental-phase';

// ============================================================================
// Types
// ============================================================================

export type CheckoutAction =
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'start'
  | 'lender_check'
  | 'borrower_receive'
  | 'mark_in_use'
  | 'borrower_return'
  | 'lender_receive'
  | 'submit_return'
  | 'approve_return'
  | 'reject_return'
  | 'borrower_approve'
  | 'borrower_reject';

export type NextActor =
  | 'requester'
  | 'approver'
  | 'logistics'
  | 'lender'
  | 'borrower'
  | 'system'
  | 'none';

export type Urgency = 'normal' | 'warning' | 'critical';

/**
 * Permission key strings mirroring @equipment-management/shared-constants Permission enum.
 * Stored as strings to avoid circular dependency (schemas ← shared-constants).
 * Callers bridge: getPermissions(role) from shared-constants → pass as string array.
 */
export type CheckoutPermissionKey =
  | 'approve:checkout'
  | 'reject:checkout'
  | 'start:checkout'
  | 'complete:checkout'
  | 'cancel:checkout'
  | 'borrower_approve:checkout'
  | 'borrower_reject:checkout';

export interface TransitionRule {
  readonly from: CheckoutStatus;
  readonly action: CheckoutAction;
  readonly to: CheckoutStatus;
  /** Empty array = applies to all purposes */
  readonly purposes: readonly CheckoutPurpose[];
  readonly requires: CheckoutPermissionKey;
  readonly nextActor: NextActor;
  /** i18n key: checkouts.fsm.action.{labelKey} */
  readonly labelKey: string;
  /** i18n key: checkouts.fsm.hint.{hintKey} */
  readonly hintKey: string;
  /** Suffix for audit event: 'checkout.{auditEventSuffix}' */
  readonly auditEventSuffix: string;
}

export interface NextStepDescriptor {
  readonly currentStatus: CheckoutStatus;
  readonly currentStepIndex: number;
  readonly totalSteps: number;
  readonly nextAction: CheckoutAction | null;
  readonly nextActor: NextActor;
  readonly nextStatus: CheckoutStatus | null;
  readonly availableToCurrentUser: boolean;
  readonly blockingReason: 'permission' | 'role_mismatch' | null;
  readonly labelKey: string;
  readonly hintKey: string;
  readonly urgency: Urgency;
  /** currentStepIndex + 1. terminal 상태에서는 null. */
  readonly nextStepIndex: number | null;
  /** rental 전용 phase. non-rental 및 terminal(rejected, canceled)은 null. */
  readonly phase: RentalPhase | null;
  /** phase 순서: approve=0, handover=1, return=2. non-rental은 null. */
  readonly phaseIndex: number | null;
  /** rental=3, non-rental=null. */
  readonly totalPhases: 3 | null;
}

// ============================================================================
// Zod Schema (서버 응답 검증용)
// ============================================================================

export const NextStepDescriptorSchema: z.ZodType<NextStepDescriptor> = z.object({
  currentStatus: z.enum(CHECKOUT_STATUS_VALUES),
  currentStepIndex: z.number().int().positive(),
  totalSteps: z.number().int().positive(),
  nextAction: z
    .enum([
      'approve',
      'reject',
      'cancel',
      'start',
      'lender_check',
      'borrower_receive',
      'mark_in_use',
      'borrower_return',
      'lender_receive',
      'submit_return',
      'approve_return',
      'reject_return',
      'borrower_approve',
      'borrower_reject',
    ])
    .nullable(),
  nextActor: z.enum(['requester', 'approver', 'logistics', 'lender', 'borrower', 'system', 'none']),
  nextStatus: z.enum(CHECKOUT_STATUS_VALUES).nullable(),
  availableToCurrentUser: z.boolean(),
  blockingReason: z.enum(['permission', 'role_mismatch']).nullable(),
  labelKey: z.string(),
  hintKey: z.string(),
  urgency: z.enum(['normal', 'warning', 'critical']),
  nextStepIndex: z.number().int().nullable(),
  phase: z.enum(RENTAL_PHASES).nullable(),
  phaseIndex: z.number().int().min(0).max(2).nullable(),
  totalPhases: z.literal(3).nullable(),
});

// ============================================================================
// Transition Table
// ============================================================================

const CAL_REPAIR: readonly CheckoutPurpose[] = ['calibration', 'repair', 'return_to_vendor'];
const RENTAL: readonly CheckoutPurpose[] = ['rental'];
const ALL: readonly CheckoutPurpose[] = [];

export const CHECKOUT_TRANSITIONS: readonly TransitionRule[] = Object.freeze([
  // ── pending ──────────────────────────────────────────────────────────────
  {
    from: 'pending',
    action: 'borrower_approve',
    to: 'borrower_approved',
    purposes: RENTAL,
    requires: 'borrower_approve:checkout',
    nextActor: 'approver',
    labelKey: 'borrower_approve',
    hintKey: 'pendingBorrowerApprove',
    auditEventSuffix: 'borrower_approved',
  },
  {
    from: 'pending',
    action: 'borrower_reject',
    to: 'rejected',
    purposes: RENTAL,
    requires: 'borrower_reject:checkout',
    nextActor: 'none',
    labelKey: 'borrower_reject',
    hintKey: 'waitingApprover',
    auditEventSuffix: 'borrower_rejected',
  },
  {
    from: 'pending',
    action: 'approve',
    to: 'approved',
    purposes: CAL_REPAIR,
    requires: 'approve:checkout',
    nextActor: 'logistics',
    labelKey: 'approve',
    hintKey: 'pendingApprove',
    auditEventSuffix: 'approved',
  },
  {
    from: 'pending',
    action: 'reject',
    to: 'rejected',
    purposes: CAL_REPAIR,
    requires: 'reject:checkout',
    nextActor: 'none',
    labelKey: 'reject',
    hintKey: 'waitingApprover',
    auditEventSuffix: 'rejected',
  },
  {
    from: 'pending',
    action: 'cancel',
    to: 'canceled',
    purposes: ALL,
    requires: 'cancel:checkout',
    nextActor: 'none',
    labelKey: 'cancel',
    hintKey: 'pendingCancel',
    auditEventSuffix: 'canceled',
  },
  // ── borrower_approved ─────────────────────────────────────────────────────
  {
    from: 'borrower_approved',
    action: 'approve',
    to: 'approved',
    purposes: RENTAL,
    requires: 'approve:checkout',
    nextActor: 'logistics',
    labelKey: 'approve',
    hintKey: 'pendingApprove',
    auditEventSuffix: 'approved',
  },
  {
    from: 'borrower_approved',
    action: 'reject',
    to: 'rejected',
    purposes: RENTAL,
    requires: 'reject:checkout',
    nextActor: 'none',
    labelKey: 'reject',
    hintKey: 'waitingApprover',
    auditEventSuffix: 'rejected',
  },
  {
    from: 'borrower_approved',
    action: 'cancel',
    to: 'canceled',
    purposes: RENTAL,
    requires: 'cancel:checkout',
    nextActor: 'none',
    labelKey: 'cancel',
    hintKey: 'pendingCancel',
    auditEventSuffix: 'canceled',
  },
  // ── approved ─────────────────────────────────────────────────────────────
  {
    from: 'approved',
    action: 'start',
    to: 'checked_out',
    purposes: CAL_REPAIR,
    requires: 'start:checkout',
    nextActor: 'requester',
    labelKey: 'start',
    hintKey: 'approvedStart',
    auditEventSuffix: 'started',
  },
  {
    from: 'approved',
    action: 'lender_check',
    to: 'lender_checked',
    purposes: RENTAL,
    requires: 'start:checkout',
    nextActor: 'borrower',
    labelKey: 'lender_check',
    hintKey: 'approvedLenderCheck',
    auditEventSuffix: 'lender_checked',
  },
  {
    from: 'approved',
    action: 'cancel',
    to: 'canceled',
    purposes: ALL,
    requires: 'cancel:checkout',
    nextActor: 'none',
    labelKey: 'cancel',
    hintKey: 'pendingCancel',
    auditEventSuffix: 'canceled',
  },
  // ── lender_checked ────────────────────────────────────────────────────────
  {
    from: 'lender_checked',
    action: 'borrower_receive',
    to: 'borrower_received',
    purposes: RENTAL,
    requires: 'start:checkout',
    nextActor: 'lender',
    labelKey: 'borrower_receive',
    hintKey: 'lenderCheckedBorrowerReceive',
    auditEventSuffix: 'borrower_received',
  },
  // ── borrower_received ─────────────────────────────────────────────────────
  {
    from: 'borrower_received',
    action: 'mark_in_use',
    to: 'in_use',
    purposes: RENTAL,
    requires: 'start:checkout',
    nextActor: 'borrower',
    labelKey: 'mark_in_use',
    hintKey: 'borrowerReceivedMarkInUse',
    auditEventSuffix: 'in_use',
  },
  // ── in_use ────────────────────────────────────────────────────────────────
  {
    from: 'in_use',
    action: 'borrower_return',
    to: 'borrower_returned',
    purposes: RENTAL,
    requires: 'complete:checkout',
    nextActor: 'lender',
    labelKey: 'borrower_return',
    hintKey: 'inUseBorrowerReturn',
    auditEventSuffix: 'borrower_returned',
  },
  // ── borrower_returned ─────────────────────────────────────────────────────
  {
    from: 'borrower_returned',
    action: 'lender_receive',
    to: 'lender_received',
    purposes: RENTAL,
    requires: 'complete:checkout',
    nextActor: 'approver',
    labelKey: 'lender_receive',
    hintKey: 'borrowerReturnedLenderReceive',
    auditEventSuffix: 'lender_received',
  },
  // ── lender_received ───────────────────────────────────────────────────────
  {
    from: 'lender_received',
    action: 'submit_return',
    to: 'returned',
    purposes: RENTAL,
    requires: 'complete:checkout',
    nextActor: 'approver',
    labelKey: 'submit_return',
    hintKey: 'checkedOutSubmitReturn',
    auditEventSuffix: 'return_submitted',
  },
  // ── checked_out ───────────────────────────────────────────────────────────
  {
    from: 'checked_out',
    action: 'submit_return',
    to: 'returned',
    purposes: CAL_REPAIR,
    requires: 'complete:checkout',
    nextActor: 'approver',
    labelKey: 'submit_return',
    hintKey: 'checkedOutSubmitReturn',
    auditEventSuffix: 'return_submitted',
  },
  // ── overdue ───────────────────────────────────────────────────────────────
  {
    from: 'overdue',
    action: 'submit_return',
    to: 'returned',
    purposes: ALL,
    requires: 'complete:checkout',
    nextActor: 'approver',
    labelKey: 'submit_return',
    hintKey: 'overdueReturn',
    auditEventSuffix: 'return_submitted',
  },
  // ── returned ──────────────────────────────────────────────────────────────
  {
    from: 'returned',
    action: 'approve_return',
    to: 'return_approved',
    purposes: ALL,
    requires: 'approve:checkout',
    nextActor: 'none',
    labelKey: 'approve_return',
    hintKey: 'returnedApproveReturn',
    auditEventSuffix: 'return_approved',
  },
  {
    from: 'returned',
    action: 'reject_return',
    to: 'checked_out',
    purposes: CAL_REPAIR,
    requires: 'reject:checkout',
    nextActor: 'requester',
    labelKey: 'reject_return',
    hintKey: 'returnedRejectReturn',
    auditEventSuffix: 'return_rejected',
  },
] as const);

// ============================================================================
// Invariant Assertions
// ============================================================================

const TERMINAL_STATES: readonly CheckoutStatus[] = ['rejected', 'canceled', 'return_approved'];

function assertFsmInvariants(transitions: readonly TransitionRule[]): void {
  const fromSet = new Set(transitions.map((t) => t.from));
  const toSet = new Set(transitions.map((t) => t.to));
  const allReachable = new Set([...fromSet, ...toSet]);

  for (const status of CHECKOUT_STATUS_VALUES) {
    if (!allReachable.has(status)) {
      throw new Error(`FSM invariant violated: status "${status}" unreachable`);
    }
  }

  for (const terminal of TERMINAL_STATES) {
    const outEdges = transitions.filter((t) => t.from === terminal);
    if (outEdges.length > 0) {
      throw new Error(
        `FSM invariant violated: terminal state "${terminal}" has ${outEdges.length} out-edge(s)`
      );
    }
  }

  // Rental path traversability (2-step approval: pending → borrower_approved → approved)
  const rentalPath: CheckoutStatus[] = [
    'pending',
    'borrower_approved',
    'approved',
    'lender_checked',
    'borrower_received',
    'in_use',
    'borrower_returned',
    'lender_received',
    'returned',
    'return_approved',
  ];
  for (let i = 0; i < rentalPath.length - 1; i++) {
    const from = rentalPath[i];
    const to = rentalPath[i + 1];
    const exists = transitions.some(
      (t) =>
        t.from === from && t.to === to && (t.purposes.length === 0 || t.purposes.includes('rental'))
    );
    if (!exists) {
      throw new Error(
        `FSM invariant violated: rental path transition "${from}" → "${to}" not found`
      );
    }
  }

  // Calibration path traversability
  const calPath: CheckoutStatus[] = [
    'pending',
    'approved',
    'checked_out',
    'returned',
    'return_approved',
  ];
  for (let i = 0; i < calPath.length - 1; i++) {
    const from = calPath[i];
    const to = calPath[i + 1];
    const exists = transitions.some(
      (t) =>
        t.from === from &&
        t.to === to &&
        (t.purposes.length === 0 || t.purposes.includes('calibration'))
    );
    if (!exists) {
      throw new Error(
        `FSM invariant violated: calibration path transition "${from}" → "${to}" not found`
      );
    }
  }

  // Note: the FSM intentionally has one cycle — reject_return sends
  // 'returned' back to 'checked_out' (equipment re-enters use after failed inspection).
  // A strict DAG invariant is therefore NOT enforced here.
}

// Run at module load — catches misconfiguration at build time
assertFsmInvariants(CHECKOUT_TRANSITIONS);

// ============================================================================
// Public API
// ============================================================================

export function getTransitionsFor(
  status: CheckoutStatus,
  purpose: CheckoutPurpose
): readonly TransitionRule[] {
  return CHECKOUT_TRANSITIONS.filter(
    (t) => t.from === status && (t.purposes.length === 0 || t.purposes.includes(purpose))
  );
}

export function computeTotalSteps(purpose: CheckoutPurpose): number {
  if (purpose === 'rental') return 8;
  return 5;
}

export function computeStepIndex(status: CheckoutStatus, purpose: CheckoutPurpose): number {
  if (purpose === 'rental') {
    const map: Partial<Record<CheckoutStatus, number>> = {
      pending: 1,
      borrower_approved: 2,
      approved: 3,
      lender_checked: 4,
      borrower_received: 5,
      in_use: 6,
      overdue: 6,
      borrower_returned: 7,
      lender_received: 8,
      returned: 8,
      return_approved: 8,
      rejected: 1,
      canceled: 1,
    };
    return map[status] ?? 1;
  }
  const map: Partial<Record<CheckoutStatus, number>> = {
    pending: 1,
    approved: 2,
    checked_out: 3,
    overdue: 3,
    returned: 4,
    return_approved: 5,
    rejected: 1,
    canceled: 1,
  };
  return map[status] ?? 1;
}

export function computeUrgency(
  checkout: Pick<{ status: CheckoutStatus; dueAt?: string | null }, 'status' | 'dueAt'>
): Urgency {
  if (checkout.status === 'overdue') return 'critical';
  if (checkout.dueAt) {
    const due = new Date(checkout.dueAt).getTime();
    const now = Date.now();
    const msIn48h = 48 * 60 * 60 * 1000;
    if (due < now) return 'critical';
    if (due - now < msIn48h) return 'warning';
  }
  return 'normal';
}

/**
 * Check if a transition action is allowed given the user's permissions.
 *
 * Design note: accepts `userPermissions: readonly string[]` instead of UserRole
 * to avoid circular dependency (schemas ← shared-constants ← schemas).
 * Callers bridge: `getPermissions(role)` from @equipment-management/shared-constants.
 */
export function canPerformAction(
  checkout: Pick<{ status: CheckoutStatus; purpose: CheckoutPurpose }, 'status' | 'purpose'>,
  action: CheckoutAction,
  userPermissions: readonly string[]
): { ok: true } | { ok: false; reason: 'invalid_transition' | 'permission' } {
  const matchingTransition = CHECKOUT_TRANSITIONS.find(
    (t) =>
      t.from === checkout.status &&
      t.action === action &&
      (t.purposes.length === 0 || t.purposes.includes(checkout.purpose))
  );
  if (!matchingTransition) {
    return { ok: false, reason: 'invalid_transition' };
  }
  if (!userPermissions.includes(matchingTransition.requires)) {
    return { ok: false, reason: 'permission' };
  }
  return { ok: true };
}

/**
 * Compute the next step descriptor for a given checkout state.
 *
 * Design note: accepts `userPermissions: readonly string[]` — callers supply
 * `getPermissions(role)` from @equipment-management/shared-constants.
 */
export function getNextStep(
  checkout: Pick<
    { status: CheckoutStatus; purpose: CheckoutPurpose; dueAt?: string | null },
    'status' | 'purpose' | 'dueAt'
  >,
  userPermissions: readonly string[]
): NextStepDescriptor {
  const currentStepIndex = computeStepIndex(checkout.status, checkout.purpose);
  const totalSteps = computeTotalSteps(checkout.purpose);
  const urgency = computeUrgency(checkout);
  const phase = getRentalPhase(checkout.status, checkout.purpose);
  const phaseIndex = getPhaseIndex(checkout.status, checkout.purpose);
  const totalPhases: 3 | null = checkout.purpose === 'rental' ? 3 : null;

  if (TERMINAL_STATES.includes(checkout.status)) {
    return {
      currentStatus: checkout.status,
      currentStepIndex,
      totalSteps,
      nextAction: null,
      nextActor: 'none',
      nextStatus: null,
      availableToCurrentUser: false,
      blockingReason: null,
      labelKey: 'terminal',
      hintKey: 'terminal',
      urgency,
      nextStepIndex: null,
      phase,
      phaseIndex,
      totalPhases,
    };
  }

  const transitions = getTransitionsFor(checkout.status, checkout.purpose);

  // Prefer a transition the user has permission for
  const permitted = transitions.find((t) => userPermissions.includes(t.requires));
  const candidate = permitted ?? transitions[0];

  if (!candidate) {
    return {
      currentStatus: checkout.status,
      currentStepIndex,
      totalSteps,
      nextAction: null,
      nextActor: 'system',
      nextStatus: null,
      availableToCurrentUser: false,
      blockingReason: null,
      labelKey: 'terminal',
      hintKey: 'terminal',
      urgency,
      nextStepIndex: null,
      phase,
      phaseIndex,
      totalPhases,
    };
  }

  const available = userPermissions.includes(candidate.requires);

  return {
    currentStatus: checkout.status,
    currentStepIndex,
    totalSteps,
    nextAction: candidate.action,
    nextActor: candidate.nextActor,
    nextStatus: candidate.to,
    availableToCurrentUser: available,
    blockingReason: available ? null : 'permission',
    labelKey: candidate.labelKey,
    hintKey: candidate.hintKey,
    urgency,
    nextStepIndex: Math.min(currentStepIndex + 1, totalSteps),
    phase,
    phaseIndex,
    totalPhases,
  };
}
