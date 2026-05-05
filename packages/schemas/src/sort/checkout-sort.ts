import { z } from 'zod';
import { buildSortEnum } from './_shared';

/**
 * 반출(Checkout) sort 필드 SSOT — 인덱스 보유 컬럼 + service 매핑 미러.
 * 기존 `checkouts.service.ts` `INDEXED_FIELDS`와 정확히 일치.
 */
export const CHECKOUT_SORT_FIELDS = [
  'createdAt',
  'checkoutDate',
  'expectedReturnDate',
  'status',
  'requesterId',
  'approverId',
] as const;

export type CheckoutSortField = (typeof CHECKOUT_SORT_FIELDS)[number];

export const CheckoutSortEnum = buildSortEnum(CHECKOUT_SORT_FIELDS);
export type CheckoutSortValue = z.infer<typeof CheckoutSortEnum>;
