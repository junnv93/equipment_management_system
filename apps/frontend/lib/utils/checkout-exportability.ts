import { CheckoutStatusValues, type CheckoutStatus } from '@equipment-management/schemas';

// 반출 사실이 존재하지 않는 상태 — 확인서(UL-QP-18-06) 데이터가 없으므로 export 불가
export const NON_EXPORTABLE_CHECKOUT_STATUSES: readonly CheckoutStatus[] = [
  CheckoutStatusValues.PENDING,
  CheckoutStatusValues.REJECTED,
] as const;

export function isCheckoutExportable(status: CheckoutStatus): boolean {
  return !NON_EXPORTABLE_CHECKOUT_STATUSES.includes(status);
}
