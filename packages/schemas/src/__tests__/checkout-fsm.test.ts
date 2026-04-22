/// <reference types="jest" />

import {
  CHECKOUT_TRANSITIONS,
  NextStepDescriptorSchema,
  getTransitionsFor,
  getNextStep,
  canPerformAction,
  computeStepIndex,
  computeTotalSteps,
  computeUrgency,
} from '../fsm/checkout-fsm';
import type { CheckoutStatus, CheckoutPurpose } from '../enums/checkout';

// Permission key strings matching @equipment-management/shared-constants Permission enum.
// (Cannot import shared-constants here — schemas ← shared-constants, not the reverse)
const APPROVE_CHECKOUT = 'approve:checkout';
const REJECT_CHECKOUT = 'reject:checkout';
const START_CHECKOUT = 'start:checkout';
const COMPLETE_CHECKOUT = 'complete:checkout';
const CANCEL_CHECKOUT = 'cancel:checkout';

// Role permission sets for test (mirrors ROLE_PERMISSIONS in shared-constants)
const TECHNICAL_MANAGER_PERMS = [
  APPROVE_CHECKOUT,
  REJECT_CHECKOUT,
  START_CHECKOUT,
  COMPLETE_CHECKOUT,
  CANCEL_CHECKOUT,
  'view:checkouts',
  'create:checkout',
  'update:checkout',
  'delete:checkout',
];
const TEST_ENGINEER_PERMS = ['view:checkouts', 'create:checkout'];
const SYSTEM_ADMIN_PERMS = [...TECHNICAL_MANAGER_PERMS, 'manage:roles'];
// quality_manager: 반출입 기록 검토(조회)만 — approve/reject/start/complete/cancel 없음
const QUALITY_MANAGER_PERMS = ['view:checkouts'];
// lab_manager: 시험소장 — checkout 조회만 (UL-QP-18 직무분리: 신청·승인은 기술책임자 전담)
const LAB_MANAGER_PERMS = ['view:checkouts'];

// ============================================================================
// FSM Invariants
// ============================================================================

describe('assertFsmInvariants (module-load)', () => {
  it('loads without throwing (invariants pass)', () => {
    expect(CHECKOUT_TRANSITIONS).toBeDefined();
    expect(CHECKOUT_TRANSITIONS.length).toBeGreaterThan(0);
  });

  it('terminal states have 0 out-edges', () => {
    const terminals: CheckoutStatus[] = ['rejected', 'canceled', 'return_approved'];
    for (const terminal of terminals) {
      const outEdges = CHECKOUT_TRANSITIONS.filter((t) => t.from === terminal);
      expect(outEdges).toHaveLength(0);
    }
  });

  it('all 13 CheckoutStatus values appear as from or to', () => {
    const allStatuses: CheckoutStatus[] = [
      'pending',
      'approved',
      'rejected',
      'checked_out',
      'lender_checked',
      'borrower_received',
      'in_use',
      'borrower_returned',
      'lender_received',
      'returned',
      'return_approved',
      'overdue',
      'canceled',
    ];
    const covered = new Set([
      ...CHECKOUT_TRANSITIONS.map((t) => t.from),
      ...CHECKOUT_TRANSITIONS.map((t) => t.to),
    ]);
    for (const status of allStatuses) {
      expect(covered.has(status)).toBe(true);
    }
  });
});

// ============================================================================
// computeTotalSteps
// ============================================================================

describe('computeTotalSteps', () => {
  it('returns 5 for calibration', () => {
    expect(computeTotalSteps('calibration')).toBe(5);
  });

  it('returns 5 for repair', () => {
    expect(computeTotalSteps('repair')).toBe(5);
  });

  it('returns 5 for return_to_vendor', () => {
    expect(computeTotalSteps('return_to_vendor')).toBe(5);
  });

  it('returns 7 for rental', () => {
    expect(computeTotalSteps('rental')).toBe(7);
  });
});

// ============================================================================
// computeStepIndex
// ============================================================================

