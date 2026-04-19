import { CheckoutStatusValues, type CheckoutStatus } from '@equipment-management/schemas';

// 반출 사실이 존재하지 않거나 취소된 상태 — 확인서(UL-QP-18-06) export 불가
export const NON_EXPORTABLE_CHECKOUT_STATUSES: readonly CheckoutStatus[] = [
  CheckoutStatusValues.PENDING,
  CheckoutStatusValues.REJECTED,
  CheckoutStatusValues.CANCELED,
] as const;

export function isCheckoutExportable(status: CheckoutStatus): boolean {
  return !NON_EXPORTABLE_CHECKOUT_STATUSES.includes(status);
}
