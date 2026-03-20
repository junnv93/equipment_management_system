import { z } from 'zod';
import { CheckoutStatusEnum, CheckoutStatus, CheckoutPurposeEnum, CheckoutPurpose } from './enums';

/**
 * ✅ Single Source of Truth 준수
 * CheckoutStatusEnum과 CheckoutPurposeEnum은 enums.ts에서 import하여 사용
 */

// 반출 스키마 (DB: checkouts 테이블 필드명과 일치)
export const CheckoutSchema = z.object({
  id: z.string().uuid(),
  requesterId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
  destination: z.string(),
  purpose: CheckoutPurposeEnum,
  reason: z.string(),
  checkoutDate: z.coerce.date().nullable().optional(),
  expectedReturnDate: z.coerce.date(),
  actualReturnDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
  status: CheckoutStatusEnum,
  version: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Checkout = z.infer<typeof CheckoutSchema>;

// 반출 장비 스키마
export const CheckoutEquipmentSchema = z.object({
  id: z.string().uuid(),
  checkoutId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CheckoutEquipment = z.infer<typeof CheckoutEquipmentSchema>;

// 반출 목록 응답 인터페이스
export interface CheckoutListResponse {
  items: Checkout[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