describe('computeStepIndex — calibration path', () => {
  const purpose: CheckoutPurpose = 'calibration';

  it('pending → 1', () => expect(computeStepIndex('pending', purpose)).toBe(1));
  it('approved → 2', () => expect(computeStepIndex('approved', purpose)).toBe(2));
  it('checked_out → 3', () => expect(computeStepIndex('checked_out', purpose)).toBe(3));
  it('overdue → 3 (same as checked_out)', () =>
    expect(computeStepIndex('overdue', purpose)).toBe(3));
  it('returned → 4', () => expect(computeStepIndex('returned', purpose)).toBe(4));
  it('return_approved → 5', () => expect(computeStepIndex('return_approved', purpose)).toBe(5));
});

describe('computeStepIndex — rental path', () => {
  const purpose: CheckoutPurpose = 'rental';

  it('pending → 1', () => expect(computeStepIndex('pending', purpose)).toBe(1));
  it('approved → 2', () => expect(computeStepIndex('approved', purpose)).toBe(2));
  it('lender_checked → 3', () => expect(computeStepIndex('lender_checked', purpose)).toBe(3));
  it('borrower_received → 4', () => expect(computeStepIndex('borrower_received', purpose)).toBe(4));
  it('in_use → 5', () => expect(computeStepIndex('in_use', purpose)).toBe(5));
  it('borrower_returned → 6', () => expect(computeStepIndex('borrower_returned', purpose)).toBe(6));
  it('lender_received → 7', () => expect(computeStepIndex('lender_received', purpose)).toBe(7));
  it('returned → 7', () => expect(computeStepIndex('returned', purpose)).toBe(7));
  it('return_approved → 7 (terminal)', () =>
    expect(computeStepIndex('return_approved', purpose)).toBe(7));
});

// ============================================================================
// computeUrgency
// ============================================================================

describe('computeUrgency', () => {
  it('returns critical for overdue status', () => {
    expect(computeUrgency({ status: 'overdue' })).toBe('critical');
  });

  it('returns critical when dueAt is in the past', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString();
    expect(computeUrgency({ status: 'checked_out', dueAt: pastDate })).toBe('critical');
  });

  it('returns warning when dueAt is within 48 hours', () => {
    const soonDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(computeUrgency({ status: 'checked_out', dueAt: soonDate })).toBe('warning');
  });

  it('returns normal when no dueAt', () => {
    expect(computeUrgency({ status: 'checked_out' })).toBe('normal');
  });

  it('returns normal when dueAt is far in the future', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeUrgency({ status: 'in_use', dueAt: futureDate })).toBe('normal');
  });
});

// ============================================================================
// getTransitionsFor
// ============================================================================

describe('getTransitionsFor', () => {
  it('returns approve/reject/cancel from pending for calibration', () => {
    const actions = getTransitionsFor('pending', 'calibration').map((t) => t.action);
    expect(actions).toContain('approve');
    expect(actions).toContain('reject');
    expect(actions).toContain('cancel');
  });

  it('returns start action from approved for calibration (not lender_check)', () => {
    const actions = getTransitionsFor('approved', 'calibration').map((t) => t.action);
    expect(actions).toContain('start');
    expect(actions).not.toContain('lender_check');
  });

  it('returns lender_check from approved for rental (not start)', () => {
    const actions = getTransitionsFor('approved', 'rental').map((t) => t.action);
    expect(actions).toContain('lender_check');
    expect(actions).not.toContain('start');
  });

  it('returns empty array for terminal statuses', () => {
    expect(getTransitionsFor('return_approved', 'calibration')).toHaveLength(0);
    expect(getTransitionsFor('rejected', 'rental')).toHaveLength(0);
    expect(getTransitionsFor('canceled', 'repair')).toHaveLength(0);
  });

  it('returns submit_return from overdue for all purposes', () => {
    const calActions = getTransitionsFor('overdue', 'calibration').map((t) => t.action);
    const rentalActions = getTransitionsFor('overdue', 'rental').map((t) => t.action);
    expect(calActions).toContain('submit_return');
    expect(rentalActions).toContain('submit_return');
  });
});

// ============================================================================
// canPerformAction — permission matrix
// ============================================================================

