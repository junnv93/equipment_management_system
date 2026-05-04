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

/**
 * Transition actor side — 어느 측 team이 해당 transition의 행위자인가.
 *
 * 동일 역할(technical_manager) 사용자가 lender·borrower 양측 permission을 모두
 * 보유할 때, 두 사용자를 분리하기 위한 SSOT. canPerformAction/getNextStep에
 * 옵셔널 actorCtx와 함께 전달되어 team identity 검증에 사용됨.
 *
 * - 'lender': lender team (장비 소유 팀) — 대여 승인·점검·반입 처리
 * - 'borrower': requester team (차용 팀) — 차용 승인·수령·사용·반환
 * - 'requester': borrower와 동일 (의미적 명시 — cancel은 신청자만 가능)
 * - 'any': 양측 모두 (예: 시스템 자동 액션)
 */
export type TransitionActorSide = 'lender' | 'borrower' | 'requester' | 'any';

/**
 * Action별 actor side SSOT.
 *
 * 모든 CheckoutAction에 대해 어느 측 team이 행위자인지 단일 소스로 선언.
 * Transition table의 nextActor는 "다음 행위자"이고, 이 매핑은 "현재 행위자".
 */
export const TRANSITION_ACTOR_SIDE: Readonly<Record<CheckoutAction, TransitionActorSide>> =
  Object.freeze({
    approve: 'lender', // cal/repair: own team / rental: lender team approves after borrower
    reject: 'lender',
    cancel: 'requester', // 신청자만 취소 가능
    start: 'lender', // cal/repair: 신청자 == lender (own team)
    lender_check: 'lender',
    borrower_receive: 'borrower',
    borrower_return: 'borrower',
    lender_receive: 'lender',
    submit_return: 'lender',
    approve_return: 'lender',
    reject_return: 'lender',
    borrower_approve: 'borrower', // 차용자 측 1차 승인
    borrower_reject: 'borrower',
  });

/**
 * Actor identity context — canPerformAction/getNextStep에 옵셔널로 주입.
 *
 * undefined일 경우 actor 검증 스킵 (기존 호환). 제공 시 transition의
 * TRANSITION_ACTOR_SIDE와 userTeamId === {lenderTeamId|requesterTeamId}
 * 일치를 검증하여 "permission은 있지만 잘못된 측 사용자" 케이스 차단.
 *
 * Fail-soft 정책: 필드 중 하나라도 nullish면 해당 검증 스킵 (legacy data 보호).
 */
export interface CheckoutActorContext {
  readonly userTeamId?: string | null;
  readonly lenderTeamId?: string | null;
  readonly requesterTeamId?: string | null;
}

/**
 * UI 표현용 actor 3-way 그루핑 (SSOT).
 * NextActor(FSM 워크플로 시점)와 분리: ActorVariant는 화면 컬러·뱃지 분류 전용.
 * 소비처: NextStepPanel.tsx (resolveActorVariant), roleToActorVariant()
 */
