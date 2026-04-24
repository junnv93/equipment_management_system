/**
 * Checkout Toast Tokens
 *
 * SSOT for toast display duration across all checkout mutations.
 * success < warning < error — severity scales with urgency and user recovery time needed.
 */
export const CHECKOUT_TOAST_TOKENS = {
  duration: {
    success: 4000,
    warning: 6000,
    error: 8000,
  },
} as const;

export type CheckoutToastSeverity = keyof typeof CHECKOUT_TOAST_TOKENS.duration;
