import type { CheckoutAction } from '@equipment-management/schemas';
import { CHECKOUT_TOAST_TOKENS, type CheckoutToastSeverity } from '@/lib/design-tokens';

export type CheckoutToastFn = (opts: {
  title: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive';
}) => void;

export type CheckoutToastContext = {
  equipmentName: string;
  dueAt?: string;
};

export type CheckoutToastTranslate = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

type ActionKey = 'approve' | 'reject' | 'start' | 'return' | 'approveReturn';

const ACTION_KEY_MAP: Partial<Record<CheckoutAction, ActionKey>> = {
  approve: 'approve',
  reject: 'reject',
  start: 'start',
  submit_return: 'return',
  borrower_return: 'return',
  approve_return: 'approveReturn',
};

export function notifyCheckoutAction(
  toastFn: CheckoutToastFn,
  action: CheckoutAction,
  ctx: CheckoutToastContext,
  t: CheckoutToastTranslate,
  severity: CheckoutToastSeverity = 'success'
): void {
  const actionKey = ACTION_KEY_MAP[action];
  if (!actionKey) return;

  const title = t(`toast.${actionKey}.success`, { equipmentName: ctx.equipmentName });
  toastFn({
    title,
    duration: CHECKOUT_TOAST_TOKENS.duration[severity],
  });
}