describe('canPerformAction', () => {
  const pendingCal = {
    status: 'pending' as CheckoutStatus,
    purpose: 'calibration' as CheckoutPurpose,
  };
  const checkedOut = {
    status: 'checked_out' as CheckoutStatus,
    purpose: 'calibration' as CheckoutPurpose,
  };
  const returned = {
    status: 'returned' as CheckoutStatus,
    purpose: 'calibration' as CheckoutPurpose,
  };
  const approvedRental = {
    status: 'approved' as CheckoutStatus,
    purpose: 'rental' as CheckoutPurpose,
  };

  it('technical_manager can approve pending', () => {
    expect(canPerformAction(pendingCal, 'approve', TECHNICAL_MANAGER_PERMS).ok).toBe(true);
  });

  it('test_engineer cannot approve pending', () => {
    const result = canPerformAction(pendingCal, 'approve', TEST_ENGINEER_PERMS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('permission');
  });

  it('technical_manager can reject pending', () => {
    expect(canPerformAction(pendingCal, 'reject', TECHNICAL_MANAGER_PERMS).ok).toBe(true);
  });

  it('test_engineer cannot reject pending', () => {
    expect(canPerformAction(pendingCal, 'reject', TEST_ENGINEER_PERMS).ok).toBe(false);
  });

  it('invalid transition returns invalid_transition reason', () => {
    const result = canPerformAction(pendingCal, 'submit_return', TECHNICAL_MANAGER_PERMS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_transition');
  });

  it('technical_manager can submit_return from checked_out', () => {
    expect(canPerformAction(checkedOut, 'submit_return', TECHNICAL_MANAGER_PERMS).ok).toBe(true);
  });

  it('technical_manager can approve_return from returned', () => {
    expect(canPerformAction(returned, 'approve_return', TECHNICAL_MANAGER_PERMS).ok).toBe(true);
  });

  it('system_admin (superset of technical_manager) can perform all actions', () => {
    expect(canPerformAction(pendingCal, 'approve', SYSTEM_ADMIN_PERMS).ok).toBe(true);
    expect(canPerformAction(pendingCal, 'reject', SYSTEM_ADMIN_PERMS).ok).toBe(true);
    expect(canPerformAction(checkedOut, 'submit_return', SYSTEM_ADMIN_PERMS).ok).toBe(true);
  });

  it('lender_check invalid for calibration checkout (purpose mismatch)', () => {
    const approvedCal = {
      status: 'approved' as CheckoutStatus,
      purpose: 'calibration' as CheckoutPurpose,
    };
    const result = canPerformAction(approvedCal, 'lender_check', TECHNICAL_MANAGER_PERMS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_transition');
  });

  it('lender_check valid for rental checkout', () => {
    expect(canPerformAction(approvedRental, 'lender_check', TECHNICAL_MANAGER_PERMS).ok).toBe(true);
  });

  describe('quality_manager — 조회 전용, 상태 전이 불가', () => {
    it('cannot approve pending (no approve:checkout)', () => {
      const result = canPerformAction(pendingCal, 'approve', QUALITY_MANAGER_PERMS);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('permission');
    });

    it('cannot reject pending (no reject:checkout)', () => {
      const result = canPerformAction(pendingCal, 'reject', QUALITY_MANAGER_PERMS);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('permission');
    });

    it('cannot start checked_out (no start:checkout)', () => {
      const result = canPerformAction(checkedOut, 'start', QUALITY_MANAGER_PERMS);
      expect(result.ok).toBe(false);
    });
  });

  describe('lab_manager — 시험소장, checkout 조회만 (UL-QP-18 직무분리)', () => {
    it('cannot approve pending (no approve:checkout)', () => {
      const result = canPerformAction(pendingCal, 'approve', LAB_MANAGER_PERMS);
      expect(result.ok).toBe(false);
      expect((result as { ok: false; reason: string }).reason).toBe('permission');
    });

    it('cannot reject pending (no reject:checkout)', () => {
      const result = canPerformAction(pendingCal, 'reject', LAB_MANAGER_PERMS);
      expect(result.ok).toBe(false);
    });

    it('cannot submit_return from checked_out (no complete:checkout)', () => {
      expect(canPerformAction(checkedOut, 'submit_return', LAB_MANAGER_PERMS).ok).toBe(false);
    });

    it('cannot approve_return from returned (no approve:checkout)', () => {
      expect(canPerformAction(returned, 'approve_return', LAB_MANAGER_PERMS).ok).toBe(false);
    });
  });
});

// ============================================================================
// getNextStep — key snapshots
// ============================================================================

describe('getNextStep', () => {
  it('pending + calibration + technical_manager → nextAction=approve, available=true', () => {
    const result = getNextStep(
      { status: 'pending', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.nextAction).toBe('approve');
    expect(result.availableToCurrentUser).toBe(true);
    expect(result.blockingReason).toBeNull();
    expect(result.currentStepIndex).toBe(1);
    expect(result.totalSteps).toBe(5);
  });

  it('pending + calibration + test_engineer → available=false, blockingReason=permission', () => {
    const result = getNextStep({ status: 'pending', purpose: 'calibration' }, TEST_ENGINEER_PERMS);
    expect(result.availableToCurrentUser).toBe(false);
    expect(result.blockingReason).toBe('permission');
    expect(result.nextAction).toBe('approve'); // transition exists, user just lacks permission
  });

  it('approved + calibration + technical_manager → nextAction=start', () => {
    const result = getNextStep(
      { status: 'approved', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.nextAction).toBe('start');
    expect(result.availableToCurrentUser).toBe(true);
  });

  it('overdue + calibration → urgency=critical', () => {
    const result = getNextStep(
      { status: 'overdue', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.urgency).toBe('critical');
    expect(result.nextAction).toBe('submit_return');
  });

  it('return_approved → nextAction=null (terminal)', () => {
    const result = getNextStep(
      { status: 'return_approved', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.nextAction).toBeNull();
    expect(result.nextStatus).toBeNull();
    expect(result.availableToCurrentUser).toBe(false);
  });

  it('approved + rental → nextAction=lender_check', () => {
    const result = getNextStep({ status: 'approved', purpose: 'rental' }, TECHNICAL_MANAGER_PERMS);
    expect(result.nextAction).toBe('lender_check');
  });

  it('returned + calibration + technical_manager → nextAction=approve_return', () => {
    const result = getNextStep(
      { status: 'returned', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.nextAction).toBe('approve_return');
  });

  it('checked_out step indices are correct', () => {
    const result = getNextStep(
      { status: 'checked_out', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.currentStepIndex).toBe(3);
    expect(result.totalSteps).toBe(5);
  });

  it('rental lender_checked step indices are correct', () => {
    const result = getNextStep(
      { status: 'lender_checked', purpose: 'rental' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.currentStepIndex).toBe(3);
    expect(result.totalSteps).toBe(7);
  });

  it('rejected → terminal', () => {
    const result = getNextStep(
      { status: 'rejected', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(result.nextAction).toBeNull();
  });
});

// ============================================================================
// NextStepDescriptorSchema — Zod validation
// ============================================================================

describe('NextStepDescriptorSchema', () => {
  it('validates a valid descriptor from getNextStep', () => {
    const descriptor = getNextStep(
      { status: 'pending', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(NextStepDescriptorSchema.safeParse(descriptor).success).toBe(true);
  });

  it('rejects descriptor with invalid urgency value', () => {
    const invalid = {
      currentStatus: 'pending',
      currentStepIndex: 1,
      totalSteps: 5,
      nextAction: 'approve',
      nextActor: 'approver',
      nextStatus: 'approved',
      availableToCurrentUser: true,
      blockingReason: null,
      labelKey: 'approve',
      hintKey: 'pendingApprove',
      urgency: 'INVALID', // wrong
    };
    expect(NextStepDescriptorSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects descriptor with missing required field', () => {
    const { urgency: _omit, ...missing } = getNextStep(
      { status: 'pending', purpose: 'calibration' },
      TECHNICAL_MANAGER_PERMS
    );
    expect(NextStepDescriptorSchema.safeParse(missing).success).toBe(false);
  });
});