export type ActorVariant = 'requester' | 'approver' | 'receiver';

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
  readonly blockingReason: 'permission' | 'role_mismatch' | 'actor_team' | null;
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
  /**
   * 도달 단계 — terminal 상태에서도 "마지막으로 도달한 step"을 의미론적으로 반영.
   * 비-terminal: currentStepIndex와 동일.
   * terminal + terminatedFromStatus 있음: computeStepIndex(terminatedFromStatus, purpose).
   * terminal + terminatedFromStatus 없음: currentStepIndex (legacy row fallback = 1).
   *
   * UI 소비처: 반려/취소 시 "X단계에서 종료됨" 표시 (Stage 2: CheckoutStatusStepper 업데이트 시).
   * API 소비처: 현재 서버 응답에 포함되어 frontend hook의 nextStep pathway로 전달.
   */
  readonly reachedStepIndex: number;
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
  blockingReason: z.enum(['permission', 'role_mismatch', 'actor_team']).nullable(),
  labelKey: z.string(),
  hintKey: z.string(),
  urgency: z.enum(['normal', 'warning', 'critical']),
  nextStepIndex: z.number().int().nullable(),
  phase: z.enum(RENTAL_PHASES).nullable(),
  phaseIndex: z.number().int().min(0).max(2).nullable(),
  totalPhases: z.literal(3).nullable(),
  reachedStepIndex: z.number().int().positive(),
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
    to: 'in_use',
    purposes: RENTAL,
    requires: 'start:checkout',
    nextActor: 'borrower',
    labelKey: 'borrower_receive',
    hintKey: 'lenderCheckedBorrowerReceive',
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
    to: 'return_approved', // rental: 반입처리 = 최종 승인 (condition check 4단계로 검증 완료)
    purposes: RENTAL,
    requires: 'approve:checkout', // 반입 처리는 기술책임자 전용 (UL-QP-18 직무분리)
    nextActor: 'none',
    labelKey: 'submit_return',
    hintKey: 'checkedOutSubmitReturn',
    auditEventSuffix: 'return_approved',
  },
  {
    from: 'lender_received',
    action: 'reject_return',
    to: 'in_use', // rental: lender 최종 검토 실패 시 borrower가 재반납하도록 사용 상태로 복귀
    purposes: RENTAL,
    requires: 'reject:checkout',
    nextActor: 'borrower',
    labelKey: 'reject_return',
    hintKey: 'returnedRejectReturn',
    auditEventSuffix: 'return_rejected',
  },
  // ── checked_out ───────────────────────────────────────────────────────────
  {
    from: 'checked_out',
    action: 'submit_return',
    to: 'returned',
    purposes: CAL_REPAIR,
    requires: 'approve:checkout', // 반입 처리는 기술책임자 전용 (UL-QP-18 직무분리)
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
    requires: 'approve:checkout', // 반입 처리는 기술책임자 전용 (UL-QP-18 직무분리)
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
    purposes: CAL_REPAIR, // rental은 lender_received에서 submit_return 시 return_approved로 직접 전환
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
  // rental은 condition check 4단계 완료 후 lender_received에서 submit_return 시 return_approved로 직접 전환.
  // lender_received에서 reject_return 시 in_use로 되돌아가 borrower 재반납 루프를 허용한다.
  // 'returned' 중간 상태는 rental 경로에서 제거됨 (cal/repair 전용).
  const rentalPath: CheckoutStatus[] = [
    'pending',
    'borrower_approved',
    'approved',
    'lender_checked',
    'in_use',
    'borrower_returned',
    'lender_received',
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

  // Note: the FSM intentionally has cycles — reject_return sends
  // 'returned' back to 'checked_out' for non-rental, and 'lender_received' back to
  // 'in_use' for rental (equipment re-enters use after failed inspection).
  // A strict DAG invariant is therefore NOT enforced here.
}

// Run at module load — catches misconfiguration at build time
assertFsmInvariants(CHECKOUT_TRANSITIONS);

// ============================================================================
// Derived constants (FSM에서 도출 — 하드코딩 금지)
// ============================================================================

/**
 * Lender TM이 'approve' 액션을 수행할 수 있는 출발 상태 목록.
 *
 * FSM CHECKOUT_TRANSITIONS에서 `requires='approve:checkout'`인 전환의 `from` 상태를
 * 자동으로 수집한다. rental 2-step 등 새 승인 단계 추가 시 자동 반영된다.
 *
 * 현재: ['pending' (cal/repair), 'borrower_approved' (rental 2차)]
 *
 * 소비처: ApprovalsService.getCheckoutCount / getCheckoutKpiQuery (승인 대기 카운트),
 *         approvals-api.ts getPendingOutgoing (승인 대기 목록 조회)
 */
export const LENDER_APPROVAL_PENDING_STATUSES: readonly CheckoutStatus[] = Object.freeze([
  ...new Set(
    CHECKOUT_TRANSITIONS.filter((t) => t.requires === 'approve:checkout').map((t) => t.from)
  ),
] as CheckoutStatus[]);

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
    const map = {
      pending: 1,
      borrower_approved: 2,
      approved: 3,
      // non-rental checkout stage — rental context에서는 발생하지 않으나 exhaustive 요구
      checked_out: 3,
      lender_checked: 4,
      in_use: 5,
      overdue: 5,
      borrower_returned: 6,
      // lender_received·returned는 step 7로 묶음 (관리 측 반입 확인 단계 sub-state)
      lender_received: 7,
      returned: 7,
      return_approved: 8,
      rejected: 1,
      canceled: 1,
    } as const satisfies Record<CheckoutStatus, number>;
    return map[status];
  }
  const map = {
    pending: 1,
    approved: 2,
    checked_out: 3,
    overdue: 3,
    returned: 4,
    return_approved: 5,
    rejected: 1,
    canceled: 1,
    // rental-specific stages — non-rental context에서는 발생하지 않으나 exhaustive 요구
    borrower_approved: 1,
    lender_checked: 3,
    in_use: 3,
    borrower_returned: 4,
    lender_received: 4,
  } as const satisfies Record<CheckoutStatus, number>;
  return map[status];
}

