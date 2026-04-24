import type { CheckoutStatus, CheckoutPurpose } from '../enums/checkout';

export const RENTAL_PHASES = ['approve', 'handover', 'return'] as const;
export type RentalPhase = (typeof RENTAL_PHASES)[number];

/**
 * Rental 상태 → Phase 매핑.
 *
 * `satisfies Record<CheckoutStatus, RentalPhase | null>` 강제:
 * 새 CheckoutStatus 추가 시 이 테이블에 항목을 추가하지 않으면 컴파일 에러 발생.
 * non-rental 전용 상태(checked_out) 및 terminal 상태(rejected, canceled)는 null.
 */
export const RENTAL_STATUS_TO_PHASE = {
  pending: 'approve',
  borrower_approved: 'approve',
  approved: 'approve',
  lender_checked: 'handover',
  borrower_received: 'handover',
  in_use: 'return',
  overdue: 'return',
  borrower_returned: 'return',
  lender_received: 'return',
  returned: 'return',
  return_approved: 'return',
  rejected: null,
  canceled: null,
  checked_out: null,
} as const satisfies Record<CheckoutStatus, RentalPhase | null>;

/**
 * Phase별 단계 수 (rental 8-step 기준 분배).
 * approve: pending(1)·borrower_approved(2)·approved(3) = 3
 * handover: lender_checked(4)·borrower_received(5) = 2
 * return: in_use(6)·borrower_returned(7)·lender_received~return_approved(8) = 3
 */
export const PHASE_STEP_COUNT = {
  approve: 3,
  handover: 2,
  return: 3,
} as const satisfies Record<RentalPhase, number>;

/**
 * Phase i18n key — Sprint 4.4 UI `CheckoutPhaseIndicator`가 소비.
 * 키: `checkouts.{value}`으로 접근.
 */
export const RENTAL_PHASE_I18N_KEY = {
  approve: 'rentalPhase.approve.label',
  handover: 'rentalPhase.handover.label',
  return: 'rentalPhase.return.label',
} as const satisfies Record<RentalPhase, string>;

const PHASE_TO_INDEX = {
  approve: 0,
  handover: 1,
  return: 2,
} as const satisfies Record<RentalPhase, number>;

/**
 * 주어진 상태의 RentalPhase를 반환.
 * purpose가 'rental'이 아니면 항상 null.
 */
export function getRentalPhase(
  status: CheckoutStatus,
  purpose: CheckoutPurpose
): RentalPhase | null {
  if (purpose !== 'rental') return null;
  return RENTAL_STATUS_TO_PHASE[status];
}

/**
 * Phase 순서 인덱스: approve=0, handover=1, return=2.
 * non-rental 또는 phase가 없는 상태(rejected, canceled)는 null.
 */
export function getPhaseIndex(status: CheckoutStatus, purpose: CheckoutPurpose): number | null {
  const phase = getRentalPhase(status, purpose);
  if (phase === null) return null;
  return PHASE_TO_INDEX[phase];
}

/** 해당 phase의 step 수를 반환. */
export function getStepsInPhase(phase: RentalPhase): number {
  return PHASE_STEP_COUNT[phase];
}

// Compile-time exhaustiveness guard — negative test.
// 누락된 CheckoutStatus 키가 있으면 satisfies 제약이 컴파일 에러를 발생시킴을 증명.
// 새 CheckoutStatus 추가 후 RENTAL_STATUS_TO_PHASE 미갱신 시 동일 에러 발생.
// @ts-expect-error — { pending: 'approve' } 는 나머지 13개 CheckoutStatus 키가 없어 타입 에러
void ({ pending: 'approve' } as const satisfies Record<CheckoutStatus, RentalPhase | null>);
