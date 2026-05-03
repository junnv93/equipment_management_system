import { CheckoutStatusValues as CSVal, type CheckoutStatus } from './enums';

/**
 * Checkout display step sequences.
 *
 * Domain-level step order lives with the checkout FSM helpers so UI timelines and
 * `computeStepIndex` consume the same package-level source.
 */
export const CHECKOUT_DISPLAY_STEPS: {
  readonly nonRental: readonly CheckoutStatus[];
  readonly rental: readonly CheckoutStatus[];
} = {
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
    CSVal.IN_USE,
    CSVal.BORROWER_RETURNED,
    CSVal.LENDER_RECEIVED,
    CSVal.RETURN_APPROVED,
  ],
} as const;

// FSM invariant guard — step count drift must fail fast in tests/builds.
if (CHECKOUT_DISPLAY_STEPS.nonRental.length !== 5 || CHECKOUT_DISPLAY_STEPS.rental.length !== 8) {
  throw new Error(
    `[FSM invariant] CHECKOUT_DISPLAY_STEPS length mismatch — nonRental=${CHECKOUT_DISPLAY_STEPS.nonRental.length}(expected 5), rental=${CHECKOUT_DISPLAY_STEPS.rental.length}(expected 8)`
  );
}