/**
 * Terminal 상태(rejected, canceled)에서 "마지막으로 도달한 step" 복원.
 *
 * 기존 computeStepIndex의 `rejected: 1, canceled: 1` 매핑은 호환성·snapshot 보존을 위해 유지.
 * 이 함수는 `terminatedFromStatus`(reject/cancel 직전 상태)를 활용해 실제 도달 단계를 반환.
 *
 * - 비-terminal 상태: computeStepIndex(status, purpose) 그대로 반환
 * - terminal + terminatedFromStatus 제공: computeStepIndex(terminatedFromStatus, purpose)
 * - terminal + terminatedFromStatus 없음: computeStepIndex(status, purpose) — legacy fallback (=1)
 */
export function computeReachedStepIndex(
  status: CheckoutStatus,
  purpose: CheckoutPurpose,
  terminatedFromStatus?: CheckoutStatus | null
): number {
  if ((status === 'rejected' || status === 'canceled') && terminatedFromStatus) {
    return computeStepIndex(terminatedFromStatus, purpose);
  }
  return computeStepIndex(status, purpose);
}

/**
 * UserRole → ActorVariant 매핑 SSOT.
 *
 * string 타입으로 받아 순환 의존성 회피 (schemas는 UserRoleEnum을 직접 import 하지 않음).
 * 호출자가 UserRole 타입의 값을 string literal로 전달.
 *
 * - test_engineer  → 'requester' (반출 신청·진행 측)
 * - quality_manager / lab_manager → 'approver' (검토·승인 측)
 * - technical_manager → 'receiver' (logistics + lender 양측 활동, 수령·인도 책임)
 * - system_admin → null (특정 본분 없음, availableToCurrentUser 기반 별도 판단)
 * - unknown → null
 */
