import { z } from 'zod';
import { CheckoutStatusEnum, CheckoutStatus, CheckoutPurposeEnum, CheckoutPurpose } from './enums';

/**
 * ✅ Single Source of Truth 준수
 * CheckoutStatusEnum과 CheckoutPurposeEnum은 enums.ts에서 import하여 사용
 */

// 반출 스키마
export const CheckoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  approverId: z.string().uuid().optional(),
  destinationName: z.string(),
  destinationAddress: z.string(),
  destinationContact: z.string(),
  purpose: CheckoutPurposeEnum,
  startDate: z.string().or(z.date()),
  expectedEndDate: z.string().or(z.date()),
  actualEndDate: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
  status: CheckoutStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
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