export function roleToActorVariant(role: string): ActorVariant | null {
  switch (role) {
    case 'test_engineer':
      return 'requester';
    case 'quality_manager':
    case 'lab_manager':
      return 'approver';
    case 'technical_manager':
      return 'receiver';
    default:
      return null;
  }
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
 * Actor team match 검증 결과.
 *
 * - checked=false: ctx 부재 또는 데이터 부재로 검증 스킵 (fail-soft)
 * - checked=true, matched=true: 사용자가 행위자 측 team
 * - checked=true, matched=false: 사용자가 잘못된 측 (예: lender가 borrower_approve 시도)
 */
function actorTeamMatches(
  side: TransitionActorSide,
  ctx?: CheckoutActorContext
): { checked: boolean; matched: boolean } {
  if (!ctx) return { checked: false, matched: true };
  if (side === 'any') return { checked: true, matched: true };
  if (!ctx.userTeamId) return { checked: false, matched: true };

  const targetTeam = side === 'lender' ? ctx.lenderTeamId : ctx.requesterTeamId; // 'borrower' | 'requester'
  if (!targetTeam) return { checked: false, matched: true };

  return { checked: true, matched: ctx.userTeamId === targetTeam };
}

/**
 * Check if a transition action is allowed given the user's permissions
 * and (optionally) actor team identity.
 *
 * Design note: accepts `userPermissions: readonly string[]` instead of UserRole
 * to avoid circular dependency (schemas ← shared-constants ← schemas).
 * Callers bridge: `getPermissions(role)` from @equipment-management/shared-constants.
 *
 * @param actorCtx — 옵셔널. 제공 시 TRANSITION_ACTOR_SIDE 매핑과 userTeamId 일치
 *                   검증. fail-soft (필드 부재 시 스킵). undefined 시 기존 동작 유지.
 */
export function canPerformAction(
  checkout: Pick<{ status: CheckoutStatus; purpose: CheckoutPurpose }, 'status' | 'purpose'>,
  action: CheckoutAction,
  userPermissions: readonly string[],
  actorCtx?: CheckoutActorContext
): { ok: true } | { ok: false; reason: 'invalid_transition' | 'permission' | 'actor_team' } {
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
  const actorCheck = actorTeamMatches(TRANSITION_ACTOR_SIDE[action], actorCtx);
  if (actorCheck.checked && !actorCheck.matched) {
    return { ok: false, reason: 'actor_team' };
  }
  return { ok: true };
}

/**
 * Compute the next step descriptor for a given checkout state.
 *
 * Design note: accepts `userPermissions: readonly string[]` — callers supply
 * `getPermissions(role)` from @equipment-management/shared-constants.
 *
 * @param actorCtx — 옵셔널. 제공 시 transition 후보 중 (1) permission + actor team
 *                   모두 일치하는 것을 우선, (2) permission만 일치하면 actor_team 차단
 *                   사유 표시, (3) permission 없으면 기존 동작.
 */
export function getNextStep(
  checkout: Pick<
    {
      status: CheckoutStatus;
      purpose: CheckoutPurpose;
      dueAt?: string | null;
      terminatedFromStatus?: CheckoutStatus | null;
    },
    'status' | 'purpose' | 'dueAt' | 'terminatedFromStatus'
  >,
  userPermissions: readonly string[],
  actorCtx?: CheckoutActorContext
): NextStepDescriptor {
  const currentStepIndex = computeStepIndex(checkout.status, checkout.purpose);
  const reachedStepIndex = computeReachedStepIndex(
    checkout.status,
    checkout.purpose,
    checkout.terminatedFromStatus
  );
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
      reachedStepIndex,
    };
  }

  const transitions = getTransitionsFor(checkout.status, checkout.purpose);

  // 탈출 액션(cancel/reject 계열): 워크플로우를 종료하는 secondary 액션.
  // 워크플로우 진행 액션(primary)이 있으면 반드시 그것을 descriptor의 nextAction으로 사용해야 함.
  // 탈출 액션이 fullyAvailable이더라도 primary 우선 — 그래야 "누가 이 단계를 처리해야 하는가"
  // 라는 컨텍스트가 UI에 보존됨. 탈출 액션은 availableActions.canCancel 등을 통해 별도 UI로 노출.
  const ESCAPE_ACTIONS = new Set<CheckoutAction>([
    'cancel',
    'reject',
    'reject_return',
    'borrower_reject',
  ]);

  // 우선순위 (4단계):
  // (1) primary: permission + actor team 모두 OK (완전 가용 진행 액션)
  // (2) primary: permission OK, actor team 미스매치 (blockingReason: actor_team으로 컨텍스트 제공)
  // (3) primary: 첫 번째 진행 액션 (blockingReason: permission으로 컨텍스트 제공)
  // (4) escape: 위 3단계 모두 없을 때만 — cancel/reject 허용 (단독 전환 상태 대비)
  const fullyAvailableMain = transitions.find(
    (t) =>
      !ESCAPE_ACTIONS.has(t.action) &&
      userPermissions.includes(t.requires) &&
      actorTeamMatches(TRANSITION_ACTOR_SIDE[t.action], actorCtx).matched
  );
  const permittedOnlyMain = transitions.find(
    (t) => !ESCAPE_ACTIONS.has(t.action) && userPermissions.includes(t.requires)
  );
  const firstMain = transitions.find((t) => !ESCAPE_ACTIONS.has(t.action));
  const fullyAvailableEscape = transitions.find(
    (t) =>
      ESCAPE_ACTIONS.has(t.action) &&
      userPermissions.includes(t.requires) &&
      actorTeamMatches(TRANSITION_ACTOR_SIDE[t.action], actorCtx).matched
  );
  const candidate =
    fullyAvailableMain ?? permittedOnlyMain ?? firstMain ?? fullyAvailableEscape ?? transitions[0];

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
      reachedStepIndex,
    };
  }

  const hasPermission = userPermissions.includes(candidate.requires);
  const actorCheck = actorTeamMatches(TRANSITION_ACTOR_SIDE[candidate.action], actorCtx);
  const available = hasPermission && actorCheck.matched;

  let blockingReason: 'permission' | 'role_mismatch' | 'actor_team' | null = null;
  if (!available) {
    if (!hasPermission) blockingReason = 'permission';
    else if (actorCheck.checked && !actorCheck.matched) blockingReason = 'actor_team';
  }

  return {
    currentStatus: checkout.status,
    currentStepIndex,
    totalSteps,
    nextAction: candidate.action,
    nextActor: candidate.nextActor,
    nextStatus: candidate.to,
    availableToCurrentUser: available,
    blockingReason,
    labelKey: candidate.labelKey,
    hintKey: candidate.hintKey,
    urgency,
    nextStepIndex: Math.min(currentStepIndex + 1, totalSteps),
    phase,
    phaseIndex,
    totalPhases,
    reachedStepIndex,
  };
}
